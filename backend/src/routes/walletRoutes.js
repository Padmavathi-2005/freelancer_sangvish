import express from "express";
import auth from "../middleware/auth.js";
import {
  getUserWallet,
  requestWithdrawal,
  depositFunds
} from "../controllers/walletController.js";

const router = express.Router();

// Apply auth middleware
router.use(auth);

router.get("/", getUserWallet);
router.post("/withdraw", requestWithdrawal);
router.post("/deposit", depositFunds);

export default router;
