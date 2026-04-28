import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  Check,
  ChevronDown,
  CreditCard,
  Loader2,
  RefreshCcw,
  Search,
  Users,
  Wallet,
} from "lucide-react";
import { format, subDays } from "date-fns";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { affiliateConsoleApi, CONSOLE_PLATFORM_CODE } from "@/api/affiliate-console";
import AdminLayout from "@/components/admin/AdminLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, Field, PageIntro, StatCard, StatusBadge } from "@/features/console/shared";
import { controlClass } from "@/features/console/shared-utils";
import { cn } from "@/lib/utils";
import type {
  AffiliateBaseDetail,
  AffiliateBDOwnerChangeLogDetail,
  AffiliateReviewLogEntry,
  AffiliateCampaignSummaryRow,
  AffiliateDetailWithLogsValue,
  AuthUserInfo,
  CustomerDetailRow,
  CustomerReportRow,
  PaymentBatch,
  PaymentCommissionRow,
  PerformanceReportRow,
  TradeReportRow,
} from "@/types/affiliate-console";
import { toast } from "sonner";

type AffiliateProfileSnapshot = {
  affiliateId: string;
  affiliateCode: string;
  referralCode: string;
  name: string;
  mail: string;
  accountType: string;
  countryCode: string;
  owner: string;
  kycStatus: string;
  trafficStatus: string;
  createTime: string;
  auditTime: string;
  bdOwnerAdminId: string;
  shortLink: string;
  websites: string[];
  commissionRate: string;
  tier: string;
  mitradeLiveAccount: string;
};

type BdOwnerDialogState = {
  open: boolean;
  submitting: boolean;
  bdAdminId: string;
  remark: string;
};

type BdOwnerCandidate = {
  owner: string;
  bdOwnerAdminId: string;
  updatedAt: string;
};

const todayText = format(new Date(), "yyyy-MM-dd");
const defaultRangeStart = format(subDays(new Date(), 29), "yyyy-MM-dd");

const defaultUserQuery = {
  tradingAccountNumber: "",
  medium: "",
  registrationDateStart: "",
  registrationDateEnd: "",
  showTestingAccounts: "0",
  page: "1",
  pageSize: "20",
};

const defaultCustomerDetailsQuery = {
  startDate: "",
  endDate: "",
  customerEmail: "",
  currentPage: "1",
  pageSize: "10",
};

const defaultCampaignQuery = {
  currentPage: "1",
  pageSize: "1",
  sortField: "create_time",
  sortModel: "desc",
  showTestAccount: "false",
};

const defaultPaymentHistoryQuery = {
  status: "",
  date: "",
  page: "1",
  pageSize: "10",
};

const defaultCustomerReportQuery = {
  date: "signupDate",
  from: defaultRangeStart,
  to: todayText,
  fields:
    "customerId,note,country,signupDate,platform,deviceOS,fullSignupDate,ftdDate,qualifiedDate,firstDepositAmount,totalDepositAmount,totalOrderValue,commission",
  sortField: "signupDate",
  sort: "desc",
  currentPage: "1",
  pageSize: "10",
};

const defaultPerformanceReportQuery = {
  groupBy: "day",
  from: defaultRangeStart,
  to: todayText,
  fields: "date,signups,qualifiedCustomers,fullSignups,totalOrderValue,commission,conversionRatio",
  sortField: "date",
  sort: "asc",
  currentPage: "1",
  pageSize: "10",
};

const defaultTradeReportQuery = {
  groupByInstrument: "false",
  from: defaultRangeStart,
  to: todayText,
  fields: "customerId,countryCode,symbolCode,openTime,volume,spreadValue,orderValue",
  sortField: "openTime",
  sort: "desc",
  currentPage: "1",
  pageSize: "10",
};

const initialBdOwnerDialogState: BdOwnerDialogState = {
  open: false,
  submitting: false,
  bdAdminId: "",
  remark: "",
};

type BaseFieldConfig = {
  key: keyof AffiliateBaseDetail;
  label: string;
  kind?: "text" | "status" | "json";
  valueClassName?: string;
};

type BaseFieldSection = {
  title: string;
  description: string;
  fields: BaseFieldConfig[];
};

type LogPayloadDialogState = {
  open: boolean;
  title: string;
  payload: string;
};

const initialLogPayloadDialogState: LogPayloadDialogState = {
  open: false,
  title: "",
  payload: "",
};

const affiliateBaseSections: BaseFieldSection[] = [
  {
    title: "Basic",
    description: "Core identity and account metadata from affiliate_base.",
    fields: [
      { key: "affiliateId", label: "Affiliate ID", valueClassName: "break-all font-mono text-sm" },
      { key: "affiliateCode", label: "Affiliate Code" },
      { key: "name", label: "Name" },
      { key: "mail", label: "Email" },
      { key: "countryCode", label: "Country Code" },
      { key: "compensationModel", label: "Compensation Model" },
      { key: "referralCode", label: "Referral Code", valueClassName: "break-all font-mono text-sm" },
      { key: "inviteCode", label: "Invite Code" },
      { key: "utmSource", label: "UTM Source" },
      { key: "password", label: "Password", valueClassName: "break-all text-sm font-normal" },
    ],
  },
  {
    title: "Contact",
    description: "Payment, email subscription, and personal contact fields.",
    fields: [
      { key: "paypalAccount", label: "PayPal Account", valueClassName: "break-all text-sm" },
      { key: "receiveUpdateMailSetting", label: "Receive Update Mail" },
      { key: "receiveTransReportMailSetting", label: "Receive Transaction Report Mail" },
      { key: "idPhone", label: "ID Phone" },
      { key: "idOtherPhone", label: "ID Other Phone" },
      { key: "idAddress", label: "ID Address", valueClassName: "break-all text-sm" },
      { key: "idCity", label: "ID City" },
      { key: "idState", label: "ID State" },
      { key: "idZip", label: "ID Zip" },
    ],
  },
  {
    title: "KYC / ID",
    description: "Identity review fields and reviewer metadata.",
    fields: [
      { key: "idAccountType", label: "ID Account Type" },
      { key: "idKycStatus", label: "ID KYC Status", kind: "status" },
      { key: "idFirstName", label: "ID First Name" },
      { key: "idLastName", label: "ID Last Name" },
      { key: "idType", label: "ID Type" },
      { key: "idNumber", label: "ID Number", valueClassName: "break-all text-sm" },
      { key: "idBirthday", label: "ID Birthday" },
      { key: "idApprovedBy", label: "ID Approved By" },
      { key: "idApproverNotes", label: "ID Approver Notes", valueClassName: "break-all text-sm" },
      { key: "idTimestamp", label: "ID Timestamp" },
      { key: "idMitradeLiveAccount", label: "ID Mitrade Live Account" },
      { key: "idImg", label: "ID Image", valueClassName: "break-all text-sm" },
      { key: "idProofOfAddressImg", label: "Proof Of Address Image", valueClassName: "break-all text-sm" },
    ],
  },
  {
    title: "Company",
    description: "Company account fields when the affiliate uses a company identity.",
    fields: [
      { key: "idCompanyName", label: "Company Name" },
      { key: "idMainOfficePhone", label: "Main Office Phone" },
      { key: "idCompanyReg", label: "Company Registration" },
      { key: "idOfficeAddress", label: "Office Address", valueClassName: "break-all text-sm" },
      { key: "idOfficeCity", label: "Office City" },
      { key: "idOfficeZip", label: "Office Zip" },
      { key: "idCompanyRegCertImg", label: "Company Registration Certificate", valueClassName: "break-all text-sm" },
    ],
  },
  {
    title: "Traffic",
    description: "Traffic approval fields stored on the affiliate base row.",
    fields: [
      { key: "trafficResourceStatus", label: "Traffic Resource Status", kind: "status" },
      { key: "trafficResourceApprovedBy", label: "Traffic Resource Approved By" },
      { key: "shortLink", label: "Short Link", valueClassName: "break-all text-sm" },
    ],
  },
  {
    title: "Payment / Campaign",
    description: "Payment methods and campaign-related base fields.",
    fields: [
      { key: "campaignCost", label: "Campaign Cost" },
      { key: "campaignStartDate", label: "Campaign Start Date" },
      { key: "paymentMethods", label: "Payment Methods", kind: "json" },
    ],
  },
  {
    title: "System",
    description: "Lifecycle and operational system fields.",
    fields: [
      { key: "createTime", label: "Create Time" },
      { key: "updateTime", label: "Update Time" },
      { key: "lastSyncPerformanceDate", label: "Last Sync Performance Date" },
      { key: "isTest", label: "Is Test" },
      { key: "deleted", label: "Deleted" },
    ],
  },
];

function toRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function pickFirstText(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = String(record[key] ?? "").trim();
    if (value) {
      return value;
    }
  }
  return "";
}

function pickStringArray(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      const list = value
        .map((item) => String(item ?? "").trim())
        .filter(Boolean);
      if (list.length > 0) {
        return list;
      }
    }
    if (typeof value === "string") {
      const list = value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean);
      if (list.length > 0) {
        return list;
      }
    }
  }
  return [] as string[];
}

function extractAuditRoot(value: unknown) {
  const record = toRecord(value);
  const nestedValue = toRecord(record.value);
  return Object.keys(nestedValue).length > 0 ? nestedValue : record;
}

function buildProfileSnapshot(value: unknown, fallbackAffiliateId: string) {
  const detail = extractAuditRoot(value);
  const paymentMethods = toRecord(detail.paymentMethods);
  const wireTransfer = toRecord(paymentMethods.wireTransfer);

  return {
    affiliateId: pickFirstText(detail, ["affiliateId", "affiliate_id"]) || fallbackAffiliateId,
    affiliateCode: pickFirstText(detail, ["affiliateCode", "affiliate_code"]),
    referralCode: pickFirstText(detail, ["referralCode", "referral_code"]),
    name: pickFirstText(detail, ["name"]),
    mail: pickFirstText(detail, ["mail", "email"]),
    accountType: pickFirstText(detail, ["accountType", "idAccountType"]),
    countryCode: pickFirstText(detail, ["countryCode", "country_code"]),
    owner: pickFirstText(detail, ["bdOwnerUsernameSnapshot", "owner"]),
    kycStatus: pickFirstText(detail, ["idKYCStatus", "idKycStatus", "id_kyc_status"]),
    trafficStatus: pickFirstText(detail, ["trafficResourceStatus", "traffic_resource_status"]),
    createTime: pickFirstText(detail, ["createTime", "create_time"]),
    auditTime: pickFirstText(detail, ["auditTime", "idTimestamp", "id_timestamp"]),
    bdOwnerAdminId: pickFirstText(detail, ["bdOwnerAdminId", "bd_owner_admin_id"]),
    shortLink: pickFirstText(detail, ["shortLink", "short_link"]),
    websites: pickStringArray(detail, ["websites", "trafficSource"]),
    commissionRate: pickFirstText(detail, ["commissionRate", "spreadPercentage", "spread_percentage"]),
    tier: pickFirstText(detail, ["tier", "rsTier", "fixedTier"]),
    mitradeLiveAccount:
      pickFirstText(paymentMethods, ["mitradeLiveAccount"]) ||
      pickFirstText(detail, ["idMitradeLiveAccount", "mitradeLiveAccount"]) ||
      pickFirstText(wireTransfer, ["mitradeLiveAccount"]),
  } satisfies AffiliateProfileSnapshot;
}

