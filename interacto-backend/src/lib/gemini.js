import { GoogleGenerativeAI } from '@google/generative-ai';

export const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.warn('Missing GOOGLE_API_KEY environment variable. Gemini requests will fail until this is set.');
}

const genai = new GoogleGenerativeAI(apiKey || '');
const requestOptions = { apiVersion: 'v1' };
const defaultModels = [
  process.env.GENAI_MODEL || 'models/gemini-2.5-flash',
  'models/gemini-2.5-pro',
  'models/gemini-2.5-flash-lite',
  'models/gemini-3.1-flash-lite',
  'models/gemini-2.0-flash'
];

export async function generateText(prompt, maxOutputTokens = 600) {
  if (!apiKey) {
    throw new Error('Missing GOOGLE_API_KEY. Set the key in your backend environment.');
  }

  let lastError;
  for (const modelName of defaultModels) {
    try {
      const model = genai.getGenerativeModel({ model: modelName }, requestOptions);
      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens, temperature: 0.2 }
      });
      return response.response.text();
    } catch (error) {
      lastError = error;
      const status = error?.status || error?.response?.status;
      const message = error?.message || error?.response?.data?.error || '';

      const isTransient = status === 503 || status === 429 || /high demand/i.test(message) || /quota exceeded/i.test(message);
      if (!isTransient) {
        throw error;
      }
    }
  }

  throw lastError;
}

export function extractJsonObject(text) {
  const content = String(text)
    .replace(/```(?:json)?/gi, '')
    .replace(/\r?\n/g, '\n')
    .trim();

  let depth = 0;
  let start = -1;
  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    if (char === '{') {
      if (depth === 0) {
        start = i;
      }
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        return content.slice(start, i + 1);
      }
    }
  }
  return null;
}

export function parseJSON(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const candidate = extractJsonObject(value);
  if (!candidate) {
    return null;
  }

  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

export function looksLikeRawJson(text) {
  return /"(title|slides|content|name|body|description|questions)"\s*:/.test(text) || /^[{[]/.test(text.trim());
}
