import express from "express";
import auth from "../middleware/auth.js";
import {
  getUserWallet,
  requestWithdrawal,
  depositFunds,
  createStripeDepositSession,
  confirmStripeDepositPayment
} from "../controllers/walletController.js";

const router = express.Router();

// Apply auth middleware
router.use(auth);

router.get("/", getUserWallet);
router.post("/withdraw", requestWithdrawal);
router.post("/deposit", depositFunds);
router.post("/deposit/stripe/create-session", createStripeDepositSession);
router.post("/deposit/stripe/confirm", confirmStripeDepositPayment);

export default router;
