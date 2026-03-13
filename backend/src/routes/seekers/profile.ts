import { Router } from 'express';
import { requireRole } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';
import { careSeekerProfileRepository } from '../../db/repositories/careSeekerProfileRepository';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { AuthRequest } from '../../middleware/errorHandler';
import type { Response } from 'express';

const router = Router();

const parseCareSeekerProfilePayload = (
  body: unknown
): { name: string; contact_info: string; location: string } => {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body is required');
  }

  const { name, contact_info, location } = body as Record<string, unknown>;

  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new ValidationError('name is required and must be a non-empty string');
  }
  if (typeof contact_info !== 'string' || contact_info.trim().length === 0) {
    throw new ValidationError('contact_info is required and must be a non-empty string');
  }
  if (typeof location !== 'string' || location.trim().length === 0) {
    throw new ValidationError('location is required and must be a non-empty string');
  }

  return {
    name: name.trim(),
    contact_info: contact_info.trim(),
    location: location.trim(),
  };
};

// GET /api/seekers/profile - Get care seeker profile
router.get(
  '/seekers/profile',
  requireRole('care_seeker'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const profile = await careSeekerProfileRepository.findByUserId(req.user!.id);

    if (!profile) {
      throw new NotFoundError('Care seeker profile');
    }

    res.json({
      success: true,
      data: profile,
    });
  })
);

// POST /api/seekers/profile - Create or update care seeker profile
router.post(
  '/seekers/profile',
  requireRole('care_seeker'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const payload = parseCareSeekerProfilePayload(req.body);

    // Check if profile exists
    let profile = await careSeekerProfileRepository.findByUserId(req.user!.id);

    if (profile) {
      // Update existing profile
      const updatedProfile = await careSeekerProfileRepository.update(req.user!.id, {
        name: payload.name,
        contact_info: payload.contact_info,
        location: payload.location,
      });

      if (!updatedProfile) {
        throw new NotFoundError('Care seeker profile');
      }

      res.json({
        success: true,
        data: updatedProfile,
      });
    } else {
      // Create new profile
      const newProfile = await careSeekerProfileRepository.create(
        req.user!.id,
        payload.name,
        payload.contact_info,
        payload.location
      );

      res.status(201).json({
        success: true,
        data: newProfile,
      });
    }
  })
);

// PUT /api/seekers/profile - Update care seeker profile
router.put(
  '/seekers/profile',
  requireRole('care_seeker'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const payload = parseCareSeekerProfilePayload(req.body);

    // Update profile
    const updatedProfile = await careSeekerProfileRepository.update(req.user!.id, {
      name: payload.name,
      contact_info: payload.contact_info,
      location: payload.location,
    });

    if (!updatedProfile) {
      throw new NotFoundError('Care seeker profile');
    }

    res.json({
      success: true,
      data: updatedProfile,
    });
  })
);

export default router;
