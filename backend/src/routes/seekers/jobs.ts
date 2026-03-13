import { Router } from 'express';
import { requireRole } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';
import { careRequestRepository } from '../../db/repositories/careRequestRepository';
import { careSeekerProfileRepository } from '../../db/repositories/careSeekerProfileRepository';
import { jobAcceptRequestRepository } from '../../db/repositories/jobAcceptRequestRepository';
import { matchRepository } from '../../db/repositories/matchRepository';
import { experienceOptionRepository } from '../../db/repositories/experienceOptionRepository';
import { matchingService } from '../../services/matchingService';
import { ConflictError, NotFoundError, ValidationError } from '../../utils/errors';
import { AuthRequest } from '../../middleware/errorHandler';
import type { Response } from 'express';
import { buildLocationPayload } from '../../utils/location';
import { getPathParam } from '../../utils/request';

const router = Router();

const isLockedByAcceptRequestStatus = (status: string | undefined): boolean =>
  status === 'pending' || status === 'accepted';

const validateCareRequestPayload = async (body: any) => {
  const { care_type, service_location, schedule, duration, required_experiences } = body;

  if (!care_type || typeof care_type !== 'string' || care_type.trim().length === 0) {
    throw new ValidationError('care_type is required and must be a non-empty string');
  }
  const normalizedLocation = buildLocationPayload(
    typeof service_location === 'string' ? service_location : undefined,
    body.service_location_details
  );
  if (!normalizedLocation.legacy || !normalizedLocation.details) {
    throw new ValidationError(
      'service_location_details is required and must include country_code, state_or_province, and city'
    );
  }
  if (!schedule || typeof schedule !== 'string' || schedule.trim().length === 0) {
    throw new ValidationError('schedule is required and must be a non-empty string');
  }
  if (!duration || typeof duration !== 'string' || duration.trim().length === 0) {
    throw new ValidationError('duration is required and must be a non-empty string');
  }
  if (
    required_experiences !== undefined &&
    (!Array.isArray(required_experiences) ||
      required_experiences.some(
        (experience) => typeof experience !== 'string' || experience.trim().length === 0
      ))
  ) {
    throw new ValidationError(
      'required_experiences must be an array of non-empty strings when provided'
    );
  }

  const normalizedRequiredExperiences = Array.isArray(required_experiences)
    ? required_experiences.map((experience: string) => experience.trim())
    : [];
  const foundOptions = await experienceOptionRepository.findByLabels(normalizedRequiredExperiences);

  if (foundOptions.length !== normalizedRequiredExperiences.length) {
    throw new ValidationError(
      'required_experiences must contain only valid shared experience options'
    );
  }

  return {
    normalizedLocation,
    canonicalRequiredExperiences: foundOptions.map((option) => option.label),
  };
};

const assertOwnedCareRequest = async (jobId: string, userId: string) => {
  const careRequest = await careRequestRepository.findById(jobId);
  if (!careRequest) {
    throw new NotFoundError('Care request', jobId);
  }

  const careSeekerProfile = await careSeekerProfileRepository.findByUserId(userId);
  if (!careSeekerProfile || careRequest.care_seeker_id !== careSeekerProfile.id) {
    throw new NotFoundError('Care request', jobId);
  }

  return careRequest;
};

// POST /api/jobs - Create a new care request
router.post(
  '/jobs',
  requireRole('care_seeker'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { care_type, service_location, schedule, duration, preferences, required_experiences } = req.body;

    const { normalizedLocation, canonicalRequiredExperiences } = await validateCareRequestPayload(req.body);

    // Get or create care seeker profile to get profile ID
    let careSeekerProfile = await careSeekerProfileRepository.findByUserId(req.user!.id);
    if (!careSeekerProfile) {
      throw new NotFoundError('Care seeker profile');
    }

    // Create care request
    const careRequest = await careRequestRepository.create(
      careSeekerProfile.id,
      care_type.trim(),
      normalizedLocation.legacy,
      normalizedLocation.details,
      schedule.trim(),
      duration.trim(),
      preferences?.trim(),
      canonicalRequiredExperiences
    );

    await matchingService.matchCareRequest(careRequest);

    res.status(201).json({
      success: true,
      data: careRequest,
    });
  })
);

