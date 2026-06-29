use sqlx::{any::AnyPoolOptions, AnyPool};
use std::fs;
use std::path::Path;
use tracing::{info, error};
use reqwest::Client;
use serde_json::json;

pub async fn init_db(db_url: &str) -> AnyPool {
    // Install the database drivers
    sqlx::any::install_default_drivers();

    if db_url.starts_with("sqlite://") {
        let path_str = db_url.trim_start_matches("sqlite://");
        if path_str != ":memory:" {
            if let Some(parent) = Path::new(path_str).parent() {
                fs::create_dir_all(parent).ok();
            }
        }
    }

    info!("Initializing Solas Trace database (AnyPool): {}", db_url);
    let pool = AnyPoolOptions::new()
        .max_connections(10)
        .connect(db_url)
        .await
        .expect("Failed to connect to metadata database (SQLite/PostgreSQL)");

    // Run core migrations on metadata database
    // We make sure it supports both SQLite and Postgres schemas
    let is_postgres = db_url.starts_with("postgresql://") || db_url.starts_with("postgres://");

    let create_traces_sql = if is_postgres {
        "CREATE TABLE IF NOT EXISTS traces (
            trace_id VARCHAR PRIMARY KEY,
            project_id VARCHAR NOT NULL DEFAULT 'proj_solas',
            name VARCHAR NOT NULL,
            start_time VARCHAR NOT NULL,
            end_time VARCHAR,
            input TEXT,
            output TEXT,
            total_cost DOUBLE PRECISION DEFAULT 0.0,
            status VARCHAR DEFAULT 'OK',
            rca_report TEXT
        );"
    } else {
        "CREATE TABLE IF NOT EXISTS traces (
            trace_id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL DEFAULT 'proj_solas',
            name TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT,
            input TEXT,
            output TEXT,
            total_cost REAL DEFAULT 0.0,
            status TEXT DEFAULT 'OK',
            rca_report TEXT
        );"
    };

    sqlx::query(create_traces_sql)
        .execute(&pool)
        .await
        .expect("Failed to create traces table");

    let create_spans_sql = if is_postgres {
        "CREATE TABLE IF NOT EXISTS spans (
            span_id VARCHAR PRIMARY KEY,
            trace_id VARCHAR NOT NULL,
            parent_span_id VARCHAR,
            project_id VARCHAR NOT NULL DEFAULT 'proj_solas',
            name VARCHAR NOT NULL,
            span_kind VARCHAR NOT NULL,
            start_time VARCHAR NOT NULL,
            end_time VARCHAR,
            model VARCHAR,
            cost DOUBLE PRECISION DEFAULT 0.0,
            input_tokens INTEGER DEFAULT 0,
            output_tokens INTEGER DEFAULT 0,
            input TEXT,
            output TEXT,
            status VARCHAR DEFAULT 'OK',
            status_message TEXT
        );"
    } else {
        "CREATE TABLE IF NOT EXISTS spans (
            span_id TEXT PRIMARY KEY,
            trace_id TEXT NOT NULL,
            parent_span_id TEXT,
            project_id TEXT NOT NULL DEFAULT 'proj_solas',
            name TEXT NOT NULL,
            span_kind TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT,
            model TEXT,
            cost REAL DEFAULT 0.0,
            input_tokens INTEGER DEFAULT 0,
            output_tokens INTEGER DEFAULT 0,
            input TEXT,
            output TEXT,
            status TEXT DEFAULT 'OK',
            status_message TEXT,
            FOREIGN KEY(trace_id) REFERENCES traces(trace_id)
        );"
    };

    sqlx::query(create_spans_sql)
        .execute(&pool)
        .await
        .expect("Failed to create spans table");

    let create_findings_sql = if is_postgres {
        "CREATE TABLE IF NOT EXISTS detector_findings (
            finding_id VARCHAR PRIMARY KEY,
            trace_id VARCHAR NOT NULL,
            project_id VARCHAR NOT NULL DEFAULT 'proj_solas',
            detector_name VARCHAR NOT NULL,
            summary VARCHAR NOT NULL,
            payload TEXT,
            timestamp VARCHAR NOT NULL
        );"
    } else {
        "CREATE TABLE IF NOT EXISTS detector_findings (
            finding_id TEXT PRIMARY KEY,
            trace_id TEXT NOT NULL,
            project_id TEXT NOT NULL DEFAULT 'proj_solas',
            detector_name TEXT NOT NULL,
            summary TEXT NOT NULL,
            payload TEXT,
            timestamp TEXT NOT NULL,
            FOREIGN KEY(trace_id) REFERENCES traces(trace_id)
        );"
    };

    sqlx::query(create_findings_sql)
        .execute(&pool)
        .await
        .expect("Failed to create detector_findings table");

    info!("Metadata database setup completed successfully.");
    pool
}

// ClickHouse HTTP API Client helper
pub async fn save_to_clickhouse(
    client: &Client,
    table: &str,
    row: serde_json::Value,
) {
    let ch_url = std::env::var("CLICKHOUSE_URL").unwrap_or_else(|_| "http://localhost:8124/solas".to_string());
    // Parse user/pass from URL if present
    // standard ClickHouse HTTP insert endpoint: /?query=INSERT INTO <table> FORMAT JSONEachRow
    let url = format!("{}?query=INSERT INTO {} FORMAT JSONEachRow", ch_url, table);

    let payload = serde_json::to_string(&row).unwrap_or_default();
    
    match client.post(&url)
        .body(payload)
        .send()
        .await
    {
        Ok(res) => {
            if !res.status().is_success() {
                let err_text = res.text().await.unwrap_or_default();
                error!("ClickHouse insertion error response: {}", err_text);
            }
        }
        Err(e) => {
            error!("Failed to post tracing data to ClickHouse: {}", e);
        }
    }
}
