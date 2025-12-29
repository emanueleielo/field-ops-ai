"use client";

import { FileText, Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentCard } from "./DocumentCard";
import type { DocumentResponse } from "@/lib/api/client";

interface DocumentListProps {
  documents: DocumentResponse[];
  isLoading: boolean;
  onDelete: (doc: DocumentResponse) => void;
  onRetry?: (doc: DocumentResponse) => void;
  onRefresh?: () => void;
}

export function DocumentList({
  documents,
  isLoading,
  onDelete,
  onRetry,
  onRefresh,
}: DocumentListProps) {
  // Group documents by status for better organization
  const processingDocs = documents.filter(
    (d) => d.status === "uploading" || d.status === "processing"
  );
  const indexedDocs = documents.filter((d) => d.status === "indexed");
  const failedDocs = documents.filter((d) => d.status === "failed");

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="industrial-panel rounded-lg p-4 animate-pulse"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-industrial-100" />
              <div className="w-8 h-8 rounded bg-industrial-100" />
            </div>
            <div className="h-5 bg-industrial-100 rounded w-3/4 mb-2" />
            <div className="h-4 bg-industrial-100 rounded w-1/2 mb-3" />
            <div className="h-6 bg-industrial-100 rounded w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-20 h-20 rounded-xl bg-industrial-100 flex items-center justify-center mb-6">
          <Inbox className="w-10 h-10 text-industrial-400" />
        </div>
        <h3 className="text-xl font-semibold text-industrial-900 mb-2">
          No documents yet
        </h3>
        <p className="text-industrial-500 text-center max-w-md mb-6">
          Upload your first technical manual to start getting AI-powered answers
          via SMS. Drag and drop files above or click to browse.
        </p>
        <div className="flex items-center gap-2 text-xs text-industrial-400">
          <FileText className="w-4 h-4" />
          <span>Supported: PDF, DOCX, TXT, MD, XLSX, CSV, HTML</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-lg font-semibold text-industrial-900">
            {documents.length} Document{documents.length !== 1 ? "s" : ""}
          </span>
          <span className="text-sm text-industrial-500 ml-2">
            in knowledge base
          </span>
        </div>
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="text-industrial-500"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        )}
      </div>

      {/* Processing Documents - Show at top with warning styling */}
      {processingDocs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-warning-500 animate-pulse" />
            <h4 className="text-sm font-medium text-industrial-700 uppercase tracking-wider">
              Processing ({processingDocs.length})
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processingDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onDelete={onDelete}
                onRetry={onRetry}
              />
            ))}
          </div>
        </div>
      )}

      {/* Failed Documents - Show prominently */}
      {failedDocs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-danger-500" />
            <h4 className="text-sm font-medium text-danger-700 uppercase tracking-wider">
              Failed ({failedDocs.length})
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {failedDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onDelete={onDelete}
                onRetry={onRetry}
              />
            ))}
          </div>
        </div>
      )}

      {/* Indexed Documents */}
      {indexedDocs.length > 0 && (
        <div>
          {(processingDocs.length > 0 || failedDocs.length > 0) && (
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-success-500" />
              <h4 className="text-sm font-medium text-industrial-700 uppercase tracking-wider">
                Indexed ({indexedDocs.length})
              </h4>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {indexedDocs.map((doc, index) => (
              <div
                key={doc.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <DocumentCard
                  document={doc}
                  onDelete={onDelete}
                  onRetry={onRetry}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
