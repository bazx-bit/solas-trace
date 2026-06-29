# ReAct Weather Agent Example

This example demonstrates a standard Reasoning-and-Action (ReAct) agent loop configured to use the Solas Trace proxy server.

## Features Illustrated
1. **Tool Execution Capture**: Spans detail the tool name, input arguments, and returning JSON.
2. **Sequential Steps**: Multiple completion turns are grouped under a single root trace.

## Running the Example
1. Ensure your Solas Trace backend is running (`localhost:8080`).
2. Run the script:
   ```bash
   python main.py
   ```
3. Navigate to the Solas Trace dashboard (`localhost:3000`) and locate the corresponding `trace-react-*` run to see the step logs.
