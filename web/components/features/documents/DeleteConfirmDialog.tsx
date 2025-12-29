"use client";

import { AlertTriangle, FileText, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { DocumentResponse } from "@/lib/api/client";

interface DeleteConfirmDialogProps {
  document: DocumentResponse | null;
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({
  document,
  isOpen,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {/* Warning stripe at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-danger-500" />

        <DialogHeader className="pt-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-danger-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-danger-600" />
            </div>
            <DialogTitle className="text-xl">Delete Document</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            This action cannot be undone. The document will be permanently
            removed from your knowledge base.
          </DialogDescription>
        </DialogHeader>

        {/* Document preview */}
        <div className="bg-industrial-50 border border-industrial-200 rounded-lg p-4 my-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white border border-industrial-200 flex items-center justify-center">
              <FileText className="w-5 h-5 text-industrial-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-industrial-900 truncate">
                {document.original_filename}
              </p>
              <p className="text-xs text-industrial-500 font-mono uppercase">
                {document.file_type} &bull;{" "}
                {(document.file_size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        </div>

        {/* Warning about indexed content */}
        {document.status === "indexed" && (
          <div className="flex items-start gap-2 text-sm text-warning-700 bg-warning-50 border border-warning-200 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              This document is currently indexed and searchable. Deleting it
              will remove all associated embeddings from the vector store.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Document
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
