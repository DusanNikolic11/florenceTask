import {
  getConsumer,
  ConsumerGroup,
  REPORTS_TOPIC,
  REPORTS_RETRY_TOPIC,
  REPORTS_DLQ_TOPIC,
} from './index';
import { processReport } from '../../services/reportGeneration.service';
import { withRetry, RetryablePayload } from './retryUtils';

interface ReportMessage extends RetryablePayload {
  reportId: string;
}

export const handleReportMessage = async (payload: ReportMessage): Promise<void> => {
  await processReport(payload.reportId);
};

export const startReportProcessorConsumer = async (): Promise<void> => {
  const consumer = getConsumer(ConsumerGroup.ReportProcessor);

  await consumer.subscribe({ topic: REPORTS_TOPIC, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      await withRetry(
        handleReportMessage,
        message.value?.toString(),
        REPORTS_RETRY_TOPIC,
        REPORTS_DLQ_TOPIC,
        'ReportProcessorConsumer'
      );
    },
  });

  console.log(`[ReportProcessorConsumer] Listening on topic "${REPORTS_TOPIC}"`);
};
