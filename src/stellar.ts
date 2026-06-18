import { Horizon } from '@stellar/stellar-sdk';
import { BountyClaimedEvent } from './types';
import { logger } from './utils/logger';
import { StellarError } from './utils/errors';
import { isValidBountyEvent } from './utils/validation';

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 30000; // 30 seconds

export function watchStellarEvents(
  contractAddress: string,
  onEvent: (event: BountyClaimedEvent) => Promise<void>
): void {
  logger.info(`Streaming Stellar events for contract: ${contractAddress}`);
  startEventStream(contractAddress, onEvent, 0);
}

function startEventStream(
  contractAddress: string,
  onEvent: (event: BountyClaimedEvent) => Promise<void>,
  retryCount: number
): void {
  const horizonServer = new Horizon.Server('https://horizon-testnet.stellar.org');

  try {
    horizonServer
      .transactions()
      .forAccount(contractAddress)
      .cursor('now')
      .stream({
        onmessage: async (tx) => {
          try {
            const memo = (tx as any).memo as string | undefined;
            if (!memo) return;

            // Expected memo format: "bounty_claimed:<challengeId>:<contributor>:<key>"
            if (!memo.startsWith('bounty_claimed:')) return;

            const [, challengeIdStr, contributor, decryptionKey] = memo.split(':');
            if (!challengeIdStr || !contributor || !decryptionKey) {
              logger.warn(`Malformed memo format: ${memo}`);
              return;
            }

            const challengeId = parseInt(challengeIdStr, 10);
            if (isNaN(challengeId)) {
              logger.warn(`Invalid challenge ID in memo: ${challengeIdStr}`);
              return;
            }

            const event: BountyClaimedEvent = {
              challengeId,
              contributor,
              decryptionKey,
              txHash: tx.hash,
            };

            if (!isValidBountyEvent(event)) {
              logger.warn(`Invalid bounty event: ${JSON.stringify(event)}`);
              return;
            }

            await onEvent(event);
          } catch (err: any) {
            logger.error(`Event processing error: ${err.message}`);
          }
        },
        onerror: (err) => {
          logger.error(`Stellar stream error: ${err}`);
          handleStreamError(contractAddress, onEvent, retryCount);
        },
      });
  } catch (err: any) {
    logger.error(`Failed to start stream: ${err.message}`);
    handleStreamError(contractAddress, onEvent, retryCount);
  }
}

function handleStreamError(
  contractAddress: string,
  onEvent: (event: BountyClaimedEvent) => Promise<void>,
  retryCount: number
): void {
  if (retryCount >= MAX_RETRIES) {
    logger.error(`Max retries (${MAX_RETRIES}) exceeded. Stopping event stream.`);
    throw new StellarError(`Failed to establish Stellar event stream after ${MAX_RETRIES} retries`);
  }

  const delayMs = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, retryCount), MAX_RETRY_DELAY);
  logger.warn(`Retrying Stellar event stream in ${delayMs}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);

  setTimeout(() => {
    startEventStream(contractAddress, onEvent, retryCount + 1);
  }, delayMs);
}
