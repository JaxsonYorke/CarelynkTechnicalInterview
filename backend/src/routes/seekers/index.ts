import { Router } from 'express';
import profileRouter from './profile';
import jobsRouter from './jobs';

const router = Router();

router.use(profileRouter);
router.use(jobsRouter);

export default router;
