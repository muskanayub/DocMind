/**
 * Thin wrapper around the Gemini REST API (embeddings + text generation).
 * Uses plain fetch (Node 18+), so there is no SDK to keep in sync.
 * To switch providers, only this file needs to change.
 */
const BASE = 'https://generativelanguage.googleapis.com/v1beta';

const chatModel = () => process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash';
const embedModel = () => process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001';
const dimensions = () => Number(process.env.EMBED_DIMENSIONS || 768);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callGemini(path, body, attempt = 0) {
  if (!process.env.GEMINI_API_KEY) {
    throw Object.assign(new Error('GEMINI_API_KEY is not set on the server'), { status: 500 });
  }

  const res = await fetch(`${BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify(body),
  });

  if (res.ok) return res.json();

  // Retry rate limits and transient server errors with exponential backoff
  if ((res.status === 429 || res.status >= 500) && attempt < 4) {
    await sleep(1000 * 2 ** attempt);
    return callGemini(path, body, attempt + 1);
  }

  const detail = (await res.text()).slice(0, 300);
  console.error(`AI API error ${res.status}: ${detail}`);
  const message =
    res.status === 429
      ? 'The AI service is busy or the free quota is used up. Try again in a minute.'
      : 'The AI service returned an error. Check the server logs.';
  throw Object.assign(new Error(message), { status: 502 });
}

/** taskType: 'RETRIEVAL_DOCUMENT' when indexing, 'RETRIEVAL_QUERY' when searching */
async function embedTexts(texts, taskType = 'RETRIEVAL_DOCUMENT') {
  const model = embedModel();
  const out = [];

  for (let i = 0; i < texts.length; i += 50) {
    const batch = texts.slice(i, i + 50);
    const data = await callGemini(`models/${model}:batchEmbedContents`, {
      requests: batch.map((text) => ({
        model: `models/${model}`,
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: dimensions(),
      })),
    });
    out.push(...data.embeddings.map((e) => e.values));
  }
  return out;
}

/** history: [{ role: 'user' | 'assistant', content }] */
async function generateText({ system, history = [], prompt }) {
  const past = history.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  while (past.length && past[0].role !== 'user') past.shift();

  const data = await callGemini(`models/${chatModel()}:generateContent`, {
    systemInstruction: { parts: [{ text: system }] },
    contents: [...past, { role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2 },
  });

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim();
  return text || 'I could not produce an answer for that. Try rephrasing the question.';
}

module.exports = { embedTexts, generateText };
