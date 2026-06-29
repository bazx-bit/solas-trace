use axum::{
    body::Body,
    extract::State,
    http::{HeaderMap, Method, Request, Response, StatusCode},
    response::IntoResponse,
};
use bytes::Bytes;
use http_body_util::BodyExt;
use reqwest::Client;
use serde_json::Value;
use sqlx::SqlitePool;
use std::sync::Arc;
use tokio::time::Instant;
use tracing::{error, info};
use uuid::Uuid;
use chrono::Utc;

pub struct AppState {
    pub db: SqlitePool,
    pub http_client: Client,
}

// 1. OpenAI Proxy Handler (forwards to api.openai.com)
pub async fn openai_proxy_handler(
    State(state): State<Arc<AppState>>,
    method: Method,
    headers: HeaderMap,
    mut req: Request<Body>,
) -> Response<Body> {
    let start_time = Utc::now();
    let start_instant = Instant::now();
    
    let trace_id = headers
        .get("x-trace-id")
        .and_then(|h| h.to_str().ok())
        .map(|s| s.to_string())
        .unwrap_or_else(|| Uuid::new_v4().to_string());

    let parent_span_id = headers
        .get("x-span-id")
        .and_then(|h| h.to_str().ok())
        .map(|s| s.to_string());

    let span_id = Uuid::new_v4().to_string();

    let body_bytes = match req.into_body().collect().await {
        Ok(collected) => collected.to_bytes(),
        Err(err) => {
            error!("Failed to read request body: {}", err);
            return (StatusCode::BAD_REQUEST, "Failed to read request body").into_response();
        }
    };

    let body_json: Option<Value> = serde_json::from_slice(&body_bytes).ok();
    let model = body_json
        .as_ref()
        .and_then(|v| v.get("model"))
        .and_then(|m| m.as_str())
        .unwrap_or("gpt-4o-mini")
        .to_string();

    let target_url = "https://api.openai.com/v1/chat/completions";
    info!("Proxying OpenAI request to {} (Model: {})", target_url, model);

    let mut forward_req = state.http_client.request(method.clone(), target_url);

    for (key, value) in headers.iter() {
        if key != "host" {
            forward_req = forward_req.header(key.clone(), value.clone());
        }
    }

    let forward_req = forward_req.body(body_bytes.clone());

    let forward_res = match forward_req.send().await {
        Ok(res) => res,
        Err(err) => {
            error!("Failed to forward request to OpenAI: {}", err);
            return (StatusCode::BAD_GATEWAY, format!("Gateway error: {}", err)).into_response();
        }
    };

    let status = forward_res.status();
    let mut res_headers = HeaderMap::new();
    for (k, v) in forward_res.headers().iter() {
        res_headers.insert(k.clone(), v.clone());
    }

    let is_streaming = res_headers
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.contains("text/event-stream"))
        .unwrap_or(false);

    if is_streaming {
        let db_clone = state.db.clone();
        let trace_id_clone = trace_id.clone();
        let span_id_clone = span_id.clone();
        let parent_span_id_clone = parent_span_id.clone();
        let model_clone = model.clone();
        
        tokio::spawn(async move {
            let end_time = Utc::now();
            save_trace_and_span(
                &db_clone,
                &trace_id_clone,
                &span_id_clone,
                parent_span_id_clone.as_deref(),
                "chat_completion",
                &model_clone,
                &serde_json::to_string(&body_json).unwrap_or_default(),
                "Streaming response (completed)",
                0.0,
                0,
                0,
                &start_time.to_rfc3339(),
                &end_time.to_rfc3339(),
            )
            .await;
        });

        let body = Body::from_stream(forward_res.bytes_stream());
        return (status, res_headers, body).into_response();
    }

    let res_bytes = match forward_res.bytes().await {
        Ok(b) => b,
        Err(err) => {
            error!("Failed to read response bytes: {}", err);
            return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to read response").into_response();
        }
    };

    let res_json: Option<Value> = serde_json::from_slice(&res_bytes).ok();
    
    let mut prompt_tokens = 0;
    let mut completion_tokens = 0;
    if let Some(ref r_json) = res_json {
        if let Some(usage) = r_json.get("usage") {
            prompt_tokens = usage.get("prompt_tokens").and_then(|t| t.as_i64()).unwrap_or(0) as i32;
            completion_tokens = usage.get("completion_tokens").and_then(|t| t.as_i64()).unwrap_or(0) as i32;
        }
    }

    let cost = (prompt_tokens as f64 * 0.0000025) + (completion_tokens as f64 * 0.000010);
    let end_time = Utc::now();
    
    let db_clone = state.db.clone();
    let trace_id_clone = trace_id.clone();
    let span_id_clone = span_id.clone();
    let parent_span_id_clone = parent_span_id.clone();
    let model_clone = model.clone();
    let body_json_str = serde_json::to_string(&body_json).unwrap_or_default();
    let res_json_str = serde_json::to_string(&res_json).unwrap_or_default();

    tokio::spawn(async move {
        save_trace_and_span(
            &db_clone,
            &trace_id_clone,
            &span_id_clone,
            parent_span_id_clone.as_deref(),
            "chat_completion",
            &model_clone,
            &body_json_str,
            &res_json_str,
            cost,
            prompt_tokens,
            completion_tokens,
            &start_time.to_rfc3339(),
            &end_time.to_rfc3339(),
        )
        .await;
    });

    (status, res_headers, Bytes::from(res_bytes)).into_response()
}

