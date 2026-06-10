import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

const getS3Client = (): S3Client => {
  return new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });
};

const getBucketName = (): string => {
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) {
    throw new Error('S3_BUCKET_NAME environment variable is not set');
  }
  return bucket;
};

export const uploadToS3 = async (
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> => {
  const client = getS3Client();
  const bucket = getBucketName();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return `s3://${bucket}/${key}`;
};

export const getPresignedDownloadUrl = async (key: string): Promise<string> => {
  const client = getS3Client();
  const bucket = getBucketName();

  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn: 3600 });
};

export const streamFromS3 = async (key: string): Promise<Readable> => {
  const client = getS3Client();
  const bucket = getBucketName();

  const response = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  );

  if (!response.Body) {
    throw new Error('No body in S3 response');
  }

  return response.Body as Readable;
};

export const deleteFromS3 = async (key: string): Promise<void> => {
  const client = getS3Client();
  const bucket = getBucketName();

  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
};

export const extractS3Key = (fileLocation: string): string => {
  // fileLocation format: s3://bucket-name/key
  const parts = fileLocation.replace('s3://', '').split('/');
  parts.shift(); // remove bucket name
  return parts.join('/');
};
