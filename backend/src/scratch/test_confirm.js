import { confirmStripeProposalPayment } from "../controllers/paymentController.js";

const mockReq = {
  user: { user_id: 1 },
  body: { proposal_id: 1, amount_usd: 1000 },
  io: null
};

const mockRes = {
  status(code) {
    this.code = code;
    return this;
  },
  json(data) {
    console.log("RESPONSE CODE:", this.code);
    console.log("RESPONSE DATA:", data);
  }
};

async function test() {
  try {
    await confirmStripeProposalPayment(mockReq, mockRes);
  } catch (err) {
    console.error("TEST FATAL ERROR:", err);
  }
  process.exit(0);
}

test();
