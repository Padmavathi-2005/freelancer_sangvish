import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey";

export const auth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Invalid authorization format" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Map admin user details to users table for chat integration
        if (decoded.admin_id && !decoded.user_id) {
            const userCheck = await pool.query("SELECT user_id FROM users WHERE email = $1", [decoded.email]);
            if (userCheck.rows.length === 0) {
                const name = decoded.full_name || "Admin Mediator";
                const insertUser = await pool.query(
                    "INSERT INTO users (first_name, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id",
                    [name, decoded.email, "ADMIN_VIRTUAL_HASH"]
                );
                decoded.user_id = insertUser.rows[0].user_id;
            } else {
                decoded.user_id = userCheck.rows[0].user_id;
            }
        } else if (decoded.user_id) {
            const activeCheck = await pool.query("SELECT is_active FROM users WHERE user_id = $1", [decoded.user_id]);
            if (activeCheck.rows.length > 0 && activeCheck.rows[0].is_active === false) {
                return res.status(403).json({ message: "Your account has been blocked by administrator." });
            }
        }

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

export const checkApprovedFreelancer = async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    // Check freelancer profile vetting status
    const freeRes = await pool.query("SELECT vetting_status FROM freelancer_profiles WHERE user_id = $1", [userId]);
    if (freeRes.rows.length > 0) {
      const vettingStatus = freeRes.rows[0].vetting_status;
      if (vettingStatus !== "Approved") {
        return res.status(403).json({ 
          message: "Your freelancer profile is pending admin approval. Action blocked." 
        });
      }
    }

    // Check client profile vetting status
    const clientRes = await pool.query("SELECT vetting_status FROM client_profiles WHERE user_id = $1", [userId]);
    if (clientRes.rows.length > 0) {
      const vettingStatus = clientRes.rows[0].vetting_status;
      if (vettingStatus !== "Approved") {
        return res.status(403).json({ 
          message: "Your client profile is pending admin approval. Action blocked." 
        });
      }
    }

    next();
  } catch (error) {
    console.error("Error in checkApprovedFreelancer middleware:", error);
    return res.status(500).json({ message: "Internal server error during verification check." });
  }
};

export const checkApprovedClient = async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    // Check client profile onboarding and vetting status
    const clientRes = await pool.query(
      "SELECT onboarding_completed, vetting_status FROM client_profiles WHERE user_id = $1",
      [userId]
    );

    if (clientRes.rows.length === 0) {
      return res.status(403).json({ 
        message: "You must complete client onboarding before performing this action." 
      });
    }

    const { onboarding_completed, vetting_status } = clientRes.rows[0];

    if (!onboarding_completed) {
      return res.status(403).json({ 
        message: "You must complete client onboarding before performing this action." 
      });
    }

    if (vetting_status !== "Approved") {
      return res.status(403).json({ 
        message: "Your client profile is pending administrator approval. Action blocked." 
      });
    }

    next();
  } catch (error) {
    console.error("Error in checkApprovedClient middleware:", error);
    return res.status(500).json({ message: "Internal server error during client verification check." });
  }
};

export default auth;
