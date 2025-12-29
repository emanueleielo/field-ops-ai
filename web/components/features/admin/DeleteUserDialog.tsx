"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
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
import { UserListItem } from "@/lib/api/admin-client";

interface DeleteUserDialogProps {
  user: UserListItem | null;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (userId: string) => Promise<void>;
}

/**
 * Confirmation dialog for deleting a user
 * Requires typing the user's email to confirm deletion
 */
export function DeleteUserDialog({
  user,
  isOpen,
  isLoading,
  onClose,
  onConfirm,
}: DeleteUserDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!user) return;

    if (confirmText !== user.email) {
      setError("Please type the exact email address to confirm");
      return;
    }

    setError(null);

    try {
      await onConfirm(user.id);
      setConfirmText("");
    } catch (err) {
      const apiError = err as { detail?: string };
      setError(apiError.detail || "Failed to delete user");
    }
  };

  const handleClose = () => {
    setConfirmText("");
    setError(null);
    onClose();
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-danger-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-danger-600" />
            </div>
            <div>
              <DialogTitle className="text-danger-900">Delete User</DialogTitle>
              <DialogDescription className="text-danger-600">
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Warning */}
          <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg">
            <p className="text-sm text-danger-800 font-medium mb-2">
              You are about to permanently delete:
            </p>
            <ul className="text-sm text-danger-700 space-y-1 ml-4 list-disc">
              <li>User account: {user.email}</li>
              <li>Organization: {user.name}</li>
              <li>All uploaded documents ({user.documents_count} files)</li>
              <li>All vector embeddings from search index</li>
              <li>All message history</li>
              <li>All activity logs</li>
              <li>All phone number registrations</li>
            </ul>
          </div>

          {/* Confirmation input */}
          <div className="space-y-2">
            <Label htmlFor="confirm-email" className="text-industrial-700">
              Type <span className="font-mono font-bold">{user.email}</span> to
              confirm
            </Label>
            <Input
              id="confirm-email"
              type="text"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError(null);
              }}
              placeholder="Enter email to confirm"
              className="font-mono"
              error={!!error}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-danger-50 border border-danger-200 rounded text-sm text-danger-700">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading || confirmText !== user.email}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Delete User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
