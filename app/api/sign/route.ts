import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const { proposalId, signerName, signerEmail, signatureData } =
      await request.json();

    if (!proposalId || !signerName || !signerEmail || !signatureData) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Verify proposal exists and is in a signable state
    const { data: proposal } = await supabase
      .from("proposals")
      .select("id, status, title")
      .eq("id", proposalId)
      .single();

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    if (proposal.status === "signed" || proposal.status === "paid") {
      return NextResponse.json(
        { error: "Proposal has already been signed" },
        { status: 400 }
      );
    }

    // Get client IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Save signature
    const { error: sigError } = await supabase.from("signatures").insert({
      proposal_id: proposalId,
      signer_name: signerName,
      signer_email: signerEmail,
      signature_data: signatureData,
      ip_address: ip,
    });

    if (sigError) {
      console.error("Signature save error:", sigError);
      return NextResponse.json(
        { error: "Failed to save signature" },
        { status: 500 }
      );
    }

    // Update proposal status
    await supabase
      .from("proposals")
      .update({ status: "signed", updated_at: new Date().toISOString() })
      .eq("id", proposalId);

    // Log event
    await supabase.from("proposal_events").insert({
      proposal_id: proposalId,
      event_type: "signed",
      metadata: { signer_name: signerName, signer_email: signerEmail },
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
          eventType: "signed",
          signerName,
        }),
      });
    } catch {
      // Don't fail on notification errors
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sign error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
