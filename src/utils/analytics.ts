import { SubmissionRecord } from '../types';

export interface SubmissionAnalytics {
  totalSubmissions: number;
  averageAgeMs: number;
  oldestSubmissionAgeMs: number;
  newestSubmissionAgeMs: number;
  byStatus: {
    processed: number;
    pending: number;
    failed: number;
  };
}

export class SubmissionAnalyzer {
  analyzeSubmissions(submissions: Record<string, SubmissionRecord>): SubmissionAnalytics {
    const now = Date.now();
    const records = Object.values(submissions);
    const totalSubmissions = records.length;

    if (totalSubmissions === 0) {
      return {
        totalSubmissions: 0,
        averageAgeMs: 0,
        oldestSubmissionAgeMs: 0,
        newestSubmissionAgeMs: 0,
        byStatus: { processed: 0, pending: 0, failed: 0 },
      };
    }

    const ages = records.map((r) => now - r.createdAt);
    const averageAgeMs = ages.reduce((a, b) => a + b, 0) / totalSubmissions;
    const oldestSubmissionAgeMs = Math.max(...ages);
    const newestSubmissionAgeMs = Math.min(...ages);

    const processed = records.filter((r) => r.txHash).length;
    const pending = totalSubmissions - processed;

    return {
      totalSubmissions,
      averageAgeMs,
      oldestSubmissionAgeMs,
      newestSubmissionAgeMs,
      byStatus: {
        processed,
        pending,
        failed: 0, // Tracked separately in metrics
      },
    };
  }

  getSubmissionsByAge(
    submissions: Record<string, SubmissionRecord>,
    ageMs: number
  ): Record<string, SubmissionRecord> {
    const now = Date.now();
    return Object.fromEntries(
      Object.entries(submissions).filter(([, r]) => now - r.createdAt >= ageMs)
    );
  }

  getAverageSubmissionSize(submissions: Record<string, SubmissionRecord>): number {
    const records = Object.values(submissions);
    if (records.length === 0) return 0;

    const totalSize = records.reduce((sum, r) => {
      return (
        sum +
        Buffer.byteLength(r.payload.encryptedCode, 'base64') +
        Buffer.byteLength(r.payload.iv, 'hex') +
        Buffer.byteLength(r.payload.authTag, 'hex')
      );
    }, 0);

    return totalSize / records.length;
  }
}

export const analyzer = new SubmissionAnalyzer();
