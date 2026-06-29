import OpenAI from 'openai';
import * as crypto from 'crypto';

// Initialize the OpenAI client pointing to the Solas Trace Proxy
const openai = new OpenAI({
  baseURL: 'http://localhost:8080/v1',
  apiKey: process.env.OPENAI_API_KEY || 'mock-openai-key'
});

async function runTsAgent() {
  const traceId = `trace-ts-${crypto.randomBytes(4).toString('hex')}`;
  const rootSpanId = `span-ts-root-${crypto.randomBytes(3).toString('hex')}`;
  
  console.log(`Starting TypeScript Agent... Trace ID: ${traceId}`);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a TS coding assistant.' },
        { role: 'user', content: 'Explain Generic Types in TypeScript in 1 sentence.' }
      ]
    }, {
      // Pass trace headers as options to link this request to the Solas Trace database
      headers: {
        'x-trace-id': traceId,
        'x-span-id': rootSpanId
      }
    });

    console.log('\nResponse:', response.choices[0].message.content);
    console.log(`\n[Success] Trace successfully captured in http://localhost:8080/api/traces/${traceId}`);
  } catch (error) {
    console.error('API Call failed:', error);
  }
}

runTsAgent();
