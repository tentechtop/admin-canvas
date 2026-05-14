import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  ChevronDown,
  Loader2,
  RefreshCcw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { affiliateConsoleApi, CONSOLE_PLATFORM_CODE } from "@/api/affiliate-console";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { previewToText, BusinessHttpError } from "@/lib/business-http";
import { cn } from "@/lib/utils";
import type {
  AffiliateAuditQuery,
  AffiliateCommissionRateLogValue,
  AffiliateKycReviewListValue,
  AffiliateKycReviewRow,
  AffiliateReviewLogEntry,
  AffiliateTrafficReviewListValue,
  AffiliateTrafficReviewRow,
  AuthUserInfo,
  KycReviewStatus,
  TrafficReviewStatus,
} from "@/types/affiliate-console";
import {
  EmptyState,
  Field,
  PageIntro,
  StatCard,
  StatusBadge,
} from "@/features/console/shared";
import { controlClass, prettyJson } from "@/features/console/shared-utils";
import { toast } from "sonner";

type AuditTab = "traffic" | "kyc";
type DetailLogMode = AuditTab | "commission";
type AuditRow = AffiliateTrafficReviewRow | AffiliateKycReviewRow;

type DetailDialogState = {
  open: boolean;
  mode: AuditTab;
  row: AuditRow | null;
  loading: boolean;
  requestText: string;
  responseText: string;
};

type ReviewDialogState = {
  open: boolean;
  mode: AuditTab;
  row: AuditRow | null;
  status: TrafficReviewStatus | KycReviewStatus | "";
  submitting: boolean;
  accountType: string;
  bdAdminId: string;
  remark: string;
};

type ReviewLogState = {
  loading: boolean;
  entries: AffiliateReviewLogEntry[];
  requestText: string;
  responseText: string;
};

type LogDetailDialogState = {
  open: boolean;
  mode: DetailLogMode;
  entry: AffiliateReviewLogEntry | null;
};

type CommissionRateState = {
  affiliateId: string;
  loading: boolean;
  loaded: boolean;
  saving: boolean;
  tier: string;
  originalTier: string;
  spreadPercentage: string;
  originalSpreadPercentage: string;
  loadError: string;
  logsOpen: boolean;
  logsLoading: boolean;
  logsLoaded: boolean;
  logs: AffiliateReviewLogEntry[];
  logsRequestText: string;
  logsResponseText: string;
  logError: string;
};

type ModificationReviewAction = "APPROVE" | "REJECT";

type ModificationApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

type ModificationReviewDialogState = {
  open: boolean;
  application: GroupedModificationApplication | null;
  action: ModificationReviewAction;
  remark: string;
  submitting: boolean;
};

type ModificationDiffEntry = {
  field: string;
  label: string;
  before: string;
  after: string;
};

type GroupedModificationApplication = {
  key: string;
  mode: AuditTab;
  typeLabel: string;
  affiliateId: string;
  attemptNo: string;
  logId: string;
  status: ModificationApplicationStatus;
  submitEntry: AffiliateReviewLogEntry;
  latestEntry: AffiliateReviewLogEntry;
  entries: AffiliateReviewLogEntry[];
  submitTime: string;
  reviewTime: string;
  applicant: string;
  reviewer: string;
  submitRemark: string;
  reviewRemark: string;
  diffEntries: ModificationDiffEntry[];
  snapshotHighlights: Array<{ key: string; label: string; value: string }>;
};

const defaultTrafficQuery: AffiliateAuditQuery = {
  currentPage: "1",
  pageSize: "10",
  trafficStatus: "PENDING",
  mail: "",
  affiliateCode: "",
  referralCode: "",
  startDate: "",
  endDate: "",
};

const defaultKycQuery: AffiliateAuditQuery = {
  currentPage: "1",
  pageSize: "10",
  idKYCStatus: "PENDING",
  name: "",
  mail: "",
  countryCodes: "",
  affiliateCode: "",
  referralCode: "",
  owner: "",
  inviteCode: "",
  shortLink: "",
  liveAccount: "",
  startDate: "",
  endDate: "",
};

const OWNER_ALL = "__ALL__";

const initialDetailDialogState: DetailDialogState = {
  open: false,
  mode: "traffic",
  row: null,
  loading: false,
  requestText: "",
  responseText: "",
};

const initialReviewDialogState: ReviewDialogState = {
  open: false,
  mode: "traffic",
  row: null,
  status: "",
  submitting: false,
  accountType: "",
  bdAdminId: "",
  remark: "",
};

const initialReviewLogState: ReviewLogState = {
  loading: false,
  entries: [],
  requestText: "",
  responseText: "",
};

const initialLogDetailDialogState: LogDetailDialogState = {
  open: false,
  mode: "traffic",
  entry: null,
};

const initialCommissionRateState: CommissionRateState = {
  affiliateId: "",
  loading: false,
  loaded: false,
  saving: false,
  tier: "",
  originalTier: "",
  spreadPercentage: "",
  originalSpreadPercentage: "",
  loadError: "",
  logsOpen: false,
  logsLoading: false,
  logsLoaded: false,
  logs: [],
  logsRequestText: "",
  logsResponseText: "",
  logError: "",
};

const initialModificationReviewDialogState: ModificationReviewDialogState = {
  open: false,
  application: null,
  action: "APPROVE",
  remark: "",
  submitting: false,
};

const accountTypes = ["INDIVIDUAL", "COMPANY"];
const modificationChangeKeys = {
  kyc: "id_kyc_profile_change",
  traffic: "traffic_resource_profile_change",
} as const;

