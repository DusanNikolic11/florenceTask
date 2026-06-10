import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  listReports,
  getReport,
  createReport,
  updateReport,
  deleteReport,
  listReportInstances,
} from '../controllers/report.controller';
import {
  subscribe,
  unsubscribe,
  getSubscription,
  listMySubscribedReportIds,
} from '../controllers/subscription.controller';

const router = Router();

router.use(requireAuth);

router.get('/', listReports);
router.post('/', createReport);
router.get('/subscriptions', listMySubscribedReportIds);
router.get('/:id', getReport);
router.get('/:id/instances', listReportInstances);
router.get('/:id/subscription', getSubscription);
router.post('/:id/subscribe', subscribe);
router.delete('/:id/subscribe', unsubscribe);
router.patch('/:id', updateReport);
router.delete('/:id', deleteReport);

export default router;
