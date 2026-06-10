import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses';

const getSesClient = (): SESClient => {
  return new SESClient({
    region: process.env.SES_REGION || process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });
};

const getFromEmail = (): string => {
  const from = process.env.SES_FROM_EMAIL;
  if (!from) throw new Error('SES_FROM_EMAIL environment variable is not set');
  return from;
};

const buildMimeMessage = (params: {
  from: string;
  to: string;
  subject: string;
  body: string;
  attachment: {
    filename: string;
    content: Buffer;
    contentType: string;
  };
}): string => {
  const boundary = `----=_Part_${Date.now()}`;
  const attachmentBase64 = params.attachment.content.toString('base64');

  const lines: string[] = [
    `From: ${params.from}`,
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    params.body,
    '',
    `--${boundary}`,
    `Content-Type: ${params.attachment.contentType}; name="${params.attachment.filename}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${params.attachment.filename}"`,
    '',
    // Split base64 into 76-char lines per MIME spec
    ...(attachmentBase64.match(/.{1,76}/g) ?? []),
    '',
    `--${boundary}--`,
  ];

  return lines.join('\r\n');
};

export const sendEmailWithAttachment = async (params: {
  to: string;
  subject: string;
  body: string;
  attachment: {
    filename: string;
    content: Buffer;
    contentType: string;
  };
}): Promise<void> => {
  const client = getSesClient();
  const from = getFromEmail();

  const rawMessage = buildMimeMessage({ from, ...params });

  await client.send(
    new SendRawEmailCommand({
      RawMessage: { Data: Buffer.from(rawMessage) },
    })
  );
};
