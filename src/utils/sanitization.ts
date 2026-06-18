import { ValidationError } from './errors';

const MAX_PAYLOAD_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_CODE_LENGTH = 5 * 1024 * 1024; // 5MB
const MAX_STRING_LENGTH = 1000;

export function sanitizeEncryptedCode(code: string): string {
  if (typeof code !== 'string') {
    throw new ValidationError('encryptedCode must be a string');
  }

  if (Buffer.byteLength(code, 'base64') > MAX_CODE_LENGTH) {
    throw new ValidationError(`Encrypted code exceeds maximum size of ${MAX_CODE_LENGTH} bytes`);
  }

  return code.trim();
}

export function sanitizeAddress(address: string): string {
  if (typeof address !== 'string') {
    throw new ValidationError('Address must be a string');
  }

  const sanitized = address.trim().toUpperCase();

  if (sanitized.length > MAX_STRING_LENGTH) {
    throw new ValidationError('Address exceeds maximum length');
  }

  return sanitized;
}

export function sanitizeHexString(hex: string, name: string, expectedLength?: number): string {
  if (typeof hex !== 'string') {
    throw new ValidationError(`${name} must be a string`);
  }

  const sanitized = hex.trim().toLowerCase();

  if (!/^[0-9a-f]+$/.test(sanitized)) {
    throw new ValidationError(`${name} must be a valid hex string`);
  }

  if (expectedLength && sanitized.length !== expectedLength) {
    throw new ValidationError(
      `${name} must be exactly ${expectedLength} characters (${expectedLength / 2} bytes)`
    );
  }

  return sanitized;
}

export function validatePayloadSize(payload: any): void {
  const size = JSON.stringify(payload).length;
  if (size > MAX_PAYLOAD_SIZE) {
    throw new ValidationError(`Payload size ${size} exceeds maximum of ${MAX_PAYLOAD_SIZE} bytes`);
  }
}
