import type {
  CockpitAction,
  CockpitActionPreview,
  CockpitActionResult,
  CockpitIntent,
  CockpitIntentResult,
  CockpitState,
  DeploymentGuide,
  ReadinessReport
} from '../types';

const API_BASE = import.meta.env.VITE_COCKPIT_API_URL || 'http://127.0.0.1:8787';
export const COCKPIT_TOKEN_STORAGE_KEY = 'cockpit:apiToken';

export function getCockpitToken(): string {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(COCKPIT_TOKEN_STORAGE_KEY);
    if (stored) return stored;
  }
  return (import.meta.env.VITE_COCKPIT_API_TOKEN as string | undefined) ?? '';
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getCockpitToken();
  const headers = new Headers(init?.headers);
  if (!headers.has('content-type')) headers.set('content-type', 'application/json');
  if (token) headers.set('x-cockpit-token', token);

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers
  });
  const json = await res.json();
  if (!res.ok) {
    if (res.status === 401) {
      const hint = 'Set it via the operator settings UI or VITE_COCKPIT_API_TOKEN.';
      throw new Error(json.error ? `${json.error} ${hint}` : `Cockpit API requires COCKPIT_API_TOKEN. ${hint}`);
    }
    throw new Error(json.error || `Cockpit API HTTP ${res.status}`);
  }
  return json as T;
}

export function fetchCockpitState() {
  return api<CockpitState>('/api/state');
}

export async function fetchCockpitActions() {
  const payload = await api<{ actions: CockpitAction[] }>('/api/actions');
  return payload.actions;
}

export function previewCockpitAction(id: string, env: Record<string, string>) {
  return api<CockpitActionPreview>(`/api/actions/${id}/preview`, {
    method: 'POST',
    body: JSON.stringify({ env })
  });
}

export function runCockpitAction(id: string, env: Record<string, string>, confirmation: string) {
  return api<CockpitActionResult>(`/api/actions/${id}/run`, {
    method: 'POST',
    body: JSON.stringify({ env, confirmation })
  });
}

export async function fetchCockpitIntents() {
  const payload = await api<{ intents: CockpitIntent[] }>('/api/intents');
  return payload.intents;
}

export function previewCockpitIntent(id: string, args: Record<string, string>) {
  return api<CockpitIntent>(`/api/intents/${id}/preview`, {
    method: 'POST',
    body: JSON.stringify({ args })
  });
}

export function reconcileCockpitIntent(
  id: string,
  txHash: string,
  confirmation: string,
  contractAddress?: string
) {
  return api<CockpitIntentResult>(`/api/intents/${id}/reconcile`, {
    method: 'POST',
    body: JSON.stringify({ txHash, contractAddress, confirmation })
  });
}

export function fetchReadinessReport() {
  return api<ReadinessReport>('/api/readiness');
}

export function fetchDeploymentGuide() {
  return api<DeploymentGuide>('/api/guide');
}

export function exportReadinessReport(manualNotes: Record<string, string>) {
  return api<ReadinessReport>('/api/readiness/export', {
    method: 'POST',
    body: JSON.stringify({ manualNotes })
  });
}
