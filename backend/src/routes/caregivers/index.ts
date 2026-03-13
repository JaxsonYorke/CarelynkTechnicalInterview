import { Router } from 'express';
import profileRouter from './profile';

const router = Router();

router.use(profileRouter);

export default router;