function bdLabel(user: AuthUserInfo) {
  const username = String(user.username ?? "").trim();
  const email = String(user.email ?? "").trim();

  if (username && email && username !== email) {
    return `${username} (${email})`;
  }

  return username || email || `Admin ${user.adminId ?? "-"}`;
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

function parseChangeData(entry: AffiliateReviewLogEntry) {
  const raw = String(entry.changeData ?? "").trim();
  if (!raw) {
    return {
      before: {},
      after: {},
      diff: {},
      snapshot: {},
    };
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      before: toRecord(parsed.before),
      after: toRecord(parsed.after),
      diff: toRecord(parsed.diff),
      snapshot: toRecord(parsed.snapshot),
    };
  } catch {
    return {
      before: {},
      after: {},
      diff: {},
      snapshot: {},
    };
  }
}

function formatDisplayValue(value: unknown) {
  if (value === null || value === undefined) {
    return "-";
  }

  if (Array.isArray(value)) {
    const text = value
      .map((item) => String(item ?? "").trim())
      .filter(Boolean)
      .join(", ");
    return text || "-";
  }

  const text = String(value).trim();
  return text || "-";
}

function formatJsonLikeText(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) {
    return "-";
  }

  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

function getLogDisplayTime(entry?: AffiliateReviewLogEntry | null) {
  if (!entry) {
    return "-";
  }
  return (
    String(entry.createTime ?? entry.updateTime ?? entry.operationTime ?? entry.auditTime ?? "").trim() || "-"
  );
}

function getLogOperatorDisplay(entry?: AffiliateReviewLogEntry | null) {
  if (!entry) {
    return "-";
  }
  const operatorName = String(entry.operatorName ?? "").trim();
  const operatorId = String(entry.operatorId ?? "").trim();

  if (operatorName && operatorId) {
    return `${operatorName} / ${operatorId}`;
  }

  return operatorName || operatorId || "-";
}

function extractCurrentBdFromBdOwnerDetails(entries: AffiliateBDOwnerChangeLogDetail[]) {
  return entries.reduce<BdOwnerCandidate>(
    (latest, entry) => {
      const candidate: BdOwnerCandidate = {
        owner: String(entry.bdOwnerUsernameSnapshot ?? "").trim(),
        bdOwnerAdminId: String(entry.bdOwnerAdminId ?? "").trim(),
        updatedAt:
          String(entry.changeTime ?? entry.updatedTime ?? entry.createdTime ?? "").trim(),
      };

      return pickLatestBdOwnerCandidate(latest, candidate);
    },
    {
      owner: "",
      bdOwnerAdminId: "",
      updatedAt: "",
    },
  );
}

function extractCurrentCommissionSnapshot(entries: AffiliateReviewLogEntry[]) {
  return entries.reduce(
    (latest, entry) => {
      const parsed = parseChangeData(entry);
      const candidate = {
        spreadPercentage: String(
          parsed.after.spread_percentage ??
            parsed.snapshot.spread_percentage ??
            parsed.before.spread_percentage ??
            "",
        ).trim(),
        tier: String(parsed.after.tier ?? parsed.snapshot.tier ?? parsed.before.tier ?? "").trim(),
        updatedAt: getLogDisplayTime(entry),
      };

      if (!candidate.spreadPercentage && !candidate.tier) {
        return latest;
      }

      if (!latest.spreadPercentage && !latest.tier) {
        return candidate;
      }

      return parseCandidateTime(candidate.updatedAt) >= parseCandidateTime(latest.updatedAt)
        ? candidate
        : latest;
    },
    {
      spreadPercentage: "",
      tier: "",
      updatedAt: "",
    },
  );
}

function isBdOwnerChangeLog(entry: AffiliateReviewLogEntry) {
  const bizType = String(entry.bizType ?? "").trim().toUpperCase();
  const bizSubType = String(entry.bizSubType ?? "").trim().toUpperCase();
  const changeKey = String(entry.changeKey ?? "").trim().toLowerCase();

  return (
    changeKey === "bd_owner_admin_id" ||
    bizSubType === "BD_OWNER" ||
    (bizType === "OWNER" && (!bizSubType || bizSubType === "BD_OWNER"))
  );
}

function summarizeBdOwnerChange(entry: AffiliateReviewLogEntry) {
  const parsed = parseChangeData(entry);
  const beforeOwner =
    String(
      parsed.before.bd_owner_username_snapshot ??
        toRecord(parsed.diff.bd_owner_username_snapshot).before ??
        "-",
    ).trim() || "-";
  const afterOwner =
    String(
      parsed.after.bd_owner_username_snapshot ??
        parsed.snapshot.bd_owner_username_snapshot ??
        toRecord(parsed.diff.bd_owner_username_snapshot).after ??
        entry.bdOwnerUsernameSnapshot ??
        entry.owner ??
        "-",
    ).trim() || "-";
  const beforeAdminId =
    String(parsed.before.bd_owner_admin_id ?? toRecord(parsed.diff.bd_owner_admin_id).before ?? "").trim();
  const afterAdminId =
    String(
      parsed.after.bd_owner_admin_id ??
        parsed.snapshot.bd_owner_admin_id ??
        toRecord(parsed.diff.bd_owner_admin_id).after ??
        "",
    ).trim();
  const operator =
    String(
      entry.operatorName ??
        entry.operator ??
        entry.username ??
        entry.userName ??
        entry.adminName ??
        entry.operatorId ??
        "-",
    ).trim() || "-";
  const remark =
    String(entry.remark ?? entry.description ?? entry.comment ?? entry.message ?? "").trim();
  const time =
    String(entry.updateTime ?? entry.operationTime ?? entry.createTime ?? entry.auditTime ?? "-").trim() || "-";
  const action =
    String(entry.eventType ?? entry.action ?? entry.operationType ?? "UPDATE").trim().toUpperCase() || "UPDATE";

  return {
    beforeOwner,
    afterOwner,
    beforeAdminId,
    afterAdminId,
    operator,
    remark,
    time,
    action,
  };
}

function extractLogUpdatedAt(entry: AffiliateReviewLogEntry) {
  return String(entry.updateTime ?? entry.operationTime ?? entry.createTime ?? entry.auditTime ?? "").trim();
}

function parseCandidateTime(value: string) {
  const text = String(value ?? "").trim();
  if (!text) {
    return 0;
  }

  const normalized = text.includes("T") ? text : text.replace(" ", "T");
  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pickLatestBdOwnerCandidate(...candidates: Array<BdOwnerCandidate | null | undefined>) {
  return candidates.reduce<BdOwnerCandidate>(
    (latest, candidate) => {
      if (!candidate || (!candidate.owner && !candidate.bdOwnerAdminId)) {
        return latest;
      }

      if (!latest.owner && !latest.bdOwnerAdminId) {
        return candidate;
      }

      return parseCandidateTime(candidate.updatedAt) >= parseCandidateTime(latest.updatedAt)
        ? candidate
        : latest;
    },
    {
      owner: "",
      bdOwnerAdminId: "",
      updatedAt: "",
    },
  );
}

function extractCurrentBdFromTrafficLogs(value: unknown) {
  const entries = normalizeLogEntries(value);
  let latestCandidate: BdOwnerCandidate | null = null;

  for (const entry of entries) {
    const parsed = parseChangeData(entry);
    const owner =
      String(
        parsed.after.bd_owner_username_snapshot ??
          parsed.snapshot.bd_owner_username_snapshot ??
          toRecord(parsed.diff.bd_owner_username_snapshot).after ??
          entry.bdOwnerUsernameSnapshot ??
          entry.owner ??
          "",
      ).trim();
    const bdOwnerAdminId =
      String(
        parsed.after.bd_owner_admin_id ??
          parsed.snapshot.bd_owner_admin_id ??
          toRecord(parsed.diff.bd_owner_admin_id).after ??
          "",
      ).trim();
    const updatedAt = extractLogUpdatedAt(entry);

    if (!owner && !bdOwnerAdminId) {
      continue;
    }

    latestCandidate = pickLatestBdOwnerCandidate(latestCandidate, {
      owner,
      bdOwnerAdminId,
      updatedAt,
    });
  }

  return latestCandidate ?? {
    owner: "",
    bdOwnerAdminId: "",
    updatedAt: "",
  };
}

function resolveBdSelection(
  users: AuthUserInfo[],
  currentBdOwnerAdminId?: string,
  currentOwnerName?: string,
) {
  const currentAdminId = String(currentBdOwnerAdminId ?? "").trim();

  if (currentAdminId && users.some((user) => String(user.adminId ?? "").trim() === currentAdminId)) {
    return currentAdminId;
  }

  const currentOwner = String(currentOwnerName ?? "").trim().toLowerCase();
  if (!currentOwner) {
    return "";
  }

  const matched = users.find((user) => {
    const username = String(user.username ?? "").trim().toLowerCase();
    const email = String(user.email ?? "").trim().toLowerCase();
    return username === currentOwner || email === currentOwner || bdLabel(user).toLowerCase() === currentOwner;
  });

  return matched?.adminId !== undefined && matched?.adminId !== null ? String(matched.adminId) : "";
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
  const selectedUser = users.find((user) => String(user.adminId ?? "") === value) ?? null;

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
      <PopoverContent align="start" className="w-[360px] max-w-[var(--radix-popover-content-available-width)] p-0">
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

function formatNumberText(value: unknown) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return String(value ?? "-");
  }
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(numeric);
}

function formatCurrencyText(value: unknown) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return String(value ?? "-");
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(numeric);
}

function formatPercentText(value: unknown) {
  const text = String(value ?? "").trim();
  return text ? `${text}%` : "-";
}

function paymentPeriod(batch?: PaymentBatch | null) {
  const start = String(batch?.periodStartDate ?? "").trim();
  const end = String(batch?.periodEndDate ?? "").trim();
  if (start || end) {
    return [start, end].filter(Boolean).join(" to ");
  }
  return String(batch?.date ?? "-");
}

function PaginationBar({
  page,
  pageSize,
  total,
  loading,
  onPrev,
  onNext,
}: {
  page: number;
  pageSize: number;
  total: number;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const maxSeen = Math.min(total, page * pageSize);
  const minSeen = total === 0 ? 0 : (page - 1) * pageSize + 1;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm text-muted-foreground">
      <span>
        Showing {minSeen} to {maxSeen} of {total}
      </span>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onPrev} disabled={loading || page <= 1}>
          Prev
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onNext}
          disabled={loading || maxSeen >= total}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border bg-muted/20 p-4">
      <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div
        className={cn("mt-2 text-lg font-semibold text-foreground", valueClassName)}
        title={value || "-"}
      >
        {value || "-"}
      </div>
    </div>
  );
}

