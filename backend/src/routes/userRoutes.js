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
    socialLogin,
    getReferrals,
    getAffiliateStats,
    getReferralBanner,
    getUserProfile
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
router.get('/profile', auth, getUserProfile);
router.put('/profile', auth, updateUserProfile);
router.get('/referrals', auth, getReferrals);
router.get('/affiliate/stats', auth, getAffiliateStats);
router.get('/referral/banner.svg', getReferralBanner);

export default router;