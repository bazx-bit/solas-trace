# Getting Started with Detectors

To start using Detectors in Solas Trace:

1. **Enable Background Workers**: Ensure your `solas-trace-backend` is running. The Tokio workers are enabled by default.
2. **Configure ML Models** (Optional): If using the ML anomaly detector, ensure the Python worker (`Dockerfile.detector`) is running and connected to the backend.
3. **Create a Rule**: Navigate to **Detectors > Rules** in the dashboard and set up your first condition (e.g., Latency > 10s).
4. **Test the Detector**: Use the CLI to simulate a trace that violates the rule:
   `solas test simulate --latency 12s`
