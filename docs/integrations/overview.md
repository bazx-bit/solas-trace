# Integrations Overview

Solas Trace seamlessly integrates with your existing AI stack. Because we utilize a transparent proxy approach and the standard OpenTelemetry (OTLP) protocol, you don't need to rewrite your applications.

## How We Integrate

1. **Proxy Mode**: Point your OpenAI, Anthropic, or Groq SDKs to the Solas Trace URL. We intercept the request, log the trace, and proxy it to the provider. No new dependencies required.
2. **OTLP Mode**: Use standard OpenTelemetry SDKs (`opentelemetry-python`, `opentelemetry-js`) to send raw spans to our `/api/v1/traces` endpoint.

## Supported Frameworks
We support all major AI frameworks out of the box because they all use the underlying provider SDKs:
- LangChain / LangGraph
- CrewAI
- AutoGen
- Vercel AI SDK
- LlamaIndex
