import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from "axios";
import { toast } from "sonner";
import { tokenStore } from "@/lib/http";
import type { ApiResponse } from "@/types/auth";

export interface ApiCallPreview {
  request: {
    method: string;
    url: string;
    params?: unknown;
    body?: unknown;
  };
  response: {
    status: number;
    ok: boolean;
    body: unknown;
  };
}

export class BusinessHttpError extends Error {
  preview: ApiCallPreview;

  constructor(message: string, preview: ApiCallPreview) {
    super(message);
    this.name = "BusinessHttpError";
    this.preview = preview;
  }
}

export const BUSINESS_API_BASE_URL =
  (import.meta.env.VITE_BIZ_API_BASE_URL as string) ?? "";

export const businessHttp = axios.create({
  baseURL: BUSINESS_API_BASE_URL,
  timeout: 20_000,
});

businessHttp.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
    config.headers.set("token", token);
  }
  return config;
});

function normalizeBody(data: unknown) {
  if (typeof data !== "string") {
    return data;
  }
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

function buildPreview<T>(
  config: AxiosRequestConfig,
  response: AxiosResponse<ApiResponse<T>> | null,
  fallbackBody: unknown,
): ApiCallPreview {
  return {
    request: {
      method: String(config.method ?? "GET").toUpperCase(),
      url: businessHttp.getUri(config),
      params: config.params,
      body: normalizeBody(config.data),
    },
    response: {
      status: response?.status ?? 0,
      ok: Boolean(response && response.status >= 200 && response.status < 300),
      body: response?.data ?? fallbackBody,
    },
  };
}

function handleUnauthorized(status?: number) {
  if (status !== 401) {
    return;
  }
  tokenStore.clear();
  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = `/login?redirect=${encodeURIComponent(
      window.location.pathname + window.location.search,
    )}`;
  }
}

export async function businessRequest<T>(
  config: AxiosRequestConfig,
): Promise<{
  value: T;
  envelope: ApiResponse<T>;
  preview: ApiCallPreview;
}> {
  try {
    const response = await businessHttp.request<ApiResponse<T>>(config);
    const preview = buildPreview(config, response, null);
    if (!response.data.success) {
      const message = response.data.message || "Request not successful";
      toast.error(message);
      throw new BusinessHttpError(message, preview);
    }
    return {
      value: response.data.value,
      envelope: response.data,
      preview,
    };
  } catch (error) {
    if (error instanceof BusinessHttpError) {
      throw error;
    }

    const axiosError = error as AxiosError<ApiResponse<unknown>>;
    const preview = buildPreview(
      config,
      axiosError.response ?? null,
      axiosError.response?.data ?? { message: axiosError.message },
    );
    const message =
      axiosError.response?.data?.message ??
      axiosError.message ??
      "Request failed";

    handleUnauthorized(axiosError.response?.status);
    if (axiosError.response?.status !== 401) {
      toast.error(message);
    }
    throw new BusinessHttpError(message, preview);
  }
}

export function previewToText(preview: ApiCallPreview) {
  return {
    request: JSON.stringify(preview.request, null, 2),
    response: JSON.stringify(preview.response, null, 2),
  };
}
