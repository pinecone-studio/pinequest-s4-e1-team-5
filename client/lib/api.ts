const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error("NEXT_PUBLIC_API_URL is not configured");
}

export const API_URL = apiUrl.replace(/\/$/, "");

export function apiEndpoint(path: string) {
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function apiFetch(path: string, init?: RequestInit) {
  return fetch(apiEndpoint(path), init);
}
