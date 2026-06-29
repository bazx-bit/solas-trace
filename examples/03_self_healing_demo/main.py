import os
import uuid
import requests
from openai import OpenAI

# Initialize client pointing to Solas Trace proxy server
client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY", "mock-key"),
    base_url="http://localhost:8080/v1"
)

def simulate_failed_agent_step():
    trace_id = f"trace-failure-{uuid.uuid4().hex[:8]}"
    root_span_id = f"span-root-{uuid.uuid4().hex[:6]}"
    
    print(f"Starting Failure Simulation... Trace ID: {trace_id}")
    
    # 1. First step succeeds
    print("\n[Step 1] Initializing content outline...")
    client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an editor. Outline a brief post about AI observability."},
            {"role": "user", "content": "Outline post."}
        ],
        extra_headers={
            "x-trace-id": trace_id,
            "x-span-id": root_span_id
        }
    )

    # 2. Second step fails (simulating a database schema exception or API limit blocker)
    db_tool_span_id = f"span-tool-db-{uuid.uuid4().hex[:6]}"
    print("\n[Step 2] Querying database stats (Simulating Failure)...")
    
    # Log the failure span directly to Solas Trace OTLP receiver
    start_time = int(requests.utils.time.time() * 1e9)
    end_time = start_time + 120_000_000 # 120ms
    
    payload = {
        "resourceSpans": [{
            "scopeSpans": [{
                "spans": [{
                    "traceId": trace_id,
                    "spanId": db_tool_span_id,
                    "parentSpanId": root_span_id,
                    "name": "Database Reader Tool",
                    "kind": "SPAN_KIND_INTERNAL",
                    "startTimeUnixNano": str(start_time),
                    "endTimeUnixNano": str(end_time),
                    "status": {
                        "code": 2, # ERROR status code in OpenTelemetry
                        "message": "Database connection timeout: pool exhausted"
                    },
                    "attributes": [
                        {"key": "span_kind", "value": {"stringValue": "Tool"}},
                        {"key": "input", "value": {"stringValue": "SELECT * FROM analytics_logs LIMIT 100000;"}},
                        {"key": "output", "value": {"stringValue": ""}},
                        {"key": "cost", "value": {"stringValue": "0.0"}}
                    ]
                }]
            }]
        }]
    }
    
    try:
        r = requests.post("http://localhost:8080/api/v1/traces", json=payload, timeout=2)
        print("Logged failed database reader span to Solas Trace.")
    except Exception as e:
        print(f"Failed to log span: {e}")

    print(f"\n[Simulation Complete] Trace '{trace_id}' has been marked as FAILED.")
    print("Action Plan:")
    print(f"1. Open http://localhost:3000")
    print(f"2. Select the trace '{trace_id}' (highlighted in red)")
    print("3. Click 'Run Evaluation' or 'Generate RCA Report' to trigger Self-Healing AI diagnoses!")
    print("4. Select the failed 'Database Reader Tool' node and click 'Open Sandbox' to fix the query inputs.")

if __name__ == "__main__":
    simulate_failed_agent_step()
