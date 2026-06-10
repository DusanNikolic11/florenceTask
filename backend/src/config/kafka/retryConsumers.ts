import {
  getConsumer,
  ConsumerGroup,
  REPORTS_RETRY_TOPIC,
  REPORTS_DLQ_TOPIC,
  REPORT_EVENTS_RETRY_TOPIC,
  REPORT_EVENTS_DLQ_TOPIC,
  EMAIL_NOTIFICATIONS_RETRY_TOPIC,
  EMAIL_NOTIFICATIONS_DLQ_TOPIC,
} from './index';
import { withRetry } from './retryUtils';
import { handleReportMessage } from './reportProcessor.consumer';
import { handleReportStateChangedMessage } from './reportStateChanged.consumer';
import { handleEmailNotificationMessage } from './emailNotifications.consumer';

export const startReportProcessorRetryConsumer = async (): Promise<void> => {
  const consumer = getConsumer(ConsumerGroup.ReportProcessorRetry);

  await consumer.subscribe({ topic: REPORTS_RETRY_TOPIC, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      await withRetry(
        handleReportMessage,
        message.value?.toString(),
        REPORTS_RETRY_TOPIC,
        REPORTS_DLQ_TOPIC,
        'ReportProcessorRetryConsumer'
      );
    },
  });

  console.log(`[ReportProcessorRetryConsumer] Listening on topic "${REPORTS_RETRY_TOPIC}"`);
};

export const startReportStateChangedRetryConsumer = async (): Promise<void> => {
  const consumer = getConsumer(ConsumerGroup.ReportEventRetry);

  await consumer.subscribe({ topic: REPORT_EVENTS_RETRY_TOPIC, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      await withRetry(
        handleReportStateChangedMessage,
        message.value?.toString(),
        REPORT_EVENTS_RETRY_TOPIC,
        REPORT_EVENTS_DLQ_TOPIC,
        'ReportStateChangedRetryConsumer'
      );
    },
  });

  console.log(
    `[ReportStateChangedRetryConsumer] Listening on topic "${REPORT_EVENTS_RETRY_TOPIC}"`
  );
};

export const startEmailNotificationsRetryConsumer = async (): Promise<void> => {
  const consumer = getConsumer(ConsumerGroup.EmailSenderRetry);

  await consumer.subscribe({ topic: EMAIL_NOTIFICATIONS_RETRY_TOPIC, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      await withRetry(
        handleEmailNotificationMessage,
        message.value?.toString(),
        EMAIL_NOTIFICATIONS_RETRY_TOPIC,
        EMAIL_NOTIFICATIONS_DLQ_TOPIC,
        'EmailNotificationsRetryConsumer'
      );
    },
  });

  console.log(
    `[EmailNotificationsRetryConsumer] Listening on topic "${EMAIL_NOTIFICATIONS_RETRY_TOPIC}"`
  );
};
