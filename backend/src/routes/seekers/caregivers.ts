import { Router } from 'express';
import type { Response } from 'express';
import { caregiverProfileRepository } from '../../db/repositories/caregiverProfileRepository';
import { requireRole } from '../../middleware/auth';
import { asyncHandler, AuthRequest } from '../../middleware/errorHandler';

const router = Router();

// GET /api/seekers/caregivers - Browse caregivers with optional search
router.get(
  '/seekers/caregivers',
  requireRole('care_seeker'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const rawQuery = req.query.q;
    const q = typeof rawQuery === 'string' ? rawQuery.trim() : '';

    const caregivers =
      q.length > 0
        ? await caregiverProfileRepository.findAllByNameOrSkillsQuery(q)
        : await caregiverProfileRepository.findAll();

    res.json({
      success: true,
      data: caregivers,
    });
  })
);

export default router;
