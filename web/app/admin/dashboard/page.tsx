"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { BusinessKPIs, TechnicalKPIs } from "@/components/features/admin";
import { Button } from "@/components/ui/button";
import {
  adminApi,
  BusinessKPIs as BusinessKPIsData,
  TechnicalKPIs as TechnicalKPIsData,
} from "@/lib/api/admin-client";

/**
 * Admin dashboard page with business and technical KPIs
 * Auto-refreshes every 30 seconds
 */
export default function AdminDashboardPage() {
  const [businessData, setBusinessData] = useState<BusinessKPIsData | null>(
    null
  );
  const [technicalData, setTechnicalData] = useState<TechnicalKPIsData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboard = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const data = await adminApi.getDashboard();
      setBusinessData(data.business);
      setTechnicalData(data.technical);
      setLastUpdated(new Date());
    } catch (err) {
      const apiError = err as { detail?: string };
      setError(apiError.detail || "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboard(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const handleRefresh = () => {
    fetchDashboard(true);
  };

  const formatLastUpdated = (date: Date): string => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (error && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-danger-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-industrial-900 mb-2">
            Failed to Load Dashboard
          </h2>
          <p className="text-industrial-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-industrial-900">
            Dashboard Overview
          </h1>
          <p className="text-industrial-600 mt-1">
            Monitor your platform performance and key metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-industrial-500">
              Last updated: {formatLastUpdated(lastUpdated)}
            </span>
          )}
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="border-warning-300 text-warning-700 hover:bg-warning-50"
          >
            <RefreshCw
              className={`w-4 h-4 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error banner (non-blocking) */}
      {error && !isLoading && (
        <div className="flex items-center gap-2 p-4 bg-danger-50 border border-danger-200 rounded-industrial text-danger-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <Button
            onClick={handleRefresh}
            variant="ghost"
            size="sm"
            className="ml-auto text-danger-700 hover:text-danger-800 hover:bg-danger-100"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Business KPIs */}
      <BusinessKPIs data={businessData} isLoading={isLoading} />

      {/* Technical KPIs */}
      <TechnicalKPIs data={technicalData} isLoading={isLoading} />

      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-industrial-400 pt-4">
        <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
        <span>Auto-refreshing every 30 seconds</span>
      </div>
    </div>
  );
}
