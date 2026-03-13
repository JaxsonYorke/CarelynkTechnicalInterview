import { Router } from 'express';
import matchesRouter from './matches';
import acceptRequestsRouter from './acceptRequests';

const router = Router();

router.use(matchesRouter);
router.use(acceptRequestsRouter);

export default router;
