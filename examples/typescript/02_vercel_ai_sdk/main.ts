import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import * as crypto from 'crypto';

// 1. Configure the Vercel AI SDK OpenAI provider to point to the Solas Trace Proxy
const openai = createOpenAI({
  baseURL: 'http://localhost:8080/v1',
  apiKey: process.env.OPENAI_API_KEY || 'mock-openai-key',
});

async function runVercelAiAgent() {
  const traceId = `trace-vercel-${crypto.randomBytes(4).toString('hex')}`;
  const spanId = `span-vercel-root-${crypto.randomBytes(3).toString('hex')}`;
  
  console.log(`Starting Vercel AI SDK Agent... Trace ID: ${traceId}`);

  try {
    // 2. Generate text using the configured provider and pass headers
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: 'Explain what an API gateway does in 1 sentence.',
      headers: {
        'x-trace-id': traceId,
        'x-span-id': spanId,
      },
    });

    console.log('\nResponse:', text);
    console.log(`\n[Success] Trace successfully captured in http://localhost:8080/api/traces/${traceId}`);
  } catch (error) {
    console.error('Generation failed:', error);
  }
}

runVercelAiAgent();
