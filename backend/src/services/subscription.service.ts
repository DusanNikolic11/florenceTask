import { ReportSubscription } from '../models/reportSubscription.model';
import { Report } from '../models/report.model';
import { ServiceError } from './errors';

export const subscribeToReport = async (reportId: string, userId: string): Promise<void> => {
  const report = await Report.findById(reportId);
  if (!report) throw new ServiceError('NOT_FOUND', 'Report not found');

  await ReportSubscription.updateOne(
    { reportId, userId },
    { $setOnInsert: { reportId, userId } },
    { upsert: true }
  );
};

export const unsubscribeFromReport = async (reportId: string, userId: string): Promise<void> => {
  await ReportSubscription.deleteOne({ reportId, userId });
};

export const getSubscriptionStatus = async (
  reportId: string,
  userId: string
): Promise<boolean> => {
  const subscription = await ReportSubscription.findOne({ reportId, userId });
  return !!subscription;
};

export const listSubscribedReportIds = async (userId: string): Promise<string[]> => {
  const subscriptions = await ReportSubscription.find({ userId }).select('reportId');
  return subscriptions.map((s) => s.reportId.toString());
};
