import { Router } from 'express';
import { requireRole } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';
import { careRequestRepository } from '../../db/repositories/careRequestRepository';
import { careSeekerProfileRepository } from '../../db/repositories/careSeekerProfileRepository';
import { caregiverProfileRepository } from '../../db/repositories/caregiverProfileRepository';
import { matchRepository } from '../../db/repositories/matchRepository';
import { jobAcceptRequestRepository } from '../../db/repositories/jobAcceptRequestRepository';
import { NotFoundError } from '../../utils/errors';
import { AuthRequest } from '../../middleware/errorHandler';
import type { Response } from 'express';
import { getPathParam } from '../../utils/request';

const router = Router();

// GET /api/jobs/:jobId/matches - Get matches for a specific job with caregiver details
router.get(
  '/jobs/:jobId/matches',
  requireRole('care_seeker'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const jobId = getPathParam(req.params.jobId);

    // Verify the care request exists and belongs to the user
    const careRequest = await careRequestRepository.findById(jobId);
    if (!careRequest) {
      throw new NotFoundError('Care request', jobId);
    }

    // Verify ownership
    const careSeekerProfile = await careSeekerProfileRepository.findByUserId(req.user!.id);
    if (!careSeekerProfile || careRequest.care_seeker_id !== careSeekerProfile.id) {
      throw new NotFoundError('Care request', jobId);
    }

    // Get matches with caregiver details
    const matches = await matchRepository.findByRequestId(jobId);
    const acceptRequest = await jobAcceptRequestRepository.findByCareRequestIdForSeeker(jobId);
    
    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        const caregiver = await caregiverProfileRepository.findById(match.caregiver_id);
        return {
          ...match,
          caregiver,
        };
      })
    );

    res.json({
      success: true,
      data: {
        job_id: jobId,
        matches: enrichedMatches,
        accept_request: acceptRequest,
      },
    });
  })
);

export default router;
