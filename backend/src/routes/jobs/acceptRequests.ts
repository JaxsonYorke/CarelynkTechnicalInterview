import { Router } from 'express';
import { requireRole } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';
import { careRequestRepository } from '../../db/repositories/careRequestRepository';
import { careSeekerProfileRepository } from '../../db/repositories/careSeekerProfileRepository';
import { caregiverProfileRepository } from '../../db/repositories/caregiverProfileRepository';
import { matchRepository } from '../../db/repositories/matchRepository';
import { jobAcceptRequestRepository } from '../../db/repositories/jobAcceptRequestRepository';
import { AuthRequest } from '../../middleware/errorHandler';
import { ConflictError, NotFoundError, ValidationError } from '../../utils/errors';
import type { Response } from 'express';
import { getPathParam } from '../../utils/request';

const router = Router();

const getAuthenticatedCaregiverProfile = async (userId: string) => {
  const caregiverProfile = await caregiverProfileRepository.findByUserId(userId);
  if (!caregiverProfile) {
    throw new NotFoundError('Caregiver profile');
  }

  return caregiverProfile;
};

// POST /api/jobs/:jobId/accept - Care seeker sends accept request to a matched caregiver
// Multiple caregivers can have pending requests per job; prevents duplicate requests to same caregiver
router.post(
  '/jobs/:jobId/accept',
  requireRole('care_seeker'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const jobId = getPathParam(req.params.jobId);
    const { caregiver_id } = req.body;

    if (!caregiver_id || typeof caregiver_id !== 'string' || caregiver_id.trim().length === 0) {
      throw new ValidationError('caregiver_id is required and must be a non-empty string');
    }

    const careRequest = await careRequestRepository.findById(jobId);
    if (!careRequest) {
      throw new NotFoundError('Care request', jobId);
    }

    const careSeekerProfile = await careSeekerProfileRepository.findByUserId(req.user!.id);
    if (!careSeekerProfile || careRequest.care_seeker_id !== careSeekerProfile.id) {
      throw new NotFoundError('Care request', jobId);
    }

    const caregiverProfile = await caregiverProfileRepository.findById(caregiver_id);
    if (!caregiverProfile) {
      throw new NotFoundError('Caregiver profile', caregiver_id);
    }

    // Check if this specific caregiver already has a request for this job
    const existingRequestToThisCaregiver = await jobAcceptRequestRepository.findByCareRequestIdAndCaregiverId(
      jobId,
      caregiver_id
    );
    if (existingRequestToThisCaregiver) {
      // Idempotent: return existing request if trying to re-send to same caregiver
      res.json({
        success: true,
        data: existingRequestToThisCaregiver,
      });
      return;
    }

    const match = await matchRepository.findByRequestAndCaregiver(jobId, caregiver_id);
    if (!match) {
      throw new ValidationError('Selected caregiver is not matched to this care request');
    }

    const createdRequest = await jobAcceptRequestRepository.create(jobId, caregiver_id);

    res.status(201).json({
      success: true,
      data: createdRequest,
    });
  })
);

// GET /api/caregiver/job-accept-requests - Caregiver inbox for pending accept requests
router.get(
  '/caregiver/job-accept-requests',
  requireRole('caregiver'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const caregiverProfile = await getAuthenticatedCaregiverProfile(req.user!.id);

    const requests = await jobAcceptRequestRepository.findPendingByCaregiverId(caregiverProfile.id);

    res.json({
      success: true,
      data: requests,
    });
  })
);

// GET /api/caregiver/accepted-jobs - Caregiver list of accepted jobs
router.get(
  '/caregiver/accepted-jobs',
  requireRole('caregiver'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const caregiverProfile = await getAuthenticatedCaregiverProfile(req.user!.id);

    const requests = await jobAcceptRequestRepository.findAcceptedByCaregiverId(caregiverProfile.id);

    res.json({
      success: true,
      data: requests,
    });
  })
);

// POST /api/caregiver/job-accept-requests/:requestId/accept - Caregiver accepts a pending request
router.post(
  '/caregiver/job-accept-requests/:requestId/accept',
  requireRole('caregiver'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const requestId = getPathParam(req.params.requestId);
    const caregiverProfile = await getAuthenticatedCaregiverProfile(req.user!.id);

    const updatedRequest = await jobAcceptRequestRepository.acceptByIdForCaregiver(
      requestId,
      caregiverProfile.id
    );
    if (!updatedRequest) {
      throw new NotFoundError('Pending job accept request', requestId);
    }

    await matchRepository.deleteByRequestIdExceptCaregiverId(
      updatedRequest.care_request_id,
      caregiverProfile.id
    );
    await matchRepository.create(updatedRequest.care_request_id, caregiverProfile.id);

    res.json({
      success: true,
      data: updatedRequest,
    });
  })
);

export default router;
