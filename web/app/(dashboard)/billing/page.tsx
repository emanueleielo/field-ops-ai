"use client";

import { useState } from "react";
import { CreditCard, ArrowUpRight, Loader2, Shield } from "lucide-react";
import {
  CurrentPlanCard,
  PlansComparison,
  PaymentMethodCard,
  BillingHistoryCard,
  type PlanTier,
} from "@/components/features/billing";

// Mock data - replace with real API calls
const mockBillingData = {
  tier: "professional" as PlanTier,
  billingCycle: "monthly" as const,
  quotaUsed: 24.5,
  quotaLimit: 35,
  nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
  nextBillingAmount: 149,
  paymentMethod: {
    cardBrand: "visa",
    cardLast4: "4242",
    cardExpMonth: 12,
    cardExpYear: 2025,
  },
  invoices: [
    {
      id: "inv_1",
      number: "INV-2024-0042",
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      amount: 149,
      status: "paid" as const,
      pdfUrl: "#",
    },
    {
      id: "inv_2",
      number: "INV-2024-0035",
      date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      amount: 149,
      status: "paid" as const,
      pdfUrl: "#",
    },
    {
      id: "inv_3",
      number: "INV-2024-0028",
      date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      amount: 149,
      status: "paid" as const,
      pdfUrl: "#",
    },
    {
      id: "inv_4",
      number: "INV-2024-0021",
      date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      amount: 79,
      status: "paid" as const,
      pdfUrl: "#",
    },
  ],
};

export default function BillingPage() {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [billingData] = useState(mockBillingData);

  // Simulate Stripe Customer Portal redirect
  const handleManageSubscription = async () => {
    setIsRedirecting(true);
    // In real implementation, call backend to create portal session
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Redirect would happen here
    console.log("Redirecting to Stripe Customer Portal...");
    setIsRedirecting(false);
  };

  const handleUpdatePaymentMethod = async () => {
    setIsRedirecting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Redirecting to Stripe Portal for payment update...");
    setIsRedirecting(false);
  };

  const handleViewAllInvoices = async () => {
    setIsRedirecting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Redirecting to Stripe Portal invoices...");
    setIsRedirecting(false);
  };

  const handleSelectPlan = async (tier: PlanTier) => {
    setIsRedirecting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(`Redirecting to Stripe Checkout for ${tier} plan...`);
    setIsRedirecting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-industrial-100 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-industrial-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-industrial-900">
              Billing & Subscription
            </h2>
            <p className="text-sm text-industrial-500">
              Manage your plan, payment method, and invoices
            </p>
          </div>
        </div>

        {isRedirecting && (
          <div className="flex items-center gap-2 px-4 py-2 bg-industrial-100 rounded-lg text-industrial-700">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Redirecting to Stripe...</span>
          </div>
        )}
      </div>

      {/* Top Row: Current Plan & Payment Method */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CurrentPlanCard
          tier={billingData.tier}
          quotaUsed={billingData.quotaUsed}
          quotaLimit={billingData.quotaLimit}
          billingCycle={billingData.billingCycle}
          nextBillingDate={billingData.nextBillingDate}
          nextBillingAmount={billingData.nextBillingAmount}
          onManageSubscription={handleManageSubscription}
        />

        <div className="space-y-6">
          <PaymentMethodCard
            cardBrand={billingData.paymentMethod.cardBrand}
            cardLast4={billingData.paymentMethod.cardLast4}
            cardExpMonth={billingData.paymentMethod.cardExpMonth}
            cardExpYear={billingData.paymentMethod.cardExpYear}
            onUpdatePaymentMethod={handleUpdatePaymentMethod}
          />

          <BillingHistoryCard
            invoices={billingData.invoices}
            onViewAllInvoices={handleViewAllInvoices}
          />
        </div>
      </div>

      {/* Plans Comparison */}
      <PlansComparison
        currentTier={billingData.tier}
        billingCycle={billingData.billingCycle}
        onSelectPlan={handleSelectPlan}
      />

      {/* Security Note */}
      <div className="flex items-center justify-center gap-2 text-sm text-industrial-500 py-4">
        <Shield className="w-4 h-4" />
        <span>
          Payments are securely processed by{" "}
          <a
            href="https://stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-industrial-700 hover:text-industrial-900 font-medium inline-flex items-center gap-1"
          >
            Stripe
            <ArrowUpRight className="w-3 h-3" />
          </a>
        </span>
      </div>
    </div>
  );
}
