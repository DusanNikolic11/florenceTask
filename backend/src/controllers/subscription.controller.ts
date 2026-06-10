import { Request, Response } from 'express';
import { ReportSubscription } from '../models/reportSubscription.model';
import { Report } from '../models/report.model';
import { getCallerId } from '../middleware/auth.middleware';

export const subscribe = async (req: Request, res: Response): Promise<void> => {
  try {
    const reportId = req.params.id;
    const userId = getCallerId(req);

    const report = await Report.findById(reportId);
    if (!report) {
      res.status(404).json({ message: 'Report not found' });
      return;
    }

    // upsert — silently succeeds if already subscribed
    await ReportSubscription.updateOne(
      { reportId, userId },
      { $setOnInsert: { reportId, userId } },
      { upsert: true }
    );

    res.status(200).json({ subscribed: true });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const unsubscribe = async (req: Request, res: Response): Promise<void> => {
  try {
    const reportId = req.params.id;
    const userId = getCallerId(req);

    await ReportSubscription.deleteOne({ reportId, userId });

    res.status(200).json({ subscribed: false });
  } catch (err) {
    console.error('Unsubscribe error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const reportId = req.params.id;
    const userId = getCallerId(req);

    const subscription = await ReportSubscription.findOne({ reportId, userId });
    res.json({ subscribed: !!subscription });
  } catch (err) {
    console.error('Get subscription error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const listMySubscribedReportIds = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getCallerId(req);
    const subscriptions = await ReportSubscription.find({ userId }).select('reportId');
    const reportIds = subscriptions.map((s) => s.reportId.toString());
    res.json(reportIds);
  } catch (err) {
    console.error('List subscriptions error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
