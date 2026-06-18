import {
  CoordinatorError,
  ValidationError,
  DecryptionError,
  GitHubError,
  StellarError,
  handleError,
} from '../src/utils/errors';

describe('Error Handling Utilities', () => {
  describe('CoordinatorError', () => {
    it('should create error with correct properties', () => {
      const error = new CoordinatorError('Test error', 'TEST_CODE', 400);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(400);
    });

    it('should default to status code 500', () => {
      const error = new CoordinatorError('Test error', 'TEST_CODE');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('ValidationError', () => {
    it('should have correct status code', () => {
      const error = new ValidationError('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('DecryptionError', () => {
    it('should have correct status code', () => {
      const error = new DecryptionError('Decryption failed');
      expect(error.code).toBe('DECRYPTION_ERROR');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('GitHubError', () => {
    it('should store original error', () => {
      const originalError = new Error('Original');
      const error = new GitHubError('GitHub failed', originalError);
      expect(error.originalError).toBe(originalError);
      expect(error.code).toBe('GITHUB_ERROR');
    });
  });

  describe('StellarError', () => {
    it('should store original error', () => {
      const originalError = new Error('Original');
      const error = new StellarError('Stellar failed', originalError);
      expect(error.originalError).toBe(originalError);
      expect(error.code).toBe('STELLAR_ERROR');
    });
  });

  describe('handleError', () => {
    it('should handle CoordinatorError', () => {
      const error = new ValidationError('Invalid');
      const result = handleError(error);
      expect(result.code).toBe('VALIDATION_ERROR');
      expect(result.statusCode).toBe(400);
    });

    it('should handle generic Error', () => {
      const error = new Error('Generic error');
      const result = handleError(error);
      expect(result.code).toBe('INTERNAL_ERROR');
      expect(result.statusCode).toBe(500);
    });

    it('should handle unknown error', () => {
      const result = handleError('string error');
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.statusCode).toBe(500);
    });
  });
});
