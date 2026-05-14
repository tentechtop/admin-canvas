import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { EmptyState, Field, StatCard } from "@/features/console/shared";
import { controlClass } from "@/features/console/shared-utils";
import {
  FilterActions,
  PageShell,
  PaginationBar,
  textOrDash,
} from "@/features/settlement-center/shared";
import type {
  SettlementTransactionRecordListValue,
  SettlementTransactionRecordQuery,
  SettlementTransactionRecordRow,
  SettlementTransactionRecordSortBy,
  SettlementTransactionRecordSummary,
} from "@/types/affiliate-console";

type TransactionRecordFilterForm = Omit<
  SettlementTransactionRecordQuery,
  "orderType" | "orderStatus"
> & {
  orderTypeText: string;
  orderStatusText: string;
};

const transactionRecordQueryKeys = {
  list: (query: SettlementTransactionRecordQuery) =>
    ["settlement-center", "transaction-records", query] as const,
};

const transactionRecordSortByOptions: Array<{
  value: SettlementTransactionRecordSortBy;
  label: string;
}> = [
  { value: "openTime", label: "Open Time" },
  { value: "closeTime", label: "Close Time" },
  { value: "openValueUsd", label: "Open Value USD" },
  { value: "profit", label: "Profit" },
  { value: "orderSpreadAwardUsd", label: "Spread Award USD" },
  { value: "orderId", label: "Order ID" },
];

const transactionRecordSortOrderOptions = ["desc", "asc"] as const;
const pageSizeOptions = [20, 50, 100, 200];

const transactionRecordColumns: Array<{
  key: keyof SettlementTransactionRecordRow;
  label: string;
}> = [
  { key: "customerId", label: "Customer ID" },
  { key: "spAccount", label: "SP Account" },
  { key: "affiliateId", label: "Affiliate ID" },
  { key: "affiliateCode", label: "Affiliate Code" },
  { key: "referralCode", label: "Referral Code" },
  { key: "affiliateName", label: "Affiliate Name" },
  { key: "email", label: "Email" },
  { key: "ownerName", label: "Owner" },
  { key: "orderNo", label: "Order No" },
  { key: "orderId", label: "Order ID" },
  { key: "symbolCode", label: "Symbol Code" },
  { key: "symbolType", label: "Symbol Type" },
  { key: "orderType", label: "Order Type" },
  { key: "orderStatus", label: "Order Status" },
  { key: "lots", label: "Lots" },
  { key: "volume", label: "Volume" },
  { key: "openSystem", label: "Open System" },
  { key: "openTime", label: "Open Time" },
  { key: "closeTime", label: "Close Time" },
  { key: "openPrice", label: "Open Price" },
  { key: "closePrice", label: "Close Price" },
  { key: "currency", label: "Currency" },
  { key: "margin", label: "Margin" },
  { key: "profit", label: "Profit" },
  { key: "swaps", label: "Swaps" },
  { key: "leverage", label: "Leverage" },
  { key: "openingSpreadCost", label: "Opening Spread Cost" },
  { key: "closingSpreadCost", label: "Closing Spread Cost" },
  { key: "openValueUsd", label: "Open Value USD" },
  { key: "openingPrice", label: "Opening Price" },
  { key: "currencyType", label: "Currency Type" },
  { key: "openingSpreadCostUsd", label: "Opening Spread Cost USD" },
  { key: "closingSpreadCostUsd", label: "Closing Spread Cost USD" },
  { key: "orderSpreadAwardUsd", label: "Spread Award USD" },
];

function createDefaultFilters(): TransactionRecordFilterForm {
  return {
    page: 1,
    pageSize: 20,
    sortBy: "openTime",
    sortOrder: "desc",
    orderTypeText: "",
    orderStatusText: "",
    customerId: "",
    spAccount: "",
    affiliateCode: "",
    referralCode: "",
    affiliateName: "",
    email: "",
    ownerName: "",
    orderNo: "",
    orderId: "",
    symbolCode: "",
    symbolType: "",
    openSystem: "",
    currency: "",
    openTimeFrom: "",
    openTimeTo: "",
    closeTimeFrom: "",
    closeTimeTo: "",
    openValueUsdMin: "",
    openValueUsdMax: "",
    profitMin: "",
    profitMax: "",
    orderSpreadAwardUsdMin: "",
    orderSpreadAwardUsdMax: "",
  };
}

