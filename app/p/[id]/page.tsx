import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PublicProposalClient } from "./PublicProposalClient";
import type { Proposal, Signature, ProposalStructuredContent } from "@/lib/types";

export default async function PublicProposalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const { id } = await params;
  const { success } = await searchParams;
  const supabase = await createServiceClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .single();

  if (!proposal || (proposal as Proposal).status === "draft") {
    notFound();
  }

  const typedProposal = proposal as unknown as Proposal;

  // Extract total_amount from structured content if missing
  if (!typedProposal.total_amount && typedProposal.content?.type === "structured") {
    const structured = typedProposal.content.structured as any;
    console.log("Attempting to extract total_amount:", {
      hasInvestmentItems: !!structured?.investmentItems,
      investmentItems: structured?.investmentItems
    });
    if (structured?.investmentItems) {
      const totalItem = structured.investmentItems.find(
        (item: { item: string; amount: string }) => /total/i.test(item.item)
      );
      console.log("Found total item:", totalItem);
      if (totalItem) {
        const parsed = parseFloat(totalItem.amount.replace(/[^0-9.]/g, ""));
        if (!isNaN(parsed) && parsed > 0) {
          typedProposal.total_amount = Math.round(parsed * 100);
          console.log("Setting total_amount to:", typedProposal.total_amount);
          // Update in database
          await supabase
            .from("proposals")
            .update({ total_amount: typedProposal.total_amount })
            .eq("id", id);
        }
      }
    }
  }

  // Fetch existing signature
  const { data: signature } = await supabase
    .from("signatures")
    .select("*")
    .eq("proposal_id", id)
    .order("signed_at", { ascending: false })
    .limit(1)
    .single();

  // Fetch payments
  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("proposal_id", id)
    .eq("status", "succeeded");

  // Log view event (only if not already signed/paid and not returning from payment)
  if (!signature && !success) {
    await supabase.from("proposal_events").insert({
      proposal_id: id,
      event_type: "viewed",
      metadata: {},
    });

    // Update status to viewed if it's just "sent"
    if (typedProposal.status === "sent") {
      await supabase
        .from("proposals")
        .update({ status: "viewed" })
        .eq("id", id);
    }

    // Send view notification
    if (typedProposal.client_email || true) {
      // Always try to notify the proposal owner
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        await fetch(`${appUrl}/api/notify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proposalId: id,
            eventType: "viewed",
          }),
        });
      } catch {
        // Notification failure shouldn't block page load
      }
    }
  }

  const htmlContent =
    typeof typedProposal.content === "object" && typedProposal.content.html
      ? typedProposal.content.html
      : "";

  const structuredContent: ProposalStructuredContent | null =
    typedProposal.content?.type === "structured" && typedProposal.content.structured
      ? (typedProposal.content.structured as unknown as ProposalStructuredContent)
      : null;

  const typedSignature = signature as unknown as Signature | null;
  const isSigned = !!typedSignature;
  const isPaid = !!(payments && payments.length > 0);
  const showSuccess = success === "true" || (isSigned && isPaid);

  return (
    <PublicProposalClient
      proposal={typedProposal}
      htmlContent={htmlContent}
      structuredContent={structuredContent}
      isSigned={isSigned}
      isPaid={isPaid}
      showSuccess={showSuccess}
      signature={typedSignature}
    />
  );
}
