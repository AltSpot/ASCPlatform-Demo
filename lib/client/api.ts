/**
 * Browser-side API client.
 *
 * The single door between the UI and the server. Components never call
 * fetch directly — so headers, credentials and error shape stay uniform,
 * and swapping transport later touches one file.
 */
'use client';

import type {
  BankView,
  DealView,
  DocumentView,
  ProfileView,
  SessionUser,
  SubscriptionView,
  VaultView,
  WizardView,
  InvestGate,
} from '../domain';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const code = payload?.error?.code ?? 'unknown';
    const message = payload?.error?.message ?? 'Request failed';
    throw new ApiError(response.status, code, message);
  }

  return payload as T;
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) });

const patch = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) });

const put = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'PUT', body: JSON.stringify(body ?? {}) });

const del = <T>(path: string) => request<T>(path, { method: 'DELETE' });

export interface SessionPayload {
  user: SessionUser | null;
  wizard: WizardView | null;
  gate: InvestGate | null;
}

export const api = {
  // ---- auth ----
  login: (email: string, password: string) =>
    post<{ user: SessionUser; wizardComplete: boolean }>('/auth/login', {
      email,
      password,
    }),
  logout: () => post<void>('/auth/logout'),
  session: () => request<SessionPayload>('/session'),

  // ---- onboarding ----
  wizard: () => request<WizardView>('/wizard'),
  completeWizard: () => post<WizardView>('/wizard/complete'),

  accreditationDownloaded: () => post<WizardView>('/accreditation/letter'),
  verifyAccreditation: () => post<WizardView>('/accreditation/verify'),

  vault: () => request<VaultView>('/vault'),
  saveVault: (input: Record<string, string>) => put<VaultView>('/vault', input),

  uploadId: (fileName: string) => post<WizardView>('/kyc/id', { fileName }),
  captureSelfie: () => post<WizardView>('/kyc/selfie'),
  submitKyc: () => post<WizardView>('/kyc/submit'),

  // ---- investor entities ----
  profiles: () => request<ProfileView[]>('/profiles'),
  createProfile: (input: { type: string; name: string }) =>
    post<ProfileView>('/profiles', input),
  setDefaultProfile: (id: string) => post<void>(`/profiles/${id}/default`),

  bank: () => request<BankView | null>('/bank'),
  linkBank: (institution: string) => post<BankView>('/bank', { institution }),

  // ---- marketplace ----
  deals: () => request<DealView[]>('/deals'),
  deal: (id: string) => request<DealView>(`/deals/${id}`),

  // ---- subscriptions ----
  subscriptions: () => request<SubscriptionView[]>('/subscriptions'),
  subscription: (id: string) => request<SubscriptionView>(`/subscriptions/${id}`),
  resumable: (dealId: string) =>
    request<SubscriptionView | null>(`/subscriptions/resumable?dealId=${dealId}`),
  startSubscription: (input: {
    dealId: string;
    profileId: string | null;
    amount: number;
  }) => post<SubscriptionView>('/subscriptions', input),
  updateSubscription: (
    id: string,
    input: { profileId?: string | null; amount?: number },
  ) => patch<SubscriptionView>(`/subscriptions/${id}`, input),
  confirmSection: (id: string, section: number) =>
    post<SubscriptionView>(`/subscriptions/${id}/confirm`, { section }),
  signSubscription: (id: string, signature: string, bodyHtml?: string) =>
    post<SubscriptionView>(`/subscriptions/${id}/sign`, { signature, bodyHtml }),
  fundSubscription: (id: string, method: string) =>
    post<SubscriptionView>(`/subscriptions/${id}/fund`, { method }),
  cancelSubscription: (id: string) => del<void>(`/subscriptions/${id}`),

  // ---- documents ----
  documents: () => request<DocumentView[]>('/documents'),

  // ---- demo controls ----
  resetDemo: () => post<void>('/demo/reset'),
};
