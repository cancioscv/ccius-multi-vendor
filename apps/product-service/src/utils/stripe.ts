import Stripe from "stripe";

// TODO: move this to packages/libs?
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-01-28.clover",
});

export default stripe;
