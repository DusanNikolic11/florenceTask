import {
  getConsumer,
  ConsumerGroup,
  EMAIL_NOTIFICATIONS_TOPIC,
  EMAIL_NOTIFICATIONS_RETRY_TOPIC,
  EMAIL_NOTIFICATIONS_DLQ_TOPIC,
  EmailNotificationPayload,
} from './index';
import { extractS3Key, streamFromS3 } from '../aws/s3.service';
import { sendEmailWithAttachment } from '../aws/ses.service';
import { withRetry, RetryablePayload } from './retryUtils';

interface EmailNotificationMessage extends EmailNotificationPayload, RetryablePayload {}

const streamToBuffer = (stream: NodeJS.ReadableStream): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });

export const handleEmailNotificationMessage = async (
  payload: EmailNotificationMessage
): Promise<void> => {
  const { s3Url, userEmail, reportName } = payload;

  const s3Key = extractS3Key(s3Url);
  const stream = await streamFromS3(s3Key);
  const csvBuffer = await streamToBuffer(stream);
  const filename = s3Key.split('/').pop() ?? 'report.csv';

  await sendEmailWithAttachment({
    to: userEmail,
    subject: `Report Ready: ${reportName}`,
    body: `Your report "${reportName}" has been generated and is attached to this email as a CSV file.`,
    attachment: { filename, content: csvBuffer, contentType: 'text/csv' },
  });

  console.log(
    `[EmailNotificationsConsumer] Email sent to ${userEmail} for report "${reportName}"`
  );
};

export const startEmailNotificationsConsumer = async (): Promise<void> => {
  const consumer = getConsumer(ConsumerGroup.EmailSender);

  await consumer.subscribe({ topic: EMAIL_NOTIFICATIONS_TOPIC, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      await withRetry(
        handleEmailNotificationMessage,
        message.value?.toString(),
        EMAIL_NOTIFICATIONS_RETRY_TOPIC,
        EMAIL_NOTIFICATIONS_DLQ_TOPIC,
        'EmailNotificationsConsumer'
      );
    },
  });

  console.log(`[EmailNotificationsConsumer] Listening on topic "${EMAIL_NOTIFICATIONS_TOPIC}"`);
};
