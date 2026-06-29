# Tracing Overview

Tracing is the core of Solas Trace. A trace represents a single execution path through your AI system, which may consist of multiple spans (e.g., retrieving context, generating a prompt, parsing tool output).

## Anatomy of a Trace

- **Trace ID**: Unique identifier for the entire transaction.
- **Spans**: Individual operations within the trace. In an AI agent, spans represent LLM calls, vector database lookups, or API requests.
- **Attributes**: Key-value pairs attached to spans (e.g., `model="gpt-4o"`, `temperature=0.7`).
- **Events**: Point-in-time logs (e.g., "Chunk retrieved from DB").

## Why Solas Trace Tracing is Better
Because we process traces in Rust, we parse and index large JSON payloads (like tool schema definitions and massive prompts) concurrently without blocking the main event loop, ensuring zero performance degradation to your app.
