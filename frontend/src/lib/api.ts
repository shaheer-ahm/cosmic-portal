import { supabase } from "./supabase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("Missing VITE_API_BASE_URL.");
}

function errorMessageFrom(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;

  const detail = (data as { detail?: unknown }).detail;

  if (typeof detail === "string" && detail) return detail;

  if (Array.isArray(detail)) {
    const messages = detail
      .map((entry) => {
        if (!entry || typeof entry !== "object") return String(entry);
        const { loc, msg } = entry as { loc?: unknown[]; msg?: string };
        const field = Array.isArray(loc)
          ? loc.filter((part) => part !== "body").join(".")
          : "";
        return field ? `${field}: ${msg ?? "invalid"}` : (msg ?? "Invalid value");
      })
      .filter(Boolean);

    if (messages.length > 0) return messages.join("\n");
  }

  return fallback;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (session?.access_token) {
    headers.set(
      "Authorization",
      `Bearer ${session.access_token}`,
    );
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Can't reach the FitPortal server. Check your connection and try again in a moment.",
    );
  }

  if (!response.ok) {
    let message = `API error ${response.status}`;

    try {
      message = errorMessageFrom(await response.json(), message);
    } catch {
      // Response did not contain JSON.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}