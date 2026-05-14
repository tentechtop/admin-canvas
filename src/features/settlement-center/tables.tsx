import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Loader2 } from "lucide-react";
import { CONSOLE_PLATFORM_CODE, affiliateConsoleApi } from "@/api/affiliate-console";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, Field, StatusBadge } from "@/features/console/shared";
import { controlClass } from "@/features/console/shared-utils";
import { FilterActions, PaginationBar, textOrDash } from "@/features/settlement-center/shared";
import type {
  AuthUserInfo,
  SettlementCommissionStatementListValue,
  SettlementCommissionStatementQuery,
  SettlementCommissionStatementRow,
  SettlementPaymentSummaryQuery,
  SettlementPaymentSummaryRow,
  SettlementStatementListValue,
  SettlementStatementQuery,
  SettlementStatementRow,
} from "@/types/affiliate-console";

export const statementStatuses = [
  "",
  "NOTWITHDRAW",
  "PENDING",
  "APPLIED",
  "APPROVED",
  "PAID",
  "DECLINED",
  "MERGED",
];

export const summaryStatuses = ["", "PENDING", "APPLIED", "APPROVED", "PAID", "DECLINED"];
const OWNER_ALL = "__ALL__";
export const commissionStatementStatuses = [
  "WITHDRAWING",
  "APPROVED",
  "PAID",
  "DECLINED",
  "APPLIED",
  "PENDING",
  "ONHOLD",
  "NOTWITHDRAW",
];
export const commissionStatementSortByOptions = [
  "applicationTime",
  "auditTime",
  "settlementTime",
  "payableAmount",
  "statementId",
];
export const commissionStatementSortOrderOptions = ["desc", "asc"];

export const dateRangeOptions = [
  { label: "Custom", value: "" },
  { label: "This Week", value: "0" },
  { label: "Last Week", value: "1" },
  { label: "This Month", value: "2" },
];

