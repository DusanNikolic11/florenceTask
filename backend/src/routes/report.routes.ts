import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  listReports,
  getReport,
  createReport,
  updateReport,
  deleteReport,
} from '../controllers/report.controller';

const router = Router();

router.use(requireAuth);

router.get('/', listReports);
router.post('/', createReport);
router.get('/:id', getReport);
router.patch('/:id', updateReport);
router.delete('/:id', deleteReport);

export default router;
