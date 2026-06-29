import os
import uuid
import sys
from openai import OpenAI

# Initialize client pointing to Solas Trace proxy server
client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY", "mock-key"),
    base_url="http://localhost:8080/v1"
)

def run_swarm_orchestration(topic: str):
    trace_id = f"trace-swarm-{uuid.uuid4().hex[:8]}"
    root_span_id = f"span-director-{uuid.uuid4().hex[:6]}"
    
    print(f"Starting Multi-Agent Swarm... Trace ID: {trace_id}")
    
    # Step 1: Director Delegates Tasks
    print("\n[Director] Delegating topic analysis...")
    director_response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are the Lead Swarm Director. Outline a research plan for the given topic."},
            {"role": "user", "content": topic}
        ],
        extra_headers={
            "x-trace-id": trace_id,
            "x-span-id": root_span_id
        }
    )
    plan = director_response.choices[0].message.content
    print("Director plan generated.")

    # Step 2: Researcher Gathers Facts
    researcher_span_id = f"span-researcher-{uuid.uuid4().hex[:6]}"
    print("\n[Researcher] Gathering facts...")
    research_response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a Research Specialist. Retrieve key facts based on the plan."},
            {"role": "user", "content": f"Plan: {plan[:300]}"}
        ],
        extra_headers={
            "x-trace-id": trace_id,
            "x-span-id": researcher_span_id,
            "x-parent-span-id": root_span_id
        }
    )
    facts = research_response.choices[0].message.content
    print("Research facts gathered.")

    # Step 3: Writer Compiles Markdown Report
    writer_span_id = f"span-writer-{uuid.uuid4().hex[:6]}"
    print("\n[Writer] Compiling report...")
    writer_response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a Content Writer. Write a summary based on the facts provided."},
            {"role": "user", "content": f"Facts: {facts[:300]}"}
        ],
        extra_headers={
            "x-trace-id": trace_id,
            "x-span-id": writer_span_id,
            "x-parent-span-id": root_span_id
        }
    )
    report = writer_response.choices[0].message.content
    print("\nFinal Swarm Report:\n", report[:200] + "...")

if __name__ == "__main__":
    topic = "Impact of Renewable Energy on Grid Stability"
    if len(sys.argv) > 1:
        topic = " ".join(sys.argv[1:])
    run_swarm_orchestration(topic)
