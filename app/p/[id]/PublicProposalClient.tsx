"use client";

import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SignaturePanel } from "@/components/proposal/SignaturePanel";
import { SuccessAnimation } from "@/components/proposal/SuccessAnimation";
import { ProposalRenderer } from "@/components/proposal/ProposalRenderer";
import { CheckCircle, CreditCard, Loader2 } from "lucide-react";
import type { Proposal, Signature, ProposalStructuredContent } from "@/lib/types";

type PublicProposalClientProps = {
  proposal: Proposal;
  htmlContent: string;
  structuredContent: ProposalStructuredContent | null;
  isSigned: boolean;
  isPaid: boolean;
  showSuccess: boolean;
  signature: Signature | null;
};

export function PublicProposalClient({
  proposal,
  htmlContent,
  structuredContent,
  isSigned: initialSigned,
  isPaid,
  showSuccess: initialSuccess,
  signature,
}: PublicProposalClientProps) {
  const [isSigned, setIsSigned] = useState(initialSigned);
  const [showSuccess, setShowSuccess] = useState(initialSuccess);

  function handleComplete() {
    setIsSigned(true);
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <SuccessAnimation />
          <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {proposal.title}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Signed{isPaid ? " and paid" : ""} on{" "}
              {formatDate(new Date().toISOString())}
            </p>
          </div>

          {/* Kickoff Call CTA */}
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-8 text-center">
            <h4 className="text-xl font-bold text-gray-900 mb-2">
              🎉 Let&apos;s get started!
            </h4>
            <p className="text-gray-600 mb-6">
              Schedule your kickoff call to begin your project.
            </p>
            <a
              href="https://calendly.com/your-calendly-link"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Schedule Kickoff Call
            </a>
          </div>
        </div>
      </div>
    );
  }

  const hasPayment = !!proposal.total_amount && !isPaid;

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-16">
        {/* Proposal Title */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
            {proposal.title}
          </h1>
        </div>

        {/* Proposal Content — white paper */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-8 sm:p-12 lg:p-16 mb-8">
          {structuredContent ? (
            <ProposalRenderer
              content={structuredContent}
              clientName={proposal.client_name}
              proposalDate={proposal.created_at}
            />
          ) : (
            <div
              className="proposal-content"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          )}

          {/* Investment/Amount Summary (only for non-structured fallback) */}
          {!structuredContent && proposal.total_amount && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="bg-gray-50 rounded-lg p-5">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">
                    {proposal.payment_type === "subscription"
                      ? "Monthly Investment"
                      : "Total Investment"}
                  </span>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency(proposal.total_amount)}
                    {proposal.payment_type === "subscription" && (
                      <span className="text-sm font-normal text-gray-500">
                        /month
                      </span>
                    )}
                  </span>
                </div>
                {proposal.payment_type === "deposit_milestone" &&
                  proposal.deposit_amount && (
                    <div className="mt-2 text-sm text-gray-500">
                      Deposit: {formatCurrency(proposal.deposit_amount)}{" "}
                      &middot; Balance:{" "}
                      {formatCurrency(
                        proposal.total_amount - proposal.deposit_amount
                      )}
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>

        {/* Sign & Pay (combined) or Signed confirmation */}
        {!isSigned ? (
          <div className="mb-8">
            <SignaturePanel
              proposalId={proposal.id}
              hasPayment={hasPayment}
              paymentType={proposal.payment_type || undefined}
              totalAmount={proposal.total_amount || undefined}
              depositAmount={proposal.deposit_amount}
              currency={proposal.currency || "usd"}
              onComplete={handleComplete}
            />
          </div>
        ) : (
          <SignedConfirmation
            proposal={proposal}
            signature={signature}
            isPaid={isPaid}
          />
        )}
      </div>
    </div>
  );
}

function SignedConfirmation({
  proposal,
  signature,
  isPaid,
}: {
  proposal: Proposal;
  signature: Signature | null;
  isPaid: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const needsPayment = !!proposal.total_amount && !isPaid;

  async function handlePayNow() {
    setLoading(true);
    setError("");

    try {
      const payAmount =
        proposal.payment_type === "deposit_milestone" && proposal.deposit_amount
          ? proposal.deposit_amount
          : proposal.total_amount || 0;
      const payType =
        proposal.payment_type === "deposit_milestone"
          ? "deposit"
          : proposal.payment_type === "subscription"
            ? "subscription"
            : "one_time";

      const endpoint =
        proposal.payment_type === "subscription"
          ? "/api/stripe/subscription"
          : "/api/stripe/checkout";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: proposal.id,
          amount: payAmount,
          type: payType,
          currency: proposal.currency || "usd",
        }),
      });

      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
        return;
      }

      const data = await res.json();
      throw new Error(data.error || "Failed to create checkout session");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="mb-8 bg-white rounded-xl border border-green-200 p-6">
      <div className="flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold text-green-800">
          This proposal has been signed.
        </h3>
      </div>
      {signature && (
        <div className="flex items-center gap-4 mt-4">
          <img
            src={signature.signature_data}
            alt="Signature"
            className="h-12 border border-gray-200 rounded-md p-1"
          />
          <div className="text-sm text-gray-500">
            <p>
              Signed by <strong>{signature.signer_name}</strong>
            </p>
            <p>{formatDate(signature.signed_at)}</p>
          </div>
        </div>
      )}
      {needsPayment && (
        <div className="mt-6 pt-5 border-t border-gray-200">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}
          <p className="text-sm text-gray-600 mb-4">
            Complete your payment to finalize the agreement.
          </p>
          <button
            onClick={handlePayNow}
            disabled={loading}
            className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting to payment...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Pay{" "}
                {formatCurrency(
                  proposal.payment_type === "deposit_milestone" &&
                    proposal.deposit_amount
                    ? proposal.deposit_amount
                    : proposal.total_amount!,
                  proposal.currency || "usd"
                )}
              </>
            )}
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">
            You&apos;ll be redirected to Stripe for secure payment.
          </p>
        </div>
      )}
    </div>
  );
}
