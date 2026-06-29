use solas_trace_engine::db::init_db;
use sqlx::Row;

#[tokio::test]
async fn test_sqlite_migrations_apply_successfully() {
    // Tests that the embedded SQLite memory database runs all migrations perfectly.
    // Unlike the reference Python monolithic clickhouse migrations, Solas Trace uses
    // instantaneous SQLx memory migrations for lightning-fast testing.
    let pool = init_db("sqlite::memory:").await;
    
    // Verify traces table exists
    let row = sqlx::query("SELECT COUNT(*) as c FROM sqlite_master WHERE type='table' AND name='traces'")
        .fetch_one(&pool)
        .await
        .unwrap();
        
    let count: i32 = row.get("c");
    assert_eq!(count, 1, "The traces table must be successfully migrated.");
}
