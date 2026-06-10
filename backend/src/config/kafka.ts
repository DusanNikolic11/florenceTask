import { Kafka, Producer, Consumer, logLevel } from 'kafkajs';

export const REPORTS_TOPIC = 'reports';

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
let consumer: Consumer | null = null;

export const getProducer = (): Producer => {
  if (!producer) {
    producer = getKafka().producer();
  }
  return producer;
};

export const getConsumer = (): Consumer => {
  if (!consumer) {
    consumer = getKafka().consumer({ groupId: 'report-processors' });
  }
  return consumer;
};

export const connectKafka = async (): Promise<void> => {
  await getProducer().connect();
  await getConsumer().connect();
  console.log('Kafka producer and consumer connected');
};

export const disconnectKafka = async (): Promise<void> => {
  await getProducer().disconnect();
  await getConsumer().disconnect();
};

export const sendReportMessage = async (reportId: string): Promise<void> => {
  await getProducer().send({
    topic: REPORTS_TOPIC,
    messages: [{ key: reportId, value: JSON.stringify({ reportId }) }],
  });
};
