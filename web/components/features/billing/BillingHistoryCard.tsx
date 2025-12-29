"use client";

import { FileText, Download, ExternalLink, Receipt } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Invoice {
  id: string;
  number: string;
  date: Date;
  amount: number;
  status: "paid" | "pending" | "failed";
  pdfUrl?: string;
}

interface BillingHistoryCardProps {
  invoices: Invoice[];
  onViewAllInvoices: () => void;
}

export function BillingHistoryCard({
  invoices,
  onViewAllInvoices,
}: BillingHistoryCardProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
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

  const getStatusBadge = (status: Invoice["status"]) => {
    const styles = {
      paid: "bg-success-100 text-success-700 border-success-200",
      pending: "bg-warning-100 text-warning-700 border-warning-200",
      failed: "bg-danger-100 text-danger-700 border-danger-200",
    };

    return (
      <span
        className={cn(
          "px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded border",
          styles[status]
        )}
      >
        {status}
      </span>
    );
  };

  return (
    <Card className="industrial-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-industrial-500" />
              Billing History
            </CardTitle>
            <CardDescription>Your recent invoices and payments</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onViewAllInvoices}>
            <ExternalLink className="w-4 h-4 mr-2" />
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-8 bg-industrial-50 rounded-lg border-2 border-dashed border-industrial-200">
            <FileText className="w-10 h-10 text-industrial-300 mx-auto mb-3" />
            <p className="text-industrial-600 font-medium mb-1">
              No invoices yet
            </p>
            <p className="text-sm text-industrial-400">
              Your billing history will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {invoices.slice(0, 5).map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-3 bg-industrial-50 rounded-lg hover:bg-industrial-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white border border-industrial-200 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-industrial-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-industrial-900">
                        Invoice #{invoice.number}
                      </span>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <p className="text-sm text-industrial-500">
                      {formatDate(invoice.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono font-semibold text-industrial-900">
                    {formatCurrency(invoice.amount)}
                  </span>
                  {invoice.pdfUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="text-industrial-500 hover:text-industrial-900"
                    >
                      <a
                        href={invoice.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
