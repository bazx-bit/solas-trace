# Custom Metadata

Attaching custom metadata helps you slice and dice your traces during analysis.

## Proxy Injection
You can pass arbitrary metadata via headers to the Solas Trace proxy:

```python
client.chat.completions.create(
    model="gpt-4o",
    messages=[...],
    extra_headers={
        "X-Metadata-User-Id": "12345",
        "X-Metadata-Environment": "production"
    }
)
```

## Dashboard Filtering
Once ingested, you can filter traces in the dashboard:
`metadata.user_id = '12345' AND status = 'error'`

Because our SQLite database uses JSON1 extensions, metadata queries are heavily optimized and blazingly fast.
