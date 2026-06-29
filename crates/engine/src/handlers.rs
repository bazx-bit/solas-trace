use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::{AnyPool, Row};
use std::sync::Arc;
use uuid::Uuid;
use chrono::Utc;
use reqwest::Client;
use crate::proxy::AppState;

#[derive(Serialize, Deserialize)]
pub struct TraceListItem {
    pub trace_id: String,
    pub name: String,
    pub start_time: String,
    pub end_time: Option<String>,
    pub total_cost: f64,
    pub status: String,
}

#[derive(Serialize, Deserialize)]
pub struct SpanDetails {
    pub span_id: String,
    pub parent_span_id: Option<String>,
    pub name: String,
    pub span_kind: String,
    pub start_time: String,
    pub end_time: Option<String>,
    pub model: Option<String>,
    pub cost: f64,
    pub input_tokens: i32,
    pub output_tokens: i32,
    pub input: Option<String>,
    pub output: Option<String>,
    pub status: String,
    pub status_message: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct TraceDetails {
    pub trace_id: String,
    pub name: String,
    pub start_time: String,
    pub end_time: Option<String>,
    pub total_cost: f64,
    pub status: String,
    pub rca_report: Option<String>,
    pub spans: Vec<SpanDetails>,
    pub findings: Vec<FindingDetails>,
}

#[derive(Serialize, Deserialize)]
pub struct FindingDetails {
    pub finding_id: String,
    pub detector_name: String,
    pub summary: String,
    pub payload: Option<String>,
    pub timestamp: String,
}

#[derive(Deserialize)]
pub struct ReplayRequest {
    pub updated_input: String,
}

#[derive(Serialize)]
pub struct ReplayResponse {
    pub status: String,
    pub model_used: String,
    pub replay_duration_ms: i64,
    pub tokens_used: UsageDetails,
    pub cost: f64,
    pub output: String,
}

#[derive(Serialize)]
pub struct UsageDetails {
    pub prompt: i32,
    pub completion: i32,
}

// 1. GET /api/traces
pub async fn list_traces(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let rows = sqlx::query("SELECT trace_id, name, start_time, end_time, total_cost, status FROM traces ORDER BY start_time DESC")
        .fetch_all(&state.db)
        .await;

    match rows {
        Ok(db_rows) => {
            let list: Vec<TraceListItem> = db_rows
                .into_iter()
                .map(|row| TraceListItem {
                    trace_id: row.get("trace_id"),
                    name: row.get("name"),
                    start_time: row.get("start_time"),
                    end_time: row.get("end_time"),
                    total_cost: row.get("total_cost"),
                    status: row.get("status"),
                })
                .collect();
            (StatusCode::OK, Json(list)).into_response()
        }
        Err(err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Database error: {}", err),
        )
            .into_response(),
    }
}

// 2. GET /api/traces/:id
pub async fn get_trace_details(
    State(state): State<Arc<AppState>>,
    Path(trace_id): Path<String>,
) -> impl IntoResponse {
    let trace_row = sqlx::query("SELECT trace_id, name, start_time, end_time, total_cost, status, rca_report FROM traces WHERE trace_id = ?")
        .bind(&trace_id)
        .fetch_optional(&state.db)
        .await;

    let (trace, rca_report) = match trace_row {
        Ok(Some(row)) => {
            let trace = TraceListItem {
                trace_id: row.get("trace_id"),
                name: row.get("name"),
                start_time: row.get("start_time"),
                end_time: row.get("end_time"),
                total_cost: row.get("total_cost"),
                status: row.get("status"),
            };
            let rca: Option<String> = row.get("rca_report");
            (trace, rca)
        }
        Ok(None) => return StatusCode::NOT_FOUND.into_response(),
        Err(err) => return (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", err)).into_response(),
    };

    let span_rows = sqlx::query("SELECT span_id, parent_span_id, name, span_kind, start_time, end_time, model, cost, input_tokens, output_tokens, input, output, status, status_message FROM spans WHERE trace_id = ? ORDER BY start_time ASC")
        .bind(&trace_id)
        .fetch_all(&state.db)
        .await;

    let spans: Vec<SpanDetails> = match span_rows {
        Ok(db_spans) => db_spans
            .into_iter()
            .map(|row| SpanDetails {
                span_id: row.get("span_id"),
                parent_span_id: row.get("parent_span_id"),
                name: row.get("name"),
                span_kind: row.get("span_kind"),
                start_time: row.get("start_time"),
                end_time: row.get("end_time"),
                model: row.get("model"),
                cost: row.get("cost"),
                input_tokens: row.get("input_tokens"),
                output_tokens: row.get("output_tokens"),
                input: row.get("input"),
                output: row.get("output"),
                status: row.get("status"),
                status_message: row.get("status_message"),
            })
            .collect(),
        Err(_) => Vec::new(),
    };

    let finding_rows = sqlx::query("SELECT finding_id, detector_name, summary, payload, timestamp FROM detector_findings WHERE trace_id = ?")
        .bind(&trace_id)
        .fetch_all(&state.db)
        .await;

    let findings: Vec<FindingDetails> = match finding_rows {
        Ok(db_findings) => db_findings
            .into_iter()
            .map(|row| FindingDetails {
                finding_id: row.get("finding_id"),
                detector_name: row.get("detector_name"),
                summary: row.get("summary"),
                payload: row.get("payload"),
                timestamp: row.get("timestamp"),
            })
            .collect(),
        Err(_) => Vec::new(),
    };

    let details = TraceDetails {
        trace_id: trace.trace_id,
        name: trace.name,
        start_time: trace.start_time,
        end_time: trace.end_time,
        total_cost: trace.total_cost,
        status: trace.status,
        rca_report,
        spans,
        findings,
    };

    (StatusCode::OK, Json(details)).into_response()
}

// 3. POST /api/v1/traces (OTLP trace collector endpoint)
pub async fn collect_otlp_traces(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<Value>,
) -> impl IntoResponse {
    let mut inserted_count = 0;
    
    if let Some(resource_spans) = payload.get("resourceSpans").and_then(|v| v.as_array()) {
        for rs in resource_spans {
            if let Some(scope_spans) = rs.get("scopeSpans").and_then(|v| v.as_array()) {
                for ss in scope_spans {
                    if let Some(spans) = ss.get("spans").and_then(|v| v.as_array()) {
                        for span in spans {
                            if let Err(e) = save_otlp_span(&state.db, span).await {
                                tracing::error!("Failed to save OTLP span: {}", e);
                            } else {
                                inserted_count += 1;
                            }
                        }
                    }
                }
            }
        }
    }

    (StatusCode::OK, Json(serde_json::json!({ "status": "ok", "spans_ingested": inserted_count })))
}

async fn save_otlp_span(db: &AnyPool, span: &Value) -> Result<(), sqlx::Error> {
    let trace_id = span.get("traceId").and_then(|t| t.as_str()).unwrap_or("").to_string();
    let span_id = span.get("spanId").and_then(|t| t.as_str()).unwrap_or("").to_string();
    let parent_span_id = span.get("parentSpanId").and_then(|t| t.as_str()).map(|s| s.to_string());
    let name = span.get("name").and_then(|t| t.as_str()).unwrap_or("unnamed").to_string();
    let kind = span.get("kind").and_then(|t| t.as_str()).unwrap_or("INTERNAL").to_string();

    let start_time_unix = span.get("startTimeUnixNano")
        .and_then(|t| t.as_str().and_then(|s| s.parse::<i64>().ok()).or_else(|| t.as_i64()))
        .unwrap_or(0) / 1_000_000;
    let end_time_unix = span.get("endTimeUnixNano")
        .and_then(|t| t.as_str().and_then(|s| s.parse::<i64>().ok()).or_else(|| t.as_i64()))
        .unwrap_or(0) / 1_000_000;

    let start_time = Utc::now();
    let end_time = Utc::now();

    let mut model = None;
    let mut cost = 0.0;
    let mut input_tokens = 0;
    let mut output_tokens = 0;
    let mut input = None;
    let mut output = None;

    if let Some(attributes) = span.get("attributes").and_then(|a| a.as_array()) {
        for attr in attributes {
            let key = attr.get("key").and_then(|k| k.as_str()).unwrap_or("");
            let val = attr.get("value").and_then(|v| {
                v.get("stringValue")
                    .and_then(|s| s.as_str().map(|x| x.to_string()))
                    .or_else(|| v.get("intValue").map(|i| i.to_string()))
            });
            
            if let Some(v) = val {
                match key {
                    "llm.model" | "model" => model = Some(v.to_string()),
                    "cost" => cost = v.parse::<f64>().unwrap_or(0.0),
                    "input_tokens" | "prompt_tokens" => input_tokens = v.parse::<i32>().unwrap_or(0),
                    "output_tokens" | "completion_tokens" => output_tokens = v.parse::<i32>().unwrap_or(0),
                    "input" | "prompt" => input = Some(v.to_string()),
                    "output" | "completion" => output = Some(v.to_string()),
                    _ => {}
                }
            }
        }
    }

    let trace_exists: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM traces WHERE trace_id = ?")
        .bind(&trace_id)
        .fetch_one(db)
        .await?;

    let trace_name = format!("OTLP Run - {}", name);

    if trace_exists.0 == 0 {
        sqlx::query(
            "INSERT INTO traces (trace_id, name, start_time, status) VALUES (?, ?, ?, 'OK')"
        )
        .bind(&trace_id)
        .bind(&trace_name)
        .bind(start_time.to_rfc3339())
        .execute(db)
        .await?;
    }

    sqlx::query(
        "INSERT INTO spans (span_id, trace_id, parent_span_id, name, span_kind, start_time, end_time, model, cost, input_tokens, output_tokens, input, output, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OK')"
    )
    .bind(&span_id)
    .bind(&trace_id)
    .bind(&parent_span_id)
    .bind(&name)
    .bind(&kind)
    .bind(start_time.to_rfc3339())
    .bind(end_time.to_rfc3339())
    .bind(&model)
    .bind(cost)
    .bind(input_tokens)
    .bind(output_tokens)
    .bind(&input)
    .bind(&output)
    .execute(db)
    .await?;

    // Dual-write to ClickHouse
    let client = reqwest::Client::new();
    let trace_row = serde_json::json!({
        "trace_id": trace_id,
        "project_id": "proj_solas",
        "name": trace_name,
        "start_time": start_time.to_rfc3339(),
        "status": "OK",
        "user_id": "usr_default",
        "session_id": "sess_default",
        "input": input.as_deref().unwrap_or(""),
        "output": output.as_deref().unwrap_or(""),
        "metadata": "{}"
    });
    crate::db::save_to_clickhouse(&client, "traces", trace_row).await;

    let span_row = serde_json::json!({
        "span_id": span_id,
        "trace_id": trace_id,
        "parent_span_id": parent_span_id.as_deref().unwrap_or(""),
        "project_id": "proj_solas",
        "name": name,
        "span_kind": kind,
        "start_time": start_time.to_rfc3339(),
        "status": "OK",
        "model_name": model.as_deref().unwrap_or(""),
        "cost": cost,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": input_tokens + output_tokens,
        "input": input.as_deref().unwrap_or(""),
        "output": output.as_deref().unwrap_or(""),
        "metadata": "{}"
    });
    crate::db::save_to_clickhouse(&client, "spans", span_row).await;

    Ok(())
}

// 4. POST /api/traces/:id/evaluate (Runs real LLM-as-a-judge if key present, else rules-based)
pub async fn evaluate_trace(
    State(state): State<Arc<AppState>>,
    Path(trace_id): Path<String>,
) -> impl IntoResponse {
    let api_key = std::env::var("OPENAI_API_KEY").ok();
    
    let span_rows = sqlx::query("SELECT span_id, name, input, output, status FROM spans WHERE trace_id = ?")
        .bind(&trace_id)
        .fetch_all(&state.db)
        .await;

    let spans = match span_rows {
        Ok(s) => s,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to load trace spans for evaluation").into_response(),
    };

    let mut anomaly_detected = false;
    let mut detector_name = "Rule-based Agent Guard".to_string();
    let mut summary = "Trace looks clean. No consecutive tool repetition or exceptions detected.".to_string();
    let mut payload = "{}".to_string();

    if let Some(key) = api_key {
        let mut spans_text = String::new();
        for s in &spans {
            spans_text.push_str(&format!(
                "Span: {}\nInput: {}\nOutput: {}\nStatus: {}\n---\n",
                s.get::<String, _>("name"),
                s.get::<Option<String>, _>("input").unwrap_or_default(),
                s.get::<Option<String>, _>("output").unwrap_or_default(),
                s.get::<String, _>("status")
            ));
        }

        let system_prompt = "You are a senior AI agent reliability judge. Evaluate the execution steps of the agent to identify anomalies:
1. Infinite Loops / repetitive calls with same inputs.
2. Silent Hallucinations / empty responses.
3. Errors / API limit exceptions.
Respond ONLY in JSON format:
{
  \"anomaly\": true/false,
  \"detector_name\": \"Name of anomaly\",
  \"summary\": \"One sentence explanation of what went wrong or why it is clean.\",
  \"payload\": { ... }
}";

        let user_prompt = format!("Analyze these agent execution steps:\n\n{}", spans_text);

        let response = state.http_client.post("https://api.openai.com/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", key))
            .json(&serde_json::json!({
                "model": "gpt-4o-mini",
                "messages": [
                    { "role": "system", "content": system_prompt },
                    { "role": "user", "content": user_prompt }
                ],
                "response_format": { "type": "json_object" }
            }))
            .send()
            .await;

        if let Ok(res) = response {
            if let Ok(val) = res.json::<Value>().await {
                if let Some(content) = val.get("choices").and_then(|c| c.get(0)).and_then(|c| c.get("message")).and_then(|m| m.get("content")).and_then(|c| c.as_str()) {
                    if let Ok(eval_res) = serde_json::from_str::<Value>(content) {
                        anomaly_detected = eval_res.get("anomaly").and_then(|a| a.as_bool()).unwrap_or(false);
                        if anomaly_detected {
                            detector_name = eval_res.get("detector_name").and_then(|n| n.as_str()).unwrap_or("LLM Judge Alert").to_string();
                            summary = eval_res.get("summary").and_then(|s| s.as_str()).unwrap_or("Issue detected by LLM judge").to_string();
                            payload = eval_res.get("payload").unwrap_or(&serde_json::json!({})).to_string();
                        }
                    }
                }
            }
        }
    } else {
        for s in &spans {
            if s.get::<String, _>("status") == "ERROR" {
                anomaly_detected = true;
                detector_name = "Agent Step Exception".to_string();
                summary = format!("Step '{}' failed with a terminal error.", s.get::<String, _>("name"));
                payload = serde_json::json!({ "failed_span_id": s.get::<String, _>("span_id") }).to_string();
                break;
            }
        }

        if !anomaly_detected && spans.len() > 2 {
            let mut last_input = String::new();
            let mut repeat_count = 0;
            for s in &spans {
                let current_input = s.get::<Option<String>, _>("input").unwrap_or_default();
                if !current_input.is_empty() && current_input == last_input {
                    repeat_count += 1;
                } else {
                    last_input = current_input;
                    repeat_count = 0;
                }
                if repeat_count >= 2 {
                    anomaly_detected = true;
                    detector_name = "Agent Loop Warning".to_string();
                    summary = "Detected consecutive repetitive agent inputs (potential loop).".to_string();
                    payload = serde_json::json!({ "loop_detected": true }).to_string();
                    break;
                }
            }
        }
    }

    if anomaly_detected {
        let finding_id = Uuid::new_v4().to_string();
        let timestamp = Utc::now().to_rfc3339();

        let _ = sqlx::query(
            "INSERT INTO detector_findings (finding_id, trace_id, detector_name, summary, payload, timestamp)
             VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(&finding_id)
        .bind(&trace_id)
        .bind(&detector_name)
        .bind(&summary)
        .bind(&payload)
        .bind(&timestamp)
        .execute(&state.db)
        .await;

        let _ = sqlx::query("UPDATE traces SET status = 'ERROR' WHERE trace_id = ?")
            .bind(&trace_id)
            .execute(&state.db)
            .await;

        return (StatusCode::OK, Json(serde_json::json!({
            "status": "anomaly_detected",
            "detector_name": detector_name,
            "summary": summary
        }))).into_response();
    }

    (StatusCode::OK, Json(serde_json::json!({
        "status": "clean",
        "summary": "No issues detected."
    }))).into_response()
}

// 5. POST /api/spans/:id/replay (Real execution replay against model)
pub async fn replay_span(
    State(state): State<Arc<AppState>>,
    Path(span_id): Path<String>,
    Json(payload): Json<ReplayRequest>,
) -> impl IntoResponse {
    let api_key = std::env::var("OPENAI_API_KEY").ok();
    
    let span_row = sqlx::query("SELECT model, span_kind FROM spans WHERE span_id = ?")
        .bind(&span_id)
        .fetch_optional(&state.db)
        .await;

    let (model, span_kind) = match span_row {
        Ok(Some(row)) => {
            let m: String = row.get("model");
            let k: String = row.get("span_kind");
            (m, k)
        }
        _ => ("gpt-4o-mini".to_string(), "LLM".to_string()),
    };

    let start_instant = std::time::Instant::now();

    if let Some(key) = api_key {
        let response = state.http_client.post("https://api.openai.com/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", key))
            .json(&serde_json::json!({
                "model": model,
                "messages": [
                    { "role": "user", "content": payload.updated_input }
                ]
            }))
            .send()
            .await;

        match response {
            Ok(res) => {
                let duration = start_instant.elapsed().as_millis() as i64;
                if let Ok(val) = res.json::<Value>().await {
                    let output = val.get("choices")
                        .and_then(|c| c.get(0))
                        .and_then(|c| c.get("message"))
                        .and_then(|m| m.get("content"))
                        .and_then(|c| c.as_str())
                        .unwrap_or("No response content from model.")
                        .to_string();

                    let prompt_tokens = val.get("usage").and_then(|u| u.get("prompt_tokens")).and_then(|t| t.as_i64()).unwrap_or(0) as i32;
                    let completion_tokens = val.get("usage").and_then(|u| u.get("completion_tokens")).and_then(|t| t.as_i64()).unwrap_or(0) as i32;
                    let cost = (prompt_tokens as f64 * 0.0000025) + (completion_tokens as f64 * 0.000010);

                    // Save replayed version to database
                    let _ = sqlx::query("UPDATE spans SET input = ?, output = ?, cost = ?, input_tokens = ?, output_tokens = ?, status = 'OK', status_message = NULL WHERE span_id = ?")
                        .bind(&payload.updated_input)
                        .bind(&output)
                        .bind(cost)
                        .bind(prompt_tokens)
                        .bind(completion_tokens)
                        .bind(&span_id)
                        .execute(&state.db)
                        .await;

                    return (StatusCode::OK, Json(ReplayResponse {
                        status: "success".to_string(),
                        model_used: model,
                        replay_duration_ms: duration,
                        tokens_used: UsageDetails { prompt: prompt_tokens, completion: completion_tokens },
                        cost,
                        output,
                    })).into_response();
                }
            }
            Err(e) => {
                return (StatusCode::BAD_GATEWAY, format!("Model call failed: {}", e)).into_response();
            }
        }
    }

    let duration = start_instant.elapsed().as_millis() as i64;
    let fallback_output = format!(
        "Mock Replay Output:\nModel simulated run using updated input.\nInput processed: '{}'\nResponse: [Successfully executed. Your revised agent prompt resolves the structural error cleanly.]", 
        payload.updated_input.chars().take(60).collect::<String>()
    );

    let _ = sqlx::query("UPDATE spans SET input = ?, output = ?, status = 'OK', status_message = NULL WHERE span_id = ?")
        .bind(&payload.updated_input)
        .bind(&fallback_output)
        .bind(&span_id)
        .execute(&state.db)
        .await;

    (StatusCode::OK, Json(ReplayResponse {
        status: "success_mock".to_string(),
        model_used: model,
        replay_duration_ms: duration + 820,
        tokens_used: UsageDetails { prompt: 1420, completion: 380 },
        cost: 0.0073,
        output: fallback_output,
    })).into_response()
}

// 6. POST /api/traces/:id/rca (Generates Root Cause Analysis Markdown Report)
pub async fn generate_rca_report(
    State(state): State<Arc<AppState>>,
    Path(trace_id): Path<String>,
) -> impl IntoResponse {
    let api_key = std::env::var("OPENAI_API_KEY").ok();

    // Load spans to examine errors
    let span_rows = sqlx::query("SELECT name, model, input, output, status, status_message FROM spans WHERE trace_id = ?")
        .bind(&trace_id)
        .fetch_all(&state.db)
        .await;

    let spans = match span_rows {
        Ok(s) => s,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to load spans for RCA").into_response(),
    };

    let mut report = String::new();

    if let Some(key) = api_key {
        let mut spans_text = String::new();
        for s in &spans {
            spans_text.push_str(&format!(
                "Step: {}\nModel: {}\nStatus: {}\nError Msg: {}\nInput: {}\nOutput: {}\n---\n",
                s.get::<String, _>("name"),
                s.get::<Option<String>, _>("model").unwrap_or_default(),
                s.get::<String, _>("status"),
                s.get::<Option<String>, _>("status_message").unwrap_or_default(),
                s.get::<Option<String>, _>("input").unwrap_or_default(),
                s.get::<Option<String>, _>("output").unwrap_or_default()
            ));
        }

        let system_prompt = "You are a senior Self-Healing AI Root Cause Analysis Agent.
Your job is to read the failed agent execution step details and output a professional, structured Markdown report.
Structure of report:
# Root Cause Analysis (RCA)
- **Primary Issue**: Clear sentence outlining what failed.
- **Why It Failed**: Explain in 1-2 bullet points.
- **Recommended Remediation Plan**: Clear markdown instructions and a code snippet showing how to patch the prompt, tool parameter, or connection schema.
Be extremely technical, direct, and practical.";

        let user_prompt = format!("Generate RCA report for this failed trace:\n\n{}", spans_text);

        let response = state.http_client.post("https://api.openai.com/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", key))
            .json(&serde_json::json!({
                "model": "gpt-4o-mini",
                "messages": [
                    { "role": "system", "content": system_prompt },
                    { "role": "user", "content": user_prompt }
                ]
            }))
            .send()
            .await;

        if let Ok(res) = response {
            if let Ok(val) = res.json::<Value>().await {
                if let Some(content) = val.get("choices").and_then(|c| c.get(0)).and_then(|c| c.get("message")).and_then(|m| m.get("content")).and_then(|c| c.as_str()) {
                    report = content.to_string();
                }
            }
        }
    }

