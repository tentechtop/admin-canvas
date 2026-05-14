import type { SettlementPaymentFile } from "@/types/affiliate-console";

function cleanPaymentFileText(value: unknown) {
  return String(value ?? "").trim();
}

function firstNonEmptyPaymentFileText(...values: unknown[]) {
  for (const value of values) {
    const text = cleanPaymentFileText(value);
    if (text) {
      return text;
    }
  }
  return "";
}

function isPaymentFileRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function fileNameFromLocation(location: string) {
  const normalized = location.split("?")[0].split("#")[0];
  const segments = normalized.split("/").filter(Boolean);
  return segments.length > 0 ? decodeURIComponent(segments[segments.length - 1]) : "";
}

export function normalizeSettlementPaymentFileItem(value: unknown): SettlementPaymentFile | null {
  if (typeof value === "string") {
    const url = cleanPaymentFileText(value);
    if (!url) {
      return null;
    }

    return {
      id: "",
      name: fileNameFromLocation(url),
      size: 0,
      path: "",
      type: "",
      url,
      role: "",
      mail: "",
      username: "",
    };
  }

  if (!isPaymentFileRecord(value)) {
    return null;
  }

  const id = firstNonEmptyPaymentFileText(value.id);
  const path = firstNonEmptyPaymentFileText(value.path);
  const url = firstNonEmptyPaymentFileText(value.url, value.downloadUrl);
  const name = firstNonEmptyPaymentFileText(
    value.name,
    value.originalName,
    value.storedName,
    fileNameFromLocation(url || path),
  );
  const type = firstNonEmptyPaymentFileText(value.type, value.contentType);
  const role = firstNonEmptyPaymentFileText(value.role);
  const mail = firstNonEmptyPaymentFileText(value.mail);
  const username = firstNonEmptyPaymentFileText(value.username);
  const rawSize = Number(value.size);
  const size = Number.isFinite(rawSize) && rawSize >= 0 ? rawSize : 0;

  if (!id && !name && !path && !type && !url && !role && !mail && !username && size === 0) {
    return null;
  }

  return {
    id,
    name,
    size,
    path,
    type,
    url,
    role,
    mail,
    username,
  };
}

export function normalizeSettlementPaymentFiles(value: unknown): SettlementPaymentFile[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeSettlementPaymentFileItem(item))
      .filter((item): item is SettlementPaymentFile => Boolean(item));
  }

  if (typeof value === "string") {
    const text = value.trim();
    if (!text) {
      return [];
    }

    if (text.startsWith("[") || text.startsWith("{")) {
      try {
        return normalizeSettlementPaymentFiles(JSON.parse(text));
      } catch {
        return [];
      }
    }

    const single = normalizeSettlementPaymentFileItem(text);
    return single ? [single] : [];
  }

  const single = normalizeSettlementPaymentFileItem(value);
  return single ? [single] : [];
}

function serializeSettlementPaymentFile(file: SettlementPaymentFile) {
  return JSON.stringify({
    id: cleanPaymentFileText(file.id),
    name: cleanPaymentFileText(file.name),
    size: Number.isFinite(Number(file.size)) && Number(file.size) >= 0 ? Number(file.size) : 0,
    path: cleanPaymentFileText(file.path),
    type: cleanPaymentFileText(file.type),
    url: cleanPaymentFileText(file.url),
    role: cleanPaymentFileText(file.role),
    mail: cleanPaymentFileText(file.mail),
    username: cleanPaymentFileText(file.username),
  });
}

export function areSettlementPaymentFilesEqual(left: unknown, right: unknown) {
  const leftFiles = normalizeSettlementPaymentFiles(left);
  const rightFiles = normalizeSettlementPaymentFiles(right);

  if (leftFiles.length !== rightFiles.length) {
    return false;
  }

  return leftFiles.every((file, index) => serializeSettlementPaymentFile(file) === serializeSettlementPaymentFile(rightFiles[index]));
}
