import {
  getConsumer,
  ConsumerGroup,
  REPORT_EVENTS_TOPIC,
  REPORT_EVENTS_RETRY_TOPIC,
  REPORT_EVENTS_DLQ_TOPIC,
  ReportEventPayload,
  sendEmailNotificationMessage,
} from './index';
import { Report } from '../../models/report.model';
import { ReportInstance } from '../../models/reportInstance.model';
import { ReportSubscription } from '../../models/reportSubscription.model';
import { User } from '../../models/user.model';
import { withRetry, RetryablePayload } from './retryUtils';

interface ReportStateChangedMessage extends ReportEventPayload, RetryablePayload {}

export const handleReportStateChangedMessage = async (
  payload: ReportStateChangedMessage
): Promise<void> => {
  if (payload.state !== 'generated') return;
  await handleReportGenerated(payload);
};

const handleReportGenerated = async (payload: ReportEventPayload): Promise<void> => {
  const [instance, report, subscriptions] = await Promise.all([
    ReportInstance.findById(payload.reportInstanceId),
    Report.findById(payload.reportId),
    ReportSubscription.find({ reportId: payload.reportId }),
  ]);

  if (!instance || !report) {
    console.warn(`[ReportStateChangedConsumer] Instance or report not found for event`, payload);
    return;
  }

  if (subscriptions.length === 0) {
    console.log(
      `[ReportStateChangedConsumer] No subscribers for report "${report.name}", skipping`
    );
    return;
  }

  const userIds = subscriptions.map((s) => s.userId);
  const users = await User.find({ _id: { $in: userIds } }).select('email');
  const emailMap = new Map(users.map((u) => [u._id.toString(), u.email]));

  for (const subscription of subscriptions) {
    const email = emailMap.get(subscription.userId.toString());
    if (!email) continue;
    try {
      await sendEmailNotificationMessage({
        s3Url: instance.s3Location,
        userEmail: email,
        reportName: report.name,
      });
      console.log(`[ReportStateChangedConsumer] Queued email notification for ${email}`);
    } catch (err) {
      console.error(`[ReportStateChangedConsumer] Failed to queue email for ${email}:`, err);
    }
  }
};

export const startReportStateChangedConsumer = async (): Promise<void> => {
  const consumer = getConsumer(ConsumerGroup.ReportEventProcessor);

  await consumer.subscribe({ topic: REPORT_EVENTS_TOPIC, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      await withRetry(
        handleReportStateChangedMessage,
        message.value?.toString(),
        REPORT_EVENTS_RETRY_TOPIC,
        REPORT_EVENTS_DLQ_TOPIC,
        'ReportStateChangedConsumer'
      );
    },
  });

  console.log(`[ReportStateChangedConsumer] Listening on topic "${REPORT_EVENTS_TOPIC}"`);
};
