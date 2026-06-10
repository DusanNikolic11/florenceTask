import { Request, Response } from 'express';
import { getCallerId } from '../middleware/auth.middleware';
import {
  listReports,
  getReport,
  createReport,
  updateReport,
  deleteReport,
  listReportInstances,
} from '../services/report.service';
import { handleError } from '../services/errors';

export const listReportsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const reports = await listReports(getCallerId(req));
    res.json(reports);
  } catch (err) {
    handleError(err, res, 'listReports');
  }
};

export const getReportHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await getReport(req.params.id, getCallerId(req));
    res.json(report);
  } catch (err) {
    handleError(err, res, 'getReport');
  }
};

export const createReportHandler = async (req: Request, res: Response): Promise<void> => {
  const { name, filenamePattern, frequencyDays } = req.body;

  if (!name || !filenamePattern) {
    res.status(400).json({ message: 'name and filenamePattern are required' });
    return;
  }

  try {
    const report = await createReport(getCallerId(req), { name, filenamePattern, frequencyDays });
    res.status(201).json(report);
  } catch (err) {
    handleError(err, res, 'createReport');
  }
};

export const updateReportHandler = async (req: Request, res: Response): Promise<void> => {
  const { _id, userId, ...updates } = req.body;
  void _id;
  void userId;

  try {
    const report = await updateReport(req.params.id, getCallerId(req), updates);
    res.json(report);
  } catch (err) {
    handleError(err, res, 'updateReport');
  }
};

export const deleteReportHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    await deleteReport(req.params.id, getCallerId(req));
    res.status(204).send();
  } catch (err) {
    handleError(err, res, 'deleteReport');
  }
};

export const listReportInstancesHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const instances = await listReportInstances(req.params.id, getCallerId(req));
    res.json(instances);
  } catch (err) {
    handleError(err, res, 'listReportInstances');
  }
};
