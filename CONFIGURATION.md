# Configuration Guide

## Environment Variables

The coordinator requires the following environment variables to be set in `.env`:

### Server Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `PORT` | number | No | `5000` | HTTP server port (1-65535) |
| `NODE_ENV` | string | No | `production` | Node environment (`development` or `production`) |
| `LOG_LEVEL` | string | No | `info` | Logging level (`debug`, `info`, `warn`, `error`) |

### Stellar Configuration

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `CONTRACT_ADDRESS` | string | Yes | Soroban contract's Stellar account address (56 characters, starts with 'G') |

### Cryptography Configuration

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `KDF_SALT` | string | Yes | 64-character hex salt for `scryptSync` key derivation (32 bytes). Generate with: `openssl rand -hex 32` |

### GitHub Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `GITHUB_TOKEN` | string | Yes | - | GitHub personal access token with `repo` scope |
| `GITHUB_OWNER` | string | Yes | - | GitHub organization or username |
| `GITHUB_REPO` | string | Yes | - | Target repository name |
| `GITHUB_BASE_BRANCH` | string | No | `main` | Branch to open pull requests against |

## Setup Instructions

### 1. Generate Configuration

```bash
# Copy the example configuration
cp .env.example .env

# Generate a secure KDF salt
SALT=$(openssl rand -hex 32)
echo "KDF_SALT=$SALT" >> .env
```

### 2. Fill in Required Values

Edit `.env` and provide:
- `CONTRACT_ADDRESS`: Your deployed Soroban contract address
- `GITHUB_TOKEN`: GitHub personal access token with `repo` scope
- `GITHUB_OWNER`: Your GitHub org or username
- `GITHUB_REPO`: Repository for storing solutions

### 3. Optional Customization

```bash
# Use custom port
echo "PORT=3000" >> .env

# Enable debug logging
echo "LOG_LEVEL=debug" >> .env

# Set custom base branch
echo "GITHUB_BASE_BRANCH=develop" >> .env
```

## Validation

The coordinator validates configuration on startup:

- All required variables must be present
- Port must be valid (1-65535)
- `CONTRACT_ADDRESS` must be a valid Stellar address
- `KDF_SALT` must be exactly 64 hex characters (32 bytes)
- `GITHUB_TOKEN` must not be empty
- `GITHUB_OWNER` and `GITHUB_REPO` must not be empty

Configuration errors will cause the server to exit with status code 1.

## Security Considerations

- **KDF_SALT**: Keep this secret and rotate periodically. Use `openssl rand -hex 32` to generate.
- **GITHUB_TOKEN**: Use a personal access token with minimal required scopes. Rotate regularly.
- **Environment Variables**: Never commit `.env` to version control. Use `.env.example` as a template.
- **Production Deployment**: Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.) instead of `.env` files.

## Running in Different Modes

### Development Mode with Debug Logging

```bash
npm run dev
```

This sets `NODE_ENV=development` and `LOG_LEVEL=debug` for verbose output.

### Production Mode

```bash
npm run build
npm start
```

## API Endpoints

### Health Check

```
GET /health

Response: { status: 200, data: { status: "healthy" }, timestamp: "ISO8601" }
```

### Metrics

```
GET /metrics

Response: { status: 200, data: { ... metrics ... }, timestamp: "ISO8601" }
```

### Submissions Upload

```
POST /api/submissions/upload
Content-Type: application/json

Request:
{
  "contributorAddress": "GXXXX...",
  "encryptedCode": "<base64>",
  "iv": "<32 hex chars>",
  "authTag": "<32 hex chars>"
}

Response:
{
  "status": "success",
  "data": { "status": "encrypted_payload_buffered" },
  "requestId": "...",
  "timestamp": "ISO8601"
}
```

## Troubleshooting

### "KDF_SALT env var is not set"

Make sure you've generated and added a salt to `.env`:

```bash
openssl rand -hex 32 >> .env
```

### "Invalid Stellar address"

Verify the `CONTRACT_ADDRESS` is exactly 56 characters and starts with 'G'.

### "GitHub API error"

Check that:
- `GITHUB_TOKEN` is valid and has `repo` scope
- `GITHUB_OWNER` and `GITHUB_REPO` are correct
- Repository is accessible with the token

### "Failed to establish Stellar event stream"

The coordinator retries with exponential backoff up to 5 times. Check:
- Stellar Horizon API is accessible
- `CONTRACT_ADDRESS` is a valid Stellar account
- Network connectivity to `https://horizon-testnet.stellar.org`
