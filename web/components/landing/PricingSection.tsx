"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Basic",
    description: "For freelance technicians",
    monthlyPrice: 79,
    yearlyPrice: 72,
    yearlyTotal: 869,
    features: [
      "1 phone number",
      "50 MB document storage",
      "Unlimited SMS",
      "15 Euro LLM quota/month",
      "Full analytics",
      "Email support",
    ],
    highlighted: false,
  },
  {
    name: "Professional",
    description: "For senior engineers & site supervisors",
    monthlyPrice: 149,
    yearlyPrice: 137,
    yearlyTotal: 1643,
    features: [
      "1 phone number",
      "Unlimited document storage",
      "Unlimited SMS",
      "35 Euro LLM quota/month",
      "Full analytics",
      "Priority email support",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    description: "For teams & companies",
    monthlyPrice: 399,
    yearlyPrice: 367,
    yearlyTotal: 4399,
    features: [
      "5 phone numbers",
      "Unlimited document storage",
      "Unlimited SMS",
      "80 Euro LLM quota/month",
      "Full analytics",
      "Priority email support",
    ],
    highlighted: false,
  },
];

export function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly"
  );

  return (
    <section id="pricing" className="py-20 lg:py-32 bg-industrial-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-industrial-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-industrial-600">
            No hidden fees. No free tier. Just professional tools for
            professionals.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-industrial transition-colors",
              billingPeriod === "monthly"
                ? "bg-industrial-900 text-white"
                : "bg-white text-industrial-600 hover:bg-industrial-100"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod("yearly")}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-industrial transition-colors flex items-center gap-2",
              billingPeriod === "yearly"
                ? "bg-industrial-900 text-white"
                : "bg-white text-industrial-600 hover:bg-industrial-100"
            )}
          >
            Yearly
            <span className="text-xs bg-warning-500 text-industrial-900 px-2 py-0.5 rounded-full font-bold">
              -8%
            </span>
          </button>
        </div>

        {/* Pricing cards */}
        <div className="grid lg:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const price =
              billingPeriod === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;

            return (
              <div
                key={plan.name}
                className={cn(
                  "relative bg-white rounded-lg border-2 p-8 transition-shadow",
                  plan.highlighted
                    ? "border-warning-500 shadow-xl scale-105 z-10"
                    : "border-industrial-200 shadow-industrial"
                )}
              >
                {/* Popular badge */}
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-warning-500 text-industrial-900 font-bold text-sm px-4 py-1 rounded-full shadow-md">
                    Most Popular
                  </div>
                )}

                {/* Plan header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-industrial-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-industrial-600 text-sm mb-6">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-extrabold text-industrial-900">
                      {price}
                    </span>
                    <span className="text-lg text-industrial-500">Euro/mo</span>
                  </div>

                  {billingPeriod === "yearly" && (
                    <p className="text-sm text-industrial-500 mt-2">
                      Billed {plan.yearlyTotal} Euro/year
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-success-500 shrink-0 mt-0.5" />
                      <span className="text-industrial-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href="/login"
                  className={cn(
                    "block w-full text-center py-3 px-4 rounded-industrial font-semibold transition-colors",
                    plan.highlighted
                      ? "bg-industrial-900 text-white hover:bg-industrial-800"
                      : "bg-industrial-100 text-industrial-900 hover:bg-industrial-200"
                  )}
                >
                  Get Started
                </Link>
              </div>
            );
          })}
        </div>

        {/* Guarantee */}
        <div className="mt-12 text-center">
          <p className="text-industrial-600">
            All plans include a{" "}
            <strong className="text-industrial-900">
              14-day money-back guarantee
            </strong>
            . No questions asked.
          </p>
        </div>
      </div>
    </section>
  );
}
