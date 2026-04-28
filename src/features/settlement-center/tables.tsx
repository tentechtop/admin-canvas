import type { ReactNode } from "react";
import { Eye, Loader2 } from "lucide-react";
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
import { EmptyState, Field, StatusBadge } from "@/features/console/shared";
import { controlClass } from "@/features/console/shared-utils";
import { FilterActions, PaginationBar, textOrDash } from "@/features/settlement-center/shared";
import type {
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
  onToggleSelect?: (id: number, checked: boolean) => void;
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
                              onChange={(event) => onToggleSelect?.(numericId, event.target.checked)}
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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Payment Summary Filters</CardTitle>
        <CardDescription>Filter payment_summary by affiliate, status, and created date.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-4">
        <Field label="Affiliate Code">
          <Input value={filters.affiliateId ?? ""} onChange={(event) => onChange({ ...filters, affiliateId: event.target.value })} />
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
          Total rows: {total}. Summary amount: {summaryAmount ?? "0.00"}.
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
                    <TableHead>Affiliate Code</TableHead>
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
                      <TableCell>{textOrDash(row.affiliateCode)}</TableCell>
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
