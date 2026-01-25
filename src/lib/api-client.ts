import { ApiResponse } from "../../shared/types"
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...init })
  // Check if the response is actually JSON before trying to parse it
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    console.error(`[API Error] Non-JSON response from ${path}:`, text);
    // Provide a more helpful error message based on status code
    let errorMessage = `Request failed: ${res.status} ${res.statusText}`;
    if (res.status === 413) {
      errorMessage = "File too large (Server Limit)";
    } else if (res.status === 500) {
      errorMessage = "Server error occurred";
    }
    throw new Error(errorMessage);
  }
  const json = (await res.json()) as ApiResponse<T>
  if (!res.ok || !json.success || json.data === undefined) throw new Error(json.error || 'Request failed')
  return json.data
}