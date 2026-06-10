import {
  getEmailSenderConsumer,
  EMAIL_NOTIFICATIONS_TOPIC,
  EmailNotificationPayload,
} from '../config/kafka';
import { extractS3Key, streamFromS3 } from './s3.service';
import { sendEmailWithAttachment } from './ses.service';

const streamToBuffer = (stream: NodeJS.ReadableStream): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });

export const startEmailNotificationsConsumer = async (): Promise<void> => {
  const consumer = getEmailSenderConsumer();

  await consumer.subscribe({ topic: EMAIL_NOTIFICATIONS_TOPIC, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const raw = message.value?.toString();
      if (!raw) return;

      let payload: EmailNotificationPayload;
      try {
        payload = JSON.parse(raw) as EmailNotificationPayload;
      } catch {
        console.error('[EmailNotificationsConsumer] Failed to parse message:', raw);
        return;
      }

      try {
        await sendReportEmail(payload);
      } catch (err) {
        console.error(
          `[EmailNotificationsConsumer] Failed to send email to ${payload.userEmail}:`,
          err
        );
      }
    },
  });

  console.log(`[EmailNotificationsConsumer] Listening on topic "${EMAIL_NOTIFICATIONS_TOPIC}"`);
};

const sendReportEmail = async (payload: EmailNotificationPayload): Promise<void> => {
  const { s3Url, userEmail, reportName } = payload;

  const s3Key = extractS3Key(s3Url);
  const stream = await streamFromS3(s3Key);
  const csvBuffer = await streamToBuffer(stream);

  const filename = s3Key.split('/').pop() ?? 'report.csv';

  await sendEmailWithAttachment({
    to: userEmail,
    subject: `Report Ready: ${reportName}`,
    body: `Your report "${reportName}" has been generated and is attached to this email as a CSV file.`,
    attachment: {
      filename,
      content: csvBuffer,
      contentType: 'text/csv',
    },
  });

  console.log(
    `[EmailNotificationsConsumer] Email sent to ${userEmail} for report "${reportName}"`
  );
};
