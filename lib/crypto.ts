import crypto from 'crypto';

// Secret keys for cryptographic operations - fail closed if missing in production
function getCryptoSecret(envVarName: string, minLength: number = 32): string {
  const secret = process.env[envVarName];
  if (!secret || secret.length < minLength) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`[FATAL SECURITY ERROR] Missing or insecure ${envVarName} (min ${minLength} chars required). Halting.`);
    }
    console.warn(`[SECURITY WARNING] Missing or short ${envVarName}. Please ensure a secure 32+ char key is defined in .env.local.`);
    return 'insecure_dev_only_mock_secret_not_valid_for_production_use!';
  }
  return secret;
}

const SESSION_SECRET = getCryptoSecret('SESSION_SECRET', 32);
const ENCRYPTION_KEY = getCryptoSecret('TOKEN_ENCRYPTION_KEY', 32).slice(0, 32);

/**
 * Signs a payload string with HMAC-SHA256
 */
export function signPayload(payload: string): string {
  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(payload);
  return `${payload}.${hmac.digest('hex')}`;
}

/**
 * Verifies and parses an HMAC-SHA256 signed payload
 */
export function verifySignedPayload(signedPayload: string): string | null {
  if (!signedPayload || !signedPayload.includes('.')) return null;
  const lastDotIndex = signedPayload.lastIndexOf('.');
  const payload = signedPayload.slice(0, lastDotIndex);
  const signature = signedPayload.slice(lastDotIndex + 1);

  // Strict 64-character hex check to prevent Buffer.from parsing bypass
  if (signature.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(signature)) {
    return null;
  }

  const expectedHmac = crypto.createHmac('sha256', SESSION_SECRET);
  expectedHmac.update(payload);
  const expectedSignature = expectedHmac.digest('hex');

  // Constant-time comparison to prevent timing attacks
  const signatureBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  return payload;
}

/**
 * Encrypts sensitive plaintext (e.g. QuickBooks OAuth tokens) using AES-256-GCM
 */
export function encryptToken(plainText: string): string {
  if (!plainText) return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'utf-8'), iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  // Format: iv:ciphertext:authTag
  return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

/**
 * Decrypts an AES-256-GCM encrypted token string
 */
export function decryptToken(encryptedString: string): string {
  if (!encryptedString) return '';
  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    // Return raw if it was saved unencrypted in legacy mode
    return encryptedString;
  }

  const [ivHex, ciphertext, authTagHex] = parts;
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(ENCRYPTION_KEY, 'utf-8'),
      Buffer.from(ivHex, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Failed to decrypt token:', err);
    return encryptedString;
  }
}

/**
 * Generates a cryptographically random, signed OAuth state for CSRF prevention
 */
export function generateOAuthState(clientId: string, returnTo: string = 'dashboard'): string {
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = JSON.stringify({ clientId, returnTo, nonce, timestamp: Date.now() });
  return signPayload(Buffer.from(payload).toString('base64url'));
}

/**
 * Validates a signed OAuth state and ensures it is under 15 minutes old
 */
export function verifyOAuthState(signedState: string): { clientId: string; returnTo: string } | null {
  const rawBase64 = verifySignedPayload(signedState);
  if (!rawBase64) return null;

  try {
    const jsonStr = Buffer.from(rawBase64, 'base64url').toString('utf8');
    const data = JSON.parse(jsonStr);
    // 15-minute expiration
    if (Date.now() - data.timestamp > 15 * 60 * 1000) {
      console.warn('OAuth state expired');
      return null;
    }
    return { clientId: data.clientId, returnTo: data.returnTo || 'dashboard' };
  } catch {
    return null;
  }
}
