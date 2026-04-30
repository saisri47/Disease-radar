const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

function normalizeApiBaseUrl(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return 'http://127.0.0.1:8000';
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/$/, '');
  }
  return `https://${trimmed}`.replace(/\/$/, '');
}

export const API_BASE_URL = normalizeApiBaseUrl(rawApiBaseUrl);

export function apiUrl(path) {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
