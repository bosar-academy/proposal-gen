"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import SignatureCanvas from "react-signature-canvas";
import { PenLine, Type, RotateCcw, Loader2, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type SignaturePanelProps = {
  proposalId: string;
  hasPayment: boolean;
  paymentType?: string;
  totalAmount?: number;
  depositAmount?: number | null;
  currency?: string;
  onComplete: () => void;
};

export function SignaturePanel({
  proposalId,
  hasPayment,
  paymentType,
  totalAmount,
  depositAmount,
  currency = "usd",
  onComplete,
}: SignaturePanelProps) {
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState("");
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(500);

  // Resize canvas to match container width — fixes cursor offset
  const updateCanvasWidth = useCallback(() => {
    if (containerRef.current) {
      const width = containerRef.current.offsetWidth - 2;
      setCanvasWidth(width);
    }
  }, []);

  useEffect(() => {
    updateCanvasWidth();
    window.addEventListener("resize", updateCanvasWidth);
    return () => window.removeEventListener("resize", updateCanvasWidth);
  }, [updateCanvasWidth]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    let signatureData: string;

    if (mode === "draw") {
      if (!canvasRef.current || canvasRef.current.isEmpty()) {
        setError("Please draw your signature");
        setLoading(false);
        return;
      }
      signatureData = canvasRef.current.toDataURL("image/png");
    } else {
      if (!typedName.trim()) {
        setError("Please type your name");
        setLoading(false);
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 100;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, 400, 100);
      ctx.font = "italic 36px Georgia, serif";
      ctx.fillStyle = "#1a1a2e";
      ctx.textBaseline = "middle";
      ctx.fillText(typedName, 20, 50);
      signatureData = canvas.toDataURL("image/png");
    }

    try {
      // Save signature
      const res = await fetch("/api/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId,
          signerName: signerName || typedName,
          signerEmail,
          signatureData,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save signature");
      }

      // Redirect to Stripe checkout after signing
      const payAmount =
        paymentType === "deposit_milestone" && depositAmount
          ? depositAmount
          : totalAmount;

      if (payAmount) {
        const payType =
          paymentType === "deposit_milestone"
            ? "deposit"
            : paymentType === "subscription"
              ? "subscription"
              : "one_time";

        const endpoint =
          paymentType === "subscription"
            ? "/api/stripe/subscription"
            : "/api/stripe/checkout";

        const payRes = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proposalId,
            amount: payAmount,
            type: payType,
            currency,
          }),
        });

        if (!payRes.ok) {
          const data = await payRes.json();
          throw new Error(data.error || "Failed to create payment session");
        }

        const { url } = await payRes.json();
        window.location.href = url;
        return;
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  const buttonLabel = "Sign and Pay";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        Sign this proposal
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        By signing, you agree to the terms outlined in this proposal.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Your Name
            </label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              required
              placeholder="John Smith"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Your Email
            </label>
            <input
              type="email"
              value={signerEmail}
              onChange={(e) => setSignerEmail(e.target.value)}
              required
              placeholder="john@example.com"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Signature mode toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Signature
          </label>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setMode("draw")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                mode === "draw"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <PenLine className="w-3.5 h-3.5" />
              Draw
            </button>
            <button
              type="button"
              onClick={() => setMode("type")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                mode === "type"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              Type
            </button>
          </div>

          {mode === "draw" ? (
            <div className="relative" ref={containerRef}>
              <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                <SignatureCanvas
                  key={canvasWidth}
                  ref={canvasRef}
                  penColor="#1a1a2e"
                  canvasProps={{
                    width: canvasWidth,
                    height: 150,
                    style: { width: `${canvasWidth}px`, height: "150px", touchAction: "none" },
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => canvasRef.current?.clear()}
                className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 bg-white rounded-md border border-gray-200"
                title="Clear"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <p className="text-xs text-gray-400 mt-1">
                Draw your signature above
              </p>
            </div>
          ) : (
            <div>
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Type your full name"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
              {typedName && (
                <div className="mt-3 border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <p
                    className="text-3xl text-gray-800"
                    style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}
                  >
                    {typedName}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {hasPayment ? (
                <CreditCard className="w-4 h-4" />
              ) : (
                <PenLine className="w-4 h-4" />
              )}
              {buttonLabel}
            </>
          )}
        </button>

        {hasPayment && (
          <p className="text-xs text-gray-400 text-center">
            You&apos;ll be redirected to Stripe for secure payment after signing.
          </p>
        )}
      </form>
    </div>
  );
}
