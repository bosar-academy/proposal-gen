import { createServiceClient } from "@/lib/supabase/server";
import { ProposalCard } from "@/components/proposal/ProposalCard";
import { Plus, FileText } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createServiceClient();

  const { data: proposals } = await supabase
    .from("proposals")
    .select(
      "id, title, client_name, client_email, status, payment_type, total_amount, created_at"
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
          <p className="text-gray-500 mt-1">
            {proposals?.length
              ? `${proposals.length} proposal${proposals.length !== 1 ? "s" : ""}`
              : "No proposals yet"}
          </p>
        </div>
        <Link
          href="/proposals/new"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Proposal
        </Link>
      </div>

      {proposals && proposals.length > 0 ? (
        <div className="grid gap-4">
          {proposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No proposals yet
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Create your first AI-powered proposal and send it to a client in
            minutes.
          </p>
          <Link
            href="/proposals/new"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Your First Proposal
          </Link>
        </div>
      )}
    </div>
  );
}
