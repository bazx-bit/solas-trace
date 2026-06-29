use serde_json::json;
use uuid::Uuid;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let trace_id = format!("trace-rust-{}", Uuid::new_v4().simple());
    let root_span_id = format!("span-rust-root-{}", &Uuid::new_v4().simple().to_string()[..6]);

    println!("Starting Rust Agent... Trace ID: {}", trace_id);

    let client = reqwest::Client::new();
    
    // Call the OpenAI endpoint through the Solas Trace local proxy server (port 8080)
    let response = client
        .post("http://localhost:8080/v1/chat/completions")
        .header("Authorization", "Bearer mock-openai-key")
        // Inject Solas Trace headers to correlate the request
        .header("x-trace-id", &trace_id)
        .header("x-span-id", &root_span_id)
        .json(&json!({
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a Rust coding mentor. Answer questions in a brief manner."
                },
                {
                    "role": "user",
                    "content": "Explain Rust Lifetimes in 1 sentence."
                }
            ]
        }))
        .send()
        .await?;

    if response.status().is_success() {
        let body: serde_json::Value = response.json().await?;
        let reply = body["choices"][0]["message"]["content"]
            .as_str()
            .unwrap_or("No response content");
            
        println!("\nModel Response:\n{}", reply);
        println!("\n[Success] Trace successfully captured in Solas Trace dashboard!");
    } else {
        eprintln!("API Request failed: {:?}", response.text().await?);
    }

    Ok(())
}
