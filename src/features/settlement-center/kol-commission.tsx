import { useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { affiliateConsoleApi } from "@/api/affiliate-console";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, Field, StatCard, StatusBadge } from "@/features/console/shared";
import { controlClass } from "@/features/console/shared-utils";
import { useSettlementUserCommissions } from "@/features/settlement-center/hooks";
import {
  FilterActions,
  PageShell,
  PaginationBar,
  textOrDash,
} from "@/features/settlement-center/shared";
import { isDownloadAbortError } from "@/lib/business-download";
import type {
  SettlementExportUploadType,
  SettlementUserCommissionListValue,
  SettlementUserCommissionQuery,
  SettlementUserCommissionRow,
  SettlementUserCommissionSortBy,
  SettlementUserCommissionStatus,
  SettlementUserCommissionSummary,
  SettlementUserCommissionWithdrawStatus,
} from "@/types/affiliate-console";

type UserCommissionFilterForm = Omit<
  SettlementUserCommissionQuery,
  "status" | "withdrawStatus"
> & {
  status: SettlementUserCommissionStatus[];
  withdrawStatus: SettlementUserCommissionWithdrawStatus[];
};

const pageSizeOptions = [20, 50, 100, 200];
const userCommissionSortOrderOptions = ["desc", "asc"] as const;
const userCommissionSortByOptions: Array<{
  value: SettlementUserCommissionSortBy;
  label: string;
}> = [
  { value: "countDate", label: "Count Date" },
  { value: "commission", label: "Commission" },
  { value: "awardUsd", label: "Award USD" },
  { value: "openValueUsd", label: "Open Value USD" },
  { value: "orderId", label: "Order ID" },
  { value: "statementId", label: "Statement ID" },
];

const userCommissionStatusOptions: Array<{
  value: SettlementUserCommissionStatus;
  label: string;
}> = [
  { value: "INIT", label: "INIT" },
  { value: "CALCULATED", label: "CALCULATED" },
  { value: "FINISHED", label: "FINISHED" },
];

const userCommissionWithdrawStatusOptions: Array<{
  value: SettlementUserCommissionWithdrawStatus;
  label: string;
}> = [
  { value: "UNAPPLIED", label: "UNAPPLIED" },
  { value: "APPLIED", label: "APPLIED" },
  { value: "PAID", label: "PAID" },
];

