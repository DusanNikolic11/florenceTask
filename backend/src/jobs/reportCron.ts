import cron from 'node-cron';
import { Report } from '../models/report.model';
import { sendReportMessage } from '../config/kafka';

const MS_PER_DAY = 86_400_000;

export const startReportCron = (): void => {
  // Runs every day at midnight: 0 0 * * *
  cron.schedule('0 0 * * *', async () => {
    console.log('[ReportCron] Midnight tick — checking due reports');
    await triggerDueReports();
  });

  console.log('[ReportCron] Scheduled (daily at midnight)');
};

export const triggerDueReports = async (): Promise<void> => {
  const now = Date.now();

  const allReports = await Report.find({ enabled: true });

  const dueReports = allReports.filter((report) => {
    const lastRun = report.lastGeneratedAt ? report.lastGeneratedAt.getTime() : 0;
    return lastRun + report.frequencyDays * MS_PER_DAY <= now;
  });

  if (dueReports.length === 0) {
    console.log('[ReportCron] No reports due');
    return;
  }

  console.log(`[ReportCron] ${dueReports.length} report(s) due, sending to Kafka`);

  for (const report of dueReports) {
    try {
      await sendReportMessage(report._id.toString());
      console.log(`[ReportCron] Queued report "${report.name}" (${report._id})`);
    } catch (err) {
      console.error(`[ReportCron] Failed to queue report ${report._id}:`, err);
    }
  }
};
