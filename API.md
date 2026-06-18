# API Documentation

## Overview

The ZK-WaveScout Coordinator exposes three main API endpoints for health checks, metrics collection, and submission management.

## Response Format

All responses follow a standard envelope format:

```json
{
  "status": "success" | "error",
  "data": { /* response data */ },
  "error": { /* error details if status is error */ },
  "requestId": "req_...",
  "timestamp": "2026-06-18T22:43:35.666Z"
}
```

## Endpoints

### 1. Health Check

**GET** `/health`

Returns the health status of the coordinator.

**Response:**
```json
{
  "status": "success",
  "data": {
    "status": "healthy"
  },
  "requestId": "req_1718744615666_a1b2c3d4e",
  "timestamp": "2026-06-18T22:43:35.666Z"
}
```

**Status Codes:**
- `200` - Service is healthy

---

### 2. Metrics

**GET** `/metrics`

Returns collected metrics about submissions and processing.

**Response:**
```json
{
  "status": "success",
  "data": {
    "submissionsReceived": 42,
    "submissionsProcessed": 38,
    "submissionsFailed": 2,
    "decryptionsSuccessful": 38,
    "decryptionsFailed": 0,
    "prsOpened": 38,
    "prsFailedToOpen": 0,
    "averageProcessingTimeMs": 245.3
  },
  "requestId": "req_1718744615666_a1b2c3d4e",
  "timestamp": "2026-06-18T22:43:35.666Z"
}
```

**Status Codes:**
- `200` - Metrics retrieved successfully

---

### 3. Submit Encrypted Solution

**POST** `/api/submissions/upload`

Buffers an encrypted solution before the on-chain bounty claim is finalized.

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "contributorAddress": "GBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNHERREUMAXLKEEXDKBMFSVZ7",
  "encryptedCode": "dGVzdCBjb2Rl...",
  "iv": "abcdefabcdefabcdefabcdefabcdefab",
  "authTag": "fedcbafedcbafedcbafedcbafedcbafe"
}
```

**Field Descriptions:**
- `contributorAddress` (string): Stellar public key of the contributor (56 chars, starts with 'G')
- `encryptedCode` (string): Base64-encoded AES-256-GCM encrypted solution code
- `iv` (string): Initialization vector (16 bytes as 32-char hex string)
- `authTag` (string): AES-GCM authentication tag (16 bytes as 32-char hex string)

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "status": "encrypted_payload_buffered"
  },
  "requestId": "req_1718744615666_a1b2c3d4e",
  "timestamp": "2026-06-18T22:43:35.666Z"
}
```

**Error Response (400):**
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid Stellar address format"
  },
  "requestId": "req_1718744615666_a1b2c3d4e",
  "timestamp": "2026-06-18T22:43:35.666Z"
}
```

**Status Codes:**
- `200` - Submission buffered successfully
- `400` - Validation error (missing or invalid fields)
- `429` - Rate limit exceeded

**Validation Rules:**
- All fields are required
- `contributorAddress` must be a valid Stellar address
- `iv` must be exactly 32 hex characters (16 bytes)
- `authTag` must be exactly 32 hex characters (16 bytes)
- `encryptedCode` must be valid Base64
- Total payload size must not exceed 10 MB

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `INVALID_ADDRESS` | 400 | Invalid Stellar address |
| `INVALID_PAYLOAD` | 400 | Invalid encrypted payload structure |
| `MISSING_FIELDS` | 400 | Required fields are missing |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `DECRYPTION_ERROR` | 500 | Failed to decrypt solution |
| `GITHUB_ERROR` | 500 | GitHub API error |
| `STELLAR_ERROR` | 500 | Stellar API error |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Rate Limiting

The API implements rate limiting per IP address:

- **Submissions endpoint** (`/api/submissions/upload`): 100 requests per minute
- **Metrics endpoint** (`/metrics`): 1000 requests per minute

When rate limit is exceeded, the response includes a 429 status with an error message.

---

## Request ID Tracking

Every request receives a unique request ID which is:
1. Generated from the current timestamp and random value if not provided
2. Included in the response under `requestId`
3. Returned in the `X-Request-ID` response header

Use this ID for debugging and correlating logs.

---

## Examples

### cURL

**Submit Solution:**
```bash
curl -X POST http://localhost:5000/api/submissions/upload \
  -H "Content-Type: application/json" \
  -d '{
    "contributorAddress": "GBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNHERREUMAXLKEEXDKBMFSVZ7",
    "encryptedCode": "dGVzdCBjb2Rl",
    "iv": "abcdefabcdefabcdefabcdefabcdefab",
    "authTag": "fedcbafedcbafedcbafedcbafedcbafe"
  }'
```

**Check Health:**
```bash
curl http://localhost:5000/health
```

**Get Metrics:**
```bash
curl http://localhost:5000/metrics
```

### JavaScript/Node.js

```javascript
const response = await fetch('http://localhost:5000/api/submissions/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contributorAddress: 'GBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNHERREUMAXLKEEXDKBMFSVZ7',
    encryptedCode: 'dGVzdCBjb2Rl',
    iv: 'abcdefabcdefabcdefabcdefabcdefab',
    authTag: 'fedcbafedcbafedcbafedcbafedcbafe'
  })
});

const data = await response.json();
console.log(data);
```

---

## Event Flow

1. **Submission Upload** — Contributor uploads encrypted solution via `/api/submissions/upload`
2. **Buffering** — Coordinator stores the encrypted payload indexed by contributor address
3. **On-Chain Claim** — Contributor calls `claim_bounty()` on the smart contract with their ZK proof
4. **Event Emission** — Contract emits `bounty_claimed` event with decryption key
5. **Decryption** — Coordinator receives event, decrypts the solution, and opens a GitHub PR
6. **Cleanup** — Submission is removed from buffer and marked as processed

---

## Submission Lifecycle

Submissions follow this lifecycle:

```
┌─────────────┐
│   PENDING   │  Buffered, awaiting on-chain event
└──────┬──────┘
       │
       ├─ (on-chain event received)
       ▼
┌──────────────┐
│  DECRYPTING  │  Decrypting with revealed key
└──────┬───────┘
       │
       ├─ (success) ──► PROCESSED ✓
       │
       └─ (failure) ──► FAILED ✗
       │
       └─ (TTL expired) ──► EXPIRED ✗
```

- **Retention**: 24 hours
- **Max Buffer**: Limited by available memory
- **Cleanup**: Automatic hourly cleanup of expired submissions