const userCommissionColumns: Array<{
  key: string;
  label: string;
  render: (row: SettlementUserCommissionRow) => ReactNode;
}> = [
  { key: "id", label: "ID", render: (row) => textOrDash(row.id) },
  { key: "statementId", label: "Statement ID", render: (row) => textOrDash(row.statementId) },
  { key: "affiliateId", label: "Affiliate ID", render: (row) => textOrDash(row.affiliateId) },
  { key: "affiliateCode", label: "Affiliate Code", render: (row) => textOrDash(row.affiliateCode) },
  { key: "referralCode", label: "Referral Code", render: (row) => textOrDash(row.referralCode) },
  { key: "affiliateName", label: "Affiliate Name", render: (row) => textOrDash(row.affiliateName) },
  { key: "email", label: "Email", render: (row) => textOrDash(row.email) },
  { key: "ownerName", label: "Owner", render: (row) => textOrDash(row.ownerName) },
  { key: "customerId", label: "Customer ID", render: (row) => textOrDash(row.customerId) },
  { key: "spAccount", label: "SP Account", render: (row) => textOrDash(row.spAccount) },
  { key: "orderNo", label: "Order No", render: (row) => textOrDash(row.orderNo) },
  { key: "orderId", label: "Order ID", render: (row) => textOrDash(row.orderId) },
  { key: "symbolCode", label: "Symbol Code", render: (row) => textOrDash(row.symbolCode) },
  { key: "currencyType", label: "Currency", render: (row) => textOrDash(row.currencyType) },
  { key: "volume", label: "Volume", render: (row) => textOrDash(row.volume) },
  { key: "openValueUsd", label: "Open Value USD", render: (row) => textOrDash(row.openValueUsd) },
  { key: "spreadPercentage", label: "Spread %", render: (row) => textOrDash(row.spreadPercentage) },
  { key: "speed", label: "Speed", render: (row) => textOrDash(row.speed) },
  { key: "originSpeed", label: "Origin Speed", render: (row) => textOrDash(row.originSpeed) },
  { key: "commission", label: "Commission", render: (row) => textOrDash(row.commission) },
  { key: "originCommission", label: "Origin Commission", render: (row) => textOrDash(row.originCommission) },
  { key: "awardUsd", label: "Award USD", render: (row) => textOrDash(row.awardUsd) },
  { key: "originAwardUsd", label: "Origin Award USD", render: (row) => textOrDash(row.originAwardUsd) },
  { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
  {
    key: "withdrawStatus",
    label: "Withdraw Status",
    render: (row) => <StatusBadge status={row.withdrawStatus} />,
  },
  { key: "countDate", label: "Count Date", render: (row) => textOrDash(row.countDate) },
  { key: "createTime", label: "Create Time", render: (row) => textOrDash(row.createTime) },
  { key: "updateTime", label: "Update Time", render: (row) => textOrDash(row.updateTime) },
];

function createDefaultFilters(): UserCommissionFilterForm {
  return {
    page: 1,
    pageSize: 20,
    sortBy: "countDate",
    sortOrder: "desc",
    statementId: "",
    affiliateCode: "",
    referralCode: "",
    affiliateName: "",
    email: "",
    ownerName: "",
    customerId: "",
    spAccount: "",
    orderNo: "",
    orderId: "",
    symbolCode: "",
    currencyType: "",
    countDateFrom: "",
    countDateTo: "",
    commissionMin: "",
    commissionMax: "",
    awardUsdMin: "",
    awardUsdMax: "",
    openValueUsdMin: "",
    openValueUsdMax: "",
    status: [],
    withdrawStatus: [],
  };
}

function normalizeText(value?: string | number) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function normalizePageSize(pageSize?: number) {
  const numeric = Number(pageSize ?? 20);
  if (!Number.isFinite(numeric)) {
    return 20;
  }
  return Math.max(1, Math.min(200, Math.floor(numeric)));
}

function buildQuery(filters: UserCommissionFilterForm): SettlementUserCommissionQuery {
  return {
    page: 1,
    pageSize: normalizePageSize(filters.pageSize),
    statementId: normalizeText(filters.statementId),
    affiliateCode: normalizeText(filters.affiliateCode),
    referralCode: normalizeText(filters.referralCode),
    affiliateName: normalizeText(filters.affiliateName),
    email: normalizeText(filters.email),
    ownerName: normalizeText(filters.ownerName),
    customerId: normalizeText(filters.customerId),
    spAccount: normalizeText(filters.spAccount),
    orderNo: normalizeText(filters.orderNo),
    orderId: normalizeText(filters.orderId),
    symbolCode: normalizeText(filters.symbolCode),
    currencyType: normalizeText(filters.currencyType),
    countDateFrom: normalizeText(filters.countDateFrom),
    countDateTo: normalizeText(filters.countDateTo),
    commissionMin: normalizeText(filters.commissionMin),
    commissionMax: normalizeText(filters.commissionMax),
    awardUsdMin: normalizeText(filters.awardUsdMin),
    awardUsdMax: normalizeText(filters.awardUsdMax),
    openValueUsdMin: normalizeText(filters.openValueUsdMin),
    openValueUsdMax: normalizeText(filters.openValueUsdMax),
    status: filters.status.length > 0 ? filters.status : undefined,
    withdrawStatus:
      filters.withdrawStatus.length > 0 ? filters.withdrawStatus : undefined,
    sortBy: (filters.sortBy ?? "countDate") as SettlementUserCommissionSortBy,
    sortOrder: filters.sortOrder ?? "desc",
  };
}

function isValidDateInput(value?: string) {
  const text = String(value ?? "").trim();
  if (!text) {
    return true;
  }

  return (
    /^\d{4}-\d{2}-\d{2}$/.test(text) ||
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text)
  );
}

