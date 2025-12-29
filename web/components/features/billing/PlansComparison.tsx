"use client";

import { Check, X, Crown, Sparkles, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PlanTier } from "./CurrentPlanCard";

interface PlansComparisonProps {
  currentTier: PlanTier;
  billingCycle: "monthly" | "yearly";
  onSelectPlan: (tier: PlanTier) => void;
}

interface PlanFeature {
  name: string;
  basic: string | boolean;
  professional: string | boolean;
  enterprise: string | boolean;
}

const FEATURES: PlanFeature[] = [
  {
    name: "Phone Numbers",
    basic: "1",
    professional: "1",
    enterprise: "5",
  },
  {
    name: "Document Storage",
    basic: "50 MB",
    professional: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    name: "SMS Messages",
    basic: "Unlimited",
    professional: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    name: "LLM Quota",
    basic: "€15/mo",
    professional: "€35/mo",
    enterprise: "€80/mo",
  },
  {
    name: "Max File Size",
    basic: "50 MB",
    professional: "100 MB",
    enterprise: "100 MB",
  },
  {
    name: "Max PDF Pages",
    basic: "1,000",
    professional: "2,000",
    enterprise: "2,000",
  },
  {
    name: "Team Members",
    basic: false,
    professional: false,
    enterprise: "Coming v1.1",
  },
  {
    name: "Priority Support",
    basic: false,
    professional: true,
    enterprise: true,
  },
  {
    name: "Dedicated Account Manager",
    basic: false,
    professional: false,
    enterprise: true,
  },
];

const PLANS = {
  basic: {
    name: "Basic",
    icon: Sparkles,
    description: "For freelance technicians",
    monthlyPrice: 79,
    yearlyPrice: 72,
    color: "industrial",
  },
  professional: {
    name: "Professional",
    icon: Crown,
    description: "For senior engineers & site managers",
    monthlyPrice: 149,
    yearlyPrice: 137,
    color: "industrial",
    popular: true,
  },
  enterprise: {
    name: "Enterprise",
    icon: Building2,
    description: "For teams & companies",
    monthlyPrice: 399,
    yearlyPrice: 367,
    color: "warning",
  },
};

export function PlansComparison({
  currentTier,
  billingCycle,
  onSelectPlan,
}: PlansComparisonProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-EU", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderFeatureValue = (value: string | boolean) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="w-5 h-5 text-success-600 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-industrial-300 mx-auto" />
      );
    }
    return <span className="font-medium text-industrial-900">{value}</span>;
  };

  return (
    <Card className="industrial-panel overflow-hidden">
      <CardHeader className="border-b border-industrial-200 bg-industrial-50">
        <CardTitle>Compare Plans</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-industrial-200">
                <th className="text-left p-4 font-semibold text-industrial-700 w-1/4">
                  Features
                </th>
                {(Object.keys(PLANS) as PlanTier[]).map((tier) => {
                  const plan = PLANS[tier];
                  const Icon = plan.icon;
                  const isCurrent = currentTier === tier;
                  const price =
                    billingCycle === "monthly"
                      ? plan.monthlyPrice
                      : plan.yearlyPrice;

                  return (
                    <th
                      key={tier}
                      className={cn(
                        "text-center p-4 w-1/4 relative",
                        isCurrent && "bg-warning-50"
                      )}
                    >
                      {plan.popular && !isCurrent && (
                        <div className="absolute -top-px left-1/2 -translate-x-1/2 px-3 py-1 bg-warning-500 text-industrial-900 text-xs font-bold uppercase tracking-wider rounded-b-lg">
                          Most Popular
                        </div>
                      )}
                      {isCurrent && (
                        <div className="absolute -top-px left-1/2 -translate-x-1/2 px-3 py-1 bg-success-500 text-white text-xs font-bold uppercase tracking-wider rounded-b-lg">
                          Current Plan
                        </div>
                      )}
                      <div className="pt-4">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2",
                            tier === "enterprise"
                              ? "bg-warning-100"
                              : "bg-industrial-100"
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-5 h-5",
                              tier === "enterprise"
                                ? "text-warning-700"
                                : "text-industrial-700"
                            )}
                          />
                        </div>
                        <h4 className="font-bold text-industrial-900">
                          {plan.name}
                        </h4>
                        <p className="text-xs text-industrial-500 mb-2">
                          {plan.description}
                        </p>
                        <p className="text-2xl font-bold font-mono text-industrial-900">
                          {formatCurrency(price)}
                        </p>
                        <p className="text-xs text-industrial-500">
                          per {billingCycle === "monthly" ? "month" : "month (billed yearly)"}
                        </p>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((feature, index) => (
                <tr
                  key={feature.name}
                  className={cn(
                    "border-b border-industrial-100",
                    index % 2 === 0 ? "bg-white" : "bg-industrial-50/50"
                  )}
                >
                  <td className="p-4 text-sm text-industrial-700 font-medium">
                    {feature.name}
                  </td>
                  {(["basic", "professional", "enterprise"] as const).map(
                    (tier) => (
                      <td
                        key={tier}
                        className={cn(
                          "p-4 text-center text-sm",
                          currentTier === tier && "bg-warning-50/50"
                        )}
                      >
                        {renderFeatureValue(feature[tier])}
                      </td>
                    )
                  )}
                </tr>
              ))}
              <tr>
                <td className="p-4"></td>
                {(Object.keys(PLANS) as PlanTier[]).map((tier) => {
                  const isCurrent = currentTier === tier;
                  const isUpgrade =
                    (currentTier === "basic" && tier !== "basic") ||
                    (currentTier === "professional" && tier === "enterprise");
                  const isDowngrade =
                    (currentTier === "enterprise" && tier !== "enterprise") ||
                    (currentTier === "professional" && tier === "basic");

                  return (
                    <td
                      key={tier}
                      className={cn(
                        "p-4 text-center",
                        currentTier === tier && "bg-warning-50/50"
                      )}
                    >
                      {isCurrent ? (
                        <Button disabled variant="outline" className="w-full">
                          Current Plan
                        </Button>
                      ) : (
                        <Button
                          onClick={() => onSelectPlan(tier)}
                          variant={isUpgrade ? "default" : "outline"}
                          className="w-full"
                        >
                          {isUpgrade ? "Upgrade" : isDowngrade ? "Downgrade" : "Select"}
                        </Button>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
