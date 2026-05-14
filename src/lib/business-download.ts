import axios, { type AxiosRequestConfig } from "axios";
import { businessHttp } from "@/lib/business-http";
import { tokenStore } from "@/lib/http";
import type { ApiResponse } from "@/types/auth";

export interface AuthenticatedFileDownloadOptions
  extends Pick<
    AxiosRequestConfig,
    "data" | "headers" | "method" | "params" | "paramsSerializer" | "signal"
  > {
  url: string;
  fileName?: string;
}

export interface AuthenticatedFileDownloadResult {
  fileName?: string;
}

export interface AuthenticatedExportTaskOptions extends AuthenticatedFileDownloadOptions {
  pollIntervalMs?: number;
  timeoutMs?: number;
}

interface ExportDownloadLinkValue {
  fileUrl?: unknown;
  fileName?: unknown;
  expiredAt?: unknown;
}

interface ExportDownloadLinkEnvelope {
  success?: unknown;
  errCode?: unknown;
  message?: unknown;
  value?: ExportDownloadLinkValue | null;
}

interface ExportDownloadTaskValue {
  status?: unknown;
  fileName?: unknown;
}

interface ExportDownloadTaskEnvelope {
  success?: unknown;
  code?: unknown;
  errCode?: unknown;
  message?: unknown;
  value?: (ExportDownloadTaskValue & ExportDownloadLinkValue) | null;
}

const DEFAULT_EXPORT_POLL_INTERVAL_MS = 2_000;
const DEFAULT_EXPORT_TIMEOUT_MS = 5 * 60_000;

function normalizeBusinessDownloadUrl(rawUrl: string) {
  const normalized = rawUrl.trim();
  if (!normalized || typeof window === "undefined") {
    return normalized;
  }

  try {
    const parsed = new URL(normalized, window.location.origin);

    // Export file URLs may come back as absolute biz-backend addresses.
    // Rewriting them to same-origin paths lets the frontend dev proxy handle
    // the request and avoids browser CORS failures.
    if (
      parsed.origin !== window.location.origin &&
      parsed.pathname.startsWith("/admin/")
    ) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }

    return parsed.toString();
  } catch {
    return normalized;
  }
}

function redirectToLogin(status?: number) {
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

function isApiResponseLike(
  value: unknown,
): value is Partial<ApiResponse<unknown>> & { code?: unknown; message?: unknown } {
  return Boolean(value) && typeof value === "object";
}

function normalizeErrorMessage(value: unknown, fallback: string) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (isApiResponseLike(value) && typeof value.message === "string" && value.message.trim()) {
    return value.message.trim();
  }

  return fallback;
}

async function readErrorMessage(data: unknown, fallback: string) {
  if (data instanceof Blob) {
    const text = (await data.text()).trim();
    if (!text) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(text) as unknown;
      return normalizeErrorMessage(parsed, text);
    } catch {
      return text;
    }
  }

  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data) as unknown;
      return normalizeErrorMessage(parsed, data);
    } catch {
      return normalizeErrorMessage(data, fallback);
    }
  }

  return normalizeErrorMessage(data, fallback);
}

async function readJsonPayload(data: unknown) {
  if (data instanceof Blob) {
    const text = (await data.text()).trim();
    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text) as unknown;
    } catch {
      return null;
    }
  }

  if (typeof data === "string") {
    const text = data.trim();
    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text) as unknown;
    } catch {
      return null;
    }
  }

  return data;
}

function decodeFileName(value: string) {
  const trimmed = value.trim().replace(/^"(.*)"$/, "$1");
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

function getFileNameFromDisposition(disposition?: string) {
  if (!disposition) {
    return undefined;
  }

  const utf8Match = disposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeFileName(utf8Match[1]);
  }

  const fallbackMatch = disposition.match(/filename\s*=\s*([^;]+)/i);
  if (fallbackMatch?.[1]) {
    return decodeFileName(fallbackMatch[1]);
  }

  return undefined;
}

