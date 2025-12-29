"use client";

import { Crown, Zap, Calendar, TrendingUp, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type PlanTier = "basic" | "professional" | "enterprise";

interface CurrentPlanCardProps {
  tier: PlanTier;
  quotaUsed: number;
  quotaLimit: number;
  billingCycle: "monthly" | "yearly";
  nextBillingDate: Date;
  nextBillingAmount: number;
  onManageSubscription: () => void;
}

const PLAN_CONFIG: Record<
  PlanTier,
  {
    name: string;
    color: string;
    bgColor: string;
    borderColor: string;
    iconBg: string;
  }
> = {
  basic: {
    name: "Basic",
    color: "text-industrial-700",
    bgColor: "bg-industrial-50",
    borderColor: "border-industrial-200",
    iconBg: "bg-industrial-100",
  },
  professional: {
    name: "Professional",
    color: "text-industrial-900",
    bgColor: "bg-industrial-50",
    borderColor: "border-industrial-300",
    iconBg: "bg-industrial-200",
  },
  enterprise: {
    name: "Enterprise",
    color: "text-warning-800",
    bgColor: "bg-warning-50",
    borderColor: "border-warning-200",
    iconBg: "bg-warning-100",
  },
};

export function CurrentPlanCard({
  tier,
  quotaUsed,
  quotaLimit,
  billingCycle,
  nextBillingDate,
  nextBillingAmount,
  onManageSubscription,
}: CurrentPlanCardProps) {
  const config = PLAN_CONFIG[tier];
  const quotaPercentage = Math.min((quotaUsed / quotaLimit) * 100, 100);
  const quotaRemaining = Math.max(quotaLimit - quotaUsed, 0);

  const isQuotaWarning = quotaPercentage >= 80;
  const isQuotaCritical = quotaPercentage >= 95;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-EU", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  return (
    <Card className={cn("industrial-panel overflow-hidden", config.borderColor)}>
      {/* Header Banner */}
      <div
        className={cn(
          "px-6 py-4 border-b",
          config.bgColor,
          config.borderColor
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                config.iconBg
              )}
            >
              <Crown className={cn("w-6 h-6", config.color)} />
            </div>
            <div>
              <p className="text-sm text-industrial-500 font-medium uppercase tracking-wider">
                Current Plan
              </p>
              <h3 className={cn("text-xl font-bold", config.color)}>
                {config.name}
              </h3>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold font-mono text-industrial-900">
              {formatCurrency(nextBillingAmount)}
            </p>
            <p className="text-sm text-industrial-500">
              per {billingCycle === "monthly" ? "month" : "year"}
            </p>
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Quota Usage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap
                className={cn(
                  "w-4 h-4",
                  isQuotaCritical
                    ? "text-danger-600"
                    : isQuotaWarning
                      ? "text-warning-600"
                      : "text-industrial-500"
                )}
              />
              <span className="text-sm font-semibold text-industrial-700 uppercase tracking-wider">
                LLM Quota
              </span>
            </div>
            <span
              className={cn(
                "text-sm font-mono font-semibold",
                isQuotaCritical
                  ? "text-danger-600"
                  : isQuotaWarning
                    ? "text-warning-600"
                    : "text-industrial-600"
              )}
            >
              {formatCurrency(quotaUsed)} / {formatCurrency(quotaLimit)}
            </span>
          </div>

          <div className="relative">
            <Progress
              value={quotaPercentage}
              className={cn(
                "h-3",
                isQuotaCritical
                  ? "[&>div]:bg-danger-500"
                  : isQuotaWarning
                    ? "[&>div]:bg-warning-500"
                    : ""
              )}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-industrial-500">
              {formatCurrency(quotaRemaining)} remaining
            </span>
            <span
              className={cn(
                "font-semibold",
                isQuotaCritical
                  ? "text-danger-600"
                  : isQuotaWarning
                    ? "text-warning-600"
                    : "text-success-600"
              )}
            >
              {quotaPercentage.toFixed(0)}% used
            </span>
          </div>

          {isQuotaWarning && (
            <div
              className={cn(
                "p-3 rounded-lg text-sm flex items-start gap-2",
                isQuotaCritical
                  ? "bg-danger-50 text-danger-700 border border-danger-200"
                  : "bg-warning-50 text-warning-700 border border-warning-200"
              )}
            >
              <TrendingUp className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {isQuotaCritical
                  ? "Critical: Upgrade to avoid service interruption."
                  : "Approaching limit. Consider upgrading for more capacity."}
              </span>
            </div>
          )}
        </div>

        {/* Next Billing */}
        <div className="flex items-center justify-between p-4 bg-industrial-50 rounded-lg border border-industrial-200">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-industrial-400" />
            <div>
              <p className="text-sm text-industrial-500">Next billing date</p>
              <p className="font-semibold text-industrial-900">
                {formatDate(nextBillingDate)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-industrial-500">Amount</p>
            <p className="font-mono font-bold text-industrial-900">
              {formatCurrency(nextBillingAmount)}
            </p>
          </div>
        </div>

        {/* Manage Button */}
        <Button onClick={onManageSubscription} className="w-full">
          <ExternalLink className="w-4 h-4 mr-2" />
          Manage Subscription
        </Button>
      </CardContent>
    </Card>
  );
}
