import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config/db.js';

import userRoutes from './routes/userRoutes.js';
import adminRoutes from './admin/routes/adminRoutes.js';
import categoryRoutes from './admin/routes/categoryRoutes.js';
import subCategoryRoutes from './admin/routes/subCategoryRoutes.js';
import skillRoutes from './admin/routes/skillRoutes.js';
import freelancerRoutes from './routes/freelancerRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import proposalRoutes from './routes/proposalRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import { getSettings } from './admin/controllers/settingsController.js';
import cmsRoutes from './admin/routes/cmsRoutes.js';
import translationRoutes from './routes/translationRoutes.js';
import subscriptionPlanRoutes from './routes/subscriptionPlanRoutes.js';
import faqRoutes from './routes/faqRoutes.js';
import landingSectionsRoutes from './routes/landingSectionsRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import seoRoutes from './routes/seoRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Attach socket.io instance to requests
app.use((req, res, next) => {
  req.io = req.app.get('io');
  next();
});

// Serve uploaded files statically
app.use('/public', express.static(path.join(__dirname, '../public')));
app.use('/api/public', express.static(path.join(__dirname, '../public')));

app.get('/api/settings', getSettings);
app.use('/api', cmsRoutes);
app.use('/api', translationRoutes);
app.use('/api', subscriptionPlanRoutes);
app.use('/api', faqRoutes);
app.use('/api', landingSectionsRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/freelancer', freelancerRoutes);
app.use('/api/freelancers', freelancerRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api', blogRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/seo', seoRoutes);


app.use("/api/admin/categories",categoryRoutes);
app.use("/api/admin/sub-categories",subCategoryRoutes);
app.use("/api/admin/skills", skillRoutes);

// Contact Inquiry form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    if (!email || !message) {
      return res.status(400).json({ error: "Email and message are required fields." });
    }
    
    const result = await pool.query(
      `INSERT INTO contact_inquiries (name, email, subject, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name || null, email, subject || 'General Inquiry', message]
    );
    
    return res.status(201).json({
      success: true,
      message: "Inquiry submitted successfully!",
      inquiry: result.rows[0]
    });
  } catch (error) {
    console.error("Error submitting contact inquiry:", error);
    return res.status(500).json({ error: "Internal server error. Failed to submit inquiry." });
  }
});

// Newsletter Subscription endpoint
app.post('/api/newsletter/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email address is required." });
    }
    
    // Check if already subscribed
    const checkSub = await pool.query(
      `SELECT 1 FROM newsletter_subscribers WHERE email = $1`,
      [email]
    );
    
    if (checkSub.rows.length > 0) {
      return res.status(400).json({ error: "This email address is already subscribed to our newsletter." });
    }
    
    const result = await pool.query(
      `INSERT INTO newsletter_subscribers (email)
       VALUES ($1)
       RETURNING *`,
      [email]
    );
    
    return res.status(201).json({
      success: true,
      message: "Subscribed to newsletter successfully!",
      subscriber: result.rows[0]
    });
  } catch (error) {
    console.error("Error subscribing to newsletter:", error);
    return res.status(500).json({ error: "Internal server error. Failed to subscribe to newsletter." });
  }
});

export default app;