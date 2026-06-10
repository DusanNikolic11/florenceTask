import { sendToTopic } from './index';

export const MAX_RETRIES = 3;

export interface RetryablePayload {
  _retryCount?: number;
  [key: string]: unknown;
}

/**
 * Wraps a message handler with retry + dead-letter-queue logic.
 *
 * Flow:
 *   1. Parse the raw JSON message and extract _retryCount (defaults to 0).
 *   2. Call the handler.
 *   3. On failure:
 *      - If _retryCount < MAX_RETRIES: send to retryTopic with _retryCount + 1.
 *      - If _retryCount >= MAX_RETRIES: send to dlqTopic for manual recovery.
 *
 * The same withRetry wrapper is used by both the primary and the retry consumers,
 * so the retry count naturally increments on each failed pass through the retry topic.
 */
export const withRetry = async <T extends RetryablePayload>(
  handler: (payload: T) => Promise<void>,
  rawMessage: string | null | undefined,
  retryTopic: string,
  dlqTopic: string,
  logPrefix: string
): Promise<void> => {
  if (!rawMessage) {
    console.warn(`[${logPrefix}] Received empty message, skipping`);
    return;
  }

  let payload: T;
  try {
    payload = JSON.parse(rawMessage) as T;
  } catch {
    console.error(`[${logPrefix}] Failed to parse message:`, rawMessage);
    return;
  }

  const retryCount = payload._retryCount ?? 0;

  try {
    await handler(payload);
  } catch (err) {
    const nextCount = retryCount + 1;

    if (retryCount < MAX_RETRIES) {
      console.error(
        `[${logPrefix}] Handler failed (attempt ${retryCount + 1}/${MAX_RETRIES}), ` +
          `sending to retry topic "${retryTopic}"`,
        err
      );
      await sendToTopic(retryTopic, { ...payload, _retryCount: nextCount });
    } else {
      console.error(
        `[${logPrefix}] All ${MAX_RETRIES} retries exhausted, ` +
          `sending to DLQ "${dlqTopic}"`,
        err
      );
      await sendToTopic(dlqTopic, { ...payload, _retryCount: retryCount });
    }
  }
};
