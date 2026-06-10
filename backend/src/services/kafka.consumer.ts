import { getConsumer, REPORTS_TOPIC } from '../config/kafka';
import { processReport } from './reportGeneration.service';

export const startReportConsumer = async (): Promise<void> => {
  const consumer = getConsumer();

  await consumer.subscribe({ topic: REPORTS_TOPIC, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const raw = message.value?.toString();
      if (!raw) {
        console.warn('[ReportConsumer] Received empty message, skipping');
        return;
      }

      let reportId: string;
      try {
        const payload = JSON.parse(raw) as { reportId: string };
        reportId = payload.reportId;
      } catch {
        console.error('[ReportConsumer] Failed to parse message:', raw);
        return;
      }

      try {
        await processReport(reportId);
      } catch (err) {
        console.error(`[ReportConsumer] Processing failed for report ${reportId}:`, err);
      }
    },
  });

  console.log(`[ReportConsumer] Listening on topic "${REPORTS_TOPIC}"`);
};
