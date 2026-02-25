import { Router } from 'express';
import uploadRoutes from './upload.routes.js';
import fileRoutes from './file.routes.js';
import { healthController } from '../controllers/health.controller.js';

const router = Router();

// Health check
router.get('/health', healthController.check.bind(healthController));

// API routes
router.use('/upload', uploadRoutes);
router.use('/files', fileRoutes);

export default router;
