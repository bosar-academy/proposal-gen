"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { StructuredProposalEditor } from "@/components/proposal/StructuredProposalEditor";
import {
  ArrowLeft,
  Send,
  Loader2,
  Check,
  Copy,
  Mail,
  X,
} from "lucide-react";
import Link from "next/link";
import { getPublicProposalUrl } from "@/lib/utils";
import type { Proposal, ProposalStructuredContent } from "@/lib/types";

export default function EditProposalPage() {
  const params = useParams();
  const supabase = createClient();
  const proposalId = params.id as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [structuredContent, setStructuredContent] = useState<ProposalStructuredContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [clientEmail, setClientEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState("");

  useEffect(() => {
    async function loadProposal() {
      const { data } = await supabase
        .from("proposals")
        .select("*")
        .eq("id", proposalId)
        .single();

      if (data) {
        const typed = data as unknown as Proposal;
        setProposal(typed);

        // Extract structured content
        if (typed.content?.type === "structured" && typed.content.structured) {
          setStructuredContent(typed.content.structured as unknown as ProposalStructuredContent);
        }
      }
      setLoading(false);
    }
    loadProposal();
  }, [proposalId]);

  const saveTimeoutRef = useCallback(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    return (fn: () => void) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(fn, 1000);
    };
  }, [])();

  const handleStructuredUpdate = useCallback(
    (updated: ProposalStructuredContent) => {
      setStructuredContent(updated);

      saveTimeoutRef(async () => {
        setSaving(true);
        setSaved(false);

        // Recalculate total and deposit from investmentItems
        let totalAmount: number | undefined;
        let depositAmount: number | undefined;

        if (updated.investmentItems?.length) {
          const totalItem = updated.investmentItems.find((i) => /total/i.test(i.item));
          let total = 0;
          if (totalItem) {
            total = parseFloat(totalItem.amount.replace(/[^0-9.]/g, ""));
          } else {
            for (const item of updated.investmentItems) {
              if (!/\/mo|month/i.test(item.amount)) {
                const val = parseFloat(item.amount.replace(/[^0-9.]/g, ""));
                if (!isNaN(val)) total += val;
              }
            }
          }
          if (total > 0) {
            totalAmount = Math.round(total * 100);
            // Always calculate deposit from first non-total item for milestone payments
            const firstItem = updated.investmentItems.find((i) => !/total/i.test(i.item));
            if (firstItem) {
              const dep = parseFloat(firstItem.amount.replace(/[^0-9.]/g, ""));
              if (!isNaN(dep) && dep > 0) {
                depositAmount = Math.round(dep * 100);
              }
            }
          }
        }

        await fetch("/api/update-proposal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proposalId,
            content: { type: "structured", structured: updated, html: "" },
            totalAmount,
            depositAmount,
          }),
        });

        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      });
    },
    [proposalId]
  );

  async function handlePublish() {
    setPublishing(true);
    await supabase
      .from("proposals")
      .update({ status: "sent", updated_at: new Date().toISOString() })
      .eq("id", proposalId);

    const url = getPublicProposalUrl(proposalId);
    await navigator.clipboard.writeText(url);
    setCopied(true);

    setProposal((prev) => (prev ? { ...prev, status: "sent" } : prev));
    setPublishing(false);
    setTimeout(() => setCopied(false), 3000);
  }

  async function handleSendProposal(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setSendError("");

    try {
      const res = await fetch("/api/send-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId,
          clientEmail,
          clientName: clientName || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send proposal");
      }

      setSendSuccess(true);
      setProposal((prev) => (prev ? { ...prev, status: "sent" } : prev));
      setTimeout(() => {
        setShowSendModal(false);
        setSendSuccess(false);
        setClientEmail("");
        setClientName("");
      }, 2000);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-gray-900">
          Proposal not found
        </h2>
        <Link href="/dashboard" className="text-primary hover:underline mt-2">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const isSent = proposal.status !== "draft";

  return (
    <div className="max-w-5xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/proposals/${proposalId}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-xl font-bold text-gray-900">
            {proposal.title}
          </h1>
          {saving && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving...
            </span>
          )}
          {saved && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <Check className="w-3 h-3" />
              Saved
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isSent && (
            <>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    getPublicProposalUrl(proposalId)
                  );
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <button
                onClick={() => setShowSendModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Send to Client
              </button>
            </>
          )}
          {!isSent && (
            <>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {publishing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {copied ? "Link Copied!" : "Publish & Copy Link"}
              </button>
              <button
                onClick={() => setShowSendModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Send to Client
              </button>
            </>
          )}
        </div>
      </div>

      {/* Editor */}
      {structuredContent ? (
        <StructuredProposalEditor
          content={structuredContent}
          onUpdate={handleStructuredUpdate}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          <p>This proposal does not have structured content and cannot be edited with the section editor.</p>
          <p className="text-sm mt-2">Try generating a new proposal.</p>
        </div>
      )}

      {/* Send to Client Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Send Proposal to Client
              </h3>
              <button
                onClick={() => {
                  setShowSendModal(false);
                  setSendError("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendProposal} className="space-y-4">
              {sendError && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {sendError}
                </div>
              )}

              {sendSuccess && (
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Proposal sent successfully!
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Client Email *
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  required
                  placeholder="client@example.com"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Client Name (Optional)
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSendModal(false);
                    setSendError("");
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending || sendSuccess}
                  className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Send Proposal
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