// GET /api/jobs - Get all care requests for the authenticated user
router.get(
  '/jobs',
  requireRole('care_seeker'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    // Get care seeker profile
    const careSeekerProfile = await careSeekerProfileRepository.findByUserId(req.user!.id);
    
    if (!careSeekerProfile) {
      // Return empty list if no profile yet
      res.json({
        success: true,
        data: [],
      });
      return;
    }

    // Get all care requests for this seeker
    const careRequests = await careRequestRepository.findByCareSeekerProfileId(careSeekerProfile.id);
    const enrichedRequests = await Promise.all(
      careRequests.map(async (careRequest) => {
        const acceptRequest = await jobAcceptRequestRepository.findByCareRequestIdForSeeker(careRequest.id);
        return {
          ...careRequest,
          accept_request_status: acceptRequest?.status ?? null,
          can_modify: !isLockedByAcceptRequestStatus(acceptRequest?.status),
        };
      })
    );

    res.json({
      success: true,
      data: enrichedRequests,
    });
  })
);

// GET /api/jobs/:jobId - Get one care request for editing
router.get(
  '/jobs/:jobId',
  requireRole('care_seeker'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const jobId = getPathParam(req.params.jobId);
    const careRequest = await assertOwnedCareRequest(jobId, req.user!.id);
    const acceptRequest = await jobAcceptRequestRepository.findByCareRequestIdForSeeker(jobId);

    res.json({
      success: true,
      data: {
        ...careRequest,
        accept_request_status: acceptRequest?.status ?? null,
        can_modify: !isLockedByAcceptRequestStatus(acceptRequest?.status),
      },
    });
  })
);

// PATCH /api/jobs/:jobId - Update care request if not sent/accepted
router.patch(
  '/jobs/:jobId',
  requireRole('care_seeker'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const jobId = getPathParam(req.params.jobId);
    const { care_type, service_location, schedule, duration, preferences, required_experiences } = req.body;

    const { normalizedLocation, canonicalRequiredExperiences } = await validateCareRequestPayload(req.body);
    await assertOwnedCareRequest(jobId, req.user!.id);

    const acceptRequest = await jobAcceptRequestRepository.findByCareRequestIdForSeeker(jobId);
    if (isLockedByAcceptRequestStatus(acceptRequest?.status)) {
      throw new ConflictError('Care requests cannot be edited after they are sent or accepted');
    }

    const updatedRequest = await careRequestRepository.updateById(
      jobId,
      care_type.trim(),
      normalizedLocation.legacy,
      normalizedLocation.details,
      schedule.trim(),
      duration.trim(),
      preferences?.trim(),
      canonicalRequiredExperiences
    );

    if (!updatedRequest) {
      throw new NotFoundError('Care request', jobId);
    }

    await matchRepository.deleteByRequestId(jobId);
    await matchingService.matchCareRequest(updatedRequest);

    res.json({
      success: true,
      data: {
        ...updatedRequest,
        accept_request_status: acceptRequest?.status ?? null,
        can_modify: true,
      },
    });
  })
);

// DELETE /api/jobs/:jobId - Delete care request if not sent/accepted
router.delete(
  '/jobs/:jobId',
  requireRole('care_seeker'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const jobId = getPathParam(req.params.jobId);
    await assertOwnedCareRequest(jobId, req.user!.id);

    const acceptRequest = await jobAcceptRequestRepository.findByCareRequestIdForSeeker(jobId);
    if (isLockedByAcceptRequestStatus(acceptRequest?.status)) {
      throw new ConflictError('Care requests cannot be deleted after they are sent or accepted');
    }

    const deleted = await careRequestRepository.deleteById(jobId);
    if (!deleted) {
      throw new NotFoundError('Care request', jobId);
    }

    res.json({
      success: true,
      data: { id: jobId, deleted: true },
    });
  })
);

export default router;
