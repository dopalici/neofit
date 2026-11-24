/**
 * Thin Production AI Coach Proxy (Vercel Serverless / Node / Cloudflare-adaptable)
 *
 * Keeps GEMINI_API_KEY strictly on the server (never shipped to browser or iOS bundle),
 * enforces sliding-window rate limits and token budgets, and automatically routes:
 *   - Quick check-ins / Q&A          -> gemini-2.5-flash-lite (ultra-low cost)
 *   - Deep programming / skill plans -> gemini-2.5-flash      (high reasoning quality)
 *
 * Environment variables:
 *   GEMINI_API_KEY       (required)
 *   COACH_ALLOWED_ORIGIN (optional, defaults to "*")
 */

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const RATE_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_IP_PER_MIN = 20;
const ipHits = new Map();

const DEEP_REASONING_REGEX =
  /\b(program|plan|week|periodiz|progression|skill ladder|handstand|muscle[- ]?up|deload|injury|pain|plateau|recomp|macro|protocol)\b/i;

function checkIpRateLimit(ip) {
  const now = Date.now();
  const timestamps = (ipHits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS_PER_IP_PER_MIN) {
    return { allowed: false, retryAfterSec: Math.ceil((RATE_WINDOW_MS - (now - timestamps[0])) / 1000) };
  }
  timestamps.push(now);
  ipHits.set(ip, timestamps);
  return { allowed: true, retryAfterSec: 0 };
}

function selectGeminiModel(query = "", requestedModel = "", mode = "auto") {
  if (requestedModel && /^gemini-2\.\d-(flash|flash-lite|pro)/i.test(requestedModel)) {
    return requestedModel;
  }
  if (mode === "deep" || query.length > 180 || DEEP_REASONING_REGEX.test(query)) {
    return "gemini-2.5-flash";
  }
  return "gemini-2.5-flash-lite";
}

export default async function handler(req, res) {
  const allowedOrigin = process.env.COACH_ALLOWED_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server missing GEMINI_API_KEY configuration" });
    return;
  }

  const ip =
    (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  const limit = checkIpRateLimit(ip);
  if (!limit.allowed) {
    res.status(429).json({
      error: `Rate limit exceeded. Try again in ${limit.retryAfterSec}s.`,
    });
    return;
  }

  try {
    const {
      query = "",
      systemPrompt = "",
      history = [],
      model: requestedModel = "",
      mode = "auto",
    } = req.body || {};

    if (!query || typeof query !== "string") {
      res.status(400).json({ error: "Missing required 'query' string" });
      return;
    }

    const selectedModel = selectGeminiModel(query, requestedModel, mode);
    const trimmedSystem = String(systemPrompt || "").slice(0, 7500);
    const contents = [
      ...(Array.isArray(history) ? history.slice(-6) : []).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: String(m.content || "").slice(0, 900) }],
      })),
      { role: "user", parts: [{ text: query.slice(0, 1200) }] },
    ];

    const upstream = await fetch(
      `${GEMINI_API_BASE}/${encodeURIComponent(selectedModel)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: trimmedSystem
            ? { parts: [{ text: trimmedSystem }] }
            : undefined,
          contents,
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 750,
          },
        }),
      }
    );

    if (!upstream.ok) {
      const errText = await upstream.text();
      res.status(upstream.status).json({
        error: `Gemini upstream error (${upstream.status})`,
        detail: errText.slice(0, 300),
      });
      return;
    }

    const data = await upstream.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!text) {
      res.status(502).json({ error: "Empty response from Gemini" });
      return;
    }

    res.status(200).json({
      content: text,
      model: selectedModel,
      usage: data?.usageMetadata || null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal proxy error" });
  }
}
