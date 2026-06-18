import {
  sanitizeEncryptedCode,
  sanitizeAddress,
  sanitizeHexString,
  validatePayloadSize,
} from '../src/utils/sanitization';
import { ValidationError } from '../src/utils/errors';

describe('Sanitization Utilities', () => {
  describe('sanitizeEncryptedCode', () => {
    it('should sanitize valid base64 code', () => {
      const code = '  dGVzdCBjb2Rl  ';
      const result = sanitizeEncryptedCode(code);
      expect(result).toBe('dGVzdCBjb2Rl');
    });

    it('should reject non-string input', () => {
      expect(() => sanitizeEncryptedCode(123 as any)).toThrow(ValidationError);
    });

    it('should reject code exceeding size limit', () => {
      const largeCode = Buffer.alloc(6 * 1024 * 1024).toString('base64');
      expect(() => sanitizeEncryptedCode(largeCode)).toThrow(ValidationError);
    });
  });

  describe('sanitizeAddress', () => {
    it('should normalize and uppercase address', () => {
      const address = '  gbrpyhil2ci3whzdtooqfc6eb4cgqofsnherreumaxlkeexdkbmfsvz7  ';
      const result = sanitizeAddress(address);
      expect(result).toBe('GBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNHERREUMAXLKEEXDKBMFSVZ7');
    });

    it('should reject non-string input', () => {
      expect(() => sanitizeAddress(123 as any)).toThrow(ValidationError);
    });

    it('should reject address exceeding max length', () => {
      const longAddress = 'G' + 'A'.repeat(1000);
      expect(() => sanitizeAddress(longAddress)).toThrow(ValidationError);
    });
  });

  describe('sanitizeHexString', () => {
    it('should normalize hex string to lowercase', () => {
      const hex = 'ABCDEF0123456789';
      const result = sanitizeHexString(hex, 'test');
      expect(result).toBe('abcdef0123456789');
    });

    it('should validate hex format', () => {
      expect(() => sanitizeHexString('xyz123', 'test')).toThrow(ValidationError);
    });

    it('should validate hex length if specified', () => {
      const hex = 'abcdef0123456789';
      expect(() => sanitizeHexString(hex, 'test', 16)).not.toThrow();
      expect(() => sanitizeHexString(hex, 'test', 8)).toThrow(ValidationError);
    });

    it('should reject non-string input', () => {
      expect(() => sanitizeHexString(123 as any, 'test')).toThrow(ValidationError);
    });
  });

  describe('validatePayloadSize', () => {
    it('should accept payload within size limit', () => {
      const payload = { test: 'data' };
      expect(() => validatePayloadSize(payload)).not.toThrow();
    });

    it('should reject oversized payload', () => {
      const largePayload = { data: 'x'.repeat(11 * 1024 * 1024) };
      expect(() => validatePayloadSize(largePayload)).toThrow(ValidationError);
    });
  });
});
