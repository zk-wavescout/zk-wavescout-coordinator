/**
 * Constants for the coordinator application
 */

// Buffer and size limits
export const LIMITS = {
  MAX_PAYLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_CODE_LENGTH: 5 * 1024 * 1024,    // 5MB
  MAX_STRING_LENGTH: 1000,
};

// Submission management
export const SUBMISSION = {
  TTL_MS: 24 * 60 * 60 * 1000,           // 24 hours
  CLEANUP_INTERVAL_MS: 60 * 60 * 1000,   // 1 hour
  MAX_TRACKED_EVENTS: 10000,
};

// Stellar configuration
export const STELLAR = {
  MAX_RETRIES: 5,
  INITIAL_RETRY_DELAY_MS: 1000,
  MAX_RETRY_DELAY_MS: 30000,
  HORIZON_URL: 'https://horizon-testnet.stellar.org',
};

// Rate limiting (per minute)
export const RATE_LIMITS = {
  SUBMISSIONS_PER_MINUTE: 100,
  METRICS_PER_MINUTE: 1000,
};

// Server graceful shutdown
export const SERVER = {
  SHUTDOWN_TIMEOUT_MS: 30000,
};

// Stellar address validation
export const STELLAR_ADDRESS = {
  PREFIX: 'G',
  LENGTH: 56,
};

// Encryption
export const ENCRYPTION = {
  ALGORITHM: 'aes-256-gcm',
  IV_LENGTH: 16,
  AUTH_TAG_LENGTH: 16,
  SCRYPT_KEYLEN: 32,
};

// Hash format validation
export const FORMAT = {
  HEX_IV_LENGTH: 32,      // 16 bytes in hex
  HEX_AUTH_TAG_LENGTH: 32, // 16 bytes in hex
  HEX_SALT_LENGTH: 64,     // 32 bytes in hex
};
