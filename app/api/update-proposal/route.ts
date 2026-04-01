import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const body = await request.json();
    const { proposalId, content, totalAmount, depositAmount } = body;

    console.log("update-proposal called:", {
      proposalId,
      totalAmount,
      depositAmount,
      hasContent: !!content,
    });

    if (!proposalId) {
      return NextResponse.json({ error: "Proposal ID is required" }, { status: 400 });
    }

    const updateFields: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (content !== undefined) {
      updateFields.content = content;
    }
    // Always set these when provided, even if 0
    if (totalAmount !== null && totalAmount !== undefined) {
      updateFields.total_amount = totalAmount;
    }
    if (depositAmount !== null && depositAmount !== undefined) {
      updateFields.deposit_amount = depositAmount;
    }

    console.log("Updating fields:", Object.keys(updateFields));

    const { error } = await supabase
      .from("proposals")
      .update(updateFields)
      .eq("id", proposalId);

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json({ error: "Failed to update proposal" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update proposal error:", error);
    return NextResponse.json({ error: "Failed to update proposal" }, { status: 500 });
  }
}