function parseRoleCodes(value: string) {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildPreviewTextFromError(error: unknown) {
  if (error instanceof BusinessHttpError) {
    return previewToText(error.preview);
  }

  return {
    request: prettyJson({ message: "Request preview unavailable" }),
    response: prettyJson({
      message: error instanceof Error ? error.message : String(error),
    }),
  };
}

function nextPage(current: string | number | undefined, delta: number) {
  return String(Math.max(1, Number(current || "1") + delta));
}

function statusForRow(mode: AuditTab, row?: AuditRow | null) {
  return mode === "traffic"
    ? String((row as AffiliateTrafficReviewRow | null | undefined)?.trafficResourceStatus ?? "")
    : String((row as AffiliateKycReviewRow | null | undefined)?.idKYCStatus ?? "");
}

function trafficAuditTimeForRow(row?: AffiliateTrafficReviewRow | null) {
  return String(row?.trafficReviewTime ?? "").trim() || "-";
}

function kycAuditTimeForRow(row?: AffiliateKycReviewRow | null) {
  return String(row?.kycReviewTime ?? "").trim() || "-";
}

function ownerForRow(row?: AuditRow | null) {
  return String(row?.bdOwnerUsernameSnapshot ?? row?.owner ?? "").trim() || "-";
}

function websitesForRow(row?: AffiliateTrafficReviewRow | null) {
  const websites = row?.websites;

  if (Array.isArray(websites)) {
    const normalized = websites
      .map((item) => String(item ?? "").trim())
      .filter(Boolean);
    if (normalized.length > 0) {
      return normalized.join(", ");
    }
  }

  const text = String(websites ?? "").trim();
  if (text) {
    return text;
  }

  return "-";
}

function trafficReviewerForRow(row?: AffiliateTrafficReviewRow | null) {
  return String(row?.trafficReviewer ?? row?.reviewerUsernameSnapshot ?? "").trim() || "-";
}

function kycReviewerForRow(row?: AffiliateKycReviewRow | null) {
  return String(row?.kycReviewer ?? row?.reviewerUsernameSnapshot ?? "").trim() || "-";
}

function trafficApplicationTimeForRow(row?: AffiliateTrafficReviewRow | null) {
  return String(row?.trafficApplicationTime ?? row?.createTime ?? "").trim() || "-";
}

function kycApplicationTimeForRow(row?: AffiliateKycReviewRow | null) {
  return String(row?.kycApplicationTime ?? row?.createTime ?? "").trim() || "-";
}

function kycRemarkForRow(row?: AffiliateKycReviewRow | null) {
  return String(row?.kycRemark ?? "").trim() || "-";
}

function normalizeBdIdentity(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function pushUniqueCandidate(target: string[], value: unknown) {
  const normalized = String(value ?? "").trim();
  if (normalized && !target.includes(normalized)) {
    target.push(normalized);
  }
}

function findBdUserByIdentity(users: AuthUserInfo[], candidate: string) {
  const normalizedCandidate = normalizeBdIdentity(candidate);

  if (!normalizedCandidate) {
    return null;
  }

  return (
    users.find((user) => String(user.adminId ?? "").trim() === candidate.trim()) ??
    users.find((user) => normalizeBdIdentity(user.username) === normalizedCandidate) ??
    users.find((user) => normalizeBdIdentity(user.email) === normalizedCandidate) ??
    users.find((user) => normalizeBdIdentity(bdLabel(user)) === normalizedCandidate) ??
    null
  );
}

function resolveReviewDialogBdAdminId(
  users: AuthUserInfo[],
  row?: AuditRow | null,
  entries: AffiliateReviewLogEntry[] = [],
  currentBdAdminId?: string,
) {
  const current = String(currentBdAdminId ?? "").trim();

  if (current && users.some((user) => String(user.adminId ?? "").trim() === current)) {
    return current;
  }

  const adminIdCandidates: string[] = [];
  const identityCandidates: string[] = [];

  pushUniqueCandidate(identityCandidates, row?.bdOwnerUsernameSnapshot);
  pushUniqueCandidate(identityCandidates, row?.owner);

  entries.forEach((entry) => {
    const parsed = parseLogChangeData(entry);

    pushUniqueCandidate(identityCandidates, entry.bdOwnerUsernameSnapshot);
    pushUniqueCandidate(identityCandidates, entry.owner);
    pushUniqueCandidate(adminIdCandidates, parsed.after.bd_owner_admin_id);
    pushUniqueCandidate(adminIdCandidates, parsed.snapshot.bd_owner_admin_id);
    pushUniqueCandidate(identityCandidates, parsed.after.bd_owner_username_snapshot);
    pushUniqueCandidate(identityCandidates, parsed.snapshot.bd_owner_username_snapshot);
  });

  for (const candidateId of adminIdCandidates) {
    const matchedUser = findBdUserByIdentity(users, candidateId);
    if (matchedUser?.adminId !== undefined && matchedUser?.adminId !== null) {
      return String(matchedUser.adminId);
    }
  }

  for (const candidateText of identityCandidates) {
    const matchedUser = findBdUserByIdentity(users, candidateText);
    if (matchedUser?.adminId !== undefined && matchedUser?.adminId !== null) {
      return String(matchedUser.adminId);
    }
  }

  return current;
}

function bdLabel(user: AuthUserInfo) {
  const username = String(user.username ?? "").trim();
  const email = String(user.email ?? "").trim();

  if (username && email && username !== email) {
    return `${username} (${email})`;
  }

  return username || email || `Admin ${user.adminId ?? "-"}`;
}

function accountTypeOptions(...values: Array<string | undefined>) {
  const options = new Set(accountTypes);

  values.forEach((value) => {
    const normalized = String(value ?? "").trim();
    if (normalized) {
      options.add(normalized);
    }
  });

  return Array.from(options);
}

function QuerySummary({
  data,
}: {
  data:
    | AffiliateTrafficReviewListValue
    | AffiliateKycReviewListValue;
}) {
  return (
    <div className="text-sm text-muted-foreground">
      Total {data.total ?? 0} rows. Page {data.currentPage ?? 1} / {data.totalPages ?? 1}
    </div>
  );
}

const logFieldLabels: Record<string, string> = {
  affiliate_id: "Affiliate ID",
  affiliate_code: "Affiliate Code",
  referral_code: "Referral Code",
  mail: "Email",
  name: "Name",
  country_code: "Country",
  compensation_model: "Compensation Model",
  spread_percentage: "Commission Rate",
  tier: "Tier",
  has_fixed_spread_percentage: "Fixed Commission Rate",
  websites: "Websites",
  short_link: "Short Link",
  operator_id: "Operator ID",
  operator_name: "Operator Name",
  traffic_resource_status: "Traffic Status",
  traffic_resource_approved_by: "Traffic Approved By",
  id_kyc_status: "KYC Status",
  id_approved_by: "KYC Approved By",
  id_approver_notes: "KYC Notes",
  bd_owner_admin_id: "BD Owner Admin ID",
  bd_owner_username_snapshot: "BD Owner",
  id_account_type: "Account Type",
  id_first_name: "First Name",
  id_last_name: "Last Name",
  id_phone: "Phone",
  id_other_phone: "Other Phone",
  id_address: "Address",
  id_city: "City",
  id_zip: "Zip",
  id_type: "Document Type",
  id_number: "Document Number",
  id_birthday: "Birthday",
  id_proof_of_address_img: "Proof Of Address Image",
  id_img: "ID Image",
  id_mitrade_live_account: "Mitrade Live Account",
  id_state: "State",
  id_company_name: "Company Name",
  id_company_reg: "Company Registration Number",
  id_main_office_phone: "Main Office Phone",
  id_office_address: "Office Address",
  id_office_city: "Office City",
  id_office_zip: "Office Zip",
  id_company_reg_cert_img: "Company Registration Certificate",
  request_traffic_resource_status: "Requested Traffic Status",
  request_id_kyc_status: "Requested KYC Status",
  request_id_approver_notes: "Requested KYC Notes",
  application_type: "Application Type",
  submitted_by_affiliate_id: "Submitted By Affiliate ID",
  submitted_by_affiliate_name: "Submitted By",
  effective_status: "Effective Status",
  review_action: "Review Action",
  review_remark: "Review Remark",
  review_operator_id: "Review Operator ID",
  review_operator_name: "Review Operator Name",
  application_log_id: "Application Log ID",
};

function ensureRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function formatLogValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  if (Array.isArray(value)) {
    return value.length === 0 ? "-" : value.map((item) => String(item)).join(", ");
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return prettyJson(value);
}

function formatCommissionRateText(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized ? `${normalized}%` : "-";
}

function logFieldLabel(key: string) {
  return logFieldLabels[key] ?? humanizeToken(key);
}

function parseLogChangeData(entry: AffiliateReviewLogEntry) {
  const raw = String(entry.changeData ?? "").trim();

  if (!raw) {
    return {
      raw: "",
      parsed: false,
      diff: {},
      before: {},
      after: {},
      snapshot: {},
    };
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      raw,
      parsed: true,
      diff: ensureRecord(parsed.diff),
      before: ensureRecord(parsed.before),
      after: ensureRecord(parsed.after),
      snapshot: ensureRecord(parsed.snapshot),
    };
  } catch {
    return {
      raw,
      parsed: false,
      diff: {},
      before: {},
      after: {},
      snapshot: {},
    };
  }
}

function sortedRecordEntries(record: Record<string, unknown>) {
  return Object.entries(record).sort(([left], [right]) => left.localeCompare(right));
}

function buildSnapshotHighlights(
  entry: AffiliateReviewLogEntry,
  snapshot: Record<string, unknown>,
) {
  const candidateKeys = [
    "name",
    "mail",
    "affiliate_code",
    "referral_code",
    "compensation_model",
    "spread_percentage",
    "tier",
    "has_fixed_spread_percentage",
    "traffic_resource_status",
    "id_kyc_status",
    "bd_owner_username_snapshot",
    "short_link",
    "operator_name",
  ];

  return candidateKeys
    .filter((key) => snapshot[key] !== undefined && snapshot[key] !== "")
    .map((key) => ({
      key,
      label: logFieldLabel(key),
      value: formatLogValue(snapshot[key]),
    }))
    .concat(
      entry.remark?.trim()
        ? [{ key: "remark", label: "Remark", value: entry.remark.trim() }]
        : [],
    );
}

function pickFirstText(
  entry: Record<string, unknown>,
  keys: string[],
) {
  for (const key of keys) {
    const value = entry[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
  }
  return "";
}

function humanizeToken(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function logModeLabel(mode: DetailLogMode) {
  if (mode === "traffic") {
    return "traffic";
  }
  if (mode === "commission") {
    return "commission rate";
  }
  return "KYC";
}

function normalizeLogEntries(value: unknown): AffiliateReviewLogEntry[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is AffiliateReviewLogEntry =>
        Boolean(item) && typeof item === "object" && !Array.isArray(item),
    );
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;
  const listKeys = ["list", "resultList", "records", "items", "data", "rows", "logs"];

  for (const key of listKeys) {
    const nested = record[key];
    if (Array.isArray(nested)) {
      return nested.filter(
        (item): item is AffiliateReviewLogEntry =>
          Boolean(item) && typeof item === "object" && !Array.isArray(item),
      );
    }
  }

  return [];
}

function normalizeCommissionRateLogValue(value: AffiliateCommissionRateLogValue | unknown) {
  const record =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as AffiliateCommissionRateLogValue)
      : {};
  const logs = Array.isArray(record.logs) ? record.logs : normalizeLogEntries(record);
  const logTier = extractCommissionTierFromEntries(logs);

  return {
    spreadPercentage: String(record.spreadPercentage ?? "").trim(),
    tier: logTier,
    logs,
  };
}

function extractAuditDetailRoot(value: unknown) {
  const record = ensureRecord(value);
  const nestedValue = ensureRecord(record.value);
  return Object.keys(nestedValue).length > 0 ? nestedValue : record;
}

function extractCommissionRateFromAuditDetail(value: unknown) {
  const detail = extractAuditDetailRoot(value);
  const candidates = [
    detail.commissionRate,
    detail.spreadPercentage,
    detail.spread_percentage,
  ];

  for (const candidate of candidates) {
    const normalized = String(candidate ?? "").trim();
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function extractCommissionTierFromAuditDetail(value: unknown) {
  const detail = extractAuditDetailRoot(value);
  const candidates = [detail.tier, detail.rsTier, detail.fixedTier];

  for (const candidate of candidates) {
    const normalized = String(candidate ?? "").trim();
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function extractCommissionTierFromEntries(entries: AffiliateReviewLogEntry[]) {
  for (const entry of entries) {
    const parsed = parseLogChangeData(entry);
    const candidates = [
      parsed.after.tier,
      parsed.snapshot.tier,
      parsed.before.tier,
      ensureRecord(parsed.diff.tier).after,
      ensureRecord(parsed.diff.tier).before,
      (entry as Record<string, unknown>).tier,
    ];

    for (const candidate of candidates) {
      const normalized = String(candidate ?? "").trim();
      if (normalized) {
        return normalized;
      }
    }
  }

  return "";
}

function summarizeLogEntry(mode: DetailLogMode, entry: AffiliateReviewLogEntry) {
  const record = entry as Record<string, unknown>;
  const changeKey = String(entry.changeKey ?? "").trim();
  const eventType = String(entry.eventType ?? "").trim().toUpperCase();
  const parsed = parseLogChangeData(entry);
  const afterStatus = pickFirstText(record, [
    mode === "traffic"
      ? "trafficResourceStatus"
      : mode === "kyc"
        ? "idKYCStatus"
        : "status",
    "afterStatus",
    "newStatus",
    "toStatus",
    "status",
  ]);
  const beforeStatus = pickFirstText(record, [
    "beforeStatus",
    "oldStatus",
    "fromStatus",
  ]);
  const operator = pickFirstText(record, [
    "operatorName",
    "operator",
    "approvedBy",
    "updatedBy",
    "createdBy",
    "adminName",
    "username",
    "userName",
  ]);
  const time = pickFirstText(record, [
    "operationTime",
    "auditTime",
    "updateTime",
    "createTime",
    "updatedTime",
    "createdTime",
    "gmtCreate",
  ]);
  const action = pickFirstText(record, [
    "actionName",
    "action",
    "operationType",
    "eventType",
  ]);
  const note = pickFirstText(record, [
    "remark",
    "reason",
    "description",
    "notes",
    "comment",
    "message",
  ]);
  const accountType = pickFirstText(record, ["accountType"]);
  const bdOwner = pickFirstText(record, [
    "bdOwnerUsernameSnapshot",
    "bdOwnerName",
    "owner",
  ]);
  const currentRate =
    parsed.after.spread_percentage ??
    parsed.snapshot.spread_percentage ??
    record.spreadPercentage;
  const previousRate =
    parsed.before.spread_percentage ??
    ensureRecord(parsed.diff.spread_percentage).before;
  const currentTier = parsed.after.tier ?? parsed.snapshot.tier;
  const previousTier =
    parsed.before.tier ??
    ensureRecord(parsed.diff.tier).before;

  const isModificationSubmit =
    eventType === "SUBMIT" &&
    ((mode === "kyc" && changeKey === modificationChangeKeys.kyc) ||
      (mode === "traffic" && changeKey === modificationChangeKeys.traffic));

  const summaryParts: string[] = [];
  let title = "";
  let status = afterStatus || action;
  const chips = [
    accountType ? `Account Type: ${accountType}` : "",
    bdOwner ? `BD Owner: ${bdOwner}` : "",
  ].filter(Boolean);

  if (mode === "commission") {
    title = "Commission Rate Update";
    status = eventType || "UPDATED";

    if (previousRate !== undefined || currentRate !== undefined) {
      if (
        previousRate !== undefined &&
        previousRate !== "" &&
        currentRate !== undefined &&
        currentRate !== ""
      ) {
        summaryParts.push(
          `Commission rate changed from ${formatCommissionRateText(previousRate)} to ${formatCommissionRateText(currentRate)}.`,
        );
      } else if (currentRate !== undefined && currentRate !== "") {
        summaryParts.push(
          `Commission rate recorded at ${formatCommissionRateText(currentRate)}.`,
        );
      }
    }

    if (
      previousTier !== undefined &&
      previousTier !== "" &&
      currentTier !== undefined &&
      currentTier !== "" &&
      String(previousTier) !== String(currentTier)
    ) {
      summaryParts.push(`Tier changed from ${String(previousTier)} to ${String(currentTier)}.`);
    } else if (currentTier !== undefined && currentTier !== "") {
      chips.push(`Tier: ${String(currentTier)}`);
    }

    const compensationModel = pickFirstText(parsed.snapshot, ["compensation_model"]);
    if (compensationModel) {
      chips.push(`Compensation Model: ${compensationModel}`);
    }
  } else if (isModificationSubmit) {
    title = `${mode === "traffic" ? "Traffic" : "KYC"} Modification Application`;
    summaryParts.push(
      `${mode === "traffic" ? "Traffic profile" : "KYC profile"} change request submitted for review.`,
    );
  } else if (beforeStatus && afterStatus && beforeStatus !== afterStatus) {
    title = `${humanizeToken(afterStatus)}`;
    summaryParts.push(
      `Status changed from ${humanizeToken(beforeStatus)} to ${humanizeToken(afterStatus)}.`,
    );
  } else if (afterStatus) {
    title = `${humanizeToken(afterStatus)}`;
    summaryParts.push(`Status recorded as ${humanizeToken(afterStatus)}.`);
  } else if (action) {
    title = humanizeToken(action);
    summaryParts.push(`Action ${humanizeToken(action)} was recorded.`);
  } else {
    title = `${mode === "traffic" ? "Traffic" : "KYC"} review event`;
  }

  if (operator) {
    summaryParts.push(`Operator: ${operator}.`);
  }

  return {
    title,
    status,
    time,
    note,
    summary: summaryParts.join(" ") || "A review log record was found for this affiliate.",
    chips,
  };
}

function compareLogEntries(left: AffiliateReviewLogEntry, right: AffiliateReviewLogEntry) {
  const leftTime = String(
    left.createTime ?? left.updateTime ?? left.operationTime ?? left.auditTime ?? "",
  ).trim();
  const rightTime = String(
    right.createTime ?? right.updateTime ?? right.operationTime ?? right.auditTime ?? "",
  ).trim();

  if (leftTime !== rightTime) {
    return leftTime.localeCompare(rightTime);
  }

  const leftId = Number(left.id ?? 0);
  const rightId = Number(right.id ?? 0);
  return leftId - rightId;
}

function modificationTypeLabel(mode: AuditTab) {
  return mode === "traffic"
    ? "Traffic Profile Modification"
    : "KYC Profile Modification";
}

function modificationStatusFromEntry(entry: AffiliateReviewLogEntry): ModificationApplicationStatus {
  const eventType = String(entry.eventType ?? "").trim().toUpperCase();
  if (eventType === "APPROVE") {
    return "APPROVED";
  }
  if (eventType === "REJECT") {
    return "REJECTED";
  }
  return "PENDING";
}

function buildModificationApplications(
  mode: AuditTab,
  entries: AffiliateReviewLogEntry[],
): GroupedModificationApplication[] {
  const groups = new Map<string, AffiliateReviewLogEntry[]>();

  entries.forEach((entry) => {
    const attemptNo = String(entry.attemptNo ?? "").trim();
    if (!attemptNo) {
      return;
    }

    const bucket = groups.get(attemptNo) ?? [];
    bucket.push(entry);
    groups.set(attemptNo, bucket);
  });

  return Array.from(groups.entries())
    .map(([attemptNo, groupEntries]) => {
      const sortedEntries = [...groupEntries].sort(compareLogEntries);
      const submitEntry = sortedEntries.find((entry) => {
        const eventType = String(entry.eventType ?? "").trim().toUpperCase();
        const changeKey = String(entry.changeKey ?? "").trim();
        return (
          eventType === "SUBMIT" &&
          changeKey === modificationChangeKeys[mode]
        );
      });

      if (!submitEntry) {
        return null;
      }

      const latestEntry = sortedEntries[sortedEntries.length - 1];
      const parsedSubmit = parseLogChangeData(submitEntry);
      const parsedLatest = parseLogChangeData(latestEntry);
      const submitRecord = submitEntry as Record<string, unknown>;
      const latestRecord = latestEntry as Record<string, unknown>;
      const diffEntries = sortedRecordEntries(parsedSubmit.diff).map(([field, diffValue]) => {
        const diffRecord = ensureRecord(diffValue);
        return {
          field,
          label: logFieldLabel(field),
          before: formatLogValue(diffRecord.before),
          after: formatLogValue(diffRecord.after),
        };
      });
      const snapshotHighlights = buildSnapshotHighlights(submitEntry, parsedSubmit.snapshot);

      return {
        key: `${mode}-${attemptNo}-${String(submitEntry.id ?? latestEntry.id ?? attemptNo)}`,
        mode,
        typeLabel: modificationTypeLabel(mode),
        affiliateId: String(submitEntry.affiliateId ?? latestEntry.affiliateId ?? ""),
        attemptNo,
        logId: String(submitEntry.id ?? ""),
        status: modificationStatusFromEntry(latestEntry),
        submitEntry,
        latestEntry,
        entries: sortedEntries,
        submitTime: pickFirstText(submitRecord, [
          "createTime",
          "updateTime",
          "operationTime",
          "auditTime",
        ]),
        reviewTime:
          String(latestEntry.id ?? "") === String(submitEntry.id ?? "")
            ? ""
            : pickFirstText(latestRecord, [
                "createTime",
                "updateTime",
                "operationTime",
                "auditTime",
              ]),
        applicant:
          pickFirstText(parsedSubmit.snapshot, [
            "submitted_by_affiliate_name",
            "name",
            "mail",
          ]) ||
          pickFirstText(submitRecord, [
            "operatorName",
            "operator",
            "operatorId",
          ]),
        reviewer:
          String(latestEntry.id ?? "") === String(submitEntry.id ?? "")
            ? ""
            : pickFirstText(parsedLatest.snapshot, [
                "review_operator_name",
                "operator_name",
              ]) ||
              pickFirstText(latestRecord, [
                "operatorName",
                "operator",
                "operatorId",
              ]),
        submitRemark: pickFirstText(submitRecord, [
          "remark",
          "reason",
          "description",
          "notes",
          "comment",
          "message",
        ]),
        reviewRemark:
          String(latestEntry.id ?? "") === String(submitEntry.id ?? "")
            ? ""
            : pickFirstText(parsedLatest.snapshot, ["review_remark"]) ||
              pickFirstText(latestRecord, [
                "remark",
                "reason",
                "description",
                "notes",
                "comment",
                "message",
              ]),
        diffEntries,
        snapshotHighlights,
      } satisfies GroupedModificationApplication;
    })
    .filter((item): item is GroupedModificationApplication => Boolean(item))
    .sort((left, right) => compareLogEntries(right.latestEntry, left.latestEntry));
}

function ModificationApplicationsPanel({
  loading,
  applications,
  onInspect,
  onApprove,
  onReject,
}: {
  loading: boolean;
  applications: GroupedModificationApplication[];
  onInspect: (entry: AffiliateReviewLogEntry, mode: AuditTab) => void;
  onApprove: (application: GroupedModificationApplication) => void;
  onReject: (application: GroupedModificationApplication) => void;
}) {
  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border bg-muted/20 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading modification applications...
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <EmptyState
        title="No modification applications"
        description="No approved-profile change requests were returned in the current log streams."
      />
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <Card key={application.key} className="shadow-sm">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={application.status} />
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {application.typeLabel}
                  </span>
                </div>
                <CardTitle className="text-lg">
                  Attempt {application.attemptNo}
                </CardTitle>
                <CardDescription>
                  Submitted {application.submitTime || "at an unknown time"}
                  {application.applicant ? ` by ${application.applicant}` : ""}.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onInspect(application.submitEntry, application.mode)}
                >
                  Inspect submit log
                </Button>
                {application.status === "PENDING" ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onApprove(application)}
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => onReject(application)}
                    >
                      Reject
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <MetaItem
                label="Log ID"
                value={<span className="font-mono">{application.logId || "-"}</span>}
              />
              <MetaItem
                label="Affiliate ID"
                value={<span className="font-mono">{application.affiliateId || "-"}</span>}
              />
              <MetaItem label="Applicant" value={application.applicant || "-"} />
              <MetaItem
                label="Review Result"
                value={
                  application.status === "PENDING"
                    ? "Waiting for review"
                    : `${application.status} ${application.reviewTime ? `at ${application.reviewTime}` : ""}`
                }
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-3 rounded-2xl border bg-muted/10 p-4">
                <div className="text-sm font-semibold">Submit Remark</div>
                <div className="text-sm text-muted-foreground">
                  {application.submitRemark || "No submit remark provided."}
                </div>
              </div>
              <div className="space-y-3 rounded-2xl border bg-muted/10 p-4">
                <div className="text-sm font-semibold">Review Remark</div>
                <div className="text-sm text-muted-foreground">
                  {application.reviewRemark || (application.status === "PENDING" ? "Pending review." : "No review remark returned.")}
                </div>
                {application.reviewer ? (
                  <div className="text-xs text-muted-foreground">
                    Reviewer: {application.reviewer}
                  </div>
                ) : null}
              </div>
            </div>

            {application.diffEntries.length > 0 ? (
              <div className="space-y-3">
                <div className="text-sm font-semibold">Before / After Diff</div>
                <div className="grid gap-3">
                  {application.diffEntries.map((entry) => (
                    <div
                      key={`${application.key}-${entry.field}`}
                      className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)]"
                    >
                      <div className="text-sm font-medium text-foreground">{entry.label}</div>
                      <div className="space-y-1">
                        <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                          Before
                        </div>
                        <div className="text-sm text-muted-foreground">{entry.before}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                          After
                        </div>
                        <div className="text-sm text-foreground">{entry.after}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {application.snapshotHighlights.length > 0 ? (
              <div className="space-y-3">
                <div className="text-sm font-semibold">Application Snapshot</div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {application.snapshotHighlights.map((item) => (
                    <MetaItem
                      key={`${application.key}-${item.key}`}
                      label={item.label}
                      value={item.value}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ReviewHistoryTimeline({
  mode,
  loading,
  entries,
  responseText,
  onSelect,
}: {
  mode: DetailLogMode;
  loading: boolean;
  entries: AffiliateReviewLogEntry[];
  responseText: string;
  onSelect: (entry: AffiliateReviewLogEntry) => void;
}) {
  const historyLabel = mode === "commission" ? "commission update history" : "review history";
  const indexLabel = mode === "commission" ? "Log" : "Step";

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border bg-muted/20 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading {historyLabel}...
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="space-y-3">
        <EmptyState
          title="No history records"
          description={`No previous ${mode === "commission" ? "commission update" : "review"} log was returned for this affiliate.`}
        />
        {responseText ? (
          <PreviewPanel title="Raw log response" value={responseText} />
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, index) => {
        const summary = summarizeLogEntry(mode, entry);

        return (
          <button
            type="button"
            key={String(entry.id ?? `${summary.time}-${summary.title}-${index}`)}
            className="w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md"
            onClick={() => onSelect(entry)}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={summary.status || summary.title} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {indexLabel} {entries.length - index}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-foreground">{summary.title}</div>
                  <div className="text-sm text-foreground">{summary.summary}</div>
                  {summary.note ? (
                    <div className="rounded-xl bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                      {summary.note}
                    </div>
                  ) : null}
                </div>
                {summary.chips.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {summary.chips.map((chip) => (
                      <div
                        key={chip}
                        className="rounded-full border bg-muted/20 px-3 py-1 text-xs text-muted-foreground"
                      >
                        {chip}
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="text-xs text-muted-foreground">
                  Click to inspect this log entry.
                </div>
              </div>
              <div className="rounded-full border bg-slate-50 px-3 py-1 text-xs font-medium text-muted-foreground">
                {summary.time || "Time not returned"}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function MetaItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-muted/20 px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function PreviewPanel({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[320px] rounded-2xl border bg-slate-950 px-4 py-3">
          <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-6 text-slate-100">
            {value || "{}"}
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function BdCombobox({
  users,
  value,
  onChange,
  disabled,
}: {
  users: AuthUserInfo[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const selectedUser = useMemo(
    () => users.find((user) => String(user.adminId ?? "") === value),
    [users, value],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          className="h-10 w-full justify-between rounded-xl px-3 font-normal"
        >
          <span className="truncate text-left">
            {selectedUser ? bdLabel(selectedUser) : "Choose a BD user"}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[360px] max-w-[var(--radix-popover-content-available-width)] p-0"
      >
        <Command>
          <CommandInput placeholder="Search username or email" />
          <CommandList className="max-h-[280px]">
            <CommandEmpty>No BD users matched.</CommandEmpty>
            <CommandGroup heading="BD users">
              {users.map((user) => {
                const adminId = String(user.adminId ?? "");
                const selected = adminId === value;

                return (
                  <CommandItem
                    key={adminId || String(user.email ?? user.username)}
                    value={`${bdLabel(user)} ${adminId}`}
                    onSelect={() => {
                      onChange(adminId);
                      setOpen(false);
                    }}
                    className="items-start gap-3 py-3"
                  >
                    <Check className={cn("mt-0.5 h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {String(user.username ?? user.email ?? "-")}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {String(user.email ?? "No email")}
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

type TrafficReviewTableProps = {
  mode: "traffic";
  rows: AffiliateTrafficReviewRow[];
  loading: boolean;
  emptyTitle: string;
  onOpenAffiliateProfile: (row: AffiliateTrafficReviewRow) => void;
  onDetail: (row: AffiliateTrafficReviewRow) => void;
  onApprove: (row: AffiliateTrafficReviewRow) => void;
  onReject: (row: AffiliateTrafficReviewRow) => void;
};

type KycReviewTableProps = {
  mode: "kyc";
  rows: AffiliateKycReviewRow[];
  loading: boolean;
  emptyTitle: string;
  onOpenAffiliateProfile: (row: AffiliateKycReviewRow) => void;
  onDetail: (row: AffiliateKycReviewRow) => void;
  onApprove: (row: AffiliateKycReviewRow) => void;
  onReject: (row: AffiliateKycReviewRow) => void;
};

function ReviewTable(props: TrafficReviewTableProps | KycReviewTableProps) {
  const {
    mode,
    rows,
    loading,
    emptyTitle,
    onOpenAffiliateProfile,
    onDetail,
    onApprove,
    onReject,
  } = props;

  if (rows.length === 0 && loading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading review list...
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description="Adjust filters or change page to load another result set."
      />
    );
  }

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/30 px-3 py-1 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Refreshing current list...
        </div>
      ) : null}

      <div className={cn("overflow-x-auto rounded-2xl border", loading && "opacity-80 transition-opacity")}>
        <Table>
          <TableHeader>
            {mode === "traffic" ? (
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Promotion Website</TableHead>
                <TableHead>Apply Time</TableHead>
                <TableHead>Audit Status</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead>Audit Time</TableHead>
                <TableHead className="w-[240px]">Actions</TableHead>
              </TableRow>
            ) : (
              <TableRow>
                <TableHead>Affiliate ID</TableHead>
                <TableHead>Source Channel</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>KYC Status</TableHead>
                <TableHead>Application Time</TableHead>
                <TableHead>Identity Details</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead>Audit Time</TableHead>
                <TableHead>Remark</TableHead>
                <TableHead className="w-[240px]">Actions</TableHead>
              </TableRow>
            )}
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const affiliateId = String(row.affiliateId ?? "");

              if (mode === "traffic") {
                const trafficRow = row as AffiliateTrafficReviewRow;

                return (
                  <TableRow key={affiliateId}>
                    <TableCell>{trafficRow.name || "-"}</TableCell>
                    <TableCell>{trafficRow.mail || "-"}</TableCell>
                    <TableCell>{String(trafficRow.countryCode ?? "-")}</TableCell>
                    <TableCell className="max-w-[280px]">
                      <span className="break-all">{websitesForRow(trafficRow)}</span>
                    </TableCell>
                    <TableCell>{trafficApplicationTimeForRow(trafficRow)}</TableCell>
                    <TableCell>
                      <StatusBadge status={statusForRow(mode, trafficRow)} />
                    </TableCell>
                    <TableCell>{trafficReviewerForRow(trafficRow)}</TableCell>
                    <TableCell>{trafficAuditTimeForRow(trafficRow)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => onDetail(trafficRow)}>
                          Detail
                        </Button>
                        <Button type="button" variant="secondary" size="sm" onClick={() => onApprove(trafficRow)}>
                          Approve
                        </Button>
                        <Button type="button" variant="destructive" size="sm" onClick={() => onReject(trafficRow)}>
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }

              const kycRow = row as AffiliateKycReviewRow;

              return (
                <TableRow key={affiliateId}>
                  <TableCell>
                    {String(kycRow.affiliateCode ?? "").trim() || affiliateId ? (
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 font-mono text-xs"
                        onClick={() => onOpenAffiliateProfile(kycRow)}
                      >
                        {String(kycRow.affiliateCode ?? "").trim() || affiliateId}
                      </Button>
                    ) : (
                      <span className="font-mono text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[220px]">
                    <span className="break-all">{String(kycRow.referralCode ?? "-")}</span>
                  </TableCell>
                  <TableCell>{kycRow.name || "-"}</TableCell>
                  <TableCell>{kycRow.mail || "-"}</TableCell>
                  <TableCell>{String(kycRow.countryCode ?? "-")}</TableCell>
                  <TableCell>{ownerForRow(kycRow)}</TableCell>
                  <TableCell>
                    <StatusBadge status={statusForRow(mode, kycRow)} />
                  </TableCell>
                  <TableCell>{kycApplicationTimeForRow(kycRow)}</TableCell>
                  <TableCell>
                    <Button type="button" variant="secondary" size="sm" onClick={() => onDetail(kycRow)}>
                      View
                    </Button>
                  </TableCell>
                  <TableCell>{kycReviewerForRow(kycRow)}</TableCell>
                  <TableCell>{kycAuditTimeForRow(kycRow)}</TableCell>
                  <TableCell className="max-w-[220px]">
                    <span className="break-words">{kycRemarkForRow(kycRow)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => onDetail(kycRow)}>
                        Detail
                      </Button>
                      <Button type="button" variant="secondary" size="sm" onClick={() => onApprove(kycRow)}>
                        Approve
                      </Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => onReject(kycRow)}>
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

const KolAuditPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AuditTab>("traffic");

  const [bdPlatformCode, setBdPlatformCode] = useState(CONSOLE_PLATFORM_CODE);
  const [bdRoleCodesText, setBdRoleCodesText] = useState("KOL_BD");
  const [bdKeyword, setBdKeyword] = useState("");
  const [bdUsers, setBdUsers] = useState<AuthUserInfo[]>([]);
  const [loadingBdUsers, setLoadingBdUsers] = useState(false);

  const [trafficQuery, setTrafficQuery] = useState<AffiliateAuditQuery>(defaultTrafficQuery);
  const [kycQuery, setKycQuery] = useState<AffiliateAuditQuery>(defaultKycQuery);

  const [trafficCounts, setTrafficCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [kycCounts, setKycCounts] = useState({ pending: 0, approved: 0, rejected: 0 });

  const [trafficData, setTrafficData] = useState<AffiliateTrafficReviewListValue>({});
  const [kycData, setKycData] = useState<AffiliateKycReviewListValue>({});

  const [loadingTraffic, setLoadingTraffic] = useState(true);
  const [loadingKyc, setLoadingKyc] = useState(true);
  const [refreshingAll, setRefreshingAll] = useState(false);

  const [detailDialog, setDetailDialog] = useState(initialDetailDialogState);
  const [detailKycLogs, setDetailKycLogs] = useState(initialReviewLogState);
  const [detailTrafficLogs, setDetailTrafficLogs] = useState(initialReviewLogState);
  const [commissionRateState, setCommissionRateState] = useState(initialCommissionRateState);
  const [reviewDialog, setReviewDialog] = useState(initialReviewDialogState);
  const [reviewLogs, setReviewLogs] = useState(initialReviewLogState);
  const [logDetailDialog, setLogDetailDialog] = useState(initialLogDetailDialogState);
  const [modificationReviewDialog, setModificationReviewDialog] = useState(
    initialModificationReviewDialogState,
  );

  const selectedReviewBd = useMemo(
    () => bdUsers.find((user) => String(user.adminId ?? "") === reviewDialog.bdAdminId),
    [bdUsers, reviewDialog.bdAdminId],
  );

  const reviewAccountTypeChoices = useMemo(
    () => accountTypeOptions(reviewDialog.accountType, String(reviewDialog.row?.accountType ?? "")),
    [reviewDialog.accountType, reviewDialog.row],
  );

  const parsedSelectedLog = useMemo(
    () => parseLogChangeData(logDetailDialog.entry ?? {}),
    [logDetailDialog.entry],
  );

  const selectedLogDiffEntries = useMemo(
    () =>
      sortedRecordEntries(parsedSelectedLog.diff).map(([field, diffValue]) => {
        const diffRecord = ensureRecord(diffValue);
        return {
          field,
          label: logFieldLabel(field),
          before: formatLogValue(diffRecord.before),
          after: formatLogValue(diffRecord.after),
        };
      }),
    [parsedSelectedLog.diff],
  );

  const selectedLogSnapshotHighlights = useMemo(
    () => buildSnapshotHighlights(logDetailDialog.entry ?? {}, parsedSelectedLog.snapshot),
    [logDetailDialog.entry, parsedSelectedLog.snapshot],
  );

  const selectedLogSummary = useMemo(
    () =>
      logDetailDialog.entry
        ? summarizeLogEntry(logDetailDialog.mode, logDetailDialog.entry)
        : null,
    [logDetailDialog.entry, logDetailDialog.mode],
  );

  const modificationApplications = useMemo(
    () => [
      ...buildModificationApplications("kyc", detailKycLogs.entries),
      ...buildModificationApplications("traffic", detailTrafficLogs.entries),
    ],
    [detailKycLogs.entries, detailTrafficLogs.entries],
  );

  const commissionRateValue = commissionRateState.spreadPercentage.trim();
  const commissionTierValue = commissionRateState.tier.trim();
  const commissionRateNumber = Number(commissionRateValue);
  const isCommissionRateValid =
    commissionRateValue !== "" &&
    Number.isInteger(commissionRateNumber) &&
    commissionRateNumber >= 0 &&
    commissionRateNumber <= 100;
  const isCommissionRateDirty =
    commissionRateValue !== commissionRateState.originalSpreadPercentage.trim() ||
    commissionTierValue !== commissionRateState.originalTier.trim();

  useEffect(() => {
    if (
      !reviewDialog.open ||
      reviewDialog.mode !== "traffic" ||
      reviewDialog.status !== "APPROVED" ||
      bdUsers.length === 0
    ) {
      return;
    }

    const resolvedBdAdminId = resolveReviewDialogBdAdminId(
      bdUsers,
      reviewDialog.row,
      reviewLogs.entries,
      reviewDialog.bdAdminId,
    );

    if (resolvedBdAdminId && resolvedBdAdminId !== reviewDialog.bdAdminId) {
      setReviewDialog((current) => {
        if (
          !current.open ||
          current.mode !== "traffic" ||
          current.status !== "APPROVED"
        ) {
          return current;
        }

        return current.bdAdminId === resolvedBdAdminId
          ? current
          : { ...current, bdAdminId: resolvedBdAdminId };
      });
    }
  }, [
    bdUsers,
    reviewDialog.open,
    reviewDialog.mode,
    reviewDialog.status,
    reviewDialog.row,
    reviewDialog.bdAdminId,
    reviewLogs.entries,
  ]);

  async function loadBdUsers(showToast = true) {
    const roleCodes = parseRoleCodes(bdRoleCodesText);

    if (roleCodes.length === 0) {
      toast.error("Fill at least one BD role code before loading users.");
      return;
    }

    setLoadingBdUsers(true);
    try {
      const result = await affiliateConsoleApi.listAuthUsers({
        platformCode: bdPlatformCode.trim() || CONSOLE_PLATFORM_CODE,
        roleCodes,
        keyword: bdKeyword.trim(),
      });
      const nextUsers = result.value.list ?? [];

      setBdUsers(nextUsers);
      setReviewDialog((current) => {
        if (!current.open || current.mode !== "traffic") {
          return current;
        }

        const resolvedBdAdminId = resolveReviewDialogBdAdminId(
          nextUsers,
          current.row,
          reviewLogs.entries,
          current.bdAdminId,
        );

        return resolvedBdAdminId === current.bdAdminId
          ? current
          : { ...current, bdAdminId: resolvedBdAdminId };
      });

      if (showToast) {
        toast.success(`Loaded ${result.value.total ?? nextUsers.length} BD users.`);
      }
    } finally {
      setLoadingBdUsers(false);
    }
  }

  async function loadReviewCounts() {
    const [traffic, kyc] = await Promise.all([
      affiliateConsoleApi.getTrafficReviewCounts(),
      affiliateConsoleApi.getKycReviewCounts(),
    ]);

    setTrafficCounts({
      pending: traffic.value.pending ?? 0,
      approved: traffic.value.approved ?? 0,
      rejected: traffic.value.rejected ?? 0,
    });

    setKycCounts({
      pending: kyc.value.pending ?? 0,
      approved: kyc.value.approved ?? 0,
      rejected: kyc.value.rejected ?? 0,
    });
  }

  async function loadTrafficList(nextQuery = trafficQuery, silent = false) {
    setLoadingTraffic(true);
    try {
      const result = await affiliateConsoleApi.listAffiliates(nextQuery);
      setTrafficQuery(nextQuery);
      setTrafficData(result.value ?? {});

      if (!silent) {
        toast.success(`Traffic review list refreshed (${result.value.total ?? 0} rows).`);
      }
    } finally {
      setLoadingTraffic(false);
    }
  }

  async function loadKycList(nextQuery = kycQuery, silent = false) {
    setLoadingKyc(true);
    try {
      const result = await affiliateConsoleApi.listKycReviews(nextQuery);
      setKycQuery(nextQuery);
      setKycData(result.value ?? {});

      if (!silent) {
        toast.success(`KYC review list refreshed (${result.value.total ?? 0} rows).`);
      }
    } finally {
      setLoadingKyc(false);
    }
  }

  async function loadDetailLogState(
    mode: AuditTab,
    affiliateId: string,
    setter: Dispatch<SetStateAction<ReviewLogState>>,
  ) {
    setter({
      loading: true,
      entries: [],
      requestText: "",
      responseText: "",
    });

    try {
      const result =
        mode === "traffic"
          ? await affiliateConsoleApi.getTrafficReviewLogs(affiliateId)
          : await affiliateConsoleApi.getKycReviewLogs(affiliateId);
      const preview = previewToText(result.preview);

      setter({
        loading: false,
        entries: normalizeLogEntries(result.value),
        requestText: preview.request,
        responseText: preview.response,
      });
    } catch (error) {
      const preview = buildPreviewTextFromError(error);

      setter({
        loading: false,
        entries: [],
        requestText: preview.request,
        responseText: preview.response,
      });
    }
  }

  async function loadCommissionRateLogs(affiliateId: string, openLogs = true) {
    if (!affiliateId.trim()) {
      return;
    }

    setCommissionRateState((current) => ({
      ...current,
      affiliateId,
      logsOpen: openLogs ? true : current.logsOpen,
      logsLoading: true,
      logError: "",
    }));

    try {
      const result = await affiliateConsoleApi.getAffiliateCommissionRateLog(affiliateId);
      const preview = previewToText(result.preview);
      const normalized = normalizeCommissionRateLogValue(result.value);

      setCommissionRateState((current) => {
        if (current.affiliateId !== affiliateId) {
          return current;
        }

        const nextSpreadPercentage =
          current.spreadPercentage.trim() === current.originalSpreadPercentage.trim() &&
          normalized.spreadPercentage
            ? normalized.spreadPercentage
            : current.spreadPercentage;
        const nextOriginalSpreadPercentage = normalized.spreadPercentage
          ? normalized.spreadPercentage
          : current.originalSpreadPercentage;
        const nextTier =
          current.tier.trim() === current.originalTier.trim() && normalized.tier
            ? normalized.tier
            : current.tier;
        const nextOriginalTier = normalized.tier ? normalized.tier : current.originalTier;

        return {
          ...current,
          tier: nextTier,
          originalTier: nextOriginalTier,
          spreadPercentage: nextSpreadPercentage,
          originalSpreadPercentage: nextOriginalSpreadPercentage,
          logsOpen: openLogs ? true : current.logsOpen,
          logsLoading: false,
          logsLoaded: true,
          logs: normalized.logs,
          logsRequestText: preview.request,
          logsResponseText: preview.response,
          logError: "",
        };
      });
    } catch (error) {
      const preview = buildPreviewTextFromError(error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to load commission update logs.";

      setCommissionRateState((current) =>
        current.affiliateId === affiliateId
          ? {
              ...current,
              logsOpen: openLogs ? true : current.logsOpen,
              logsLoading: false,
              logsLoaded: true,
              logs: [],
              logsRequestText: preview.request,
              logsResponseText: preview.response,
              logError: message,
            }
          : current,
      );
    }
  }

  function toggleCommissionRateLogs() {
    const affiliateId = String(detailDialog.row?.affiliateId ?? commissionRateState.affiliateId ?? "").trim();

    if (!affiliateId) {
      toast.error("No affiliateId is available for commission log lookup.");
      return;
    }

    if (commissionRateState.logsOpen) {
      setCommissionRateState((current) => ({ ...current, logsOpen: false }));
      return;
    }

    if (commissionRateState.logsLoaded) {
      setCommissionRateState((current) => ({ ...current, logsOpen: true }));
      return;
    }

    void loadCommissionRateLogs(affiliateId, true);
  }

  async function submitCommissionRateUpdate() {
    const affiliateId = String(detailDialog.row?.affiliateId ?? commissionRateState.affiliateId ?? "").trim();

    if (!affiliateId) {
      toast.error("No affiliateId is available for this commission update.");
      return;
    }

    if (!isCommissionRateValid) {
      toast.error("Commission rate must be an integer between 0 and 100.");
      return;
    }

    setCommissionRateState((current) => ({ ...current, saving: true }));

    try {
      await affiliateConsoleApi.updateAffiliateCommissionRate({
        affiliateId,
        tier: commissionTierValue,
        spreadPercentage: commissionRateNumber,
      });
      toast.success(
        commissionTierValue
          ? `Commission rate updated to ${commissionRateValue}% under tier ${commissionTierValue}.`
          : `Commission rate updated to ${commissionRateValue}%.`,
      );
      const currentRow = detailDialog.row;
      const currentMode = detailDialog.mode;
      const shouldReloadCommissionLogs =
        commissionRateState.logsOpen || commissionRateState.logsLoaded;
      const shouldReopenCommissionLogs = commissionRateState.logsOpen;

      if (currentRow) {
        await refreshDetailDialogData(currentRow, currentMode);
      }

      if (shouldReloadCommissionLogs) {
        await loadCommissionRateLogs(affiliateId, shouldReopenCommissionLogs);
      }
    } finally {
      setCommissionRateState((current) =>
        current.affiliateId === affiliateId
          ? {
              ...current,
              saving: false,
            }
          : current,
      );
    }
  }

  async function openDetailDialog(mode: AuditTab, row: AuditRow) {
    const affiliateId = String(row.affiliateId ?? "");

    if (!affiliateId) {
      toast.error("This row does not contain a valid affiliateId.");
      return;
    }

    setDetailDialog({
      open: true,
      mode,
      row,
      loading: true,
      requestText: "",
      responseText: "",
    });
    setDetailKycLogs({
      loading: true,
      entries: [],
      requestText: "",
      responseText: "",
    });
    setDetailTrafficLogs({
      loading: true,
      entries: [],
      requestText: "",
      responseText: "",
    });
    setModificationReviewDialog(initialModificationReviewDialogState);
    setCommissionRateState({
      ...initialCommissionRateState,
      affiliateId,
      loading: true,
    });
    void Promise.all([
      loadDetailLogState("kyc", affiliateId, setDetailKycLogs),
      loadDetailLogState("traffic", affiliateId, setDetailTrafficLogs),
    ]);

    try {
      const result = await affiliateConsoleApi.getAuditDetail(affiliateId);
      const preview = previewToText(result.preview);
      const detailCommissionRate =
        extractCommissionRateFromAuditDetail(result.value) ||
        String(row.commissionRate ?? "").trim();
      const detailTier =
        extractCommissionTierFromAuditDetail(result.value) ||
        String(row.tier ?? "").trim();

      setDetailDialog((current) =>
        current.row?.affiliateId === row.affiliateId
          ? {
              ...current,
              loading: false,
              requestText: preview.request,
              responseText: preview.response,
            }
          : current,
      );
      setCommissionRateState((current) =>
        current.affiliateId === affiliateId
          ? {
              ...current,
              loading: false,
              loaded: true,
              loadError: "",
              spreadPercentage: detailCommissionRate,
              originalSpreadPercentage: detailCommissionRate,
              tier:
                current.tier.trim() === current.originalTier.trim() && detailTier
                  ? detailTier
                  : current.tier,
              originalTier: detailTier || current.originalTier,
            }
          : current,
      );
    } catch (error) {
      const preview = buildPreviewTextFromError(error);

      setDetailDialog((current) =>
        current.row?.affiliateId === row.affiliateId
          ? {
              ...current,
              loading: false,
              requestText: preview.request,
              responseText: preview.response,
            }
          : current,
      );
      setCommissionRateState((current) =>
        current.affiliateId === affiliateId
          ? {
              ...current,
              loading: false,
              loaded: true,
              loadError:
                error instanceof Error
                  ? error.message
                  : "Failed to load the current commission rate from detail.",
            }
          : current,
      );
    }
  }

  async function refreshDetailDialogData(row: AuditRow, mode = detailDialog.mode) {
    await openDetailDialog(mode, row);
  }

  async function loadReviewLogs(mode: AuditTab, affiliateId: string) {
    setReviewLogs({
      loading: true,
      entries: [],
      requestText: "",
      responseText: "",
    });

    try {
      const result =
        mode === "traffic"
          ? await affiliateConsoleApi.getTrafficReviewLogs(affiliateId)
          : await affiliateConsoleApi.getKycReviewLogs(affiliateId);
      const preview = previewToText(result.preview);

      setReviewLogs({
        loading: false,
        entries: normalizeLogEntries(result.value),
        requestText: preview.request,
        responseText: preview.response,
      });
    } catch (error) {
      const preview = buildPreviewTextFromError(error);

      setReviewLogs({
        loading: false,
        entries: [],
        requestText: preview.request,
        responseText: preview.response,
      });
    }
  }

  function openLogDetail(mode: DetailLogMode, entry: AffiliateReviewLogEntry) {
    setLogDetailDialog({
      open: true,
      mode,
      entry,
    });
  }

  function openModificationReviewDialog(
    application: GroupedModificationApplication,
    action: ModificationReviewAction,
  ) {
    setModificationReviewDialog({
      open: true,
      application,
      action,
      remark: "",
      submitting: false,
    });
  }

  function openReviewDialog(mode: AuditTab, row: AuditRow, status: TrafficReviewStatus | KycReviewStatus) {
    const affiliateId = String(row.affiliateId ?? "");

    if (!affiliateId) {
      toast.error("This row does not contain a valid affiliateId.");
      return;
    }

    setReviewDialog({
      open: true,
      mode,
      row,
      status,
      submitting: false,
      accountType: String(row.accountType ?? "").trim(),
      bdAdminId:
        mode === "traffic"
          ? resolveReviewDialogBdAdminId(bdUsers, row)
          : "",
      remark: "",
    });
    void loadReviewLogs(mode, affiliateId);

    if (mode === "traffic" && status === "APPROVED" && bdUsers.length === 0) {
      void loadBdUsers(false);
    }
  }

  async function submitReview() {
    const currentDialog = reviewDialog;
    const row = currentDialog.row;
    const affiliateId = String(row?.affiliateId ?? "");
    const remark = currentDialog.remark.trim();

    if (!affiliateId) {
      return;
    }

    setReviewDialog((prev) => ({ ...prev, submitting: true }));

    try {
      if (currentDialog.mode === "traffic") {
        const status = currentDialog.status as TrafficReviewStatus;
        const payload: {
          affiliateId: string;
          trafficResourceStatus: TrafficReviewStatus;
          idApproverNotes?: string;
          bdOwnerAdminId?: string;
          bdOwnerUsernameSnapshot?: string;
        } = {
          affiliateId,
          trafficResourceStatus: status,
        };

        if (remark) {
          payload.idApproverNotes = remark;
        }

        if (status === "APPROVED") {
          const selectedUser = bdUsers.find(
            (user) => String(user.adminId ?? "") === currentDialog.bdAdminId,
          );
          const snapshot = String(selectedUser?.username ?? selectedUser?.email ?? "").trim();

          if (!selectedUser?.adminId || !snapshot) {
            toast.error("Choose a BD user before approving traffic review.");
            setReviewDialog((prev) => ({ ...prev, submitting: false }));
            return;
          }

          payload.bdOwnerAdminId = String(selectedUser.adminId);
          payload.bdOwnerUsernameSnapshot = snapshot;
        }

        await affiliateConsoleApi.updateAffiliateReview(payload);
        toast.success(`Traffic review updated to ${status}.`);
        await Promise.all([loadReviewCounts(), loadTrafficList(trafficQuery, true)]);
      } else {
        const accountType = currentDialog.accountType.trim();

        if (!accountType) {
          toast.error("Choose an account type before updating KYC review.");
          setReviewDialog((prev) => ({ ...prev, submitting: false }));
          return;
        }

        await affiliateConsoleApi.updateAffiliateReview({
          affiliateId,
          idKYCStatus: currentDialog.status as KycReviewStatus,
          accountType,
          idApproverNotes: remark,
        });
        toast.success(`KYC review updated to ${currentDialog.status}.`);
        await Promise.all([loadReviewCounts(), loadKycList(kycQuery, true)]);
      }

      setReviewDialog(initialReviewDialogState);
      setReviewLogs(initialReviewLogState);
      setLogDetailDialog(initialLogDetailDialogState);
    } catch {
      setReviewDialog((prev) => ({ ...prev, submitting: false }));
    }
  }

  async function submitModificationReview() {
    const application = modificationReviewDialog.application;
    const affiliateId = String(application?.affiliateId ?? "").trim();
    const logId = Number(application?.logId ?? 0);

    if (!application || !affiliateId || !Number.isFinite(logId) || logId <= 0) {
      toast.error("The selected modification application is invalid.");
      return;
    }

    setModificationReviewDialog((current) => ({ ...current, submitting: true }));

    try {
      await affiliateConsoleApi.reviewModificationApplication({
        affiliateId,
        logId,
        action: modificationReviewDialog.action,
        remark: modificationReviewDialog.remark.trim(),
      });

      toast.success(
        `${application.typeLabel} ${
          modificationReviewDialog.action === "APPROVE" ? "approved" : "rejected"
        } successfully.`,
      );

      const currentRow = detailDialog.row;
      const currentMode = detailDialog.mode;

      setModificationReviewDialog(initialModificationReviewDialogState);

      if (currentRow) {
        await refreshDetailDialogData(currentRow, currentMode);
      }
    } catch {
      setModificationReviewDialog((current) => ({ ...current, submitting: false }));
    }
  }

  async function refreshAll(silent = false) {
    setRefreshingAll(true);
    try {
      await Promise.all([loadReviewCounts(), loadTrafficList(trafficQuery, true), loadKycList(kycQuery, true)]);

      if (!silent) {
        toast.success("KOL review dashboard refreshed.");
      }
    } finally {
      setRefreshingAll(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setRefreshingAll(true);
      setLoadingTraffic(true);
      setLoadingKyc(true);
      setLoadingBdUsers(true);

      const results = await Promise.allSettled([
        affiliateConsoleApi.getTrafficReviewCounts(),
        affiliateConsoleApi.getKycReviewCounts(),
        affiliateConsoleApi.listAffiliates(defaultTrafficQuery),
        affiliateConsoleApi.listKycReviews(defaultKycQuery),
        affiliateConsoleApi.listAuthUsers({
          platformCode: CONSOLE_PLATFORM_CODE,
          roleCodes: parseRoleCodes("KOL_BD"),
          keyword: "",
        }),
      ]);

      if (cancelled) {
        return;
      }

      if (results[0].status === "fulfilled") {
        setTrafficCounts({
          pending: results[0].value.value.pending ?? 0,
          approved: results[0].value.value.approved ?? 0,
          rejected: results[0].value.value.rejected ?? 0,
        });
      }

      if (results[1].status === "fulfilled") {
        setKycCounts({
          pending: results[1].value.value.pending ?? 0,
          approved: results[1].value.value.approved ?? 0,
          rejected: results[1].value.value.rejected ?? 0,
        });
      }

      if (results[2].status === "fulfilled") {
        setTrafficData(results[2].value.value ?? {});
      }

      if (results[3].status === "fulfilled") {
        setKycData(results[3].value.value ?? {});
      }

      if (results[4].status === "fulfilled") {
        setBdUsers(results[4].value.value.list ?? []);
      }

      setLoadingTraffic(false);
      setLoadingKyc(false);
      setLoadingBdUsers(false);
      setRefreshingAll(false);
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const isApproveAction = String(reviewDialog.status).includes("APPROVED");
  const reviewDialogTitle =
    reviewDialog.mode === "traffic"
      ? isApproveAction
        ? "Approve Traffic Review"
        : "Reject Traffic Review"
      : isApproveAction
        ? "Approve KYC Review"
        : "Reject KYC Review";

  const reviewDialogDescription =
    reviewDialog.mode === "traffic"
      ? isApproveAction
        ? "Confirm the traffic review result, assign a BD owner, and record an audit remark."
        : "Reject the traffic qualification for this affiliate and record an audit remark."
      : "Confirm the KYC result, account type, and audit remark before submitting the update.";

  return (
    <>
      <div className="space-y-6">
        <PageIntro
          title="KOL Audit Console"
          description="Review traffic qualification and KYC inside the authenticated admin session. Traffic approval assigns a BD owner in the review dialog, and KYC updates confirm the account type in the same flow."
          actions={
            <Button
              type="button"
              variant="secondary"
              onClick={() => void refreshAll()}
              disabled={refreshingAll}
            >
              {refreshingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              Refresh All
            </Button>
          }
        />

        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Review rules</AlertTitle>
          <AlertDescription>
            Traffic approval writes <code>bdOwnerAdminId</code> and{" "}
            <code>bdOwnerUsernameSnapshot</code>. KYC updates write{" "}
            <code>idKYCStatus</code> and require <code>accountType</code>.
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AuditTab)}>
          <TabsList>
            <TabsTrigger value="traffic">Traffic Review</TabsTrigger>
            <TabsTrigger value="kyc">KYC Review</TabsTrigger>
          </TabsList>

          <TabsContent value="traffic" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard label="Traffic Pending" value={trafficCounts.pending} hint="Pending traffic reviews." />
              <StatCard label="Traffic Approved" value={trafficCounts.approved} hint="Approved traffic qualifications." />
              <StatCard label="Traffic Rejected" value={trafficCounts.rejected} hint="Rejected traffic qualifications." />
            </div>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">BD source settings</CardTitle>
                <CardDescription>
                  Load BD users from the auth platform. The actual assignment happens in the
                  approval dialog.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 xl:grid-cols-3">
                  <Field label="Platform code">
                    <Input
                      value={bdPlatformCode}
                      onChange={(event) => setBdPlatformCode(event.target.value)}
                    />
                  </Field>
                  <Field label="Role codes" hint="Comma separated. Example: KOL_BD">
                    <Input
                      value={bdRoleCodesText}
                      onChange={(event) => setBdRoleCodesText(event.target.value)}
                    />
                  </Field>
                  <Field label="Keyword">
                    <Input
                      value={bdKeyword}
                      onChange={(event) => setBdKeyword(event.target.value)}
                      placeholder="username or email"
                    />
                  </Field>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void loadBdUsers()}
                    disabled={loadingBdUsers}
                  >
                    {loadingBdUsers ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Load BD users
                  </Button>
                  <div className="rounded-full border bg-muted/30 px-3 py-1.5 text-sm font-medium">
                    Loaded {bdUsers.length} BD users
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Traffic approval now uses a searchable BD dropdown in the modal.
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Traffic filters</CardTitle>
                <CardDescription>
                  Query <code>/affiliate/list</code> with traffic-specific filters only.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="Status">
                    <select
                      className={cn(controlClass, "rounded-xl")}
                      value={String(trafficQuery.trafficStatus ?? "")}
                      onChange={(event) =>
                        setTrafficQuery((prev) => ({
                          ...prev,
                          trafficStatus: event.target.value,
                        }))
                      }
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="">ALL</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </Field>
                  <Field label="Email">
                    <Input
                      value={String(trafficQuery.mail ?? "")}
                      onChange={(event) =>
                        setTrafficQuery((prev) => ({ ...prev, mail: event.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Affiliate code">
                    <Input
                      value={String(trafficQuery.affiliateCode ?? "")}
                      onChange={(event) =>
                        setTrafficQuery((prev) => ({
                          ...prev,
                          affiliateCode: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Referral code">
                    <Input
                      value={String(trafficQuery.referralCode ?? "")}
                      onChange={(event) =>
                        setTrafficQuery((prev) => ({
                          ...prev,
                          referralCode: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Start date">
                    <Input
                      value={String(trafficQuery.startDate ?? "")}
                      onChange={(event) =>
                        setTrafficQuery((prev) => ({
                          ...prev,
                          startDate: event.target.value,
                        }))
                      }
                      placeholder="2026-04-01 00:00:00"
                    />
                  </Field>
                  <Field label="End date">
                    <Input
                      value={String(trafficQuery.endDate ?? "")}
                      onChange={(event) =>
                        setTrafficQuery((prev) => ({
                          ...prev,
                          endDate: event.target.value,
                        }))
                      }
                      placeholder="2026-04-30 23:59:59"
                    />
                  </Field>
                  <Field label="Page">
                    <Input
                      value={String(trafficQuery.currentPage ?? "1")}
                      onChange={(event) =>
                        setTrafficQuery((prev) => ({
                          ...prev,
                          currentPage: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Page size">
                    <Input
                      value={String(trafficQuery.pageSize ?? "10")}
                      onChange={(event) =>
                        setTrafficQuery((prev) => ({
                          ...prev,
                          pageSize: event.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" onClick={() => void loadTrafficList()} disabled={loadingTraffic}>
                    {loadingTraffic ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Load traffic review
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Traffic review list</CardTitle>
                <CardDescription>
                  Approve or reject traffic qualification. Approve opens a BD assignment dialog.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReviewTable
                  mode="traffic"
                  rows={trafficData.resultList ?? []}
                  loading={loadingTraffic}
                  emptyTitle="No traffic review data"
                  onOpenAffiliateProfile={(row) =>
                    navigate(`/manage/affiliate-profile/${String(row.affiliateId ?? "").trim()}`)
                  }
                  onDetail={(row) => void openDetailDialog("traffic", row)}
                  onApprove={(row) => openReviewDialog("traffic", row, "APPROVED")}
                  onReject={(row) => openReviewDialog("traffic", row, "REJECTED")}
                />

                <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                  <QuerySummary data={trafficData} />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const next = {
                          ...trafficQuery,
                          currentPage: nextPage(trafficQuery.currentPage, -1),
                        };
                        setTrafficQuery(next);
                        void loadTrafficList(next, true);
                      }}
                      disabled={loadingTraffic}
                    >
                      Prev
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const next = {
                          ...trafficQuery,
                          currentPage: nextPage(trafficQuery.currentPage, 1),
                        };
                        setTrafficQuery(next);
                        void loadTrafficList(next, true);
                      }}
                      disabled={loadingTraffic}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kyc" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard label="KYC Pending" value={kycCounts.pending} hint="Pending KYC reviews." />
              <StatCard label="KYC Approved" value={kycCounts.approved} hint="Approved KYC records." />
              <StatCard label="KYC Rejected" value={kycCounts.rejected} hint="Rejected KYC records." />
            </div>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">KYC filters</CardTitle>
                <CardDescription>
                  Query <code>/admin/affiliate/kycReview</code>. The backend already restricts this list to <code>traffic_resource_status = APPROVED</code>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="Status">
                    <select
                      className={cn(controlClass, "rounded-xl")}
                      value={String(kycQuery.idKYCStatus ?? "")}
                      onChange={(event) =>
                        setKycQuery((prev) => ({
                          ...prev,
                          idKYCStatus: event.target.value,
                        }))
                      }
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="">ALL</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="DOCUMENTS_REJECTED">DOCUMENTS_REJECTED</option>
                        <option value="NOT_APPLIED">NOT_APPLIED</option>
                        <option value="ACCOUNT_CLOSED">ACCOUNT_CLOSED</option>
                      </select>
                    </Field>
                    <Field label="Name">
                      <Input
                        value={String(kycQuery.name ?? "")}
                        onChange={(event) =>
                          setKycQuery((prev) => ({ ...prev, name: event.target.value }))
                        }
                      />
                    </Field>
                    <Field label="Email">
                      <Input
                        value={String(kycQuery.mail ?? "")}
                        onChange={(event) =>
                          setKycQuery((prev) => ({ ...prev, mail: event.target.value }))
                        }
                      />
                    </Field>
                    <Field label="Country">
                      <Input
                        value={String(kycQuery.countryCodes ?? "")}
                        onChange={(event) =>
                          setKycQuery((prev) => ({
                            ...prev,
                            countryCodes: event.target.value,
                          }))
                        }
                      />
                    </Field>
                    <Field label="Affiliate code">
                      <Input
                        value={String(kycQuery.affiliateCode ?? "")}
                        onChange={(event) =>
                          setKycQuery((prev) => ({
                          ...prev,
                          affiliateCode: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Referral code">
                    <Input
                      value={String(kycQuery.referralCode ?? "")}
                      onChange={(event) =>
                        setKycQuery((prev) => ({
                          ...prev,
                          referralCode: event.target.value,
                          }))
                        }
                      />
                    </Field>
                    <Field label="Invite code">
                      <Input
                        value={String(kycQuery.inviteCode ?? "")}
                        onChange={(event) =>
                          setKycQuery((prev) => ({
                            ...prev,
                            inviteCode: event.target.value,
                          }))
                        }
                      />
                    </Field>
                    <Field label="Short link">
                      <Input
                        value={String(kycQuery.shortLink ?? "")}
                        onChange={(event) =>
                          setKycQuery((prev) => ({
                            ...prev,
                            shortLink: event.target.value,
                          }))
                        }
                      />
                    </Field>
                    <Field
                      label="Owner"
                      hint="Choose a KOL_BD user. The selected admin ID is sent through the owner query parameter."
                    >
                      <Select
                        value={String(kycQuery.owner ?? "") || OWNER_ALL}
                        onValueChange={(value) =>
                          setKycQuery((prev) => ({
                            ...prev,
                            owner: value === OWNER_ALL ? "" : value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={loadingBdUsers ? "Loading KOL_BD users..." : "Select owner"}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={OWNER_ALL}>All owners</SelectItem>
                          {bdUsers.map((user) => {
                            const adminId = String(user.adminId ?? "").trim();
                            if (!adminId) {
                              return null;
                            }
                            const username = String(user.username ?? "").trim();
                            const email = String(user.email ?? "").trim();
                            const displayName = username || email || adminId;
                            return (
                              <SelectItem key={adminId} value={adminId}>
                                {`${displayName} (${adminId})`}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Live account">
                      <Input
                        value={String(kycQuery.liveAccount ?? "")}
                        onChange={(event) =>
                          setKycQuery((prev) => ({
                            ...prev,
                            liveAccount: event.target.value,
                          }))
                        }
                      />
                    </Field>
                    <Field label="Start date">
                      <Input
                        value={String(kycQuery.startDate ?? "")}
                        onChange={(event) =>
                          setKycQuery((prev) => ({
                          ...prev,
                          startDate: event.target.value,
                        }))
                      }
                      placeholder="2026-04-01 00:00:00"
                    />
                  </Field>
                  <Field label="End date">
                    <Input
                      value={String(kycQuery.endDate ?? "")}
                      onChange={(event) =>
                        setKycQuery((prev) => ({
                          ...prev,
                          endDate: event.target.value,
                        }))
                      }
                      placeholder="2026-04-30 23:59:59"
                    />
                  </Field>
                  <Field label="Page">
                    <Input
                      value={String(kycQuery.currentPage ?? "1")}
                      onChange={(event) =>
                        setKycQuery((prev) => ({
                          ...prev,
                          currentPage: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Page size">
                    <Input
                      value={String(kycQuery.pageSize ?? "10")}
                      onChange={(event) =>
                        setKycQuery((prev) => ({
                          ...prev,
                          pageSize: event.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" onClick={() => void loadKycList()} disabled={loadingKyc}>
                    {loadingKyc ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Load KYC review
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">KYC review list</CardTitle>
                <CardDescription>
                  Each KYC action opens a confirmation dialog with account type confirmation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReviewTable
                  mode="kyc"
                  rows={kycData.resultList ?? []}
                  loading={loadingKyc}
                  emptyTitle="No KYC review data"
                  onOpenAffiliateProfile={(row) =>
                    navigate(`/manage/affiliate-profile/${String(row.affiliateId ?? "").trim()}`)
                  }
                  onDetail={(row) => void openDetailDialog("kyc", row)}
                  onApprove={(row) => openReviewDialog("kyc", row, "APPROVED")}
                  onReject={(row) => openReviewDialog("kyc", row, "DOCUMENTS_REJECTED")}
                />

                <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                  <QuerySummary data={kycData} />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const next = {
                          ...kycQuery,
                          currentPage: nextPage(kycQuery.currentPage, -1),
                        };
                        setKycQuery(next);
                        void loadKycList(next, true);
                      }}
                      disabled={loadingKyc}
                    >
                      Prev
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const next = {
                          ...kycQuery,
                          currentPage: nextPage(kycQuery.currentPage, 1),
                        };
                        setKycQuery(next);
                        void loadKycList(next, true);
                      }}
                      disabled={loadingKyc}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Dialog
        open={detailDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setDetailDialog(initialDetailDialogState);
            setDetailKycLogs(initialReviewLogState);
            setDetailTrafficLogs(initialReviewLogState);
            setCommissionRateState(initialCommissionRateState);
            setModificationReviewDialog(initialModificationReviewDialogState);
          }
        }}
      >
        <DialogContent className="flex max-h-[100vh] max-w-5xl flex-col overflow-hidden rounded-[28px] border border-slate-200 p-0 shadow-2xl [&>button]:right-5 [&>button]:top-5 [&>button]:text-slate-400 [&>button]:opacity-100">
          <div className="shrink-0 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-5 text-slate-50">
            <DialogHeader className="text-left">
              <DialogTitle className="text-xl">
                {detailDialog.mode === "traffic" ? "Traffic Detail" : "KYC Detail"}
              </DialogTitle>
              <DialogDescription className="text-slate-300">
                Audit detail preview for affiliate{" "}
                <span className="font-mono">{String(detailDialog.row?.affiliateId ?? "-")}</span>.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-6 p-6">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <MetaItem
                label="Affiliate ID"
                value={<span className="font-mono">{String(detailDialog.row?.affiliateId ?? "-")}</span>}
              />
              <MetaItem
                label="Current Status"
                value={<StatusBadge status={statusForRow(detailDialog.mode, detailDialog.row)} />}
              />
              <MetaItem label="Account Type" value={String(detailDialog.row?.accountType ?? "-")} />
              <MetaItem label="Owner" value={ownerForRow(detailDialog.row)} />
              <MetaItem label="Email" value={String(detailDialog.row?.mail ?? "-")} />
              <MetaItem label="Affiliate Code" value={String(detailDialog.row?.affiliateCode ?? "-")} />
              <MetaItem label="Referral Code" value={String(detailDialog.row?.referralCode ?? "-")} />
              <MetaItem
                label="Audit Time"
                value={
                  detailDialog.mode === "traffic"
                    ? trafficAuditTimeForRow(detailDialog.row as AffiliateTrafficReviewRow | null)
                    : kycAuditTimeForRow(detailDialog.row as AffiliateKycReviewRow | null)
                }
              />
            </div>

              {detailDialog.loading ? (
                <div className="flex h-48 items-center justify-center rounded-2xl border bg-muted/20 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading detail...
                </div>
              ) : (
                <div className="space-y-4">
                  <Card className="shadow-sm">
                    <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-lg">Commission Rate</CardTitle>
                        <CardDescription>
                          Uses the commission ratio already returned by the affiliate detail
                          payload. Saving writes to <code>/admin/affiliate/commission_rate</code>
                          and records a commission change log.
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            detailDialog.row
                              ? void refreshDetailDialogData(
                                  detailDialog.row,
                                  detailDialog.mode,
                                )
                              : undefined
                          }
                          disabled={commissionRateState.loading || commissionRateState.saving}
                        >
                          {commissionRateState.loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCcw className="h-4 w-4" />
                          )}
                          Refresh from detail
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => toggleCommissionRateLogs()}
                          disabled={commissionRateState.logsLoading}
                        >
                          {commissionRateState.logsOpen
                            ? "Hide commission logs"
                            : "View commission logs"}
                        </Button>
                        {commissionRateState.logsOpen ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              void loadCommissionRateLogs(
                                String(
                                  detailDialog.row?.affiliateId ??
                                    commissionRateState.affiliateId,
                                ),
                                true,
                              )
                            }
                            disabled={commissionRateState.logsLoading}
                          >
                            {commissionRateState.logsLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCcw className="h-4 w-4" />
                            )}
                            Refresh logs
                          </Button>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <MetaItem
                          label="Current Effective Rate"
                          value={
                            commissionRateState.loading
                              ? "Loading..."
                              : formatCommissionRateText(
                                  commissionRateState.originalSpreadPercentage,
                                )
                          }
                        />
                        <MetaItem
                          label="Current Tier"
                          value={commissionRateState.originalTier || "-"}
                        />
                        <MetaItem label="Allowed Range" value="0% to 100%" />
                        <MetaItem label="Change Key" value="spread_percentage / tier" />
                      </div>

                      {commissionRateState.loadError ? (
                        <Alert variant="destructive">
                          <AlertTitle>Current commission rate unavailable</AlertTitle>
                          <AlertDescription>
                            {commissionRateState.loadError}
                          </AlertDescription>
                        </Alert>
                      ) : null}

                      <div className="grid gap-4 lg:grid-cols-[minmax(0,200px)_minmax(0,1fr)_auto] lg:items-end">
                        <Field
                          label="Tier"
                          hint="Included in the admin commission update request body."
                        >
                          <Input
                            value={commissionRateState.tier}
                            onChange={(event) =>
                              setCommissionRateState((current) => ({
                                ...current,
                                tier: event.target.value,
                              }))
                            }
                            disabled={commissionRateState.loading || commissionRateState.saving}
                            placeholder="Example: TIER_A"
                          />
                        </Field>

                        <Field
                          label="Spread percentage"
                          hint="Use a whole number between 0 and 100."
                        >
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={commissionRateState.spreadPercentage}
                            onChange={(event) =>
                              setCommissionRateState((current) => ({
                                ...current,
                                spreadPercentage: event.target.value,
                              }))
                            }
                            disabled={commissionRateState.loading || commissionRateState.saving}
                            placeholder="Example: 35"
                          />
                        </Field>

                        <Button
                          type="button"
                          onClick={() => void submitCommissionRateUpdate()}
                          disabled={
                            commissionRateState.loading ||
                            commissionRateState.saving ||
                            !isCommissionRateValid ||
                            !isCommissionRateDirty
                          }
                          className="min-w-[164px]"
                        >
                          {commissionRateState.saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : null}
                          Save commission rate
                        </Button>
                      </div>

                      {!commissionRateState.loading && !isCommissionRateValid && commissionRateValue ? (
                        <div className="text-sm text-rose-600">
                          Commission rate must stay within 0 to 100 and use integers only.
                        </div>
                      ) : null}

                      {commissionRateState.logsOpen ? (
                        <Card className="border-dashed shadow-none">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                              Commission Update Logs
                            </CardTitle>
                            <CardDescription>
                              Reuses <code>/admin/affiliate/getAffiliateCommissionRateLog</code>.
                              Click any row to inspect the full before/after change detail.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {commissionRateState.logError ? (
                              <Alert variant="destructive">
                                <AlertTitle>Commission logs unavailable</AlertTitle>
                                <AlertDescription>
                                  {commissionRateState.logError}
                                </AlertDescription>
                              </Alert>
                            ) : null}

                            <ScrollArea className="h-[320px] rounded-2xl border bg-muted/10 p-4">
                              <div className="pr-4">
                                <ReviewHistoryTimeline
                                  mode="commission"
                                  loading={commissionRateState.logsLoading}
                                  entries={commissionRateState.logs}
                                  responseText={commissionRateState.logsResponseText}
                                  onSelect={(entry) => openLogDetail("commission", entry)}
                                />
                              </div>
                            </ScrollArea>
                          </CardContent>
                        </Card>
                      ) : null}
                    </CardContent>
                  </Card>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <PreviewPanel title="Request preview" value={detailDialog.requestText} />
                    <PreviewPanel title="Response preview" value={detailDialog.responseText} />
                  </div>

                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Modification Applications</CardTitle>
                      <CardDescription>
                        Reuses the current KYC and traffic log streams to detect approved-profile
                        change requests. Applications are grouped by attempt number and only the
                        latest SUBMIT remains actionable.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ModificationApplicationsPanel
                        loading={detailKycLogs.loading || detailTrafficLogs.loading}
                        applications={modificationApplications}
                        onInspect={(entry, entryMode) => openLogDetail(entryMode, entry)}
                        onApprove={(application) =>
                          openModificationReviewDialog(application, "APPROVE")
                        }
                        onReject={(application) =>
                          openModificationReviewDialog(application, "REJECT")
                        }
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={modificationReviewDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setModificationReviewDialog(initialModificationReviewDialogState);
          }
        }}
      >
        <DialogContent className="max-w-2xl overflow-hidden rounded-[28px] border border-slate-200 p-0 shadow-2xl [&>button]:right-5 [&>button]:top-5 [&>button]:opacity-100">
          <div
            className={cn(
              "border-b px-6 py-5",
              modificationReviewDialog.action === "APPROVE"
                ? "bg-emerald-50"
                : "bg-rose-50",
            )}
          >
            <DialogHeader className="text-left">
              <DialogTitle className="text-xl">
                {modificationReviewDialog.action === "APPROVE"
                  ? "Approve Modification Application"
                  : "Reject Modification Application"}
              </DialogTitle>
              <DialogDescription>
                Review the approved-profile change request and record an audit remark before
                confirming.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-5 p-6">
            <div className="grid gap-3 md:grid-cols-2">
              <MetaItem
                label="Application Type"
                value={modificationReviewDialog.application?.typeLabel ?? "-"}
              />
              <MetaItem
                label="Attempt"
                value={modificationReviewDialog.application?.attemptNo ?? "-"}
              />
              <MetaItem
                label="Affiliate ID"
                value={
                  <span className="font-mono">
                    {modificationReviewDialog.application?.affiliateId ?? "-"}
                  </span>
                }
              />
              <MetaItem
                label="Current Result"
                value={
                  <StatusBadge
                    status={modificationReviewDialog.application?.status ?? "PENDING"}
                  />
                }
              />
            </div>

            <Card className="shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Submit Context</CardTitle>
                <CardDescription>
                  This shows the original application remark and the latest requested profile
                  changes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border bg-muted/10 p-4 text-sm text-muted-foreground">
                  {modificationReviewDialog.application?.submitRemark ||
                    "No submit remark provided."}
                </div>

                {modificationReviewDialog.application?.diffEntries.length ? (
                  <div className="space-y-3">
                    {modificationReviewDialog.application.diffEntries.map((entry) => (
                      <div
                        key={`${modificationReviewDialog.application?.key}-${entry.field}`}
                        className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)]"
                      >
                        <div className="text-sm font-medium text-foreground">{entry.label}</div>
                        <div className="space-y-1">
                          <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                            Before
                          </div>
                          <div className="text-sm text-muted-foreground">{entry.before}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                            After
                          </div>
                          <div className="text-sm text-foreground">{entry.after}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Review Remark</CardTitle>
                <CardDescription>
                  The remark is stored on the review log and shown in the grouped application
                  history.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Field label="Remark">
                  <Textarea
                    className="min-h-[120px] rounded-2xl"
                    maxLength={500}
                    placeholder={
                      modificationReviewDialog.action === "APPROVE"
                        ? "Example: Changes verified against the submitted documents and approved."
                        : "Example: Rejected because the requested profile changes do not match the supporting materials."
                    }
                    value={modificationReviewDialog.remark}
                    onChange={(event) =>
                      setModificationReviewDialog((current) => ({
                        ...current,
                        remark: event.target.value,
                      }))
                    }
                  />
                </Field>
                <div className="text-right text-xs text-muted-foreground">
                  {modificationReviewDialog.remark.trim().length}/500
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="border-t bg-muted/20 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setModificationReviewDialog(initialModificationReviewDialogState)
              }
              disabled={modificationReviewDialog.submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={
                modificationReviewDialog.action === "APPROVE"
                  ? "default"
                  : "destructive"
              }
              onClick={() => void submitModificationReview()}
              disabled={modificationReviewDialog.submitting}
            >
              {modificationReviewDialog.submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={reviewDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setReviewDialog(initialReviewDialogState);
            setReviewLogs(initialReviewLogState);
            setLogDetailDialog(initialLogDetailDialogState);
          }
        }}
      >
        <DialogContent className="flex max-h-[92vh] max-w-2xl flex-col overflow-hidden rounded-[28px] border border-slate-200 p-0 shadow-2xl [&>button]:right-5 [&>button]:top-5 [&>button]:opacity-100">
          <div
            className={cn(
              "shrink-0 border-b px-6 py-5",
              isApproveAction ? "bg-emerald-50" : "bg-rose-50",
            )}
          >
            <DialogHeader className="text-left">
              <DialogTitle className="text-xl">{reviewDialogTitle}</DialogTitle>
              <DialogDescription>{reviewDialogDescription}</DialogDescription>
            </DialogHeader>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-5 p-6">
              <div className="grid gap-3 md:grid-cols-2">
                <MetaItem
                  label="Affiliate ID"
                  value={<span className="font-mono">{String(reviewDialog.row?.affiliateId ?? "-")}</span>}
                />
                <MetaItem label="Name" value={String(reviewDialog.row?.name ?? "-")} />
                <MetaItem
                  label="Current Status"
                  value={<StatusBadge status={statusForRow(reviewDialog.mode, reviewDialog.row)} />}
                />
                <MetaItem label="Next Status" value={<StatusBadge status={String(reviewDialog.status)} />} />
              </div>

              <Card className="shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Previous Review History</CardTitle>
                  <CardDescription>
                    Past {reviewDialog.mode === "traffic" ? "traffic qualification" : "KYC"} review
                    records are loaded when this audit dialog opens.
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-hidden">
                  <ScrollArea className="h-[240px] rounded-2xl border bg-muted/10 p-4 sm:h-[280px]">
                    <div className="pr-4">
                      <ReviewHistoryTimeline
                        mode={reviewDialog.mode}
                        loading={reviewLogs.loading}
                        entries={reviewLogs.entries}
                        responseText={reviewLogs.responseText}
                        onSelect={(entry) => openLogDetail(reviewDialog.mode, entry)}
                      />
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Audit Remark</CardTitle>
                  <CardDescription>
                    This remark is submitted with the current review action and will appear in the
                    audit history.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Field label="Remark">
                    <Textarea
                      className="min-h-[112px] rounded-2xl"
                      maxLength={500}
                      placeholder={
                        reviewDialog.mode === "traffic"
                          ? isApproveAction
                            ? "Example: Traffic source verified. Approved and assigned to the selected BD owner."
                            : "Example: Rejected because the submitted traffic source materials are incomplete."
                          : isApproveAction
                            ? "Example: Identity documents verified successfully. Account type confirmed."
                            : "Example: Rejected because identity documents are missing or unreadable."
                      }
                      value={reviewDialog.remark}
                      onChange={(event) =>
                        setReviewDialog((prev) => ({
                          ...prev,
                          remark: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <div className="text-right text-xs text-muted-foreground">
                    {reviewDialog.remark.trim().length}/500
                  </div>
                </CardContent>
              </Card>

              {reviewDialog.mode === "traffic" && reviewDialog.status === "APPROVED" ? (
                <Card className="border-emerald-200 bg-emerald-50/60 shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Assign BD owner</CardTitle>
                    <CardDescription>
                      Search within the loaded BD users. Reload the source list if needed.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-sm font-medium">
                        Loaded {bdUsers.length} BD users
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void loadBdUsers()}
                        disabled={loadingBdUsers}
                      >
                        {loadingBdUsers ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                        Reload list
                      </Button>
                    </div>

                    <Field label="BD owner" className="max-w-md">
                      <BdCombobox
                        users={bdUsers}
                        value={reviewDialog.bdAdminId}
                        onChange={(value) =>
                          setReviewDialog((prev) => ({ ...prev, bdAdminId: value }))
                        }
                        disabled={loadingBdUsers || bdUsers.length === 0}
                      />
                    </Field>

                    {selectedReviewBd ? (
                      <div className="rounded-2xl border bg-white px-4 py-3 text-sm text-muted-foreground">
                        Selected BD:{" "}
                        <span className="font-medium text-foreground">{bdLabel(selectedReviewBd)}</span>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed bg-white px-4 py-3 text-sm text-muted-foreground">
                        Load BD users and choose one before confirming approval.
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : null}

              {reviewDialog.mode === "kyc" ? (
                <Card className="shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Account type confirmation</CardTitle>
                    <CardDescription>
                      KYC updates require an explicit account type.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Field label="Account type" className="max-w-xs">
                      <select
                        className={cn(controlClass, "rounded-xl")}
                        value={reviewDialog.accountType}
                        onChange={(event) =>
                          setReviewDialog((prev) => ({
                            ...prev,
                            accountType: event.target.value,
                          }))
                        }
                      >
                        <option value="">Choose account type</option>
                        {reviewAccountTypeChoices.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t bg-muted/20 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setReviewDialog(initialReviewDialogState);
                setReviewLogs(initialReviewLogState);
                setLogDetailDialog(initialLogDetailDialogState);
              }}
              disabled={reviewDialog.submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={isApproveAction ? "default" : "destructive"}
              onClick={() => void submitReview()}
              disabled={reviewDialog.submitting}
            >
              {reviewDialog.submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={logDetailDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setLogDetailDialog(initialLogDetailDialogState);
          }
        }}
      >
        <DialogContent className="max-w-6xl overflow-hidden rounded-[28px] border border-slate-200 p-0 shadow-2xl [&>button]:right-5 [&>button]:top-5 [&>button]:opacity-100">
          <div className="border-b bg-slate-950 px-6 py-5 text-slate-50">
            <DialogHeader className="text-left">
              <DialogTitle className="text-xl">Review Log Detail</DialogTitle>
              <DialogDescription className="text-slate-300">
                Inspect the selected {logModeLabel(logDetailDialog.mode)} log record in detail.
              </DialogDescription>
            </DialogHeader>
          </div>

          <ScrollArea className="h-[78vh]">
            <div className="space-y-6 p-6">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <MetaItem
                  label="Log ID"
                  value={<span className="font-mono">{String(logDetailDialog.entry?.id ?? "-")}</span>}
                />
                <MetaItem
                  label="Affiliate ID"
                  value={<span className="font-mono">{String(logDetailDialog.entry?.affiliateId ?? "-")}</span>}
                />
                <MetaItem
                  label="Event"
                  value={String(logDetailDialog.entry?.eventType ?? selectedLogSummary?.title ?? "-")}
                />
                <MetaItem
                  label="Attempt"
                  value={String(logDetailDialog.entry?.attemptNo ?? "-")}
                />
                <MetaItem
                  label={logDetailDialog.mode === "commission" ? "Previous Rate" : "From Status"}
                  value={
                    logDetailDialog.mode === "commission" ? (
                      formatCommissionRateText(
                        parsedSelectedLog.before.spread_percentage ??
                          ensureRecord(parsedSelectedLog.diff.spread_percentage).before,
                      )
                    ) : (
                      <StatusBadge status={String(logDetailDialog.entry?.fromStatus ?? "-")} />
                    )
                  }
                />
                <MetaItem
                  label={logDetailDialog.mode === "commission" ? "Updated Rate" : "To Status"}
                  value={
                    logDetailDialog.mode === "commission" ? (
                      formatCommissionRateText(
                        parsedSelectedLog.after.spread_percentage ??
                          ensureRecord(parsedSelectedLog.diff.spread_percentage).after,
                      )
                    ) : (
                      <StatusBadge status={String(logDetailDialog.entry?.toStatus ?? "-")} />
                    )
                  }
                />
                <MetaItem
                  label="Operator"
                  value={
                    String(
                      logDetailDialog.entry?.operatorName ||
                        logDetailDialog.entry?.operator ||
                        logDetailDialog.entry?.operatorId ||
                        "-",
                    )
                  }
                />
                <MetaItem
                  label="Create Time"
                  value={String(logDetailDialog.entry?.createTime ?? "-")}
                />
                <MetaItem
                  label="Biz Type"
                  value={String(logDetailDialog.entry?.bizSubType ?? logDetailDialog.entry?.bizType ?? "-")}
                />
                <MetaItem
                  label="Change Key"
                  value={logDetailDialog.entry?.changeKey ? logFieldLabel(String(logDetailDialog.entry.changeKey)) : "-"}
                />
                <MetaItem
                  label="Source"
                  value={String(logDetailDialog.entry?.source ?? "-")}
                />
                <MetaItem
                  label="Related Table"
                  value={String(logDetailDialog.entry?.relatedTable ?? "-")}
                />
              </div>

              <Card className="shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Readable Summary</CardTitle>
                  <CardDescription>
                    Human-friendly interpretation of this audit log.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={selectedLogSummary?.status || selectedLogSummary?.title || "-"} />
                    <div className="rounded-full border bg-muted/20 px-3 py-1 text-xs text-muted-foreground">
                      {selectedLogSummary?.time || "Time not returned"}
                    </div>
                  </div>
                  <div className="text-base font-semibold text-foreground">
                    {selectedLogSummary?.title || "Review log"}
                  </div>
                  <div className="text-sm leading-6 text-foreground">
                    {selectedLogSummary?.summary || "No summary available for this log entry."}
                  </div>
                  {selectedLogSummary?.note ? (
                    <div className="rounded-2xl border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                      {selectedLogSummary.note}
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Field Changes</CardTitle>
                  <CardDescription>
                    Parsed from <code>changeData.diff</code>.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedLogDiffEntries.length > 0 ? (
                    <div className="space-y-3">
                      {selectedLogDiffEntries.map((diff) => (
                        <div
                          key={diff.field}
                          className="grid gap-3 rounded-2xl border bg-white p-4 lg:grid-cols-[180px_1fr_1fr]"
                        >
                          <div className="text-sm font-semibold text-foreground">{diff.label}</div>
                          <div className="rounded-xl border bg-rose-50/50 px-3 py-2">
                            <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                              Before
                            </div>
                            <div className="mt-2 break-all text-sm text-foreground">{diff.before}</div>
                          </div>
                          <div className="rounded-xl border bg-emerald-50/50 px-3 py-2">
                            <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                              After
                            </div>
                            <div className="mt-2 break-all text-sm text-foreground">{diff.after}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed bg-muted/10 px-4 py-6 text-sm text-muted-foreground">
                      No field-level diff was recorded for this log. This usually means the same
                      status was submitted again without changing stored values.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Snapshot Highlights</CardTitle>
                  <CardDescription>
                    Key business fields extracted from <code>changeData.snapshot</code>.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedLogSnapshotHighlights.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {selectedLogSnapshotHighlights.map((item) => (
                        <MetaItem key={item.key} label={item.label} value={item.value} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed bg-muted/10 px-4 py-6 text-sm text-muted-foreground">
                      No snapshot highlight fields were available in this log.
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-4 xl:grid-cols-2">
                <PreviewPanel
                  title="Before / After / Diff JSON"
                  value={
                    parsedSelectedLog.parsed
                      ? prettyJson({
                          diff: parsedSelectedLog.diff,
                          before: parsedSelectedLog.before,
                          after: parsedSelectedLog.after,
                        })
                      : parsedSelectedLog.raw || "{}"
                  }
                />
                <PreviewPanel
                  title="Snapshot JSON"
                  value={prettyJson(parsedSelectedLog.snapshot)}
                />
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default KolAuditPage;
