import { Request, Response } from 'express';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { DocumentModel } from '../models/document.model';
import {
  uploadToS3,
  deleteFromS3,
  extractS3Key,
  streamFromS3,
} from '../config/aws/s3.service';

export const createDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'File is required' });
      return;
    }

    const filename = req.body.filename || req.file.originalname;
    const buffer = req.file.buffer;
    const size = buffer.length;
    const md5 = crypto.createHash('md5').update(buffer).digest('hex');
    const key = `documents/${uuidv4()}-${filename}`;

    const fileLocation = await uploadToS3(key, buffer, req.file.mimetype);

    const doc = await DocumentModel.create({
      Filename: filename,
      FileLocation: fileLocation,
      Size: size,
      MD5: md5,
    });

    res.status(201).json(doc);
  } catch (err) {
    console.error('Create document error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await DocumentModel.findById(req.params.id);
    if (!doc) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }
    res.json(doc);
  } catch (err) {
    console.error('Get document error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const listDocuments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const docs = await DocumentModel.find().sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    console.error('List documents error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { _id, ...updates } = req.body;
    void _id;

    const doc = await DocumentModel.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    res.json(doc);
  } catch (err) {
    console.error('Update document error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await DocumentModel.findById(req.params.id);
    if (!doc) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    const key = extractS3Key(doc.FileLocation);
    await deleteFromS3(key);
    await doc.deleteOne();

    res.status(204).send();
  } catch (err) {
    console.error('Delete document error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const downloadDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await DocumentModel.findById(req.params.id);
    if (!doc) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    const key = extractS3Key(doc.FileLocation);
    const stream = await streamFromS3(key);

    res.setHeader('Content-Disposition', `attachment; filename="${doc.Filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    stream.pipe(res);
  } catch (err) {
    console.error('Download document error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
