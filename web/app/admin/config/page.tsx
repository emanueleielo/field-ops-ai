"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, AlertCircle, Settings, Sliders } from "lucide-react";
import {
  TierConfigTable,
  TierEditDialog,
} from "@/components/features/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminApi,
  TierConfig,
  TierConfigUpdate,
  TierType,
  SystemSettings,
} from "@/lib/api/admin-client";

/**
 * Admin configuration page
 * Manages tier pricing/limits and system settings
 */
export default function AdminConfigPage() {
  const [tiers, setTiers] = useState<TierConfig[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<TierConfig | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const [tierData, settingsData] = await Promise.all([
        adminApi.getTierConfigs(),
        adminApi.getSystemSettings(),
      ]);
      setTiers(tierData.tiers);
      setSettings(settingsData);
    } catch (err) {
      const apiError = err as { detail?: string };
      setError(apiError.detail || "Failed to load configuration");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEditTier = (tier: TierType) => {
    const tierConfig = tiers.find((t) => t.tier === tier);
    if (tierConfig) {
      setSelectedTier(tierConfig);
      setIsEditDialogOpen(true);
    }
  };

  const handleSaveTier = async (data: TierConfigUpdate) => {
    if (!selectedTier) return;

    setIsSaving(true);
    try {
      const updated = await adminApi.updateTierConfig(selectedTier.tier, data);
      setTiers((prev) =>
        prev.map((t) => (t.tier === selectedTier.tier ? updated : t))
      );
      setIsEditDialogOpen(false);
      setSelectedTier(null);
    } catch (err) {
      const apiError = err as { detail?: string };
      setError(apiError.detail || "Failed to update tier");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSettings = async (key: keyof SystemSettings, value: unknown) => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const updated = await adminApi.updateSystemSettings({ [key]: value });
      setSettings(updated);
    } catch (err) {
      const apiError = err as { detail?: string };
      setError(apiError.detail || "Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (error && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-danger-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-industrial-900 mb-2">
            Failed to Load Configuration
          </h2>
          <p className="text-industrial-600 mb-4">{error}</p>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-industrial-900">
            Configuration
          </h1>
          <p className="text-industrial-600 mt-1">
            Manage tier pricing, limits, and system settings
          </p>
        </div>
        <Button
          onClick={fetchData}
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="border-warning-300 text-warning-700 hover:bg-warning-50"
        >
          <RefreshCw
            className={`w-4 h-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Error banner */}
      {error && !isLoading && (
        <div className="flex items-center gap-2 p-4 bg-danger-50 border border-danger-200 rounded-industrial text-danger-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <Button
            onClick={fetchData}
            variant="ghost"
            size="sm"
            className="ml-auto text-danger-700 hover:text-danger-800 hover:bg-danger-100"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Tier Configuration */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-warning-600" />
          <h2 className="text-lg font-semibold text-industrial-900">
            Tier Configuration
          </h2>
        </div>
        <TierConfigTable
          tiers={tiers}
          onEdit={handleEditTier}
          isLoading={isLoading}
        />
        <p className="mt-2 text-xs text-industrial-500">
          Note: Changes affect new subscriptions only. Existing subscriptions
          retain original terms until renewal.
        </p>
      </div>

      {/* System Settings */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="w-5 h-5 text-warning-600" />
          <h2 className="text-lg font-semibold text-industrial-900">
            System Settings
          </h2>
        </div>

        {isLoading || !settings ? (
          <Card className="animate-pulse">
            <CardContent className="pt-6">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-industrial-100 rounded w-24" />
                    <div className="h-10 bg-industrial-100 rounded" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Burst Limit */}
                <div className="space-y-2">
                  <Label htmlFor="burst_limit">Burst Limit (per hour)</Label>
                  <Input
                    id="burst_limit"
                    type="number"
                    min="1"
                    max="1000"
                    value={settings.burst_limit}
                    onChange={(e) =>
                      handleUpdateSettings("burst_limit", parseInt(e.target.value) || 50)
                    }
                    disabled={isSaving}
                  />
                  <p className="text-xs text-industrial-500">
                    Max queries per organization per hour
                  </p>
                </div>

                {/* LLM Timeout */}
                <div className="space-y-2">
                  <Label htmlFor="llm_timeout">LLM Timeout (seconds)</Label>
                  <Input
                    id="llm_timeout"
                    type="number"
                    min="30"
                    max="600"
                    value={settings.llm_timeout_seconds}
                    onChange={(e) =>
                      handleUpdateSettings(
                        "llm_timeout_seconds",
                        parseInt(e.target.value) || 360
                      )
                    }
                    disabled={isSaving}
                  />
                  <p className="text-xs text-industrial-500">
                    Maximum time for LLM response
                  </p>
                </div>

                {/* Conversation History */}
                <div className="space-y-2">
                  <Label htmlFor="history">Conversation History</Label>
                  <Input
                    id="history"
                    type="number"
                    min="1"
                    max="20"
                    value={settings.max_conversation_history}
                    onChange={(e) =>
                      handleUpdateSettings(
                        "max_conversation_history",
                        parseInt(e.target.value) || 5
                      )
                    }
                    disabled={isSaving}
                  />
                  <p className="text-xs text-industrial-500">
                    Messages kept in memory
                  </p>
                </div>

                {/* Default Language */}
                <div className="space-y-2">
                  <Label htmlFor="language">Default Language</Label>
                  <select
                    id="language"
                    value={settings.default_language}
                    onChange={(e) =>
                      handleUpdateSettings("default_language", e.target.value)
                    }
                    disabled={isSaving}
                    className="w-full h-10 px-3 rounded-industrial border border-industrial-300 bg-white text-industrial-900 text-sm focus:outline-none focus:ring-2 focus:ring-warning-500"
                  >
                    <option value="en">English</option>
                    <option value="it">Italian</option>
                    <option value="de">German</option>
                    <option value="fr">French</option>
                    <option value="es">Spanish</option>
                  </select>
                </div>

                {/* Welcome SMS Toggle */}
                <div className="space-y-2">
                  <Label>Welcome SMS</Label>
                  <div className="flex items-center gap-3 h-10">
                    <input
                      type="checkbox"
                      id="welcome_sms"
                      checked={settings.welcome_sms_enabled}
                      onChange={(e) =>
                        handleUpdateSettings("welcome_sms_enabled", e.target.checked)
                      }
                      disabled={isSaving}
                      className="w-4 h-4 rounded border-industrial-300 text-warning-600 focus:ring-warning-500"
                    />
                    <Label htmlFor="welcome_sms" className="cursor-pointer font-normal">
                      Send welcome SMS to new numbers
                    </Label>
                  </div>
                </div>

                {/* Rate Limiting Toggle */}
                <div className="space-y-2">
                  <Label>Rate Limiting</Label>
                  <div className="flex items-center gap-3 h-10">
                    <input
                      type="checkbox"
                      id="rate_limit"
                      checked={settings.rate_limit_enabled}
                      onChange={(e) =>
                        handleUpdateSettings("rate_limit_enabled", e.target.checked)
                      }
                      disabled={isSaving}
                      className="w-4 h-4 rounded border-industrial-300 text-warning-600 focus:ring-warning-500"
                    />
                    <Label htmlFor="rate_limit" className="cursor-pointer font-normal">
                      Enable burst protection
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <TierEditDialog
        tier={selectedTier}
        open={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedTier(null);
        }}
        onSave={handleSaveTier}
        isLoading={isSaving}
      />
    </div>
  );
}
