"use client";

import { Copy, FileText, RefreshCw, Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DuplicateDialogProps {
  fileName: string;
  existingFileName?: string;
  isOpen: boolean;
  isProcessing: boolean;
  onClose: () => void;
  onReplace: () => void;
  onKeepBoth: () => void;
}

export function DuplicateDialog({
  fileName,
  existingFileName,
  isOpen,
  isProcessing,
  onClose,
  onReplace,
  onKeepBoth,
}: DuplicateDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        {/* Warning stripe at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-warning-500" />

        <DialogHeader className="pt-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-warning-100 flex items-center justify-center">
              <Copy className="w-5 h-5 text-warning-600" />
            </div>
            <DialogTitle className="text-xl">Duplicate Document</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            A document with the same content already exists in your knowledge
            base. What would you like to do?
          </DialogDescription>
        </DialogHeader>

        {/* Document comparison */}
        <div className="grid grid-cols-2 gap-4 my-2">
          {/* Existing document */}
          <div className="bg-industrial-50 border border-industrial-200 rounded-lg p-4">
            <div className="text-xs text-industrial-500 uppercase tracking-wider mb-2">
              Existing
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-industrial-400 shrink-0" />
              <p className="text-sm font-medium text-industrial-900 truncate">
                {existingFileName || fileName}
              </p>
            </div>
          </div>

          {/* New document */}
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
            <div className="text-xs text-warning-600 uppercase tracking-wider mb-2">
              New Upload
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-warning-500 shrink-0" />
              <p className="text-sm font-medium text-industrial-900 truncate">
                {fileName}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={onKeepBoth}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Keep Both
          </Button>
          <Button
            onClick={onReplace}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Replace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
