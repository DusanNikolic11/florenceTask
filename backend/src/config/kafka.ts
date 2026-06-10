import { Kafka, Producer, Consumer, logLevel } from 'kafkajs';

export const REPORTS_TOPIC = 'reports';
export const REPORT_EVENTS_TOPIC = 'reportEvents';
export const EMAIL_NOTIFICATIONS_TOPIC = 'emailNotifications';

const getBroker = (): string => process.env.KAFKA_BROKER || 'kafka:9092';

let kafka: Kafka;

const getKafka = (): Kafka => {
  if (!kafka) {
    kafka = new Kafka({
      clientId: 'florence-backend',
      brokers: [getBroker()],
      logLevel: logLevel.WARN,
    });
  }
  return kafka;
};

let producer: Producer | null = null;
// Consumer for: reports topic (report generation jobs)
let reportProcessorConsumer: Consumer | null = null;
// Consumer for: reportEvents topic (post-generation events)
let reportEventConsumer: Consumer | null = null;
// Consumer for: emailNotifications topic (email dispatch)
let emailSenderConsumer: Consumer | null = null;

export const getProducer = (): Producer => {
  if (!producer) {
    producer = getKafka().producer();
  }
  return producer;
};

export const getReportProcessorConsumer = (): Consumer => {
  if (!reportProcessorConsumer) {
    reportProcessorConsumer = getKafka().consumer({ groupId: 'report-processors' });
  }
  return reportProcessorConsumer;
};

export const getReportEventConsumer = (): Consumer => {
  if (!reportEventConsumer) {
    reportEventConsumer = getKafka().consumer({ groupId: 'report-event-processors' });
  }
  return reportEventConsumer;
};

export const getEmailSenderConsumer = (): Consumer => {
  if (!emailSenderConsumer) {
    emailSenderConsumer = getKafka().consumer({ groupId: 'email-senders' });
  }
  return emailSenderConsumer;
};

export const connectKafka = async (): Promise<void> => {
  await getProducer().connect();
  await getReportProcessorConsumer().connect();
  await getReportEventConsumer().connect();
  await getEmailSenderConsumer().connect();
  console.log('Kafka producer and all consumers connected');
};

export const disconnectKafka = async (): Promise<void> => {
  await getProducer().disconnect();
  await getReportProcessorConsumer().disconnect();
  await getReportEventConsumer().disconnect();
  await getEmailSenderConsumer().disconnect();
};

export const sendReportMessage = async (reportId: string): Promise<void> => {
  await getProducer().send({
    topic: REPORTS_TOPIC,
    messages: [{ key: reportId, value: JSON.stringify({ reportId }) }],
  });
};

export interface ReportEventPayload {
  state: 'generated';
  reportId: string;
  reportInstanceId: string;
}

export const sendReportEventMessage = async (payload: ReportEventPayload): Promise<void> => {
  await getProducer().send({
    topic: REPORT_EVENTS_TOPIC,
    messages: [{ key: payload.reportId, value: JSON.stringify(payload) }],
  });
};

export interface EmailNotificationPayload {
  s3Url: string;
  userEmail: string;
  reportName: string;
}

export const sendEmailNotificationMessage = async (
  payload: EmailNotificationPayload
): Promise<void> => {
  await getProducer().send({
    topic: EMAIL_NOTIFICATIONS_TOPIC,
    messages: [{ key: payload.userEmail, value: JSON.stringify(payload) }],
  });
};
