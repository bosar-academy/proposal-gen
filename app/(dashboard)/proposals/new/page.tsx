"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Loader2,
  ArrowLeft,
  FileText,
  Phone,
  Plus,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

type Milestone = {
  name: string;
  amount: string;
};

const DESCRIPTION_STEPS = [
  "Analyzing your project brief...",
  "Identifying client pain points...",
  "Crafting tailored solutions...",
  "Building scope & process...",
  "Writing pricing rationale...",
  "Drafting legal terms...",
  "Finalizing proposal...",
];

const TRANSCRIPT_STEPS = [
  "Reading call transcript...",
  "Extracting client needs & goals...",
  "Identifying pain points & objections...",
  "Mapping project requirements...",
  "Crafting tailored solutions...",
  "Building scope & timeline...",
  "Writing pricing rationale...",
  "Drafting legal terms...",
  "Finalizing proposal...",
];

function GeneratingAnimation({ inputMode }: { inputMode: "description" | "transcript" }) {
  const steps = inputMode === "transcript" ? TRANSCRIPT_STEPS : DESCRIPTION_STEPS;
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    // Advance steps on a schedule — spread across ~50 seconds total
    const stepDuration = 50000 / steps.length;
    intervalRef.current = setInterval(() => {
      setActiveStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, stepDuration);

    return () => clearInterval(intervalRef.current);
  }, [steps.length]);

  useEffect(() => {
    // Smooth progress bar — goes to ~90% then slows down
    const tick = setInterval(() => {
      setProgress((prev) => {
        if (prev < 85) return prev + 0.5;
        if (prev < 95) return prev + 0.1;
        return prev;
      });
    }, 200);

    return () => clearInterval(tick);
  }, []);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <h2 className="text-xl font-semibold text-gray-900">
            Generating your proposal
          </h2>
        </div>

        {/* Steps */}
        <div className="space-y-3 mb-8">
          {steps.map((step, index) => {
            const isActive = index === activeStep;
            const isCompleted = index < activeStep;
            const isPending = index > activeStep;

            return (
              <div
                key={step}
                className={`flex items-center gap-3 transition-all duration-500 ${
                  isPending ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
                }`}
                style={{
                  transitionDelay: isPending ? "0ms" : `${index * 50}ms`,
                }}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4.5 h-4.5 text-green-500 shrink-0" />
                ) : isActive ? (
                  <Loader2 className="w-4.5 h-4.5 text-primary animate-spin shrink-0" />
                ) : (
                  <div className="w-4.5 h-4.5 shrink-0" />
                )}
                <span
                  className={`text-sm transition-colors duration-300 ${
                    isActive
                      ? "text-gray-900 font-medium"
                      : isCompleted
                        ? "text-gray-400"
                        : "text-gray-300"
                  }`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-gray-900 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-400 mt-3">
          This usually takes 10-15 seconds
        </p>
      </div>
    </div>
  );
}

export default function NewProposalPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [inputMode, setInputMode] = useState<"description" | "transcript">(
    "description"
  );
  const [description, setDescription] = useState("");
  const [transcript, setTranscript] = useState("");
  const [paymentType, setPaymentType] = useState("one_time");
  const [totalAmount, setTotalAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([
    { name: "Milestone 1", amount: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addMilestone() {
    setMilestones([
      ...milestones,
      { name: `Milestone ${milestones.length + 1}`, amount: "" },
    ]);
  }

  function removeMilestone(index: number) {
    if (milestones.length <= 1) return;
    setMilestones(milestones.filter((_, i) => i !== index));
  }

  function updateMilestone(
    index: number,
    field: keyof Milestone,
    value: string
  ) {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const milestonesData =
      paymentType === "deposit_milestone"
        ? milestones.map((m) => ({
            name: m.name,
            amount: m.amount ? Math.round(parseFloat(m.amount) * 100) : null,
          }))
        : null;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || undefined,
          clientName,
          clientEmail,
          inputMode,
          description: inputMode === "description" ? description : undefined,
          transcript: inputMode === "transcript" ? transcript : undefined,
          paymentType,
          totalAmount: totalAmount
            ? Math.round(parseFloat(totalAmount) * 100)
            : null,
          depositAmount: depositAmount
            ? Math.round(parseFloat(depositAmount) * 100)
            : null,
          milestones: milestonesData,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate proposal");
      }

      const { proposalId } = await res.json();
      router.push(`/proposals/${proposalId}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  if (loading) {
    return <GeneratingAnimation inputMode={inputMode} />;
  }

  const pricingHint =
    !totalAmount && !depositAmount
      ? " Leave blank and AI will suggest pricing based on market rates."
      : "";

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Create New Proposal
        </h1>
        <p className="text-gray-500 mt-1">
          Provide a project description or paste a call transcript and let AI do
          the rest.
        </p>
      </div>

      <form
        onSubmit={handleGenerate}
        className="bg-white rounded-xl border border-gray-200 p-6 space-y-6"
      >
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Input mode toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Input Source
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setInputMode("description")}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                inputMode === "description"
                  ? "border-primary bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <FileText
                className={`w-5 h-5 ${inputMode === "description" ? "text-primary" : "text-gray-400"}`}
              />
              <div>
                <p
                  className={`text-sm font-medium ${inputMode === "description" ? "text-primary" : "text-gray-700"}`}
                >
                  Project Description
                </p>
                <p className="text-xs text-gray-500">
                  Write a summary yourself
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setInputMode("transcript")}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                inputMode === "transcript"
                  ? "border-primary bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Phone
                className={`w-5 h-5 ${inputMode === "transcript" ? "text-primary" : "text-gray-400"}`}
              />
              <div>
                <p
                  className={`text-sm font-medium ${inputMode === "transcript" ? "text-primary" : "text-gray-700"}`}
                >
                  Call Transcript
                </p>
                <p className="text-xs text-gray-500">
                  Paste a sales call transcript
                </p>
              </div>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Proposal Title{" "}
            <span className="font-normal text-gray-400">(optional — AI will suggest one)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Leave blank to let AI suggest a title"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Client Name{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="AI will figure it out if left blank"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Client Email
            </label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="client@acme.com"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Description or Transcript */}
        {inputMode === "description" ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Project Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={6}
              placeholder="Describe the project in 1-2 paragraphs. Include the client's goals, key deliverables, timeline expectations, and any specific requirements. The more detail you provide, the better the proposal will be.

Example: We're building a complete website redesign for Acme Corp, a B2B SaaS company. They need a modern, conversion-focused marketing site with 10-15 pages including homepage, pricing, features, about, blog, and contact. Timeline is 8 weeks. Budget is around $25,000."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Call Transcript
            </label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              required
              rows={10}
              placeholder="Paste the full transcript of your sales/discovery call here. AI will analyze it to extract:

• Client name and company
• Pain points and goals
• Project scope and requirements
• Timeline expectations
• Budget discussions
• Technical requirements

The more complete the transcript, the better the proposal."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              AI will extract all project details, pain points, and requirements
              automatically.
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Payment Type
          </label>
          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white"
          >
            <option value="one_time">One-Time Payment</option>
            <option value="deposit_milestone">Deposit + Milestones</option>
            <option value="subscription">Monthly Subscription</option>
          </select>
        </div>

        {/* Pricing section */}
        {paymentType !== "deposit_milestone" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {paymentType === "subscription"
                ? "Monthly Amount ($)"
                : "Total Amount ($)"}
              <span className="font-normal text-gray-400">
                {" "}
                — optional.{pricingHint}
              </span>
            </label>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder={
                paymentType === "subscription"
                  ? "e.g., 2000.00"
                  : "e.g., 5000.00"
              }
              step="0.01"
              min="0"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
        )}

        {/* Deposit + Milestones */}
        {paymentType === "deposit_milestone" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Deposit Amount ($){" "}
                <span className="font-normal text-gray-400">
                  — optional. AI will suggest if left blank.
                </span>
              </label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="e.g., 2500.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Milestones{" "}
                  <span className="font-normal text-gray-400">
                    — optional. AI will suggest if left blank.
                  </span>
                </label>
                <button
                  type="button"
                  onClick={addMilestone}
                  className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:text-blue-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Milestone
                </button>
              </div>
              <div className="space-y-3">
                {milestones.map((milestone, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={milestone.name}
                      onChange={(e) =>
                        updateMilestone(index, "name", e.target.value)
                      }
                      placeholder={`Milestone ${index + 1} name`}
                      className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    />
                    <div className="relative w-36">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        $
                      </span>
                      <input
                        type="number"
                        value={milestone.amount}
                        onChange={(e) =>
                          updateMilestone(index, "amount", e.target.value)
                        }
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      />
                    </div>
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMilestone(index)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Total summary */}
            {(depositAmount ||
              milestones.some((m) => m.amount)) && (
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Deposit</span>
                  <span>
                    ${depositAmount ? parseFloat(depositAmount).toFixed(2) : "TBD"}
                  </span>
                </div>
                {milestones.map((m, i) => (
                  <div key={i} className="flex justify-between text-gray-600 mt-1">
                    <span>{m.name || `Milestone ${i + 1}`}</span>
                    <span>
                      ${m.amount ? parseFloat(m.amount).toFixed(2) : "TBD"}
                    </span>
                  </div>
                ))}
                <hr className="my-2 border-gray-200" />
                <div className="flex justify-between font-medium text-gray-900">
                  <span>Total</span>
                  <span>
                    $
                    {(
                      (depositAmount ? parseFloat(depositAmount) : 0) +
                      milestones.reduce(
                        (sum, m) =>
                          sum + (m.amount ? parseFloat(m.amount) : 0),
                        0
                      )
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Generate Proposal with AI
        </button>
      </form>
    </div>
  );
}
