use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use std::fs;
use std::path::Path;
use tracing::info;

pub async fn init_db(db_url: &str) -> SqlitePool {
    // Ensure the parent directory exists if using a file path
    if db_url.starts_with("sqlite://") {
        let path_str = db_url.trim_start_matches("sqlite://");
        if path_str != ":memory:" {
            if let Some(parent) = Path::new(path_str).parent() {
                fs::create_dir_all(parent).ok();
            }
        }
    }

    info!("Initializing SQLite database: {}", db_url);
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(db_url)
        .await
        .expect("Failed to connect to SQLite");

    // Run migrations / create tables
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS traces (
            trace_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT,
            input TEXT,
            output TEXT,
            total_cost REAL DEFAULT 0.0,
            status TEXT DEFAULT 'OK'
        );"
    )
    .execute(&pool)
    .await
    .expect("Failed to create traces table");

    sqlx::query(
        "ALTER TABLE traces ADD COLUMN rca_report TEXT;"
    )
    .execute(&pool)
    .await
    .ok();

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS spans (
            span_id TEXT PRIMARY KEY,
            trace_id TEXT NOT NULL,
            parent_span_id TEXT,
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
    )
    .execute(&pool)
    .await
    .expect("Failed to create spans table");

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS detector_findings (
            finding_id TEXT PRIMARY KEY,
            trace_id TEXT NOT NULL,
            detector_name TEXT NOT NULL,
            summary TEXT NOT NULL,
            payload TEXT,
            timestamp TEXT NOT NULL,
            FOREIGN KEY(trace_id) REFERENCES traces(trace_id)
        );"
    )
    .execute(&pool)
    .await
    .expect("Failed to create detector_findings table");

    info!("Database initialization complete.");
    pool
}
