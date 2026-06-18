import { analyzer } from '../src/utils/analytics';
import { SubmissionRecord } from '../src/types';

describe('Submission Analytics', () => {
  describe('analyzeSubmissions', () => {
    it('should return zero metrics for empty submissions', () => {
      const result = analyzer.analyzeSubmissions({});
      expect(result.totalSubmissions).toBe(0);
      expect(result.averageAgeMs).toBe(0);
    });

    it('should calculate submission analytics', () => {
      const now = Date.now();
      const submissions: Record<string, SubmissionRecord> = {
        addr1: {
          payload: { encryptedCode: 'test1', iv: 'abc123def456abc123def456abc123de', authTag: 'abc123def456abc123def456abc123de' },
          createdAt: now - 10000,
        },
        addr2: {
          payload: { encryptedCode: 'test2', iv: 'abc123def456abc123def456abc123de', authTag: 'abc123def456abc123def456abc123de' },
          createdAt: now - 5000,
        },
      };

      const result = analyzer.analyzeSubmissions(submissions);
      expect(result.totalSubmissions).toBe(2);
      expect(result.averageAgeMs).toBeGreaterThan(5000);
      expect(result.averageAgeMs).toBeLessThan(10000);
      expect(result.oldestSubmissionAgeMs).toBeGreaterThanOrEqual(10000);
      expect(result.newestSubmissionAgeMs).toBeLessThanOrEqual(5000);
    });

    it('should track processed vs pending submissions', () => {
      const now = Date.now();
      const submissions: Record<string, SubmissionRecord> = {
        addr1: {
          payload: { encryptedCode: 'test1', iv: 'abc123def456abc123def456abc123de', authTag: 'abc123def456abc123def456abc123de' },
          createdAt: now,
          txHash: 'tx1',
        },
        addr2: {
          payload: { encryptedCode: 'test2', iv: 'abc123def456abc123def456abc123de', authTag: 'abc123def456abc123def456abc123de' },
          createdAt: now,
        },
      };

      const result = analyzer.analyzeSubmissions(submissions);
      expect(result.byStatus.processed).toBe(1);
      expect(result.byStatus.pending).toBe(1);
    });
  });

  describe('getSubmissionsByAge', () => {
    it('should filter submissions by age threshold', () => {
      const now = Date.now();
      const submissions: Record<string, SubmissionRecord> = {
        addr1: {
          payload: { encryptedCode: 'test1', iv: 'abc123def456abc123def456abc123de', authTag: 'abc123def456abc123def456abc123de' },
          createdAt: now - 20000,
        },
        addr2: {
          payload: { encryptedCode: 'test2', iv: 'abc123def456abc123def456abc123de', authTag: 'abc123def456abc123def456abc123de' },
          createdAt: now - 5000,
        },
      };

      const old = analyzer.getSubmissionsByAge(submissions, 10000);
      expect(Object.keys(old).length).toBe(1);
      expect(old.addr1).toBeDefined();
    });
  });

  describe('getAverageSubmissionSize', () => {
    it('should calculate average submission size', () => {
      const submissions: Record<string, SubmissionRecord> = {
        addr1: {
          payload: {
            encryptedCode: Buffer.alloc(100).toString('base64'),
            iv: 'abc123def456abc123def456abc123de',
            authTag: 'abc123def456abc123def456abc123de',
          },
          createdAt: Date.now(),
        },
        addr2: {
          payload: {
            encryptedCode: Buffer.alloc(200).toString('base64'),
            iv: 'abc123def456abc123def456abc123de',
            authTag: 'abc123def456abc123def456abc123de',
          },
          createdAt: Date.now(),
        },
      };

      const avgSize = analyzer.getAverageSubmissionSize(submissions);
      expect(avgSize).toBeGreaterThan(0);
    });
  });
});
