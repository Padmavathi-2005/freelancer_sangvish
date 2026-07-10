import express from 'express';
import { logSearch, getSearchLogsSummary } from '../controllers/analyticsController.js';
import { adminAuth } from '../admin/middleware/adminAuth.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey";

// Optional user auth to extract user_id if present
const optionalUserAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (e) {
      // Ignore invalid user token for logging
    }
  }
  next();
};

const router = express.Router();

// Public route to log searches
router.post('/search', optionalUserAuth, logSearch);

// Admin-only route to get analytics summary
router.get('/search-summary', adminAuth, getSearchLogsSummary);

export default router;
