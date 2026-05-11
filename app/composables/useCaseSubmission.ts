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

export function useCaseSubmission() {
  const saveMutation = useApiMutation<CreatedCase>('Failed to save case');
  const fileMutation = useApiMutation('Failed to upload file');
  const submitMutation = useApiMutation('Failed to submit case');

  // Persists the case (create or update), uploads any pending files, optionally calls /submit.
  // Returns the resulting case on success, or null on any failure (toasts already fired by useApiMutation).
  const saveCase = async (params: {
    caseId: string | null;
    payload: SaveCasePayload;
    pendingFiles: Map<string, File>;
    submit: boolean;
    successMessage?: string;
  }): Promise<CreatedCase | null> => {
    let caseId = params.caseId;

    const persisted = caseId
      ? await saveMutation.mutate(`/api/cases/${caseId}`, { method: 'PATCH', body: params.payload })
      : await saveMutation.mutate('/api/cases', { method: 'POST', body: params.payload });

    if (persisted === null) return null;
    caseId = persisted.id;

    for (const [slotId, file] of params.pendingFiles) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('slotId', slotId);
      const upload = await fileMutation.mutate(`/api/cases/${caseId}/files`, { method: 'POST', body: fd });
      if (upload === null) return null;
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
      const toast = useToast();
      toast.add({ description: params.successMessage, color: 'success' });
    }

    return persisted;
  };

  const isBusy = computed(
    () => saveMutation.isLoading.value || fileMutation.isLoading.value || submitMutation.isLoading.value
  );
  const isSavingDraft = computed(() => saveMutation.isLoading.value || fileMutation.isLoading.value);
  const isSubmittingCase = computed(() => submitMutation.isLoading.value);
  const error = computed(() => saveMutation.error.value ?? fileMutation.error.value ?? submitMutation.error.value);

  return { saveCase, isBusy, isSavingDraft, isSubmittingCase, error };
}
