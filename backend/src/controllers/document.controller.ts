import { Request, Response } from 'express';
import {
  createDocument,
  getDocumentById,
  listDocuments,
  updateDocument,
  deleteDocument,
  streamDocumentFile,
} from '../services/document.service';
import { handleError } from '../services/errors';
import { parsePaginationParams } from '../types/pagination';

export const createDocumentHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ message: 'File is required' });
    return;
  }

  try {
    const doc = await createDocument(req.file, req.body.filename);
    res.status(201).json(doc);
  } catch (err) {
    handleError(err, res, 'createDocument');
  }
};

export const getDocumentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await getDocumentById(req.params.id);
    res.json(doc);
  } catch (err) {
    handleError(err, res, 'getDocument');
  }
};

export const listDocumentsHandler = async (req: Request, res: Response): Promise<void> => {
  const { page, limit } = parsePaginationParams(req.query.page, req.query.limit);
  try {
    const result = await listDocuments(page, limit);
    res.json(result);
  } catch (err) {
    handleError(err, res, 'listDocuments');
  }
};

export const updateDocumentHandler = async (req: Request, res: Response): Promise<void> => {
  const { _id, ...updates } = req.body;
  void _id;

  try {
    const doc = await updateDocument(req.params.id, updates);
    res.json(doc);
  } catch (err) {
    handleError(err, res, 'updateDocument');
  }
};

export const deleteDocumentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    await deleteDocument(req.params.id);
    res.status(204).send();
  } catch (err) {
    handleError(err, res, 'deleteDocument');
  }
};

export const downloadDocumentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { stream, filename } = await streamDocumentFile(req.params.id);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    stream.pipe(res);
  } catch (err) {
    handleError(err, res, 'downloadDocument');
  }
};
