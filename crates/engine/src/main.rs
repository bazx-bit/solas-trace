use axum::{
    routing::{get, post, any},
    Router,
};
use reqwest::Client;
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use solas_trace_engine::{
    db,
    ee,
    rate_limit,
    handlers::{collect_otlp_traces, evaluate_trace, get_trace_details, list_traces, replay_span, generate_rca_report},
    proxy::{openai_proxy_handler, anthropic_proxy_handler, AppState},
};

#[tokio::main]
async fn main() {
    // Load .env file
    dotenvy::dotenv().ok();

    // 1. Initialize logging
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "solas_trace_engine=info,tower_http=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // 2. Database connection string (default to local sqlite file)
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite://data/solas-trace.db".to_string());

    // Initialize database pool and create tables
    let db_pool = db::init_db(&database_url).await;

    // 3. Shared AppState
    let state = Arc::new(AppState {
        db: db_pool,
        http_client: Client::new(),
    });

    // 4. Rate Limiter & EE Initialization
    let ee_manager = Arc::new(ee::EnterpriseManager::new());
    let rate_limiter_state = Arc::new(rate_limit::RateLimiterState::new(ee_manager));
    let rate_limit_layer = rate_limit::RateLimitLayer::new(rate_limiter_state);

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // 5. Router definition
    let app = Router::new()
        // API Interceptor Proxy Route (captures /v1/chat/completions etc.)
        .route("/v1/chat/completions", any(openai_proxy_handler))
        .route("/v1/completions", any(openai_proxy_handler))
        .route("/v1/messages", any(anthropic_proxy_handler))
        
        // Dashboard API Routes
        .route("/api/traces", get(list_traces))
        .route("/api/traces/:id", get(get_trace_details))
        .route("/api/traces/:id/evaluate", post(evaluate_trace))
        .route("/api/traces/:id/rca", post(generate_rca_report))
        .route("/api/spans/:id/replay", post(replay_span))
        
        // OTLP Ingestion Endpoint
        .route("/api/v1/traces", post(collect_otlp_traces))
        
        // Middleware layers
        .layer(rate_limit_layer)
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    // 6. Start server
    let port = std::env::var("SOLAS_PORT")
        .or_else(|_| std::env::var("PORT"))
        .unwrap_or_else(|_| "8000".to_string())
        .parse::<u16>()
        .unwrap_or(8000);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    info!("Solas Trace listening on {}", addr);
    info!("OpenAI Interceptor Proxy ready at http://localhost:{}/v1", port);
    info!("Dashboard REST API ready at http://localhost:{}/api", port);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
