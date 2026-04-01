import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
  formatCurrency,
  formatDate,
  getPublicProposalUrl,
} from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Edit, Copy, ExternalLink } from "lucide-react";
import { CopyLinkButton } from "@/components/proposal/CopyLinkButton";

export default async function ProposalViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServiceClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .single();

  if (!proposal) notFound();

  const publicUrl = getPublicProposalUrl(proposal.id);
  const htmlContent =
    typeof proposal.content === "object" && proposal.content.html
      ? proposal.content.html
      : "";

  // Fetch signature if exists
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
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {proposal.title}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              {proposal.client_name && <span>{proposal.client_name}</span>}
              <span>{formatDate(proposal.created_at)}</span>
              {proposal.total_amount && (
                <span className="font-medium text-gray-700">
                  {formatCurrency(proposal.total_amount)}
                </span>
              )}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  proposal.status === "paid"
                    ? "bg-green-100 text-green-700"
                    : proposal.status === "signed"
                      ? "bg-purple-100 text-purple-700"
                      : proposal.status === "viewed"
                        ? "bg-yellow-100 text-yellow-700"
                        : proposal.status === "sent"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                }`}
              >
                {proposal.status.charAt(0).toUpperCase() +
                  proposal.status.slice(1)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/proposals/${proposal.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
            <CopyLinkButton url={publicUrl} />
          </div>
        </div>
      </div>

      {/* Proposal Content Preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
        <div
          className="proposal-content"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>

      {/* Signature Info */}
      {signature && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Signature
          </h3>
          <div className="flex items-center gap-4">
            <img
              src={signature.signature_data}
              alt="Signature"
              className="h-16 border border-gray-200 rounded-md p-2"
            />
            <div className="text-sm text-gray-500">
              <p>
                Signed by <strong>{signature.signer_name}</strong>
              </p>
              <p>{signature.signer_email}</p>
              <p>{formatDate(signature.signed_at)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Info */}
      {payments && payments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Payments
          </h3>
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between text-sm border-b border-gray-100 pb-3 last:border-0"
              >
                <div>
                  <span className="font-medium text-gray-700">
                    {formatCurrency(payment.amount)}
                  </span>
                  <span className="text-gray-500 ml-2">
                    ({payment.type.replace("_", " ")})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      payment.status === "succeeded"
                        ? "bg-green-100 text-green-700"
                        : payment.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {payment.status}
                  </span>
                  <span className="text-gray-400">
                    {formatDate(payment.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
