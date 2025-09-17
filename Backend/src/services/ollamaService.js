// backend/src/services/ollamaService.js
// Robust Ollama client for embeddings, similarity scoring, and game target generation.
// - similarity(prompt, target) returns a number in [0,1]
// - generateTargets(count, excludeArray = [], theme = null) returns an array of `count` short, game-suitable phrases

const axios = require("axios");

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";
const OLLAMA_LLM_MODEL = process.env.OLLAMA_LLM_MODEL || "phi4-mini:latest";

/* ----------------- Math helpers ----------------- */
function dot(a, b) {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}
function norm(a) {
  return Math.sqrt(dot(a, a));
}
function cosineSim(a, b) {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return 0;
  const v = dot(a, b) / (na * nb);
  if (Number.isFinite(v)) return Math.max(0, Math.min(1, v));
  return 0;
}

/* ----------------- Embedding utilities ----------------- */
/** Try a few common payload shapes when calling Ollama embeddings. Returns embedding array or throws. */
async function tryEmbed(text) {
  const url = `${OLLAMA_BASE_URL}/api/embeddings`;
  const tryBodies = [
    { model: OLLAMA_EMBED_MODEL, input: text },
    { model: OLLAMA_EMBED_MODEL, prompt: text },
    { model: OLLAMA_EMBED_MODEL, text }
  ];

  for (const body of tryBodies) {
    try {
      const resp = await axios.post(url, body, { timeout: 20000 });
      const d = resp && resp.data ? resp.data : {};

      if (Array.isArray(d.embedding)) return d.embedding;
      if (Array.isArray(d.data) && d.data[0] && Array.isArray(d.data[0].embedding)) return d.data[0].embedding;
      if (Array.isArray(d.embeddings) && Array.isArray(d.embeddings[0])) return d.embeddings[0];
      if (d.result && Array.isArray(d.result.embedding)) return d.result.embedding;
    } catch (e) {
      // continue to next attempt
    }
  }
  throw new Error("Embeddings not available");
}

/** Score using embeddings; returns number 0..1 or null if embeddings unavailable */
async function scoreWithEmbeddings(a, b) {
  try {
    const [ea, eb] = await Promise.all([tryEmbed(a), tryEmbed(b)]);
    const sim = cosineSim(ea, eb);
    return Math.max(0, Math.min(1, sim));
  } catch (err) {
    return null;
  }
}

/* ----------------- LLM extract helpers ----------------- */
/** Defensive extractor for various LLM response shapes */
function extractOutputText(respData) {
  if (!respData) return null;
  if (typeof respData.response === "string") return respData.response;
  if (typeof respData.output === "string") return respData.output;
  if (typeof respData.text === "string") return respData.text;

  if (Array.isArray(respData.choices) && respData.choices[0]) {
    const c = respData.choices[0];
    if (typeof c.text === "string") return c.text;
    if (c.message && typeof c.message.content === "string") return c.message.content;
  }

  if (Array.isArray(respData.output) && respData.output[0]) {
    const o0 = respData.output[0];
    if (Array.isArray(o0.content) && o0.content[0] && typeof o0.content[0].text === "string") return o0.content[0].text;
    if (typeof o0.content === "string") return o0.content;
  }

  try {
    return JSON.stringify(respData).slice(0, 400);
  } catch (e) {
    return null;
  }
}

/* ----------------- LLM-based numeric scorer fallback ----------------- */
/** Ask the LLM to return a single number 0..1 for similarity */
async function scoreWithLLM(a, b) {
  const url = `${OLLAMA_BASE_URL}/api/generate`;
  // strict instruction to only return a number
  const prompt = `You are a strict similarity rater.
Compare the semantic similarity between these two short phrases labeled A and B.
Return ONLY a single number between 0.0 and 1.0 (inclusive), using a decimal if needed. Do NOT provide any words or explanation.

A: "${a}"
B: "${b}"`;

  try {
    const resp = await axios.post(url, {
      model: OLLAMA_LLM_MODEL,
      prompt,
      stream: false
    }, { timeout: 25000 });

    const text = extractOutputText(resp && resp.data ? resp.data : null) || "";
    const m = String(text).match(/([01](?:\.\d+)?)/);
    if (m) {
      const val = parseFloat(m[1]);
      if (Number.isFinite(val)) return Math.max(0, Math.min(1, val));
    }
    return 0;
  } catch (err) {
    return 0;
  }
}

/** Public similarity function: returns 0..1 */
async function similarity(prompt, target) {
  const safeA = prompt == null ? "" : String(prompt);
  const safeB = target == null ? "" : String(target);

  const embScore = await scoreWithEmbeddings(safeA, safeB);
  if (embScore !== null) return Math.max(0, Math.min(1, embScore));

  // fallback to LLM numeric rating
  return await scoreWithLLM(safeA, safeB);
}

/* ----------------- Helpers for target generation ----------------- */
/** Remove markdown fences and trim */
function stripFences(text) {
  if (!text && text !== "") return "";
  let s = String(text);
  // remove code fences
  s = s.replace(/```(?:\w+)?\s*/g, "").replace(/\s*```/g, "");
  // remove leading/trailing quotes
  s = s.trim().replace(/^["'“”]+|["'“”]+$/g, "").trim();
  return s;
}

/** Try to parse JSON array out of raw text, robustly */
function tryParseJsonArray(rawText) {
  if (!rawText) return null;
  let t = rawText.trim();
  // strip obvious markdown fences
  t = stripFences(t);
  // sometimes model returns extra text; try to find the first [ ... ] block
  const firstBracket = t.indexOf("[");
  const lastBracket = t.lastIndexOf("]");
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    const candidate = t.slice(firstBracket, lastBracket + 1);
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) return parsed.map(s => String(s).trim()).filter(Boolean);
    } catch (e) {
      // ignore parse error
    }
  }

  // fallback: try to parse t as JSON directly
  try {
    const parsed2 = JSON.parse(t);
    if (Array.isArray(parsed2)) return parsed2.map(s => String(s).trim()).filter(Boolean);
  } catch (e) {
    // not JSON
  }

  return null;
}

