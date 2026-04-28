import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  ClipboardList,
  FileText,
  FolderTree,
  Link2,
  Megaphone,
  ScrollText,
  Settings,
  ShieldCheck,
} from "lucide-react";
import type { ResourceInfo } from "@/types/auth";
import type {
  MarketingContentStatus,
  MarketingContentType,
  MarketingReviewDecision,
  MarketingTaxonomyType,
} from "@/types/marketing-center";

export const marketingRoutes = {
  workbench: "/marketing/workbench",
  materials: "/marketing/material",
  materialCreate: "/marketing/material/create",
  materialDetail: (id: number | string) => `/marketing/material/${id}`,
  materialEdit: (id: number | string) => `/marketing/material/${id}/edit`,
  activities: "/marketing/campaign",
  activityCreate: "/marketing/campaign/create",
  activityDetail: (id: number | string) => `/marketing/campaign/${id}`,
  activityEdit: (id: number | string) => `/marketing/campaign/${id}/edit`,
  reviews: "/marketing/compliance",
  links: "/marketing/link",
  reports: "/marketing/report",
  config: "/marketing/config",
  audit: "/marketing/audit",
} as const;

export const marketingStaticMenu: ResourceInfo = {
  resourceCode: "marketing.center",
  resourceName: "Marketing Center",
  icon: "megaphone",
  type: 1,
  sort: 9990,
  kidResource: [
    {
      resourceCode: "marketing.center.workbench",
      resourceName: "Workbench",
      icon: "layoutdashboard",
      type: 1,
      path: marketingRoutes.workbench,
      sort: 1,
    },
    {
      resourceCode: "marketing.center.materials",
      resourceName: "Material Center",
      icon: "foldertree",
      type: 1,
      path: marketingRoutes.materials,
      sort: 2,
    },
    {
      resourceCode: "marketing.center.activities",
      resourceName: "Campaign Center",
      icon: "activity",
      type: 1,
      path: marketingRoutes.activities,
      sort: 3,
    },
    {
      resourceCode: "marketing.center.reviews",
      resourceName: "Compliance Review",
      icon: "shield",
      type: 1,
      path: marketingRoutes.reviews,
      sort: 4,
    },
    {
      resourceCode: "marketing.center.links",
      resourceName: "Attribution Links",
      icon: "link2",
      type: 1,
      path: marketingRoutes.links,
      sort: 5,
    },
    {
      resourceCode: "marketing.center.reports",
      resourceName: "Data Reports",
      icon: "trend",
      type: 1,
      path: marketingRoutes.reports,
      sort: 6,
    },
    {
      resourceCode: "marketing.center.config",
      resourceName: "Basic Config",
      icon: "settings",
      type: 1,
      path: marketingRoutes.config,
      sort: 7,
    },
    {
      resourceCode: "marketing.center.audit",
      resourceName: "Operation Audit",
      icon: "scrolltext",
      type: 1,
      path: marketingRoutes.audit,
      sort: 8,
    },
  ],
};

export const marketingQuickLinks: Array<{
  title: string;
  description: string;
  path: string;
  icon: LucideIcon;
}> = [
  {
    title: "Material Center",
    description: "Manage draft, published, and archived marketing materials.",
    path: marketingRoutes.materials,
    icon: FolderTree,
  },
  {
    title: "Campaign Center",
    description: "Create activity landing pages and publish carousel-ready campaigns.",
    path: marketingRoutes.activities,
    icon: Megaphone,
  },
  {
    title: "Compliance Review",
    description: "Review pending materials and activities before publishing.",
    path: marketingRoutes.reviews,
    icon: ShieldCheck,
  },
  {
    title: "Attribution Links",
    description: "Generate single or batch activity-specific promotion links.",
    path: marketingRoutes.links,
    icon: Link2,
  },
  {
    title: "Data Reports",
    description: "Inspect the current publish snapshot while richer reports wait for backend support.",
    path: marketingRoutes.reports,
    icon: BarChart3,
  },
  {
    title: "Operation Audit",
    description: "Track operation logs and review decisions across the marketing workflow.",
    path: marketingRoutes.audit,
    icon: ScrollText,
  },
];

export const marketingStatusOptions: Array<{
  value: MarketingContentStatus;
  label: string;
}> = [
  { value: "CONTENT_STATUS_DRAFT", label: "Draft" },
  { value: "CONTENT_STATUS_PENDING_REVIEW", label: "Pending Review" },
  { value: "CONTENT_STATUS_REJECTED", label: "Rejected" },
  { value: "CONTENT_STATUS_APPROVED", label: "Approved" },
  { value: "CONTENT_STATUS_PUBLISHED", label: "Published" },
  { value: "CONTENT_STATUS_OFFLINE", label: "Offline" },
];

export const reviewDecisionOptions: Array<{
  value: MarketingReviewDecision;
  label: string;
}> = [
  { value: "REVIEW_DECISION_APPROVE", label: "Approve" },
  { value: "REVIEW_DECISION_REJECT", label: "Reject" },
];

