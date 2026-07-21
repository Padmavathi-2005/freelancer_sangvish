/**
 * AI Middleware
 * Runs before every AI endpoint (chat, gig search, job search).
 *
 * Stack:
 *  1. aiRequestLogger    - Logs every request (IP, user, timestamp, prompt-length)
 *  2. aiRateLimiter      - Sliding-window rate limit per IP  (30 req / 1 min)
 *  3. aiSoftAuth         - Optionally attaches req.user from JWT (non-blocking)
 *  4. aiPromptSanitizer  - Validates & sanitizes the prompt before the handler runs
 */

import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey";

// ─── 1. Request Logger ──────────────────────────────────────────────────────
export const aiRequestLogger = (req, res, next) => {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.ip;
  const userId = req.user?.user_id || "anonymous";
  const promptLen = req.body?.prompt?.length ?? req.query?.q?.length ?? 0;

  console.log(
    `[AI] ${new Date().toISOString()} | IP:${ip} | User:${userId} | Method:${req.method} | Path:${req.path} | PromptLen:${promptLen}`
  );

  // Attach request metadata for downstream logging
  req.aiMeta = { ip, userId, promptLen, startedAt: Date.now() };

  // Log response time when the response finishes
  res.on("finish", () => {
    const duration = Date.now() - req.aiMeta.startedAt;
    console.log(
      `[AI] ${new Date().toISOString()} | IP:${ip} | Status:${res.statusCode} | ${duration}ms`
    );
  });

  next();
};

// ─── 2. Rate Limiter ────────────────────────────────────────────────────────
// Simple in-memory sliding window — swap for Redis in production.
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX       = 30;     // max requests per window per IP

const rateLimitStore = new Map(); // ip → [timestamp, ...]

export const aiRateLimiter = (req, res, next) => {
  const ip = req.aiMeta?.ip || req.ip;
  const now = Date.now();

  let timestamps = rateLimitStore.get(ip) || [];
  // Prune entries outside the current window
  timestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (timestamps.length >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil(
      (timestamps[0] + RATE_LIMIT_WINDOW_MS - now) / 1000
    );
    console.warn(`[AI] Rate limit hit for IP:${ip}`);
    return res.status(429).json({
      error: `Too many requests. You may send up to ${RATE_LIMIT_MAX} AI requests per minute. Please retry in ${retryAfter}s.`,
      retryAfterSeconds: retryAfter,
    });
  }

  timestamps.push(now);
  rateLimitStore.set(ip, timestamps);

  // Periodically clean the store to prevent memory leaks
  if (rateLimitStore.size > 5000) {
    for (const [key, stamps] of rateLimitStore) {
      if (stamps.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) {
        rateLimitStore.delete(key);
      }
    }
  }

  next();
};

// ─── 3. Soft Auth (optional JWT — never blocks anonymous users) ─────────────
export const aiSoftAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return next(); // anonymous — proceed

  const token = authHeader.split(" ")[1];
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Resolve admin user_id from users table if needed
    if (decoded.admin_id && !decoded.user_id) {
      const userCheck = await pool.query(
        "SELECT user_id FROM users WHERE email = $1",
        [decoded.email]
      );
      if (userCheck.rows.length > 0) {
        decoded.user_id = userCheck.rows[0].user_id;
      }
    }

    req.user = decoded;
    if (req.aiMeta) req.aiMeta.userId = decoded.user_id || decoded.admin_id;
  } catch (_err) {
    // Invalid token — treat as anonymous, don't block
    console.warn("[AI] Invalid JWT in soft-auth, continuing as anonymous.");
  }

  next();
};

// ─── 4. Prompt Sanitizer ────────────────────────────────────────────────────
const MAX_PROMPT_LENGTH = 2000; // chars

// Simple regex-based injection / abuse pattern detection
const BLOCKED_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+instructions?/i,
  /act\s+as\s+(if\s+you('re|\s+are)\s+)?(not|no longer)/i,
  /jailbreak/i,
  /dan\s+mode/i,
  /pretend\s+you\s+(are|have\s+no)/i,
  /disregard\s+(your|all)\s+(prior|previous|system|instructions?)/i,
];

export const aiPromptSanitizer = (req, res, next) => {
  // Only validate body prompts (not query-string searches for /gigs or /jobs)
  if (req.method !== "POST") return next();

  const { prompt } = req.body || {};

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "A non-empty prompt string is required." });
  }

  const trimmed = prompt.trim();

  // Length guard
  if (trimmed.length === 0) {
    return res.status(400).json({ error: "Prompt cannot be empty." });
  }

  if (trimmed.length > MAX_PROMPT_LENGTH) {
    return res.status(400).json({
      error: `Prompt is too long. Maximum allowed length is ${MAX_PROMPT_LENGTH} characters (received ${trimmed.length}).`,
    });
  }

  // Injection / jailbreak detection
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      console.warn(`[AI] Blocked prompt injection attempt from IP:${req.aiMeta?.ip}`);
      return res.status(400).json({
        error: "Your message contains content that is not allowed by our AI usage policy.",
      });
    }
  }

  // Write the sanitized prompt back so the controller always gets a clean value
  req.body.prompt = trimmed;

  next();
};

// ─── 5. Validate AI API Key ─────────────────────────────────────────────────
export const validateAiApiKey = (req, res, next) => {
  const apiKey = req.headers["x-ai-api-key"];
  const expectedApiKey = process.env.AI_API_KEY;

  if (!expectedApiKey) {
    console.error("❌ AI_API_KEY environment variable is not set in the backend env configuration.");
    return res.status(500).json({ error: "Backend service security configuration is missing." });
  }

  if (!apiKey || apiKey !== expectedApiKey) {
    console.warn(`[AI] Unauthorized request blocked from IP:${req.ip}`);
    return res.status(403).json({ error: "Forbidden. Invalid or missing AI API Key." });
  }

  next();
};

// ─── Convenience composed stack ─────────────────────────────────────────────
// Usage in routes:  router.post("/chat", aiChatMiddleware, handler)
export const aiChatMiddleware = [
  aiRequestLogger,
  aiRateLimiter,
  aiSoftAuth,
  aiPromptSanitizer,
];

// For read-only search endpoints (secured by API key, rate-limited, logged, soft-authed)
export const aiSearchMiddleware = [
  aiRequestLogger,
  aiRateLimiter,
  validateAiApiKey,
  aiSoftAuth,
];
