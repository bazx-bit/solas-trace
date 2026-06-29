use serde_json::json;
use uuid::Uuid;
use std::time::{SystemTime, UNIX_EPOCH};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let trace_id = format!("trace-otlp-rust-{}", Uuid::new_v4().simple());
    let root_span_id = format!("span-otlp-root-{}", &Uuid::new_v4().simple().to_string()[..6]);
    let child_span_id = format!("span-otlp-child-{}", &Uuid::new_v4().simple().to_string()[..6]);

    println!("Simulating Rust OTLP Span Export...");
    println!("Trace ID: {}", trace_id);

    let start_time_nano = SystemTime::now()
        .duration_since(UNIX_EPOCH)?
        .as_nanos();
    let end_time_nano = start_time_nano + 250_000_000; // 250ms execution

    let client = reqwest::Client::new();

    // Build standard OpenTelemetry OTLP JSON payload mapping parent-child spans
    let otlp_payload = json!({
        "resourceSpans": [
            {
                "resource": {
                    "attributes": [
                        {
                            "key": "service.name",
                            "value": { "stringValue": "Rust-OTLP-Service" }
                        }
                    ]
                },
                "scopeSpans": [
                    {
                        "spans": [
                            {
                                "traceId": trace_id,
                                "spanId": root_span_id,
                                "name": "Rust Main Controller",
                                "kind": "SPAN_KIND_INTERNAL",
                                "startTimeUnixNano": start_time_nano.to_string(),
                                "endTimeUnixNano": end_time_nano.to_string(),
                                "attributes": [
                                    { "key": "span_kind", "value": { "stringValue": "Agent" } },
                                    { "key": "input", "value": { "stringValue": "Compile Rust Application" } },
                                    { "key": "output", "value": { "stringValue": "Build Successful in 250ms" } }
                                ]
                            },
                            {
                                "traceId": trace_id,
                                "spanId": child_span_id,
                                "parentSpanId": root_span_id,
                                "name": "cargo build --release",
                                "kind": "SPAN_KIND_INTERNAL",
                                "startTimeUnixNano": start_time_nano.to_string(),
                                "endTimeUnixNano": end_time_nano.to_string(),
                                "attributes": [
                                    { "key": "span_kind", "value": { "stringValue": "Tool" } },
                                    { "key": "input", "value": { "stringValue": "cargo build" } },
                                    { "key": "output", "value": { "stringValue": "Compiled 42 dependencies" } }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    });

    // Send payload to Solas Trace OTLP collection endpoint
    let response = client
        .post("http://localhost:8080/api/v1/traces")
        .json(&otlp_payload)
        .send()
        .await?;

    if response.status().is_success() {
        println!("\n[Success] Simulated Rust OTLP spans exported successfully!");
        println!("Open http://localhost:3000 to verify nested tree rendering.");
    } else {
        eprintln!("OTLP Export failed: {:?}", response.text().await?);
    }

    Ok(())
}
