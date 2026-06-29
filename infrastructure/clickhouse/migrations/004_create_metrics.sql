-- +goose Up
-- Solas Trace — Metrics aggregation tables (Solas exclusive — not in TraceRoot)
-- Pre-aggregated metrics for the analytics dashboard

CREATE TABLE IF NOT EXISTS trace_metrics_hourly
(
    project_id          String,
    hour                DateTime,
    trace_count         UInt64,
    error_count         UInt64,
    avg_duration_ms     Float64,
    p50_duration_ms     Float64,
    p95_duration_ms     Float64,
    p99_duration_ms     Float64,
    total_tokens        UInt64,
    total_cost          Decimal64(9),
    unique_users        UInt64,
    unique_sessions     UInt64,
    agent_breakdown     String CODEC(ZSTD(3)),
    framework_breakdown String CODEC(ZSTD(3)),
    model_breakdown     String CODEC(ZSTD(3))
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (project_id, hour);

CREATE TABLE IF NOT EXISTS span_metrics_hourly
(
    project_id          String,
    hour                DateTime,
    span_kind           String,
    model_name          Nullable(String),
    span_count          UInt64,
    error_count         UInt64,
    avg_duration_ms     Float64,
    total_tokens        UInt64,
    total_cost          Decimal64(9),
    cache_hit_tokens    UInt64
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (project_id, hour, span_kind);

-- Materialized view to auto-aggregate trace metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS trace_metrics_hourly_mv
TO trace_metrics_hourly
AS SELECT
    project_id,
    toStartOfHour(start_time) AS hour,
    count() AS trace_count,
    countIf(status = 'ERROR') AS error_count,
    avg(duration_ms) AS avg_duration_ms,
    quantile(0.5)(duration_ms) AS p50_duration_ms,
    quantile(0.95)(duration_ms) AS p95_duration_ms,
    quantile(0.99)(duration_ms) AS p99_duration_ms,
    sum(total_tokens) AS total_tokens,
    sum(total_cost) AS total_cost,
    uniq(user_id) AS unique_users,
    uniq(session_id) AS unique_sessions,
    '{}' AS agent_breakdown,
    '{}' AS framework_breakdown,
    '{}' AS model_breakdown
FROM traces
GROUP BY project_id, hour;

-- +goose Down
DROP VIEW IF EXISTS trace_metrics_hourly_mv;
DROP TABLE IF EXISTS span_metrics_hourly;
DROP TABLE IF EXISTS trace_metrics_hourly;
