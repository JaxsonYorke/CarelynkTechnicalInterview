import { Router } from 'express';
import type { Response } from 'express';
import { requireRole } from '../middleware/auth';
import { asyncHandler, AuthRequest } from '../middleware/errorHandler';
import { experienceOptionRepository } from '../db/repositories/experienceOptionRepository';
import { ValidationError } from '../utils/errors';

const router = Router();

router.get(
  '/experience-options',
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    const options = await experienceOptionRepository.findAll();
    res.json({
      success: true,
      data: options.map((option) => option.label),
    });
  })
);

router.post(
  '/experience-options',
  requireRole('caregiver'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { label } = req.body;
    if (!label || typeof label !== 'string' || label.trim().length === 0) {
      throw new ValidationError('label is required and must be a non-empty string');
    }

    const created = await experienceOptionRepository.create(label, req.user!.id);
    res.status(201).json({
      success: true,
      data: created.label,
    });
  })
);

export default router;
