"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, DocumentResponse } from "@/lib/api/client";

export function useDocuments() {
  const queryClient = useQueryClient();

  const documentsQuery = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      return api.get<DocumentResponse[]>("/api/v1/documents");
    },
    refetchInterval: (query) => {
      // Poll more frequently if there are processing documents
      const data = query.state.data;
      if (!data) return false;
      const hasProcessing = data.some(
        (doc: DocumentResponse) =>
          doc.status === "uploading" || doc.status === "processing"
      );
      return hasProcessing ? 3000 : false; // Poll every 3s if processing
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      onProgress,
    }: {
      file: File;
      onProgress?: (progress: number) => void;
    }) => {
      return api.uploadFile<DocumentResponse>(
        "/api/v1/documents/upload",
        file,
        onProgress
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return api.delete(`/api/v1/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const retryMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return api.post(`/api/v1/documents/${documentId}/retry`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  return {
    documents: documentsQuery.data ?? [],
    isLoading: documentsQuery.isLoading,
    isError: documentsQuery.isError,
    error: documentsQuery.error,
    refetch: documentsQuery.refetch,
    upload: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    deleteDocument: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    retryDocument: retryMutation.mutateAsync,
    isRetrying: retryMutation.isPending,
  };
}
