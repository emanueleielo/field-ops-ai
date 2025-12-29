"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  UserListItem,
  UserUpdateRequest,
  TierType,
} from "@/lib/api/admin-client";
import { cn } from "@/lib/utils";

interface EditUserDialogProps {
  user: UserListItem | null;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSave: (userId: string, data: UserUpdateRequest) => Promise<void>;
}

const tierOptions: { value: TierType; label: string; quota: number }[] = [
  { value: "basic", label: "Basic", quota: 15 },
  { value: "professional", label: "Professional", quota: 35 },
  { value: "enterprise", label: "Enterprise", quota: 80 },
];

/**
 * Dialog for editing user tier, quota, and status
 * Allows admin to modify subscription tier and quota limit
 */
export function EditUserDialog({
  user,
  isOpen,
  isLoading,
  onClose,
  onSave,
}: EditUserDialogProps) {
  const [tier, setTier] = useState<TierType>("basic");
  const [quotaLimit, setQuotaLimit] = useState<string>("15");
  const [isActive, setIsActive] = useState(true);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      setTier(user.tier);
      setName(user.name);
      setIsActive(user.is_active);
      // Default quota based on tier
      const tierOption = tierOptions.find((t) => t.value === user.tier);
      setQuotaLimit(tierOption?.quota.toString() || "15");
      setError(null);
    }
  }, [user]);

  // Update quota when tier changes
  const handleTierChange = (newTier: TierType) => {
    setTier(newTier);
    const tierOption = tierOptions.find((t) => t.value === newTier);
    if (tierOption) {
      setQuotaLimit(tierOption.quota.toString());
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setError(null);

    const quotaValue = parseFloat(quotaLimit);
    if (isNaN(quotaValue) || quotaValue < 0) {
      setError("Quota must be a valid positive number");
      return;
    }

    try {
      await onSave(user.id, {
        tier,
        quota_limit_euro: quotaValue,
        is_active: isActive,
        name: name.trim() || undefined,
      });
    } catch (err) {
      const apiError = err as { detail?: string };
      setError(apiError.detail || "Failed to update user");
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user settings for {user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Name */}
          <div className="grid gap-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter organization name"
            />
          </div>

          {/* Tier Selection */}
          <div className="grid gap-2">
            <Label>Subscription Tier</Label>
            <div className="grid grid-cols-3 gap-2">
              {tierOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleTierChange(option.value)}
                  className={cn(
                    "px-3 py-2 rounded border text-sm font-medium transition-all",
                    tier === option.value
                      ? "border-warning-500 bg-warning-50 text-warning-700"
                      : "border-industrial-200 bg-white text-industrial-600 hover:border-industrial-300"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quota Limit */}
          <div className="grid gap-2">
            <Label htmlFor="quota">Quota Limit (EUR)</Label>
            <Input
              id="quota"
              type="number"
              min="0"
              step="0.01"
              value={quotaLimit}
              onChange={(e) => setQuotaLimit(e.target.value)}
              placeholder="Enter quota limit"
            />
            <p className="text-xs text-industrial-500">
              Default for {tierOptions.find((t) => t.value === tier)?.label}:{" "}
              {tierOptions.find((t) => t.value === tier)?.quota} EUR
            </p>
          </div>

          {/* Active Status */}
          <div className="grid gap-2">
            <Label>Account Status</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsActive(true)}
                className={cn(
                  "flex-1 px-3 py-2 rounded border text-sm font-medium transition-all",
                  isActive
                    ? "border-success-500 bg-success-50 text-success-700"
                    : "border-industrial-200 bg-white text-industrial-600 hover:border-industrial-300"
                )}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setIsActive(false)}
                className={cn(
                  "flex-1 px-3 py-2 rounded border text-sm font-medium transition-all",
                  !isActive
                    ? "border-danger-500 bg-danger-50 text-danger-700"
                    : "border-industrial-200 bg-white text-industrial-600 hover:border-industrial-300"
                )}
              >
                Disabled
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-danger-50 border border-danger-200 rounded text-sm text-danger-700">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-warning-500 hover:bg-warning-600 text-white"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
