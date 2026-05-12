export const CASE_TYPES_WITH_SLIP_UPLOAD = ['CROWN_BRIDGE', 'SURGICAL_GUIDE'] as const;
export type SlipUploadCaseTypeKey = (typeof CASE_TYPES_WITH_SLIP_UPLOAD)[number];

export const SLIP_MODE_KEY = '_slipMode';
export const SLIP_MODES = ['UPLOAD', 'FORM'] as const;
export type SlipMode = (typeof SLIP_MODES)[number];

export const LAB_SLIP_SLOT_ID = 'labSlip';

export function supportsSlipUpload(caseTypeKey: string): boolean {
  return (CASE_TYPES_WITH_SLIP_UPLOAD as readonly string[]).includes(caseTypeKey);
}
