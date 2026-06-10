import { Kafka, Producer, Consumer, logLevel } from 'kafkajs';

// ── Primary topics ────────────────────────────────────────────────────────
export const REPORTS_TOPIC = 'reports';
export const REPORT_EVENTS_TOPIC = 'reportEvents';
export const EMAIL_NOTIFICATIONS_TOPIC = 'emailNotifications';

// ── Retry topics ──────────────────────────────────────────────────────────
export const REPORTS_RETRY_TOPIC = 'reports.retry';
export const REPORT_EVENTS_RETRY_TOPIC = 'reportEvents.retry';
export const EMAIL_NOTIFICATIONS_RETRY_TOPIC = 'emailNotifications.retry';

// ── Dead letter queue topics ───────────────────────────────────────────────
export const REPORTS_DLQ_TOPIC = 'reports.dlq';
export const REPORT_EVENTS_DLQ_TOPIC = 'reportEvents.dlq';
export const EMAIL_NOTIFICATIONS_DLQ_TOPIC = 'emailNotifications.dlq';

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

// ── Consumer group IDs ────────────────────────────────────────────────────
export enum ConsumerGroup {
  ReportProcessor        = 'report-processors',
  ReportEventProcessor   = 'report-event-processors',
  EmailSender            = 'email-senders',
  ReportProcessorRetry   = 'report-processors-retry',
  ReportEventRetry       = 'report-event-processors-retry',
  EmailSenderRetry       = 'email-senders-retry',
}

// ── Producer ───────────────────────────────────────────────────────────────
let producer: Producer | null = null;
export const getProducer = (): Producer => {
  if (!producer) producer = getKafka().producer();
  return producer;
};

// ── Consumer registry ─────────────────────────────────────────────────────
const consumerRegistry = new Map<ConsumerGroup, Consumer>();

export const getConsumer = (group: ConsumerGroup): Consumer => {
  if (!consumerRegistry.has(group)) {
    consumerRegistry.set(group, getKafka().consumer({ groupId: group }));
  }
  return consumerRegistry.get(group)!;
};

// ── Connect / Disconnect ───────────────────────────────────────────────────
export const connectKafka = async (): Promise<void> => {
  await getProducer().connect();
  for (const group of Object.values(ConsumerGroup)) {
    await getConsumer(group).connect();
  }
  console.log('Kafka producer and all consumers connected');
};

export const disconnectKafka = async (): Promise<void> => {
  await getProducer().disconnect();
  for (const group of Object.values(ConsumerGroup)) {
    await getConsumer(group).disconnect();
  }
};

// ── Generic send helper ────────────────────────────────────────────────────
export const sendToTopic = async (topic: string, payload: unknown): Promise<void> => {
  await getProducer().send({
    topic,
    messages: [{ value: JSON.stringify(payload) }],
  });
};

// ── Typed send helpers for primary topics ──────────────────────────────────
export const sendReportMessage = async (reportId: string): Promise<void> => {
  await sendToTopic(REPORTS_TOPIC, { reportId });
};

export interface ReportEventPayload {
  state: 'generated';
  reportId: string;
  reportInstanceId: string;
}
export const sendReportEventMessage = async (payload: ReportEventPayload): Promise<void> => {
  await sendToTopic(REPORT_EVENTS_TOPIC, payload);
};

export interface EmailNotificationPayload {
  s3Url: string;
  userEmail: string;
  reportName: string;
}
export const sendEmailNotificationMessage = async (
  payload: EmailNotificationPayload
): Promise<void> => {
  await sendToTopic(EMAIL_NOTIFICATIONS_TOPIC, payload);
};
