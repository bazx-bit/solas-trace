import os
import json
import uuid
import sys
from openai import OpenAI

# Initialize client pointing to Solas Trace proxy server
client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY", "mock-key"),
    base_url="http://localhost:8080/v1"
)

def get_weather(city: str) -> dict:
    weather_db = {
        "tokyo": {"temp": 72, "condition": "Sunny", "humidity": 45},
        "san francisco": {"temp": 62, "condition": "Foggy", "humidity": 80},
        "london": {"temp": 54, "condition": "Rainy", "humidity": 85}
    }
    return weather_db.get(city.lower(), {"temp": 70, "condition": "Partly Cloudy", "humidity": 50})

def calculate(expression: str) -> str:
    try:
        allowed_chars = "0123456789+-*/(). "
        if all(c in allowed_chars for c in expression):
            return str(eval(expression))
        return "Error: Invalid characters in expression"
    except Exception as e:
        return f"Error: {str(e)}"

tools_schema = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get current weather conditions for a city.",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "The city name, e.g. Tokyo"}
                },
                "required": ["city"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculate",
            "description": "Perform basic arithmetic calculations.",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {"type": "string", "description": "Math expression, e.g. 15 * (12 + 4)"}
                },
                "required": ["expression"]
            }
        }
    }
]

def run_agent(query: str):
    trace_id = f"trace-react-{uuid.uuid4().hex[:8]}"
    root_span_id = f"span-root-{uuid.uuid4().hex[:6]}"
    
    print(f"Starting ReAct Agent... Trace ID: {trace_id}")
    
    messages = [
        {"role": "system", "content": "You are a helpful assistant. Use tools to answer the user's query."},
        {"role": "user", "content": query}
    ]
    
    for step in range(1, 5):
        span_id = f"span-step-{step}-{uuid.uuid4().hex[:4]}"
        print(f"\n[Step {step}] Call model...")
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=tools_schema,
            extra_headers={
                "x-trace-id": trace_id,
                "x-span-id": span_id,
                "x-parent-span-id": root_span_id
            }
        )
        
        message = response.choices[0].message
        messages.append(message)
        
        if not message.tool_calls:
            print(f"Final Answer: {message.content}")
            break
            
        for tool_call in message.tool_calls:
            name = tool_call.function.name
            args = json.loads(tool_call.function.arguments)
            print(f"Executing tool {name}({args})")
            
            if name == "get_weather":
                output = get_weather(**args)
            elif name == "calculate":
                output = calculate(**args)
            else:
                output = {"error": "tool not found"}
                
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "name": name,
                "content": json.dumps(output)
            })

if __name__ == "__main__":
    query = "What is the weather in Tokyo, and if it increases by 15 percent, what is the temperature?"
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
    run_agent(query)
