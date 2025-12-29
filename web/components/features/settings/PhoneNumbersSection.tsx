"use client";

import { useState } from "react";
import {
  Phone,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Crown,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

interface PhoneNumber {
  id: string;
  number: string;
  label?: string;
  isPrimary: boolean;
  createdAt: string;
}

interface PhoneNumbersSectionProps {
  phoneNumbers: PhoneNumber[];
  isEnterprise: boolean;
  maxNumbers: number;
  onAdd: (number: string, label?: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

// E.164 format validation: +[country code][number], 8-15 digits total
function validateE164(number: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(number.replace(/\s/g, ""));
}

function formatPhoneNumber(number: string): string {
  // Simple formatting for display
  const cleaned = number.replace(/\s/g, "");
  if (cleaned.startsWith("+39")) {
    // Italian format
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  return number;
}

export function PhoneNumbersSection({
  phoneNumbers,
  isEnterprise,
  maxNumbers,
  onAdd,
  onRemove,
}: PhoneNumbersSectionProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newNumber, setNewNumber] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<PhoneNumber | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canAddMore = phoneNumbers.length < maxNumbers;
  const isValidNumber = validateE164(newNumber);

  const handleAdd = async () => {
    if (!isValidNumber) return;

    setIsAdding(true);
    setAddError(null);

    try {
      await onAdd(newNumber.replace(/\s/g, ""), newLabel || undefined);
      setNewNumber("");
      setNewLabel("");
      setShowAddDialog(false);
    } catch (err) {
      setAddError(
        err instanceof Error ? err.message : "Failed to add phone number"
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await onRemove(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to remove phone number:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Non-enterprise users see upgrade prompt
  if (!isEnterprise) {
    return (
      <div className="space-y-6">
        {/* Section Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-industrial-200">
          <div className="w-10 h-10 rounded-lg bg-industrial-100 flex items-center justify-center">
            <Phone className="w-5 h-5 text-industrial-600" />
          </div>
          <div>
            <h3 className="font-semibold text-industrial-900">Phone Numbers</h3>
            <p className="text-sm text-industrial-500">
              Manage SMS-enabled phone numbers
            </p>
          </div>
        </div>

        {/* Upgrade Prompt */}
        <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-industrial-200 bg-gradient-to-br from-industrial-50 to-warning-50/30 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning-100 flex items-center justify-center shrink-0">
              <Crown className="w-6 h-6 text-warning-600" />
            </div>
            <div>
              <h4 className="font-semibold text-industrial-900 mb-1">
                Enterprise Feature
              </h4>
              <p className="text-sm text-industrial-600 mb-4">
                Multiple phone numbers allow your team to use separate lines for
                different departments, projects, or regions. Upgrade to
                Enterprise to unlock this feature.
              </p>
              <Button variant="outline" size="sm">
                <Crown className="w-4 h-4 mr-2" />
                View Enterprise Plans
              </Button>
            </div>
          </div>
          {/* Decorative corner accent */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-warning-500/10 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-4 border-b border-industrial-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-industrial-100 flex items-center justify-center">
            <Phone className="w-5 h-5 text-industrial-600" />
          </div>
          <div>
            <h3 className="font-semibold text-industrial-900">Phone Numbers</h3>
            <p className="text-sm text-industrial-500">
              {phoneNumbers.length} of {maxNumbers} numbers configured
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          disabled={!canAddMore}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Number
        </Button>
      </div>

      {/* Phone Numbers List */}
      {phoneNumbers.length === 0 ? (
        <div className="text-center py-8 bg-industrial-50 rounded-lg border-2 border-dashed border-industrial-200">
          <Phone className="w-10 h-10 text-industrial-300 mx-auto mb-3" />
          <p className="text-industrial-600 font-medium mb-1">
            No phone numbers configured
          </p>
          <p className="text-sm text-industrial-400 mb-4">
            Add a phone number to start receiving SMS queries
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Number
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {phoneNumbers.map((phone) => (
            <div
              key={phone.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg border transition-colors",
                phone.isPrimary
                  ? "bg-success-50/50 border-success-200"
                  : "bg-industrial-50 border-industrial-200 hover:bg-industrial-100"
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    phone.isPrimary ? "bg-success-100" : "bg-white"
                  )}
                >
                  <Phone
                    className={cn(
                      "w-5 h-5",
                      phone.isPrimary
                        ? "text-success-600"
                        : "text-industrial-600"
                    )}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-industrial-900">
                      {formatPhoneNumber(phone.number)}
                    </span>
                    {phone.isPrimary && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-success-100 text-success-700 rounded-full">
                        Primary
                      </span>
                    )}
                  </div>
                  {phone.label && (
                    <p className="text-sm text-industrial-500">{phone.label}</p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteTarget(phone)}
                disabled={phone.isPrimary}
                className={cn(
                  phone.isPrimary && "opacity-50 cursor-not-allowed"
                )}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add Phone Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Phone Number</DialogTitle>
            <DialogDescription>
              Enter a phone number in international format (E.164). This number
              will be able to send and receive SMS through FieldOps AI.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {addError && (
              <div className="flex items-center gap-2 p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone-number" required>
                Phone Number
              </Label>
              <Input
                id="phone-number"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                placeholder="+39 123 456 7890"
                error={newNumber.length > 0 && !isValidNumber}
              />
              {newNumber.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  {isValidNumber ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-success-600" />
                      <span className="text-success-600">Valid E.164 format</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-danger-600" />
                      <span className="text-danger-600">
                        Enter in format: +[country code][number]
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone-label">Label (optional)</Label>
              <Input
                id="phone-label"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g., Field Team, Support Line"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              disabled={isAdding}
            >
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!isValidNumber || isAdding}>
              {isAdding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Number
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Phone Number</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this phone number? SMS queries
              from this number will no longer be processed.
            </DialogDescription>
          </DialogHeader>

          {deleteTarget && (
            <div className="py-4">
              <div className="flex items-center gap-4 p-4 bg-industrial-50 rounded-lg">
                <Phone className="w-5 h-5 text-industrial-600" />
                <div>
                  <p className="font-mono font-semibold text-industrial-900">
                    {formatPhoneNumber(deleteTarget.number)}
                  </p>
                  {deleteTarget.label && (
                    <p className="text-sm text-industrial-500">
                      {deleteTarget.label}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Number
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
