# Alerts & Notifications

When a Detector flags an anomaly, Solas Trace triggers an Alert. Alerts can be routed to various channels to ensure your team responds quickly.

## Supported Channels
1. **Slack / Discord**: Receive immediate webhook notifications with trace summaries.
2. **Email**: Daily digests or critical immediate alerts.
3. **PagerDuty**: For severe production issues (e.g., API key quota exceeded).

## Configuring Alert Rules

Alerts are configured via the Dashboard or directly in the database. You can define thresholds, cooldown periods, and severity levels.

```json
{
  "name": "High Cost Alert",
  "condition": "trace.cost > 1.50",
  "action": "webhook",
  "endpoint": "https://hooks.slack.com/services/..."
}
```
