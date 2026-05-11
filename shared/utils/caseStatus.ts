import type { CaseStatusName } from './permissions';

export type CaseStatusColor = 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info';

export interface CaseStatusMeta {
  label: string;
  color: CaseStatusColor;
  icon: string;
}

export const CASE_STATUS_META: Record<CaseStatusName, CaseStatusMeta> = {
  DRAFT: { label: 'Draft', color: 'neutral', icon: 'i-ri-draft-line' },
  SUBMITTED: { label: 'Submitted', color: 'primary', icon: 'i-ri-send-plane-line' },
  NEEDS_INFO: { label: 'Needs Info', color: 'warning', icon: 'i-ri-error-warning-line' },
  ACCEPTED: { label: 'Accepted', color: 'info', icon: 'i-ri-check-line' },
  IN_PROGRESS: { label: 'In Progress', color: 'warning', icon: 'i-ri-loader-4-line' },
  COMPLETED: { label: 'Completed', color: 'success', icon: 'i-ri-checkbox-circle-line' },
  CANCELLED: { label: 'Cancelled', color: 'neutral', icon: 'i-ri-close-circle-line' },
};