// 2. Anthropic Proxy Handler (forwards to api.anthropic.com/v1/messages)
pub async fn anthropic_proxy_handler(
    State(state): State<Arc<AppState>>,
    method: Method,
    headers: HeaderMap,
    mut req: Request<Body>,
) -> Response<Body> {
    let start_time = Utc::now();
    
    let trace_id = headers
        .get("x-trace-id")
        .and_then(|h| h.to_str().ok())
        .map(|s| s.to_string())
        .unwrap_or_else(|| Uuid::new_v4().to_string());

    let parent_span_id = headers
        .get("x-span-id")
        .and_then(|h| h.to_str().ok())
        .map(|s| s.to_string());

    let span_id = Uuid::new_v4().to_string();

    let body_bytes = match req.into_body().collect().await {
        Ok(collected) => collected.to_bytes(),
        Err(err) => {
            error!("Failed to read request body: {}", err);
            return (StatusCode::BAD_REQUEST, "Failed to read request body").into_response();
        }
    };

    let body_json: Option<Value> = serde_json::from_slice(&body_bytes).ok();
    let model = body_json
        .as_ref()
        .and_then(|v| v.get("model"))
        .and_then(|m| m.as_str())
        .unwrap_or("claude-3-5-sonnet")
        .to_string();

    let target_url = "https://api.anthropic.com/v1/messages";
    info!("Proxying Anthropic request to {} (Model: {})", target_url, model);

    let mut forward_req = state.http_client.request(method.clone(), target_url);

    for (key, value) in headers.iter() {
        if key != "host" {
            forward_req = forward_req.header(key.clone(), value.clone());
        }
    }

    let forward_req = forward_req.body(body_bytes.clone());

    let forward_res = match forward_req.send().await {
        Ok(res) => res,
        Err(err) => {
            error!("Failed to forward request to Anthropic: {}", err);
            return (StatusCode::BAD_GATEWAY, format!("Gateway error: {}", err)).into_response();
        }
    };

    let status = forward_res.status();
    let mut res_headers = HeaderMap::new();
    for (k, v) in forward_res.headers().iter() {
        res_headers.insert(k.clone(), v.clone());
    }

    let res_bytes = match forward_res.bytes().await {
        Ok(b) => b,
        Err(err) => {
            error!("Failed to read response bytes: {}", err);
            return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to read response").into_response();
        }
    };

    let res_json: Option<Value> = serde_json::from_slice(&res_bytes).ok();
    
    // Parse Anthropic usage
    let mut prompt_tokens = 0;
    let mut completion_tokens = 0;
    if let Some(ref r_json) = res_json {
        if let Some(usage) = r_json.get("usage") {
            prompt_tokens = usage.get("input_tokens").and_then(|t| t.as_i64()).unwrap_or(0) as i32;
            completion_tokens = usage.get("output_tokens").and_then(|t| t.as_i64()).unwrap_or(0) as i32;
        }
    }

    // Anthropic pricing approximation (e.g. $3/M input, $15/M output for Sonnet)
    let cost = (prompt_tokens as f64 * 0.0000030) + (completion_tokens as f64 * 0.0000150);
    let end_time = Utc::now();
    
    let db_clone = state.db.clone();
    let trace_id_clone = trace_id.clone();
    let span_id_clone = span_id.clone();
    let parent_span_id_clone = parent_span_id.clone();
    let model_clone = model.clone();
    
    // Convert anthropic text content block to standard string for database preview
    let output_text = res_json.as_ref()
        .and_then(|r| r.get("content"))
        .and_then(|c| c.as_array())
        .and_then(|arr| arr.get(0))
        .and_then(|obj| obj.get("text"))
        .and_then(|t| t.as_str())
        .unwrap_or("No content block received")
        .to_string();

    let body_json_str = serde_json::to_string(&body_json).unwrap_or_default();

    tokio::spawn(async move {
        save_trace_and_span(
            &db_clone,
            &trace_id_clone,
            &span_id_clone,
            parent_span_id_clone.as_deref(),
            "messages",
            &model_clone,
            &body_json_str,
            &output_text,
            cost,
            prompt_tokens,
            completion_tokens,
            &start_time.to_rfc3339(),
            &end_time.to_rfc3339(),
        )
        .await;
    });

    (status, res_headers, Bytes::from(res_bytes)).into_response()
}

