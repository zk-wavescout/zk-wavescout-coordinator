export class CoordinatorError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'CoordinatorError';
  }
}

export class ValidationError extends CoordinatorError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class DecryptionError extends CoordinatorError {
  constructor(message: string) {
    super(message, 'DECRYPTION_ERROR', 500);
    this.name = 'DecryptionError';
  }
}

export class GitHubError extends CoordinatorError {
  constructor(message: string, public readonly originalError?: Error) {
    super(message, 'GITHUB_ERROR', 500);
    this.name = 'GitHubError';
  }
}

export class StellarError extends CoordinatorError {
  constructor(message: string, public readonly originalError?: Error) {
    super(message, 'STELLAR_ERROR', 500);
    this.name = 'StellarError';
  }
}

export function handleError(error: unknown): { code: string; message: string; statusCode: number } {
  if (error instanceof CoordinatorError) {
    return {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    return {
      code: 'INTERNAL_ERROR',
      message: error.message,
      statusCode: 500,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    statusCode: 500,
  };
}
