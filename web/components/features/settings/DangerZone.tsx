"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Trash2,
  Loader2,
  ShieldAlert,
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

interface DangerZoneProps {
  userEmail: string;
  onDeleteAccount: () => Promise<void>;
}

const DELETE_CONFIRMATION = "DELETE";

export function DangerZone({ userEmail, onDeleteAccount }: DangerZoneProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = confirmationText === DELETE_CONFIRMATION;

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setIsDeleting(true);
    setError(null);

    try {
      await onDeleteAccount();
      // User will be redirected after successful deletion
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete account"
      );
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setConfirmationText("");
      setError(null);
    }
    setShowDeleteDialog(open);
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-danger-200">
        <div className="w-10 h-10 rounded-lg bg-danger-100 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-danger-600" />
        </div>
        <div>
          <h3 className="font-semibold text-danger-900">Danger Zone</h3>
          <p className="text-sm text-danger-600">
            Irreversible and destructive actions
          </p>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="relative overflow-hidden rounded-lg border border-danger-200 bg-danger-50">
        {/* Warning stripes */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                #dc2626 0,
                #dc2626 10px,
                transparent 10px,
                transparent 20px
              )`,
            }}
          />
        </div>

        <div className="relative p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-danger-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-danger-900 mb-2">
                Delete Account
              </h4>
              <p className="text-sm text-danger-700 mb-4">
                Permanently delete your account and all associated data. This
                action cannot be undone. All your documents, conversations, and
                settings will be permanently removed.
              </p>
              <ul className="text-sm text-danger-600 space-y-1 mb-4 pl-4">
                <li className="list-disc">All uploaded documents will be deleted</li>
                <li className="list-disc">
                  Conversation history will be permanently removed
                </li>
                <li className="list-disc">
                  Phone number configurations will be released
                </li>
                <li className="list-disc">
                  Any remaining subscription time will be forfeited
                </li>
              </ul>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete My Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-danger-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-danger-600" />
              </div>
              <div>
                <DialogTitle className="text-danger-900">
                  Delete Account
                </DialogTitle>
                <DialogDescription>
                  This action is permanent and irreversible
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {error && (
              <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
                {error}
              </div>
            )}

            <div className="p-4 bg-industrial-50 rounded-lg border border-industrial-200">
              <p className="text-sm text-industrial-600 mb-1">
                Account to be deleted:
              </p>
              <p className="font-mono font-semibold text-industrial-900">
                {userEmail}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-confirmation">
                Type <span className="font-mono font-bold text-danger-600">DELETE</span> to
                confirm
              </Label>
              <Input
                id="delete-confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value.toUpperCase())}
                placeholder="Type DELETE"
                className="font-mono"
                error={confirmationText.length > 0 && !isConfirmed}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!isConfirmed || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
