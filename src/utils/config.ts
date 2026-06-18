import { logger } from './logger';
import { ValidationError } from './errors';

export interface Config {
  port: number;
  contractAddress: string;
  kdfSalt: Buffer;
  githubToken: string;
  githubOwner: string;
  githubRepo: string;
  githubBaseBranch: string;
  nodeEnv: 'development' | 'production';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export function validateConfig(): Config {
  const errors: string[] = [];

  const port = parseInt(process.env.PORT || '5000', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push('PORT must be a valid port number (1-65535)');
  }

  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    errors.push('CONTRACT_ADDRESS env var is required');
  } else if (!contractAddress.startsWith('G') || contractAddress.length !== 56) {
    errors.push('CONTRACT_ADDRESS must be a valid Stellar address');
  }

  const kdfSalt = process.env.KDF_SALT;
  if (!kdfSalt) {
    errors.push('KDF_SALT env var is required');
  } else if (kdfSalt.length !== 64 || !/^[0-9a-f]+$/i.test(kdfSalt)) {
    errors.push('KDF_SALT must be 64 hex characters (32 bytes)');
  }

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    errors.push('GITHUB_TOKEN env var is required');
  }

  const githubOwner = process.env.GITHUB_OWNER;
  if (!githubOwner) {
    errors.push('GITHUB_OWNER env var is required');
  }

  const githubRepo = process.env.GITHUB_REPO;
  if (!githubRepo) {
    errors.push('GITHUB_REPO env var is required');
  }

  if (errors.length > 0) {
    logger.error('Configuration validation failed:', errors);
    throw new ValidationError(`Invalid configuration: ${errors.join('; ')}`);
  }

  return {
    port,
    contractAddress: contractAddress!,
    kdfSalt: Buffer.from(kdfSalt!, 'hex'),
    githubToken: githubToken!,
    githubOwner: githubOwner!,
    githubRepo: githubRepo!,
    githubBaseBranch: process.env.GITHUB_BASE_BRANCH || 'main',
    nodeEnv: (process.env.NODE_ENV as any) || 'production',
    logLevel: (process.env.LOG_LEVEL as any) || 'info',
  };
}
