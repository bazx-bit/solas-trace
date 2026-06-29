use serde_json::json;
use uuid::Uuid;
use std::time::{SystemTime, UNIX_EPOCH};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let trace_id = format!("trace-rust-deepseek_tool_agent-{}", Uuid::new_v4().simple());
    let root_span_id = format!("span-rust-{}", &Uuid::new_v4().simple().to_string()[..6]);

    println!("Starting Rust Deepseek Tool Agent Agent Simulation...");
    
    let start_time_nano = SystemTime::now()
        .duration_since(UNIX_EPOCH)?
        .as_nanos();
    let end_time_nano = start_time_nano + 200_000_000; // 200ms execution

    let client = reqwest::Client::new();
    
    let payload = json!({
        "resourceSpans": [{
            "scopeSpans": [{
                "spans": [{
                    "traceId": trace_id,
                    "spanId": root_span_id,
                    "name": "Deepseek Tool Agent Agent",
                    "kind": "SPAN_KIND_INTERNAL",
                    "startTimeUnixNano": start_time_nano.to_string(),
                    "endTimeUnixNano": end_time_nano.to_string(),
                    "attributes": [
                        { "key": "span_kind", "value": { "stringValue": "Agent" } },
                        { "key": "framework", "value": { "stringValue": "rust-deepseek_tool_agent" } },
                        { "key": "cost", "value": { "stringValue": "0.0" } }
                    ]
                }]
            }]
        }]
    });

    let response = client
        .post("http://localhost:8080/api/v1/traces")
        .json(&payload)
        .send()
        .await?;

    if response.status().is_success() {
        println!("Telemetry exported successfully to http://localhost:3000");
    }

    Ok(())
}
