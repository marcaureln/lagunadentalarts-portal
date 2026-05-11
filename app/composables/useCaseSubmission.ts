import type { CaseFile, CaseType } from '~~/shared/types/case';

interface SaveCasePayload {
  patientId?: string | null;
  patientName: string;
  patientExternalId?: string | null;
  caseTypeId: string;
  data: Record<string, unknown>;
}

interface CreatedCase {
  id: string;
  patientId?: string;
  patientName: string;
  patientExternalId?: string;
  status: string;
  data: Record<string, unknown>;
  files: CaseFile[];
  caseType: CaseType;
  practice: { id: string; name: string };
  createdBy: { id: string; name: string };
}

export interface UploadProgressEvent {
  slotId: string;
  fileName: string;
  progress: number;
}

export function useCaseSubmission() {
  const toast = useToast();
  const saveMutation = useApiMutation<CreatedCase>('Failed to save case');
  const submitMutation = useApiMutation('Failed to submit case');

  const isUploadingFile = ref(false);
  const uploadError = ref<string | null>(null);
  const activeUpload = ref<{ cancel: () => Promise<void> } | null>(null);

  const cancelUpload = async (): Promise<void> => {
    await activeUpload.value?.cancel();
  };

  // Persists the case (create or update), uploads any pending files via the chunked-upload protocol,
  // optionally calls /submit. Returns the resulting case on success, or null on any failure.
  const saveCase = async (params: {
    caseId: string | null;
    payload: SaveCasePayload;
    pendingFiles: Map<string, File>;
    submit: boolean;
    successMessage?: string;
    onUploadProgress?: (event: UploadProgressEvent) => void;
  }): Promise<CreatedCase | null> => {
    let caseId = params.caseId;
    uploadError.value = null;

    const persisted = caseId
      ? await saveMutation.mutate(`/api/cases/${caseId}`, { method: 'PATCH', body: params.payload })
      : await saveMutation.mutate('/api/cases', { method: 'POST', body: params.payload });

    if (persisted === null) return null;
    caseId = persisted.id;

    isUploadingFile.value = true;
    try {
      for (const [slotId, file] of params.pendingFiles) {
        const upload = useChunkedUpload({ caseId, slotId, file });
        activeUpload.value = upload;
        const stopWatch = watch(upload.progress, (p) =>
          params.onUploadProgress?.({ slotId, fileName: file.name, progress: p })
        );
        const result = await upload.start();
        stopWatch();
        activeUpload.value = null;
        if (result === null) {
          if (upload.state.value === 'aborted') return null;
          uploadError.value = upload.error.value ?? 'Failed to upload file';
          toast.add({ description: uploadError.value, color: 'error' });
          return null;
        }
      }
    } finally {
      isUploadingFile.value = false;
      activeUpload.value = null;
    }
    params.pendingFiles.clear();

    if (params.submit) {
      const submitted = await submitMutation.mutate(
        `/api/cases/${caseId}/submit`,
        { method: 'POST' },
        { successMessage: params.successMessage }
      );
      if (submitted === null) return null;
    } else if (params.successMessage) {
      toast.add({ description: params.successMessage, color: 'success' });
    }

    return persisted;
  };

  const isBusy = computed(
    () => saveMutation.isLoading.value || isUploadingFile.value || submitMutation.isLoading.value
  );
  const isSavingDraft = computed(() => saveMutation.isLoading.value || isUploadingFile.value);
  const isSubmittingCase = computed(() => submitMutation.isLoading.value);
  const error = computed(() => saveMutation.error.value ?? uploadError.value ?? submitMutation.error.value);

  return { saveCase, cancelUpload, isBusy, isSavingDraft, isSubmittingCase, error };
}
