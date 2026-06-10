import { Report } from '../models/report.model';
import { ReportInstance } from '../models/reportInstance.model';
import { ServiceError } from './errors';

export const listReports = async (userId: string) => {
  return Report.find({ userId }).sort({ createdAt: -1 });
};

export const getReport = async (id: string, userId: string) => {
  const report = await Report.findById(id);
  if (!report) throw new ServiceError('NOT_FOUND', 'Report not found');
  if (report.userId.toString() !== userId) throw new ServiceError('FORBIDDEN', 'Forbidden');
  return report;
};

export const createReport = async (
  userId: string,
  data: { name: string; filenamePattern: string; frequencyDays?: number }
) => {
  return Report.create({
    userId,
    name: data.name,
    filenamePattern: data.filenamePattern,
    frequencyDays: data.frequencyDays ?? 7,
  });
};

export const updateReport = async (
  id: string,
  userId: string,
  updates: Record<string, unknown>
) => {
  const report = await Report.findById(id);
  if (!report) throw new ServiceError('NOT_FOUND', 'Report not found');
  if (report.userId.toString() !== userId) throw new ServiceError('FORBIDDEN', 'Forbidden');

  return Report.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
};

export const deleteReport = async (id: string, userId: string): Promise<void> => {
  const report = await Report.findById(id);
  if (!report) throw new ServiceError('NOT_FOUND', 'Report not found');
  if (report.userId.toString() !== userId) throw new ServiceError('FORBIDDEN', 'Forbidden');

  await report.deleteOne();
};

export const listReportInstances = async (id: string, userId: string) => {
  const report = await Report.findById(id);
  if (!report) throw new ServiceError('NOT_FOUND', 'Report not found');
  if (report.userId.toString() !== userId) throw new ServiceError('FORBIDDEN', 'Forbidden');

  return ReportInstance.find({ reportId: report._id }).sort({ generatedAt: -1 });
};
