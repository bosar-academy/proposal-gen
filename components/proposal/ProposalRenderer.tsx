"use client";

import type { ProposalStructuredContent } from "@/lib/types";

type Props = {
  content: ProposalStructuredContent;
  clientName: string | null;
  proposalDate: string;
};

export function ProposalRenderer({ content, clientName, proposalDate }: Props) {
  const date = new Date(proposalDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="proposal-styled">
      {/* Logo header */}
      {content.logoUrl && (
        <div className="mb-12">
          <img
            src={content.logoUrl}
            alt={content.providerCompany || "Company logo"}
            className="h-16 object-contain"
          />
        </div>
      )}

      {/* Opening */}
      <section className="mb-16">
        <p className="text-sm text-gray-400 uppercase tracking-widest mb-3">
          Prepared for {clientName || "Client"} &middot; {date}
        </p>
        <p className="text-lg text-gray-600 leading-relaxed max-w-2xl">
          {content.opening}
        </p>
      </section>

      {/* Problems */}
      <section className="mb-20">
        <h2 className="proposal-heading">
          <span className="font-black">YOUR</span> problem areas.
        </h2>
        <p className="text-gray-600 leading-relaxed mb-10 max-w-2xl">
          {content.problemContext}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {content.problems.map((p, i) => (
            <div key={i} className="border-t-2 border-gray-900 pt-5">
              <div className="text-3xl font-black text-gray-200 mb-2">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2 uppercase tracking-wide">
                {p.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-2">
                {p.description}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {p.consequence}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Solution */}
      <section className="mb-20">
        <h2 className="proposal-heading">
          <span className="font-black">YOUR</span> solution.
        </h2>
        <p className="text-gray-600 leading-relaxed mb-10 max-w-2xl">
          {content.solutionOverview}
        </p>
        <div className="space-y-6">
          {content.solutionComponents.map((c, i) => (
            <div
              key={i}
              className="border-l-2 border-gray-900 pl-6 py-1"
            >
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {c.name}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {c.description}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {c.benefit}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Us */}
      <section className="mb-20">
        <h2 className="proposal-heading">
          <span className="font-black">WHY</span> us?
        </h2>
        <p className="text-gray-600 leading-relaxed mb-10 max-w-2xl">
          {content.whyUsStatement}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {content.proofBlocks.map((b, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {b.headline}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {b.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Why That Matters */}
      <section className="mb-20">
        <h2 className="proposal-heading">
          <span className="font-black">WHY</span> that matters to you.
        </h2>
        <div className="space-y-4 mb-6">
          {content.whyMatters.map((m, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-900 mt-2 shrink-0" />
              <p className="text-gray-600 leading-relaxed">{m}</p>
            </div>
          ))}
        </div>
        <p className="text-gray-600 leading-relaxed font-medium">
          {content.whyMattersClosing}
        </p>
      </section>

      {/* Our Team */}
      <section className="mb-20">
        <h2 className="proposal-heading">
          <span className="font-black">OUR</span> team.
        </h2>

        {/* Team member photos */}
        {(content.teamMember1PhotoUrl || content.teamMember2PhotoUrl) && (
          <div className="flex gap-8 mb-10">
            {content.teamMember1PhotoUrl && (
              <div className="text-center">
                <img
                  src={content.teamMember1PhotoUrl}
                  alt={content.teamMember1Name || "Team member"}
                  className="w-28 h-28 rounded-full object-cover border-2 border-gray-100"
                />
                {content.teamMember1Name && (
                  <p className="mt-3 text-sm font-semibold text-gray-900">
                    {content.teamMember1Name}
                  </p>
                )}
              </div>
            )}
            {content.teamMember2PhotoUrl && (
              <div className="text-center">
                <img
                  src={content.teamMember2PhotoUrl}
                  alt={content.teamMember2Name || "Team member"}
                  className="w-28 h-28 rounded-full object-cover border-2 border-gray-100"
                />
                {content.teamMember2Name && (
                  <p className="mt-3 text-sm font-semibold text-gray-900">
                    {content.teamMember2Name}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Team story */}
        <div
          className="space-y-4 max-w-2xl text-gray-600 leading-relaxed [&>p]:mb-4"
          dangerouslySetInnerHTML={{ __html: content.teamStory }}
        />
      </section>

      {/* What Working With Us Looks Like */}
      <section className="mb-20">
        <h2 className="proposal-heading">
          <span className="font-black">WHAT</span> working with us<br />looks like.
        </h2>
        <div className="mt-10">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[60px_1fr_1fr_1fr] gap-4 bg-gray-900 text-white text-xs font-semibold uppercase tracking-widest px-6 py-4 rounded-t-lg">
            <div>Step</div>
            <div>What happens</div>
            <div>Description</div>
            <div>Why it matters</div>
          </div>
          {/* Table rows */}
          {content.timeline.map((t, i) => (
            <div
              key={i}
              className={`grid grid-cols-1 md:grid-cols-[60px_1fr_1fr_1fr] gap-4 px-6 py-5 ${
                i % 2 === 0 ? "bg-white" : "bg-gray-50"
              } ${i === content.timeline.length - 1 ? "rounded-b-lg" : ""} border-b border-gray-100`}
            >
              <div className="text-2xl font-black text-gray-200 md:text-gray-300">
                {t.step}
              </div>
              <div className="font-semibold text-gray-900 text-sm">
                {t.title}
              </div>
              <div className="text-sm text-gray-600 leading-relaxed">
                {t.description}
              </div>
              <div className="text-sm text-gray-500 leading-relaxed">
                {t.why}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Investment */}
      <section className="mb-20">
        <h2 className="proposal-heading">
          <span className="font-black">WHAT</span> you&apos;re investing.
        </h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-10 max-w-lg">
          {content.investmentItems.map((item, i) => (
            <div
              key={i}
              className={`flex items-center justify-between px-6 py-5 ${
                i < content.investmentItems.length - 1
                  ? "border-b border-gray-100"
                  : ""
              }`}
            >
              <span className="text-gray-600">{item.item}</span>
              <span className="text-2xl font-bold text-gray-900">
                {item.amount}
              </span>
            </div>
          ))}
        </div>
        <p className="text-gray-600 leading-relaxed mt-8 max-w-2xl">
          {content.investmentRoi}
        </p>
      </section>

      {/* Services Agreement */}
      <section className="mb-16">
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-8">
          Services Agreement
        </h2>
        <div
          className="proposal-agreement text-sm text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content.agreement }}
        />
      </section>

      {/* Execution / Signature Blocks */}
      <section className="mb-8">
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-8">
          Execution
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client signature - empty for client to sign */}
          <div className="border border-gray-200 rounded-lg p-6">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">
              Client
            </p>
            <div className="border-b border-gray-300 h-16 mb-3" />
            <p className="text-sm text-gray-400">Signature</p>
            <div className="border-b border-gray-300 h-8 mt-4 mb-3" />
            <p className="text-sm text-gray-400">Date</p>
          </div>

          {/* Service Provider signature - pre-filled from settings */}
          <div className="border border-gray-200 rounded-lg p-6">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">
              Service Provider
            </p>
            <p className="font-semibold text-gray-900 mb-1">
              {content.providerCompany || "Company"}
            </p>
            {content.providerSignerName && (
              <p className="text-sm text-gray-600">
                {content.providerSignerName}
                {content.providerSignerTitle && (
                  <span className="text-gray-400"> &middot; {content.providerSignerTitle}</span>
                )}
              </p>
            )}
            {content.providerSignatureData && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <img
                  src={content.providerSignatureData}
                  alt="Provider signature"
                  className="h-12 object-contain"
                />
              </div>
            )}
            <p className="text-sm text-gray-400 mt-3">
              {date}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
