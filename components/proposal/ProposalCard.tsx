"use client";

import { formatCurrency, formatDate, getPublicProposalUrl } from "@/lib/utils";
import {
  FileText,
  Eye,
  PenLine,
  CreditCard,
  Copy,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Proposal = {
  id: string;
  title: string;
  client_name: string | null;
  client_email: string | null;
  status: string;
  payment_type: string | null;
  total_amount: number | null;
  created_at: string;
};

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  draft: {
    label: "Draft",
    color: "bg-gray-100 text-gray-700",
    icon: <FileText className="w-3.5 h-3.5" />,
  },
  sent: {
    label: "Sent",
    color: "bg-blue-100 text-blue-700",
    icon: <ExternalLink className="w-3.5 h-3.5" />,
  },
  viewed: {
    label: "Viewed",
    color: "bg-yellow-100 text-yellow-700",
    icon: <Eye className="w-3.5 h-3.5" />,
  },
  signed: {
    label: "Signed",
    color: "bg-purple-100 text-purple-700",
    icon: <PenLine className="w-3.5 h-3.5" />,
  },
  paid: {
    label: "Paid",
    color: "bg-green-100 text-green-700",
    icon: <CreditCard className="w-3.5 h-3.5" />,
  },
};

export function ProposalCard({ proposal }: { proposal: Proposal }) {
  const [copied, setCopied] = useState(false);
  const status = statusConfig[proposal.status] || statusConfig.draft;
  const publicUrl = getPublicProposalUrl(proposal.id);

  function copyLink() {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <Link
            href={`/proposals/${proposal.id}`}
            className="text-lg font-semibold text-gray-900 hover:text-primary transition-colors truncate block"
          >
            {proposal.title}
          </Link>
          {proposal.client_name && (
            <p className="text-sm text-gray-500 mt-1">
              {proposal.client_name}
              {proposal.client_email && ` · ${proposal.client_email}`}
            </p>
          )}
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}
        >
          {status.icon}
          {status.label}
        </span>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{formatDate(proposal.created_at)}</span>
          {proposal.total_amount && (
            <span className="font-medium text-gray-700">
              {formatCurrency(proposal.total_amount)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {proposal.status !== "draft" && (
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-gray-50"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? "Copied!" : "Copy Link"}
            </button>
          )}
          <Link
            href={`/proposals/${proposal.id}`}
            className="text-xs text-primary font-medium hover:underline"
          >
            {proposal.status === "draft" ? "Edit" : "View"} →
          </Link>
        </div>
      </div>
    </div>
  );
}
