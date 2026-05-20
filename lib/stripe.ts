import Stripe from "stripe";

let _stripe: Stripe;
export function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      maxNetworkRetries: 3,
      timeout: 30000,
    });
  }
  return _stripe;
}
