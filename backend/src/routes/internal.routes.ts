import { Router, Request, Response } from 'express';
import { ipAllowlist } from '../middleware/ipAllowlist.middleware';
import { triggerDueReports } from '../jobs/reportCron';

const router = Router();

router.use(ipAllowlist);

/**
 * POST /internal/reports/trigger
 *
 * Runs the same logic the midnight cron executes:
 * fetches all enabled reports, filters the ones that are due,
 * and sends a Kafka message for each.
 *
 * Useful during testing to trigger generation without waiting for midnight.
 */
router.post('/reports/trigger', async (_req: Request, res: Response): Promise<void> => {
  try {
    await triggerDueReports();
    res.json({ message: 'Due reports queued for generation' });
  } catch (err) {
    console.error('[Internal] /reports/trigger error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