const AffiliateProfilePage = () => {
  const navigate = useNavigate();
  const { affiliateId: rawAffiliateId } = useParams();
  const affiliateId = String(rawAffiliateId ?? "").trim();

  const [activeTab, setActiveTab] = useState("overview");
  const [reportsTab, setReportsTab] = useState("customer");
  const [refreshingAll, setRefreshingAll] = useState(false);

  const [detailWithLogs, setDetailWithLogs] = useState<AffiliateDetailWithLogsValue | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [logPayloadDialog, setLogPayloadDialog] = useState<LogPayloadDialogState>(
    initialLogPayloadDialogState,
  );

  const [campaignSummary, setCampaignSummary] = useState<AffiliateCampaignSummaryRow | null>(null);
  const [campaignLoading, setCampaignLoading] = useState(true);
  const [campaignError, setCampaignError] = useState("");
  const [bdUsers, setBdUsers] = useState<AuthUserInfo[]>([]);
  const [bdUsersLoading, setBdUsersLoading] = useState(false);
  const [bdOwnerDialog, setBdOwnerDialog] = useState<BdOwnerDialogState>(initialBdOwnerDialogState);

  const [userQuery, setUserQuery] = useState(defaultUserQuery);
  const [usersData, setUsersData] = useState({ total: 0, userInfo: [] as Record<string, unknown>[] });
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");

  const [customerDetailsQuery, setCustomerDetailsQuery] = useState(defaultCustomerDetailsQuery);
  const [customerDetails, setCustomerDetails] = useState({ total: 0, resultList: [] as CustomerDetailRow[] });
  const [customerDetailsLoading, setCustomerDetailsLoading] = useState(true);
  const [customerDetailsError, setCustomerDetailsError] = useState("");

  const [currentPayment, setCurrentPayment] = useState({
    total: 0,
    payments: null as PaymentBatch | null,
    commissions: [] as PaymentCommissionRow[],
  });
  const [currentPaymentLoading, setCurrentPaymentLoading] = useState(true);
  const [currentPaymentError, setCurrentPaymentError] = useState("");

  const [paymentHistoryQuery, setPaymentHistoryQuery] = useState(defaultPaymentHistoryQuery);
  const [paymentHistory, setPaymentHistory] = useState({
    total: 0,
    currentPage: 1,
    pageSize: 10,
    totalPages: 0,
    payments: [] as PaymentBatch[],
  });
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(true);
  const [paymentHistoryError, setPaymentHistoryError] = useState("");

  const [selectedPaymentId, setSelectedPaymentId] = useState("");
  const [selectedPaymentLabel, setSelectedPaymentLabel] = useState("");
  const [paymentCommissions, setPaymentCommissions] = useState({
    total: 0,
    commissions: [] as PaymentCommissionRow[],
  });
  const [paymentCommissionsLoading, setPaymentCommissionsLoading] = useState(false);
  const [paymentCommissionsError, setPaymentCommissionsError] = useState("");

  const [customerReportQuery, setCustomerReportQuery] = useState(defaultCustomerReportQuery);
  const [customerReport, setCustomerReport] = useState({
    total: 0,
    currentPage: 1,
    pageSize: 10,
    totalPages: 0,
    resultList: [] as CustomerReportRow[],
  });
  const [customerReportLoading, setCustomerReportLoading] = useState(true);
  const [customerReportError, setCustomerReportError] = useState("");

  const [performanceReportQuery, setPerformanceReportQuery] = useState(defaultPerformanceReportQuery);
  const [performanceReport, setPerformanceReport] = useState({
    total: 0,
    currentPage: 1,
    pageSize: 10,
    totalPages: 0,
    resultList: [] as PerformanceReportRow[],
    summary: {} as PerformanceReportRow,
  });
  const [performanceReportLoading, setPerformanceReportLoading] = useState(true);
  const [performanceReportError, setPerformanceReportError] = useState("");

  const [tradeReportQuery, setTradeReportQuery] = useState(defaultTradeReportQuery);
  const [tradeReport, setTradeReport] = useState({
    total: 0,
    currentPage: 1,
    pageSize: 10,
    totalPages: 0,
    resultList: [] as TradeReportRow[],
  });
  const [tradeReportLoading, setTradeReportLoading] = useState(true);
  const [tradeReportError, setTradeReportError] = useState("");

  const reloadEverythingRef = useRef<(showToast?: boolean) => Promise<void>>(async () => {});

  const affiliateBase = detailWithLogs?.affiliateBase ?? null;
  const trafficQualificationAuditLogs = detailWithLogs?.trafficQualificationAuditLogs ?? [];
  const kycAuditLogs = detailWithLogs?.kycAuditLogs ?? [];
  const bdOwnerChangeLogDetails = detailWithLogs?.bdOwnerChangeLogs ?? [];
  const commissionChangeLogs = detailWithLogs?.commissionChangeLogs ?? [];
  const otherChangeLogs = detailWithLogs?.otherChangeLogs ?? [];
  const profileBase = buildProfileSnapshot(affiliateBase ?? {}, affiliateId);
  const currentCommissionSnapshot = extractCurrentCommissionSnapshot(commissionChangeLogs);
  const currentBdCandidate = pickLatestBdOwnerCandidate(
    extractCurrentBdFromBdOwnerDetails(bdOwnerChangeLogDetails),
    extractCurrentBdFromTrafficLogs(trafficQualificationAuditLogs),
  );
  const profile = {
    ...profileBase,
    owner: currentBdCandidate.owner || profileBase.owner,
    bdOwnerAdminId: currentBdCandidate.bdOwnerAdminId || profileBase.bdOwnerAdminId,
    commissionRate: currentCommissionSnapshot.spreadPercentage || profileBase.commissionRate,
    tier: currentCommissionSnapshot.tier || profileBase.tier,
  };
  const currentPaymentBatch = currentPayment.payments;
  const historyRows = paymentHistory.payments ?? [];
  const resolvedCurrentOwner = profile.owner;
  const resolvedCurrentBdOwnerAdminId = profile.bdOwnerAdminId;
  const currentBdDisplay = resolvedCurrentOwner || "-";
  const currentBdAdminIdDisplay = resolvedCurrentBdOwnerAdminId || "-";
  const selectedBdUser = bdUsers.find((user) => String(user.adminId ?? "") === bdOwnerDialog.bdAdminId) ?? null;
  const performanceChartData = (performanceReport.resultList ?? []).map((row) => ({
    date: String(row.date ?? "-"),
    commission: Number(row.commission ?? 0),
    totalOrderValue: Number(row.totalOrderValue ?? 0),
  }));

  async function loadDetailSnapshot() {
    if (!affiliateId) {
      return null;
    }

    setProfileLoading(true);
    setProfileError("");

    try {
      const result = await affiliateConsoleApi.getAffiliateDetailWithLogs(affiliateId);
      setDetailWithLogs(result.value ?? null);
      return buildProfileSnapshot(result.value?.affiliateBase ?? {}, affiliateId);
    } catch (error) {
      setDetailWithLogs(null);
      setProfileError(error instanceof Error ? error.message : "Failed to load affiliate detail.");
      return null;
    } finally {
      setProfileLoading(false);
    }
  }

  async function loadCampaignSummary(snapshot?: AffiliateProfileSnapshot | null) {
    const nextProfile = snapshot ?? profile;
    const mail = String(nextProfile.mail ?? "").trim();

    setCampaignLoading(true);
    setCampaignError("");

    if (!mail) {
      setCampaignSummary(null);
      setCampaignLoading(false);
      setCampaignError("Affiliate email is missing, so campaign overview cannot be filtered precisely.");
      return;
    }

    try {
      const result = await affiliateConsoleApi.getAffiliateCampaignList({
        ...defaultCampaignQuery,
        mail,
      });
      setCampaignSummary((result.value.resultList ?? [])[0] ?? null);
    } catch (error) {
      setCampaignSummary(null);
      setCampaignError(error instanceof Error ? error.message : "Failed to load campaign overview.");
    } finally {
      setCampaignLoading(false);
    }
  }

  const loadBdUsers = useCallback(async (showToast = false) => {
    setBdUsersLoading(true);

    try {
      const result = await affiliateConsoleApi.listAuthUsers({
        platformCode: CONSOLE_PLATFORM_CODE,
        roleCodes: ["KOL_BD"],
      });
      const nextUsers = result.value.list ?? [];
      setBdUsers(nextUsers);

      setBdOwnerDialog((current) => {
        if (!current.open) {
          return current;
        }

        const resolvedBdAdminId =
          current.bdAdminId ||
          resolveBdSelection(nextUsers, resolvedCurrentBdOwnerAdminId, resolvedCurrentOwner);

        return resolvedBdAdminId === current.bdAdminId
          ? current
          : { ...current, bdAdminId: resolvedBdAdminId };
      });

      if (showToast) {
        toast.success(`Loaded ${result.value.total ?? nextUsers.length} BD users.`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load BD users.");
    } finally {
      setBdUsersLoading(false);
    }
  }, [resolvedCurrentBdOwnerAdminId, resolvedCurrentOwner]);

  async function submitBdOwnerChange() {
    const selectedUser = selectedBdUser;
    const remark = bdOwnerDialog.remark.trim();

    if (!affiliateId) {
      return;
    }

    if (!selectedUser?.adminId) {
      toast.error("Choose a BD user before confirming.");
      return;
    }

    const snapshot = String(selectedUser.username ?? selectedUser.email ?? "").trim();
    if (!snapshot) {
      toast.error("The selected BD user is missing a username and email snapshot.");
      return;
    }

    setBdOwnerDialog((prev) => ({ ...prev, submitting: true }));

    try {
      await affiliateConsoleApi.updateAffiliateBdOwner({
        affiliateId,
        bdOwnerAdminId: String(selectedUser.adminId),
        bdOwnerUsernameSnapshot: snapshot,
        remark,
      });

      toast.success("BD owner updated successfully.");
      setBdOwnerDialog(initialBdOwnerDialogState);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update BD owner.");
      setBdOwnerDialog((prev) => ({ ...prev, submitting: false }));
      return;
    }

    try {
      await loadDetailSnapshot();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `BD owner updated, but refresh failed: ${error.message}`
          : "BD owner updated, but the page refresh failed.",
      );
    }
  }

  async function loadUsers(nextQuery = userQuery, snapshot?: AffiliateProfileSnapshot | null) {
    const nextProfile = snapshot ?? profile;
    const affiliateCode = String(nextProfile.affiliateCode ?? "").trim();
    const affiliateMail = String(nextProfile.mail ?? "").trim();
    const affiliateName = String(nextProfile.name ?? "").trim();

    setUsersLoading(true);
    setUsersError("");

    if (!affiliateCode && !affiliateMail && !affiliateName) {
      setUsersData({ total: 0, userInfo: [] });
      setUsersLoading(false);
      setUsersError("Affiliate code, email, and name are all unavailable. The invited-user list cannot be constrained.");
      return;
    }

    try {
      const result = await affiliateConsoleApi.listKolUsers({
        ...nextQuery,
        affiliateCode: affiliateCode || undefined,
        affiliateMail: affiliateMail || undefined,
        affiliateName: affiliateName || undefined,
      });
      setUserQuery(nextQuery);
      setUsersData({
        total: result.value.total ?? 0,
        userInfo: (result.value.userInfo ?? []) as Record<string, unknown>[],
      });
    } catch (error) {
      setUsersError(error instanceof Error ? error.message : "Failed to load invited-user list.");
    } finally {
      setUsersLoading(false);
    }
  }

  async function loadCustomerDetails(nextQuery = customerDetailsQuery) {
    if (!affiliateId) {
      return;
    }

    setCustomerDetailsLoading(true);
    setCustomerDetailsError("");

    try {
      const result = await affiliateConsoleApi.getCustomerDetails({
        affiliateId,
        ...nextQuery,
        affiliateEmail: profile.mail || undefined,
      });
      setCustomerDetailsQuery(nextQuery);
      setCustomerDetails({
        total: result.value.total ?? 0,
        resultList: result.value.resultList ?? [],
      });
    } catch (error) {
      setCustomerDetailsError(error instanceof Error ? error.message : "Failed to load customer detail rows.");
    } finally {
      setCustomerDetailsLoading(false);
    }
  }

  async function loadCurrentPayment() {
    if (!affiliateId) {
      return;
    }

    setCurrentPaymentLoading(true);
    setCurrentPaymentError("");

    try {
      const result = await affiliateConsoleApi.getCurrentPayment(affiliateId);
      const paymentSource = result.value.payments;
      const batch = Array.isArray(paymentSource) ? paymentSource[0] ?? null : paymentSource ?? null;
      const commissions = result.value.commissions ?? [];

      setCurrentPayment({
        total: result.value.total ?? 0,
        payments: batch,
        commissions,
      });

      if (batch) {
        setSelectedPaymentId(String(batch.paymentId ?? "current"));
        setSelectedPaymentLabel(`Current bill: ${paymentPeriod(batch)}`);
        setPaymentCommissions({
          total: commissions.length,
          commissions,
        });
        setPaymentCommissionsError("");
      } else {
        setSelectedPaymentId("");
        setSelectedPaymentLabel("");
        setPaymentCommissions({ total: 0, commissions: [] });
      }
    } catch (error) {
      setCurrentPaymentError(error instanceof Error ? error.message : "Failed to load current bill.");
    } finally {
      setCurrentPaymentLoading(false);
    }
  }

  async function loadPaymentHistory(nextQuery = paymentHistoryQuery) {
    if (!affiliateId) {
      return;
    }

    setPaymentHistoryLoading(true);
    setPaymentHistoryError("");

    try {
      const result = await affiliateConsoleApi.getPaymentHistory({
        affiliateId,
        status: nextQuery.status || undefined,
        date: nextQuery.date || undefined,
        page: nextQuery.page,
        pageSize: nextQuery.pageSize,
      });

      setPaymentHistoryQuery(nextQuery);
      setPaymentHistory({
        total: result.value.total ?? 0,
        currentPage: Number(result.value.currentPage ?? nextQuery.page ?? 1),
        pageSize: Number(result.value.pageSize ?? nextQuery.pageSize ?? 10),
        totalPages: Number(result.value.totalPages ?? 0),
        payments: result.value.payments ?? [],
      });
    } catch (error) {
      setPaymentHistoryError(error instanceof Error ? error.message : "Failed to load bill history.");
    } finally {
      setPaymentHistoryLoading(false);
    }
  }

  async function loadPaymentCommissionsForBatch(batch: PaymentBatch, label: string) {
    if (!affiliateId) {
      return;
    }

    const paymentId = String(batch.paymentId ?? "").trim();
    const periodStartDate = String(batch.periodStartDate ?? "").trim();
    const periodEndDate = String(batch.periodEndDate ?? "").trim();

    if (!paymentId && !periodStartDate && !periodEndDate) {
      setPaymentCommissions({ total: 0, commissions: [] });
      setPaymentCommissionsError("No payment identifier or period was found for this row.");
      return;
    }

    setSelectedPaymentId(paymentId || `${periodStartDate}-${periodEndDate}`);
    setSelectedPaymentLabel(label);
    setPaymentCommissionsLoading(true);
    setPaymentCommissionsError("");

    try {
      const result = await affiliateConsoleApi.getPaymentCommissions({
        affiliateId,
        paymentId: paymentId || undefined,
        periodStartDate: periodStartDate || undefined,
        periodEndDate: periodEndDate || undefined,
        page: 1,
        pageSize: 50,
      });
      setPaymentCommissions({
        total: result.value.total ?? 0,
        commissions: result.value.commissions ?? [],
      });
    } catch (error) {
      setPaymentCommissions({ total: 0, commissions: [] });
      setPaymentCommissionsError(error instanceof Error ? error.message : "Failed to load bill commission rows.");
    } finally {
      setPaymentCommissionsLoading(false);
    }
  }

  async function loadCustomerReport(nextQuery = customerReportQuery) {
    if (!affiliateId) {
      return;
    }

    setCustomerReportLoading(true);
    setCustomerReportError("");

    try {
      const result = await affiliateConsoleApi.getCustomerReport({
        affiliateId,
        ...nextQuery,
      });
      setCustomerReportQuery(nextQuery);
      setCustomerReport({
        total: result.value.total ?? 0,
        currentPage: Number(result.value.currentPage ?? nextQuery.currentPage ?? 1),
        pageSize: Number(result.value.pageSize ?? nextQuery.pageSize ?? 10),
        totalPages: Number(result.value.totalPages ?? 0),
        resultList: result.value.resultList ?? [],
      });
    } catch (error) {
      setCustomerReportError(error instanceof Error ? error.message : "Failed to load customer report.");
    } finally {
      setCustomerReportLoading(false);
    }
  }

  async function loadPerformanceReport(nextQuery = performanceReportQuery) {
    if (!affiliateId) {
      return;
    }

    setPerformanceReportLoading(true);
    setPerformanceReportError("");

    try {
      const result = await affiliateConsoleApi.getPerformanceReport({
        affiliateId,
        ...nextQuery,
      });
      setPerformanceReportQuery(nextQuery);
      setPerformanceReport({
        total: result.value.total ?? 0,
        currentPage: Number(result.value.currentPage ?? nextQuery.currentPage ?? 1),
        pageSize: Number(result.value.pageSize ?? nextQuery.pageSize ?? 10),
        totalPages: Number(result.value.totalPages ?? 0),
        resultList: result.value.resultList ?? [],
        summary: result.value.summary ?? {},
      });
    } catch (error) {
      setPerformanceReportError(error instanceof Error ? error.message : "Failed to load performance report.");
    } finally {
      setPerformanceReportLoading(false);
    }
  }

  async function loadTradeReport(nextQuery = tradeReportQuery) {
    if (!affiliateId) {
      return;
    }

    setTradeReportLoading(true);
    setTradeReportError("");

    try {
      const result = await affiliateConsoleApi.getTradeReport({
        affiliateId,
        ...nextQuery,
      });
      setTradeReportQuery(nextQuery);
      setTradeReport({
        total: result.value.total ?? 0,
        currentPage: Number(result.value.currentPage ?? nextQuery.currentPage ?? 1),
        pageSize: Number(result.value.pageSize ?? nextQuery.pageSize ?? 10),
        totalPages: Number(result.value.totalPages ?? 0),
        resultList: result.value.resultList ?? [],
      });
    } catch (error) {
      setTradeReportError(error instanceof Error ? error.message : "Failed to load trade report.");
    } finally {
      setTradeReportLoading(false);
    }
  }

  async function reloadEverything(showToast = false) {
    if (!affiliateId) {
      return;
    }

    setRefreshingAll(true);

    try {
      const snapshot = await loadDetailSnapshot();
      await Promise.all([
        loadCampaignSummary(snapshot),
        loadUsers(defaultUserQuery, snapshot),
        loadCustomerDetails(defaultCustomerDetailsQuery, snapshot),
        loadCurrentPayment(),
        loadPaymentHistory(defaultPaymentHistoryQuery),
        loadCustomerReport(defaultCustomerReportQuery),
        loadPerformanceReport(defaultPerformanceReportQuery),
        loadTradeReport(defaultTradeReportQuery),
      ]);
      if (showToast) {
        toast.success("Affiliate profile refreshed.");
      }
    } finally {
      setRefreshingAll(false);
    }
  }

  reloadEverythingRef.current = reloadEverything;

  useEffect(() => {
    if (!affiliateId) {
      return;
    }
    void reloadEverythingRef.current(false);
  }, [affiliateId]);

  useEffect(() => {
    if (!bdOwnerDialog.open) {
      return;
    }

    if (bdUsers.length === 0 && !bdUsersLoading) {
      void loadBdUsers(false);
      return;
    }

    if (bdOwnerDialog.bdAdminId) {
      return;
    }

    const resolvedBdAdminId = resolveBdSelection(
      bdUsers,
      resolvedCurrentBdOwnerAdminId,
      resolvedCurrentOwner,
    );
    if (resolvedBdAdminId) {
      setBdOwnerDialog((current) =>
        !current.open || current.bdAdminId
          ? current
          : { ...current, bdAdminId: resolvedBdAdminId },
      );
    }
  }, [
    bdOwnerDialog.open,
    bdOwnerDialog.bdAdminId,
    bdUsers,
    bdUsersLoading,
    loadBdUsers,
    resolvedCurrentBdOwnerAdminId,
    resolvedCurrentOwner,
  ]);

  const openLogPayloadDialog = (title: string, payload: string) => {
    setLogPayloadDialog({
      open: true,
      title,
      payload: formatJsonLikeText(payload),
    });
  };

  const renderBaseField = (field: BaseFieldConfig) => {
    const rawValue = affiliateBase?.[field.key];

    if (field.kind === "status") {
      return (
        <div key={String(field.key)} className="rounded-2xl border bg-muted/20 p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{field.label}</div>
          <div className="mt-2">
            <StatusBadge status={formatDisplayValue(rawValue)} />
          </div>
        </div>
      );
    }

    if (field.kind === "json") {
      return (
        <div key={String(field.key)} className="rounded-2xl border bg-muted/20 p-4 sm:col-span-2 xl:col-span-3">
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{field.label}</div>
          <pre className="mt-3 max-h-56 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
            {formatJsonLikeText(rawValue)}
          </pre>
        </div>
      );
    }

    return (
      <MiniMetric
        key={String(field.key)}
        label={field.label}
        value={formatDisplayValue(rawValue)}
        valueClassName={field.valueClassName}
      />
    );
  };

  const renderStandardLogTable = (
    entries: AffiliateReviewLogEntry[],
    emptyTitle: string,
    emptyDescription: string,
  ) => {
    if (entries.length === 0) {
      return <EmptyState title={emptyTitle} description={emptyDescription} />;
    }

    return (
      <div className="overflow-x-auto rounded-2xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Create Time</TableHead>
              <TableHead>Event Type</TableHead>
              <TableHead>From Status</TableHead>
              <TableHead>To Status</TableHead>
              <TableHead>Change Key</TableHead>
              <TableHead>Operator</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Remark</TableHead>
              <TableHead>Change Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={String(entry.id ?? `${entry.changeKey}-${entry.createTime}`)}>
                <TableCell>{getLogDisplayTime(entry)}</TableCell>
                <TableCell>{formatDisplayValue(entry.eventType)}</TableCell>
                <TableCell>{formatDisplayValue(entry.fromStatus)}</TableCell>
                <TableCell>{formatDisplayValue(entry.toStatus)}</TableCell>
                <TableCell className="font-mono text-xs">{formatDisplayValue(entry.changeKey)}</TableCell>
                <TableCell>{getLogOperatorDisplay(entry)}</TableCell>
                <TableCell>{formatDisplayValue(entry.source)}</TableCell>
                <TableCell className="max-w-[240px] whitespace-pre-wrap break-words text-sm">
                  {formatDisplayValue(entry.remark)}
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      openLogPayloadDialog(
                        `${formatDisplayValue(entry.bizSubType)} / ${formatDisplayValue(entry.eventType)} / ${formatDisplayValue(entry.changeKey)}`,
                        String(entry.changeData ?? ""),
                      )
                    }
                  >
                    View payload
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderBdOwnerLogTable = (entries: AffiliateBDOwnerChangeLogDetail[]) => {
    if (entries.length === 0) {
      return (
        <EmptyState
          title="No BD owner change logs"
          description="This affiliate has no BD owner change records yet."
        />
      );
    }

    return (
      <div className="overflow-x-auto rounded-2xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Change Time</TableHead>
              <TableHead>BD Owner Admin ID</TableHead>
              <TableHead>BD Owner Username Snapshot</TableHead>
              <TableHead>Event Type</TableHead>
              <TableHead>Operator</TableHead>
              <TableHead>Remark</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Change Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={String(entry.recordId ?? `${entry.bdOwnerAdminId}-${entry.changeTime}`)}>
                <TableCell>{formatDisplayValue(entry.changeTime || entry.updatedTime || entry.createdTime)}</TableCell>
                <TableCell>{formatDisplayValue(entry.bdOwnerAdminId)}</TableCell>
                <TableCell>{formatDisplayValue(entry.bdOwnerUsernameSnapshot)}</TableCell>
                <TableCell>{formatDisplayValue(entry.changeLog?.eventType)}</TableCell>
                <TableCell>{getLogOperatorDisplay(entry.changeLog)}</TableCell>
                <TableCell className="max-w-[240px] whitespace-pre-wrap break-words text-sm">
                  {formatDisplayValue(entry.changeLog?.remark)}
                </TableCell>
                <TableCell>{formatDisplayValue(entry.changeLog?.source)}</TableCell>
                <TableCell>
                  {entry.changeLog?.changeData ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        openLogPayloadDialog(
                          `BD owner change / ${formatDisplayValue(entry.bdOwnerUsernameSnapshot)}`,
                          String(entry.changeLog?.changeData ?? ""),
                        )
                      }
                    >
                      View payload
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (!affiliateId) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <PageIntro
            title="Affiliate Profile"
            description="This fixed page requires an affiliateId route parameter."
            actions={
              <Button type="button" variant="outline" onClick={() => navigate("/manage/review")}>
                <ArrowLeft className="h-4 w-4" />
                Back to review
              </Button>
            }
          />
          <Alert variant="destructive">
            <AlertTitle>Missing affiliateId</AlertTitle>
            <AlertDescription>
              Open this page from the review list or navigate to a valid route such as
              <code className="mx-1 rounded bg-destructive/10 px-1 py-0.5">/manage/affiliate-profile/&lt;affiliateId&gt;</code>.
            </AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageIntro
          title="Affiliate Profile Hub"
          description={
            <span>
              Fixed affiliate workspace for <span className="font-mono">{affiliateId}</span>. This page
              aggregates dashboard, invited users, marketing, payments, and reports without relying on
              dynamic menu routing.
            </span>
          }
          actions={
            <>
              <Button
                type="button"
                onClick={() =>
                  setBdOwnerDialog({
                    open: true,
                    submitting: false,
                    bdAdminId: resolveBdSelection(
                      bdUsers,
                      resolvedCurrentBdOwnerAdminId,
                      resolvedCurrentOwner,
                    ),
                    remark: "",
                  })
                }
              >
                Change BD
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (window.history.length > 1) {
                    navigate(-1);
                    return;
                  }
                  navigate("/manage/review");
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button type="button" variant="secondary" onClick={() => void reloadEverything(true)} disabled={refreshingAll}>
                {refreshingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                Refresh all
              </Button>
            </>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Current BD"
            value={currentBdDisplay}
            hint={currentBdAdminIdDisplay !== "-" ? `Admin ID ${currentBdAdminIdDisplay}` : "No BD owner resolved yet."}
          />
          <StatCard
            label="Total trading value"
            value={formatCurrencyText(performanceReport.summary.totalOrderValue)}
            hint="Summarised from the performance report payload."
          />
          <StatCard
            label="Commission rate"
            value={profileLoading ? "..." : formatPercentText(profile.commissionRate)}
            hint={profile.tier ? `Tier ${profile.tier}` : "Resolved from detail and commission logs."}
          />
          <StatCard
            label="Current bill"
            value={currentPaymentLoading ? "..." : formatCurrencyText(currentPaymentBatch?.commissionAmount ?? currentPaymentBatch?.amount)}
            hint={currentPaymentBatch ? paymentPeriod(currentPaymentBatch) : "No active bill found."}
          />
        </div>

        {(profileError || currentPaymentError) ? (
          <Alert variant="destructive">
            <AlertTitle>Some primary data could not be loaded</AlertTitle>
            <AlertDescription className="space-y-1">
              {profileError ? <div>{profileError}</div> : null}
              {currentPaymentError ? <div>{currentPaymentError}</div> : null}
            </AlertDescription>
          </Alert>
        ) : null}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid h-auto grid-cols-2 gap-2 rounded-2xl bg-transparent p-0 md:grid-cols-4">
            <TabsTrigger value="overview" className="rounded-xl border data-[state=active]:border-primary">
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl border data-[state=active]:border-primary">
              Users
            </TabsTrigger>
            <TabsTrigger value="payments" className="rounded-xl border data-[state=active]:border-primary">
              Payments
            </TabsTrigger>
            <TabsTrigger value="reports" className="rounded-xl border data-[state=active]:border-primary">
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Full affiliate_base snapshot from <code>/admin/affiliate/detail_with_logs</code>, grouped for readability.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="rounded-full">
                    Current BD: {currentBdDisplay}
                  </Badge>
                  <Badge variant="outline" className="rounded-full">
                    Commission: {formatPercentText(profile.commissionRate)}
                  </Badge>
                  <Badge variant="outline" className="rounded-full">
                    Tier: {profile.tier || "-"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {profileLoading ? (
                  <div className="flex h-32 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading affiliate base detail...
                  </div>
                ) : profileError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Affiliate base detail unavailable</AlertTitle>
                    <AlertDescription className="space-y-3">
                      <div>{profileError}</div>
                      <Button type="button" variant="outline" onClick={() => void reloadEverything(true)}>
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : !affiliateBase ? (
                  <EmptyState
                    title="No affiliate base detail"
                    description="The backend did not return an affiliateBase payload for this affiliate."
                  />
                ) : (
                  <>
                    {affiliateBaseSections.map((section) => (
                      <div key={section.title} className="space-y-3">
                        <div>
                          <div className="text-base font-semibold text-foreground">{section.title}</div>
                          <div className="text-sm text-muted-foreground">{section.description}</div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          {section.fields.map((field) => renderBaseField(field))}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Change Logs</CardTitle>
                <CardDescription>
                  Categorised audit and change logs from the same <code>/admin/affiliate/detail_with_logs</code> response.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileLoading ? (
                  <div className="flex h-32 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading change logs...
                  </div>
                ) : profileError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Change logs unavailable</AlertTitle>
                    <AlertDescription className="space-y-3">
                      <div>{profileError}</div>
                      <Button type="button" variant="outline" onClick={() => void reloadEverything(true)}>
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Tabs defaultValue="traffic-logs" className="space-y-4">
                    <TabsList className="grid h-auto grid-cols-1 gap-2 rounded-2xl bg-transparent p-0 md:grid-cols-3 xl:grid-cols-5">
                      <TabsTrigger value="traffic-logs" className="rounded-xl border data-[state=active]:border-primary">
                        Traffic Qualification Audit ({trafficQualificationAuditLogs.length})
                      </TabsTrigger>
                      <TabsTrigger value="kyc-logs" className="rounded-xl border data-[state=active]:border-primary">
                        KYC Audit ({kycAuditLogs.length})
                      </TabsTrigger>
                      <TabsTrigger value="bd-logs" className="rounded-xl border data-[state=active]:border-primary">
                        BD Owner Change ({bdOwnerChangeLogDetails.length})
                      </TabsTrigger>
                      <TabsTrigger value="commission-logs" className="rounded-xl border data-[state=active]:border-primary">
                        Commission Change ({commissionChangeLogs.length})
                      </TabsTrigger>
                      <TabsTrigger value="other-logs" className="rounded-xl border data-[state=active]:border-primary">
                        Other Logs ({otherChangeLogs.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="traffic-logs">
                      {renderStandardLogTable(
                        trafficQualificationAuditLogs,
                        "No traffic qualification audit logs",
                        "Traffic qualification audit logs will appear here after the first review action.",
                      )}
                    </TabsContent>

                    <TabsContent value="kyc-logs">
                      {renderStandardLogTable(
                        kycAuditLogs,
                        "No KYC audit logs",
                        "KYC audit logs will appear here after the first KYC review action.",
                      )}
                    </TabsContent>

                    <TabsContent value="bd-logs">{renderBdOwnerLogTable(bdOwnerChangeLogDetails)}</TabsContent>

                    <TabsContent value="commission-logs">
                      {renderStandardLogTable(
                        commissionChangeLogs,
                        "No commission change logs",
                        "Commission change logs will appear here after the first commission-rate update.",
                      )}
                    </TabsContent>

                    <TabsContent value="other-logs">
                      {renderStandardLogTable(
                        otherChangeLogs,
                        "No other change logs",
                        "Any uncategorised affiliate logs from the new detail endpoint will be shown here.",
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Performance dashboard</CardTitle>
                <CardDescription>
                  Trend line from <code>/report/performance</code> and totals from the affiliate summary.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <MiniMetric label="Signups" value={formatNumberText(performanceReport.summary.signups)} />
                  <MiniMetric label="Full Signups" value={formatNumberText(performanceReport.summary.fullSignups)} />
                  <MiniMetric label="Conversion" value={formatPercentText(performanceReport.summary.conversionRatio)} />
                </div>

                <div className="h-[320px] rounded-2xl border bg-background p-4">
                  {performanceReportLoading ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading performance trend...
                    </div>
                  ) : performanceChartData.length === 0 ? (
                    <EmptyState
                      title="No performance trend"
                      description="Run another date range in the report tab if you expect report rows for this affiliate."
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="commission" name="Commission" stroke="#0f172a" strokeWidth={2} dot={false} />
                        <Line
                          type="monotone"
                          dataKey="totalOrderValue"
                          name="Total Order Value"
                          stroke="#f97316"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Marketing situation</CardTitle>
                <CardDescription>
                  Affiliate marketing snapshot scoped by the affiliate email from <code>/affiliate/campaign/list</code>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {campaignError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Campaign overview unavailable</AlertTitle>
                    <AlertDescription>{campaignError}</AlertDescription>
                  </Alert>
                ) : null}

                {campaignLoading ? (
                  <div className="flex h-32 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading marketing summary...
                  </div>
                ) : campaignSummary ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <MiniMetric label="Campaign Name" value={String(campaignSummary.name ?? "-")} />
                    <MiniMetric label="Model" value={String(campaignSummary.compensationModel ?? "-")} />
                    <MiniMetric label="Registrations" value={formatNumberText(campaignSummary.registrations)} />
                    <MiniMetric label="Qualified Traders" value={formatNumberText(campaignSummary.qualifiedTraders)} />
                    <MiniMetric label="Commission Earned" value={formatCurrencyText(campaignSummary.commissionEarned)} />
                  </div>
                ) : (
                  <EmptyState
                    title="No campaign summary"
                    description="No scoped campaign row was returned for this affiliate email."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Invited users</CardTitle>
                <CardDescription>
                  The list uses <code>/kol_user/list</code>, but the affiliate constraint is fixed internally by
                  the current affiliate snapshot instead of being editable on this page.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="rounded-full">
                    Affiliate ID: {affiliateId}
                  </Badge>
                  {profile.affiliateCode ? (
                    <Badge variant="outline" className="rounded-full">
                      Code: {profile.affiliateCode}
                    </Badge>
                  ) : null}
                  {profile.mail ? (
                    <Badge variant="outline" className="rounded-full">
                      Email: {profile.mail}
                    </Badge>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <Field label="Trading account">
                    <Input
                      className={cn(controlClass, "rounded-xl")}
                      placeholder="Customer live account"
                      value={userQuery.tradingAccountNumber}
                      onChange={(event) =>
                        setUserQuery((prev) => ({ ...prev, tradingAccountNumber: event.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Medium">
                    <Input
                      className={cn(controlClass, "rounded-xl")}
                      placeholder="Medium"
                      value={userQuery.medium}
                      onChange={(event) => setUserQuery((prev) => ({ ...prev, medium: event.target.value }))}
                    />
                  </Field>
                  <Field label="Registration from">
                    <Input
                      className={cn(controlClass, "rounded-xl")}
                      placeholder="YYYY-MM-DD"
                      value={userQuery.registrationDateStart}
                      onChange={(event) =>
                        setUserQuery((prev) => ({ ...prev, registrationDateStart: event.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Registration to">
                    <Input
                      className={cn(controlClass, "rounded-xl")}
                      placeholder="YYYY-MM-DD"
                      value={userQuery.registrationDateEnd}
                      onChange={(event) =>
                        setUserQuery((prev) => ({ ...prev, registrationDateEnd: event.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Testing accounts">
                    <Select
                      value={userQuery.showTestingAccounts}
                      onValueChange={(value) => setUserQuery((prev) => ({ ...prev, showTestingAccounts: value }))}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Hide testing accounts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Hide testing accounts</SelectItem>
                        <SelectItem value="1">Show testing accounts</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={() => void loadUsers({ ...userQuery, page: "1" })} disabled={usersLoading}>
                    {usersLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    Search invited users
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setUserQuery(defaultUserQuery);
                      void loadUsers(defaultUserQuery);
                    }}
                    disabled={usersLoading}
                  >
                    Reset
                  </Button>
                </div>

                {usersError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Invited-user list unavailable</AlertTitle>
                    <AlertDescription>{usersError}</AlertDescription>
                  </Alert>
                ) : null}

                {usersData.userInfo.length === 0 && usersLoading ? (
                  <div className="flex h-40 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading invited users...
                  </div>
                ) : usersData.userInfo.length === 0 ? (
                  <EmptyState
                    title="No invited users"
                    description="No invited-user rows were returned for the current affiliate constraint."
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto rounded-2xl border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Live Account</TableHead>
                            <TableHead>Registration Date</TableHead>
                            <TableHead>Country</TableHead>
                            <TableHead>Medium</TableHead>
                            <TableHead>Affiliate Code</TableHead>
                            <TableHead>Affiliate Name</TableHead>
                            <TableHead>Affiliate Mail</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {usersData.userInfo.map((row, index) => (
                            <TableRow key={`${String(row.liveAccount ?? "account")}-${index}`}>
                              <TableCell className="font-mono text-xs">{String(row.liveAccount ?? "-")}</TableCell>
                              <TableCell>{String(row.registrationDate ?? "-")}</TableCell>
                              <TableCell>{String(row.customerCountry ?? "-")}</TableCell>
                              <TableCell>{String(row.medium ?? "-")}</TableCell>
                              <TableCell>{String(row.affiliateCode ?? "-")}</TableCell>
                              <TableCell>{String(row.affiliateName ?? "-")}</TableCell>
                              <TableCell>{String(row.affiliateMail ?? "-")}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <PaginationBar
                      page={Number(userQuery.page)}
                      pageSize={Number(userQuery.pageSize)}
                      total={usersData.total}
                      loading={usersLoading}
                      onPrev={() => {
                        const next = { ...userQuery, page: String(Math.max(1, Number(userQuery.page) - 1)) };
                        setUserQuery(next);
                        void loadUsers(next);
                      }}
                      onNext={() => {
                        const next = { ...userQuery, page: String(Number(userQuery.page) + 1) };
                        setUserQuery(next);
                        void loadUsers(next);
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Customer statistics</CardTitle>
                <CardDescription>
                  Additional scoped customer rows from <code>/customer/details</code>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="Customer email">
                    <Input
                      className={cn(controlClass, "rounded-xl")}
                      placeholder="customer@example.com"
                      value={customerDetailsQuery.customerEmail}
                      onChange={(event) =>
                        setCustomerDetailsQuery((prev) => ({ ...prev, customerEmail: event.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Start date">
                    <Input
                      className={cn(controlClass, "rounded-xl")}
                      placeholder="YYYY-MM-DD"
                      value={customerDetailsQuery.startDate}
                      onChange={(event) =>
                        setCustomerDetailsQuery((prev) => ({ ...prev, startDate: event.target.value }))
                      }
                    />
                  </Field>
                  <Field label="End date">
                    <Input
                      className={cn(controlClass, "rounded-xl")}
                      placeholder="YYYY-MM-DD"
                      value={customerDetailsQuery.endDate}
                      onChange={(event) =>
                        setCustomerDetailsQuery((prev) => ({ ...prev, endDate: event.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Page size">
                    <Input
                      className={cn(controlClass, "rounded-xl")}
                      value={customerDetailsQuery.pageSize}
                      onChange={(event) =>
                        setCustomerDetailsQuery((prev) => ({ ...prev, pageSize: event.target.value }))
                      }
                    />
                  </Field>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => void loadCustomerDetails({ ...customerDetailsQuery, currentPage: "1" })}
                    disabled={customerDetailsLoading}
                  >
                    {customerDetailsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                    Search customer details
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCustomerDetailsQuery(defaultCustomerDetailsQuery);
                      void loadCustomerDetails(defaultCustomerDetailsQuery);
                    }}
                    disabled={customerDetailsLoading}
                  >
                    Reset
                  </Button>
                </div>

                {customerDetailsError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Customer detail report unavailable</AlertTitle>
                    <AlertDescription>{customerDetailsError}</AlertDescription>
                  </Alert>
                ) : null}

                {customerDetails.resultList.length === 0 && customerDetailsLoading ? (
                  <div className="flex h-40 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading customer detail rows...
                  </div>
                ) : customerDetails.resultList.length === 0 ? (
                  <EmptyState
                    title="No customer detail rows"
                    description="The customer detail endpoint returned no rows for the current filter."
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto rounded-2xl border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer ID</TableHead>
                            <TableHead>Live Account</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Country</TableHead>
                            <TableHead>KYC</TableHead>
                            <TableHead>Registration Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customerDetails.resultList.map((row, index) => (
                            <TableRow key={`${String(row.customerId ?? "customer")}-${index}`}>
                              <TableCell className="font-mono text-xs">{String(row.customerId ?? "-")}</TableCell>
                              <TableCell>{String(row.customerLiveAccount ?? "-")}</TableCell>
                              <TableCell>{String(row.customerEmail ?? "-")}</TableCell>
                              <TableCell>{String(row.customerCountry ?? "-")}</TableCell>
                              <TableCell>{String(row.customerKycStatus ?? "-")}</TableCell>
                              <TableCell>{String(row.customerRegDate ?? "-")}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <PaginationBar
                      page={Number(customerDetailsQuery.currentPage)}
                      pageSize={Number(customerDetailsQuery.pageSize)}
                      total={customerDetails.total}
                      loading={customerDetailsLoading}
                      onPrev={() => {
                        const next = {
                          ...customerDetailsQuery,
                          currentPage: String(Math.max(1, Number(customerDetailsQuery.currentPage) - 1)),
                        };
                        setCustomerDetailsQuery(next);
                        void loadCustomerDetails(next);
                      }}
                      onNext={() => {
                        const next = {
                          ...customerDetailsQuery,
                          currentPage: String(Number(customerDetailsQuery.currentPage) + 1),
                        };
                        setCustomerDetailsQuery(next);
                        void loadCustomerDetails(next);
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Current bill</CardTitle>
                <CardDescription>
                  Current commission batch and bill lines from <code>/payment/current</code>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentPaymentError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Current bill unavailable</AlertTitle>
                    <AlertDescription>{currentPaymentError}</AlertDescription>
                  </Alert>
                ) : null}

                {currentPaymentLoading ? (
                  <div className="flex h-32 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading current bill...
                  </div>
                ) : currentPaymentBatch ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <MiniMetric label="Bill Period" value={paymentPeriod(currentPaymentBatch)} />
                      <MiniMetric label="Status" value={String(currentPaymentBatch.status ?? "-")} />
                      <MiniMetric
                        label="Commission Amount"
                        value={formatCurrencyText(currentPaymentBatch.commissionAmount ?? currentPaymentBatch.amount)}
                      />
                      <MiniMetric label="Payment ID" value={String(currentPaymentBatch.paymentId ?? "-")} />
                    </div>

                    <div className="overflow-x-auto rounded-2xl border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer ID</TableHead>
                            <TableHead>Count Date</TableHead>
                            <TableHead>Symbol</TableHead>
                            <TableHead>Volume</TableHead>
                            <TableHead>Spread Value</TableHead>
                            <TableHead>Order Value</TableHead>
                            <TableHead>Commission</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentPayment.commissions.length > 0 ? (
                            currentPayment.commissions.map((row, index) => (
                              <TableRow key={`${String(row.customerId ?? "customer")}-${index}`}>
                                <TableCell className="font-mono text-xs">{String(row.customerId ?? "-")}</TableCell>
                                <TableCell>{String(row.countDate ?? "-")}</TableCell>
                                <TableCell>{String(row.symbolCode ?? "-")}</TableCell>
                                <TableCell>{String(row.volume ?? "-")}</TableCell>
                                <TableCell>{String(row.spreadValue ?? "-")}</TableCell>
                                <TableCell>{String(row.orderValue ?? "-")}</TableCell>
                                <TableCell>{formatCurrencyText(row.commission)}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                No current bill line items were returned.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                ) : (
                  <EmptyState title="No current bill" description="The affiliate has no active current bill." />
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Bill history</CardTitle>
                <CardDescription>
                  Historical bill batches from <code>/payment/history_new</code>. Click a row to inspect its commission lines.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Status">
                    <Input
                      className={cn(controlClass, "rounded-xl")}
                      placeholder="e.g. PAID"
                      value={paymentHistoryQuery.status}
                      onChange={(event) =>
                        setPaymentHistoryQuery((prev) => ({ ...prev, status: event.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Date">
                    <Input
                      className={cn(controlClass, "rounded-xl")}
                      placeholder="YYYY-MM or YYYY-MM-DD"
                      value={paymentHistoryQuery.date}
                      onChange={(event) =>
                        setPaymentHistoryQuery((prev) => ({ ...prev, date: event.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Page size">
                    <Input
                      className={cn(controlClass, "rounded-xl")}
                      value={paymentHistoryQuery.pageSize}
                      onChange={(event) =>
                        setPaymentHistoryQuery((prev) => ({ ...prev, pageSize: event.target.value }))
                      }
                    />
                  </Field>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => void loadPaymentHistory({ ...paymentHistoryQuery, page: "1" })}
                    disabled={paymentHistoryLoading}
                  >
                    {paymentHistoryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                    Search bill history
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPaymentHistoryQuery(defaultPaymentHistoryQuery);
                      void loadPaymentHistory(defaultPaymentHistoryQuery);
                    }}
                    disabled={paymentHistoryLoading}
                  >
                    Reset
                  </Button>
                </div>

                {paymentHistoryError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Bill history unavailable</AlertTitle>
                    <AlertDescription>{paymentHistoryError}</AlertDescription>
                  </Alert>
                ) : null}

                {historyRows.length === 0 && paymentHistoryLoading ? (
                  <div className="flex h-40 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading bill history...
                  </div>
                ) : historyRows.length === 0 ? (
                  <EmptyState title="No bill history" description="No historical bill batches were returned for this affiliate." />
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto rounded-2xl border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Payment ID</TableHead>
                            <TableHead>Bill Period</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead className="w-[180px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {historyRows.map((batch, index) => (
                            <TableRow key={`${String(batch.paymentId ?? "payment")}-${index}`}>
                              <TableCell className="font-mono text-xs">{String(batch.paymentId ?? "-")}</TableCell>
                              <TableCell>{paymentPeriod(batch)}</TableCell>
                              <TableCell>{String(batch.status ?? "-")}</TableCell>
                              <TableCell>{formatCurrencyText(batch.commissionAmount ?? batch.amount)}</TableCell>
                              <TableCell>{String(batch.referenceNumber ?? "-")}</TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    void loadPaymentCommissionsForBatch(
                                      batch,
                                      `Bill history: ${paymentPeriod(batch)}`,
                                    )
                                  }
                                >
                                  View details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <PaginationBar
                      page={paymentHistory.currentPage}
                      pageSize={paymentHistory.pageSize}
                      total={paymentHistory.total}
                      loading={paymentHistoryLoading}
                      onPrev={() => {
                        const next = {
                          ...paymentHistoryQuery,
                          page: String(Math.max(1, paymentHistory.currentPage - 1)),
                        };
                        setPaymentHistoryQuery(next);
                        void loadPaymentHistory(next);
                      }}
                      onNext={() => {
                        const next = {
                          ...paymentHistoryQuery,
                          page: String(paymentHistory.currentPage + 1),
                        };
                        setPaymentHistoryQuery(next);
                        void loadPaymentHistory(next);
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Bill line detail</CardTitle>
                <CardDescription>
                  {selectedPaymentLabel
                    ? `Showing commission rows for ${selectedPaymentLabel}.`
                    : "Select a bill batch to inspect its commission rows."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentCommissionsError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Bill line detail unavailable</AlertTitle>
                    <AlertDescription>{paymentCommissionsError}</AlertDescription>
                  </Alert>
                ) : null}

                {paymentCommissionsLoading ? (
                  <div className="flex h-40 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading bill lines...
                  </div>
                ) : paymentCommissions.commissions.length === 0 ? (
                  <EmptyState
                    title="No bill lines selected"
                    description="Choose a history row or rely on the current bill to inspect line items."
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="rounded-full">
                        Selected Batch: {selectedPaymentId || "-"}
                      </Badge>
                      <Badge variant="outline" className="rounded-full">
                        Rows: {paymentCommissions.total}
                      </Badge>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer ID</TableHead>
                            <TableHead>Count Date</TableHead>
                            <TableHead>Symbol</TableHead>
                            <TableHead>Volume</TableHead>
                            <TableHead>Open Value USD</TableHead>
                            <TableHead>Order Value</TableHead>
                            <TableHead>Commission</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paymentCommissions.commissions.map((row, index) => (
                            <TableRow key={`${selectedPaymentId}-${index}`}>
                              <TableCell className="font-mono text-xs">{String(row.customerId ?? "-")}</TableCell>
                              <TableCell>{String(row.countDate ?? "-")}</TableCell>
                              <TableCell>{String(row.symbolCode ?? "-")}</TableCell>
                              <TableCell>{String(row.volume ?? "-")}</TableCell>
                              <TableCell>{String(row.openValueUsd ?? "-")}</TableCell>
                              <TableCell>{String(row.orderValue ?? "-")}</TableCell>
                              <TableCell>{formatCurrencyText(row.commission)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Report summary</CardTitle>
                <CardDescription>
                  High-level numbers from the current performance-report query.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MiniMetric label="Commission" value={formatCurrencyText(performanceReport.summary.commission)} />
                  <MiniMetric label="Total Order Value" value={formatCurrencyText(performanceReport.summary.totalOrderValue)} />
                  <MiniMetric label="Qualified Customers" value={formatNumberText(performanceReport.summary.qualifiedCustomers)} />
                  <MiniMetric label="Full Signups" value={formatNumberText(performanceReport.summary.fullSignups)} />
                </div>
              </CardContent>
            </Card>

            <Tabs value={reportsTab} onValueChange={setReportsTab} className="space-y-4">
              <TabsList className="grid h-auto grid-cols-3 gap-2 rounded-2xl bg-transparent p-0">
                <TabsTrigger value="customer" className="rounded-xl border data-[state=active]:border-primary">
                  Customer Report
                </TabsTrigger>
                <TabsTrigger value="performance" className="rounded-xl border data-[state=active]:border-primary">
                  Performance Report
                </TabsTrigger>
                <TabsTrigger value="trade" className="rounded-xl border data-[state=active]:border-primary">
                  Trade Report
                </TabsTrigger>
              </TabsList>

              <TabsContent value="customer" className="space-y-4">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Customer report</CardTitle>
                    <CardDescription>
                      Customer-level statistics from <code>/report/customer</code>.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <Field label="From">
                        <Input
                          className={cn(controlClass, "rounded-xl")}
                          value={customerReportQuery.from}
                          onChange={(event) => setCustomerReportQuery((prev) => ({ ...prev, from: event.target.value }))}
                        />
                      </Field>
                      <Field label="To">
                        <Input
                          className={cn(controlClass, "rounded-xl")}
                          value={customerReportQuery.to}
                          onChange={(event) => setCustomerReportQuery((prev) => ({ ...prev, to: event.target.value }))}
                        />
                      </Field>
                      <Field label="Sort field">
                        <Input
                          className={cn(controlClass, "rounded-xl")}
                          value={customerReportQuery.sortField}
                          onChange={(event) =>
                            setCustomerReportQuery((prev) => ({ ...prev, sortField: event.target.value }))
                          }
                        />
                      </Field>
                      <Field label="Page size">
                        <Input
                          className={cn(controlClass, "rounded-xl")}
                          value={customerReportQuery.pageSize}
                          onChange={(event) =>
                            setCustomerReportQuery((prev) => ({ ...prev, pageSize: event.target.value }))
                          }
                        />
                      </Field>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() => void loadCustomerReport({ ...customerReportQuery, currentPage: "1" })}
                        disabled={customerReportLoading}
                      >
                        {customerReportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                        Run customer report
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setCustomerReportQuery(defaultCustomerReportQuery);
                          void loadCustomerReport(defaultCustomerReportQuery);
                        }}
                        disabled={customerReportLoading}
                      >
                        Reset
                      </Button>
                    </div>

                    {customerReportError ? (
                      <Alert variant="destructive">
                        <AlertTitle>Customer report unavailable</AlertTitle>
                        <AlertDescription>{customerReportError}</AlertDescription>
                      </Alert>
                    ) : null}

                    {customerReport.resultList.length === 0 && customerReportLoading ? (
                      <div className="flex h-40 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading customer report...
                      </div>
                    ) : customerReport.resultList.length === 0 ? (
                      <EmptyState title="No customer report rows" description="No report rows were returned for this range." />
                    ) : (
                      <div className="space-y-4">
                        <div className="overflow-x-auto rounded-2xl border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Customer ID</TableHead>
                                <TableHead>Country</TableHead>
                                <TableHead>Signup Date</TableHead>
                                <TableHead>Platform</TableHead>
                                <TableHead>Qualified Date</TableHead>
                                <TableHead>First Deposit</TableHead>
                                <TableHead>Total Order Value</TableHead>
                                <TableHead>Commission</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {customerReport.resultList.map((row, index) => (
                                <TableRow key={`${String(row.customerId ?? "customer")}-${index}`}>
                                  <TableCell className="font-mono text-xs">{String(row.customerId ?? "-")}</TableCell>
                                  <TableCell>{String(row.country ?? "-")}</TableCell>
                                  <TableCell>{String(row.signupDate ?? "-")}</TableCell>
                                  <TableCell>{String(row.platform ?? "-")}</TableCell>
                                  <TableCell>{String(row.qualifiedDate ?? "-")}</TableCell>
                                  <TableCell>{String(row.firstDepositAmount ?? "-")}</TableCell>
                                  <TableCell>{String(row.totalOrderValue ?? "-")}</TableCell>
                                  <TableCell>{String(row.commission ?? "-")}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        <PaginationBar
                          page={customerReport.currentPage}
                          pageSize={customerReport.pageSize}
                          total={customerReport.total}
                          loading={customerReportLoading}
                          onPrev={() => {
                            const next = {
                              ...customerReportQuery,
                              currentPage: String(Math.max(1, customerReport.currentPage - 1)),
                            };
                            setCustomerReportQuery(next);
                            void loadCustomerReport(next);
                          }}
                          onNext={() => {
                            const next = {
                              ...customerReportQuery,
                              currentPage: String(customerReport.currentPage + 1),
                            };
                            setCustomerReportQuery(next);
                            void loadCustomerReport(next);
                          }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Performance report</CardTitle>
                    <CardDescription>
                      Date-grouped report from <code>/report/performance</code>.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                      <Field label="From">
                        <Input
                          className={cn(controlClass, "rounded-xl")}
                          value={performanceReportQuery.from}
                          onChange={(event) =>
                            setPerformanceReportQuery((prev) => ({ ...prev, from: event.target.value }))
                          }
                        />
                      </Field>
                      <Field label="To">
                        <Input
                          className={cn(controlClass, "rounded-xl")}
                          value={performanceReportQuery.to}
                          onChange={(event) =>
                            setPerformanceReportQuery((prev) => ({ ...prev, to: event.target.value }))
                          }
                        />
                      </Field>
                      <Field label="Group by">
                        <Select
                          value={performanceReportQuery.groupBy}
                          onValueChange={(value) =>
                            setPerformanceReportQuery((prev) => ({ ...prev, groupBy: value }))
                          }
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Group by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="day">Day</SelectItem>
                            <SelectItem value="week">Week</SelectItem>
                            <SelectItem value="month">Month</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Sort">
                        <Select
                          value={performanceReportQuery.sort}
                          onValueChange={(value) =>
                            setPerformanceReportQuery((prev) => ({ ...prev, sort: value }))
                          }
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Sort" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="asc">Ascending</SelectItem>
                            <SelectItem value="desc">Descending</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Page size">
                        <Input
                          className={cn(controlClass, "rounded-xl")}
                          value={performanceReportQuery.pageSize}
                          onChange={(event) =>
                            setPerformanceReportQuery((prev) => ({ ...prev, pageSize: event.target.value }))
                          }
                        />
                      </Field>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() => void loadPerformanceReport({ ...performanceReportQuery, currentPage: "1" })}
                        disabled={performanceReportLoading}
                      >
                        {performanceReportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                        Run performance report
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setPerformanceReportQuery(defaultPerformanceReportQuery);
                          void loadPerformanceReport(defaultPerformanceReportQuery);
                        }}
                        disabled={performanceReportLoading}
                      >
                        Reset
                      </Button>
                    </div>

                    {performanceReportError ? (
                      <Alert variant="destructive">
                        <AlertTitle>Performance report unavailable</AlertTitle>
                        <AlertDescription>{performanceReportError}</AlertDescription>
                      </Alert>
                    ) : null}

                    <div className="h-[300px] rounded-2xl border bg-background p-4">
                      {performanceReportLoading ? (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading performance chart...
                        </div>
                      ) : performanceChartData.length === 0 ? (
                        <EmptyState title="No chart data" description="No performance points were returned for this range." />
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={performanceChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="commission" stroke="#0f172a" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="totalOrderValue" stroke="#f97316" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    {performanceReport.resultList.length === 0 && !performanceReportLoading ? null : (
                      <div className="space-y-4">
                        <div className="overflow-x-auto rounded-2xl border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Signups</TableHead>
                                <TableHead>Qualified</TableHead>
                                <TableHead>Full Signups</TableHead>
                                <TableHead>Total Order Value</TableHead>
                                <TableHead>Commission</TableHead>
                                <TableHead>Conversion</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {performanceReport.resultList.map((row, index) => (
                                <TableRow key={`${String(row.date ?? "date")}-${index}`}>
                                  <TableCell>{String(row.date ?? "-")}</TableCell>
                                  <TableCell>{String(row.signups ?? "-")}</TableCell>
                                  <TableCell>{String(row.qualifiedCustomers ?? "-")}</TableCell>
                                  <TableCell>{String(row.fullSignups ?? "-")}</TableCell>
                                  <TableCell>{String(row.totalOrderValue ?? "-")}</TableCell>
                                  <TableCell>{String(row.commission ?? "-")}</TableCell>
                                  <TableCell>{String(row.conversionRatio ?? "-")}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        <PaginationBar
                          page={performanceReport.currentPage}
                          pageSize={performanceReport.pageSize}
                          total={performanceReport.total}
                          loading={performanceReportLoading}
                          onPrev={() => {
                            const next = {
                              ...performanceReportQuery,
                              currentPage: String(Math.max(1, performanceReport.currentPage - 1)),
                            };
                            setPerformanceReportQuery(next);
                            void loadPerformanceReport(next);
                          }}
                          onNext={() => {
                            const next = {
                              ...performanceReportQuery,
                              currentPage: String(performanceReport.currentPage + 1),
                            };
                            setPerformanceReportQuery(next);
                            void loadPerformanceReport(next);
                          }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trade" className="space-y-4">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Trade report</CardTitle>
                    <CardDescription>
                      Trade-level report from <code>/report/trade</code>.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                      <Field label="From">
                        <Input
                          className={cn(controlClass, "rounded-xl")}
                          value={tradeReportQuery.from}
                          onChange={(event) => setTradeReportQuery((prev) => ({ ...prev, from: event.target.value }))}
                        />
                      </Field>
                      <Field label="To">
                        <Input
                          className={cn(controlClass, "rounded-xl")}
                          value={tradeReportQuery.to}
                          onChange={(event) => setTradeReportQuery((prev) => ({ ...prev, to: event.target.value }))}
                        />
                      </Field>
                      <Field label="Group by instrument">
                        <Select
                          value={tradeReportQuery.groupByInstrument}
                          onValueChange={(value) =>
                            setTradeReportQuery((prev) => ({ ...prev, groupByInstrument: value }))
                          }
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Group by instrument" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="false">False</SelectItem>
                            <SelectItem value="true">True</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Sort">
                        <Select
                          value={tradeReportQuery.sort}
                          onValueChange={(value) => setTradeReportQuery((prev) => ({ ...prev, sort: value }))}
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Sort" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="desc">Descending</SelectItem>
                            <SelectItem value="asc">Ascending</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Page size">
                        <Input
                          className={cn(controlClass, "rounded-xl")}
                          value={tradeReportQuery.pageSize}
                          onChange={(event) =>
                            setTradeReportQuery((prev) => ({ ...prev, pageSize: event.target.value }))
                          }
                        />
                      </Field>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() => void loadTradeReport({ ...tradeReportQuery, currentPage: "1" })}
                        disabled={tradeReportLoading}
                      >
                        {tradeReportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                        Run trade report
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setTradeReportQuery(defaultTradeReportQuery);
                          void loadTradeReport(defaultTradeReportQuery);
                        }}
                        disabled={tradeReportLoading}
                      >
                        Reset
                      </Button>
                    </div>

                    {tradeReportError ? (
                      <Alert variant="destructive">
                        <AlertTitle>Trade report unavailable</AlertTitle>
                        <AlertDescription>{tradeReportError}</AlertDescription>
                      </Alert>
                    ) : null}

                    {tradeReport.resultList.length === 0 && tradeReportLoading ? (
                      <div className="flex h-40 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading trade report...
                      </div>
                    ) : tradeReport.resultList.length === 0 ? (
                      <EmptyState title="No trade rows" description="No trade report rows were returned for this range." />
                    ) : (
                      <div className="space-y-4">
                        <div className="overflow-x-auto rounded-2xl border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Customer ID</TableHead>
                                <TableHead>Country</TableHead>
                                <TableHead>Symbol</TableHead>
                                <TableHead>Open Time</TableHead>
                                <TableHead>Volume</TableHead>
                                <TableHead>Spread Value</TableHead>
                                <TableHead>Order Value</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {tradeReport.resultList.map((row, index) => (
                                <TableRow key={`${String(row.customerId ?? "customer")}-${index}`}>
                                  <TableCell className="font-mono text-xs">{String(row.customerId ?? "-")}</TableCell>
                                  <TableCell>{String(row.countryCode ?? "-")}</TableCell>
                                  <TableCell>{String(row.symbolCode ?? "-")}</TableCell>
                                  <TableCell>{String(row.openTime ?? "-")}</TableCell>
                                  <TableCell>{String(row.volume ?? "-")}</TableCell>
                                  <TableCell>{String(row.spreadValue ?? "-")}</TableCell>
                                  <TableCell>{String(row.orderValue ?? "-")}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        <PaginationBar
                          page={tradeReport.currentPage}
                          pageSize={tradeReport.pageSize}
                          total={tradeReport.total}
                          loading={tradeReportLoading}
                          onPrev={() => {
                            const next = {
                              ...tradeReportQuery,
                              currentPage: String(Math.max(1, tradeReport.currentPage - 1)),
                            };
                            setTradeReportQuery(next);
                            void loadTradeReport(next);
                          }}
                          onNext={() => {
                            const next = {
                              ...tradeReportQuery,
                              currentPage: String(tradeReport.currentPage + 1),
                            };
                            setTradeReportQuery(next);
                            void loadTradeReport(next);
                          }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        <Dialog
          open={logPayloadDialog.open}
          onOpenChange={(open) => {
            if (!open) {
              setLogPayloadDialog(initialLogPayloadDialogState);
            }
          }}
        >
          <DialogContent className="max-w-3xl rounded-[28px] border border-slate-200 p-0 shadow-2xl [&>button]:right-5 [&>button]:top-5 [&>button]:opacity-100">
            <div className="border-b bg-slate-50 px-6 py-5">
              <DialogHeader className="text-left">
                <DialogTitle className="text-xl">Change Data</DialogTitle>
                <DialogDescription>{logPayloadDialog.title || "Log payload preview"}</DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-6">
              <pre className="max-h-[65vh] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
                {logPayloadDialog.payload || "-"}
              </pre>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={bdOwnerDialog.open}
          onOpenChange={(open) => {
            if (!open) {
              setBdOwnerDialog(initialBdOwnerDialogState);
            }
          }}
        >
          <DialogContent className="max-w-2xl rounded-[28px] border border-slate-200 p-0 shadow-2xl [&>button]:right-5 [&>button]:top-5 [&>button]:opacity-100">
            <div className="border-b bg-amber-50 px-6 py-5">
              <DialogHeader className="text-left">
                <DialogTitle className="text-xl">Change BD Owner</DialogTitle>
                <DialogDescription>
                  Submit an independent BD owner change for the current affiliate.
                  <span className="mt-2 block break-all rounded-xl bg-white/70 px-3 py-2 font-mono text-xs text-slate-600">
                    {affiliateId}
                  </span>
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid gap-3 md:grid-cols-2">
                <MiniMetric
                  label="Affiliate ID"
                  value={affiliateId}
                  valueClassName="break-all font-mono text-sm sm:text-base"
                />
                <MiniMetric label="Current BD" value={currentBdDisplay} />
              </div>

              <Field label="New BD owner">
                <BdCombobox
                  users={bdUsers}
                  value={bdOwnerDialog.bdAdminId}
                  onChange={(value) =>
                    setBdOwnerDialog((prev) => ({
                      ...prev,
                      bdAdminId: value,
                    }))
                  }
                  disabled={bdUsersLoading}
                />
              </Field>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-full border px-3 py-1.5 text-sm font-medium">
                  Loaded {bdUsers.length} BD users
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void loadBdUsers(true)}
                  disabled={bdUsersLoading}
                >
                  {bdUsersLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                  Reload list
                </Button>
              </div>

              {selectedBdUser ? (
                <div className="rounded-2xl border bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
                  Selected BD: <span className="font-medium text-foreground">{bdLabel(selectedBdUser)}</span>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
                  Load BD users and choose one before confirming the change.
                </div>
              )}

              <Field label="Remark">
                <Textarea
                  className="min-h-[112px] rounded-2xl"
                  maxLength={500}
                  placeholder="Optional remark for this BD replacement."
                  value={bdOwnerDialog.remark}
                  onChange={(event) =>
                    setBdOwnerDialog((prev) => ({
                      ...prev,
                      remark: event.target.value,
                    }))
                  }
                />
              </Field>
              <div className="text-right text-xs text-muted-foreground">
                {bdOwnerDialog.remark.trim().length}/500
              </div>
            </div>

            <DialogFooter className="border-t bg-muted/20 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBdOwnerDialog(initialBdOwnerDialogState)}
                disabled={bdOwnerDialog.submitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void submitBdOwnerChange()}
                disabled={bdOwnerDialog.submitting}
              >
                {bdOwnerDialog.submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AffiliateProfilePage;
