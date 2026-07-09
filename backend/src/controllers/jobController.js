import Job from "../models/jobModel.js";

export const createJob = async (req, res) => {
  try {
    const clientId = req.user.user_id;
    const {
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
    } = req.body;

    const isDraft = status === "Draft";

    // Check monthly job posting limits (only for active published postings)
    if (!isDraft) {
      const { default: pool } = await import("../config/db.js");
      
      const settingsRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'package_options_settings'");
      let packageOption = "Free listing for both type of users";
      if (settingsRes.rows.length > 0) {
        const parsed = typeof settingsRes.rows[0].setting_value === "string"
          ? JSON.parse(settingsRes.rows[0].setting_value)
          : settingsRes.rows[0].setting_value;
        packageOption = parsed.package_option || "Free listing for both type of users";
      }

      const isPaidOption = packageOption === "Paid listing for both" || packageOption === "Paid listing for buyers";

      if (isPaidOption) {
        const planQuery = await pool.query(
          `SELECT sp.job_posting_limit 
           FROM users u 
           LEFT JOIN subscription_plans sp ON u.active_plan_id = sp.plan_id 
           WHERE u.user_id = $1`,
          [clientId]
        );
        const limit = planQuery.rows.length > 0 && planQuery.rows[0].job_posting_limit !== null 
          ? parseInt(planQuery.rows[0].job_posting_limit) 
          : 3;

        const countQuery = await pool.query(
          `SELECT COUNT(*) FROM jobs 
           WHERE client_id = $1 
             AND status != 'Draft'
             AND created_at >= DATE_TRUNC('month', CURRENT_DATE)`,
          [clientId]
        );
        const postedCount = parseInt(countQuery.rows[0].count || 0);

        if (postedCount >= limit) {
          return res.status(403).json({ 
            message: `Monthly job posting limit reached (${postedCount}/${limit}). Please upgrade your subscription plan to publish more projects.` 
          });
        }
      }
    }

    // Validations
    if (!isDraft) {
      if (!title || !title.trim()) {
        return res.status(400).json({ message: "Project title is required." });
      }
      if (!description || !description.trim()) {
        return res.status(400).json({ message: "Project description is required." });
      }
      
      const finalBudget = max_budget ? parseFloat(max_budget) : (budget ? parseFloat(budget) : 0);
      if (finalBudget <= 0) {
        return res.status(400).json({ message: "A valid positive project budget is required." });
      }
    }

    const finalBudget = max_budget ? parseFloat(max_budget) : (budget ? parseFloat(budget) : 0);
    const finalTitle = title && title.trim() ? title.trim() : "Untitled Project Draft";
    const finalDescription = description && description.trim() ? description.trim() : "";

    const job = await Job.create(
      clientId,
      category_id,
      sub_category_id,
      finalTitle,
      finalDescription,
      finalBudget,
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
      status || "Open",
      slug,
      seo
    );

    return res.status(201).json({
      message: isDraft ? "Project draft saved successfully!" : "Project posted successfully!",
      job
    });
  } catch (error) {
    console.error("Error creating job:", error);
    return res.status(500).json({ message: "Internal server error while posting project." });
  }
};

export const updateJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const clientId = req.user.user_id;
    const {
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
    } = req.body;

    const isPublishing = status === "Open";

    // Validations (only if publishing, i.e., status is "Open")
    if (isPublishing) {
      if (!title || !title.trim()) {
        return res.status(400).json({ message: "Project title is required to publish." });
      }
      if (!description || !description.trim()) {
        return res.status(400).json({ message: "Project description is required to publish." });
      }
      const finalBudget = max_budget ? parseFloat(max_budget) : (budget ? parseFloat(budget) : 0);
      if (finalBudget <= 0) {
        return res.status(400).json({ message: "A valid positive project budget is required to publish." });
      }
    }

    const finalBudget = max_budget ? parseFloat(max_budget) : (budget ? parseFloat(budget) : 0);
    const finalTitle = title && title.trim() ? title.trim() : "Untitled Project Draft";
    const finalDescription = description && description.trim() ? description.trim() : "";

    const updatedJob = await Job.update(
      jobId,
      clientId,
      category_id,
      sub_category_id,
      finalTitle,
      finalDescription,
      finalBudget,
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
      status || "Draft",
      slug,
      seo
    );

    if (!updatedJob) {
      return res.status(404).json({ message: "Job not found or unauthorized." });
    }

    return res.status(200).json({
      message: isPublishing ? "Project published successfully!" : "Project draft saved successfully!",
      job: updatedJob
    });
  } catch (error) {
    console.error("Error updating job:", error);
    return res.status(500).json({ message: "Internal server error while saving project." });
  }
};

export const getClientJobs = async (req, res) => {
  try {
    const clientId = req.user.user_id;
    const jobs = await Job.findByClientId(clientId);
    return res.status(200).json(jobs);
  } catch (error) {
    console.error("Error fetching client jobs:", error);
    return res.status(500).json({ message: "Internal server error while fetching your projects." });
  }
};

export const getAllJobs = async (req, res) => {
  try {
    const excludeUserId = req.user?.user_id;
    const jobs = await Job.findAllActive(excludeUserId);
    return res.status(200).json(jobs);
  } catch (error) {
    console.error("Error fetching all jobs:", error);
    return res.status(500).json({ message: "Internal server error while fetching projects." });
  }
};

export const validateJobSlug = async (req, res) => {
  try {
    const { slug, excludeJobId } = req.query;
    if (!slug || !slug.trim()) {
      return res.status(200).json({ available: false });
    }

    const { default: pool } = await import("../config/db.js");
    let query = "SELECT COUNT(*) FROM jobs WHERE slug = $1";
    const params = [slug.trim().toLowerCase()];

    if (excludeJobId) {
      query += " AND job_id != $2";
      params.push(parseInt(excludeJobId));
    }

    const check = await pool.query(query, params);
    const count = parseInt(check.rows[0].count || 0);

    return res.status(200).json({ available: count === 0 });
  } catch (error) {
    console.error("Error validating job slug:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getJobBySlugOrId = async (req, res) => {
  try {
    const { slugOrId } = req.params;
    const { default: pool } = await import("../config/db.js");

    // Check if parameter is a numeric ID
    const isId = /^\d+$/.test(slugOrId);
    
    let query = `
      SELECT 
        j.*,
        u.first_name || ' ' || COALESCE(u.last_name, '') as client_name,
        u.email as client_email,
        u.created_at as client_member_since,
        cp.company_name,
        cp.industry,
        cp.company_website as website,
        cat.category_name,
        sub.sub_category_name
      FROM jobs j
      JOIN users u ON j.client_id = u.user_id
      LEFT JOIN client_profiles cp ON u.user_id = cp.user_id
      LEFT JOIN categories cat ON j.category_id = cat.category_id
      LEFT JOIN sub_categories sub ON j.sub_category_id = sub.sub_category_id
      WHERE ${isId ? "j.job_id = $1" : "j.slug = $1"}
    `;
    
    const result = await pool.query(query, [isId ? parseInt(slugOrId) : slugOrId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Project not found." });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching job by slug/id:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
