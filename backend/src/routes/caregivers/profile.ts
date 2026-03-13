import { Router } from 'express';
import { requireRole } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';
import { caregiverProfileRepository } from '../../db/repositories/caregiverProfileRepository';
import { experienceOptionRepository } from '../../db/repositories/experienceOptionRepository';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { AuthRequest } from '../../middleware/errorHandler';
import type { Response } from 'express';
import { buildLocationPayload } from '../../utils/location';
import { matchingService } from '../../services/matchingService';

const router = Router();

const queueCaregiverRematch = async (caregiverProfileId: string) => {
  const profileWithQueuedStatus = await caregiverProfileRepository.updateMatchingStatusByProfileId(
    caregiverProfileId,
    'queued',
    null
  );

  if (!profileWithQueuedStatus) {
    throw new NotFoundError('Caregiver profile', caregiverProfileId);
  }

  if (!profileWithQueuedStatus.matching_updated_at) {
    throw new Error('Failed to queue caregiver rematch because matching_updated_at was not set');
  }

  matchingService.triggerCaregiverRematchInBackground(
    caregiverProfileId,
    profileWithQueuedStatus.matching_updated_at
  );
  return profileWithQueuedStatus;
};

// GET /api/caregiver/profile - Get caregiver profile
router.get(
  '/caregiver/profile',
  requireRole('caregiver'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const profile = await caregiverProfileRepository.findByUserId(req.user!.id);

    if (!profile) {
      throw new NotFoundError('Caregiver profile');
    }

    res.json({
      success: true,
      data: profile,
    });
  })
);

const upsertCaregiverProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      name,
      contact_info,
      location,
      skills,
      experience_tags,
      experience,
      availability,
      qualifications,
      location_details,
    } = req.body;

    // Validation for required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new ValidationError('name is required and must be a non-empty string');
    }
    if (!contact_info || typeof contact_info !== 'string' || contact_info.trim().length === 0) {
      throw new ValidationError('contact_info is required and must be a non-empty string');
    }
    const normalizedLocation = buildLocationPayload(
      typeof location === 'string' ? location : undefined,
      location_details
    );
    if (!normalizedLocation.legacy || !normalizedLocation.details) {
      throw new ValidationError(
        'location_details is required and must include country_code, state_or_province, and city'
      );
    }

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      throw new ValidationError('skills is required and must be a non-empty array');
    }

    if (!availability || typeof availability !== 'string' || availability.trim().length === 0) {
      throw new ValidationError('availability is required and must be a non-empty string');
    }

    if (
      experience_tags !== undefined &&
      (!Array.isArray(experience_tags) ||
        experience_tags.some(
          (item) => typeof item !== 'string' || item.trim().length === 0
        ))
    ) {
      throw new ValidationError('experience_tags must be an array of non-empty strings when provided');
    }

    let canonicalExperienceTags: string[] | undefined;
    if (Array.isArray(experience_tags)) {
      const normalizedExperienceTags = experience_tags.map((tag: string) => tag.trim());
      const foundOptions = await experienceOptionRepository.findByLabels(normalizedExperienceTags);
      if (foundOptions.length !== normalizedExperienceTags.length) {
        throw new ValidationError(
          'One or more experience_tags are not valid options. Caregivers must add options before selecting them.'
        );
      }
      canonicalExperienceTags = foundOptions.map((option) => option.label);
    }

    // Check if profile exists
    let profile = await caregiverProfileRepository.findByUserId(req.user!.id);

    if (profile) {
      // Update existing profile
      const updatedProfile = await caregiverProfileRepository.update(req.user!.id, {
        name: name.trim(),
        contact_info: contact_info.trim(),
        location: normalizedLocation.legacy,
        location_details: normalizedLocation.details,
        skills: skills.map((s: string) => s.trim()),
        experience_tags: canonicalExperienceTags,
        experience: experience ? String(experience).trim() : undefined,
        availability: availability.trim(),
        qualifications: qualifications ? String(qualifications).trim() : undefined,
      });

      if (!updatedProfile) {
        throw new NotFoundError('Caregiver profile');
      }

      const queuedProfile = await queueCaregiverRematch(updatedProfile.id);

      res.json({
        success: true,
        data: queuedProfile,
      });
    } else {
      // Create new profile
      const newProfile = await caregiverProfileRepository.create(
        req.user!.id,
        name.trim(),
        contact_info.trim(),
        normalizedLocation.legacy,
        skills.map((s: string) => s.trim()),
        availability.trim(),
        experience ? String(experience).trim() : undefined,
        qualifications ? String(qualifications).trim() : undefined,
        canonicalExperienceTags ?? [],
        normalizedLocation.details,
      );

      const queuedProfile = await queueCaregiverRematch(newProfile.id);

      res.status(201).json({
        success: true,
        data: queuedProfile,
      });
    }
  });

// POST /api/caregiver/profile - Create or update caregiver profile
router.post('/caregiver/profile', requireRole('caregiver'), upsertCaregiverProfile);

// PUT /api/caregiver/profile - Update caregiver profile
router.put('/caregiver/profile', requireRole('caregiver'), upsertCaregiverProfile);

export default router;
