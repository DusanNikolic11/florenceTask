import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.middleware';
import {
  createDocument,
  getDocument,
  listDocuments,
  updateDocument,
  deleteDocument,
  downloadDocument,
} from '../controllers/document.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(requireAuth);

router.get('/', listDocuments);
router.post('/', upload.single('file'), createDocument);
router.get('/:id', getDocument);
router.patch('/:id', updateDocument);
router.delete('/:id', deleteDocument);
router.get('/:id/file', downloadDocument);

export default router;
