import pool from '../config/db.js';

export const Gig = {
  create: async (
    freelancerId,
    categoryId,
    subCategoryId,
    title,
    description,
    price,
    currencyId,
    deliveryDays,
    revisions,
    images,
    videoUrl,
    documents,
    negotiation = false,
    discountPercent = 0,
    paymentType = 'fixed',
    minPrice = null,
    maxPrice = null,
    milestones = null
  ) => {
    const query = `
      INSERT INTO gigs (
        freelancer_id,
        category_id,
        sub_category_id,
        title,
        description,
        price,
        currency_id,
        delivery_days,
        revisions,
        images,
        video_url,
        documents,
        negotiation,
        discount_percent,
        payment_type,
        min_price,
        max_price,
        milestones
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;
    const values = [
      freelancerId,
      categoryId ? parseInt(categoryId) : null,
      subCategoryId ? parseInt(subCategoryId) : null,
      title,
      description,
      parseFloat(price) || 0,
      currencyId ? parseInt(currencyId) : null,
      parseInt(deliveryDays),
      revisions ? parseInt(revisions) : null,
      images ? JSON.stringify(images) : null,
      videoUrl || null,
      documents ? JSON.stringify(documents) : null,
      !!negotiation,
      parseFloat(discountPercent) || 0,
      paymentType || 'fixed',
      minPrice ? parseFloat(minPrice) : null,
      maxPrice ? parseFloat(maxPrice) : null,
      milestones ? (typeof milestones === 'string' ? milestones : JSON.stringify(milestones)) : null
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  addSkill: async (gigId, skillId) => {
    const query = `
      INSERT INTO gig_skills (gig_id, skill_id)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await pool.query(query, [parseInt(gigId), parseInt(skillId)]);
    return result.rows[0];
  },

  findByFreelancerId: async (freelancerId) => {
    const query = `
      SELECT 
        g.*,
        c.code as currency_code,
        c.symbol as currency_symbol,
        c.name as currency_name,
        cat.category_name,
        sub.sub_category_name,
        COALESCE(
          json_agg(
            json_build_object('skill_id', s.skill_id, 'skill_name', s.skill_name)
          ) FILTER (WHERE s.skill_id IS NOT NULL), '[]'::json
        ) as skills
      FROM gigs g
      LEFT JOIN currencies c ON g.currency_id = c.currency_id
      LEFT JOIN categories cat ON g.category_id = cat.category_id
      LEFT JOIN sub_categories sub ON g.sub_category_id = sub.sub_category_id
      LEFT JOIN gig_skills gs ON g.gig_id = gs.gig_id
      LEFT JOIN skills s ON gs.skill_id = s.skill_id
      WHERE g.freelancer_id = $1
      GROUP BY g.gig_id, c.currency_id, cat.category_id, sub.sub_category_id
      ORDER BY g.created_at DESC
    `;
    const result = await pool.query(query, [parseInt(freelancerId)]);
    return result.rows;
  },

  getAllCurrencies: async () => {
    const query = `SELECT * FROM currencies ORDER BY code ASC`;
    const result = await pool.query(query);
    return result.rows;
  },

  findAllActive: async (excludeUserId = null) => {
    let query = `
      SELECT 
        g.*,
        u.first_name || COALESCE(' ' || u.last_name, '') as freelancer_name,
        u.slug as freelancer_slug,
        u.profile_image as freelancer_image,
        c.code as currency_code,
        c.symbol as currency_symbol,
        c.name as currency_name,
        cat.category_name,
        sub.sub_category_name,
        COALESCE(
          json_agg(
            json_build_object('skill_id', s.skill_id, 'skill_name', s.skill_name)
          ) FILTER (WHERE s.skill_id IS NOT NULL), '[]'::json
        ) as skills
      FROM gigs g
      JOIN users u ON g.freelancer_id = u.user_id
      LEFT JOIN currencies c ON g.currency_id = c.currency_id
      LEFT JOIN categories cat ON g.category_id = cat.category_id
      LEFT JOIN sub_categories sub ON g.sub_category_id = sub.sub_category_id
      LEFT JOIN gig_skills gs ON g.gig_id = gs.gig_id
      LEFT JOIN skills s ON gs.skill_id = s.skill_id
      WHERE g.status = 'Active'
    `;
    
    const values = [];
    if (excludeUserId) {
      query += ` AND g.freelancer_id != $1`;
      values.push(parseInt(excludeUserId));
    }
    
    query += `
      GROUP BY g.gig_id, u.user_id, c.currency_id, cat.category_id, sub.sub_category_id
      ORDER BY g.created_at DESC
    `;
    
    const result = await pool.query(query, values);
    return result.rows;
  },

  createApplication: async (gigId, clientId, requirements, price, currencyId, milestones) => {
    const query = `
      INSERT INTO gig_applications (gig_id, client_id, requirements, price, currency_id, milestones)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      parseInt(gigId),
      parseInt(clientId),
      requirements,
      parseFloat(price),
      currencyId ? parseInt(currencyId) : null,
      milestones ? JSON.stringify(milestones) : null
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  findApplicationsByFreelancerId: async (freelancerId) => {
    const query = `
      SELECT 
        ga.*,
        g.title as gig_title,
        u.first_name || ' ' || u.last_name as client_name,
        u.email as client_email,
        c.code as currency_code,
        c.symbol as currency_symbol,
        gr.rating as review_rating,
        gr.comment as review_comment,
        con.contract_id,
        con.status as contract_status,
        con.progress as contract_progress,
        CASE WHEN con.contract_id IS NOT NULL THEN 'Paid' ELSE 'Pending' END as payment_status,
        con.created_at as paid_at,
        d.status as dispute_status,
        d.resolution_type as dispute_resolution_type,
        d.resolution_details as dispute_resolution_details
      FROM gig_applications ga
      JOIN gigs g ON ga.gig_id = g.gig_id
      JOIN users u ON ga.client_id = u.user_id
      LEFT JOIN currencies c ON ga.currency_id = c.currency_id
      LEFT JOIN gig_reviews gr ON ga.application_id = gr.application_id
      LEFT JOIN contracts con ON ga.application_id = con.application_id
      LEFT JOIN disputes d ON con.contract_id = d.contract_id
      WHERE g.freelancer_id = $1
      ORDER BY ga.created_at DESC
    `;
    const result = await pool.query(query, [parseInt(freelancerId)]);
    return result.rows;
  },

  findApplicationsByClientId: async (clientId) => {
    const query = `
      SELECT 
        ga.*,
        g.title as gig_title,
        u.first_name || COALESCE(' ' || u.last_name, '') as freelancer_name,
        u.email as freelancer_email,
        c.code as currency_code,
        c.symbol as currency_symbol,
        gr.rating as review_rating,
        gr.comment as review_comment,
        con.contract_id,
        con.status as contract_status,
        con.progress as contract_progress,
        CASE WHEN con.contract_id IS NOT NULL THEN 'Paid' ELSE 'Pending' END as payment_status,
        con.created_at as paid_at,
        d.status as dispute_status,
        d.resolution_type as dispute_resolution_type,
        d.resolution_details as dispute_resolution_details
      FROM gig_applications ga
      JOIN gigs g ON ga.gig_id = g.gig_id
      JOIN users u ON g.freelancer_id = u.user_id
      LEFT JOIN currencies c ON ga.currency_id = c.currency_id
      LEFT JOIN gig_reviews gr ON ga.application_id = gr.application_id
      LEFT JOIN contracts con ON ga.application_id = con.application_id
      LEFT JOIN disputes d ON con.contract_id = d.contract_id
      WHERE ga.client_id = $1
      ORDER BY ga.created_at DESC
    `;
    const result = await pool.query(query, [parseInt(clientId)]);
    return result.rows;
  },


  updateApplicationStatus: async (applicationId, status) => {
    const query = `
      UPDATE gig_applications
      SET status = $1, updated_at = NOW()
      WHERE application_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, parseInt(applicationId)]);
    return result.rows[0];
  },

  updateApplicationMilestones: async (applicationId, milestones) => {
    const query = `
      UPDATE gig_applications
      SET milestones = $1, updated_at = NOW()
      WHERE application_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [JSON.stringify(milestones), parseInt(applicationId)]);
    return result.rows[0];
  }
};

export default Gig;