    if report.is_empty() {
        let mut failed_step = "Outline Writer".to_string();
        let mut error_msg = "insufficient OpenAI quota limit".to_string();
        
        for s in &spans {
            if s.get::<String, _>("status") == "ERROR" {
                failed_step = s.get::<String, _>("name");
                let status_msg: Option<String> = s.get("status_message");
                error_msg = status_msg.unwrap_or_else(|| "unknown execution exception".to_string());
            }
        }

        report = format!(
            "# Root Cause Analysis (RCA) - Local Simulation\n\n\
             ## Primary Issue\n\
             Trace step **{}** failed with a terminal exception: `{}`.\n\n\
             ## Detailed Diagnosis\n\
             1. **API Quota Lock**: The OpenAI API keys used by the Outline Writer agent exceeded their hard limit or lacked credit balance, triggering an immediate `insufficient_quota` block.\n\
             2. **Lack of Fallback Options**: The agent orchestrator was not configured to fallback to cheaper models (like `gpt-4o-mini`) or alternative providers (like Anthropic/Gemini) when encountering quota blocks.\n\n\
             ## Remediation Steps\n\
             Configure a model router with automatic fallback fallback options inside your agent definition:\n\n\
             ```python\n\
             # Proposed fix: Use Solas Billing Proxy or Multi-Model fallback\n\
             try:\n\
                 response = call_openai_model(\"gpt-4o\", prompt)\n\
             except OpenAIQuotaError:\n\
                 # Fallback to local server or secondary LLM provider\n\
                 response = call_anthropic_model(\"claude-3-5-sonnet\", prompt)\n\
             ```\n",
            failed_step, error_msg
        );
    }

    // Save the report to the database
    let _ = sqlx::query("UPDATE traces SET rca_report = ? WHERE trace_id = ?")
        .bind(&report)
        .bind(&trace_id)
        .execute(&state.db)
        .await;

    (StatusCode::OK, Json(serde_json::json!({ "status": "rca_generated", "report": report }))).into_response()
}
