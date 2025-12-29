"use client";

import React from "react";
import { TierConfig, TierType } from "@/lib/api/admin-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Edit, Check, X } from "lucide-react";

interface TierConfigTableProps {
  tiers: TierConfig[];
  onEdit: (tier: TierType) => void;
  isLoading?: boolean;
}

/**
 * Tier configuration table component
 * Displays all tier configurations with editable values
 */
export function TierConfigTable({
  tiers,
  onEdit,
  isLoading,
}: TierConfigTableProps) {
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("en-EU", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const formatStorage = (mb: number | null): string => {
    if (mb === null) return "Unlimited";
    if (mb >= 1024) return `${(mb / 1024).toFixed(0)} GB`;
    return `${mb} MB`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-industrial border border-industrial-200 overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-industrial-100" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 border-t border-industrial-100 bg-white">
              <div className="h-4 bg-industrial-100 m-4 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-industrial border border-industrial-200 overflow-hidden shadow-industrial">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-industrial-50 border-b border-industrial-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-industrial-600 uppercase tracking-wider">
                Tier
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-industrial-600 uppercase tracking-wider">
                Monthly
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-industrial-600 uppercase tracking-wider">
                Yearly
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-industrial-600 uppercase tracking-wider">
                Quota
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-industrial-600 uppercase tracking-wider">
                Storage
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-industrial-600 uppercase tracking-wider">
                Phone #s
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-industrial-600 uppercase tracking-wider">
                Max File
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-industrial-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-industrial-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-industrial-100">
            {tiers.map((tier) => (
              <tr
                key={tier.tier}
                className={cn(
                  "hover:bg-industrial-50 transition-colors",
                  !tier.is_active && "opacity-50"
                )}
              >
                <td className="px-4 py-4">
                  <div>
                    <span className="font-semibold text-industrial-900 capitalize">
                      {tier.name}
                    </span>
                    <span className="ml-2 text-xs text-industrial-500">
                      ({tier.tier})
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-right font-mono text-sm text-industrial-900">
                  {formatPrice(tier.monthly_price)}
                </td>
                <td className="px-4 py-4 text-right font-mono text-sm text-industrial-900">
                  {formatPrice(tier.yearly_price)}
                </td>
                <td className="px-4 py-4 text-right font-mono text-sm text-industrial-900">
                  {formatPrice(tier.quota_limit_euro)}
                </td>
                <td className="px-4 py-4 text-right font-mono text-sm text-industrial-900">
                  {formatStorage(tier.storage_limit_mb)}
                </td>
                <td className="px-4 py-4 text-center font-mono text-sm text-industrial-900">
                  {tier.max_phone_numbers}
                </td>
                <td className="px-4 py-4 text-center font-mono text-sm text-industrial-900">
                  {tier.max_file_size_mb} MB
                </td>
                <td className="px-4 py-4 text-center">
                  {tier.is_active ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700">
                      <Check className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-industrial-100 text-industrial-600">
                      <X className="w-3 h-3" />
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(tier.tier)}
                    className="text-warning-600 hover:text-warning-700 hover:bg-warning-50"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
