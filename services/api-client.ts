import type { z } from "zod";
import { dashboardApiErrorSchema, parseDashboardApi } from "@/lib/api/dashboard/schemas";
import { isNotaApiConfigured } from "@/lib/config/api";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function formatApiErrorDetail(status: number, detail: string) {
  if (!detail) {
    return `Request failed (${status})`;
  }

  try {
    const parsed = JSON.parse(detail);
    const apiError = dashboardApiErrorSchema.safeParse(parsed);
    if (apiError.success) {
      const issue = apiError.data.issues?.[0]?.message;
      if (issue) return `${apiError.data.error}: ${issue}`;
      if (apiError.data.detail) return `${apiError.data.error}: ${apiError.data.detail}`;
      return apiError.data.error;
    }
  } catch {
    // Plain-text error body
  }

  return detail;
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
  responseSchema?: z.ZodType<T>
): Promise<T> {
  if (!isNotaApiConfigured()) {
    throw new Error("NOTA API is not configured (set NEXT_PUBLIC_NOTA_API_BASE_URL)");
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`/api/nota${normalizedPath}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 401) {
      throw new ApiError("Not signed in to NOTA. Sign in from the Controller tab.", response.status);
    }
    throw new ApiError(formatApiErrorDetail(response.status, detail), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload: unknown = await response.json();

  if (responseSchema) {
    return parseDashboardApi(responseSchema, payload, path);
  }

  return payload as T;
}