function getFileNameFromUrl(rawUrl: string) {
  const normalized = rawUrl.split("?")[0].split("#")[0];
  const segments = normalized.split("/").filter(Boolean);
  const lastSegment = segments.length > 0 ? segments[segments.length - 1] : "";
  return lastSegment ? decodeFileName(lastSegment) : undefined;
}

function triggerBlobDownload(blob: Blob, fileName?: string) {
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName?.trim() || "download";
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1_000);
}

function triggerUrlDownload(url: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

function parseExpiryTimestamp(value: unknown) {
  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value < 1_000_000_000_000 ? value * 1_000 : value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    if (/^\d+$/.test(trimmed)) {
      const numeric = Number(trimmed);
      if (Number.isFinite(numeric) && numeric > 0) {
        return numeric < 1_000_000_000_000 ? numeric * 1_000 : numeric;
      }
    }

    const timestamp = Date.parse(trimmed);
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  return null;
}

function formatExpiryTime(value: unknown) {
  const timestamp = parseExpiryTimestamp(value);
  if (!timestamp) {
    return "";
  }

  return new Date(timestamp).toLocaleString();
}

function buildExpiredMessage(value: unknown) {
  const formatted = formatExpiryTime(value);
  return formatted
    ? `Download link expired at ${formatted}. Please export again.`
    : "Download link expired. Please export again.";
}

function normalizeDownloadFailureMessage(message: string, expiredAt?: unknown) {
  if (/expired|expire/i.test(message)) {
    return buildExpiredMessage(expiredAt);
  }

  return message;
}

function getAuthenticatedFetchHeaders() {
  const headers = new Headers();
  const token = tokenStore.get().trim();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("token", token);
  }

  return headers;
}

function throwIfAborted(signal?: AbortSignal) {
  if (!signal?.aborted) {
    return;
  }

  throw signal.reason instanceof Error
    ? signal.reason
    : new DOMException("The operation was aborted.", "AbortError");
}

async function delay(ms: number, signal?: AbortSignal) {
  if (ms <= 0) {
    return;
  }

  throwIfAborted(signal);

  await new Promise<void>((resolve, reject) => {
    const timerId = window.setTimeout(() => {
      signal?.removeEventListener("abort", handleAbort);
      resolve();
    }, ms);

    function handleAbort() {
      window.clearTimeout(timerId);
      reject(
        signal?.reason instanceof Error
          ? signal.reason
          : new DOMException("The operation was aborted.", "AbortError"),
      );
    }

    signal?.addEventListener("abort", handleAbort, { once: true });
  });
}

async function readFetchPayload(response: Response) {
  const text = (await response.text()).trim();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function isProcessingPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const envelope = payload as ExportDownloadTaskEnvelope;
  if (!envelope.success) {
    return false;
  }

  const value =
    envelope.value && typeof envelope.value === "object" ? envelope.value : null;
  const status = String(value?.status ?? "").trim().toUpperCase();
  return status === "PENDING" || status === "PROCESSING";
}

async function downloadByResolvedUrl({
  url,
  fileName,
  expiredAt,
}: {
  url: string;
  fileName?: string;
  expiredAt?: unknown;
}): Promise<AuthenticatedFileDownloadResult> {
  try {
    const normalizedUrl = normalizeBusinessDownloadUrl(url);
    const response = await businessHttp.request<Blob>({
      method: "GET",
      responseType: "blob",
      url: normalizedUrl,
    });

    const contentType = String(response.headers["content-type"] ?? "").toLowerCase();
    if (contentType.includes("application/json")) {
      const payload = await readJsonPayload(response.data);
      const message = normalizeDownloadFailureMessage(
        normalizeErrorMessage(payload, "Download failed"),
        expiredAt,
      );
      throw new Error(message);
    }

    const resolvedFileName =
      fileName?.trim() ||
      getFileNameFromDisposition(String(response.headers["content-disposition"] ?? "")) ||
      getFileNameFromUrl(normalizedUrl);

    triggerBlobDownload(response.data, resolvedFileName);
    return { fileName: resolvedFileName };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      redirectToLogin(error.response?.status);
      const message = normalizeDownloadFailureMessage(
        await readErrorMessage(error.response?.data, error.message || "Download failed"),
        expiredAt,
      );
      throw new Error(message);
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Download failed");
  }
}

