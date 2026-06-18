# Development Guide

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Run in development mode (with debug logging)
npm run dev

# Run tests
npm test
npm run test:watch
npm run test:coverage

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
zk-wavescout-coordinator/
├── src/
│   ├── index.ts          # Express server and main orchestrator
│   ├── types.ts          # TypeScript type definitions
│   ├── stellar.ts        # Stellar event streaming
│   ├── github.ts         # GitHub PR automation
│   └── utils/
│       ├── config.ts     # Environment config validation
│       ├── logger.ts     # Logging utilities
│       ├── errors.ts     # Error definitions and handling
│       ├── validation.ts # Type guards and validation
│       ├── sanitization.ts # Input sanitization
│       ├── middleware.ts # Express middleware
│       ├── metrics.ts    # Metrics collection
│       ├── rate-limiter.ts # Rate limiting
│       └── analytics.ts  # Submission analytics
├── tests/
│   ├── validation.test.ts
│   ├── sanitization.test.ts
│   ├── errors.test.ts
│   ├── metrics.test.ts
│   ├── rate-limiter.test.ts
│   ├── analytics.test.ts
│   └── integration.test.ts
├── jest.config.json       # Jest test configuration
├── tsconfig.json          # TypeScript configuration
├── package.json           # Dependencies and scripts
├── .prettierrc             # Code formatting rules
├── .gitignore             # Git ignore patterns
├── CONFIGURATION.md       # Configuration guide
├── API.md                 # API documentation
└── README.md              # Project overview
```

## Code Style

- **Language**: TypeScript 5.2+
- **Formatter**: Prettier (run `npm run format`)
- **Linter**: TypeScript strict mode
- **Convention**: camelCase for variables/functions, PascalCase for classes/types

### Example

```typescript
import { logger } from './utils/logger';
import { ValidationError } from './utils/errors';

export async function processSubmission(payload: EncryptedPayload): Promise<void> {
  try {
    logger.debug('Processing submission', { payloadSize: JSON.stringify(payload).length });
    // Logic here
    logger.info('Submission processed successfully');
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to process submission', err.message);
    throw new ValidationError(`Processing failed: ${err.message}`);
  }
}
```

## Key Patterns

### 1. Error Handling

Use custom error classes from `utils/errors.ts`:

```typescript
import { ValidationError, DecryptionError, GitHubError } from './utils/errors';

// Throw appropriate errors
if (!isValid) throw new ValidationError('Invalid input');
if (decryption fails) throw new DecryptionError('Decryption failed');
if (github fails) throw new GitHubError('GitHub API error');

// In middleware/route handlers
try {
  // code
} catch (err: any) {
  const error = handleError(err);
  res.status(error.statusCode).json(apiResponse('error', undefined, req, error));
}
```

### 2. Validation

Use type guards from `utils/validation.ts`:

```typescript
import { isValidEncryptedPayload, isValidStellarAddress } from './utils/validation';

if (!isValidEncryptedPayload(payload)) {
  throw new ValidationError('Invalid payload structure');
}

if (!isValidStellarAddress(address)) {
  throw new ValidationError('Invalid Stellar address');
}
```

### 3. Sanitization

Always sanitize user inputs:

```typescript
import { sanitizeAddress, sanitizeHexString, sanitizeEncryptedCode } from './utils/sanitization';

const cleanAddress = sanitizeAddress(contributorAddress);
const cleanIv = sanitizeHexString(iv, 'iv', 32);
const cleanCode = sanitizeEncryptedCode(encryptedCode);
```

### 4. Logging

Use the logger module with appropriate levels:

```typescript
import { logger } from './utils/logger';

logger.debug('Detailed info (development only)');
logger.info('Important events');
logger.warn('Warning conditions');
logger.error('Error conditions');
```

### 5. Metrics

Track operations with metrics:

```typescript
import { metrics } from './utils/metrics';

metrics.recordSubmissionReceived();
const startTime = Date.now();
// do work
metrics.recordProcessingTime(Date.now() - startTime);
metrics.recordSubmissionProcessed();
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage
```

### Writing Tests

```typescript
describe('Feature Name', () => {
  it('should do something', () => {
    const result = functionUnderTest();
    expect(result).toBe(expectedValue);
  });

  it('should handle errors', () => {
    expect(() => functionThatThrows()).toThrow(CustomError);
  });
});
```

## Common Tasks

### Add a New Endpoint

1. Add type to `src/types.ts`
2. Create handler function with proper validation and error handling
3. Add route to `src/index.ts`
4. Add tests to `tests/`
5. Update `API.md` with documentation

### Add a New Utility

1. Create file in `src/utils/`
2. Export functions/classes
3. Create corresponding test file
4. Add to `src/utils/middleware.ts` or main module as needed

### Fix a Bug

1. Create test that reproduces the bug
2. Implement fix
3. Verify test passes
4. Update documentation if needed

## Configuration for Development

Create a `.env.local` for local development:

```bash
NODE_ENV=development
LOG_LEVEL=debug
PORT=5000
CONTRACT_ADDRESS=GBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNHERREUMAXLKEEXDKBMFSVZ7
KDF_SALT=abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefab
GITHUB_TOKEN=ghp_test...
GITHUB_OWNER=testuser
GITHUB_REPO=test-repo
```

## Debugging

### Enable Full Debug Logging

```bash
LOG_LEVEL=debug npm run dev
```

### Debug with Node Inspector

```bash
node --inspect dist/index.js
# Then open chrome://inspect in Chrome
```

### Check Configuration

```bash
node -e "require('dotenv').config(); console.log(process.env)"
```

## Dependency Management

### Adding a Package

```bash
npm install --save package-name
npm install --save-dev package-name  # For dev dependencies
```

Prefer exact versions for production stability:

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "package": "1.0.0"
  }
}
```

### Updating Packages

```bash
npm update              # Update to compatible versions
npm outdated          # Check for updates
npm audit             # Check for vulnerabilities
```

## Performance Considerations

1. **Rate Limiting**: Configured at 100 req/min for submissions
2. **Submission TTL**: 24 hours before automatic cleanup
3. **Metrics Storage**: Rolling averages to prevent memory growth
4. **Event Deduplication**: Prevent replay attacks with seen event tracking
5. **Buffer Limits**: Max 10 MB per request

## Security Considerations

1. **Input Validation**: All inputs validated before use
2. **Sanitization**: User inputs trimmed and normalized
3. **Type Safety**: Strict TypeScript mode enabled
4. **Error Messages**: Generic messages in responses, detailed logs internally
5. **Auth**: Stellar address and transaction hash validation

## Deployment Checklist

- [ ] Run full test suite: `npm test`
- [ ] Check coverage: `npm run test:coverage`
- [ ] Build: `npm run build`
- [ ] Review configuration: `cat .env`
- [ ] Check secrets are not in code
- [ ] Run linting: `npm run lint`
- [ ] Verify metrics endpoint works
- [ ] Test health check endpoint

## Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Make changes with tests
3. Run: `npm test` and `npm run lint`
4. Format: `npm run format`
5. Commit with clear message
6. Push and create pull request
