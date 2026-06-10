import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';
import { DocumentModel } from '../models/document.model';
import { uploadToS3, deleteFromS3, extractS3Key, streamFromS3 } from '../config/aws/s3.service';
import { ServiceError } from './errors';
import { PaginatedResult } from '../types/pagination';

export const createDocument = async (
  file: Express.Multer.File,
  filenameOverride?: string
): Promise<InstanceType<typeof DocumentModel>> => {
  const filename = filenameOverride || file.originalname;
  const buffer = file.buffer;
  const size = buffer.length;
  const md5 = crypto.createHash('md5').update(buffer).digest('hex');
  const key = `documents/${uuidv4()}-${filename}`;

  const fileLocation = await uploadToS3(key, buffer, file.mimetype);

  return DocumentModel.create({ Filename: filename, FileLocation: fileLocation, Size: size, MD5: md5 });
};

export const getDocumentById = async (id: string): Promise<InstanceType<typeof DocumentModel>> => {
  const doc = await DocumentModel.findById(id);
  if (!doc) throw new ServiceError('NOT_FOUND', 'Document not found');
  return doc;
};

export const listDocuments = async (
  page: number,
  limit: number
): Promise<PaginatedResult<InstanceType<typeof DocumentModel>>> => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    DocumentModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    DocumentModel.countDocuments(),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const updateDocument = async (
  id: string,
  updates: Record<string, unknown>
): Promise<InstanceType<typeof DocumentModel>> => {
  const doc = await DocumentModel.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });
  if (!doc) throw new ServiceError('NOT_FOUND', 'Document not found');
  return doc;
};

export const deleteDocument = async (id: string): Promise<void> => {
  const doc = await DocumentModel.findById(id);
  if (!doc) throw new ServiceError('NOT_FOUND', 'Document not found');

  const key = extractS3Key(doc.FileLocation);
  await deleteFromS3(key);
  await doc.deleteOne();
};

export const streamDocumentFile = async (
  id: string
): Promise<{ stream: Readable; filename: string }> => {
  const doc = await DocumentModel.findById(id);
  if (!doc) throw new ServiceError('NOT_FOUND', 'Document not found');

  const key = extractS3Key(doc.FileLocation);
  const stream = await streamFromS3(key);
  return { stream, filename: doc.Filename };
};
