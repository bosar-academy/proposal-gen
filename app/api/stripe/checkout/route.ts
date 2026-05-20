import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const { proposalId, amount, type, currency = "usd" } = await request.json();

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
    const keyPrefix = process.env.STRIPE_SECRET_KEY?.substring(0, 10) || "MISSING";
    console.log("Stripe key prefix:", keyPrefix, "Amount:", amount, "Type:", type);

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: proposal.title,
              description: type === "deposit"
                ? `Deposit for ${proposal.title}`
                : `Payment for ${proposal.title}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${appUrl}/p/${proposalId}?success=true`,
      cancel_url: `${appUrl}/p/${proposalId}`,
      customer_email: proposal.client_email || undefined,
      // Collect billing address and tax ID for invoicing
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      // Auto-generate invoice for every payment
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `${proposal.title}${proposal.client_name ? ` - ${proposal.client_name}` : ""}`,
          metadata: {
            proposal_id: proposalId,
            payment_type: type,
          },
        },
      },
      metadata: {
        proposal_id: proposalId,
        payment_type: type,
      },
    });

    // Save pending payment record
    await supabase.from("payments").insert({
      proposal_id: proposalId,
      stripe_session_id: session.id,
      amount,
      status: "pending",
      type,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Stripe checkout error:", message, error);
    return NextResponse.json(
      { error: `Failed to create checkout session: ${message}` },
      { status: 500 }
    );
  }
}
