import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  listReportsHandler,
  getReportHandler,
  createReportHandler,
  updateReportHandler,
  deleteReportHandler,
  listReportInstancesHandler,
} from '../controllers/report.controller';
import {
  subscribe,
  unsubscribe,
  getSubscription,
  listMySubscribedReportIds,
} from '../controllers/subscription.controller';

const router = Router();

router.use(requireAuth);

router.get('/', listReportsHandler);
router.post('/', createReportHandler);
router.get('/subscriptions', listMySubscribedReportIds);
router.get('/:id', getReportHandler);
router.get('/:id/instances', listReportInstancesHandler);
router.get('/:id/subscription', getSubscription);
router.post('/:id/subscribe', subscribe);
router.delete('/:id/subscribe', unsubscribe);
router.patch('/:id', updateReportHandler);
router.delete('/:id', deleteReportHandler);

export default router;
