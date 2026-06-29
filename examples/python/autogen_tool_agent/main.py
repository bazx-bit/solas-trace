"""
Solas Trace Autogen Tool Agent Example.
Shows how to execute an agent using this framework and trace it with Solas Trace.
"""
import os
import requests
import uuid

# Set fallback mock credentials
os.environ["OPENAI_BASE_URL"] = "http://localhost:8080/v1"
os.environ["OPENAI_API_KEY"] = os.environ.get("OPENAI_API_KEY", "mock-key")

def run_agent_flow():
    trace_id = f"trace-{uuid.uuid4().hex[:8]}"
    root_span_id = f"span-root-{uuid.uuid4().hex[:6]}"
    
    print(f"[AUTOGEN_TOOL_AGENT] Starting workflow... Trace: {trace_id}")
    
    # Simulates sending telemetry back to Solas Trace OTLP receiver
    start_time = int(requests.utils.time.time() * 1e9)
    end_time = start_time + 150_000_000 # 150ms
    
    payload = {
        "resourceSpans": [{
            "scopeSpans": [{
                "spans": [{
                    "traceId": trace_id,
                    "spanId": root_span_id,
                    "name": "Autogen Tool Agent Runner",
                    "kind": "SPAN_KIND_INTERNAL",
                    "startTimeUnixNano": str(start_time),
                    "endTimeUnixNano": str(end_time),
                    "attributes": [
                        {"key": "span_kind", "value": {"stringValue": "Agent"}},
                        {"key": "framework", "value": {"stringValue": "autogen_tool_agent"}},
                        {"key": "cost", "value": {"stringValue": "0.0025"}}
                    ]
                }]
            }]
        }]
    }
    
    try:
        r = requests.post("http://localhost:8080/api/v1/traces", json=payload, timeout=2)
        print(f"[AUTOGEN_TOOL_AGENT] Telemetry exported successfully to Solas Trace dashboard!")
    except Exception as e:
        print(f"[AUTOGEN_TOOL_AGENT] Telemetry export bypassed: {e}")

if __name__ == "__main__":
    run_agent_flow()
