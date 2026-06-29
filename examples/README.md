# Solas Trace Curated Examples

This directory contains curated, production-grade integration examples demonstrating how to trace AI agents across different languages and frameworks using the **Solas Trace** platform.

All examples are 100% original implementations specifically tailored to showcase trace ingestion via our proxy (`http://localhost:8080/v1`) or our OTLP trace receiver (`/api/v1/traces`).

---

## Directory Index

### 🐍 Python Examples (`./python`)
*   **[01_react_weather_agent](./python/01_react_weather_agent)**: ReAct (Reasoning and Action) loop using the OpenAI SDK routed through the proxy.
*   **[02_multi_agent_swarm](./python/02_multi_agent_swarm)**: Collaborative multi-agent trace simulation.
*   **[03_self_healing_demo](./python/03_self_healing_demo)**: Trace failure injector for Sandbox & RCA evaluation testing.
*   **[agno_tool_agent](./python/agno_tool_agent)**: Agno agent framework telemetry tracing.
*   **[anthropic_tool_agent](./python/anthropic_tool_agent)**: Anthropic SDK proxy tracing.
*   **[autogen_tool_agent](./python/autogen_tool_agent)**: Microsoft AutoGen agent framework tracing.
*   **[claude_agent_sdk](./python/claude_agent_sdk)**: Claude Agent SDK correlation setup.
*   **[crewai_agent](./python/crewai_agent)**: CrewAI cooperative agents trace tracking.
*   **[deepagents](./python/deepagents)**: Custom deep-agent telemetry trace flow.
*   **[deepseek_tool_agent](./python/deepseek_tool_agent)**: DeepSeek custom proxy API integration.
*   **[dspy_agent](./python/dspy_agent)**: Stanford DSPy programmatic LLM pipeline tracing.
*   **[gemini_tool_agent](./python/gemini_tool_agent)**: Google Gemini SDK integration.
*   **[google_genai_sdk](./python/google_genai_sdk)**: Google GenAI new SDK tracing format.
*   **[groq_tool_agent](./python/groq_tool_agent)**: Groq API client integration.
*   **[langgraph_code_agent](./python/langgraph_code_agent)**: LangGraph stateful agent graphs tracing.
*   **[llamaindex_rag](./python/llamaindex_rag)**: LlamaIndex query engine span instrumentation.
*   **[microsoft_agent_framework](./python/microsoft_agent_framework)**: MS agent framework tracking.
*   **[mistral_tool_agent](./python/mistral_tool_agent)**: Mistral API client proxy routing.
*   **[openai_agents_sdk](./python/openai_agents_sdk)**: OpenAI's official Agent SDK proxy integration.
*   **[openai_tool_agent](./python/openai_tool_agent)**: Custom raw OpenAI tool calls tracing.
*   **[openrouter_tool_agent](./python/openrouter_tool_agent)**: OpenRouter base URL proxy integration.
*   **[pydantic_ai_tool_agent](./python/pydantic_ai_tool_agent)**: PydanticAI structured agent telemetry tracing.

---

### 🦀 Rust Examples (`./rust`)
*   **[01_openai_proxy](./rust/01_openai_proxy)**: Lightweight client using standard `reqwest` calls.
*   **[02_otlp_tracing](./rust/02_otlp_tracing)**: OTLP collector JSON payload simulation.
*   **[agno_tool_agent](./rust/agno_tool_agent)**: Rust equivalent for Agno agent telemetry.
*   **[anthropic_tool_agent](./rust/anthropic_tool_agent)**: Rust equivalent for Anthropic client routing.
*   **[autogen_tool_agent](./rust/autogen_tool_agent)**: Rust equivalent for AutoGen multi-agent simulation telemetry.
*   **[claude_agent_sdk](./rust/claude_agent_sdk)**: Rust equivalent for Claude client tracing.
*   **[crewai_agent](./rust/crewai_agent)**: Rust equivalent for CrewAI collaborative telemetry simulation.
*   **[deepagents](./rust/deepagents)**: Rust equivalent for custom deep-agent trace flow.
*   **[deepseek_tool_agent](./rust/deepseek_tool_agent)**: Rust equivalent for DeepSeek custom client proxy routing.
*   **[dspy_agent](./rust/dspy_agent)**: Rust equivalent for DSPy pipeline simulation.
*   **[gemini_tool_agent](./rust/gemini_tool_agent)**: Rust equivalent for Google Gemini API client tracing.
*   **[google_genai_sdk](./rust/google_genai_sdk)**: Rust equivalent for Google GenAI client tracing.
*   **[groq_tool_agent](./rust/groq_tool_agent)**: Rust equivalent for Groq API client tracing.
*   **[langgraph_code_agent](./rust/langgraph_code_agent)**: Rust equivalent for stateful agent graphs tracing.
*   **[llamaindex_rag](./rust/llamaindex_rag)**: Rust equivalent for LlamaIndex query engine span instrumentation.
*   **[microsoft_agent_framework](./rust/microsoft_agent_framework)**: Rust equivalent for MS agent framework tracing.
*   **[mistral_tool_agent](./rust/mistral_tool_agent)**: Rust equivalent for Mistral API client proxy routing.
*   **[openai_agents_sdk](./rust/openai_agents_sdk)**: Rust equivalent for OpenAI's official Agent SDK proxy integration.
*   **[openai_tool_agent](./rust/openai_tool_agent)**: Rust equivalent for custom raw OpenAI tool calls tracing.
*   **[openrouter_tool_agent](./rust/openrouter_tool_agent)**: Rust equivalent for OpenRouter client proxy integration.
*   **[pydantic_ai_tool_agent](./rust/pydantic_ai_tool_agent)**: Rust equivalent for PydanticAI client tracing.

---

### 🌐 TypeScript Examples (`./typescript`)
*   **[01_openai_client](./typescript/01_openai_client)**: JS/TS OpenAI Client integration.
*   **[02_vercel_ai_sdk](./typescript/02_vercel_ai_sdk)**: Vercel AI SDK integration.
*   **[anthropic](./typescript/anthropic)**: Anthropic JS/TS SDK tracing.
*   **[bedrock](./typescript/bedrock)**: AWS Bedrock client tracing.
*   **[claude_agent_sdk](./typescript/claude_agent_sdk)**: Claude JS Agent SDK trace setup.
*   **[deepagents](./typescript/deepagents)**: Custom deep-agent telemetry trace flow.
*   **[deepseek](./typescript/deepseek)**: DeepSeek client proxy integration.
*   **[langchain](./typescript/langchain)**: LangChain JS/TS run tracer.
*   **[mastra](./typescript/mastra)**: Mastra framework integration.
*   **[openai](./typescript/openai)**: OpenAI custom JS client tracking.
*   **[openai_agents](./typescript/openai_agents)**: OpenAI's official TS Agent SDK integration.
*   **[openrouter](./typescript/openrouter)**: OpenRouter JS client tracking.
*   **[vercel_ai](./typescript/vercel_ai)**: Vercel AI SDK runtime tracing.
