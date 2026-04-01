"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type PaymentPanelProps = {
  proposalId: string;
  paymentType: string;
  totalAmount: number;
  depositAmount: number | null;
  currency?: string;
};

export function PaymentPanel({
  proposalId,
  paymentType,
  totalAmount,
  depositAmount,
  currency = "usd",
}: PaymentPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePayment(amount: number, type: string) {
    setLoading(true);
    setError("");

    try {
      const endpoint =
        paymentType === "subscription"
          ? "/api/stripe/subscription"
          : "/api/stripe/checkout";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId,
          amount,
          type,
          currency,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create payment session");
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        Complete Payment
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        Secure payment powered by Stripe.
      </p>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {paymentType === "one_time" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Total Amount</span>
            <span className="text-xl font-bold text-gray-900">
              {formatCurrency(totalAmount, currency)}
            </span>
          </div>
          <button
            onClick={() => handlePayment(totalAmount, "one_time")}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            Pay {formatCurrency(totalAmount, currency)}
          </button>
        </div>
      )}

      {paymentType === "deposit_milestone" && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Deposit (Due Now)</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(depositAmount || 0, currency)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Remaining Balance</span>
              <span className="text-sm text-gray-500">
                {formatCurrency(
                  totalAmount - (depositAmount || 0),
                  currency
                )}{" "}
                (due upon completion)
              </span>
            </div>
            <hr className="border-gray-200" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Total Project Cost
              </span>
              <span className="text-sm font-medium text-gray-700">
                {formatCurrency(totalAmount, currency)}
              </span>
            </div>
          </div>
          <button
            onClick={() =>
              handlePayment(depositAmount || totalAmount, "deposit")
            }
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            Pay Deposit {formatCurrency(depositAmount || 0, currency)}
          </button>
        </div>
      )}

      {paymentType === "subscription" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Monthly Subscription</span>
            <span className="text-xl font-bold text-gray-900">
              {formatCurrency(totalAmount, currency)}/mo
            </span>
          </div>
          <button
            onClick={() => handlePayment(totalAmount, "subscription")}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            Subscribe — {formatCurrency(totalAmount, currency)}/month
          </button>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center mt-4">
        Payments are securely processed by Stripe. Your card details are never
        stored on our servers.
      </p>
    </div>
  );
}
