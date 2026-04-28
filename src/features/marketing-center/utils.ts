import { contentStatusLabel, contentTypeLabel, reviewDecisionLabel } from "@/features/marketing-center/config";
import type {
  MarketingActivity,
  MarketingContentStatus,
  MarketingContentType,
  MarketingFileObject,
  MarketingFileRef,
  MarketingMaterial,
  MarketingReviewDecision,
  MarketingTaxonomyItem,
} from "@/types/marketing-center";

export function textOrDash(value: unknown) {
  const text = String(value ?? "").trim();
  return text || "-";
}

export function numericOrZero(value: unknown) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function joinTaxonomyNames(items?: MarketingTaxonomyItem[] | null) {
  const names = (items ?? [])
    .map((item) => String(item?.name ?? item?.code ?? "").trim())
    .filter(Boolean);
  return names.length > 0 ? names.join(", ") : "-";
}

export function prettyBytes(value?: number) {
  const size = Number(value ?? 0);
  if (!Number.isFinite(size) || size <= 0) {
    return "-";
  }
  const units = ["B", "KB", "MB", "GB"];
  let current = size;
  let index = 0;
  while (current >= 1024 && index < units.length - 1) {
    current /= 1024;
    index += 1;
  }
  return `${current.toFixed(current >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export function isImageFile(file?: MarketingFileRef | MarketingFileObject | null) {
  return String(file?.contentType ?? "").toLowerCase().startsWith("image/");
}

export function formatMarketingJson(value: unknown) {
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  return JSON.stringify(value, null, 2);
}

export function parseIdParam(rawId?: string) {
  const numeric = Number(rawId ?? 0);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

export function parseAffiliateIdsText(text: string) {
  return Array.from(
    new Set(
      text
        .split(/[\s,;\n\r\t]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function materialFileMode(material?: MarketingMaterial | null) {
  const type = String(material?.materialType ?? "").trim().toLowerCase();
  return type === "cooperation_sample" ? "cooperation" : "upload";
}

export function booleanLabel(value?: boolean | null) {
  return value ? "Yes" : "No";
}

export function statusLabel(status?: MarketingContentStatus | string) {
  return contentStatusLabel(status);
}

export function decisionLabel(decision?: MarketingReviewDecision | string) {
  return reviewDecisionLabel(decision);
}

export function contentTypeText(type?: MarketingContentType | string) {
  return contentTypeLabel(type);
}

export function materialSummary(material?: MarketingMaterial | null) {
  if (!material) {
    return [];
  }
  return [
    { label: "Title", value: textOrDash(material.title) },
    { label: "Material Type", value: textOrDash(material.materialType) },
    { label: "Legacy Material Type", value: textOrDash(material.legacyMaterialType) },
    { label: "Language", value: textOrDash(material.language?.name) },
    { label: "Category", value: textOrDash(material.category?.name) },
    { label: "Channels", value: joinTaxonomyNames(material.channels) },
    { label: "Scopes", value: joinTaxonomyNames(material.scopes) },
    { label: "Status", value: statusLabel(material.status) },
  ];
}

export function activitySummary(activity?: MarketingActivity | null) {
  if (!activity) {
    return [];
  }
  return [
    { label: "Title", value: textOrDash(activity.title) },
    { label: "Language", value: textOrDash(activity.language?.name) },
    { label: "Category", value: textOrDash(activity.category?.name) },
    { label: "Carousel", value: booleanLabel(activity.carousel) },
    { label: "Channels", value: joinTaxonomyNames(activity.channels) },
    { label: "Scopes", value: joinTaxonomyNames(activity.scopes) },
    { label: "Status", value: statusLabel(activity.status) },
    { label: "Landing URL", value: textOrDash(activity.landingUrl) },
  ];
}
