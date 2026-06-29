# Session Tracking

In conversational AI and multi-turn agents, individual traces don't tell the whole story. You need to group traces into **Sessions**.

## Implementing Sessions
Pass a custom header `X-Session-Id` with your proxy requests, or add `session.id` to your OTLP span attributes.

```python
client.chat.completions.create(
    model="gpt-4o",
    messages=[...],
    extra_headers={"X-Session-Id": "user_chat_9921"}
)
```

## Viewing Sessions
In the Solas Trace dashboard, the Sessions view aggregates total latency, total cost, and the entire conversational context across all traces sharing the same Session ID, giving you a complete view of the user journey.
