import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  sendNotification,
  proposalViewedEmail,
  proposalSignedEmail,
  paymentReceivedEmail,
} from "@/lib/resend";
import { formatCurrency } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const { proposalId, eventType, signerName, amount, paymentType } =
      await request.json();

    if (!proposalId || !eventType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get proposal and owner details
    const { data: proposal } = await supabase
      .from("proposals")
      .select("title, user_id, client_name")
      .eq("id", proposalId)
      .single();

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    // Get the proposal owner's email
    const { data: userData } = await supabase.auth.admin.getUserById(
      proposal.user_id
    );

    const ownerEmail = userData?.user?.email;
    if (!ownerEmail) {
      return NextResponse.json(
        { error: "Owner email not found" },
        { status: 404 }
      );
    }

    let emailContent: { subject: string; html: string };

    switch (eventType) {
      case "viewed":
        emailContent = proposalViewedEmail(
          proposal.title,
          proposal.client_name || ""
        );
        break;
      case "signed":
        emailContent = proposalSignedEmail(
          proposal.title,
          signerName || "Someone"
        );
        break;
      case "paid":
        emailContent = paymentReceivedEmail(
          proposal.title,
          amount ? formatCurrency(amount) : "N/A",
          paymentType || "one-time"
        );
        break;
      default:
        return NextResponse.json(
          { error: "Unknown event type" },
          { status: 400 }
        );
    }

    await sendNotification({
      to: ownerEmail,
      ...emailContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
