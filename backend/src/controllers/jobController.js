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

    let finalStatus = status || "Open";
    let isVetted = false;

    if (!isDraft) {
      const { default: pool } = await import("../config/db.js");
      const vettingRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'enable_project_vetting'");
      if (vettingRes.rows.length > 0) {
        const parsed = typeof vettingRes.rows[0].setting_value === "string"
          ? JSON.parse(vettingRes.rows[0].setting_value)
          : vettingRes.rows[0].setting_value;
        if (parsed && parsed.enabled) {
          finalStatus = "Pending Approval";
          isVetted = true;
        }
      }
    }

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
      finalStatus,
      slug,
      seo
    );

    if (isVetted && job) {
      try {
        const { default: pool } = await import("../config/db.js");
        const adminQuery = await pool.query("SELECT admin_id, email, full_name FROM admins");
        for (const adminRow of adminQuery.rows) {
          const userCheck = await pool.query("SELECT user_id FROM users WHERE email = $1", [adminRow.email]);
          let adminUserId;
          if (userCheck.rows.length > 0) {
            adminUserId = userCheck.rows[0].user_id;
          } else {
            const insertUser = await pool.query(
              "INSERT INTO users (first_name, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id",
              [adminRow.full_name || "Admin", adminRow.email, "ADMIN_VIRTUAL_HASH"]
            );
            adminUserId = insertUser.rows[0].user_id;
          }

          const adminNotif = await pool.query(
            `INSERT INTO notifications (user_id, title, message, type, reference_id)
             VALUES ($1, 'New Project Vetting Required 🛡️', $2, 'project_vetting', $3) RETURNING *`,
            [
              adminUserId,
              `A new project "${finalTitle}" has been posted and requires your vetting approval.`,
              job.job_id.toString()
            ]
          );

          if (req.io && adminNotif.rows.length > 0) {
            req.io.to(`user_${adminUserId}`).emit("new_notification", adminNotif.rows[0]);
          }
        }
      } catch (notifErr) {
        console.error("Project vetting notification failed:", notifErr);
      }
    }

    return res.status(201).json({
      message: isDraft 
        ? "Project draft saved successfully!" 
        : (isVetted ? "Project submitted successfully! It is pending admin approval before publishing." : "Project posted successfully!"),
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

    let finalStatus = status || "Draft";
    let isVetted = false;

    if (isPublishing) {
      const { default: pool } = await import("../config/db.js");
      const vettingRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'enable_project_vetting'");
      if (vettingRes.rows.length > 0) {
        const parsed = typeof vettingRes.rows[0].setting_value === "string"
          ? JSON.parse(vettingRes.rows[0].setting_value)
          : vettingRes.rows[0].setting_value;
        if (parsed && parsed.enabled) {
          finalStatus = "Pending Approval";
          isVetted = true;
        }
      }
    }

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
      finalStatus,
      slug,
      seo
    );

    if (!updatedJob) {
      return res.status(404).json({ message: "Job not found or unauthorized." });
    }

    if (isVetted && updatedJob) {
      try {
        const { default: pool } = await import("../config/db.js");
        const adminQuery = await pool.query("SELECT admin_id, email, full_name FROM admins");
        for (const adminRow of adminQuery.rows) {
          const userCheck = await pool.query("SELECT user_id FROM users WHERE email = $1", [adminRow.email]);
          let adminUserId;
          if (userCheck.rows.length > 0) {
            adminUserId = userCheck.rows[0].user_id;
          } else {
            const insertUser = await pool.query(
              "INSERT INTO users (first_name, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id",
              [adminRow.full_name || "Admin", adminRow.email, "ADMIN_VIRTUAL_HASH"]
            );
            adminUserId = insertUser.rows[0].user_id;
          }

          const adminNotif = await pool.query(
            `INSERT INTO notifications (user_id, title, message, type, reference_id)
             VALUES ($1, 'New Project Vetting Required 🛡️', $2, 'project_vetting', $3) RETURNING *`,
            [
              adminUserId,
              `A new project "${finalTitle}" has been posted and requires your vetting approval.`,
              updatedJob.job_id.toString()
            ]
          );

          if (req.io && adminNotif.rows.length > 0) {
            req.io.to(`user_${adminUserId}`).emit("new_notification", adminNotif.rows[0]);
          }
        }
      } catch (notifErr) {
        console.error("Project vetting notification failed:", notifErr);
      }
    }

    return res.status(200).json({
      message: isPublishing 
        ? (isVetted ? "Project submitted successfully! It is pending admin approval before publishing." : "Project published successfully!") 
        : "Project draft saved successfully!",
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
        sub.sub_category_name,
        COALESCE(j.is_featured = TRUE AND j.featured_at + (sp.featured_project_duration * INTERVAL '1 day') >= CURRENT_TIMESTAMP, false) as is_featured
      FROM jobs j
      JOIN users u ON j.client_id = u.user_id
      LEFT JOIN subscription_plans sp ON u.active_plan_id = sp.plan_id
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

export const toggleJobFeature = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.user_id;
    const { default: pool } = await import("../config/db.js");

    // Check if the job exists and belongs to this client
    const jobRes = await pool.query("SELECT * FROM jobs WHERE job_id = $1 AND client_id = $2", [parseInt(id), clientId]);
    if (jobRes.rows.length === 0) {
      return res.status(404).json({ message: "Project not found or not owned by you." });
    }

    const job = jobRes.rows[0];
    const newFeaturedStatus = !job.is_featured;

    if (newFeaturedStatus) {
      // 1. Get client's subscription plan featured project limit
      const planRes = await pool.query(
        `SELECT sp.featured_project_limit 
         FROM users u
         LEFT JOIN subscription_plans sp ON u.active_plan_id = sp.plan_id
         WHERE u.user_id = $1`,
        [clientId]
      );
      const featuredLimit = planRes.rows.length > 0 && planRes.rows[0].featured_project_limit !== null
        ? parseInt(planRes.rows[0].featured_project_limit)
        : 0;

      if (featuredLimit <= 0) {
        return res.status(400).json({ 
          message: "Your current subscription plan does not allow featuring projects. Please upgrade your plan." 
        });
      }

      // 2. Count current active featured projects for this client
      const countRes = await pool.query(
        `SELECT COUNT(j.*) 
         FROM jobs j
         JOIN users u ON j.client_id = u.user_id
         LEFT JOIN subscription_plans sp ON u.active_plan_id = sp.plan_id
         WHERE j.client_id = $1 
           AND j.is_featured = TRUE 
           AND j.featured_at + (sp.featured_project_duration * INTERVAL '1 day') >= CURRENT_TIMESTAMP`, 
        [clientId]
      );
      const currentFeaturedCount = parseInt(countRes.rows[0].count || 0);

      if (currentFeaturedCount >= featuredLimit) {
        return res.status(400).json({ 
          message: `Featured project limit reached. You can only feature up to ${featuredLimit} projects under your current plan. Please unfeature another project first.` 
        });
      }

      // 3. Mark as featured
      await pool.query(
        "UPDATE jobs SET is_featured = TRUE, featured_at = CURRENT_TIMESTAMP WHERE job_id = $1",
        [job.job_id]
      );

      return res.status(200).json({ 
        message: "Project successfully marked as Featured!", 
        is_featured: true 
      });
    } else {
      // 4. Mark as unfeatured
      await pool.query(
        "UPDATE jobs SET is_featured = FALSE, featured_at = NULL WHERE job_id = $1",
        [job.job_id]
      );

      return res.status(200).json({ 
        message: "Project removed from featured list.", 
        is_featured: false 
      });
    }
  } catch (error) {
    console.error("Error toggling project feature status:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
