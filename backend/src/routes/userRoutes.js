import express from 'express';
import auth from '../middleware/auth.js';
import {
    register,
    login,
    onboardingCheck,
    createClientProfile,
    getClientProfile,
    getClientHiredFreelancers,
    getMySubscription,
    subscribeToPlan,
    getLoggedInUser,
    updateUserProfile,
    socialLogin
} from '../controllers/userController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/social-login', socialLogin);
router.get('/onboarding-check', auth, onboardingCheck);
router.post('/client-profile', auth, createClientProfile);
router.get('/client-profile', auth, getClientProfile);
router.get('/client/hired-freelancers', auth, getClientHiredFreelancers);
router.get('/me/subscription', auth, getMySubscription);
router.post('/subscribe', auth, subscribeToPlan);
router.get('/me', auth, getLoggedInUser);
router.put('/profile', auth, updateUserProfile);

export default router;