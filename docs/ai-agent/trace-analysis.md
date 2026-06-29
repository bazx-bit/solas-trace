# Trace Analysis with AI

Solas Trace provides an interactive, natural-language interface to interrogate your traces. Instead of manually sifting through thousands of spans to find where a prompt failed, you can ask the Solas AI Agent directly.

## How It Works

1. **Query Engine**: The Rust backend intercepts your natural language query.
2. **Span Filtering**: It translates the query into SQL to filter traces in the embedded SQLite database (e.g., finding traces with `status = 'error'` or `latency > 5000ms`).
3. **Contextualization**: The retrieved spans, including their input prompts and output completions, are passed to your configured BYOK model (OpenAI, Anthropic).
4. **Insight Generation**: The LLM analyzes the payload and explains exactly why the sequence of actions failed.

## Example Queries
- *"Why did the agent loop infinitely on the database lookup tool?"*
- *"Show me the prompt that resulted in the highest token cost today."*
- *"What is the common factor in all validation errors for the `extract_entities` span?"*
