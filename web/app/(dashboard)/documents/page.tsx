"use client";

import { useState, useCallback } from "react";
import { FileText, AlertCircle, HardDrive } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DocumentUploader,
  DocumentList,
  DeleteConfirmDialog,
  DuplicateDialog,
} from "@/components/features/documents";
import { useDocuments } from "@/hooks/useDocuments";
import type { DocumentResponse } from "@/lib/api/client";

// Mock quota data - replace with real API call
const MOCK_STORAGE_QUOTA = {
  used: 12.5, // MB
  limit: 50, // MB
};

export default function DocumentsPage() {
  const {
    documents,
    isLoading,
    isError,
    error,
    refetch,
    upload,
    deleteDocument,
    isDeleting,
  } = useDocuments();

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<DocumentResponse | null>(
    null
  );

  // Duplicate dialog state
  const [duplicateInfo, setDuplicateInfo] = useState<{
    file: File;
    existingDoc: DocumentResponse;
  } | null>(null);
  const [isDuplicateProcessing, setIsDuplicateProcessing] = useState(false);

  // Handle upload with duplicate checking
  const handleUpload = useCallback(
    async (file: File, onProgress: (progress: number) => void) => {
      // In a real implementation, we'd check for duplicates here
      // For now, just upload directly
      await upload({ file, onProgress });
    },
    [upload]
  );

  // Handle delete
  const handleDeleteClick = useCallback((doc: DocumentResponse) => {
    setDeleteTarget(doc);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  }, [deleteTarget, deleteDocument]);

  // Handle duplicate resolution
  const handleReplace = useCallback(async () => {
    if (!duplicateInfo) return;
    setIsDuplicateProcessing(true);
    try {
      // Delete existing, then upload new
      await deleteDocument(duplicateInfo.existingDoc.id);
      await upload({ file: duplicateInfo.file, onProgress: () => {} });
      setDuplicateInfo(null);
    } catch (err) {
      console.error("Failed to replace document:", err);
    } finally {
      setIsDuplicateProcessing(false);
    }
  }, [duplicateInfo, deleteDocument, upload]);

  const handleKeepBoth = useCallback(async () => {
    if (!duplicateInfo) return;
    setIsDuplicateProcessing(true);
    try {
      await upload({ file: duplicateInfo.file, onProgress: () => {} });
      setDuplicateInfo(null);
    } catch (err) {
      console.error("Failed to upload document:", err);
    } finally {
      setIsDuplicateProcessing(false);
    }
  }, [duplicateInfo, upload]);

  // Calculate stats
  const indexedCount = documents.filter((d) => d.status === "indexed").length;
  const processingCount = documents.filter(
    (d) => d.status === "uploading" || d.status === "processing"
  ).length;
  const storagePercent =
    (MOCK_STORAGE_QUOTA.used / MOCK_STORAGE_QUOTA.limit) * 100;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Documents */}
        <Card className="industrial-panel">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-industrial-500 uppercase tracking-wider">
                  Total Documents
                </p>
                <p className="text-2xl font-bold font-mono text-industrial-900">
                  {documents.length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-industrial-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-industrial-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Indexed */}
        <Card className="industrial-panel">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-industrial-500 uppercase tracking-wider">
                  Indexed
                </p>
                <p className="text-2xl font-bold font-mono text-success-600">
                  {indexedCount}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-success-50 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-success-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Processing */}
        <Card className="industrial-panel">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-industrial-500 uppercase tracking-wider">
                  Processing
                </p>
                <p className="text-2xl font-bold font-mono text-warning-600">
                  {processingCount}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-warning-50 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-warning-500 animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card className="industrial-panel">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-industrial-500 uppercase tracking-wider">
                  Storage Used
                </p>
                <p className="text-2xl font-bold font-mono text-industrial-900">
                  {storagePercent.toFixed(0)}%
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-industrial-100 flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-industrial-600" />
              </div>
            </div>
            <div className="mt-2 gauge-track h-1.5">
              <div
                className="h-full bg-industrial-600 rounded-full transition-all"
                style={{ width: `${storagePercent}%` }}
              />
            </div>
            <p className="text-xs text-industrial-500 mt-1 font-mono">
              {MOCK_STORAGE_QUOTA.used.toFixed(1)} / {MOCK_STORAGE_QUOTA.limit}{" "}
              MB
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error State */}
      {isError && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-danger-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-danger-900">
              Failed to load documents
            </p>
            <p className="text-sm text-danger-700">
              {error instanceof Error ? error.message : "An error occurred"}
            </p>
          </div>
        </div>
      )}

      {/* Upload Section */}
      <Card className="industrial-panel">
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Upload technical manuals, service guides, and documentation. Files
            are processed and indexed for AI-powered search.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentUploader onUpload={handleUpload} />
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card className="industrial-panel">
        <CardHeader>
          <CardTitle>Knowledge Base</CardTitle>
          <CardDescription>
            Your uploaded documents that power AI responses via SMS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentList
            documents={documents}
            isLoading={isLoading}
            onDelete={handleDeleteClick}
            onRefresh={() => refetch()}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        document={deleteTarget}
        isOpen={!!deleteTarget}
        isDeleting={isDeleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Duplicate Dialog */}
      <DuplicateDialog
        fileName={duplicateInfo?.file.name ?? ""}
        existingFileName={duplicateInfo?.existingDoc.original_filename}
        isOpen={!!duplicateInfo}
        isProcessing={isDuplicateProcessing}
        onClose={() => setDuplicateInfo(null)}
        onReplace={handleReplace}
        onKeepBoth={handleKeepBoth}
      />
    </div>
  );
}
