import { Router } from 'express';
import profileRouter from './profile';
import jobsRouter from './jobs';
import caregiversRouter from './caregivers';

const router = Router();

router.use(profileRouter);
router.use(jobsRouter);
router.use(caregiversRouter);

export default router;
