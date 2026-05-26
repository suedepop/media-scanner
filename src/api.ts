import type { ReleaseResponse, SearchResponse } from "./types";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function getJson<T>(url: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new ApiError("Network error — is the API running?", 0);
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON body */
  }

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : null) || `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return data as T;
}

export function searchByUpc(upc: string): Promise<SearchResponse> {
  return getJson<SearchResponse>(`/api/discogs-search?upc=${encodeURIComponent(upc)}`);
}

export function getRelease(id: number, currency = "USD"): Promise<ReleaseResponse> {
  return getJson<ReleaseResponse>(
    `/api/discogs-release?id=${id}&curr=${encodeURIComponent(currency)}`
  );
}

export { ApiError };
