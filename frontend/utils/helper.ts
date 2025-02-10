/**
 * Constructs a fully qualified URL by combining environment-specific base URLs with an optional path.
 * Prioritizes URLs in the following order:
 * 1. NEXT_PUBLIC_SITE_URL
 * 2. NEXT_PUBLIC_VERCEL_URL
 * 3. Fallback to localhost:3000
 *
 * @param {string} [path=''] - Optional path to append to the base URL
 * @returns {string} Complete URL with proper formatting and protocol
 *
 * @example
 * ```ts
 * // With NEXT_PUBLIC_SITE_URL = "example.com"
 * getURL("api/users") // Returns "https://example.com/api/users"
 * getURL() // Returns "https://example.com"
 *
 * // With no env variables set
 * getURL("test") // Returns "http://localhost:3000/test"
 * ```
 *
 * @remarks
 * - Automatically adds https:// if protocol is missing
 * - Removes trailing slashes from base URL
 * - Removes leading slashes from path
 * - Handles empty/undefined path gracefully
 * - Environment variable aware
 * - Safe for both development and production
 * - Normalizes URL format
 * - Supports path segments
 * - Vercel deployment compatible
 */
export const getURL = (path = ''): string => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.trim() !== ''
      ? process.env.NEXT_PUBLIC_SITE_URL
      : process?.env?.NEXT_PUBLIC_VERCEL_URL && process.env.NEXT_PUBLIC_VERCEL_URL.trim() !== ''
        ? process.env.NEXT_PUBLIC_VERCEL_URL
        : 'http://localhost:3000/';

  url = url.replace(/\/+$/, '');
  url = url.includes('http') ? url : `https://${url}`;
  path = path.replace(/^\/+/, '');

  return path ? `${url}/${path}` : url;
};