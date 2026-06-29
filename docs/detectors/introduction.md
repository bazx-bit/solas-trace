# Detectors Introduction

In traditional observability, you wait for errors to happen. In Solas Trace, **Detectors** proactively monitor your LLM traffic for anomalies, cost spikes, and security violations.

## What is a Detector?
A detector is a background worker task running in our Tokio async runtime. It evaluates incoming spans in real-time against predefined rules or machine-learning models.

### Common Use Cases
- **Cost Anomalies**: Alert if a single trace consumes more than $2.00 in tokens.
- **PII Leakage**: Detect if Social Security Numbers or Credit Cards are sent in prompt payloads.
- **Prompt Injection**: Flag inputs that attempt to bypass system instructions.
- **Latency Spikes**: Trigger alerts when generation times exceed the 99th percentile.

Because Solas Trace runs these evaluations in Rust, it can process thousands of spans per second with less than 2ms overhead.
