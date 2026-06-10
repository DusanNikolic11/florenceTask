import { ConsumerGroup } from './index';
import { startReportProcessorConsumer } from './reportProcessor.consumer';
import { startReportStateChangedConsumer } from './reportStateChanged.consumer';
import { startEmailNotificationsConsumer } from './emailNotifications.consumer';
import {
  startReportProcessorRetryConsumer,
  startReportStateChangedRetryConsumer,
  startEmailNotificationsRetryConsumer,
} from './retryConsumers';

export const consumerStarterRegistry: Record<ConsumerGroup, () => Promise<void>> = {
  [ConsumerGroup.ReportProcessor]: startReportProcessorConsumer,
  [ConsumerGroup.ReportEventProcessor]: startReportStateChangedConsumer,
  [ConsumerGroup.EmailSender]: startEmailNotificationsConsumer,
  [ConsumerGroup.ReportProcessorRetry]: startReportProcessorRetryConsumer,
  [ConsumerGroup.ReportEventRetry]: startReportStateChangedRetryConsumer,
  [ConsumerGroup.EmailSenderRetry]: startEmailNotificationsRetryConsumer,
};
