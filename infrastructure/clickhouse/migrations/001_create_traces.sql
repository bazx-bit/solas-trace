-- +goose Up
-- Solas Trace — Core traces table
-- Stores one row per complete trace (agent execution)
CREATE TABLE IF NOT EXISTS traces
(
    trace_id            String,
    project_id          String,
    start_time          DateTime64(3),
    end_time            Nullable(DateTime64(3)),
    name                String,
    status              String DEFAULT 'OK',
    status_message      Nullable(String),
    user_id             Nullable(String),
    session_id          Nullable(String),
    agent_name          Nullable(String),
    agent_version       Nullable(String),
    framework           Nullable(String),
    environment          Nullable(String),
    git_ref             Nullable(String),
    git_repo            Nullable(String),
    git_commit          Nullable(String),
    input               Nullable(String) CODEC(ZSTD(3)),
    output              Nullable(String) CODEC(ZSTD(3)),
    metadata            Nullable(String) CODEC(ZSTD(3)),
    tags                Array(String),
    total_tokens        Nullable(Int64),
    total_cost           Nullable(Decimal64(9)),
    span_count          Nullable(Int32),
    error_count         Nullable(Int32),
    duration_ms         Nullable(Float64),
    ch_create_time      DateTime64(3) DEFAULT now64(3),
    ch_update_time      DateTime64(3) DEFAULT now64(3)
)
ENGINE = ReplacingMergeTree(ch_update_time)
PARTITION BY toYYYYMM(start_time)
ORDER BY (project_id, toDate(start_time), trace_id);

-- +goose Down
DROP TABLE IF EXISTS traces;
