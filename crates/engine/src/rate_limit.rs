use axum::{
    body::Body,
    http::{Request, Response, StatusCode, header},
    response::IntoResponse,
};
use futures_util::future::BoxFuture;
use serde_json::json;
use std::{
    collections::HashMap,
    sync::{Arc, RwLock},
    task::{Context, Poll},
    time::{Duration, Instant},
};
use tower::{Layer, Service};

/// Tier-based rate limiting configuration
#[derive(Clone, Copy)]
pub struct RateLimitConfig {
    pub max_requests: u64,
    pub window_seconds: u64,
}

impl RateLimitConfig {
    pub fn for_tier(tier: crate::ee::LicenseTier) -> Self {
        match tier {
            crate::ee::LicenseTier::Community => RateLimitConfig {
                max_requests: 100, // 100 req/min for community
                window_seconds: 60,
            },
            crate::ee::LicenseTier::Enterprise => RateLimitConfig {
                max_requests: 1000, // 1000 req/min for enterprise
                window_seconds: 60,
            },
            crate::ee::LicenseTier::EnterprisePlus => RateLimitConfig {
                max_requests: 10000, // 10000 req/min for enterprise plus
                window_seconds: 60,
            },
        }
    }
}

/// Token bucket for a specific client/workspace
struct ClientBucket {
    tokens: f64,
    last_updated: Instant,
    reset_at: Instant,
}

/// In-memory Rate Limiter state
pub struct RateLimiterState {
    buckets: RwLock<HashMap<String, ClientBucket>>,
    ee_manager: Arc<crate::ee::EnterpriseManager>,
}

impl RateLimiterState {
    pub fn new(ee_manager: Arc<crate::ee::EnterpriseManager>) -> Self {
        Self {
            buckets: RwLock::new(HashMap::new()),
            ee_manager,
        }
    }

    /// Check rate limit and consume 1 token. Returns (allowed, remaining, reset_in_secs)
    pub fn check_and_consume(&self, client_id: &str) -> (bool, u64, u64) {
        let tier = self.ee_manager.get_license_tier();
        let config = RateLimitConfig::for_tier(tier);
        let rate = config.max_requests as f64 / config.window_seconds as f64;
        let now = Instant::now();

        let mut buckets = self.buckets.write().unwrap();
        let bucket = buckets.entry(client_id.to_string()).or_insert_with(|| ClientBucket {
            tokens: config.max_requests as f64,
            last_updated: now,
            reset_at: now + Duration::from_secs(config.window_seconds),
        });

        // Replenish tokens based on time elapsed
        let elapsed = now.duration_since(bucket.last_updated).as_secs_f64();
        bucket.tokens = (bucket.tokens + elapsed * rate).min(config.max_requests as f64);
        bucket.last_updated = now;

        if now >= bucket.reset_at {
            bucket.reset_at = now + Duration::from_secs(config.window_seconds);
        }

        let reset_in = bucket.reset_at.duration_since(now).as_secs().max(1);

        if bucket.tokens >= 1.0 {
            bucket.tokens -= 1.0;
            (true, bucket.tokens as u64, reset_in)
        } else {
            (false, 0, reset_in)
        }
    }
}

/// Axum/Tower Middleware Layer
#[derive(Clone)]
pub struct RateLimitLayer {
    state: Arc<RateLimiterState>,
}

impl RateLimitLayer {
    pub fn new(state: Arc<RateLimiterState>) -> Self {
        Self { state }
    }
}

impl<S> Layer<S> for RateLimitLayer {
    type Service = RateLimitMiddleware<S>;

    fn layer(&self, inner: S) -> Self::Service {
        RateLimitMiddleware {
            inner,
            state: self.state.clone(),
        }
    }
}

/// The actual Tower Service doing the rate limiting
#[derive(Clone)]
pub struct RateLimitMiddleware<S> {
    inner: S,
    state: Arc<RateLimiterState>,
}

impl<S, ReqBody> Service<Request<ReqBody>> for RateLimitMiddleware<S>
where
    S: Service<Request<ReqBody>, Response = Response<Body>> + Clone + Send + 'static,
    S::Future: Send + 'static,
    ReqBody: Send + 'static,
{
    type Response = S::Response;
    type Error = S::Error;
    type Future = BoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, req: Request<ReqBody>) -> Self::Future {
        // Simple extraction: use IP or API Key
        // In a real system, we'd extract the Workspace ID from auth headers.
        let client_id = req
            .headers()
            .get("x-api-key")
            .and_then(|h| h.to_str().ok())
            .unwrap_or("anonymous")
            .to_string();

        let (allowed, remaining, reset_in) = self.state.check_and_consume(&client_id);
        let limit = RateLimitConfig::for_tier(self.state.ee_manager.get_license_tier()).max_requests;

        if !allowed {
            tracing::warn!("Rate limit exceeded for client: {}", client_id);
            let body = json!({
                "error": "too_many_requests",
                "detail": "Rate limit exceeded. Slow down and retry after the cooldown.",
                "retry_after": reset_in,
                "limit": limit,
                "remaining": 0
            });

            let response = Response::builder()
                .status(StatusCode::TOO_MANY_REQUESTS)
                .header(header::RETRY_AFTER, reset_in.to_string())
                .header("X-RateLimit-Limit", limit.to_string())
                .header("X-RateLimit-Remaining", "0")
                .header("X-RateLimit-Reset", (chrono::Utc::now().timestamp() as u64 + reset_in).to_string())
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(serde_json::to_string(&body).unwrap()))
                .unwrap();

            return Box::pin(async move { Ok(response) });
        }

        // Clone the inner service and call it
        let clone = self.inner.clone();
        let mut inner = std::mem::replace(&mut self.inner, clone);
        
        let future = inner.call(req);
        
        Box::pin(async move {
            let mut response = future.await?;
            // Append advisory rate limit headers to successful responses
            response.headers_mut().insert(
                "X-RateLimit-Limit",
                limit.to_string().parse().unwrap(),
            );
            response.headers_mut().insert(
                "X-RateLimit-Remaining",
                remaining.to_string().parse().unwrap(),
            );
            response.headers_mut().insert(
                "X-RateLimit-Reset",
                (chrono::Utc::now().timestamp() as u64 + reset_in).to_string().parse().unwrap(),
            );
            Ok(response)
        })
    }
}
