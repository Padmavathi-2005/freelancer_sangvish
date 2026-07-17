import express from "express";
import auth, { checkApprovedClient } from "../middleware/auth.js";
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
  freelancerCancelContractAndRefund,
  startWorkContract,
  createStripeTimecardSession,
  confirmStripeTimecardPayment,
  payTimecardDirectly,
  acceptRevisionRequest,
  fundExtraRevision,
  rejectRevisionProposal,
  fundMilestone,
  createStripeMilestoneSession,
  confirmStripeMilestonePayment,
  requestMilestoneFunding
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
router.post("/stripe/create-session", checkApprovedClient, createStripeSession);

// POST /api/payments/stripe/create-subscription-session — create Stripe session for plan subscription
router.post("/stripe/create-subscription-session", createStripeSubscriptionSession);

// POST /api/payments/stripe/confirm — called after Stripe redirects back; funds wallet + creates contract
router.post("/stripe/confirm", checkApprovedClient, confirmStripePayment);

// POST /api/payments/wallet/pay — direct wallet or simulated PayPal payment + contract creation
router.post("/wallet/pay", checkApprovedClient, payWithWallet);

// PROPOSAL PAYMENTS (Hiring Client Escrow)
router.post("/proposal/stripe/create-session", checkApprovedClient, createStripeProposalSession);
router.post("/proposal/confirm", checkApprovedClient, confirmStripeProposalPayment);
router.post("/proposal/pay", checkApprovedClient, payProposalDirectly);

// TIMECARD PAYMENTS (Hourly Extra Releases)
router.post("/timecard/stripe/create-session", checkApprovedClient, createStripeTimecardSession);
router.post("/timecard/confirm", checkApprovedClient, confirmStripeTimecardPayment);
router.post("/timecard/pay", checkApprovedClient, payTimecardDirectly);

// MILESTONE RELEASE & CONTRACT CANCELLATION/REFUNDS
router.post("/contract/milestone/:id/release", checkApprovedClient, releaseMilestonePayment);
router.post("/contract/milestone/:id/submit", submitMilestoneWork);
router.post("/contract/milestone/:id/reject", checkApprovedClient, rejectMilestoneWork);
router.post("/contract/milestone/:id/accept-revision", acceptRevisionRequest);
router.post("/contract/milestone/:id/fund-revision", checkApprovedClient, fundExtraRevision);
router.post("/contract/milestone/:id/reject-revision-proposal", checkApprovedClient, rejectRevisionProposal);
router.post("/contract/milestone/:id/fund", checkApprovedClient, fundMilestone);
router.post("/contract/milestone/:id/request-funding", requestMilestoneFunding);
router.post("/contract/milestone/stripe/create-session", checkApprovedClient, createStripeMilestoneSession);
router.post("/contract/milestone/stripe/confirm", checkApprovedClient, confirmStripeMilestonePayment);
router.post("/contract/:id/cancel", checkApprovedClient, cancelContractAndRefund);
router.post("/contract/:id/freelancer-cancel", freelancerCancelContractAndRefund);
router.post("/contract/:id/start-work", startWorkContract);

// CONTRACT DISPUTES & MEDIATION INLINE WORKFLOWS
router.post("/contract/:id/dispute", openDispute);
router.post("/dispute/:id/respond", respondToDispute);
router.post("/dispute/:id/settle/propose", proposeSettlement);
router.post("/dispute/:id/settle/accept", acceptSettlement);
router.post("/dispute/:id/escalate", escalateDispute);

export default router;
