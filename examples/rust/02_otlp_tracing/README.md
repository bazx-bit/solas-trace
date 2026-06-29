# Rust OTLP Tracing Example

This example demonstrates how to export custom telemetry spans to Solas Trace's OTLP API endpoint `/api/v1/traces` from a Rust backend application.

## Running the Example
1. Navigate to this directory:
   ```bash
   cd examples/rust/02_otlp_tracing
   ```
2. Run the cargo binary:
   ```bash
   cargo run
   ```
3. Open `http://localhost:3000` to inspect the generated OTLP trace and spans tree.
