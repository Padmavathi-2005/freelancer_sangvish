import pool from "../config/db.js";
import { FreelancerProfile } from "../models/freelancerProfileModel.js";
import { UserSkill } from "../models/userSkillModel.js";
import { UserLanguage } from "../models/userLanguageModel.js";
import { Experience } from "../models/experienceModel.js";
import { Education } from "../models/educationModel.js";
import { Certification } from "../models/certificationModel.js";
import { FreelancerProject } from "../models/freelancerProjectModel.js";

// In-memory store for OTPs (userId -> { emailOtp, emailOtpExpires, phoneOtp, phoneOtpExpires })
const otps = new Map();

// Helper to generate a 6-digit random code
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const saveFreelancerProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const {
            category_id,
            sub_category_id,
            professional_title,
            experience_level,
            total_experience_years,
            hourly_rate,
            linkedin_url,
            portfolio_website,
            resume_url,
            availability_status,
            slug,
            display_name,
            seo
        } = req.body;

        if (!category_id || !sub_category_id || !professional_title || !experience_level || total_experience_years === undefined) {
            return res.status(400).json({ message: "All required fields must be provided." });
        }

        const validLevels = ["Beginner", "Intermediate", "Expert"];
        if (!validLevels.includes(experience_level)) {
            return res.status(400).json({ message: "Invalid experience level." });
        }

        const validAvailability = ["Available", "Busy", "Not Available"];
        if (availability_status && !validAvailability.includes(availability_status)) {
            return res.status(400).json({ message: "Invalid availability status." });
        }

        // Check if profile exists
        const checkProfile = await FreelancerProfile.findByUserId(userId);
        let profile;

        if (checkProfile.rows.length > 0) {
            // Update
            const updateRes = await FreelancerProfile.update(
                userId,
                category_id,
                sub_category_id,
                professional_title,
                experience_level,
                total_experience_years,
                hourly_rate || null,
                availability_status || "Available",
                linkedin_url || null,
                portfolio_website || null,
                resume_url || null,
                seo || null
            );
            profile = updateRes.rows[0];
        } else {
            // Create
            const createRes = await FreelancerProfile.create(
                userId,
                category_id,
                sub_category_id,
                professional_title,
                experience_level,
                total_experience_years,
                hourly_rate || null,
                availability_status || "Available",
                linkedin_url || null,
                portfolio_website || null,
                resume_url || null,
                seo || null
            );
            profile = createRes.rows[0];
        }

        // Ensure current step is updated to step 2 if we are currently at step 1
        if (profile.current_step === 1) {
            const stepRes = await FreelancerProfile.updateCurrentStep(userId, 2);
            profile = stepRes.rows[0];
        }

        if (display_name) {
            const parts = display_name.trim().split(/\s+/);
            const firstName = parts[0] || "";
            const lastName = parts.slice(1).join(" ") || null;
            await pool.query(
                "UPDATE users SET display_name = $1, first_name = $2, last_name = $3 WHERE user_id = $4",
                [display_name, firstName, lastName, userId]
            );
        }

        if (slug) {
            let finalSlug = slug.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
            if (!finalSlug) finalSlug = `user-${userId}`;

            let isUnique = false;
            let counter = 1;
            let uniqueSlug = finalSlug;
            while (!isUnique) {
                const check = await pool.query("SELECT 1 FROM users WHERE slug = $1 AND user_id != $2", [uniqueSlug, userId]);
                if (check.rows.length === 0) {
                    isUnique = true;
                } else {
                    uniqueSlug = `${finalSlug}-${counter++}`;
                }
            }
            await pool.query("UPDATE users SET slug = $1 WHERE user_id = $2", [uniqueSlug, userId]);
        }

        res.status(200).json({
            message: "Profile saved successfully.",
            profile
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const saveFreelancerSkills = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { skill_ids } = req.body;

        if (!Array.isArray(skill_ids) || skill_ids.length === 0) {
            return res.status(400).json({ message: "At least one skill is required." });
        }

        // Clear existing skills
        await UserSkill.deleteByUserId(userId);

        // Add new skills
        const added = [];
        for (const skillId of skill_ids) {
            const res = await UserSkill.addSkill(userId, skillId);
            added.push(res.rows[0]);
        }

        res.status(200).json({
            message: "Skills saved successfully.",
            skills: added
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const saveFreelancerLanguages = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { languages, language_ids } = req.body;
        const inputList = languages || language_ids;

        if (!Array.isArray(inputList) || inputList.length === 0) {
            return res.status(400).json({ message: "At least one language is required." });
        }

        // Clear existing languages
        await UserLanguage.deleteByUserId(userId);

        // Add new languages
        const added = [];
        for (const item of inputList) {
            let langId;
            let proficiency = 'Basic';

            if (typeof item === 'object' && item !== null) {
                langId = item.language_id;
                proficiency = item.proficiency || 'Basic';
            } else {
                langId = item;
            }

            if (langId) {
                const queryRes = await UserLanguage.addLanguage(userId, langId, proficiency);
                added.push(queryRes.rows[0]);
            }
        }

        res.status(200).json({
            message: "Languages saved successfully.",
            languages: added
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const saveFreelancerExperience = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const {
            company_name,
            job_title,
            employment_type,
            start_date,
            end_date,
            currently_working,
            description
        } = req.body;

        if (!company_name || !job_title) {
            return res.status(400).json({ message: "Company name and job title are required." });
        }

        const result = await Experience.create(
            userId,
            company_name,
            job_title,
            employment_type || null,
            start_date || null,
            end_date || null,
            currently_working ?? false,
            description || null
        );

        res.status(201).json({
            message: "Experience saved successfully.",
            experience: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const saveFreelancerEducation = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const {
            institution_name,
            degree,
            field_of_study,
            start_year,
            end_year
        } = req.body;

        if (!institution_name || !degree) {
            return res.status(400).json({ message: "Institution name and degree are required." });
        }

        const result = await Education.create(
            userId,
            institution_name,
            degree,
            field_of_study || null,
            start_year || null,
            end_year || null
        );

        res.status(201).json({
            message: "Education saved successfully.",
            education: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const saveFreelancerCertification = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const {
            certificate_name,
            issuing_organization,
            issue_date,
            credential_url
        } = req.body;

        if (!certificate_name || !issuing_organization) {
            return res.status(400).json({ message: "Certificate name and issuing organization are required." });
        }

        const result = await Certification.create(
            userId,
            certificate_name,
            issuing_organization,
            issue_date || null,
            credential_url || null
        );

        res.status(201).json({
            message: "Certification saved successfully.",
            certification: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteFreelancerExperience = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const experienceId = req.params.id;
        const result = await Experience.delete(experienceId, userId);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Experience not found or unauthorized." });
        }
        res.status(200).json({ message: "Experience deleted successfully.", experience: result.rows[0] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteFreelancerEducation = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const educationId = req.params.id;
        const result = await Education.delete(educationId, userId);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Education not found or unauthorized." });
        }
        res.status(200).json({ message: "Education deleted successfully.", education: result.rows[0] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteFreelancerCertification = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const certificationId = req.params.id;
        const result = await Certification.delete(certificationId, userId);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Certification not found or unauthorized." });
        }
        res.status(200).json({ message: "Certification deleted successfully.", certification: result.rows[0] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const saveFreelancerProject = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const {
            title,
            description,
            image_urls,
            video_urls,
            document_urls
        } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Project title is required." });
        }

        const result = await FreelancerProject.create(
            userId,
            title,
            description || null,
            image_urls || [],
            video_urls || null,
            document_urls || []
        );

        res.status(201).json({
            message: "Project saved successfully.",
            project: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const sendEmailOtp = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const code = generateOtp();
        const expires = Date.now() + 600000; // 10 minutes

        const userOtp = otps.get(userId) || {};
        userOtp.emailOtp = code;
        userOtp.emailOtpExpires = expires;
        otps.set(userId, userOtp);

        console.log(`[EMAIL OTP] User ID: ${userId} | OTP Code: ${code}`);

        res.status(200).json({ message: "Email OTP sent successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const verifyEmailOtp = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ message: "OTP code is required." });
        }

        const userOtp = otps.get(userId);
        if (!userOtp || !userOtp.emailOtp || userOtp.emailOtp !== code || Date.now() > userOtp.emailOtpExpires) {
            return res.status(400).json({ message: "Invalid or expired OTP code." });
        }

        // Update user email_verified in DB
        await pool.query(
            `UPDATE users
             SET email_verified = true
             WHERE user_id = $1`,
            [userId]
        );

        // Remove email OTP
        userOtp.emailOtp = null;
        userOtp.emailOtpExpires = null;
        otps.set(userId, userOtp);

        res.status(200).json({ message: "Email verified successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const sendPhoneOtp = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const code = generateOtp();
        const expires = Date.now() + 600000; // 10 minutes

        const userOtp = otps.get(userId) || {};
        userOtp.phoneOtp = code;
        userOtp.phoneOtpExpires = expires;
        otps.set(userId, userOtp);

        console.log(`[PHONE OTP] User ID: ${userId} | OTP Code: ${code}`);

        res.status(200).json({ message: "Phone OTP sent successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const verifyPhoneOtp = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ message: "OTP code is required." });
        }

        const userOtp = otps.get(userId);
        if (!userOtp || !userOtp.phoneOtp || userOtp.phoneOtp !== code || Date.now() > userOtp.phoneOtpExpires) {
            return res.status(400).json({ message: "Invalid or expired OTP code." });
        }

        // Update user phone_verified in DB
        await pool.query(
            `UPDATE users
             SET phone_verified = true
             WHERE user_id = $1`,
            [userId]
        );

        // Remove phone OTP
        userOtp.phoneOtp = null;
        userOtp.phoneOtpExpires = null;
        otps.set(userId, userOtp);

        res.status(200).json({ message: "Phone verified successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getFreelancerOnboardingStatus = async (req, res) => {
    try {
        const userId = req.user.user_id;

        // Check step 1: profile, skills, languages
        const profileRes = await FreelancerProfile.findByUserId(userId);
        const hasProfile = profileRes.rows.length > 0;

        const skillsRes = await UserSkill.getByUserId(userId);
        const hasSkills = skillsRes.rows.length > 0;

        const langRes = await UserLanguage.getByUserId(userId);
        const hasLanguages = langRes.rows.length > 0;

        const step1Completed = hasProfile && hasSkills && hasLanguages;

        // Check step 2: career information (optional)
        const expRes = await Experience.getByUserId(userId);
        const eduRes = await Education.getByUserId(userId);
        const certRes = await Certification.getByUserId(userId);
        const hasCareer = expRes.rows.length > 0 || eduRes.rows.length > 0 || certRes.rows.length > 0;

        // Check step 3: verification (required)
        const userRes = await pool.query("SELECT email_verified, phone_verified FROM users WHERE user_id = $1", [userId]);
        const emailVerified = userRes.rows[0]?.email_verified === true;
        const phoneVerified = userRes.rows[0]?.phone_verified === true;
        const step3Completed = emailVerified && phoneVerified;

        // Check step 4: portfolio (optional)
        const projRes = await FreelancerProject.getByUserId(userId);
        const hasPortfolio = projRes.rows.length > 0;

        // Determine currentStep
        const currentDbStep = hasProfile ? profileRes.rows[0].current_step : 1;
        const onboardingCompleted = hasProfile ? profileRes.rows[0].onboarding_completed === true : false;

        let currentStep = currentDbStep;
        if (!step1Completed) {
            currentStep = 1;
        } else {
            // Keep current step from DB (2, 3, or 4). If DB step is 1 but profile is saved, move to 2.
            currentStep = Math.min(Math.max(currentDbStep, 2), 4);
        }

        res.status(200).json({
            onboardingCompleted,
            currentStep,
            steps: {
                profile: step1Completed,
                career: hasCareer || currentDbStep > 2,
                verification: step3Completed,
                portfolio: hasPortfolio || currentDbStep > 4
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getFreelancerOnboardingDetails = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const profileRes = await FreelancerProfile.findByUserId(userId);
        const profile = profileRes.rows[0] || null;

        const skillsRes = await pool.query(
            `SELECT s.skill_id, s.skill_name
             FROM user_skills us
             JOIN skills s ON us.skill_id = s.skill_id
             WHERE us.user_id = $1`,
            [userId]
        );

        const langRes = await pool.query(
            `SELECT l.language_id, l.language_name, ul.proficiency
             FROM user_languages ul
             JOIN languages l ON ul.language_id = l.language_id
             WHERE ul.user_id = $1`,
            [userId]
        );

        const expRes = await Experience.getByUserId(userId);
        const eduRes = await Education.getByUserId(userId);
        const certRes = await Certification.getByUserId(userId);
        const projRes = await FreelancerProject.getByUserId(userId);

        const userRes = await pool.query("SELECT first_name, last_name, email, phone, email_verified, phone_verified, profile_image FROM users WHERE user_id = $1", [userId]);

        res.status(200).json({
            user: userRes.rows[0] || null,
            profile,
            skills: skillsRes.rows,
            languages: langRes.rows,
            experiences: expRes.rows,
            educations: eduRes.rows,
            certifications: certRes.rows,
            projects: projRes.rows
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const completeFreelancerOnboarding = async (req, res) => {
    try {
        const userId = req.user.user_id;

        // Validate step 1: profile, skills, languages
        const profileRes = await FreelancerProfile.findByUserId(userId);
        if (profileRes.rows.length === 0) {
            return res.status(400).json({ message: "Step 1: Profile is required to complete onboarding." });
        }

        const skillsRes = await UserSkill.getByUserId(userId);
        const langRes = await UserLanguage.getByUserId(userId);

        if (skillsRes.rows.length === 0 || langRes.rows.length === 0) {
            return res.status(400).json({ message: "Step 1: At least 1 skill and 1 language are required." });
        }

        // Read auto_vetting setting from platform settings
        let autoVettingEnabled = false;
        try {
            const settingRes = await pool.query(
                `SELECT setting_value FROM settings WHERE setting_key = 'auto_vetting' LIMIT 1`
            );
            if (settingRes.rows.length > 0) {
                const val = settingRes.rows[0].setting_value;
                autoVettingEnabled = (typeof val === 'object' ? val : JSON.parse(val))?.enabled === true;
            }
        } catch (e) {
            // If settings table doesn't exist yet, default to auto-approve
            autoVettingEnabled = true;
        }

        // Determine vetting status
        const vettingStatus = autoVettingEnabled ? 'Approved' : 'Pending';

        // Update onboarding_completed, vetting_status, and current_step
        await FreelancerProfile.updateOnboardingStatus(userId, true);
        await FreelancerProfile.updateVettingStatus(userId, vettingStatus);
        await FreelancerProfile.updateCurrentStep(userId, 5);

        res.status(200).json({
            message: autoVettingEnabled
                ? "Onboarding completed successfully."
                : "Onboarding submitted! Your profile is pending admin review before you can access the dashboard.",
            onboardingCompleted: true,
            vettingStatus
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const getLanguages = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM languages ORDER BY language_name");
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateFreelancerOnboardingStep = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { step } = req.body;

        if (!step || typeof step !== "number") {
            return res.status(400).json({ message: "Step number is required and must be a number." });
        }

        const profileRes = await FreelancerProfile.findByUserId(userId);
        if (profileRes.rows.length === 0) {
            return res.status(404).json({ message: "Freelancer profile not found. Please complete step 1 first." });
        }

        await FreelancerProfile.updateCurrentStep(userId, step);

        res.status(200).json({
            message: "Onboarding step updated successfully.",
            currentStep: step
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getPublicFreelancerProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const isNumeric = /^\d+$/.test(id);
        let userId;

        if (isNumeric) {
            userId = parseInt(id);
        } else {
            const nameSearch = id.replace(/-/g, ' ');
            let userLookup = await pool.query("SELECT user_id FROM users WHERE slug = $1", [id]);
            
            if (userLookup.rows.length === 0) {
                userLookup = await pool.query(
                    "SELECT user_id FROM users WHERE LOWER(display_name) = LOWER($1) OR LOWER(first_name || ' ' || last_name) = LOWER($2) OR LOWER(first_name) = LOWER($3) OR LOWER(first_name || '-' || last_name) = LOWER($4)",
                    [id, nameSearch, id, id]
                );
            }

            if (userLookup.rows.length === 0) {
                return res.status(404).json({ message: "User not found." });
            }
            userId = userLookup.rows[0].user_id;
        }

        const profileRes = await FreelancerProfile.findByUserId(userId);
        const profile = profileRes.rows[0] || null;

        const skillsRes = await pool.query(
            `SELECT s.skill_id, s.skill_name
             FROM user_skills us
             JOIN skills s ON us.skill_id = s.skill_id
             WHERE us.user_id = $1`,
            [userId]
        );

        const languagesRes = await pool.query(
            `SELECT l.language_id, l.language_name, ul.proficiency
             FROM user_languages ul
             JOIN languages l ON ul.language_id = l.language_id
             WHERE ul.user_id = $1`,
            [userId]
        );

        const userRes = await pool.query(
            `SELECT u.user_id, CONCAT_WS(' ', u.first_name, u.last_name) as name, u.email, u.profile_image, u.slug, u.display_name,
                    COALESCE(u.active_plan_subscribed_at + (sp.profile_featured_duration * INTERVAL '1 day') >= CURRENT_TIMESTAMP AND sp.profile_featured_duration > 0, false) as is_featured
             FROM users u
             LEFT JOIN subscription_plans sp ON u.active_plan_id = sp.plan_id
             WHERE u.user_id = $1`,
            [userId]
        );
        const user = userRes.rows[0] || null;

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const experienceRes = await Experience.getByUserId(userId);
        const educationRes = await Education.getByUserId(userId);
        const certificationRes = await Certification.getByUserId(userId);
        const projectsRes = await FreelancerProject.getByUserId(userId);

        // Fetch active Gigs
        const gigsRes = await pool.query(
            `SELECT g.*, 
                    c.category_name, 
                    sc.sub_category_name
             FROM gigs g
             LEFT JOIN categories c ON g.category_id = c.category_id
             LEFT JOIN sub_categories sc ON g.sub_category_id = sc.sub_category_id
             WHERE g.freelancer_id = $1 AND g.status = 'Active'
             ORDER BY g.created_at DESC`,
            [userId]
        );

        // Fetch Unified Reviews (Client reviews displayed on Freelancer profile)
        const reviewsRes = await pool.query(
            `(SELECT 
                cr.rating,
                cr.comment,
                cr.created_at,
                CONCAT_WS(' ', u.first_name, u.last_name) as reviewer_name,
                u.profile_image as reviewer_image,
                'contract' as review_type,
                'Client Review' as reviewer_role_label
              FROM contract_reviews cr
              JOIN users u ON cr.reviewer_id = u.user_id
              WHERE (cr.reviewee_id = $1 OR cr.contract_id IN (SELECT contract_id FROM contracts WHERE freelancer_id = $1)) AND cr.reviewer_role = 'client')
             UNION ALL
             (SELECT 
                gr.rating,
                gr.comment,
                gr.created_at,
                CONCAT_WS(' ', u.first_name, u.last_name) as reviewer_name,
                u.profile_image as reviewer_image,
                'gig' as review_type,
                'Client Review' as reviewer_role_label
              FROM gig_reviews gr
              JOIN gigs g ON gr.gig_id = g.gig_id
              JOIN users u ON gr.client_id = u.user_id
              WHERE g.freelancer_id = $1)
             ORDER BY created_at DESC`,
            [userId]
        );

        const completedJobsRes = await pool.query(
            "SELECT COUNT(*) FROM contracts WHERE freelancer_id = $1 AND status = 'Completed'",
            [userId]
        );
        const completedJobs = parseInt(completedJobsRes.rows[0].count) || 0;

        res.status(200).json({
            user,
            profile: profile ? {
                ...profile,
                hourlyRate: profile.hourly_rate,
                role: profile.professional_title
            } : null,
            skills: skillsRes.rows,
            languages: languagesRes.rows,
            experiences: experienceRes.rows,
            education: educationRes.rows,
            certifications: certificationRes.rows,
            projects: projectsRes.rows,
            reviews: reviewsRes.rows,
            gigs: gigsRes.rows,
            completedJobs
        });
    } catch (error) {
        console.error("Error fetching public freelancer profile:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

export const getFreelancerContracts = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const result = await pool.query(
             `SELECT 
                c.*,
                u_client.first_name || COALESCE(' ' || u_client.last_name, '') as client_name,
                u_client.email as client_email,
                u_client.profile_image as client_image,
                u_free.first_name || COALESCE(' ' || u_free.last_name, '') as freelancer_name,
                u_free.email as freelancer_email,
                u_free.profile_image as freelancer_image,
                j.description as project_description,
                j.project_type as project_type,
                d.status as dispute_status,
                d.resolution_type as dispute_resolution_type,
                d.resolution_details as dispute_resolution_details,
                COALESCE(p.bid_amount, c.budget) AS original_budget
              FROM contracts c
              JOIN users u_client ON c.client_id = u_client.user_id
              JOIN users u_free ON c.freelancer_id = u_free.user_id
              LEFT JOIN jobs j ON c.job_id = j.job_id
              LEFT JOIN disputes d ON c.contract_id = d.contract_id AND d.status = 'Resolved'
              LEFT JOIN proposals p ON c.job_id = p.job_id AND c.freelancer_id = p.freelancer_id AND p.status = 'Accepted'
              WHERE c.freelancer_id = $1 OR c.client_id = $1
              ORDER BY c.created_at DESC`,
            [userId]
        );
        const contracts = result.rows;

        for (const contract of contracts) {
            const msRes = await pool.query(
                "SELECT * FROM contract_milestones WHERE contract_id = $1 ORDER BY milestone_id ASC",
                [contract.contract_id]
            );
            contract.milestones = msRes.rows;
        }

        res.status(200).json(contracts);
    } catch (error) {
        console.error("Error fetching contracts:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

export const getRecommendedClients = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const result = await pool.query(
            `SELECT DISTINCT 
                u.user_id, 
                u.first_name || ' ' || u.last_name as name, 
                u.email,
                u.profile_image,
                cp.company_name,
                cp.industry,
                cp.company_description
             FROM users u
             JOIN jobs j ON u.user_id = j.client_id
             LEFT JOIN client_profiles cp ON u.user_id = cp.user_id
             WHERE j.status = 'Open' AND u.user_id != $1
             LIMIT 6`,
            [userId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching recommended clients:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

export const requestContractPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const freelancerId = req.user.user_id;

        // Verify contract is owned by this freelancer
        const checkRes = await pool.query(
            "SELECT * FROM contracts WHERE contract_id = $1 AND freelancer_id = $2",
            [parseInt(id), freelancerId]
        );
        const contract = checkRes.rows[0];
        if (!contract) {
            return res.status(403).json({ message: "Contract not found or not owned by you." });
        }
        if (contract.status !== "In Progress" && contract.status !== "Work Started") {
            return res.status(400).json({ message: `Contract cannot request payment in state: ${contract.status}` });
        }

        const { submitted_files } = req.body;
        const serializedFiles = submitted_files ? (typeof submitted_files === 'string' ? submitted_files : JSON.stringify(submitted_files)) : null;
        // Update contract
        await pool.query(
            "UPDATE contracts SET status = 'Under Review', progress = 100, submitted_files = $1, submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE contract_id = $2",
            [serializedFiles, parseInt(id)]
        );
        // Synchronize contract milestones status to Under Review
        await pool.query(
            "UPDATE contract_milestones SET status = 'Under Review', submitted_files = $1, updated_at = CURRENT_TIMESTAMP WHERE contract_id = $2 AND (status = 'Pending' OR status = 'Revision Requested')",
            [serializedFiles, parseInt(id)]
        );

        // 1. Fetch Client and Freelancer Details
        const clientUserRes = await pool.query(
            "SELECT first_name || ' ' || COALESCE(last_name, '') as name, email FROM users WHERE user_id = $1",
            [contract.client_id]
        );
        const clientName = clientUserRes.rows[0]?.name || "Client";
        const clientEmail = clientUserRes.rows[0]?.email;

        const freelancerUserRes = await pool.query(
            "SELECT first_name || ' ' || COALESCE(last_name, '') as name, email FROM users WHERE user_id = $1",
            [contract.freelancer_id]
        );
        const freelancerName = freelancerUserRes.rows[0]?.name || "Freelancer";
        const freelancerEmail = freelancerUserRes.rows[0]?.email;

        // Fetch site settings for name/logo
        const siteSettingsRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'site_settings'");
        const siteSettings = siteSettingsRes.rows[0]?.setting_value || {};
        const siteName = siteSettings.site_name || "Buy2Lancer";
        const siteLogo = siteSettings.site_logo || "/public/logo.png";
        const emailSettingsRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'email_settings'");
        const emailSettings = emailSettingsRes.rows[0]?.setting_value || {};
        const emailId = emailSettings.email_id || "noreply@buy2lancer.com";

        // 2. Insert In-App Notifications for BOTH Client & Freelancer
        const { default: Notification } = await import("../models/notificationModel.js");
        
        const clientNotif = await Notification.create({
            userId: contract.client_id,
            title: "Work Submitted & Awaiting Approval 🚀",
            message: `Freelancer ${freelancerName} has submitted completed work for: "${contract.title}". Please review and release escrow.`,
            type: "contract",
            referenceId: id.toString()
        });

        const freelancerNotif = await Notification.create({
            userId: contract.freelancer_id,
            title: "Work Submitted Successfully 🎉",
            message: `You have successfully submitted completed work for: "${contract.title}". Awaiting client approval.`,
            type: "contract",
            referenceId: id.toString()
        });

        if (req.io) {
            req.io.to(`user_${contract.client_id}`).emit("new_notification", clientNotif);
            req.io.to(`user_${contract.freelancer_id}`).emit("new_notification", freelancerNotif);
        }

        // 3. Send Platform Chat Message
        try {
            const { initializeChat } = await import("./messageController.js");
            const { default: MessageModel } = await import("../models/messageModel.js");

            const conversationId = await initializeChat(
                contract.client_id,
                contract.freelancer_id,
                contract.title
            );

            if (conversationId) {
                const platformMsg = `[${siteName} Platform Message]
Work has been submitted and payment approval requested by the freelancer for contract: "${contract.title}".
- Freelancer: ${freelancerName}
- Client: Please review completed work and click "Approve & Release" inside the project milestones tracker.`;
                
                await MessageModel.createMessage(conversationId, contract.freelancer_id, platformMsg);
                
                const senderRes = await pool.query(
                  "SELECT CONCAT(first_name, ' ', last_name) as sender_name, profile_image as sender_profile_image FROM users WHERE user_id = $1",
                  [contract.freelancer_id]
                );
                const sender = senderRes.rows[0] || {};
                
                if (req.io) {
                    req.io.to(`conv_${conversationId}`).emit("new_message", {
                        conversation_id: conversationId,
                        sender_id: contract.freelancer_id,
                        message_text: platformMsg,
                        created_at: new Date(),
                        sender_name: sender.sender_name || freelancerName,
                        sender_profile_image: sender.sender_profile_image || ""
                    });
                }
            }
        } catch (chatErr) {
            console.error("Failed to automatically start chat conversation or send msg:", chatErr);
        }

        // 4. Send Email Notifications to BOTH Client & Freelancer
        try {
            const { sendEmail } = await import("../utils/emailHelper.js");

            // Client Email
            const clientSubject = `[Action Required] Work Submitted for "${contract.title}" on ${siteName}`;
            const clientText = `Dear ${clientName},

Freelancer ${freelancerName} has marked the contract "${contract.title}" as completed and submitted it for your approval.

Please log in to your dashboard, navigate to the milestones tracker for "${contract.title}", review the deliverables, and release the escrow funds.

Best regards,
The ${siteName} Team
Contact: ${emailId}
Logo: ${siteLogo}`;
            await sendEmail({ to: clientEmail, subject: clientSubject, text: clientText });

            // Freelancer Email
            const freelancerSubject = `Work submission confirmation for "${contract.title}" on ${siteName}`;
            const freelancerText = `Dear ${freelancerName},

This is to confirm that you have successfully submitted your completed work for the contract "${contract.title}".

The client (${clientName}) has been notified to review and release the escrow funds.

Best regards,
The ${siteName} Team
Contact: ${emailId}
Logo: ${siteLogo}`;
            await sendEmail({ to: freelancerEmail, subject: freelancerSubject, text: freelancerText });
        } catch (emailErr) {
            console.error("Failed to dispatch email notifications:", emailErr);
        }

        res.status(200).json({ message: "Payment request submitted successfully." });
    } catch (error) {
        console.error("Error requesting contract payment:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

export const approveContractPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const clientId = req.user.user_id;

        // Verify contract belongs to client
        const checkRes = await pool.query(
            "SELECT * FROM contracts WHERE contract_id = $1 AND client_id = $2",
            [parseInt(id), clientId]
        );
        const contract = checkRes.rows[0];
        if (!contract) {
            return res.status(403).json({ message: "Contract not found or not owned by you." });
        }
        if (contract.status !== "Under Review" && contract.status !== "In Progress" && contract.status !== "Work Started") {
            return res.status(400).json({ message: `Contract cannot release payment in state: ${contract.status}` });
        }

        const orderPrice = parseFloat(contract.budget);

        // Fetch contract milestones to determine if Flow 1 (Direct Buy) or Flow 3 (Custom Milestones)
        const msRes = await pool.query(
            "SELECT * FROM contract_milestones WHERE contract_id = $1",
            [contract.contract_id]
        );
        const contractMilestones = msRes.rows;
        const isFlow1 = contractMilestones.length === 1 && contractMilestones[0].title === "Entire Project Scope";

        const upfrontAmount = orderPrice;
        const balanceAmount = 0;

        // Get system escrow wallet
        const systemWalletRes = await pool.query("SELECT * FROM wallets WHERE is_system = TRUE");
        const systemWallet = systemWalletRes.rows[0];

        // Get client wallet
        const clientWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [contract.client_id]);
        const clientWallet = clientWalletRes.rows[0];

        if (balanceAmount > 0) {
            if (!clientWallet || parseFloat(clientWallet.balance) < balanceAmount) {
                return res.status(400).json({
                    message: `Insufficient client wallet balance. Contract completion requires the remaining 50% payment ($${balanceAmount.toFixed(2)}), but client wallet only has $${clientWallet ? parseFloat(clientWallet.balance).toFixed(2) : '0.00'}. Please ask client to deposit funds.`
                });
            }
        }

        // Get freelancer wallet
        const freelancerWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [contract.freelancer_id]);
        let freelancerWallet = freelancerWalletRes.rows[0];
        if (!freelancerWallet) {
            const insertFreelancerWallet = "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD') RETURNING *";
            const insertRes = await pool.query(insertFreelancerWallet, [contract.freelancer_id]);
            freelancerWallet = insertRes.rows[0];
        }

        // Calculate platform commission fee based on standard platform fee
        let commissionPercent = 0.05; // Default 5%
        const feeRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'platform_fee'");
        if (feeRes.rows.length > 0) {
            let feeVal = feeRes.rows[0].setting_value;
            if (typeof feeVal === "string") {
                try { feeVal = JSON.parse(feeVal); } catch {}
            }
            if (feeVal?.fee) {
                commissionPercent = parseFloat(feeVal.fee) / 100;
            }
        }
        const commissionAmount = orderPrice * commissionPercent;
        const freelancerAmount = orderPrice - commissionAmount;

        // Use transaction for database updates
        await pool.query("BEGIN");
        try {
            // 1. Debit client wallet for the remaining balance (only if Flow 3)
            if (balanceAmount > 0) {
                await pool.query("UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2", [balanceAmount, clientWallet.wallet_id]);
            }

            // 2. Debit system escrow wallet for the upfront deposit
            await pool.query("UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2", [upfrontAmount, systemWallet.wallet_id]);

            // 3. Credit freelancer wallet with the total order price minus commission
            await pool.query("UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2", [freelancerAmount, freelancerWallet.wallet_id]);

            // 4. Record client-to-escrow final payment transaction (only if Flow 3)
            if (balanceAmount > 0) {
                const clientTxQuery = `
                    INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
                    VALUES ($1, $2, $3, 'Transfer', 'Completed', $4)
                `;
                const clientTxDesc = `Final 50% payment for contract: ${contract.title}`;
                await pool.query(clientTxQuery, [clientWallet.wallet_id, systemWallet.wallet_id, balanceAmount, clientTxDesc]);
            }

            // 5. Record escrow-to-freelancer release transaction
            const freelancerTxQuery = `
                INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, commission_amount, type, status, description)
                VALUES ($1, $2, $3, $4, 'Milestone_Release', 'Completed', $5)
            `;
            const freelancerTxDesc = `Escrow release for contract: ${contract.title}`;
            await pool.query(freelancerTxQuery, [systemWallet.wallet_id, freelancerWallet.wallet_id, freelancerAmount, commissionAmount, freelancerTxDesc]);

            // Update all contract milestones to completed and paid
            await pool.query(
                "UPDATE contract_milestones SET status = 'Completed', payment_status = 'Paid', updated_at = CURRENT_TIMESTAMP WHERE contract_id = $1",
                [contract.contract_id]
            );

            // Update contract status to Completed
            await pool.query(
                "UPDATE contracts SET status = 'Completed', progress = 100, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE contract_id = $1",
                [parseInt(id)]
            );

            // If linked to a gig application, update gig application status to Completed
            if (contract.application_id) {
                await pool.query(
                    "UPDATE gig_applications SET status = 'Completed', updated_at = CURRENT_TIMESTAMP WHERE application_id = $1",
                    [contract.application_id]
                );
            }

            await pool.query("COMMIT");
        } catch (txErr) {
            await pool.query("ROLLBACK");
            throw txErr;
        }

        // Notify freelancer
        try {
            await pool.query(
                `INSERT INTO notifications (user_id, title, message, type, reference_id)
                 VALUES ($1, 'Payment Released', $2, 'contract', $3)`,
                [
                    contract.freelancer_id,
                    `Client approved work and released payment for contract: ${contract.title}`,
                    id.toString()
                ]
            );
        } catch (notifErr) {
            console.error("Failed to notify freelancer on payment release:", notifErr);
        }

        res.status(200).json({ message: "Escrow payment released to freelancer wallet successfully!" });
    } catch (error) {
        console.error("Error approving contract payment:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

export const getContractTimecards = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;

        // Verify user is part of the contract
        const checkRes = await pool.query(
            "SELECT * FROM contracts WHERE contract_id = $1 AND (client_id = $2 OR freelancer_id = $2)",
            [parseInt(id), userId]
        );
        if (checkRes.rows.length === 0) {
            return res.status(403).json({ message: "Access denied to this contract." });
        }

        const tcRes = await pool.query(
            "SELECT * FROM contract_timecards WHERE contract_id = $1 ORDER BY work_date DESC, created_at DESC",
            [parseInt(id)]
        );
        res.status(200).json(tcRes.rows);
    } catch (error) {
        console.error("Error fetching contract timecards:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

export const submitTimecard = async (req, res) => {
    try {
        const { id } = req.params;
        const freelancerId = req.user.user_id;
        const { work_date, hours, minutes, description } = req.body;

        // Verify freelancer owns the contract
        const checkRes = await pool.query(
            "SELECT * FROM contracts WHERE contract_id = $1 AND freelancer_id = $2",
            [parseInt(id), freelancerId]
        );
        const contract = checkRes.rows[0];
        if (!contract) {
            return res.status(403).json({ message: "Contract not found or not owned by you." });
        }

        // Get agreed hourly rate from proposal
        const proposalRes = await pool.query(
            "SELECT bid_amount FROM proposals WHERE job_id = $1 AND freelancer_id = $2 AND status = 'Accepted'",
            [contract.job_id, contract.freelancer_id]
        );
        const hourlyRate = proposalRes.rows.length > 0 
            ? parseFloat(proposalRes.rows[0].bid_amount) 
            : (parseFloat(contract.budget) || 50.00);

        const hrs = parseInt(hours) || 0;
        const mins = parseInt(minutes) || 0;
        if (hrs < 0 || mins < 0) {
            return res.status(400).json({ message: "Hours and minutes cannot be negative." });
        }
        if (hrs === 0 && mins === 0) {
            return res.status(400).json({ message: "Working time must be greater than zero." });
        }

        const amount = (hrs + mins / 60.0) * hourlyRate;

        const insertRes = await pool.query(
            `INSERT INTO contract_timecards (contract_id, freelancer_id, client_id, work_date, hours, minutes, description, status, amount)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending', $8)
             RETURNING *`,
            [contract.contract_id, contract.freelancer_id, contract.client_id, work_date, hrs, mins, description, amount]
        );

        // No notification to client immediately upon log; it is just 'Pending' until explicitly requested
        res.status(201).json(insertRes.rows[0]);
    } catch (error) {
        console.error("Error submitting timecard:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

export const requestTimecardPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const freelancerId = req.user.user_id;
        const { timecard_ids } = req.body;

        if (!Array.isArray(timecard_ids) || timecard_ids.length === 0) {
            return res.status(400).json({ message: "No timecard IDs provided." });
        }

        // Verify contract owned by freelancer
        const checkRes = await pool.query(
            "SELECT * FROM contracts WHERE contract_id = $1 AND freelancer_id = $2",
            [parseInt(id), freelancerId]
        );
        const contract = checkRes.rows[0];
        if (!contract) {
            return res.status(403).json({ message: "Contract not found or not owned by you." });
        }

        // Update status of all matching pending timecards to 'Requested'
        const updateRes = await pool.query(
            `UPDATE contract_timecards 
             SET status = 'Requested', updated_at = CURRENT_TIMESTAMP 
             WHERE contract_id = $1 AND timecard_id = ANY($2::int[]) AND status = 'Pending'
             RETURNING *`,
            [contract.contract_id, timecard_ids.map(Number)]
        );

        if (updateRes.rows.length === 0) {
            return res.status(400).json({ message: "No pending timecards found to update." });
        }

        // Notify client of payment request
        try {
            await pool.query(
                `INSERT INTO notifications (user_id, title, message, type, reference_id)
                 VALUES ($1, 'Payment Requested', $2, 'contract', $3)`,
                [
                    contract.client_id,
                    `Freelancer requested payment for logged hours on contract: ${contract.title}`,
                    id.toString()
                ]
            );
        } catch (notifErr) {
            console.error("Failed to notify client on timecard payment request:", notifErr);
        }

        res.status(200).json({ message: "Payment requested successfully.", updatedTimecards: updateRes.rows });
    } catch (error) {
        console.error("Error requesting timecard payment:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

export const declineTimecard = async (req, res) => {
    try {
        const { id, timecard_id } = req.params;
        const clientId = req.user.user_id;

        // Verify client owns the contract
        const checkRes = await pool.query(
            "SELECT * FROM contracts WHERE contract_id = $1 AND client_id = $2",
            [parseInt(id), clientId]
        );
        const contract = checkRes.rows[0];
        if (!contract) {
            return res.status(403).json({ message: "Contract not found or not owned by you." });
        }

        // Fetch timecard
        const tcRes = await pool.query(
            "SELECT * FROM contract_timecards WHERE timecard_id = $1 AND contract_id = $2",
            [parseInt(timecard_id), contract.contract_id]
        );
        const timecard = tcRes.rows[0];
        if (!timecard) {
            return res.status(404).json({ message: "Timecard not found." });
        }
        if (timecard.status !== "Requested") {
            return res.status(400).json({ message: `Only requested timecards can be declined. Status: ${timecard.status}` });
        }

        // Update status of timecard to 'Declined'
        await pool.query(
            "UPDATE contract_timecards SET status = 'Declined', updated_at = CURRENT_TIMESTAMP WHERE timecard_id = $1",
            [timecard.timecard_id]
        );

        // Notify freelancer
        try {
            await pool.query(
                `INSERT INTO notifications (user_id, title, message, type, reference_id)
                 VALUES ($1, 'Timecard Payment Declined', $2, 'contract', $3)`,
                [
                    contract.freelancer_id,
                    `Client declined payment request for timecard on: ${contract.title}`,
                    id.toString()
                ]
            );
        } catch (notifErr) {
            console.error("Failed to notify freelancer on timecard decline:", notifErr);
        }

        res.status(200).json({ message: "Timecard payment request declined successfully." });
    } catch (error) {
        console.error("Error declining timecard:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

export const approveTimecard = async (req, res) => {
    try {
        const { id, timecard_id } = req.params;
        const clientId = req.user.user_id;

        // Verify client owns the contract
        const checkRes = await pool.query(
            "SELECT * FROM contracts WHERE contract_id = $1 AND client_id = $2",
            [parseInt(id), clientId]
        );
        const contract = checkRes.rows[0];
        if (!contract) {
            return res.status(403).json({ message: "Contract not found or not owned by you." });
        }

        // Fetch timecard
        const tcRes = await pool.query(
            "SELECT * FROM contract_timecards WHERE timecard_id = $1 AND contract_id = $2",
            [parseInt(timecard_id), contract.contract_id]
        );
        const timecard = tcRes.rows[0];
        if (!timecard) {
            return res.status(404).json({ message: "Timecard not found." });
        }
        if (timecard.status !== "Requested") {
            return res.status(400).json({ message: `Timecard is already in status: ${timecard.status} (must be Requested)` });
        }

        const amount = parseFloat(timecard.amount);
        const escrowAvailable = parseFloat(contract.budget || 0);
        const escrowPayment = Math.min(escrowAvailable, amount);
        const extraPayment = Math.max(0, amount - escrowAvailable);

        // Check if client wallet has enough for the extra payment (if any)
        const clientWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [contract.client_id]);
        const clientWallet = clientWalletRes.rows[0];
        if (extraPayment > 0) {
            if (!clientWallet || parseFloat(clientWallet.balance) < extraPayment) {
                return res.status(400).json({
                    message: `Insufficient client wallet balance. Payment requires $${amount.toFixed(2)} ($${escrowPayment.toFixed(2)} covered by remaining escrow, $${extraPayment.toFixed(2)} due now), but your wallet only has $${clientWallet ? parseFloat(clientWallet.balance).toFixed(2) : '0.00'}. Please deposit funds.`
                });
            }
        }

        // Get admin/system escrow wallet (holds the escrowed funds)
        let systemWallet = null;
        if (escrowPayment > 0) {
            const sysWalletRes = await pool.query("SELECT * FROM wallets WHERE is_system = TRUE LIMIT 1");
            systemWallet = sysWalletRes.rows[0] || null;
        }

        const freelancerWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [contract.freelancer_id]);
        let freelancerWallet = freelancerWalletRes.rows[0];
        if (!freelancerWallet) {
            const insertFreelancerWallet = "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD') RETURNING *";
            const insertRes = await pool.query(insertFreelancerWallet, [contract.freelancer_id]);
            freelancerWallet = insertRes.rows[0];
        }

        // Calculate commission fee (standard platform fee)
        let commissionPercent = 0.05; // Default 5%
        const feeRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'platform_fee'");
        if (feeRes.rows.length > 0) {
            let feeVal = feeRes.rows[0].setting_value;
            if (typeof feeVal === "string") {
                try { feeVal = JSON.parse(feeVal); } catch {}
            }
            if (feeVal?.fee) {
                commissionPercent = parseFloat(feeVal.fee) / 100;
            }
        }
        const commissionAmount = amount * commissionPercent;
        const freelancerAmount = amount - commissionAmount;

        // Perform Wallet Transaction
        await pool.query("BEGIN");
        try {
            // 1. Debit client wallet for extra payment (if any)
            if (extraPayment > 0 && clientWallet) {
                await pool.query(
                    "UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
                    [extraPayment, clientWallet.wallet_id]
                );
            }

            // 2. Debit system escrow wallet for escrow covered part (if any)
            if (escrowPayment > 0 && systemWallet) {
                await pool.query(
                    "UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
                    [escrowPayment, systemWallet.wallet_id]
                );
            }

            // 3. Credit freelancer wallet
            await pool.query(
                "UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
                [freelancerAmount, freelancerWallet.wallet_id]
            );

            // Record transaction logs
            const txQuery = `
                INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, commission_amount, type, status, description)
                VALUES ($1, $2, $3, $4, 'Milestone_Release', 'Completed', $5)
            `;
            const txDesc = `Payment for hours worked on contract: ${contract.title}`;
            // Use client's wallet for the transaction logs, or escrow/system wallet if it's purely covered by escrow
            const senderWalletId = extraPayment > 0 && clientWallet ? clientWallet.wallet_id : (systemWallet ? systemWallet.wallet_id : null);
            await pool.query(txQuery, [senderWalletId, freelancerWallet.wallet_id, freelancerAmount, commissionAmount, txDesc]);

            // 4. Update the contract's remaining budget (escrow available balance)
            if (escrowPayment > 0) {
                await pool.query(
                    "UPDATE contracts SET budget = budget - $1, updated_at = CURRENT_TIMESTAMP WHERE contract_id = $2",
                    [escrowPayment, contract.contract_id]
                );
            }

            // 5. Update timecard status
            await pool.query(
                "UPDATE contract_timecards SET status = 'Paid', updated_at = CURRENT_TIMESTAMP WHERE timecard_id = $1",
                [timecard.timecard_id]
            );

            await pool.query("COMMIT");
        } catch (txErr) {
            await pool.query("ROLLBACK");
            throw txErr;
        }

        // Notify freelancer
        try {
            await pool.query(
                `INSERT INTO notifications (user_id, title, message, type, reference_id)
                 VALUES ($1, 'Timecard Approved & Paid', $2, 'contract', $3)`,
                [
                    contract.freelancer_id,
                    `Client approved and paid $${amount.toFixed(2)} for timecard on: ${contract.title}`,
                    id.toString()
                ]
            );
        } catch (notifErr) {
            console.error("Failed to notify freelancer on timecard approval:", notifErr);
        }

        res.status(200).json({ message: "Timecard approved and paid successfully!" });
    } catch (error) {
        console.error("Error approving timecard:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

export const getPublicFreelancers = async (req, res) => {
    try {
        const query = `
            SELECT 
              u.user_id,
              u.slug,
              u.display_name,
              CONCAT_WS(' ', u.first_name, u.last_name) AS name,
              u.email,
              u.profile_image,
              fp.professional_title,
              fp.hourly_rate,
              fp.bio,
              fp.vetting_status,
              fp.experience_level,
              fp.category_id,
              fp.sub_category_id,
              COALESCE(u.active_plan_subscribed_at + (sp.profile_featured_duration * INTERVAL '1 day') >= CURRENT_TIMESTAMP AND sp.profile_featured_duration > 0, false) as is_featured,
              (SELECT category_name FROM categories WHERE category_id = fp.category_id) AS category_name,
              (SELECT sub_category_name FROM sub_categories WHERE sub_category_id = fp.sub_category_id) AS sub_category_name,
              (
                SELECT COALESCE(json_agg(s.skill_name), '[]'::json)
                FROM user_skills us
                JOIN skills s ON us.skill_id = s.skill_id
                WHERE us.user_id = u.user_id
              ) as skills,
              COALESCE((
                SELECT ROUND(AVG(all_reviews.rating)::numeric, 1)::float
                FROM (
                  SELECT cr.rating::numeric FROM contract_reviews cr WHERE cr.reviewee_id = u.user_id AND cr.reviewer_role = 'client'
                  UNION ALL
                  SELECT gr.rating::numeric FROM gig_reviews gr JOIN gigs g ON gr.gig_id = g.gig_id WHERE g.freelancer_id = u.user_id
                ) all_reviews
              ), 0.0) AS rating,
              COALESCE((
                SELECT COUNT(*)::int FROM contracts WHERE freelancer_id = u.user_id AND status = 'Completed'
              ), 0) AS completed_jobs
            FROM users u
            JOIN freelancer_profiles fp ON u.user_id = fp.user_id
            LEFT JOIN subscription_plans sp ON u.active_plan_id = sp.plan_id
            WHERE fp.onboarding_completed = true
              AND u.is_active = true
              AND fp.vetting_status = 'Approved'
            ORDER BY is_featured DESC, u.created_at DESC
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching public freelancers:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

export const getRecommendedFreelancers = async (req, res) => {
    try {
        const clientId = req.user.user_id;
        const query = `
            WITH matched_freelancers AS (
              SELECT DISTINCT ON (u.user_id)
                u.user_id,
                u.slug,
                u.display_name,
                CONCAT_WS(' ', u.first_name, u.last_name) AS name,
                u.email,
                u.profile_image,
                u.created_at,
                fp.professional_title,
                fp.hourly_rate,
                fp.bio,
                fp.vetting_status,
                fp.experience_level,
                fp.category_id,
                fp.sub_category_id,
                (SELECT category_name FROM categories WHERE category_id = fp.category_id) AS category_name,
                (SELECT sub_category_name FROM sub_categories WHERE sub_category_id = fp.sub_category_id) AS sub_category_name,
                (
                  SELECT COALESCE(json_agg(s.skill_name), '[]'::json)
                  FROM user_skills us
                  JOIN skills s ON us.skill_id = s.skill_id
                  WHERE us.user_id = u.user_id
                ) as skills,
                (
                  SELECT COUNT(*) 
                  FROM jobs j 
                  WHERE j.client_id = $1 
                    AND (j.category_id = fp.category_id OR j.sub_category_id = fp.sub_category_id)
                ) as category_matches,
                (
                  SELECT COUNT(*)
                  FROM contracts
                  WHERE freelancer_id = fp.user_id AND status = 'Completed'
                ) as completed_contracts,
                COALESCE(
                  (
                    SELECT AVG(gr.rating)
                    FROM gig_reviews gr
                    JOIN gigs g ON gr.gig_id = g.gig_id
                    WHERE g.freelancer_id = fp.user_id
                  ),
                  5.0
                ) as avg_rating
              FROM users u
              JOIN freelancer_profiles fp ON u.user_id = fp.user_id
              WHERE fp.onboarding_completed = true
                AND u.is_active = true
                AND fp.vetting_status = 'Approved'
                AND u.user_id != $1
            )
            SELECT *
            FROM matched_freelancers
            ORDER BY 
              category_matches DESC,
              CASE WHEN vetting_status = 'Approved' THEN 1 ELSE 2 END ASC,
              created_at DESC
            LIMIT 9
        `;
        const result = await pool.query(query, [clientId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching recommended freelancers:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

export const validateFreelancerSlug = async (req, res) => {
    try {
        const { slug, excludeUserId } = req.query;
        if (!slug) {
            return res.status(400).json({ message: "Slug is required." });
        }
        
        let query = "SELECT 1 FROM users WHERE slug = $1";
        const params = [slug.toLowerCase().trim()];
        
        if (excludeUserId) {
            query += " AND user_id != $2";
            params.push(parseInt(excludeUserId));
        }
        
        const result = await pool.query(query, params);
        const available = result.rows.length === 0;
        
        return res.status(200).json({ available });
    } catch (error) {
        console.error("Error validating freelancer slug:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

export const submitContractCompletion = async (req, res) => {
    try {
        const { id } = req.params;
        const freelancerId = req.user.user_id;

        // Verify freelancer owns the contract
        const checkRes = await pool.query(
            "SELECT * FROM contracts WHERE contract_id = $1 AND freelancer_id = $2",
            [parseInt(id), freelancerId]
        );
        const contract = checkRes.rows[0];
        if (!contract) {
            return res.status(403).json({ message: "Contract not found or not owned by you." });
        }

        if (contract.status !== "Work Started" && contract.status !== "In Progress") {
            return res.status(400).json({ message: `Contract cannot be submitted for completion in status: ${contract.status}` });
        }

        const { submitted_files } = req.body;

        // Update contract status to 'Work Completed'
        await pool.query(
            "UPDATE contracts SET status = 'Work Completed', submitted_files = $1, submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE contract_id = $2",
            [submitted_files || null, contract.contract_id]
        );

        // Notify client
        try {
            await pool.query(
                `INSERT INTO notifications (user_id, title, message, type, reference_id)
                 VALUES ($1, 'Project Completion Submitted', $2, 'contract', $3)`,
                [
                    contract.client_id,
                    `Freelancer marked the contract "${contract.title}" as completed. Please review and approve to finalize.`,
                    contract.contract_id.toString()
                ]
            );
        } catch (notifErr) {
            console.error("Failed to notify client on completion submission:", notifErr);
        }

        res.status(200).json({ message: "Project completion submitted successfully." });
    } catch (error) {
        console.error("Error submitting contract completion:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

export const approveContractCompletion = async (req, res) => {
    try {
        const { id } = req.params;
        const clientId = req.user.user_id;

        // Verify client owns the contract
        const checkRes = await pool.query(
            "SELECT * FROM contracts WHERE contract_id = $1 AND client_id = $2",
            [parseInt(id), clientId]
        );
        const contract = checkRes.rows[0];
        if (!contract) {
            return res.status(403).json({ message: "Contract not found or not owned by you." });
        }

        if (contract.status !== "Work Completed") {
            return res.status(400).json({ message: `Contract cannot be finalized in status: ${contract.status}. It must be 'Work Completed'.` });
        }

        const escrowAmount = parseFloat(contract.budget || 0);

        await pool.query("BEGIN");
        try {
            if (escrowAmount > 0) {
                // Get system wallet
                const sysWalletRes = await pool.query("SELECT * FROM wallets WHERE is_system = TRUE LIMIT 1");
                const systemWallet = sysWalletRes.rows[0];

                // Get freelancer wallet
                const freelancerWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [contract.freelancer_id]);
                let freelancerWallet = freelancerWalletRes.rows[0];
                if (!freelancerWallet) {
                    const insertWallet = await pool.query(
                        "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD') RETURNING *",
                        [contract.freelancer_id]
                    );
                    freelancerWallet = insertWallet.rows[0];
                }

                // Get commission percent based on standard platform fee
                let commissionPercent = 0.05; // Default 5%
                const feeRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'platform_fee'");
                if (feeRes.rows.length > 0) {
                    let feeVal = feeRes.rows[0].setting_value;
                    if (typeof feeVal === "string") {
                        try { feeVal = JSON.parse(feeVal); } catch {}
                    }
                    if (feeVal?.fee) {
                        commissionPercent = parseFloat(feeVal.fee) / 100;
                    }
                }

                const commissionAmount = escrowAmount * commissionPercent;
                const freelancerAmount = escrowAmount - commissionAmount;

                // Update system wallet (debit escrowAmount)
                if (systemWallet) {
                    await pool.query(
                        "UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
                        [escrowAmount, systemWallet.wallet_id]
                    );
                }

                // Update freelancer wallet (credit freelancerAmount)
                await pool.query(
                    "UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
                    [freelancerAmount, freelancerWallet.wallet_id]
                );

                // Insert wallet transaction
                const txQuery = `
                    INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, commission_amount, type, status, description)
                    VALUES ($1, $2, $3, $4, 'Milestone_Release', 'Completed', $5)
                `;
                const txDesc = `Final escrow release for completed contract: ${contract.title}`;
                const senderWalletId = systemWallet ? systemWallet.wallet_id : null;
                await pool.query(txQuery, [senderWalletId, freelancerWallet.wallet_id, escrowAmount, commissionAmount, txDesc]);
            }

            // Update contract status to Completed and budget to 0 (all escrow released)
            await pool.query(
                `UPDATE contracts 
                 SET status = 'Completed', budget = 0, progress = 100, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
                 WHERE contract_id = $1`,
                [contract.contract_id]
            );

            // If linked to a gig application, update gig application status to Completed
            if (contract.application_id) {
                await pool.query(
                    "UPDATE gig_applications SET status = 'Completed', updated_at = CURRENT_TIMESTAMP WHERE application_id = $1",
                    [contract.application_id]
                );
            }

            await pool.query("COMMIT");
        } catch (txErr) {
            await pool.query("ROLLBACK");
            throw txErr;
        }

        // Notify freelancer
        try {
            await pool.query(
                `INSERT INTO notifications (user_id, title, message, type, reference_id)
                 VALUES ($1, 'Contract Completed', $2, 'contract', $3)`,
                [
                    contract.freelancer_id,
                    `Client approved project completion and closed contract: ${contract.title}`,
                    contract.contract_id.toString()
                ]
            );
        } catch (notifErr) {
            console.error("Failed to notify freelancer on completion approval:", notifErr);
        }

        res.status(200).json({ message: "Contract completed and closed successfully." });
    } catch (error) {
        console.error("Error approving contract completion:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

export const getPublicClientProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const isNumeric = /^\d+$/.test(id);
        let userId;

        if (isNumeric) {
            userId = parseInt(id);
        } else {
            const nameSearch = id.replace(/-/g, ' ');
            let userLookup = await pool.query("SELECT user_id FROM users WHERE slug = $1", [id]);
            
            if (userLookup.rows.length === 0) {
                userLookup = await pool.query(
                    "SELECT user_id FROM users WHERE LOWER(display_name) = LOWER($1) OR LOWER(first_name || ' ' || last_name) = LOWER($2) OR LOWER(first_name) = LOWER($3) OR LOWER(first_name || '-' || last_name) = LOWER($4)",
                    [id, nameSearch, id, id]
                );
            }

            if (userLookup.rows.length === 0) {
                return res.status(404).json({ message: "Client not found." });
            }
            userId = userLookup.rows[0].user_id;
        }

        const userRes = await pool.query(
            `SELECT u.user_id, CONCAT_WS(' ', u.first_name, u.last_name) as name, u.email, u.profile_image, u.slug, u.display_name, u.created_at
             FROM users u
             WHERE u.user_id = $1`,
            [userId]
        );
        const user = userRes.rows[0] || null;

        if (!user) {
            return res.status(404).json({ message: "Client not found." });
        }

        const profileRes = await pool.query(
            `SELECT * FROM client_profiles WHERE user_id = $1`,
            [userId]
        );
        const profile = profileRes.rows[0] || null;

        const reviewsRes = await pool.query(
            `SELECT cr.*, 
                    CONCAT_WS(' ', u.first_name, u.last_name) as reviewer_name,
                    u.profile_image as reviewer_image,
                    j.title as project_title,
                    'Freelancer Review' as reviewer_role_label
             FROM contract_reviews cr
             JOIN users u ON cr.reviewer_id = u.user_id
             JOIN contracts c ON cr.contract_id = c.contract_id
             LEFT JOIN jobs j ON c.job_id = j.job_id
             WHERE (cr.reviewee_id = $1 OR c.client_id = $1) AND cr.reviewer_role = 'freelancer'
             ORDER BY cr.created_at DESC`,
            [userId]
        );
        const reviews = reviewsRes.rows;

        const jobsRes = await pool.query(
            `SELECT j.*, 
                    cat.category_name, 
                    sub.sub_category_name,
                    (SELECT COUNT(*) FROM proposals WHERE job_id = j.job_id AND status != 'Pending Approval') as proposal_count
             FROM jobs j
             LEFT JOIN categories cat ON j.category_id = cat.category_id
             LEFT JOIN sub_categories sub ON j.sub_category_id = sub.sub_category_id
             WHERE j.client_id = $1 AND j.status = 'Open'
             ORDER BY j.created_at DESC`,
            [userId]
        );
        const jobs = jobsRes.rows;

        let avgRating = 0;
        if (reviews.length > 0) {
            const sum = reviews.reduce((acc, r) => acc + parseFloat(r.rating || 0), 0);
            avgRating = parseFloat((sum / reviews.length).toFixed(1));
        }

        return res.status(200).json({
            user,
            profile,
            reviews,
            jobs,
            stats: {
                total_reviews: reviews.length,
                average_rating: avgRating,
                open_jobs: jobs.length
            }
        });
    } catch (error) {
        console.error("Error fetching client profile:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

