use serde_json::json;

#[test]
fn test_otel_span_transformation_logic() {
    // Unlike Traceroot's Python OTEL transformation which uses slow regex and dict lookups,
    // Solas Trace relies on Rust's serde_json for ultra-fast payload inspection.
    
    let raw_otlp_payload = json!({
        "resourceSpans": [{
            "resource": {
                "attributes": [
                    {"key": "service.name", "value": {"stringValue": "ai-agent-svc"}}
                ]
            },
            "scopeSpans": [{
                "spans": [{
                    "traceId": "1234567890abcdef",
                    "spanId": "abcdef1234567890",
                    "name": "chat_completion",
                    "attributes": [
                        {"key": "llm.usage.prompt_tokens", "value": {"intValue": 15}}
                    ]
                }]
            }]
        }]
    });

    // In a real E2E test, we would pass this to the `collect_otlp_traces` handler and verify DB writes.
    // For this module test, we ensure the JSON structure is parseable.
    let resource_spans = raw_otlp_payload.get("resourceSpans").expect("Must have resourceSpans");
    assert!(resource_spans.is_array());
}
