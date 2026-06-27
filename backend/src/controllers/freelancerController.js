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
            availability_status
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
                resume_url || null
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
                resume_url || null
            );
            profile = createRes.rows[0];
        }

        // Ensure current step is updated to step 2 if we are currently at step 1
        if (profile.current_step === 1) {
            const stepRes = await FreelancerProfile.updateCurrentStep(userId, 2);
            profile = stepRes.rows[0];
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
        const { language_ids } = req.body;

        if (!Array.isArray(language_ids) || language_ids.length === 0) {
            return res.status(400).json({ message: "At least one language is required." });
        }

        // Clear existing languages
        await UserLanguage.deleteByUserId(userId);

        // Add new languages
        const added = [];
        for (const langId of language_ids) {
            const res = await UserLanguage.addLanguage(userId, langId);
            added.push(res.rows[0]);
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
            `SELECT l.language_id, l.language_name
             FROM user_languages ul
             JOIN languages l ON ul.language_id = l.language_id
             WHERE ul.user_id = $1`,
            [userId]
        );

        const expRes = await Experience.getByUserId(userId);
        const eduRes = await Education.getByUserId(userId);
        const certRes = await Certification.getByUserId(userId);
        const projRes = await FreelancerProject.getByUserId(userId);

        const userRes = await pool.query("SELECT email, phone, email_verified, phone_verified FROM users WHERE user_id = $1", [userId]);

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

        // Validate step 3: verification (email and phone) - Bypassed as requested by user
        /*
        const userRes = await pool.query("SELECT email_verified, phone_verified FROM users WHERE user_id = $1", [userId]);
        const emailVerified = userRes.rows[0]?.email_verified === true;
        const phoneVerified = userRes.rows[0]?.phone_verified === true;

        if (!emailVerified || !phoneVerified) {
            return res.status(400).json({ message: "Step 3: Both email and phone verification are required." });
        }
        */

        // Update onboarding_completed and current_step
        await FreelancerProfile.updateOnboardingStatus(userId, true);
        await FreelancerProfile.updateCurrentStep(userId, 5); // 5 represents fully onboarded/dashboard ready

        res.status(200).json({
            message: "Onboarding completed successfully.",
            onboardingCompleted: true
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
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({ message: "Invalid user ID." });
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

        const userRes = await pool.query(
            "SELECT first_name || ' ' || last_name as name, email, profile_image FROM users WHERE user_id = $1",
            [userId]
        );
        const user = userRes.rows[0] || null;

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        res.status(200).json({
            user,
            profile: profile ? {
                ...profile,
                hourlyRate: profile.hourly_rate,
                role: profile.professional_title
            } : null,
            skills: skillsRes.rows
        });
    } catch (error) {
        console.error("Error fetching public freelancer profile:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

