import {
  isValidEncryptedPayload,
  isValidBountyEvent,
  isValidStellarAddress,
  validateHexString,
} from '../src/utils/validation';

describe('Validation Utilities', () => {
  describe('isValidEncryptedPayload', () => {
    it('should validate correct encrypted payload', () => {
      const payload = {
        encryptedCode: 'dGVzdA==',
        iv: 'abcdefabcdefabcdefabcdefabcdefab',
        authTag: 'fedcbafedcbafedcbafedcbafedcbafe',
      };
      expect(isValidEncryptedPayload(payload)).toBe(true);
    });

    it('should reject payload with missing fields', () => {
      expect(isValidEncryptedPayload({ encryptedCode: 'test' })).toBe(false);
    });

    it('should reject payload with invalid iv length', () => {
      const payload = {
        encryptedCode: 'dGVzdA==',
        iv: 'abc',
        authTag: 'fedcbafedcbafedcbafedcbafedcbafe',
      };
      expect(isValidEncryptedPayload(payload)).toBe(false);
    });
  });

  describe('isValidBountyEvent', () => {
    it('should validate correct bounty event', () => {
      const event = {
        challengeId: 1,
        contributor: 'GBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNHERREUMAXLKEEXDKBMFSVZ7',
        decryptionKey: 'abcdef0123456789abcdef0123456789',
        txHash: 'abc123def456',
      };
      expect(isValidBountyEvent(event)).toBe(true);
    });

    it('should reject event with invalid Stellar address', () => {
      const event = {
        challengeId: 1,
        contributor: 'INVALID',
        decryptionKey: 'abcdef0123456789abcdef0123456789',
        txHash: 'abc123def456',
      };
      expect(isValidBountyEvent(event)).toBe(false);
    });

    it('should reject event with missing fields', () => {
      expect(isValidBountyEvent({ challengeId: 1 })).toBe(false);
    });
  });

  describe('isValidStellarAddress', () => {
    it('should validate valid Stellar address', () => {
      const address = 'GBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNHERREUMAXLKEEXDKBMFSVZ7';
      expect(isValidStellarAddress(address)).toBe(true);
    });

    it('should reject invalid format', () => {
      expect(isValidStellarAddress('INVALID')).toBe(false);
    });

    it('should reject wrong prefix', () => {
      const address = 'TBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNHERREUMAXLKEEXDKBMFSVZ7';
      expect(isValidStellarAddress(address)).toBe(false);
    });
  });

  describe('validateHexString', () => {
    it('should validate valid hex string', () => {
      expect(validateHexString('abcdef0123456789')).toBe(true);
    });

    it('should reject non-hex characters', () => {
      expect(validateHexString('xyzabc123')).toBe(false);
    });

    it('should validate hex length', () => {
      expect(validateHexString('abcdef', 6)).toBe(true);
      expect(validateHexString('abcdef', 8)).toBe(false);
    });
  });
});
