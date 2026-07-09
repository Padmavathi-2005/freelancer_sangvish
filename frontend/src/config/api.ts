/**
 * Central API base URL.
 *
 * Production: https://freelancer.sangvish.com
 * Local dev:  http://localhost:5000
 *
 * To switch back to local dev, create a .env.local file with:
 *   NEXT_PUBLIC_API_URL=http://localhost:5000
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://freelancer.sangvish.com";

export const API_URL = `${API_BASE_URL}/api`;
