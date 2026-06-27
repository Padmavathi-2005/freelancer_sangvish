import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as userModel from '../models/userModel.js';

export const register = async (req, res) => {

    try {

        const {
            first_name,
            email,
            password
        } = req.body;
console.log(req.body);
console.log("Password:", password);
        const password_hash =
            await bcrypt.hash(password, 10);

        const user =
            await userModel.createUser(
                first_name,
                email,
                password_hash
            );

        const token = jwt.sign(
            {
                user_id: user.user_id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '7d'
            }
        );

        res.status(201).json({
            token,
            user: {
                user_id: user.user_id,
                first_name: user.first_name,
                email: user.email
            }
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

export const login = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;

        const user =
            await userModel.findUserByEmail(email);

        if (!user) {

            return res.status(401).json({
                message: 'User not exist'
            });

        }

        const isMatch =
            await bcrypt.compare(
                password,
                user.password_hash
            );

        if (!isMatch) {

            return res.status(401).json({
                message: 'Invalid password'
            });

        }

        const token = jwt.sign(
            {
                user_id: user.user_id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '7d'
            }
        );

        res.status(200).json({
            token,
            user: {
                user_id: user.user_id,
                first_name: user.first_name,
                email: user.email
            }
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

export const onboardingCheck = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { default: pool } = await import('../config/db.js');

        // Check if freelancer profile exists and is completed
        const freelancerProfileRes = await pool.query(
            "SELECT onboarding_completed FROM freelancer_profiles WHERE user_id = $1",
            [userId]
        );
        const hasFreelancerProfile = freelancerProfileRes.rows.length > 0 && freelancerProfileRes.rows[0].onboarding_completed === true;

        // Check if client profile exists and is completed
        const clientProfileRes = await pool.query(
            "SELECT onboarding_completed FROM client_profiles WHERE user_id = $1",
            [userId]
        );
        const hasClientProfile = clientProfileRes.rows.length > 0 && clientProfileRes.rows[0].onboarding_completed === true;

        res.status(200).json({
            hasFreelancerProfile,
            hasClientProfile
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createClientProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { ClientProfile } = await import('../models/clientProfileModel.js');

        const {
            company_name,
            company_size,
            industry,
            company_website,
            company_description,
            company_established_year,
            hiring_contact_name,
            hiring_contact_designation,
            onboarding_completed
        } = req.body;

        // Check if client profile already exists
        const checkRes = await ClientProfile.findByUserId(userId);
        let profile;

        if (checkRes.rows.length === 0) {
            const createRes = await ClientProfile.create(
                userId,
                company_name,
                company_size,
                industry,
                company_website,
                company_description,
                company_established_year,
                hiring_contact_name,
                hiring_contact_designation
            );
            profile = createRes.rows[0];
        } else {
            const current = checkRes.rows[0];
            const updatedProfile = await ClientProfile.update(
                userId,
                company_name !== undefined ? company_name : current.company_name,
                company_size !== undefined ? company_size : current.company_size,
                industry !== undefined ? industry : current.industry,
                company_website !== undefined ? company_website : current.company_website,
                company_description !== undefined ? company_description : current.company_description,
                company_established_year !== undefined ? (company_established_year ? parseInt(company_established_year) : null) : current.company_established_year,
                hiring_contact_name !== undefined ? hiring_contact_name : current.hiring_contact_name,
                hiring_contact_designation !== undefined ? hiring_contact_designation : current.hiring_contact_designation
            );
            profile = updatedProfile.rows[0];
        }

        if (onboarding_completed !== undefined) {
            const statusRes = await ClientProfile.updateOnboardingStatus(userId, onboarding_completed);
            profile = statusRes.rows[0];
        }

        res.status(201).json({
            message: "Client profile saved successfully.",
            profile
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getClientProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { ClientProfile } = await import('../models/clientProfileModel.js');

        const checkRes = await ClientProfile.findByUserId(userId);
        if (checkRes.rows.length === 0) {
            return res.status(404).json({ message: "Client profile not found" });
        }

        res.status(200).json({
            profile: checkRes.rows[0]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getClientHiredFreelancers = async (req, res) => {
    try {
        const clientId = req.user.user_id;
        const { default: pool } = await import('../config/db.js');

        const query = `
            SELECT DISTINCT 
              u.user_id,
              u.first_name || ' ' || u.last_name as name,
              u.email,
              u.profile_image,
              fp.professional_title as title,
              fp.hourly_rate,
              fp.experience_level,
              fp.availability_status,
              COALESCE(
                (SELECT json_agg(json_build_object('project_id', j.job_id, 'title', j.title, 'type', 'project', 'status', p.status))
                 FROM proposals p
                 JOIN jobs j ON p.job_id = j.job_id
                 WHERE p.freelancer_id = u.user_id AND j.client_id = $1 AND p.status = 'Accepted'),
                '[]'::json
              ) as projects,
              COALESCE(
                (SELECT json_agg(json_build_object('application_id', ga.application_id, 'title', g.title, 'type', 'gig', 'status', ga.status))
                 FROM gig_applications ga
                 JOIN gigs g ON ga.gig_id = g.gig_id
                 WHERE ga.client_id = $1 AND g.freelancer_id = u.user_id AND ga.status = 'Accepted'),
                '[]'::json
              ) as gigs
            FROM users u
            JOIN freelancer_profiles fp ON u.user_id = fp.user_id
            WHERE u.user_id IN (
              -- Freelancers with accepted proposals for client's jobs
              SELECT p.freelancer_id 
              FROM proposals p
              JOIN jobs j ON p.job_id = j.job_id
              WHERE j.client_id = $1 AND p.status = 'Accepted'
              
              UNION
              
              -- Freelancers with accepted gig orders from this client
              SELECT g.freelancer_id
              FROM gig_applications ga
              JOIN gigs g ON ga.gig_id = g.gig_id
              WHERE ga.client_id = $1 AND ga.status = 'Accepted'
            )
        `;
        const result = await pool.query(query, [clientId]);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};