function toComparableDate(value?: string, endOfDay = false) {
  const text = String(value ?? "").trim();
  if (!text) {
    return "";
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return `${text} ${endOfDay ? "23:59:59" : "00:00:00"}`;
  }
  return text;
}

function isValidDecimal(value?: string) {
  const text = String(value ?? "").trim();
  if (!text) {
    return true;
  }
  return /^-?\d+(\.\d+)?$/.test(text);
}

function validateFilters(filters: UserCommissionFilterForm) {
  const rawPageSize = Number(filters.pageSize ?? 20);
  if (Number.isFinite(rawPageSize) && rawPageSize > 200) {
    return "Page size cannot exceed 200.";
  }

  const dateFields: Array<{ label: string; value?: string }> = [
    { label: "Count Date From", value: filters.countDateFrom },
    { label: "Count Date To", value: filters.countDateTo },
  ];

  for (const field of dateFields) {
    if (!isValidDateInput(field.value)) {
      return `${field.label} must use YYYY-MM-DD or YYYY-MM-DD HH:MM:SS.`;
    }
  }

  const countDateFrom = toComparableDate(filters.countDateFrom, false);
  const countDateTo = toComparableDate(filters.countDateTo, true);
  if (countDateFrom && countDateTo && countDateTo < countDateFrom) {
    return "Count Date To cannot be earlier than Count Date From.";
  }

  const decimalFields: Array<{ label: string; value?: string }> = [
    { label: "Commission Min", value: filters.commissionMin },
    { label: "Commission Max", value: filters.commissionMax },
    { label: "Award USD Min", value: filters.awardUsdMin },
    { label: "Award USD Max", value: filters.awardUsdMax },
    { label: "Open Value USD Min", value: filters.openValueUsdMin },
    { label: "Open Value USD Max", value: filters.openValueUsdMax },
  ];

  for (const field of decimalFields) {
    if (!isValidDecimal(field.value)) {
      return `${field.label} must be a valid decimal number.`;
    }
  }

  const rangeChecks: Array<{
    label: string;
    min?: string;
    max?: string;
  }> = [
    { label: "Commission", min: filters.commissionMin, max: filters.commissionMax },
    { label: "Award USD", min: filters.awardUsdMin, max: filters.awardUsdMax },
    {
      label: "Open Value USD",
      min: filters.openValueUsdMin,
      max: filters.openValueUsdMax,
    },
  ];

  for (const range of rangeChecks) {
    const min = normalizeText(range.min);
    const max = normalizeText(range.max);
    if (min && max && Number(max) < Number(min)) {
      return `${range.label} max cannot be smaller than min.`;
    }
  }

  return null;
}

function UserCommissionSummaryCards({
  summary,
  loading,
}: {
  summary?: SettlementUserCommissionSummary;
  loading?: boolean;
}) {
  const value = (text?: string) => (loading ? "..." : text ?? "0.00");

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <StatCard label="Total Commission" value={value(summary?.totalCommission)} />
      <StatCard
        label="Total Origin Commission"
        value={value(summary?.totalOriginCommission)}
      />
      <StatCard label="Total Award USD" value={value(summary?.totalAwardUsd)} />
      <StatCard
        label="Total Origin Award USD"
        value={value(summary?.totalOriginAwardUsd)}
      />
      <StatCard label="Total Volume" value={value(summary?.totalVolume)} />
      <StatCard
        label="Total Open Value USD"
        value={value(summary?.totalOpenValueUsd)}
      />
    </div>
  );
}

