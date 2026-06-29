# Cost Tracking

Tracking token usage and costs is critical when deploying LLMs to production.

## Automated Cost Calculation
Solas Trace automatically intercepts the `usage` block from OpenAI and Anthropic API responses. 

```json
"usage": {
  "prompt_tokens": 150,
  "completion_tokens": 20,
  "total_tokens": 170
}
```

The Rust backend maintains an up-to-date pricing matrix for all major models (GPT-4o, Claude 3.5, Llama 3). It calculates the exact cost in USD down to the fraction of a cent and attaches it to the span as `span.cost`.

## Budgets and Rate Limits
Combine Cost Tracking with our **Rate Limiter** middleware to ensure a specific user or workspace cannot spend more than $X per day. If the budget is exceeded, the API returns a `429 Too Many Requests`.
