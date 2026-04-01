"use client";

import { useCallback } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type {
  ProposalStructuredContent,
  ProblemItem,
  SolutionComponent,
  ProofBlock,
  TimelineStep,
  InvestmentItem,
} from "@/lib/types";

type Props = {
  content: ProposalStructuredContent;
  onUpdate: (content: ProposalStructuredContent) => void;
};

// Debounced text input that looks like inline editing
function InlineInput({
  value,
  onChange,
  className = "",
  multiline = false,
  placeholder = "",
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
}) {
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className={`w-full bg-transparent border-0 border-b border-transparent hover:border-gray-200 focus:border-primary focus:ring-0 focus:outline-none resize-none px-0 py-1 transition-colors ${className}`}
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-transparent border-0 border-b border-transparent hover:border-gray-200 focus:border-primary focus:ring-0 focus:outline-none px-0 py-1 transition-colors ${className}`}
    />
  );
}

// Rich text input for HTML fields (agreement, teamStory)
function HtmlInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (val: string) => void;
  label: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={8}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-y font-mono"
      />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
      {children}
    </div>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all"
      title="Remove"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary transition-colors mt-2"
    >
      <Plus className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

export function StructuredProposalEditor({ content, onUpdate }: Props) {
  const update = useCallback(
    (partial: Partial<ProposalStructuredContent>) => {
      onUpdate({ ...content, ...partial });
    },
    [content, onUpdate]
  );

  // Array field helpers
  function updateArrayItem<T>(arr: T[], index: number, item: T): T[] {
    return arr.map((existing, i) => (i === index ? item : existing));
  }

  function removeArrayItem<T>(arr: T[], index: number): T[] {
    return arr.filter((_, i) => i !== index);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">

      {/* Opening */}
      <div className="p-6">
        <SectionLabel>Opening</SectionLabel>
        <InlineInput
          value={content.opening}
          onChange={(v) => update({ opening: v })}
          multiline
          placeholder="Opening statement..."
          className="text-lg text-gray-600 leading-relaxed"
        />
      </div>

      {/* Problem Context + Problems */}
      <div className="p-6">
        <SectionLabel>Problem Areas</SectionLabel>
        <InlineInput
          value={content.problemContext}
          onChange={(v) => update({ problemContext: v })}
          multiline
          placeholder="Context about the client's current situation..."
          className="text-gray-600 leading-relaxed mb-6"
        />
        <div className="space-y-4">
          {content.problems.map((p, i) => (
            <div key={i} className="group border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors">
              <div className="flex items-start gap-2">
                <span className="text-2xl font-black text-gray-200 mt-1 shrink-0 w-8">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 space-y-1">
                  <InlineInput
                    value={p.title}
                    onChange={(v) =>
                      update({ problems: updateArrayItem(content.problems, i, { ...p, title: v }) })
                    }
                    placeholder="Problem title"
                    className="font-semibold text-gray-900 uppercase tracking-wide text-sm"
                  />
                  <InlineInput
                    value={p.description}
                    onChange={(v) =>
                      update({ problems: updateArrayItem(content.problems, i, { ...p, description: v }) })
                    }
                    multiline
                    placeholder="Description of the problem..."
                    className="text-sm text-gray-600"
                  />
                  <InlineInput
                    value={p.consequence}
                    onChange={(v) =>
                      update({ problems: updateArrayItem(content.problems, i, { ...p, consequence: v }) })
                    }
                    placeholder="Quantified consequence..."
                    className="text-sm font-medium text-gray-900"
                  />
                </div>
                <RemoveButton onClick={() => update({ problems: removeArrayItem(content.problems, i) })} />
              </div>
            </div>
          ))}
        </div>
        <AddButton
          label="Add problem"
          onClick={() =>
            update({
              problems: [...content.problems, { title: "", description: "", consequence: "" }],
            })
          }
        />
      </div>

      {/* Solution */}
      <div className="p-6">
        <SectionLabel>Solution</SectionLabel>
        <InlineInput
          value={content.solutionOverview}
          onChange={(v) => update({ solutionOverview: v })}
          multiline
          placeholder="Solution overview..."
          className="text-gray-600 leading-relaxed mb-6"
        />
        <div className="space-y-3">
          {content.solutionComponents.map((c, i) => (
            <div key={i} className="group border-l-2 border-gray-200 hover:border-gray-900 pl-4 py-1 transition-colors">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-1">
                  <InlineInput
                    value={c.name}
                    onChange={(v) =>
                      update({ solutionComponents: updateArrayItem(content.solutionComponents, i, { ...c, name: v }) })
                    }
                    placeholder="Component name"
                    className="font-semibold text-gray-900 text-sm"
                  />
                  <InlineInput
                    value={c.description}
                    onChange={(v) =>
                      update({ solutionComponents: updateArrayItem(content.solutionComponents, i, { ...c, description: v }) })
                    }
                    placeholder="What it does..."
                    className="text-sm text-gray-600"
                  />
                  <InlineInput
                    value={c.benefit}
                    onChange={(v) =>
                      update({ solutionComponents: updateArrayItem(content.solutionComponents, i, { ...c, benefit: v }) })
                    }
                    placeholder="Measurable benefit..."
                    className="text-sm text-gray-500"
                  />
                </div>
                <RemoveButton onClick={() => update({ solutionComponents: removeArrayItem(content.solutionComponents, i) })} />
              </div>
            </div>
          ))}
        </div>
        <AddButton
          label="Add component"
          onClick={() =>
            update({
              solutionComponents: [...content.solutionComponents, { name: "", description: "", benefit: "" }],
            })
          }
        />
      </div>

      {/* Why Us */}
      <div className="p-6">
        <SectionLabel>Why Us</SectionLabel>
        <InlineInput
          value={content.whyUsStatement}
          onChange={(v) => update({ whyUsStatement: v })}
          multiline
          placeholder="Authority statement..."
          className="text-gray-600 leading-relaxed mb-6"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {content.proofBlocks.map((b, i) => (
            <div key={i} className="group bg-gray-50 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-1">
                  <InlineInput
                    value={b.headline}
                    onChange={(v) =>
                      update({ proofBlocks: updateArrayItem(content.proofBlocks, i, { ...b, headline: v }) })
                    }
                    placeholder="Proof headline"
                    className="font-bold text-gray-900"
                  />
                  <InlineInput
                    value={b.description}
                    onChange={(v) =>
                      update({ proofBlocks: updateArrayItem(content.proofBlocks, i, { ...b, description: v }) })
                    }
                    multiline
                    placeholder="Proof description..."
                    className="text-sm text-gray-600"
                  />
                </div>
                <RemoveButton onClick={() => update({ proofBlocks: removeArrayItem(content.proofBlocks, i) })} />
              </div>
            </div>
          ))}
        </div>
        <AddButton
          label="Add proof block"
          onClick={() =>
            update({ proofBlocks: [...content.proofBlocks, { headline: "", description: "" }] })
          }
        />
      </div>

      {/* Why That Matters */}
      <div className="p-6">
        <SectionLabel>Why That Matters</SectionLabel>
        <div className="space-y-2">
          {content.whyMatters.map((m, i) => (
            <div key={i} className="group flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
              <InlineInput
                value={m}
                onChange={(v) => {
                  const updated = [...content.whyMatters];
                  updated[i] = v;
                  update({ whyMatters: updated });
                }}
                placeholder="Benefit statement..."
                className="text-gray-600"
              />
              <RemoveButton
                onClick={() => update({ whyMatters: content.whyMatters.filter((_, j) => j !== i) })}
              />
            </div>
          ))}
        </div>
        <AddButton
          label="Add point"
          onClick={() => update({ whyMatters: [...content.whyMatters, ""] })}
        />
        <div className="mt-4">
          <InlineInput
            value={content.whyMattersClosing}
            onChange={(v) => update({ whyMattersClosing: v })}
            placeholder="Closing reinforcement..."
            className="text-gray-600 font-medium"
          />
        </div>
      </div>

      {/* Team Story */}
      <div className="p-6">
        <SectionLabel>Our Team</SectionLabel>
        <HtmlInput
          value={content.teamStory}
          onChange={(v) => update({ teamStory: v })}
          label="Team story (HTML)"
        />
      </div>

      {/* Timeline */}
      <div className="p-6">
        <SectionLabel>Timeline</SectionLabel>
        <div className="space-y-3">
          {content.timeline.map((t, i) => (
            <div key={i} className="group grid grid-cols-[50px_1fr_1fr_1fr] gap-3 items-start border border-gray-100 rounded-lg p-3 hover:border-gray-200 transition-colors">
              <InlineInput
                value={t.step}
                onChange={(v) =>
                  update({ timeline: updateArrayItem(content.timeline, i, { ...t, step: v }) })
                }
                placeholder="01"
                className="text-xl font-black text-gray-300 text-center"
              />
              <InlineInput
                value={t.title}
                onChange={(v) =>
                  update({ timeline: updateArrayItem(content.timeline, i, { ...t, title: v }) })
                }
                placeholder="Step title"
                className="font-semibold text-gray-900 text-sm"
              />
              <InlineInput
                value={t.description}
                onChange={(v) =>
                  update({ timeline: updateArrayItem(content.timeline, i, { ...t, description: v }) })
                }
                placeholder="Description..."
                className="text-sm text-gray-600"
              />
              <div className="flex items-start gap-1">
                <InlineInput
                  value={t.why}
                  onChange={(v) =>
                    update({ timeline: updateArrayItem(content.timeline, i, { ...t, why: v }) })
                  }
                  placeholder="Why it matters..."
                  className="text-sm text-gray-500"
                />
                <RemoveButton onClick={() => update({ timeline: removeArrayItem(content.timeline, i) })} />
              </div>
            </div>
          ))}
        </div>
        <AddButton
          label="Add step"
          onClick={() =>
            update({
              timeline: [
                ...content.timeline,
                { step: String(content.timeline.length + 1).padStart(2, "0"), title: "", description: "", why: "" },
              ],
            })
          }
        />
      </div>

      {/* Investment */}
      <div className="p-6">
        <SectionLabel>Investment</SectionLabel>
        <div className="space-y-3">
          {content.investmentItems.map((item, i) => (
            <div key={i} className="group border border-gray-100 rounded-lg px-4 py-3 hover:border-gray-200 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <InlineInput
                    value={item.item}
                    onChange={(v) =>
                      update({ investmentItems: updateArrayItem(content.investmentItems, i, { ...item, item: v }) })
                    }
                    placeholder="Line item description"
                    className="text-gray-900 font-medium text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <InlineInput
                    value={item.amount}
                    onChange={(v) =>
                      update({ investmentItems: updateArrayItem(content.investmentItems, i, { ...item, amount: v }) })
                    }
                    placeholder="$X,XXX"
                    className="text-xl font-bold text-gray-900 w-36 text-right"
                  />
                  <RemoveButton onClick={() => update({ investmentItems: removeArrayItem(content.investmentItems, i) })} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <AddButton
          label="Add line item"
          onClick={() =>
            update({ investmentItems: [...content.investmentItems, { item: "", amount: "" }] })
          }
        />
        <div className="mt-6">
          <InlineInput
            value={content.investmentRoi}
            onChange={(v) => update({ investmentRoi: v })}
            multiline
            placeholder="ROI framing..."
            className="text-gray-600 leading-relaxed"
          />
        </div>
      </div>

      {/* Agreement - static, not editable */}
      <div className="p-6">
        <SectionLabel>Services Agreement</SectionLabel>
        <p className="text-sm text-gray-400">
          Universal services agreement is applied automatically to all proposals.
        </p>
      </div>
    </div>
  );
}
