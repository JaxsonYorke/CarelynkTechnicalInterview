import { getDatabase } from '../../db/connection';
import {
  JobAcceptRequest,
  JobAcceptRequestForSeeker,
  JobAcceptRequestWithContext,
} from '../../types';
import { firstRowOrNull } from './helpers';

type JobAcceptRequestWithJoinRow = JobAcceptRequest & {
  care_type: string;
  service_location: string;
  schedule: string;
  duration: string | null;
  care_seeker_id: string;
  care_seeker_name: string;
  care_seeker_contact_info: string;
  care_seeker_email: string;
};

type JobAcceptRequestWithCaregiverEmailRow = JobAcceptRequest & {
  caregiver_email: string;
};

const toJobAcceptRequestWithContext = (
  row: JobAcceptRequestWithJoinRow
): JobAcceptRequestWithContext => ({
  id: row.id,
  care_request_id: row.care_request_id,
  caregiver_id: row.caregiver_id,
  status: row.status,
  created_at: row.created_at,
  responded_at: row.responded_at,
  care_request: {
    id: row.care_request_id,
    care_type: row.care_type,
    service_location: row.service_location,
    schedule: row.schedule,
    duration: row.duration,
  },
  care_seeker: {
    id: row.care_seeker_id,
    name: row.care_seeker_name,
    contact_info: row.care_seeker_contact_info,
    email: row.care_seeker_email,
  },
});

export const jobAcceptRequestRepository = {
  async create(careRequestId: string, caregiverId: string): Promise<JobAcceptRequest> {
    const db = getDatabase();
    const result = await db<JobAcceptRequest[]>`
      INSERT INTO job_accept_requests (care_request_id, caregiver_id)
      VALUES (${careRequestId}, ${caregiverId})
      RETURNING *
    `;
    return result[0];
  },

  async findByCareRequestId(careRequestId: string): Promise<JobAcceptRequest | null> {
    const db = getDatabase();
    const result = await db<JobAcceptRequest[]>`
      SELECT * FROM job_accept_requests
      WHERE care_request_id = ${careRequestId}
      LIMIT 1
    `;
    return firstRowOrNull(result);
  },

  async findPendingByCaregiverId(caregiverId: string): Promise<JobAcceptRequestWithContext[]> {
    const db = getDatabase();
    const rows = await db<JobAcceptRequestWithJoinRow[]>`
      SELECT
        jar.*,
        cr.care_type,
        cr.service_location,
        cr.schedule,
        cr.duration,
        csp.id AS care_seeker_id,
        csp.name AS care_seeker_name,
        csp.contact_info AS care_seeker_contact_info,
        u.email AS care_seeker_email
      FROM job_accept_requests jar
      INNER JOIN care_requests cr ON cr.id = jar.care_request_id
      INNER JOIN care_seeker_profiles csp ON csp.id = cr.care_seeker_id
      INNER JOIN users u ON u.id = csp.user_id
      WHERE jar.caregiver_id = ${caregiverId}
        AND jar.status = 'pending'
      ORDER BY jar.created_at DESC
    `;

    return rows.map(toJobAcceptRequestWithContext);
  },

  async findAcceptedByCaregiverId(caregiverId: string): Promise<JobAcceptRequestWithContext[]> {
    const db = getDatabase();
    const rows = await db<JobAcceptRequestWithJoinRow[]>`
      SELECT
        jar.*,
        cr.care_type,
        cr.service_location,
        cr.schedule,
        cr.duration,
        csp.id AS care_seeker_id,
        csp.name AS care_seeker_name,
        csp.contact_info AS care_seeker_contact_info,
        u.email AS care_seeker_email
      FROM job_accept_requests jar
      INNER JOIN care_requests cr ON cr.id = jar.care_request_id
      INNER JOIN care_seeker_profiles csp ON csp.id = cr.care_seeker_id
      INNER JOIN users u ON u.id = csp.user_id
      WHERE jar.caregiver_id = ${caregiverId}
        AND jar.status = 'accepted'
      ORDER BY jar.responded_at DESC, jar.created_at DESC
    `;

    return rows.map(toJobAcceptRequestWithContext);
  },

  async findByCareRequestIdForSeeker(careRequestId: string): Promise<JobAcceptRequestForSeeker | null> {
    const db = getDatabase();
    const rows = await db<JobAcceptRequestWithCaregiverEmailRow[]>`
      SELECT
        jar.*,
        u.email AS caregiver_email
      FROM job_accept_requests jar
      LEFT JOIN caregiver_profiles cp ON cp.id = jar.caregiver_id
      LEFT JOIN users u ON u.id = cp.user_id
      WHERE jar.care_request_id = ${careRequestId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return null;
    }

    const request = rows[0];
    return {
      id: request.id,
      care_request_id: request.care_request_id,
      caregiver_id: request.caregiver_id,
      status: request.status,
      created_at: request.created_at,
      responded_at: request.responded_at,
      is_accepted_by_caregiver: request.status === 'accepted',
      accepted_caregiver_contact_email:
        request.status === 'accepted' ? request.caregiver_email ?? null : null,
    };
  },

  async acceptByIdForCaregiver(
    requestId: string,
    caregiverId: string
  ): Promise<JobAcceptRequest | null> {
    const db = getDatabase();
    const result = await db<JobAcceptRequest[]>`
      UPDATE job_accept_requests
      SET status = 'accepted', responded_at = NOW()
      WHERE id = ${requestId}
        AND caregiver_id = ${caregiverId}
        AND status = 'pending'
      RETURNING *
    `;
    return firstRowOrNull(result);
  },
};
