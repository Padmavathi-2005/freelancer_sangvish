import express from 'express';
import { getSeoByRoute, getAllSeoSettings, updateSeoSettings } from '../controllers/seoController.js';
import { adminAuth } from '../admin/middleware/adminAuth.js';

const router = express.Router();

// Public route to fetch SEO tags dynamically
router.get('/', getSeoByRoute);

// Admin routes
router.get('/admin', adminAuth, getAllSeoSettings);
router.put('/admin/:id', adminAuth, updateSeoSettings);

export default router;
