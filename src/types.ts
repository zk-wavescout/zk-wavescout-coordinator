export interface EncryptedPayload {
  encryptedCode: string; // Base64 ciphertext
  iv: string;            // 16-byte hex IV
  authTag: string;       // 16-byte hex AES-GCM auth tag
}

export interface BountyClaimedEvent {
  challengeId: number;
  contributor: string;       // Stellar public key
  decryptionKey: string;     // AES key material revealed on-chain
  txHash: string;
}

export interface SubmissionRecord {
  payload: EncryptedPayload;
  createdAt: number;
  txHash?: string;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  requestId?: string;
  timestamp: string;
}

export interface Metrics {
  submissionsReceived: number;
  submissionsProcessed: number;
  submissionsFailed: number;
  decryptionsSuccessful: number;
  decryptionsFailed: number;
  prsOpened: number;
  prsFailedToOpen: number;
  averageProcessingTimeMs: number;
}
