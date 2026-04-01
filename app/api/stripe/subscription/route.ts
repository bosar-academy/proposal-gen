import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const { proposalId, amount, currency = "usd" } = await request.json();

    if (!proposalId || !amount) {
      return NextResponse.json(
        { error: "Proposal ID and amount are required" },
        { status: 400 }
      );
    }

    // Get proposal details
    const { data: proposal } = await supabase
      .from("proposals")
      .select("title, client_name, client_email")
      .eq("id", proposalId)
      .single();

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create a price for the subscription
    const price = await stripe.prices.create({
      currency,
      unit_amount: amount,
      recurring: { interval: "month" },
      product_data: {
        name: `${proposal.title} — Monthly`,
      },
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${appUrl}/p/${proposalId}?success=true`,
      cancel_url: `${appUrl}/p/${proposalId}`,
      customer_email: proposal.client_email || undefined,
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      metadata: {
        proposal_id: proposalId,
        payment_type: "subscription",
      },
      subscription_data: {
        metadata: {
          proposal_id: proposalId,
        },
      },
    });

    // Save pending payment record
    await supabase.from("payments").insert({
      proposal_id: proposalId,
      stripe_session_id: session.id,
      amount,
      status: "pending",
      type: "subscription",
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe subscription error:", error);
    return NextResponse.json(
      { error: "Failed to create subscription session" },
      { status: 500 }
    );
  }
}