async fn save_trace_and_span(
    db: &SqlitePool,
    trace_id: &str,
    span_id: &str,
    parent_span_id: Option<&str>,
    span_name: &str,
    model: &str,
    input: &str,
    output: &str,
    cost: f64,
    input_tokens: i32,
    output_tokens: i32,
    start_time: &str,
    end_time: &str,
) {
    let trace_exists: (i64,) = match sqlx::query_as("SELECT COUNT(*) FROM traces WHERE trace_id = ?")
        .bind(trace_id)
        .fetch_one(db)
        .await
    {
        Ok(val) => val,
        Err(_) => (0,),
    };

    if trace_exists.0 == 0 {
        let name = format!("Proxy Run - {}", model);
        let _ = sqlx::query(
            "INSERT INTO traces (trace_id, name, start_time, end_time, status) VALUES (?, ?, ?, ?, 'OK')"
        )
        .bind(trace_id)
        .bind(name)
        .bind(start_time)
        .bind(end_time)
        .execute(db)
        .await;
    } else {
        let _ = sqlx::query(
            "UPDATE traces SET total_cost = total_cost + ?, end_time = ? WHERE trace_id = ?"
        )
        .bind(cost)
        .bind(end_time)
        .bind(trace_id)
        .execute(db)
        .await;
    }

    let _ = sqlx::query(
        "INSERT INTO spans (span_id, trace_id, parent_span_id, name, span_kind, start_time, end_time, model, cost, input_tokens, output_tokens, input, output, status) 
         VALUES (?, ?, ?, ?, 'LLM', ?, ?, ?, ?, ?, ?, ?, ?, 'OK')"
    )
    .bind(span_id)
    .bind(trace_id)
    .bind(parent_span_id)
    .bind(span_name)
    .bind(start_time)
    .bind(end_time)
    .bind(model)
    .bind(cost)
    .bind(input_tokens)
    .bind(output_tokens)
    .bind(input)
    .bind(output)
    .execute(db)
    .await;
}
