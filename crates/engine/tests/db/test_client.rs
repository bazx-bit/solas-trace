use solas_trace_engine::db::init_db;
use sqlx::Row;
use serde_json::json;
use uuid::Uuid;
use chrono::Utc;

#[tokio::test]
async fn test_database_client_insert_and_retrieve_trace() {
    let pool = init_db("sqlite::memory:").await;
    
    let trace_id = Uuid::new_v4().to_string();
    let payload = json!({"prompt": "Hello", "completion": "World"});
    let now = Utc::now().timestamp();

    // Insert mock span
    sqlx::query(
        "INSERT INTO traces (trace_id, name, start_time, input, output, total_cost, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&trace_id)
    .bind("chat_completion")
    .bind(now.to_string())
    .bind(payload.to_string())
    .bind("OK")
    .bind(0.001)
    .bind("success")
    .execute(&pool)
    .await
    .unwrap();

    // Retrieve and verify
    let row = sqlx::query("SELECT name FROM traces WHERE trace_id = ?")
        .bind(&trace_id)
        .fetch_one(&pool)
        .await
        .unwrap();
        
    let span_name: String = row.get("name");
    assert_eq!(span_name, "chat_completion");
}
