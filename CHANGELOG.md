# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-06-18

### Added

#### Utilities & Infrastructure
- **Validation module** (`utils/validation.ts`) - Type guards for encrypted payloads, bounty events, and Stellar addresses
- **Logging module** (`utils/logger.ts`) - Color-coded logging with development debug mode
- **Error handling** (`utils/errors.ts`) - Custom error classes for validation, decryption, GitHub, and Stellar errors
- **Configuration validation** (`utils/config.ts`) - Comprehensive environment variable validation on startup
- **Sanitization** (`utils/sanitization.ts`) - Input sanitization with buffer size limits (10MB max)
- **Middleware** (`utils/middleware.ts`) - Request ID tracking and correlation
- **Metrics collection** (`utils/metrics.ts`) - Comprehensive metrics for submissions, decryptions, and PRs
- **Rate limiting** (`utils/rate-limiter.ts`) - Per-IP rate limiting for API endpoints
- **Submission analytics** (`utils/analytics.ts`) - Analytics on submission age, status, and size
- **Constants** (`utils/constants.ts`) - Centralized configuration constants
- **Utils barrel export** (`utils/index.ts`) - Cleaner imports from utilities

#### Core Functionality
- **Health check endpoint** (`GET /health`) - Service status verification
- **Metrics endpoint** (`GET /metrics`) - Real-time metrics collection
- **Submission cleanup strategy** - Automatic 24-hour TTL with hourly cleanup
- **Stellar connection retry logic** - Exponential backoff with max 5 retries
- **GitHub API error handling** - Recovery logic for branch conflicts and API errors
- **Graceful shutdown handler** - Clean process termination with 30-second timeout
- **Event replay protection** - Prevent duplicate processing with seen event tracking
- **Comprehensive logging** - Detailed logging across all modules with debug mode

#### API & Response
- **Standardized error responses** - Consistent error format with error codes and messages
- **API response envelope** - Unified response format with requestId and timestamp
- **Input validation** - Strict validation of all request payloads

#### Types
- **Extended type definitions** - SubmissionRecord, ApiResponse, and Metrics types
- **Type guards** - Runtime validation of complex types

#### Testing
- **Jest configuration** - Complete test setup with TypeScript support
- **Validation tests** - 89 lines of tests for type guards and validation
- **Sanitization tests** - 77 lines of tests for input sanitization
- **Error handling tests** - 80 lines of tests for error classes and handling
- **Metrics tests** - 85 lines of tests for metrics collection
- **Rate limiter tests** - 68 lines of tests for rate limiting logic
- **Analytics tests** - 98 lines of tests for submission analytics
- **Integration test setup** - Placeholder integration tests for full pipeline

#### Documentation
- **Configuration guide** (`CONFIGURATION.md`) - Complete environment variable documentation
- **API documentation** (`API.md`) - Full API endpoint documentation with examples
- **Development guide** (`DEVELOPMENT.md`) - Code patterns, testing, and deployment guidelines
- **Code formatting** (`.prettierrc`) - Prettier configuration for code style
- **Git ignore** (`.gitignore`) - Comprehensive ignore patterns

#### Package Updates
- **Test dependencies** - Jest, ts-jest, and testing types
- **Development scripts** - `npm run test`, `npm run test:watch`, `npm run format`
- **Dev mode** - `npm run dev` with LOG_LEVEL=debug

### Changed
- **index.ts** - Complete refactor with utility integration, error handling, metrics, and logging
- **stellar.ts** - Enhanced with retry logic, validation, and detailed error handling
- **github.ts** - Enhanced with branch recovery logic and comprehensive error handling
- **types.ts** - Expanded with SubmissionRecord, ApiResponse, and Metrics types
- **package.json** - Added test and dev dependencies, enhanced scripts

### Fixed
- Input validation for all API endpoints
- Stellar address validation (56 chars, starts with 'G')
- Hex string validation for IV and auth tags (32 chars each)
- Buffer size limits to prevent memory exhaustion
- Error handling across all modules

### Security
- Input sanitization with size limits
- Stellar address validation to prevent wallet binding bypass
- Auth tag verification for tampering detection
- Replay attack protection with event deduplication
- Environment variable validation

## [1.0.0] - Original Release

### Features
- Basic Stellar event streaming
- AES-GCM decryption pipeline
- GitHub PR automation
- Basic error handling
- Express server setup
