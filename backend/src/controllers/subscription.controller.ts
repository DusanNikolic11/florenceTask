import { Request, Response } from 'express';
import { getCallerId } from '../middleware/auth.middleware';
import {
  subscribeToReport,
  unsubscribeFromReport,
  getSubscriptionStatus,
  listSubscribedReportIds,
} from '../services/subscription.service';
import { handleError } from '../services/errors';

export const subscribe = async (req: Request, res: Response): Promise<void> => {
  try {
    await subscribeToReport(req.params.id, getCallerId(req));
    res.status(200).json({ subscribed: true });
  } catch (err) {
    handleError(err, res, 'subscribe');
  }
};

export const unsubscribe = async (req: Request, res: Response): Promise<void> => {
  try {
    await unsubscribeFromReport(req.params.id, getCallerId(req));
    res.status(200).json({ subscribed: false });
  } catch (err) {
    handleError(err, res, 'unsubscribe');
  }
};

export const getSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const subscribed = await getSubscriptionStatus(req.params.id, getCallerId(req));
    res.json({ subscribed });
  } catch (err) {
    handleError(err, res, 'getSubscription');
  }
};

export const listMySubscribedReportIds = async (req: Request, res: Response): Promise<void> => {
  try {
    const reportIds = await listSubscribedReportIds(getCallerId(req));
    res.json(reportIds);
  } catch (err) {
    handleError(err, res, 'listSubscribedReportIds');
  }
};
