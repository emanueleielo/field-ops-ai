"use client";

import { useState, useEffect } from "react";
import { TierConfig, TierConfigUpdate } from "@/lib/api/admin-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, X, Loader2 } from "lucide-react";

interface TierEditDialogProps {
  tier: TierConfig | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: TierConfigUpdate) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Dialog for editing tier configuration
 * Allows modifying prices, limits, and status
 */
export function TierEditDialog({
  tier,
  open,
  onClose,
  onSave,
  isLoading,
}: TierEditDialogProps) {
  const [formData, setFormData] = useState<TierConfigUpdate>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (tier) {
      setFormData({
        name: tier.name,
        monthly_price: tier.monthly_price,
        yearly_price: tier.yearly_price,
        quota_limit_euro: tier.quota_limit_euro,
        storage_limit_mb: tier.storage_limit_mb,
        max_phone_numbers: tier.max_phone_numbers,
        max_file_size_mb: tier.max_file_size_mb,
        max_pdf_pages: tier.max_pdf_pages,
        is_active: tier.is_active,
      });
      setErrors({});
    }
  }, [tier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: Record<string, string> = {};

    if (
      formData.monthly_price !== undefined &&
      formData.monthly_price < 0
    ) {
      newErrors.monthly_price = "Price must be positive";
    }
    if (
      formData.yearly_price !== undefined &&
      formData.yearly_price < 0
    ) {
      newErrors.yearly_price = "Price must be positive";
    }
    if (
      formData.quota_limit_euro !== undefined &&
      formData.quota_limit_euro < 0
    ) {
      newErrors.quota_limit_euro = "Quota must be positive";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSave(formData);
  };

  const handleChange = (field: keyof TierConfigUpdate, value: string | number | boolean | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  if (!tier) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit {tier.name} Tier
          </DialogTitle>
          <DialogDescription>
            Update pricing and limits for the {tier.tier} tier. Changes affect
            new subscriptions only.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={formData.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Tier name"
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthly_price">Monthly Price (EUR)</Label>
              <Input
                id="monthly_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.monthly_price || ""}
                onChange={(e) =>
                  handleChange("monthly_price", parseFloat(e.target.value) || 0)
                }
                className={errors.monthly_price ? "border-danger-500" : ""}
              />
              {errors.monthly_price && (
                <p className="text-xs text-danger-600">{errors.monthly_price}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearly_price">Yearly Price (EUR)</Label>
              <Input
                id="yearly_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.yearly_price || ""}
                onChange={(e) =>
                  handleChange("yearly_price", parseFloat(e.target.value) || 0)
                }
                className={errors.yearly_price ? "border-danger-500" : ""}
              />
              {errors.yearly_price && (
                <p className="text-xs text-danger-600">{errors.yearly_price}</p>
              )}
            </div>
          </div>

          {/* Quota */}
          <div className="space-y-2">
            <Label htmlFor="quota_limit_euro">Quota Limit (EUR)</Label>
            <Input
              id="quota_limit_euro"
              type="number"
              step="0.01"
              min="0"
              value={formData.quota_limit_euro || ""}
              onChange={(e) =>
                handleChange("quota_limit_euro", parseFloat(e.target.value) || 0)
              }
              className={errors.quota_limit_euro ? "border-danger-500" : ""}
            />
            {errors.quota_limit_euro && (
              <p className="text-xs text-danger-600">{errors.quota_limit_euro}</p>
            )}
          </div>

          {/* Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="storage_limit_mb">Storage Limit (MB)</Label>
              <Input
                id="storage_limit_mb"
                type="number"
                min="0"
                value={formData.storage_limit_mb ?? ""}
                onChange={(e) =>
                  handleChange(
                    "storage_limit_mb",
                    e.target.value === "" ? null : parseInt(e.target.value) || 0
                  )
                }
                placeholder="Leave empty for unlimited"
              />
              <p className="text-xs text-industrial-500">
                Leave empty for unlimited storage
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_phone_numbers">Max Phone Numbers</Label>
              <Input
                id="max_phone_numbers"
                type="number"
                min="1"
                value={formData.max_phone_numbers || ""}
                onChange={(e) =>
                  handleChange("max_phone_numbers", parseInt(e.target.value) || 1)
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_file_size_mb">Max File Size (MB)</Label>
              <Input
                id="max_file_size_mb"
                type="number"
                min="1"
                value={formData.max_file_size_mb || ""}
                onChange={(e) =>
                  handleChange("max_file_size_mb", parseInt(e.target.value) || 1)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_pdf_pages">Max PDF Pages</Label>
              <Input
                id="max_pdf_pages"
                type="number"
                min="1"
                value={formData.max_pdf_pages || ""}
                onChange={(e) =>
                  handleChange("max_pdf_pages", parseInt(e.target.value) || 1)
                }
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active ?? true}
              onChange={(e) => handleChange("is_active", e.target.checked)}
              className="w-4 h-4 rounded border-industrial-300 text-warning-600 focus:ring-warning-500"
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Tier is active and visible to users
            </Label>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-warning-500 hover:bg-warning-600 text-industrial-900"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
