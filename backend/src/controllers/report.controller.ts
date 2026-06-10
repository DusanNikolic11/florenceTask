import { Request, Response } from 'express';
import { Report } from '../models/report.model';
import { ReportInstance } from '../models/reportInstance.model';
import { getCallerId } from '../middleware/auth.middleware';

export const listReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const reports = await Report.find({ userId: getCallerId(req) }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error('List reports error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      res.status(404).json({ message: 'Report not found' });
      return;
    }
    if (report.userId.toString() !== getCallerId(req)) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    res.json(report);
  } catch (err) {
    console.error('Get report error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, filenamePattern, frequencyDays } = req.body;

    if (!name || !filenamePattern) {
      res.status(400).json({ message: 'name and filenamePattern are required' });
      return;
    }

    const report = await Report.create({
      userId: getCallerId(req),
      name,
      filenamePattern,
      frequencyDays: frequencyDays ?? 7,
    });

    res.status(201).json(report);
  } catch (err) {
    console.error('Create report error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      res.status(404).json({ message: 'Report not found' });
      return;
    }
    if (report.userId.toString() !== getCallerId(req)) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    // Strip fields that must not be changed via PATCH
    const { _id, userId, ...allowedUpdates } = req.body;
    void _id;
    void userId;

    const updated = await Report.findByIdAndUpdate(req.params.id, allowedUpdates, {
      new: true,
      runValidators: true,
    });

    res.json(updated);
  } catch (err) {
    console.error('Update report error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      res.status(404).json({ message: 'Report not found' });
      return;
    }
    if (report.userId.toString() !== getCallerId(req)) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    await report.deleteOne();
    res.status(204).send();
  } catch (err) {
    console.error('Delete report error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const listReportInstances = async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      res.status(404).json({ message: 'Report not found' });
      return;
    }
    if (report.userId.toString() !== getCallerId(req)) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const instances = await ReportInstance.find({ reportId: report._id }).sort({
      generatedAt: -1,
    });
    res.json(instances);
  } catch (err) {
    console.error('List report instances error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
