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
      status
    } = req.body;

    const isDraft = status === "Draft";

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
      status || "Open"
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
      status
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
      status || "Draft"
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
    const jobs = await Job.findAllActive();
    return res.status(200).json(jobs);
  } catch (error) {
    console.error("Error fetching all jobs:", error);
    return res.status(500).json({ message: "Internal server error while fetching projects." });
  }
};
