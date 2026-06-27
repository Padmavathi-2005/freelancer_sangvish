import express from 'express';
import auth from '../middleware/auth.js';
import {
    register,
    login,
    onboardingCheck,
    createClientProfile,
    getClientProfile,
    getClientHiredFreelancers
} from '../controllers/userController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/onboarding-check', auth, onboardingCheck);
router.post('/client-profile', auth, createClientProfile);
router.get('/client-profile', auth, getClientProfile);
router.get('/client/hired-freelancers', auth, getClientHiredFreelancers);

export default router;