async function pollExportDownloadUrl({
  url,
  fileName,
  expiredAt,
  pollIntervalMs,
  timeoutMs,
  signal,
}: {
  url: string;
  fileName?: string;
  expiredAt?: unknown;
  pollIntervalMs: number;
  timeoutMs: number;
  signal?: AbortSignal;
}): Promise<AuthenticatedFileDownloadResult> {
  const normalizedUrl = normalizeBusinessDownloadUrl(url);
  const deadline = Date.now() + timeoutMs;

  while (Date.now() <= deadline) {
    throwIfAborted(signal);

    const response = await fetch(normalizedUrl, {
      method: "GET",
      credentials: "include",
      redirect: "manual",
      headers: getAuthenticatedFetchHeaders(),
      cache: "no-store",
      signal,
    });

    if (response.status === 202) {
      await delay(pollIntervalMs, signal);
      continue;
    }

    if (response.status === 401) {
      redirectToLogin(401);
      throw new Error("Unauthorized");
    }

    if (response.status === 500) {
      const payload = await readFetchPayload(response);
      const message = normalizeDownloadFailureMessage(
        normalizeErrorMessage(payload, "Download failed"),
        expiredAt,
      );
      throw new Error(message);
    }

    if (response.status !== 200) {
      throw new Error(`Unexpected export status: ${response.status}`);
    }

    const contentType = String(response.headers.get("content-type") ?? "").toLowerCase();
    if (contentType.includes("application/json")) {
      const payload = (await readFetchPayload(response)) as ExportDownloadTaskEnvelope | null;
      if (isProcessingPayload(payload)) {
        await delay(pollIntervalMs, signal);
        continue;
      }

      const envelope = payload && typeof payload === "object" ? payload : null;
      const value =
        envelope?.value && typeof envelope.value === "object" ? envelope.value : null;
      const resolvedUrl = String(
        value?.fileUrl ?? response.headers.get("Location") ?? "",
      ).trim();
      const resolvedFileName =
        String(value?.fileName ?? fileName ?? "").trim() || undefined;

      if (!envelope?.success) {
        throw new Error(
          normalizeDownloadFailureMessage(
            normalizeErrorMessage(envelope, "Download failed"),
            expiredAt,
          ),
        );
      }

      if (!resolvedUrl) {
        throw new Error("Export succeeded but no download link was returned. Please export again.");
      }

      triggerUrlDownload(normalizeBusinessDownloadUrl(resolvedUrl));
      return { fileName: resolvedFileName };
    }

    const redirectedUrl = String(response.headers.get("Location") ?? "").trim();
    if (!redirectedUrl) {
      throw new Error("Export succeeded but no download link was returned. Please export again.");
    }

    triggerUrlDownload(normalizeBusinessDownloadUrl(redirectedUrl));
    return { fileName };
  }

  throw new Error("Export timed out. Please try again.");
}