export const contentTypeOptions: Array<{
  value: MarketingContentType;
  label: string;
}> = [
  { value: "CONTENT_TYPE_MATERIAL", label: "Material" },
  { value: "CONTENT_TYPE_ACTIVITY", label: "Activity" },
];

export const taxonomyTabs: Array<{
  value: MarketingTaxonomyType;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}> = [
  {
    value: "TAXONOMY_TYPE_LANGUAGE",
    label: "Language",
    shortLabel: "language",
    icon: FileText,
  },
  {
    value: "TAXONOMY_TYPE_CHANNEL",
    label: "Channel",
    shortLabel: "channel",
    icon: Link2,
  },
  {
    value: "TAXONOMY_TYPE_SCOPE",
    label: "Scope",
    shortLabel: "scope",
    icon: ClipboardList,
  },
  {
    value: "TAXONOMY_TYPE_MATERIAL_CATEGORY",
    label: "Material Category",
    shortLabel: "material_category",
    icon: FolderTree,
  },
  {
    value: "TAXONOMY_TYPE_ACTIVITY_CATEGORY",
    label: "Activity Category",
    shortLabel: "activity_category",
    icon: Megaphone,
  },
];

export const marketingStatusLabelMap: Record<MarketingContentStatus, string> = {
  CONTENT_STATUS_UNSPECIFIED: "Unspecified",
  CONTENT_STATUS_DRAFT: "Draft",
  CONTENT_STATUS_PENDING_REVIEW: "Pending Review",
  CONTENT_STATUS_REJECTED: "Rejected",
  CONTENT_STATUS_APPROVED: "Approved",
  CONTENT_STATUS_PUBLISHED: "Published",
  CONTENT_STATUS_OFFLINE: "Offline",
};

export const reviewDecisionLabelMap: Record<MarketingReviewDecision, string> = {
  REVIEW_DECISION_UNSPECIFIED: "Unspecified",
  REVIEW_DECISION_APPROVE: "Approve",
  REVIEW_DECISION_REJECT: "Reject",
};

export const contentTypeLabelMap: Record<MarketingContentType, string> = {
  CONTENT_TYPE_MATERIAL: "Material",
  CONTENT_TYPE_ACTIVITY: "Activity",
};

export const taxonomyTypeLabelMap: Record<MarketingTaxonomyType, string> = {
  TAXONOMY_TYPE_LANGUAGE: "Language",
  TAXONOMY_TYPE_CHANNEL: "Channel",
  TAXONOMY_TYPE_SCOPE: "Scope",
  TAXONOMY_TYPE_MATERIAL_CATEGORY: "Material Category",
  TAXONOMY_TYPE_ACTIVITY_CATEGORY: "Activity Category",
};

export function contentStatusLabel(status?: string) {
  return marketingStatusLabelMap[status as MarketingContentStatus] ?? status ?? "-";
}

export function reviewDecisionLabel(decision?: string) {
  return reviewDecisionLabelMap[decision as MarketingReviewDecision] ?? decision ?? "-";
}

export function contentTypeLabel(contentType?: string) {
  return contentTypeLabelMap[contentType as MarketingContentType] ?? contentType ?? "-";
}

export function taxonomyTypeLabel(type?: string) {
  return taxonomyTypeLabelMap[type as MarketingTaxonomyType] ?? type ?? "-";
}

export function canEditContent(status?: string) {
  return [
    "CONTENT_STATUS_DRAFT",
    "CONTENT_STATUS_REJECTED",
    "CONTENT_STATUS_OFFLINE",
  ].includes(String(status ?? ""));
}

export function canDeleteContent(status?: string) {
  return canEditContent(status);
}

export function canSubmitReview(status?: string) {
  return [
    "CONTENT_STATUS_DRAFT",
    "CONTENT_STATUS_REJECTED",
    "CONTENT_STATUS_OFFLINE",
  ].includes(String(status ?? ""));
}

export function canPublishContent(status?: string) {
  return String(status ?? "") === "CONTENT_STATUS_APPROVED";
}

export function canOfflineContent(status?: string) {
  return [
    "CONTENT_STATUS_APPROVED",
    "CONTENT_STATUS_PUBLISHED",
  ].includes(String(status ?? ""));
}

export function isPendingReview(status?: string) {
  return String(status ?? "") === "CONTENT_STATUS_PENDING_REVIEW";
}

export function isPublished(status?: string) {
  return String(status ?? "") === "CONTENT_STATUS_PUBLISHED";
}

export function isRejected(status?: string) {
  return String(status ?? "") === "CONTENT_STATUS_REJECTED";
}

export function hasMarketingMenu(list: ResourceInfo[]) {
  const queue = [...list];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }
    const path = String(current.path ?? "");
    const code = String(current.resourceCode ?? "");
    if (
      path.startsWith("/marketing/") ||
      path === "/marketing" ||
      path.startsWith("/marketing-center") ||
      /^marketing[._-]?center/i.test(code) ||
      /marketing/i.test(code)
    ) {
      return true;
    }
    if (current.kidResource?.length) {
      queue.push(...current.kidResource);
    }
  }
  return false;
}
