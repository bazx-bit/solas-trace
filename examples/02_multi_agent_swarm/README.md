# Multi-Agent Swarm Simulation Example

This example demonstrates how to track cooperative workflows involving multiple distinct AI agents (Director -> Researcher -> Writer) working on a single task.

## Features Illustrated
1. **Curved Tree DAG Visualization**: Each agent call acts as a child of the Director's root span, forming a branching tree hierarchy in the dashboard.
2. **Context Correlation**: How trace ID propagates across separate agent instances.

## Running the Example
1. Run the script:
   ```bash
   python main.py
   ```
2. Open the Solas Trace dashboard (`localhost:3000`) and view the tree structure of the generated trace.