function normalizeText(value?: string) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function splitRepeatedValues(raw?: string) {
  const items = String(raw ?? "")
    .replace(/\uFF0C/g, ",")
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function normalizePageSize(pageSize?: number) {
  const numeric = Number(pageSize ?? 20);
  if (!Number.isFinite(numeric)) {
    return 20;
  }
  return Math.max(1, Math.min(200, Math.floor(numeric)));
}

function buildQuery(filters: TransactionRecordFilterForm): SettlementTransactionRecordQuery {
  return {
    page: 1,
    pageSize: normalizePageSize(filters.pageSize),
    customerId: normalizeText(filters.customerId),
    spAccount: normalizeText(filters.spAccount),
    affiliateCode: normalizeText(filters.affiliateCode),
    referralCode: normalizeText(filters.referralCode),
    affiliateName: normalizeText(filters.affiliateName),
    email: normalizeText(filters.email),
    ownerName: normalizeText(filters.ownerName),
    orderNo: normalizeText(filters.orderNo),
    orderId: normalizeText(filters.orderId),
    symbolCode: normalizeText(filters.symbolCode),
    symbolType: normalizeText(filters.symbolType),
    orderType: splitRepeatedValues(filters.orderTypeText),
    orderStatus: splitRepeatedValues(filters.orderStatusText),
    openSystem: normalizeText(filters.openSystem),
    currency: normalizeText(filters.currency),
    openTimeFrom: normalizeText(filters.openTimeFrom),
    openTimeTo: normalizeText(filters.openTimeTo),
    closeTimeFrom: normalizeText(filters.closeTimeFrom),
    closeTimeTo: normalizeText(filters.closeTimeTo),
    openValueUsdMin: normalizeText(filters.openValueUsdMin),
    openValueUsdMax: normalizeText(filters.openValueUsdMax),
    profitMin: normalizeText(filters.profitMin),
    profitMax: normalizeText(filters.profitMax),
    orderSpreadAwardUsdMin: normalizeText(filters.orderSpreadAwardUsdMin),
    orderSpreadAwardUsdMax: normalizeText(filters.orderSpreadAwardUsdMax),
    sortBy: (filters.sortBy ?? "openTime") as SettlementTransactionRecordSortBy,
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

function validateFilters(filters: TransactionRecordFilterForm) {
  const rawPageSize = Number(filters.pageSize ?? 20);
  if (Number.isFinite(rawPageSize) && rawPageSize > 200) {
    return "Page size cannot exceed 200.";
  }

  const dateFields: Array<{ label: string; value?: string }> = [
    { label: "Open Time From", value: filters.openTimeFrom },
    { label: "Open Time To", value: filters.openTimeTo },
    { label: "Close Time From", value: filters.closeTimeFrom },
    { label: "Close Time To", value: filters.closeTimeTo },
  ];

  for (const field of dateFields) {
    if (!isValidDateInput(field.value)) {
      return `${field.label} must use YYYY-MM-DD or YYYY-MM-DD HH:MM:SS.`;
    }
  }

  const openFrom = toComparableDate(filters.openTimeFrom, false);
  const openTo = toComparableDate(filters.openTimeTo, true);
  if (openFrom && openTo && openTo < openFrom) {
    return "Open Time To cannot be earlier than Open Time From.";
  }

  const closeFrom = toComparableDate(filters.closeTimeFrom, false);
  const closeTo = toComparableDate(filters.closeTimeTo, true);
  if (closeFrom && closeTo && closeTo < closeFrom) {
    return "Close Time To cannot be earlier than Close Time From.";
  }

  const decimalFields: Array<{ label: string; value?: string }> = [
    { label: "Open Value USD Min", value: filters.openValueUsdMin },
    { label: "Open Value USD Max", value: filters.openValueUsdMax },
    { label: "Profit Min", value: filters.profitMin },
    { label: "Profit Max", value: filters.profitMax },
    { label: "Spread Award USD Min", value: filters.orderSpreadAwardUsdMin },
    { label: "Spread Award USD Max", value: filters.orderSpreadAwardUsdMax },
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
    {
      label: "Open Value USD",
      min: filters.openValueUsdMin,
      max: filters.openValueUsdMax,
    },
    {
      label: "Profit",
      min: filters.profitMin,
      max: filters.profitMax,
    },
    {
      label: "Spread Award USD",
      min: filters.orderSpreadAwardUsdMin,
      max: filters.orderSpreadAwardUsdMax,
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

function useSettlementTransactionRecords(query: SettlementTransactionRecordQuery) {
  return useQuery({
    queryKey: transactionRecordQueryKeys.list(query),
    queryFn: async () =>
      (await affiliateConsoleApi.listSettlementTransactionRecords(query)).value,
    placeholderData: (previous) => previous,
  });
}

function TransactionRecordSummaryCards({
  summary,
  loading,
}: {
  summary?: SettlementTransactionRecordSummary;
  loading?: boolean;
}) {
  const value = (text?: string) => (loading ? "..." : text ?? "0.00");

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Total Lots" value={value(summary?.totalLots)} />
      <StatCard label="Total Volume" value={value(summary?.totalVolume)} />
      <StatCard label="Total Open Value USD" value={value(summary?.totalOpenValueUsd)} />
      <StatCard label="Total Profit" value={value(summary?.totalProfit)} />
      <StatCard
        label="Opening Spread Cost USD"
        value={value(summary?.totalOpeningSpreadCostUsd)}
      />
      <StatCard
        label="Closing Spread Cost USD"
        value={value(summary?.totalClosingSpreadCostUsd)}
      />
      <StatCard
        label="Spread Award USD"
        value={value(summary?.totalOrderSpreadAwardUsd)}
      />
    </div>
  );
}

function TransactionRecordFilters({
  filters,
  onChange,
  onSearch,
  onReset,
  loading,
}: {
  filters: TransactionRecordFilterForm;
  onChange: (next: TransactionRecordFilterForm) => void;
  onSearch: () => void;
  onReset: () => void;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Transaction Record Filters</CardTitle>
        <CardDescription>
          Query raw customer trade rows from <code>/admin/affinex/customerTrade</code>.
          Date filters use date pickers and submit <code>YYYY-MM-DD</code>.
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
            value={filters.sortBy ?? "openTime"}
            onChange={(event) =>
              onChange({
                ...filters,
                sortBy: event.target.value as SettlementTransactionRecordSortBy,
              })
            }
          >
            {transactionRecordSortByOptions.map((option) => (
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
            {transactionRecordSortOrderOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Customer ID" hint="Exact match on customer GUID.">
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
            onChange={(event) =>
              onChange({ ...filters, email: event.target.value })
            }
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
        <Field label="Symbol Type" hint="Exact match.">
          <Input
            value={filters.symbolType ?? ""}
            onChange={(event) =>
              onChange({ ...filters, symbolType: event.target.value })
            }
          />
        </Field>
        <Field
          label="Order Type"
          hint="Enter raw values separated by commas or spaces. Sent as repeated query params."
        >
          <Input
            value={filters.orderTypeText}
            onChange={(event) =>
              onChange({ ...filters, orderTypeText: event.target.value })
            }
            placeholder="0, 2"
          />
        </Field>
        <Field
          label="Order Status"
          hint="Enter raw values separated by commas or spaces. Sent as repeated query params."
        >
          <Input
            value={filters.orderStatusText}
            onChange={(event) =>
              onChange({ ...filters, orderStatusText: event.target.value })
            }
            placeholder="1, 2"
          />
        </Field>
        <Field label="Open System" hint="Exact match.">
          <Input
            value={filters.openSystem ?? ""}
            onChange={(event) =>
              onChange({ ...filters, openSystem: event.target.value })
            }
          />
        </Field>
        <Field label="Currency" hint="Exact match.">
          <Input
            value={filters.currency ?? ""}
            onChange={(event) =>
              onChange({ ...filters, currency: event.target.value })
            }
          />
        </Field>
        <Field
          label="Open Time From"
          hint="Date picker uses YYYY-MM-DD."
        >
          <Input
            type="date"
            value={filters.openTimeFrom ?? ""}
            onChange={(event) =>
              onChange({ ...filters, openTimeFrom: event.target.value })
            }
          />
        </Field>
        <Field
          label="Open Time To"
          hint="Backend expands date-only To to 23:59:59."
        >
          <Input
            type="date"
            value={filters.openTimeTo ?? ""}
            onChange={(event) =>
              onChange({ ...filters, openTimeTo: event.target.value })
            }
          />
        </Field>
        <Field
          label="Close Time From"
          hint="Date picker uses YYYY-MM-DD."
        >
          <Input
            type="date"
            value={filters.closeTimeFrom ?? ""}
            onChange={(event) =>
              onChange({ ...filters, closeTimeFrom: event.target.value })
            }
          />
        </Field>
        <Field
          label="Close Time To"
          hint="Backend expands date-only To to 23:59:59."
        >
          <Input
            type="date"
            value={filters.closeTimeTo ?? ""}
            onChange={(event) =>
              onChange({ ...filters, closeTimeTo: event.target.value })
            }
          />
        </Field>
        <Field label="Open Value USD Min">
          <Input
            value={filters.openValueUsdMin ?? ""}
            onChange={(event) =>
              onChange({ ...filters, openValueUsdMin: event.target.value })
            }
            placeholder="Min"
          />
        </Field>
        <Field label="Open Value USD Max">
          <Input
            value={filters.openValueUsdMax ?? ""}
            onChange={(event) =>
              onChange({ ...filters, openValueUsdMax: event.target.value })
            }
            placeholder="Max"
          />
        </Field>
        <Field label="Profit Min">
          <Input
            value={filters.profitMin ?? ""}
            onChange={(event) =>
              onChange({ ...filters, profitMin: event.target.value })
            }
            placeholder="Min"
          />
        </Field>
        <Field label="Profit Max">
          <Input
            value={filters.profitMax ?? ""}
            onChange={(event) =>
              onChange({ ...filters, profitMax: event.target.value })
            }
            placeholder="Max"
          />
        </Field>
        <Field label="Spread Award USD Min">
          <Input
            value={filters.orderSpreadAwardUsdMin ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                orderSpreadAwardUsdMin: event.target.value,
              })
            }
            placeholder="Min"
          />
        </Field>
        <Field label="Spread Award USD Max">
          <Input
            value={filters.orderSpreadAwardUsdMax ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                orderSpreadAwardUsdMax: event.target.value,
              })
            }
            placeholder="Max"
          />
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

function TransactionRecordsTable({
  data,
  loading,
  page,
  pageSize,
  onPageChange,
}: {
  data?: SettlementTransactionRecordListValue;
  loading?: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const items = data?.items ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Transaction Records</CardTitle>
        <CardDescription>
          Total rows: {data?.total ?? 0}. Summary is calculated on the full filtered
          result set, not the current page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading transaction records...
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No transaction records found"
            description="Adjust filters and run the query again."
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {transactionRecordColumns.map((column) => (
                      <TableHead key={column.key} className="whitespace-nowrap">
                        {column.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((row, index) => (
                    <TableRow
                      key={`${row.orderId ?? "trade"}-${row.orderNo ?? "order"}-${index}`}
                    >
                      {transactionRecordColumns.map((column) => (
                        <TableCell key={column.key} className="whitespace-nowrap">
                          {textOrDash(row[column.key])}
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

export function TransactionRecordsView() {
  const defaultFilters = createDefaultFilters();
  const [filters, setFilters] = useState<TransactionRecordFilterForm>(defaultFilters);
  const [query, setQuery] = useState<SettlementTransactionRecordQuery>(() =>
    buildQuery(defaultFilters),
  );
  const recordsQuery = useSettlementTransactionRecords(query);

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
      title="Transaction Records"
      description="Raw customer trade detail rows from dwd_affiliate_medium_customer_trade with current affiliate and owner mapping. Returned times are UTC+0."
      actions={
        <Button
          type="button"
          variant="outline"
          onClick={() => void recordsQuery.refetch()}
          disabled={recordsQuery.isFetching}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      }
    >
      <TransactionRecordSummaryCards
        summary={recordsQuery.data?.summary}
        loading={recordsQuery.isLoading}
      />

      <TransactionRecordFilters
        filters={filters}
        onChange={setFilters}
        onSearch={handleSearch}
        onReset={handleReset}
        loading={recordsQuery.isFetching}
      />

      <TransactionRecordsTable
        data={recordsQuery.data}
        loading={recordsQuery.isLoading || recordsQuery.isFetching}
        page={query.page ?? 1}
        pageSize={query.pageSize ?? 20}
        onPageChange={(page) => setQuery((current) => ({ ...current, page }))}
      />
    </PageShell>
  );
}
