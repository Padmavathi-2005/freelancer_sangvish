import pool from '../config/db.js';

export const Proposal = {
  create: async (jobId, freelancerId, coverLetter, bidAmount, deliveryDays, milestones) => {
    const query = `
      INSERT INTO proposals (
        job_id,
        freelancer_id,
        cover_letter,
        bid_amount,
        delivery_days,
        milestones
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      parseInt(jobId),
      parseInt(freelancerId),
      coverLetter,
      parseFloat(bidAmount),
      parseInt(deliveryDays),
      milestones ? JSON.stringify(milestones) : null
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  findByFreelancerId: async (freelancerId) => {
    const query = `
      SELECT 
        p.*,
        j.title as job_title,
        j.budget as job_budget,
        j.experience_level as job_experience_level,
        u.first_name || ' ' || u.last_name as client_name,
        u.email as client_email,
        cp.company_name as client_company_name
      FROM proposals p
      JOIN jobs j ON p.job_id = j.job_id
      JOIN users u ON j.client_id = u.user_id
      LEFT JOIN client_profiles cp ON u.user_id = cp.user_id
      WHERE p.freelancer_id = $1
      ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query, [parseInt(freelancerId)]);
    return result.rows;
  },

  findByJobId: async (jobId) => {
    const query = `
      SELECT 
        p.*,
        u.first_name || ' ' || u.last_name as freelancer_name,
        u.email as freelancer_email,
        u.profile_image as freelancer_profile_image,
        fp.professional_title as freelancer_title,
        fp.hourly_rate as freelancer_hourly_rate
      FROM proposals p
      JOIN users u ON p.freelancer_id = u.user_id
      LEFT JOIN freelancer_profiles fp ON u.user_id = fp.user_id
      WHERE p.job_id = $1
      ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query, [parseInt(jobId)]);
    return result.rows;
  },

  findById: async (proposalId) => {
    const query = `
      SELECT p.*, j.client_id, j.title as job_title
      FROM proposals p
      JOIN jobs j ON p.job_id = j.job_id
      WHERE p.proposal_id = $1
    `;
    const result = await pool.query(query, [parseInt(proposalId)]);
    return result.rows[0];
  },

  checkHasApplied: async (jobId, freelancerId) => {
    const query = `
      SELECT EXISTS (
        SELECT 1 FROM proposals 
        WHERE job_id = $1 AND freelancer_id = $2
      ) as has_applied
    `;
    const result = await pool.query(query, [parseInt(jobId), parseInt(freelancerId)]);
    return result.rows[0].has_applied;
  },

  updateStatus: async (proposalId, status) => {
    const query = `
      UPDATE proposals
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE proposal_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, parseInt(proposalId)]);
    return result.rows[0];
  }
};

export default Proposal;
