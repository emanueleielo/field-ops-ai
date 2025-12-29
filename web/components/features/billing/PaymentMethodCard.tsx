"use client";

import { CreditCard, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PaymentMethodCardProps {
  cardBrand: string;
  cardLast4: string;
  cardExpMonth: number;
  cardExpYear: number;
  onUpdatePaymentMethod: () => void;
}

const CARD_ICONS: Record<string, string> = {
  visa: "VISA",
  mastercard: "MC",
  amex: "AMEX",
  discover: "DISC",
};

export function PaymentMethodCard({
  cardBrand,
  cardLast4,
  cardExpMonth,
  cardExpYear,
  onUpdatePaymentMethod,
}: PaymentMethodCardProps) {
  const brandDisplay = CARD_ICONS[cardBrand.toLowerCase()] || cardBrand.toUpperCase();
  const isExpiringSoon =
    new Date().getFullYear() === cardExpYear &&
    new Date().getMonth() + 1 >= cardExpMonth - 1;

  return (
    <Card className="industrial-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-industrial-500" />
          Payment Method
        </CardTitle>
        <CardDescription>Your default payment method for billing</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 bg-industrial-50 rounded-lg border border-industrial-200">
          {/* Card Display */}
          <div className="flex items-center gap-4">
            {/* Card Icon */}
            <div className="w-14 h-10 rounded bg-gradient-to-br from-industrial-700 to-industrial-900 flex items-center justify-center">
              <span className="text-white text-xs font-bold tracking-wider">
                {brandDisplay}
              </span>
            </div>

            {/* Card Details */}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-industrial-900">
                  •••• •••• •••• {cardLast4}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-industrial-500">
                  Expires {cardExpMonth.toString().padStart(2, "0")}/{cardExpYear}
                </span>
                {isExpiringSoon && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-warning-100 text-warning-700 rounded-full">
                    Expiring Soon
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Update Button */}
          <Button variant="outline" size="sm" onClick={onUpdatePaymentMethod}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Update
          </Button>
        </div>

        {isExpiringSoon && (
          <p className="mt-3 text-sm text-warning-700">
            Your card will expire soon. Please update your payment method to avoid
            service interruption.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
