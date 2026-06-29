-- +goose Up
-- Solas Trace — Spans table
-- Each span is one operation within a trace (LLM call, tool use, agent step, etc.)
CREATE TABLE IF NOT EXISTS spans
(
    span_id             String,
    trace_id            String,
    parent_span_id      Nullable(String),
    project_id          String,
    start_time          DateTime64(3),
    end_time            Nullable(DateTime64(3)),
    name                String,
    span_kind           String,
    status              String DEFAULT 'OK',
    status_message      Nullable(String),
    -- LLM-specific fields
    model_name          Nullable(String),
    model_provider      Nullable(String),
    temperature         Nullable(Float32),
    max_tokens          Nullable(Int32),
    cost                Nullable(Decimal64(9)),
    input_tokens        Nullable(Int64),
    output_tokens       Nullable(Int64),
    total_tokens        Nullable(Int64),
    cache_read_tokens   Nullable(Int64),
    cache_write_tokens  Nullable(Int64),
    -- Tool-specific fields
    tool_name           Nullable(String),
    tool_status         Nullable(String),
    -- Content fields (compressed)
    input               Nullable(String) CODEC(ZSTD(3)),
    output              Nullable(String) CODEC(ZSTD(3)),
    metadata            Nullable(String) CODEC(ZSTD(3)),
    events              Nullable(String) CODEC(ZSTD(3)),
    -- Source tracking
    source_file         Nullable(String),
    source_line         Nullable(Int32),
    source_function     Nullable(String),
    -- Duration
    duration_ms         Nullable(Float64),
    -- Timestamps
    ch_create_time      DateTime64(3) DEFAULT now64(3),
    ch_update_time      DateTime64(3) DEFAULT now64(3)
)
ENGINE = ReplacingMergeTree(ch_update_time)
PARTITION BY toYYYYMM(start_time)
ORDER BY (project_id, trace_id, start_time, span_id);

-- +goose Down
DROP TABLE IF EXISTS spans;
