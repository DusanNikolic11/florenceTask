import {
  getReportEventConsumer,
  REPORT_EVENTS_TOPIC,
  ReportEventPayload,
  sendEmailNotificationMessage,
} from '../config/kafka';
import { Report } from '../models/report.model';
import { ReportInstance } from '../models/reportInstance.model';
import { ReportSubscription } from '../models/reportSubscription.model';
import { User } from '../models/user.model';

export const startReportEventsConsumer = async (): Promise<void> => {
  const consumer = getReportEventConsumer();

  await consumer.subscribe({ topic: REPORT_EVENTS_TOPIC, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const raw = message.value?.toString();
      if (!raw) return;

      let payload: ReportEventPayload;
      try {
        payload = JSON.parse(raw) as ReportEventPayload;
      } catch {
        console.error('[ReportEventsConsumer] Failed to parse message:', raw);
        return;
      }

      if (payload.state !== 'generated') return;

      try {
        await handleReportGenerated(payload);
      } catch (err) {
        console.error(
          `[ReportEventsConsumer] Error handling generated event for report ${payload.reportId}:`,
          err
        );
      }
    },
  });

  console.log(`[ReportEventsConsumer] Listening on topic "${REPORT_EVENTS_TOPIC}"`);
};

const handleReportGenerated = async (payload: ReportEventPayload): Promise<void> => {
  const [instance, report, subscriptions] = await Promise.all([
    ReportInstance.findById(payload.reportInstanceId),
    Report.findById(payload.reportId),
    ReportSubscription.find({ reportId: payload.reportId }),
  ]);

  if (!instance || !report) {
    console.warn(`[ReportEventsConsumer] Instance or report not found for event`, payload);
    return;
  }

  if (subscriptions.length === 0) {
    console.log(`[ReportEventsConsumer] No subscribers for report "${report.name}", skipping`);
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
      console.log(`[ReportEventsConsumer] Queued email notification for ${email}`);
    } catch (err) {
      console.error(`[ReportEventsConsumer] Failed to queue email for ${email}:`, err);
    }
  }
};
