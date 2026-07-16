import pool from '../config/db.js';

export const Job = {
  create: async (
    clientId,
    categoryId,
    subCategoryId,
    title,
    description,
    budget,
    experienceLevel,
    projectType,
    milestoneType,
    minBudget,
    maxBudget,
    duration,
    location,
    numFreelancers,
    skills,
    languages,
    maxHours,
    paymentMode,
    status,
    slug = null,
    seo = null
  ) => {
    const query = `
      INSERT INTO jobs (
        client_id,
        category_id,
        sub_category_id,
        title,
        description,
        budget,
        experience_level,
        project_type,
        milestone_type,
        min_budget,
        max_budget,
        duration,
        location,
        num_freelancers,
        skills,
        languages,
        max_hours,
        payment_mode,
        status,
        slug,
        seo
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
    `;
    const values = [
      clientId,
      categoryId ? parseInt(categoryId) : null,
      subCategoryId ? parseInt(subCategoryId) : null,
      title,
      description,
      budget ? parseFloat(budget) : 0,
      experienceLevel || 'Intermediate',
      projectType || 'Fixed',
      milestoneType || 'Fixed',
      minBudget ? parseFloat(minBudget) : null,
      maxBudget ? parseFloat(maxBudget) : null,
      duration || null,
      location || 'Remote',
      numFreelancers || null,
      skills ? JSON.stringify(skills) : null,
      languages ? JSON.stringify(languages) : null,
      maxHours ? parseInt(maxHours) : null,
      paymentMode || null,
      status || 'Open',
      slug,
      seo ? JSON.stringify(seo) : null
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  update: async (
    jobId,
    clientId,
    categoryId,
    subCategoryId,
    title,
    description,
    budget,
    experienceLevel,
    projectType,
    milestoneType,
    minBudget,
    maxBudget,
    duration,
    location,
    numFreelancers,
    skills,
    languages,
    maxHours,
    paymentMode,
    status,
    slug = null,
    seo = null
  ) => {
    const query = `
      UPDATE jobs
      SET
        category_id = $3,
        sub_category_id = $4,
        title = $5,
        description = $6,
        budget = $7,
        experience_level = $8,
        project_type = $9,
        milestone_type = $10,
        min_budget = $11,
        max_budget = $12,
        duration = $13,
        location = $14,
        num_freelancers = $15,
        skills = $16,
        languages = $17,
        max_hours = $18,
        payment_mode = $19,
        status = $20,
        slug = $21,
        seo = $22,
        updated_at = CURRENT_TIMESTAMP
      WHERE job_id = $1 AND client_id = $2
      RETURNING *
    `;
    const values = [
      parseInt(jobId),
      parseInt(clientId),
      categoryId ? parseInt(categoryId) : null,
      subCategoryId ? parseInt(subCategoryId) : null,
      title,
      description,
      budget ? parseFloat(budget) : 0,
      experienceLevel || 'Intermediate',
      projectType || 'Fixed',
      milestoneType || 'Fixed',
      minBudget ? parseFloat(minBudget) : null,
      maxBudget ? parseFloat(maxBudget) : null,
      duration || null,
      location || 'Remote',
      numFreelancers || null,
      skills ? JSON.stringify(skills) : null,
      languages ? JSON.stringify(languages) : null,
      maxHours ? parseInt(maxHours) : null,
      paymentMode || null,
      status || 'Open',
      slug,
      seo ? JSON.stringify(seo) : null
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  findByClientId: async (clientId) => {
    const query = `
      SELECT 
        j.*,
        cat.category_name,
        sub.sub_category_name,
        c.status AS contract_status,
        c.progress AS contract_progress,
        c.contract_id,
        COALESCE(j.is_featured = TRUE AND j.featured_at + (sp.featured_project_duration * INTERVAL '1 day') >= CURRENT_TIMESTAMP, false) as is_featured,
        (SELECT COUNT(*) FROM proposals WHERE job_id = j.job_id) AS proposal_count
      FROM jobs j
      JOIN users u ON j.client_id = u.user_id
      LEFT JOIN subscription_plans sp ON u.active_plan_id = sp.plan_id
      LEFT JOIN categories cat ON j.category_id = cat.category_id
      LEFT JOIN sub_categories sub ON j.sub_category_id = sub.sub_category_id
      LEFT JOIN (
        SELECT DISTINCT ON (job_id) *
        FROM contracts
        ORDER BY job_id, created_at DESC
      ) c ON j.job_id = c.job_id
      WHERE j.client_id = $1
      ORDER BY COALESCE(j.is_featured = TRUE AND j.featured_at + (sp.featured_project_duration * INTERVAL '1 day') >= CURRENT_TIMESTAMP, false) DESC, j.created_at DESC
    `;
    const result = await pool.query(query, [parseInt(clientId)]);
    return result.rows;
  },

  findAllActive: async (excludeUserId = null) => {
    let query = `
      SELECT 
        j.*,
        u.first_name || ' ' || COALESCE(u.last_name, '') as client_name,
        u.email as client_email,
        cp.company_name,
        cp.industry,
        cat.category_name,
        sub.sub_category_name,
        COALESCE(j.is_featured = TRUE AND j.featured_at + (sp.featured_project_duration * INTERVAL '1 day') >= CURRENT_TIMESTAMP, false) as is_featured
      FROM jobs j
      JOIN users u ON j.client_id = u.user_id
      LEFT JOIN client_profiles cp ON u.user_id = cp.user_id
      LEFT JOIN subscription_plans sp ON u.active_plan_id = sp.plan_id
      LEFT JOIN categories cat ON j.category_id = cat.category_id
      LEFT JOIN sub_categories sub ON j.sub_category_id = sub.sub_category_id
      WHERE j.status = 'Open'
    `;
    
    const values = [];
    if (excludeUserId) {
      query += ` AND j.client_id != $1`;
      values.push(parseInt(excludeUserId));
    }
    
    query += ` ORDER BY COALESCE(j.is_featured = TRUE AND j.featured_at + (sp.featured_project_duration * INTERVAL '1 day') >= CURRENT_TIMESTAMP, false) DESC, j.created_at DESC`;
    
    const result = await pool.query(query, values);
    return result.rows;
  }
};

export default Job;
