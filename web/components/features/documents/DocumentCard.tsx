"use client";

import { useState } from "react";
import {
  FileText,
  File,
  FileSpreadsheet,
  Code,
  MoreVertical,
  Trash2,
  Download,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DocumentResponse } from "@/lib/api/client";

interface DocumentCardProps {
  document: DocumentResponse;
  onDelete: (doc: DocumentResponse) => void;
  onRetry?: (doc: DocumentResponse) => void;
}

function getFileIcon(fileType: string) {
  switch (fileType) {
    case "pdf":
      return <FileText className="w-6 h-6 text-danger-600" />;
    case "docx":
      return <FileText className="w-6 h-6 text-blue-600" />;
    case "xlsx":
    case "csv":
      return <FileSpreadsheet className="w-6 h-6 text-success-600" />;
    case "html":
    case "md":
      return <Code className="w-6 h-6 text-purple-600" />;
    case "txt":
      return <File className="w-6 h-6 text-industrial-500" />;
    default:
      return <File className="w-6 h-6 text-industrial-400" />;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Less than 1 minute
  if (diff < 60000) return "Just now";

  // Less than 1 hour
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `${mins}m ago`;
  }

  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }

  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  }

  // Default: show date
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

const statusConfig = {
  uploading: {
    label: "Uploading",
    icon: Loader2,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    animate: true,
  },
  processing: {
    label: "Processing",
    icon: Clock,
    color: "text-warning-600",
    bg: "bg-warning-50",
    border: "border-warning-200",
    animate: true,
  },
  indexed: {
    label: "Indexed",
    icon: CheckCircle,
    color: "text-success-600",
    bg: "bg-success-50",
    border: "border-success-200",
    animate: false,
  },
  failed: {
    label: "Failed",
    icon: AlertTriangle,
    color: "text-danger-600",
    bg: "bg-danger-50",
    border: "border-danger-200",
    animate: false,
  },
};

export function DocumentCard({ document, onDelete, onRetry }: DocumentCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const status = statusConfig[document.status];
  const StatusIcon = status.icon;

  return (
    <div
      className={cn(
        "group relative industrial-panel rounded-lg overflow-hidden",
        "transition-all duration-200",
        isHovered && "shadow-lg border-industrial-300"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Status indicator stripe at top */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1",
          document.status === "indexed"
            ? "bg-success-500"
            : document.status === "processing"
              ? "bg-warning-500"
              : document.status === "failed"
                ? "bg-danger-500"
                : "bg-blue-500"
        )}
      />

      <div className="p-4 pt-5">
        {/* Header with icon and menu */}
        <div className="flex items-start justify-between mb-3">
          <div
            className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center",
              "bg-industrial-50 border border-industrial-200",
              "group-hover:bg-industrial-100 transition-colors"
            )}
          >
            {getFileIcon(document.file_type)}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuItem>
              {document.status === "failed" && onRetry && (
                <DropdownMenuItem onClick={() => onRetry(document)}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Processing
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(document)}
                className="text-danger-600 focus:text-danger-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* File name */}
        <h3
          className="font-semibold text-industrial-900 mb-1 truncate"
          title={document.original_filename}
        >
          {document.original_filename}
        </h3>

        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-industrial-500 mb-3">
          <span className="font-mono uppercase">{document.file_type}</span>
          <span className="w-1 h-1 rounded-full bg-industrial-300" />
          <span className="font-mono">{formatFileSize(document.file_size)}</span>
          <span className="w-1 h-1 rounded-full bg-industrial-300" />
          <span>{formatDate(document.created_at)}</span>
        </div>

        {/* Status badge */}
        <div
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
            status.bg,
            status.border,
            "border"
          )}
        >
          <StatusIcon
            className={cn(
              "w-3.5 h-3.5",
              status.color,
              status.animate && "animate-spin"
            )}
          />
          <span className={status.color}>{status.label}</span>
        </div>

        {/* Stats for indexed documents */}
        {document.status === "indexed" && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-industrial-100">
            {document.page_count !== null && (
              <div className="text-xs">
                <span className="font-mono font-bold text-industrial-900">
                  {document.page_count}
                </span>
                <span className="text-industrial-500 ml-1">pages</span>
              </div>
            )}
            {document.chunk_count !== null && (
              <div className="text-xs">
                <span className="font-mono font-bold text-industrial-900">
                  {document.chunk_count}
                </span>
                <span className="text-industrial-500 ml-1">chunks</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
