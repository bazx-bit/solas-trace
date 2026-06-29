-- +goose Up
-- Solas Trace — Detector findings & evaluations
CREATE TABLE IF NOT EXISTS detector_findings
(
    finding_id          String,
    detector_id         String,
    project_id          String,
    trace_id            String,
    identified          Bool,
    confidence          Nullable(Float32),
    severity            Nullable(String),
    category            Nullable(String),
    summary             Nullable(String),
    details             Nullable(String) CODEC(ZSTD(3)),
    output_data         Nullable(String) CODEC(ZSTD(3)),
    model_used          Nullable(String),
    eval_tokens         Nullable(Int64),
    eval_cost           Nullable(Decimal64(9)),
    eval_duration_ms    Nullable(Float64),
    created_at          DateTime64(3) DEFAULT now64(3)
)
ENGINE = ReplacingMergeTree(created_at)
PARTITION BY toYYYYMM(created_at)
ORDER BY (project_id, detector_id, trace_id, finding_id);

CREATE TABLE IF NOT EXISTS detector_evals
(
    eval_id             String,
    detector_id         String,
    project_id          String,
    trace_id            String,
    status              String DEFAULT 'pending',
    error_message       Nullable(String),
    started_at          Nullable(DateTime64(3)),
    completed_at        Nullable(DateTime64(3)),
    created_at          DateTime64(3) DEFAULT now64(3)
)
ENGINE = ReplacingMergeTree(created_at)
PARTITION BY toYYYYMM(created_at)
ORDER BY (project_id, detector_id, trace_id, eval_id);

-- +goose Down
DROP TABLE IF EXISTS detector_evals;
DROP TABLE IF EXISTS detector_findings;
