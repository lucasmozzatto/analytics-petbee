import type { Env } from './types';

// Module-level cache for access token
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Returns a valid Google OAuth2 access token for the GA4 Data API.
 * Uses Service Account JWT signed with Web Crypto API.
 * Caches the token in memory until near expiry.
 */
export async function getAccessToken(env: Env): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && now < tokenExpiresAt - 60) {
    return cachedToken;
  }

  const jwt = await buildSignedJWT(env, now);
  const token = await exchangeJWTForToken(jwt);

  cachedToken = token.access_token;
  tokenExpiresAt = now + token.expires_in;

  return cachedToken;
}

// ── JWT Construction ──

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const TOKEN_URI = 'https://oauth2.googleapis.com/token';

async function buildSignedJWT(env: Env, nowSeconds: number): Promise<string> {
  // Header
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  // Payload
  const payload = {
    iss: env.GOOGLE_CLIENT_EMAIL,
    scope: SCOPE,
    aud: TOKEN_URI,
    iat: nowSeconds,
    exp: nowSeconds + 3600,
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  // Import the private key and sign
  const privateKey = await importPrivateKey(env.GOOGLE_PRIVATE_KEY);
  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signingInput)
  );

  const encodedSignature = base64urlEncodeBuffer(signatureBuffer);
  return `${signingInput}.${encodedSignature}`;
}

async function exchangeJWTForToken(jwt: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwt,
  });

  const response = await fetch(TOKEN_URI, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google OAuth token exchange failed (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<TokenResponse>;
}

// ── Crypto Helpers ──

/**
 * Imports a PEM-encoded RSA private key for use with Web Crypto API.
 * Handles the literal \n characters that come from Cloudflare env vars.
 */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  // Replace literal \n with actual newlines
  const cleanPem = pem.replace(/\\n/g, '\n');

  // Strip PEM header, footer, and whitespace to get raw base64
  const pemBody = cleanPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');

  // Decode base64 to ArrayBuffer
  const binaryString = atob(pemBody);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return crypto.subtle.importKey(
    'pkcs8',
    bytes.buffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );
}

// ── Base64url Encoding ──

/**
 * Base64url-encodes a UTF-8 string (no padding).
 */
function base64urlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  return base64urlEncodeBuffer(bytes.buffer);
}

/**
 * Base64url-encodes an ArrayBuffer (no padding).
 */
function base64urlEncodeBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
