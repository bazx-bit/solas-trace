use solas_trace_engine::db::init_db;
use sqlx::Row;
use serde_json::json;
use uuid::Uuid;
use chrono::Utc;
use std::sync::Arc;
use futures_util::future::join_all;

#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
async fn test_heavy_concurrent_load() {
    // This is a heavy stress test designed to hit the backend database
    // with 1,000 concurrent asynchronous tasks, simulating extreme production traffic.
    // This proves the asynchronous Rust architecture handles connections correctly.
    
    let pool = Arc::new(init_db("sqlite::memory:").await);
    
    let mut tasks = vec![];
    
    for i in 0..1000 {
        let pool_clone = Arc::clone(&pool);
        
        let task = tokio::spawn(async move {
            let trace_id = Uuid::new_v4().to_string();
            let payload = json!({"worker_id": i, "status": "heavy_load_test"});
            let now = Utc::now().timestamp();

            // Insert mock span
            sqlx::query(
                "INSERT INTO traces (trace_id, name, start_time, input, output, total_cost, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)"
            )
            .bind(&trace_id)
            .bind("benchmark_span")
            .bind(now.to_string())
            .bind(payload.to_string())
            .bind("OK")
            .bind(0.001)
            .bind("OK")
            .execute(&*pool_clone)
            .await
            .unwrap();

            // Retrieve and verify
            let row = sqlx::query("SELECT name FROM traces WHERE trace_id = ?")
                .bind(&trace_id)
                .fetch_one(&*pool_clone)
                .await
                .unwrap();
                
            let span_name: String = row.get("name");
            assert_eq!(span_name, "benchmark_span");
        });
        
        tasks.push(task);
    }
    
    // Wait for all 1000 tasks to complete concurrently
    let results = join_all(tasks).await;
    for result in results {
        assert!(result.is_ok(), "A concurrent database task failed!");
    }
    
    // Final check
    let row = sqlx::query("SELECT COUNT(*) as c FROM traces")
        .fetch_one(&*pool)
        .await
        .unwrap();
        
    let count: i32 = row.get("c");
    assert_eq!(count, 1000, "Exactly 1000 concurrent traces should be recorded.");
}
