# Quickstart Guide

Get Solas Trace running locally in under 60 seconds.

## 1. Start the Engine
Use Docker Compose to spin up the ultra-lightweight environment:

```bash
docker compose -f docker/docker-compose.prod.yml up -d
```
This starts the Rust backend, Vite frontend, and Caddy proxy.

## 2. Instrument your Code
Change your OpenAI client base URL to point to Solas Trace:

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8080/v1",
    api_key="your-openai-api-key"
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

## 3. View the Trace
Open `http://localhost:8080` in your browser. You will instantly see your trace, token costs, and latency metrics!
