import * as crypto from 'crypto';
import * as argon2 from 'argon2';

/**
 * OWASP recommended Argon2id configuration options for password hashing
 */
export const ARGON2_OPTIONS: argon2.Options & { raw?: boolean } = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,
  parallelism: 4,
};

/**
 * Calculates SHA-256 hex digest for a string
 */
export const sha256 = (content: string): string => {
  return crypto.createHash('sha256').update(content).digest('hex');
};

/**
 * Timing-safe string comparison for hex hashes to prevent timing attacks
 */
export const hashEquals = (hexA: string, hexB: string): boolean => {
  const bufA = Buffer.from(hexA, 'hex');
  const bufB = Buffer.from(hexB, 'hex');
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Generates a crypto-secure numeric OTP code of specified length (default 6)
 */
export const generateOtp = (length: number = 6): string => {
  const max = Math.pow(10, length);
  return crypto.randomInt(0, max).toString().padStart(length, '0');
};
