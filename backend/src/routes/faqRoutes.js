import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.get('/faqs', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM faq_items ORDER BY sort_order ASC, faq_id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
