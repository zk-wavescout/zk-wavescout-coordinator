import { Metrics } from '../types';

class MetricsCollector implements Metrics {
  submissionsReceived = 0;
  submissionsProcessed = 0;
  submissionsFailed = 0;
  decryptionsSuccessful = 0;
  decryptionsFailed = 0;
  prsOpened = 0;
  prsFailedToOpen = 0;
  averageProcessingTimeMs = 0;

  private processingTimes: number[] = [];

  recordSubmissionReceived(): void {
    this.submissionsReceived++;
  }

  recordSubmissionProcessed(): void {
    this.submissionsProcessed++;
  }

  recordSubmissionFailed(): void {
    this.submissionsFailed++;
  }

  recordDecryptionSuccess(): void {
    this.decryptionsSuccessful++;
  }

  recordDecryptionFailure(): void {
    this.decryptionsFailed++;
  }

  recordPROpened(): void {
    this.prsOpened++;
  }

  recordPRFailedToOpen(): void {
    this.prsFailedToOpen++;
  }

  recordProcessingTime(timeMs: number): void {
    this.processingTimes.push(timeMs);
    this.averageProcessingTimeMs = 
      this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
  }

  getMetrics(): Metrics {
    return {
      submissionsReceived: this.submissionsReceived,
      submissionsProcessed: this.submissionsProcessed,
      submissionsFailed: this.submissionsFailed,
      decryptionsSuccessful: this.decryptionsSuccessful,
      decryptionsFailed: this.decryptionsFailed,
      prsOpened: this.prsOpened,
      prsFailedToOpen: this.prsFailedToOpen,
      averageProcessingTimeMs: this.averageProcessingTimeMs,
    };
  }

  reset(): void {
    this.submissionsReceived = 0;
    this.submissionsProcessed = 0;
    this.submissionsFailed = 0;
    this.decryptionsSuccessful = 0;
    this.decryptionsFailed = 0;
    this.prsOpened = 0;
    this.prsFailedToOpen = 0;
    this.processingTimes = [];
    this.averageProcessingTimeMs = 0;
  }
}

export const metrics = new MetricsCollector();
