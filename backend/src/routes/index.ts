import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import authRouter from './auth';
import seekersRouter from './seekers';
import caregiversRouter from './caregivers';
import jobsRouter from './jobs';
import experiencesRouter from './experiences';
import skillsRouter from './skills';

const router = Router();

// Auth routes (no auth required)
router.use(authRouter);

// Protected routes (auth required)
router.use(authMiddleware);
router.use(seekersRouter);
router.use(caregiversRouter);
router.use(jobsRouter);
router.use(experiencesRouter);
router.use(skillsRouter);

export default router;
