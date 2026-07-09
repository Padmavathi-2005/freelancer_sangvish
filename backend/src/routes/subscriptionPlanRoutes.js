import express from "express";
import pool from "../config/db.js";

const router = express.Router();

// GET /api/subscription-plans (Public endpoint to list plans)
router.get("/subscription-plans", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM subscription_plans ORDER BY plan_id ASC"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