/* ----------------- Target generation ----------------- */
/**
 * generateTargets(count = 3, excludeArray = [], theme = null)
 * - count: number of targets requested (1..10)
 * - excludeArray: array of phrases to avoid (case-insensitive)
 * - theme: optional theme hint (e.g., "sci-fi", "food", "fantasy")
 *
 * Returns: Promise<Array<string>> of length `count` (falls back to safe defaults)
 */
async function generateTargets(count = 3, excludeArray = [], theme = null) {
  count = Math.max(1, Math.min(10, Number(count) || 3));
  const excludeLower = new Set((excludeArray || []).map(x => String(x).toLowerCase()));

  // prompt tuned for game-suitable, guessable targets
  const seed = Date.now() + "-" + Math.floor(Math.random() * 10000);
  const themeNote = theme ? ` Theme: ${String(theme)}.` : "";
  const prompt = `You are an assistant that generates short, game-friendly target phrases.
Targets will be used in a 2-player prompt-guessing duel. Each target must be:
- Concrete and visual (objects, scenes, or short concepts people recognize).
- Guessable: common or easily describable (avoid extremely obscure references).
- Concise: 2 to 6 words, typically noun phrases or short scene descriptions.
- Not proper names, brands, or copyrighted characters.
- Not instructions, questions, or sentences — just short phrases.
- Do NOT include code fences, explanation, or extra text.

Give EXACTLY ${count} UNIQUE targets as a JSON array of strings and nothing else.${themeNote}
Examples of valid targets: ["deserted island", "haunted library", "robot chef", "stormy ocean"].
Seed: ${seed}`;

  const url = `${OLLAMA_BASE_URL}/api/generate`;

  // helper to call the model
  async function askModelForTargets(p) {
    const resp = await axios.post(url, {
      model: OLLAMA_LLM_MODEL,
      prompt: p,
      stream: false
    }, { timeout: 30000 });
    return extractOutputText(resp && resp.data ? resp.data : null) || "";
  }

  try {
    let raw = await askModelForTargets(prompt);
    raw = stripFences(raw);

    // Try JSON parse first
    let candidates = tryParseJsonArray(raw) || [];

    // If JSON parse failed, split by lines and commas
    if (!candidates || candidates.length === 0) {
      const lines = raw.split(/\r?\n|,\s*/).map(s => s.trim()).filter(Boolean);
      candidates = lines.map(s => s.replace(/^["'“”]+|["'“”]+$/g, "").trim()).filter(Boolean);
    }

    // Dedupe and apply excludes and basic length constraints
    const seen = new Set();
    const filtered = [];
    for (let c of candidates) {
      if (!c) continue;
      c = c.trim();
      if (c.length === 0) continue;
      // drop items that are too long or single chars
      const words = c.split(/\s+/).filter(Boolean).length;
      if (words < 1 || words > 12) continue;
      const low = c.toLowerCase();
      if (seen.has(low)) continue;
      if (excludeLower.has(low)) continue;
      // remove trailing punctuation
      c = c.replace(/^[\s\-\–\—:]+|[\s\-\–\—:]+$/g, "").trim();
      seen.add(low);
      filtered.push(c);
      if (filtered.length >= count) break;
    }

    // If not enough candidates, do up to two short follow-up calls asking only for remaining number
    let attempts = 0;
    while (filtered.length < count && attempts < 2) {
      attempts++;
      const need = count - filtered.length;
      const followPrompt = `Provide ${need} more UNIQUE short target phrases (2-6 words) as a JSON array. Do not include any explanation. Seed: ${seed}-${attempts}`;
      try {
        let r2 = await askModelForTargets(followPrompt);
        r2 = stripFences(r2);
        const more = tryParseJsonArray(r2) || r2.split(/\r?\n|,\s*/).map(s => s.trim()).filter(Boolean);
        for (let m of more) {
          if (!m) continue;
          m = m.trim().replace(/^["'“”]+|["'“”]+$/g, "").trim();
          const low = m.toLowerCase();
          if (seen.has(low) || excludeLower.has(low)) continue;
          const words = m.split(/\s+/).filter(Boolean).length;
          if (words < 1 || words > 12) continue;
          seen.add(low);
          filtered.push(m);
          if (filtered.length >= count) break;
        }
      } catch (e) {
        break;
      }
    }

    // final fallback list (non-repeating)
    const fallbacks = [
      "mysterious sunset on the sea",
      "ancient stone temple",
      "neon city skyline",
      "lonely lighthouse at dusk",
      "hidden garden behind ruins",
      "foggy mountain pass",
      "busy street market",
      "small spacecraft cockpit",
      "old wooden bridge",
      "abandoned carnival"
    ];
    let fi = 0;
    while (filtered.length < count && fi < fallbacks.length) {
      const f = fallbacks[fi++];
      if (!seen.has(f.toLowerCase()) && !excludeLower.has(f.toLowerCase())) {
        filtered.push(f);
        seen.add(f.toLowerCase());
      }
    }

    return filtered.slice(0, count);
  } catch (err) {
    // On error, return safe fallbacks
    const fallbacks = [
      "mysterious sunset on the sea",
      "ancient stone temple",
      "neon city skyline"
    ].slice(0, count);
    return fallbacks;
  }
}

module.exports = {
  similarity,
  generateTargets
};
