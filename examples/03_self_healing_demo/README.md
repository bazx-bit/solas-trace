# Self-Healing Diagnosis Simulation Example

This example demonstrates how to trace and diagnose failed agent steps inside the Solas Trace dashboard.

## Testing Steps
1. Run the script:
   ```bash
   python main.py
   ```
2. Navigate to the dashboard (`localhost:3000`).
3. Click the newly created red execution trace.
4. Click **"Generate RCA Report"** to run the Self-Healing diagnosis generator. It will examine the error message and produce a Markdown resolution plan!
5. Click **"Open Sandbox"** on the failed database node to edit and re-evaluate prompts/queries in the playground.
