# Introduction to Solas Trace

Welcome to **Solas Trace**, the fastest, most resource-efficient AI observability platform.

## The Problem
As developers build complex Multi-Agent LLM systems (using CrewAI, AutoGen, LangChain), standard APM tools fail. They don't understand tokens, prompts, tool calls, or agent reasoning loops. Existing AI observability tools are slow, written in Python, and require complex microservice deployments (Redis, Celery, Postgres).

## The Solas Trace Solution
Solas Trace is built entirely in **Rust**. It provides:
- **Unified Binary**: API, workers, rate limiting, and database connections compiled into a single 15MB executable.
- **OTLP Native**: Drop-in compatibility with OpenTelemetry.
- **AI-First**: Natively understands LLM spans, token counting, and tool execution graphs.
- **Self-Healing**: Built-in Root Cause Analysis (RCA) that reads your code and proposes PR fixes.
