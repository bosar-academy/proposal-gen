import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  const supabase = await createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const proposalId = session.metadata?.proposal_id;

      if (!proposalId) break;

      // Update payment status
      await supabase
        .from("payments")
        .update({ status: "succeeded" })
        .eq("stripe_session_id", session.id);

      // If subscription, save subscription ID
      if (session.subscription) {
        await supabase
          .from("payments")
          .update({
            stripe_subscription_id: session.subscription as string,
            status: "succeeded",
          })
          .eq("stripe_session_id", session.id);
      }

      // Update proposal status to paid
      await supabase
        .from("proposals")
        .update({ status: "paid", updated_at: new Date().toISOString() })
        .eq("id", proposalId);

      // Log event
      await supabase.from("proposal_events").insert({
        proposal_id: proposalId,
        event_type: "paid",
        metadata: {
          amount: session.amount_total,
          payment_type: session.metadata?.payment_type,
          stripe_session_id: session.id,
        },
      });

      // Send notification
      try {
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        await fetch(`${appUrl}/api/notify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proposalId,
            eventType: "paid",
            amount: session.amount_total,
            paymentType: session.metadata?.payment_type,
          }),
        });
      } catch {
        // Don't fail on notification errors
      }

      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = (invoice as unknown as Record<string, unknown>).subscription as string | undefined;

      if (!subscriptionId) break;

      // Find the payment by subscription ID
      const { data: payment } = await supabase
        .from("payments")
        .select("proposal_id")
        .eq("stripe_subscription_id", subscriptionId)
        .limit(1)
        .single();

      if (payment) {
        await supabase.from("proposal_events").insert({
          proposal_id: payment.proposal_id,
          event_type: "paid",
          metadata: {
            amount: invoice.amount_paid,
            payment_type: "subscription_renewal",
            invoice_id: invoice.id,
          },
        });
      }

      break;
    }
  }

  return NextResponse.json({ received: true });
}
