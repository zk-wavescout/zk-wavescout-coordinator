import { BountyClaimedEvent, EncryptedPayload } from '../types';

export function isValidEncryptedPayload(payload: any): payload is EncryptedPayload {
  return (
    payload &&
    typeof payload.encryptedCode === 'string' &&
    typeof payload.iv === 'string' &&
    typeof payload.authTag === 'string' &&
    payload.iv.length === 32 && // 16 bytes = 32 hex chars
    payload.authTag.length === 32
  );
}

export function isValidBountyEvent(event: any): event is BountyClaimedEvent {
  return (
    event &&
    typeof event.challengeId === 'number' &&
    typeof event.contributor === 'string' &&
    typeof event.decryptionKey === 'string' &&
    typeof event.txHash === 'string' &&
    event.contributor.startsWith('G') &&
    event.contributor.length === 56 // Stellar addresses are 56 chars
  );
}

export function isValidStellarAddress(address: string): boolean {
  return typeof address === 'string' && address.startsWith('G') && address.length === 56;
}

export function validateBase64(value: string): boolean {
  try {
    Buffer.from(value, 'base64');
    return true;
  } catch {
    return false;
  }
}

export function validateHexString(value: string, expectedLength?: number): boolean {
  const hexRegex = /^[0-9a-f]+$/i;
  if (!hexRegex.test(value)) return false;
  if (expectedLength && value.length !== expectedLength) return false;
  return true;
}
