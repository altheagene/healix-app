import { API_BASE_URL } from "./config";

export const API_ERROR_EVENT = "api-error";

/**
 * Calls the API with the login token.
 *
 * When the server fails (5xx) or cannot be reached, this announces it with an
 * API_ERROR_EVENT, which the app shows as a banner, and hands the page the same safe
 * empty answer it got before: [] for reads, { success: false } for writes. Pages keep
 * working instead of crashing, and the user is told the data may be incomplete.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem("token");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    return failed(options, 503, "Can't reach the clinic server. Check your connection and try again.");
  }

  if (response.status === 401 && path !== "/validateuser") {
    localStorage.removeItem("token");
    localStorage.setItem("loggedIn", "false");
    window.dispatchEvent(new Event("auth-expired"));
  }

  if (response.status >= 500) {
    const body = await response.json().catch(() => ({}));
    return failed(options, response.status, body.error || "The clinic server had a problem. Please try again.");
  }

  return response;
}

function failed(options: RequestInit, status: number, message: string): Response {
  window.dispatchEvent(new CustomEvent(API_ERROR_EVENT, { detail: message }));
  const isRead = !options.method || options.method.toUpperCase() === "GET";
  const body = isRead ? [] : { success: false, error: message };
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