export function StatementFilters({
  filters,
  onChange,
  onSearch,
  onReset,
  loading,
}: {
  filters: SettlementStatementQuery;
  onChange: (next: SettlementStatementQuery) => void;
  onSearch: () => void;
  onReset: () => void;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Statement Filters</CardTitle>
        <CardDescription>Filter payment_history by affiliate, status, apply date, period, and payment id.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-4">
        <Field label="Affiliate Code">
          <Input value={filters.affiliateId ?? ""} onChange={(event) => onChange({ ...filters, affiliateId: event.target.value })} />
        </Field>
        <Field label="Affiliate Name">
          <Input value={filters.name ?? ""} onChange={(event) => onChange({ ...filters, name: event.target.value })} />
        </Field>
        <Field label="Statement Status">
          <select className={controlClass} value={filters.status ?? ""} onChange={(event) => onChange({ ...filters, status: event.target.value })}>
            {statementStatuses.map((status) => (
              <option key={status || "ALL"} value={status}>
                {status || "ALL"}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date Preset">
          <select className={controlClass} value={filters.dateRange ?? ""} onChange={(event) => onChange({ ...filters, dateRange: event.target.value })}>
            {dateRangeOptions.map((item) => (
              <option key={item.value || "CUSTOM"} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Apply Date Range">
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={filters.startDate ?? ""} onChange={(event) => onChange({ ...filters, startDate: event.target.value })} />
            <Input type="date" value={filters.endDate ?? ""} onChange={(event) => onChange({ ...filters, endDate: event.target.value })} />
          </div>
        </Field>
        <Field label="Period Range">
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={filters.periodStartDate ?? ""} onChange={(event) => onChange({ ...filters, periodStartDate: event.target.value })} />
            <Input type="date" value={filters.periodEndDate ?? ""} onChange={(event) => onChange({ ...filters, periodEndDate: event.target.value })} />
          </div>
        </Field>
        <Field label="Payment ID">
          <Input value={filters.paymentId ?? ""} onChange={(event) => onChange({ ...filters, paymentId: event.target.value })} />
        </Field>
        <Field label="Include NOTWITHDRAW">
          <label className="flex h-10 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(filters.includeNotWithdraw)}
              onChange={(event) => onChange({ ...filters, includeNotWithdraw: event.target.checked })}
            />
            Include pending apply
          </label>
        </Field>
        <FilterActions onSearch={onSearch} onReset={onReset} loading={loading} />
      </CardContent>
    </Card>
  );
}

export function StatementsTable({
  data,
  loading,
  page,
  pageSize,
  onPageChange,
  onView,
  selectedIds,
  onToggleSelect,
  showSelect,
}: {
  data?: SettlementStatementListValue;
  loading?: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onView: (row: SettlementStatementRow) => void;
  selectedIds?: number[];
  onToggleSelect?: (row: SettlementStatementRow, checked: boolean) => void;
  showSelect?: boolean;
}) {
  const items = data?.items ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Statement Result</CardTitle>
        <CardDescription>
          Total rows: {data?.total ?? 0}. Summary amount: {data?.summaryAmount ?? "0.00"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading statements...
          </div>
        ) : items.length === 0 ? (
          <EmptyState title="No statements found" description="Adjust filters and run the query again." />
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {showSelect ? <TableHead className="w-10" /> : null}
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Affiliate Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Application</TableHead>
                    <TableHead>Payout</TableHead>
                    <TableHead className="w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((row) => {
                    const numericId = Number(row.id ?? 0);
                    const checked = selectedIds?.includes(numericId) ?? false;
                    return (
                      <TableRow key={numericId || `${row.affiliateId}-${row.datePeriod}`}>
                        {showSelect ? (
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(event) => onToggleSelect?.(row, event.target.checked)}
                              disabled={numericId <= 0}
                            />
                          </TableCell>
                        ) : null}
                        <TableCell>{textOrDash(row.id)}</TableCell>
                        <TableCell>{textOrDash(row.affiliateId)}</TableCell>
                        <TableCell>{textOrDash(row.name)}</TableCell>
                        <TableCell>{textOrDash(row.owner)}</TableCell>
                        <TableCell>{textOrDash(row.datePeriod)}</TableCell>
                        <TableCell>{textOrDash(row.paidAmount)}</TableCell>
                        <TableCell><StatusBadge status={row.status} /></TableCell>
                        <TableCell>{textOrDash(row.applicationDate)}</TableCell>
                        <TableCell>{textOrDash(row.payoutDate)}</TableCell>
                        <TableCell>
                          <Button type="button" size="sm" variant="outline" onClick={() => onView(row)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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

export function SummaryFilters({
  filters,
  onChange,
  onSearch,
  onReset,
  loading,
}: {
  filters: SettlementPaymentSummaryQuery;
  onChange: (next: SettlementPaymentSummaryQuery) => void;
  onSearch: () => void;
  onReset: () => void;
  loading?: boolean;
}) {
  const ownerOptionsQuery = useQuery<AuthUserInfo[]>({
    queryKey: ["settlement-center", "owner-options"],
    queryFn: async () => {
      const result = await affiliateConsoleApi.listAuthUsers({
        platformCode: CONSOLE_PLATFORM_CODE,
        roleCodes: ["KOL_BD"],
      });
      return result.value?.list ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Payment Summary Filters</CardTitle>
        <CardDescription>Filter payment_summary by ID, affiliate, referral, country, owner, status, and created date.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-4">
        <Field label="ID">
          <Input value={String(filters.id ?? "")} onChange={(event) => onChange({ ...filters, id: event.target.value })} />
        </Field>
        <Field label="Country">
          <Input value={filters.country ?? ""} onChange={(event) => onChange({ ...filters, country: event.target.value })} />
        </Field>
        <Field label="Affiliate ID">
          <Input value={filters.affiliateId ?? ""} onChange={(event) => onChange({ ...filters, affiliateId: event.target.value })} />
        </Field>
        <Field label="Affiliate Code">
          <Input value={filters.affiliateCode ?? ""} onChange={(event) => onChange({ ...filters, affiliateCode: event.target.value })} />
        </Field>
        <Field label="Referral Code">
          <Input value={filters.referralCode ?? ""} onChange={(event) => onChange({ ...filters, referralCode: event.target.value })} />
        </Field>
        <Field label="Mail">
          <Input value={filters.mail ?? ""} onChange={(event) => onChange({ ...filters, mail: event.target.value })} />
        </Field>
        <Field label="Owner ID">
          <Select
            value={String(filters.ownerId ?? "") || OWNER_ALL}
            onValueChange={(value) => onChange({ ...filters, ownerId: value === OWNER_ALL ? "" : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={ownerOptionsQuery.isLoading ? "Loading owners..." : "Select owner"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={OWNER_ALL}>All owners</SelectItem>
              {(ownerOptionsQuery.data ?? []).map((user) => {
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
        <Field label="Summary Status">
          <select className={controlClass} value={filters.status ?? ""} onChange={(event) => onChange({ ...filters, status: event.target.value })}>
            {summaryStatuses.map((status) => (
              <option key={status || "ALL"} value={status}>
                {status || "ALL"}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date Preset">
          <select className={controlClass} value={filters.dateRange ?? ""} onChange={(event) => onChange({ ...filters, dateRange: event.target.value })}>
            {dateRangeOptions.map((item) => (
              <option key={item.value || "CUSTOM"} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Created Date Range">
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={filters.startDate ?? ""} onChange={(event) => onChange({ ...filters, startDate: event.target.value })} />
            <Input type="date" value={filters.endDate ?? ""} onChange={(event) => onChange({ ...filters, endDate: event.target.value })} />
          </div>
        </Field>
        <FilterActions onSearch={onSearch} onReset={onReset} loading={loading} />
      </CardContent>
    </Card>
  );
}

export function PaymentSummariesTable({
  items,
  total,
  page,
  pageSize,
  summaryAmount,
  loading,
  onPageChange,
  onView,
  renderActions,
}: {
  items: SettlementPaymentSummaryRow[];
  total: number;
  page: number;
  pageSize: number;
  summaryAmount?: string;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onView: (row: SettlementPaymentSummaryRow) => void;
  renderActions?: (row: SettlementPaymentSummaryRow) => ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Payment Summary Result</CardTitle>
        <CardDescription>
          Total rows: {total}. Total payable: {summaryAmount ?? "0.00"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading payment summaries...
          </div>
        ) : items.length === 0 ? (
          <EmptyState title="No payment summaries" description="Run a query to load payment summaries." />
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Summary ID</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Affiliate Code</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Payable</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Application</TableHead>
                    <TableHead>Payout</TableHead>
                    <TableHead className="w-[320px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((row) => (
                    <TableRow key={row.id ?? `${row.affiliateId}-${row.applicationDate}`}>
                      <TableCell>{textOrDash(row.id)}</TableCell>
                      <TableCell>{textOrDash(row.country)}</TableCell>
                      <TableCell>{textOrDash(row.affiliateCode)}</TableCell>
                      <TableCell>{textOrDash(row.referralCode || row.medium)}</TableCell>
                      <TableCell>{textOrDash(row.name)}</TableCell>
                      <TableCell>{textOrDash(row.owner)}</TableCell>
                      <TableCell>{textOrDash(row.payableAmount)}</TableCell>
                      <TableCell><StatusBadge status={row.status} /></TableCell>
                      <TableCell>{textOrDash(row.applicationDate)}</TableCell>
                      <TableCell>{textOrDash(row.payoutDate)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => onView(row)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                          {renderActions?.(row)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <PaginationBar
              page={page}
              pageSize={pageSize}
              total={total}
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

export function CommissionStatementFilters({
  filters,
  onChange,
  onSearch,
  onReset,
  loading,
}: {
  filters: SettlementCommissionStatementQuery;
  onChange: (next: SettlementCommissionStatementQuery) => void;
  onSearch: () => void;
  onReset: () => void;
  loading?: boolean;
}) {
  function toggleStatus(status: string, checked: boolean) {
    const current = filters.status ?? [];
    const next = checked
      ? Array.from(new Set([...current, status]))
      : current.filter((item) => item !== status);
    onChange({ ...filters, status: next });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Commission Statement Filters</CardTitle>
        <CardDescription>Query periodic payable commission statements from /admin/affinex/commissionStatement.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-4">
        <Field label="Statement ID">
          <Input value={String(filters.statementId ?? "")} onChange={(event) => onChange({ ...filters, statementId: event.target.value })} />
        </Field>
        <Field label="Settlement ID">
          <Input value={String(filters.settlementId ?? "")} onChange={(event) => onChange({ ...filters, settlementId: event.target.value })} />
        </Field>
        <Field label="Affiliate Code">
          <Input value={filters.affiliateCode ?? ""} onChange={(event) => onChange({ ...filters, affiliateCode: event.target.value })} />
        </Field>
        <Field label="Referral Code">
          <Input value={filters.referralCode ?? ""} onChange={(event) => onChange({ ...filters, referralCode: event.target.value })} />
        </Field>
        <Field label="Affiliate Name">
          <Input value={filters.affiliateName ?? ""} onChange={(event) => onChange({ ...filters, affiliateName: event.target.value })} />
        </Field>
        <Field label="Email">
          <Input value={filters.email ?? ""} onChange={(event) => onChange({ ...filters, email: event.target.value })} />
        </Field>
        <Field label="Owner Name">
          <Input value={filters.ownerName ?? ""} onChange={(event) => onChange({ ...filters, ownerName: event.target.value })} />
        </Field>
        <Field label="Status">
          <div className="grid gap-2 rounded-xl border bg-muted/10 p-3 text-sm md:grid-cols-2">
            {commissionStatementStatuses.map((status) => (
              <label key={status} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(filters.status ?? []).includes(status)}
                  onChange={(event) => toggleStatus(status, event.target.checked)}
                />
                <span>{status}</span>
              </label>
            ))}
          </div>
        </Field>
        <Field label="Period Start Range">
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={filters.periodStartDateFrom ?? ""} onChange={(event) => onChange({ ...filters, periodStartDateFrom: event.target.value })} />
            <Input type="date" value={filters.periodStartDateTo ?? ""} onChange={(event) => onChange({ ...filters, periodStartDateTo: event.target.value })} />
          </div>
        </Field>
        <Field label="Period End Range">
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={filters.periodEndDateFrom ?? ""} onChange={(event) => onChange({ ...filters, periodEndDateFrom: event.target.value })} />
            <Input type="date" value={filters.periodEndDateTo ?? ""} onChange={(event) => onChange({ ...filters, periodEndDateTo: event.target.value })} />
          </div>
        </Field>
        <Field label="Application Time Range">
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={filters.applicationTimeFrom ?? ""} onChange={(event) => onChange({ ...filters, applicationTimeFrom: event.target.value })} />
            <Input type="date" value={filters.applicationTimeTo ?? ""} onChange={(event) => onChange({ ...filters, applicationTimeTo: event.target.value })} />
          </div>
        </Field>
        <Field label="Audit Time Range">
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={filters.auditTimeFrom ?? ""} onChange={(event) => onChange({ ...filters, auditTimeFrom: event.target.value })} />
            <Input type="date" value={filters.auditTimeTo ?? ""} onChange={(event) => onChange({ ...filters, auditTimeTo: event.target.value })} />
          </div>
        </Field>
        <Field label="Settlement Time Range">
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={filters.settlementTimeFrom ?? ""} onChange={(event) => onChange({ ...filters, settlementTimeFrom: event.target.value })} />
            <Input type="date" value={filters.settlementTimeTo ?? ""} onChange={(event) => onChange({ ...filters, settlementTimeTo: event.target.value })} />
          </div>
        </Field>
        <Field label="Payable Amount Range">
          <div className="grid grid-cols-2 gap-2">
            <Input value={filters.payableAmountMin ?? ""} onChange={(event) => onChange({ ...filters, payableAmountMin: event.target.value })} placeholder="Min" />
            <Input value={filters.payableAmountMax ?? ""} onChange={(event) => onChange({ ...filters, payableAmountMax: event.target.value })} placeholder="Max" />
          </div>
        </Field>
        <Field label="Sort By">
          <select className={controlClass} value={filters.sortBy ?? "applicationTime"} onChange={(event) => onChange({ ...filters, sortBy: event.target.value })}>
            {commissionStatementSortByOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Sort Order">
          <select className={controlClass} value={filters.sortOrder ?? "desc"} onChange={(event) => onChange({ ...filters, sortOrder: event.target.value })}>
            {commissionStatementSortOrderOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>
        <FilterActions onSearch={onSearch} onReset={onReset} loading={loading} />
      </CardContent>
    </Card>
  );
}

export function CommissionStatementsTable({
  data,
  loading,
  page,
  pageSize,
  onPageChange,
  onView,
}: {
  data?: SettlementCommissionStatementListValue;
  loading?: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onView: (row: SettlementCommissionStatementRow) => void;
}) {
  const items = data?.items ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Commission Statement Result</CardTitle>
        <CardDescription>Total rows: {data?.total ?? 0}. Query-level payable total: {data?.summary?.payableTotal ?? "0.00"}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading commission statements...
          </div>
        ) : items.length === 0 ? (
          <EmptyState title="No commission statements found" description="Adjust filters and run the query again." />
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Statement ID</TableHead>
                    <TableHead>Settlement ID</TableHead>
                    <TableHead>Affiliate Code</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Origin</TableHead>
                    <TableHead>Award Deduction</TableHead>
                    <TableHead>Manual Adjustment</TableHead>
                    <TableHead>Payable</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Application Time</TableHead>
                    <TableHead>Audit Time</TableHead>
                    <TableHead>Settlement Time</TableHead>
                    <TableHead className="w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((row) => (
                    <TableRow key={`${row.statementId ?? "statement"}-${row.settlementId ?? ""}`}>
                      <TableCell>{textOrDash(row.statementId)}</TableCell>
                      <TableCell>{textOrDash(row.settlementId)}</TableCell>
                      <TableCell>{textOrDash(row.affiliateCode)}</TableCell>
                      <TableCell>{textOrDash(row.referralCode)}</TableCell>
                      <TableCell>{textOrDash(row.affiliateName)}</TableCell>
                      <TableCell>{textOrDash(row.email)}</TableCell>
                      <TableCell>{textOrDash(row.ownerName)}</TableCell>
                      <TableCell>{textOrDash(row.periodLabel || `${textOrDash(row.periodStartDate)} - ${textOrDash(row.periodEndDate)}`)}</TableCell>
                      <TableCell>{textOrDash(row.originCommissionAmount)}</TableCell>
                      <TableCell>{textOrDash(row.awardDeductionAmount)}</TableCell>
                      <TableCell>{textOrDash(row.manualAdjustmentAmount)}</TableCell>
                      <TableCell>{textOrDash(row.payableAmount)}</TableCell>
                      <TableCell><StatusBadge status={row.status} /></TableCell>
                      <TableCell>{textOrDash(row.applicationTime)}</TableCell>
                      <TableCell>{textOrDash(row.auditTime)}</TableCell>
                      <TableCell>{textOrDash(row.settlementTime)}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onView(row)}
                          disabled={String(row.statementId ?? "").trim() === ""}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </TableCell>
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
