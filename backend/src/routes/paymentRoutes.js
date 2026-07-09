import express from "express";
import auth from "../middleware/auth.js";
import {
  createStripeSession,
  createStripeSubscriptionSession,
  confirmStripePayment,
  payWithWallet,
  createStripeProposalSession,
  confirmStripeProposalPayment,
  payProposalDirectly,
  releaseMilestonePayment,
  submitMilestoneWork,
  rejectMilestoneWork,
  cancelContractAndRefund,
  startWorkContract,
  createStripeTimecardSession,
  confirmStripeTimecardPayment,
  payTimecardDirectly
} from "../controllers/paymentController.js";
import {
  openDispute,
  respondToDispute,
  proposeSettlement,
  acceptSettlement,
  escalateDispute
} from "../controllers/disputeController.js";

const router = express.Router();

router.use(auth);

// POST /api/payments/stripe/create-session — create Stripe Hosted Checkout session
router.post("/stripe/create-session", createStripeSession);

// POST /api/payments/stripe/create-subscription-session — create Stripe session for plan subscription
router.post("/stripe/create-subscription-session", createStripeSubscriptionSession);

// POST /api/payments/stripe/confirm — called after Stripe redirects back; funds wallet + creates contract
router.post("/stripe/confirm", confirmStripePayment);

// POST /api/payments/wallet/pay — direct wallet or simulated PayPal payment + contract creation
router.post("/wallet/pay", payWithWallet);

// PROPOSAL PAYMENTS (Hiring Client Escrow)
router.post("/proposal/stripe/create-session", createStripeProposalSession);
router.post("/proposal/confirm", confirmStripeProposalPayment);
router.post("/proposal/pay", payProposalDirectly);

// TIMECARD PAYMENTS (Hourly Extra Releases)
router.post("/timecard/stripe/create-session", createStripeTimecardSession);
router.post("/timecard/confirm", confirmStripeTimecardPayment);
router.post("/timecard/pay", payTimecardDirectly);

// MILESTONE RELEASE & CONTRACT CANCELLATION/REFUNDS
router.post("/contract/milestone/:id/release", releaseMilestonePayment);
router.post("/contract/milestone/:id/submit", submitMilestoneWork);
router.post("/contract/milestone/:id/reject", rejectMilestoneWork);
router.post("/contract/:id/cancel", cancelContractAndRefund);
router.post("/contract/:id/start-work", startWorkContract);

// CONTRACT DISPUTES & MEDIATION INLINE WORKFLOWS
router.post("/contract/:id/dispute", openDispute);
router.post("/dispute/:id/respond", respondToDispute);
router.post("/dispute/:id/settle/propose", proposeSettlement);
router.post("/dispute/:id/settle/accept", acceptSettlement);
router.post("/dispute/:id/escalate", escalateDispute);

export default router;
