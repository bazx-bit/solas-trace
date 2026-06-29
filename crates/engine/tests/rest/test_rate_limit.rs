use axum::{
    body::Body,
    http::{Request, StatusCode},
    routing::get,
    Router,
};
use std::sync::Arc;
use tower::util::ServiceExt;

use solas_trace_engine::{
    ee::{EnterpriseManager, LicenseTier},
    rate_limit::{RateLimitLayer, RateLimiterState},
};

// A mock handler to act as the backend API
async fn mock_endpoint() -> &'static str {
    "Success"
}

#[tokio::test]
async fn test_rate_limiter_allows_requests_within_budget() {
    let ee_manager = Arc::new(EnterpriseManager::new());
    let rate_limiter_state = Arc::new(RateLimiterState::new(ee_manager.clone()));
    let rate_limit_layer = RateLimitLayer::new(rate_limiter_state);

    let app = Router::new()
        .route("/api/test", get(mock_endpoint))
        .layer(rate_limit_layer);

    // Make a request
    let request = Request::builder()
        .uri("/api/test")
        .header("x-api-key", "test-workspace-1")
        .body(Body::empty())
        .unwrap();

    let response = app.oneshot(request).await.unwrap();

    // Verify it succeeded
    assert_eq!(response.status(), StatusCode::OK);
    
    // Verify standard rate limit headers are injected
    assert!(response.headers().contains_key("X-RateLimit-Limit"));
    assert!(response.headers().contains_key("X-RateLimit-Remaining"));
    assert!(response.headers().contains_key("X-RateLimit-Reset"));
}

#[tokio::test]
async fn test_rate_limiter_enforces_429_when_budget_exceeded() {
    let ee_manager = Arc::new(EnterpriseManager::new());
    let rate_limiter_state = Arc::new(RateLimiterState::new(ee_manager.clone()));
    let rate_limit_layer = RateLimitLayer::new(rate_limiter_state.clone());

    let mut app = Router::new()
        .route("/api/test", get(mock_endpoint))
        .layer(rate_limit_layer);

    // Community tier default is 100 requests. 
    // We will simulate 100 rapid requests.
    for _ in 0..100 {
        let request = Request::builder()
            .uri("/api/test")
            .header("x-api-key", "exhausted-workspace")
            .body(Body::empty())
            .unwrap();
        let response = app.clone().oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
    }

    // The 101st request should fail with HTTP 429 Too Many Requests
    let request = Request::builder()
        .uri("/api/test")
        .header("x-api-key", "exhausted-workspace")
        .body(Body::empty())
        .unwrap();
    let response = app.clone().oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::TOO_MANY_REQUESTS);
    assert!(response.headers().contains_key("Retry-After"));
    assert_eq!(response.headers().get("X-RateLimit-Remaining").unwrap().to_str().unwrap(), "0");
}
