import axios from 'axios';
import * as crypto from 'crypto';

async function runTsAgent() {
  const traceId = `trace-ts-langchain-${crypto.randomBytes(4).toString('hex')}`;
  const rootSpanId = `span-ts-${crypto.randomBytes(3).toString('hex')}`;
  
  console.log(`Starting TS Langchain Agent...`);

  const payload = {
    resourceSpans: [{
      scopeSpans: [{
        spans: [{
          traceId,
          spanId: rootSpanId,
          name: "Langchain TS Agent",
          kind: "SPAN_KIND_INTERNAL",
          startTimeUnixNano: String(Date.now() * 1000000),
          endTimeUnixNano: String((Date.now() + 150) * 1000000),
          attributes: [
            { key: "span_kind", value: { stringValue: "Agent" } },
            { key: "framework", value: { stringValue: "typescript-langchain" } }
          ]
        }]
      }]
    }]
  };

  try {
    await axios.post('http://localhost:8080/api/v1/traces', payload);
    console.log(`[Success] Telemetry captured for trace ${traceId}`);
  } catch (err) {
    console.log('Telemetry collection skipped.');
  }
}
runTsAgent();