function UserCommissionFilters({
  filters,
  onChange,
  onSearch,
  onReset,
  loading,
}: {
  filters: UserCommissionFilterForm;
  onChange: (next: UserCommissionFilterForm) => void;
  onSearch: () => void;
  onReset: () => void;
  loading?: boolean;
}) {
  function toggleStatus(
    key: "status" | "withdrawStatus",
    value: SettlementUserCommissionStatus | SettlementUserCommissionWithdrawStatus,
    checked: boolean,
  ) {
    const current = filters[key];
    const next = checked
      ? Array.from(new Set([...current, value]))
      : current.filter((item) => item !== value);
    onChange({ ...filters, [key]: next });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">KOL Commission Filters</CardTitle>
        <CardDescription>
          Query raw commission detail rows from <code>/admin/affinex/userCommission</code>.
          Leave status empty to use the backend default of <code>CALCULATED</code> and{" "}
          <code>FINISHED</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Field label="Page Size">
          <select
            className={controlClass}
            value={String(filters.pageSize ?? 20)}
            onChange={(event) =>
              onChange({ ...filters, pageSize: Number(event.target.value) })
            }
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Sort By">
          <select
            className={controlClass}
            value={filters.sortBy ?? "countDate"}
            onChange={(event) =>
              onChange({
                ...filters,
                sortBy: event.target.value as SettlementUserCommissionSortBy,
              })
            }
          >
            {userCommissionSortByOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Sort Order">
          <select
            className={controlClass}
            value={filters.sortOrder ?? "desc"}
            onChange={(event) =>
              onChange({ ...filters, sortOrder: event.target.value })
            }
          >
            {userCommissionSortOrderOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Statement ID" hint="Exact match on payment_id.">
          <Input
            value={String(filters.statementId ?? "")}
            onChange={(event) =>
              onChange({ ...filters, statementId: event.target.value })
            }
          />
        </Field>
        <Field label="Affiliate Code" hint="Exact match.">
          <Input
            value={filters.affiliateCode ?? ""}
            onChange={(event) =>
              onChange({ ...filters, affiliateCode: event.target.value })
            }
          />
        </Field>
        <Field label="Referral Code" hint="Raw medium exact match.">
          <Input
            value={filters.referralCode ?? ""}
            onChange={(event) =>
              onChange({ ...filters, referralCode: event.target.value })
            }
          />
        </Field>
        <Field label="Affiliate Name" hint="Fuzzy match.">
          <Input
            value={filters.affiliateName ?? ""}
            onChange={(event) =>
              onChange({ ...filters, affiliateName: event.target.value })
            }
          />
        </Field>
        <Field label="Email" hint="Fuzzy match.">
          <Input
            value={filters.email ?? ""}
            onChange={(event) => onChange({ ...filters, email: event.target.value })}
          />
        </Field>
        <Field label="Owner Name" hint="Fuzzy match or adminId.">
          <Input
            value={filters.ownerName ?? ""}
            onChange={(event) =>
              onChange({ ...filters, ownerName: event.target.value })
            }
          />
        </Field>
        <Field label="Customer ID" hint="Exact match.">
          <Input
            value={filters.customerId ?? ""}
            onChange={(event) =>
              onChange({ ...filters, customerId: event.target.value })
            }
          />
        </Field>
        <Field label="SP Account" hint="Exact match.">
          <Input
            value={filters.spAccount ?? ""}
            onChange={(event) =>
              onChange({ ...filters, spAccount: event.target.value })
            }
          />
        </Field>
        <Field label="Order No" hint="Exact match.">
          <Input
            value={filters.orderNo ?? ""}
            onChange={(event) =>
              onChange({ ...filters, orderNo: event.target.value })
            }
          />
        </Field>
        <Field label="Order ID" hint="Exact match.">
          <Input
            value={filters.orderId ?? ""}
            onChange={(event) =>
              onChange({ ...filters, orderId: event.target.value })
            }
          />
        </Field>
        <Field label="Symbol Code" hint="Exact match.">
          <Input
            value={filters.symbolCode ?? ""}
            onChange={(event) =>
              onChange({ ...filters, symbolCode: event.target.value })
            }
          />
        </Field>
        <Field label="Currency Type" hint="Exact match.">
          <Input
            value={filters.currencyType ?? ""}
            onChange={(event) =>
              onChange({ ...filters, currencyType: event.target.value })
            }
          />
        </Field>
        <Field
          label="Count Date From"
          hint="Use YYYY-MM-DD or YYYY-MM-DD HH:MM:SS."
        >
          <Input
            value={filters.countDateFrom ?? ""}
            onChange={(event) =>
              onChange({ ...filters, countDateFrom: event.target.value })
            }
            placeholder="2026-04-01"
          />
        </Field>
        <Field
          label="Count Date To"
          hint="Date-only To is expanded by backend to 23:59:59."
        >
          <Input
            value={filters.countDateTo ?? ""}
            onChange={(event) =>
              onChange({ ...filters, countDateTo: event.target.value })
            }
            placeholder="2026-04-30"
          />
        </Field>
        <Field label="Commission Min">
          <Input
            value={filters.commissionMin ?? ""}
            onChange={(event) =>
              onChange({ ...filters, commissionMin: event.target.value })
            }
            placeholder="10.00"
          />
        </Field>
        <Field label="Commission Max">
          <Input
            value={filters.commissionMax ?? ""}
            onChange={(event) =>
              onChange({ ...filters, commissionMax: event.target.value })
            }
            placeholder="200.00"
          />
        </Field>
        <Field label="Award USD Min">
          <Input
            value={filters.awardUsdMin ?? ""}
            onChange={(event) =>
              onChange({ ...filters, awardUsdMin: event.target.value })
            }
            placeholder="0.00"
          />
        </Field>
        <Field label="Award USD Max">
          <Input
            value={filters.awardUsdMax ?? ""}
            onChange={(event) =>
              onChange({ ...filters, awardUsdMax: event.target.value })
            }
            placeholder="100.00"
          />
        </Field>
        <Field label="Open Value USD Min">
          <Input
            value={filters.openValueUsdMin ?? ""}
            onChange={(event) =>
              onChange({ ...filters, openValueUsdMin: event.target.value })
            }
            placeholder="100.00"
          />
        </Field>
        <Field label="Open Value USD Max">
          <Input
            value={filters.openValueUsdMax ?? ""}
            onChange={(event) =>
              onChange({ ...filters, openValueUsdMax: event.target.value })
            }
            placeholder="5000.00"
          />
        </Field>
        <Field label="Commission Status" className="lg:col-span-2">
          <div className="grid gap-2 rounded-xl border bg-muted/10 p-3 text-sm sm:grid-cols-3">
            {userCommissionStatusOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.status.includes(option.value)}
                  onChange={(event) =>
                    toggleStatus("status", option.value, event.target.checked)
                  }
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </Field>
        <Field label="Withdraw Status" className="lg:col-span-2">
          <div className="grid gap-2 rounded-xl border bg-muted/10 p-3 text-sm sm:grid-cols-3">
            {userCommissionWithdrawStatusOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.withdrawStatus.includes(option.value)}
                  onChange={(event) =>
                    toggleStatus(
                      "withdrawStatus",
                      option.value,
                      event.target.checked,
                    )
                  }
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </Field>
        <div className="lg:col-span-4">
          <FilterActions
            onSearch={onSearch}
            onReset={onReset}
            loading={loading}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function UserCommissionsTable({
  data,
  loading,
  page,
  pageSize,
  onPageChange,
}: {
  data?: SettlementUserCommissionListValue;
  loading?: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const items = data?.items ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">KOL Commission Result</CardTitle>
        <CardDescription>
          Total rows: {data?.total ?? 0}. Summary is calculated on the full filtered
          result set, not the current page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading commission details...
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No commission details found"
            description="Adjust filters and run the query again."
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {userCommissionColumns.map((column) => (
                      <TableHead key={column.key} className="whitespace-nowrap">
                        {column.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((row, index) => (
                    <TableRow
                      key={`${row.id ?? "commission"}-${row.orderId ?? "order"}-${index}`}
                    >
                      {userCommissionColumns.map((column) => (
                        <TableCell key={column.key} className="whitespace-nowrap">
                          {column.render(row)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <PaginationBar
              page={page}
              pageSize={pageSize}
              total={data?.total ?? 0}
              loading={loading}
              onPrev={() => onPageChange(Math.max(1, page - 1))}
              onNext={() => onPageChange(page + 1)}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function KolCommissionView() {
  const defaultFilters = createDefaultFilters();
  const [filters, setFilters] = useState<UserCommissionFilterForm>(defaultFilters);
  const [query, setQuery] = useState<SettlementUserCommissionQuery>(() =>
    buildQuery(defaultFilters),
  );
  const [exportMode, setExportMode] = useState<"page" | "all" | null>(null);
  const exportAbortControllerRef = useRef<AbortController | null>(null);
  const commissionsQuery = useSettlementUserCommissions(query);

  useEffect(() => {
    return () => {
      exportAbortControllerRef.current?.abort();
    };
  }, []);

  async function handleExport(includePagination: boolean) {
    const uploadType: SettlementExportUploadType = "local";
    const controller = new AbortController();
    exportAbortControllerRef.current?.abort();
    exportAbortControllerRef.current = controller;
    setExportMode(includePagination ? "page" : "all");

    try {
      const { fileName } = await affiliateConsoleApi.exportSettlementUserCommissions(query, {
        includePagination,
        uploadType,
        signal: controller.signal,
      });
      toast.success(
        fileName
          ? `Export ready. Download should begin shortly: ${fileName}`
          : "Export ready. Download should begin shortly.",
      );
    } catch (error) {
      if (!isDownloadAbortError(error)) {
        toast.error(error instanceof Error ? error.message : "Export download failed.");
      }
    } finally {
      if (exportAbortControllerRef.current === controller) {
        exportAbortControllerRef.current = null;
        setExportMode(null);
      }
    }
  }

  function handleSearch() {
    const error = validateFilters(filters);
    if (error) {
      toast.error(error);
      return;
    }

    setQuery(buildQuery(filters));
  }

  function handleReset() {
    const next = createDefaultFilters();
    setFilters(next);
    setQuery(buildQuery(next));
  }

  return (
    <PageShell
      title="KOL Commission"
      description="Order-level commission detail rows from affiliate_commission_list with current affiliate and BD ownership mapping. Summary metrics follow the active filters and are not affected by pagination."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleExport(true)}
            disabled={exportMode !== null}
          >
            {exportMode === "page" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            导出
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleExport(false)}
            disabled={exportMode !== null}
          >
            {exportMode === "all" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            导出全部
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void commissionsQuery.refetch()}
            disabled={commissionsQuery.isFetching}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      }
    >
      <UserCommissionSummaryCards
        summary={commissionsQuery.data?.summary}
        loading={commissionsQuery.isLoading}
      />

      <UserCommissionFilters
        filters={filters}
        onChange={setFilters}
        onSearch={handleSearch}
        onReset={handleReset}
        loading={commissionsQuery.isFetching}
      />

      <UserCommissionsTable
        data={commissionsQuery.data}
        loading={commissionsQuery.isLoading || commissionsQuery.isFetching}
        page={query.page ?? 1}
        pageSize={query.pageSize ?? 20}
        onPageChange={(page) => setQuery((current) => ({ ...current, page }))}
      />
    </PageShell>
  );
}
