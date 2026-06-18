import { metrics } from '../src/utils/metrics';

describe('Metrics Collection', () => {
  beforeEach(() => {
    metrics.reset();
  });

  describe('Submission tracking', () => {
    it('should track submissions received', () => {
      metrics.recordSubmissionReceived();
      metrics.recordSubmissionReceived();
      expect(metrics.submissionsReceived).toBe(2);
    });

    it('should track submissions processed', () => {
      metrics.recordSubmissionProcessed();
      expect(metrics.submissionsProcessed).toBe(1);
    });

    it('should track submissions failed', () => {
      metrics.recordSubmissionFailed();
      metrics.recordSubmissionFailed();
      expect(metrics.submissionsFailed).toBe(2);
    });
  });

  describe('Decryption tracking', () => {
    it('should track successful decryptions', () => {
      metrics.recordDecryptionSuccess();
      expect(metrics.decryptionsSuccessful).toBe(1);
    });

    it('should track failed decryptions', () => {
      metrics.recordDecryptionFailure();
      expect(metrics.decryptionsFailed).toBe(1);
    });
  });

  describe('PR tracking', () => {
    it('should track opened PRs', () => {
      metrics.recordPROpened();
      expect(metrics.prsOpened).toBe(1);
    });

    it('should track failed PR openings', () => {
      metrics.recordPRFailedToOpen();
      expect(metrics.prsFailedToOpen).toBe(1);
    });
  });

  describe('Processing time tracking', () => {
    it('should calculate average processing time', () => {
      metrics.recordProcessingTime(100);
      metrics.recordProcessingTime(200);
      metrics.recordProcessingTime(300);
      expect(metrics.averageProcessingTimeMs).toBe(200);
    });
  });

  describe('getMetrics', () => {
    it('should return all metrics', () => {
      metrics.recordSubmissionReceived();
      metrics.recordDecryptionSuccess();
      metrics.recordPROpened();
      metrics.recordProcessingTime(50);

      const allMetrics = metrics.getMetrics();
      expect(allMetrics.submissionsReceived).toBe(1);
      expect(allMetrics.decryptionsSuccessful).toBe(1);
      expect(allMetrics.prsOpened).toBe(1);
      expect(allMetrics.averageProcessingTimeMs).toBe(50);
    });
  });

  describe('reset', () => {
    it('should reset all metrics', () => {
      metrics.recordSubmissionReceived();
      metrics.recordProcessingTime(100);
      metrics.reset();

      expect(metrics.submissionsReceived).toBe(0);
      expect(metrics.averageProcessingTimeMs).toBe(0);
    });
  });
});
