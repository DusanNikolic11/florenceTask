import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.middleware';
import {
  createDocumentHandler,
  getDocumentHandler,
  listDocumentsHandler,
  updateDocumentHandler,
  deleteDocumentHandler,
  downloadDocumentHandler,
} from '../controllers/document.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(requireAuth);

router.get('/', listDocumentsHandler);
router.post('/', upload.single('file'), createDocumentHandler);
router.get('/:id', getDocumentHandler);
router.patch('/:id', updateDocumentHandler);
router.delete('/:id', deleteDocumentHandler);
router.get('/:id/file', downloadDocumentHandler);

export default router;