export async function downloadAuthenticatedFile(
  options: AuthenticatedFileDownloadOptions,
): Promise<AuthenticatedFileDownloadResult> {
  try {
    const normalizedUrl = normalizeBusinessDownloadUrl(options.url);
    const response = await businessHttp.request<Blob>({
      ...options,
      method: options.method ?? "GET",
      responseType: "blob",
      url: normalizedUrl,
    });

    const contentType = String(response.headers["content-type"] ?? "").toLowerCase();
    if (contentType.includes("application/json")) {
      const payload = (await readJsonPayload(response.data)) as ExportDownloadLinkEnvelope | null;
      const envelope = payload && typeof payload === "object" ? payload : null;
      const value =
        envelope?.value && typeof envelope.value === "object" ? envelope.value : null;
      const fileUrl = String(value?.fileUrl ?? "").trim();
      const fileName =
        String(value?.fileName ?? options.fileName ?? "").trim() || undefined;
      const expiredAt = value?.expiredAt;
      const message = normalizeDownloadFailureMessage(
        normalizeErrorMessage(envelope, "Download failed"),
        expiredAt,
      );

      if (!envelope?.success) {
        throw new Error(message);
      }

      if (!fileUrl) {
        throw new Error(
          message === "Download failed"
            ? "Export succeeded but no download link was returned. Please export again."
            : message,
        );
      }

      const expiryTimestamp = parseExpiryTimestamp(expiredAt);
      if (expiryTimestamp !== null && expiryTimestamp <= Date.now()) {
        throw new Error(buildExpiredMessage(expiredAt));
      }

      return downloadByResolvedUrl({
        url: fileUrl,
        fileName,
        expiredAt,
      });
    }

    const resolvedFileName =
      options.fileName ||
      getFileNameFromDisposition(String(response.headers["content-disposition"] ?? ""));

    triggerBlobDownload(response.data, resolvedFileName);
    return { fileName: resolvedFileName };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      redirectToLogin(error.response?.status);
      const message = await readErrorMessage(
        error.response?.data,
        error.message || "Download failed",
      );
      throw new Error(message);
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Download failed");
  }
}

export async function downloadAuthenticatedExportFile(
  options: AuthenticatedExportTaskOptions,
): Promise<AuthenticatedFileDownloadResult> {
  const {
    pollIntervalMs = DEFAULT_EXPORT_POLL_INTERVAL_MS,
    timeoutMs = DEFAULT_EXPORT_TIMEOUT_MS,
    ...requestOptions
  } = options;

  try {
    const normalizedUrl = normalizeBusinessDownloadUrl(requestOptions.url);
    const response = await businessHttp.request<Blob>({
      ...requestOptions,
      method: requestOptions.method ?? "GET",
      responseType: "blob",
      url: normalizedUrl,
    });

    const contentType = String(response.headers["content-type"] ?? "").toLowerCase();
    if (!contentType.includes("application/json")) {
      const resolvedFileName =
        requestOptions.fileName ||
        getFileNameFromDisposition(String(response.headers["content-disposition"] ?? ""));

      triggerBlobDownload(response.data, resolvedFileName);
      return { fileName: resolvedFileName };
    }

    const payload = (await readJsonPayload(response.data)) as ExportDownloadLinkEnvelope | null;
    const envelope = payload && typeof payload === "object" ? payload : null;
    const value =
      envelope?.value && typeof envelope.value === "object" ? envelope.value : null;
    const fileUrl = String(value?.fileUrl ?? "").trim();
    const fileName =
      String(value?.fileName ?? requestOptions.fileName ?? "").trim() || undefined;
    const expiredAt = value?.expiredAt;
    const message = normalizeDownloadFailureMessage(
      normalizeErrorMessage(envelope, "Download failed"),
      expiredAt,
    );

    if (!envelope?.success) {
      throw new Error(message);
    }

    if (!fileUrl) {
      throw new Error(
        message === "Download failed"
          ? "Export succeeded but no download link was returned. Please export again."
          : message,
      );
    }

    const expiryTimestamp = parseExpiryTimestamp(expiredAt);
    if (expiryTimestamp !== null && expiryTimestamp <= Date.now()) {
      throw new Error(buildExpiredMessage(expiredAt));
    }

    return pollExportDownloadUrl({
      url: fileUrl,
      fileName,
      expiredAt,
      pollIntervalMs,
      timeoutMs,
      signal: requestOptions.signal,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      redirectToLogin(error.response?.status);
      const message = await readErrorMessage(
        error.response?.data,
        error.message || "Download failed",
      );
      throw new Error(message);
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Download failed");
  }
}

export function isDownloadAbortError(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }

  if (axios.isAxiosError(error) && error.code === "ERR_CANCELED") {
    return true;
  }

  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.name === "CanceledError")
  );
}
