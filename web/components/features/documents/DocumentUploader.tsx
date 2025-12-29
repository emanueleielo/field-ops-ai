"use client";

import { useCallback, useState } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import {
  Upload,
  FileText,
  File,
  FileSpreadsheet,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "text/plain": [".txt"],
  "text/markdown": [".md"],
  "text/html": [".html"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
  "text/csv": [".csv"],
};

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

interface UploadingFile {
  file: File;
  progress: number;
  status: "uploading" | "processing" | "done" | "error";
  error?: string;
}

interface DocumentUploaderProps {
  onUpload: (
    file: File,
    onProgress: (progress: number) => void
  ) => Promise<void>;
  disabled?: boolean;
}

function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return <FileText className="w-5 h-5 text-danger-600" />;
    case "docx":
      return <FileText className="w-5 h-5 text-blue-600" />;
    case "xlsx":
    case "csv":
      return <FileSpreadsheet className="w-5 h-5 text-success-600" />;
    default:
      return <File className="w-5 h-5 text-industrial-500" />;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function DocumentUploader({ onUpload, disabled }: DocumentUploaderProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const handleUpload = useCallback(
    async (file: File) => {
      const _uploadId = Date.now();
      const newFile: UploadingFile = {
        file,
        progress: 0,
        status: "uploading",
      };

      setUploadingFiles((prev) => [...prev, newFile]);

      try {
        await onUpload(file, (progress) => {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.file === file
                ? {
                    ...f,
                    progress,
                    status: progress === 100 ? "processing" : "uploading",
                  }
                : f
            )
          );
        });

        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.file === file ? { ...f, status: "done", progress: 100 } : f
          )
        );

        // Remove from list after success animation
        setTimeout(() => {
          setUploadingFiles((prev) => prev.filter((f) => f.file !== file));
        }, 1500);
      } catch (error) {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.file === file
              ? {
                  ...f,
                  status: "error",
                  error: error instanceof Error ? error.message : "Upload failed",
                }
              : f
          )
        );
      }
    },
    [onUpload]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setErrors([]);

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const newErrors = rejectedFiles.map((rejection) => {
          const error = rejection.errors[0];
          if (error.code === "file-too-large") {
            return `${rejection.file.name}: File too large (max 25MB)`;
          }
          if (error.code === "file-invalid-type") {
            return `${rejection.file.name}: Invalid file type`;
          }
          return `${rejection.file.name}: ${error.message}`;
        });
        setErrors(newErrors);
      }

      // Upload accepted files
      acceptedFiles.forEach(handleUpload);
    },
    [handleUpload]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: ACCEPTED_TYPES,
      maxSize: MAX_FILE_SIZE,
      disabled,
      multiple: true,
    });

  const removeUpload = (file: File) => {
    setUploadingFiles((prev) => prev.filter((f) => f.file !== file));
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative group cursor-pointer transition-all duration-200",
          "border-2 border-dashed rounded-lg p-8",
          "bg-gradient-to-br from-industrial-50 to-white",
          isDragActive && !isDragReject
            ? "border-warning-500 bg-warning-50/50 scale-[1.01]"
            : isDragReject
              ? "border-danger-500 bg-danger-50/50"
              : "border-industrial-300 hover:border-industrial-400 hover:bg-industrial-50/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />

        {/* Industrial Corner Accents */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-industrial-400 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-industrial-400 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-industrial-400 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-industrial-400 rounded-br-lg" />

        <div className="flex flex-col items-center justify-center text-center">
          <div
            className={cn(
              "w-16 h-16 rounded-lg flex items-center justify-center mb-4",
              "bg-industrial-100 group-hover:bg-industrial-200 transition-colors",
              isDragActive && !isDragReject && "bg-warning-100",
              isDragReject && "bg-danger-100"
            )}
          >
            <Upload
              className={cn(
                "w-8 h-8 transition-all",
                isDragActive && !isDragReject
                  ? "text-warning-600 scale-110"
                  : isDragReject
                    ? "text-danger-600"
                    : "text-industrial-500 group-hover:text-industrial-700"
              )}
            />
          </div>

          <h3 className="text-lg font-semibold text-industrial-900 mb-1">
            {isDragActive
              ? isDragReject
                ? "Invalid file type"
                : "Drop files here"
              : "Upload Technical Documents"}
          </h3>

          <p className="text-sm text-industrial-500 mb-4 max-w-sm">
            Drag and drop your manuals, or click to browse.
            <br />
            Supported: PDF, DOCX, TXT, MD, XLSX, CSV, HTML
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="pointer-events-none"
            >
              <Upload className="w-4 h-4 mr-2" />
              Browse Files
            </Button>
            <span className="text-xs text-industrial-400 font-mono">
              Max 25MB
            </span>
          </div>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-danger-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              {errors.map((error, i) => (
                <p key={i} className="text-sm text-danger-700">
                  {error}
                </p>
              ))}
            </div>
            <button
              onClick={() => setErrors([])}
              className="ml-auto p-1 text-danger-500 hover:text-danger-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((upload, index) => (
            <div
              key={`${upload.file.name}-${index}`}
              className={cn(
                "industrial-panel rounded-lg p-4",
                upload.status === "error" && "border-danger-300 bg-danger-50/50"
              )}
            >
              <div className="flex items-center gap-3">
                {getFileIcon(upload.file.name)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-industrial-900 truncate">
                      {upload.file.name}
                    </span>
                    <span className="text-xs font-mono text-industrial-500">
                      {formatFileSize(upload.file.size)}
                    </span>
                  </div>

                  {upload.status === "error" ? (
                    <p className="text-xs text-danger-600">{upload.error}</p>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Progress
                        value={upload.progress}
                        className="h-1.5 flex-1"
                        variant={upload.status === "done" ? "success" : "default"}
                      />
                      <span className="text-xs font-mono text-industrial-500 w-12 text-right">
                        {upload.status === "processing" ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>...</span>
                          </span>
                        ) : upload.status === "done" ? (
                          "Done"
                        ) : (
                          `${upload.progress}%`
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {upload.status === "error" && (
                  <button
                    onClick={() => removeUpload(upload.file)}
                    className="p-1 text-danger-500 hover:text-danger-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
