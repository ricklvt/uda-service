import OpenAI from 'openai';
import { getLogger } from './logger.ts';

const logger = getLogger('openai');

const DEFAULT_MODEL = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';

let _client: OpenAI | undefined;

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is undefined.');
    }
    const baseURL = process.env.OPENAI_BASE_URL?.trim() || undefined;
    _client = new OpenAI({ apiKey, baseURL });
    logger.info('OpenAI client initialized', { baseURL: baseURL ?? 'default' });
  }
  return _client;
}

export async function complete(prompt: string): Promise<string> {
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [{ role: 'user', content: prompt }],
  });
  return response.choices[0]?.message.content ?? '';
}
