import { useEffect, useRef, useState, type ReactNode } from "react";
import { Eye, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { affiliateConsoleApi } from "@/api/affiliate-console";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import {
  EmptyState,
  Field,
  PageIntro,
  StatCard,
  StatusBadge,
} from "@/features/console/shared";
import { controlClass } from "@/features/console/shared-utils";
import {
  useSettlementCommissionStatementDetail,
  useSettlementCommissionStatementItems,
  useSettlementPaymentSummaryInfo,
  useSettlementStatementCommissions,
} from "@/features/settlement-center/hooks";
import { normalizeSettlementPaymentFileItem, normalizeSettlementPaymentFiles } from "@/lib/settlement-payment-files";
import type {
  AdminUploadedFile,
  SettlementCommissionStatementItemPageQuery,
  SettlementCommissionStatementItemRow,
  SettlementCommissionStatementRow,
  SettlementAttachment,
  SettlementPaymentFile,
  SettlementPaymentSummaryRow,
  SettlementStatementRow,
} from "@/types/affiliate-console";

export function textOrDash(value: unknown) {
  const text = String(value ?? "").trim();
  return text || "-";
}

export function metricText(metric?: { count?: number; amount?: string }) {
  return `${metric?.count ?? 0} / ${metric?.amount ?? "0.00"}`;
}

export function splitLinks(items?: SettlementPaymentFile[] | null) {
  return normalizeSettlementPaymentFiles(items)
    .map((item) => paymentFileHref(item))
    .filter(Boolean);
}

function cleanFileText(value: unknown) {
  return String(value ?? "").trim();
}

function firstNonEmptyText(...values: unknown[]) {
  for (const value of values) {
    const text = cleanFileText(value);
    if (text) {
      return text;
    }
  }
  return "";
}

function fileNameFromLocation(location: string) {
  const normalized = location.split("?")[0].split("#")[0];
  const segments = normalized.split("/").filter(Boolean);
  return segments.length > 0 ? decodeURIComponent(segments[segments.length - 1]) : "";
}

function paymentFileKey(file: SettlementPaymentFile) {
  return (
    firstNonEmptyText(file.id, file.url, file.path, file.name) ||
    JSON.stringify(file)
  );
}

function appendUniquePaymentFile(current: SettlementPaymentFile[], next: SettlementPaymentFile) {
  const nextKey = paymentFileKey(next);
  if (current.some((item) => paymentFileKey(item) === nextKey)) {
    return current;
  }
  return [...current, next];
}

function buildUploadedPaymentFile(
  file: File,
  uploaded: AdminUploadedFile | null,
  actor?: { role?: string; mail?: string; username?: string },
) {
  return normalizeSettlementPaymentFileItem({
    id: uploaded?.id,
    name: firstNonEmptyText(uploaded?.originalName, uploaded?.name, uploaded?.storedName, file.name),
    size: uploaded?.size ?? file.size,
    path: uploaded?.path,
    type: firstNonEmptyText(uploaded?.contentType, uploaded?.type, file.type),
    url: firstNonEmptyText(uploaded?.downloadUrl, uploaded?.url),
    role: actor?.role,
    mail: actor?.mail,
    username: actor?.username,
  });
}

function getSettlementFileActor(user?: {
  userInfo?: { email?: string; username?: string } | null;
  roleInfo?: Array<{ roleCode?: string; roleName?: string }> | null;
} | null) {
  return {
    role: firstNonEmptyText(user?.roleInfo?.[0]?.roleCode, user?.roleInfo?.[0]?.roleName),
    mail: cleanFileText(user?.userInfo?.email) || undefined,
    username: firstNonEmptyText(user?.userInfo?.username, user?.userInfo?.email),
  };
}

function paymentFileHref(file: SettlementPaymentFile) {
  return firstNonEmptyText(file.url, file.path);
}

function paymentFileLabel(file: SettlementPaymentFile, index: number) {
  return firstNonEmptyText(file.name, fileNameFromLocation(paymentFileHref(file)), `File ${index + 1}`);
}

function paymentFileMeta(file: SettlementPaymentFile) {
  const parts = [cleanFileText(file.username), cleanFileText(file.mail)].filter(Boolean);
  return parts.join(" / ");
}

function isValidDecimalInput(value?: string) {
  const text = cleanFileText(value);
  if (!text) {
    return true;
  }
  return /^-?\d+(\.\d+)?$/.test(text);
}

function toScaledDecimal(value: unknown) {
  const text = cleanFileText(value);
  if (!text || !/^-?\d+(\.\d+)?$/.test(text)) {
    return { amount: 0n, scale: 0 };
  }

  const negative = text.startsWith("-");
  const normalized = negative ? text.slice(1) : text;
  const [intPartRaw, fractionRaw = ""] = normalized.split(".");
  const intPart = intPartRaw || "0";
  const scale = fractionRaw.length;
  const digits = `${intPart}${fractionRaw}`.replace(/^0+(?=\d)/, "") || "0";
  const amount = BigInt(digits) * (negative ? -1n : 1n);

  return { amount, scale };
}

function formatScaledDecimal(amount: bigint, scale: number) {
  const negative = amount < 0n;
  const absolute = negative ? -amount : amount;
  const text = absolute.toString().padStart(scale + 1, "0");
  const intPart = scale > 0 ? text.slice(0, -scale) || "0" : text;
  const fractionPart = scale > 0 ? text.slice(-scale).replace(/0+$/, "") : "";
  const formatted = fractionPart ? `${intPart}.${fractionPart}` : intPart;
  if (formatted === "0") {
    return "0";
  }
  return negative ? `-${formatted}` : formatted;
}

function addDecimalStrings(left: unknown, right: unknown) {
  const a = toScaledDecimal(left);
  const b = toScaledDecimal(right);
  const scale = Math.max(a.scale, b.scale);
  const leftAmount = a.amount * 10n ** BigInt(scale - a.scale);
  const rightAmount = b.amount * 10n ** BigInt(scale - b.scale);
  return formatScaledDecimal(leftAmount + rightAmount, scale);
}

function sumDecimalStrings(values: unknown[]) {
  return values.reduce((total, value) => addDecimalStrings(total, value), "0");
}

const commissionStatementItemPageSizeOptions = [20, 50, 100, 200];
const commissionStatementItemSortByOptions = [
  "countDate",
  "commission",
  "awardUsd",
  "openValueUsd",
  "orderId",
  "statementId",
];
const commissionStatementItemSortOrderOptions = ["desc", "asc"] as const;

const commissionStatementItemColumns: Array<{
  key: string;
  label: string;
  render: (row: SettlementCommissionStatementItemRow) => ReactNode;
}> = [
  { key: "id", label: "ID", render: (row) => textOrDash(row.id) },
  { key: "customerId", label: "Customer ID", render: (row) => textOrDash(row.customerId) },
  { key: "spAccount", label: "SP Account", render: (row) => textOrDash(row.spAccount) },
  { key: "orderNo", label: "Order No", render: (row) => textOrDash(row.orderNo) },
  { key: "orderId", label: "Order ID", render: (row) => textOrDash(row.orderId) },
  { key: "symbolCode", label: "Symbol", render: (row) => textOrDash(row.symbolCode) },
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
];

function commissionStatementPeriod(row?: SettlementCommissionStatementRow) {
  const period = row?.periodLabel?.trim();
  if (period) {
    return period;
  }

  const start = String(row?.periodStartDate ?? "").trim();
  const end = String(row?.periodEndDate ?? "").trim();
  return start || end ? `${start || "-"} - ${end || "-"}` : "-";
}

export function attachmentLabel(item: SettlementAttachment, index: number) {
  return item.code?.trim() || `Attachment ${index + 1}`;
}

export function PageShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6 p-6">
      <PageIntro title={title} description={description} actions={actions} />
      {children}
    </div>
  );
}

export function FilterActions({
  onSearch,
  onReset,
  loading,
}: {
  onSearch: () => void;
  onReset: () => void;
  loading?: boolean;
}) {
  return (
    <div className="flex items-end gap-2">
      <Button type="button" onClick={onSearch} disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Search
      </Button>
      <Button type="button" variant="outline" onClick={onReset}>
        Reset
      </Button>
    </div>
  );
}

export function PaginationBar({
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
  loading?: boolean;
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
        <Button type="button" variant="outline" onClick={onNext} disabled={loading || maxSeen >= total}>
          Next
        </Button>
      </div>
    </div>
  );
}

export function CommissionStatementDetailDialog({
  statementId,
  open,
  onOpenChange,
}: {
  statementId?: number | string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const statementIdText = String(statementId ?? "").trim();
  const [draftSearch, setDraftSearch] = useState("");
  const [itemQuery, setItemQuery] = useState<SettlementCommissionStatementItemPageQuery>({
    page: 1,
    pageSize: 20,
    sortBy: "countDate",
    sortOrder: "desc",
  });

  useEffect(() => {
    if (!open || !statementIdText) {
      return;
    }

    setDraftSearch("");
    setItemQuery({
      page: 1,
      pageSize: 20,
      sortBy: "countDate",
      sortOrder: "desc",
    });
  }, [open, statementIdText]);

  const detailQuery = useSettlementCommissionStatementDetail(
    statementIdText,
    open && statementIdText !== "",
  );
  const commissionItemsQuery = useSettlementCommissionStatementItems(
    {
      ...itemQuery,
      statementId: statementIdText,
      search: String(itemQuery.search ?? "").trim() || undefined,
    },
    open && statementIdText !== "",
  );
  const detail = detailQuery.data;
  const itemPage = itemQuery.page ?? 1;
  const itemPageSize = itemQuery.pageSize ?? 20;
  const commissionItems = commissionItemsQuery.data?.items ?? [];

  function applySearch() {
    setItemQuery((current) => ({
      ...current,
      page: 1,
      search: draftSearch.trim(),
    }));
  }

  function resetSearch() {
    setDraftSearch("");
    setItemQuery((current) => ({
      ...current,
      page: 1,
      search: "",
    }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Commission Statement Detail</DialogTitle>
          <DialogDescription>
            Statement header from the new detail API, plus paginated commission rows from the new item API.
          </DialogDescription>
        </DialogHeader>

        {detailQuery.isLoading ? (
          <div className="flex h-36 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading commission statement detail...
          </div>
        ) : detail ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Statement ID" value={textOrDash(detail.statementId)} />
              <StatCard label="Status" value={<StatusBadge status={detail.status} />} />
              <StatCard label="Payable Amount" value={textOrDash(detail.payableAmount)} />
              <StatCard label="Period" value={commissionStatementPeriod(detail)} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Affiliate Info</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>Affiliate ID: {textOrDash(detail.affiliateId)}</div>
                  <div>Affiliate Code: {textOrDash(detail.affiliateCode)}</div>
                  <div>Referral Code: {textOrDash(detail.referralCode)}</div>
                  <div>Name: {textOrDash(detail.affiliateName)}</div>
                  <div>Email: {textOrDash(detail.email)}</div>
                  <div>Owner: {textOrDash(detail.ownerName)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Statement Info</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>Settlement ID: {textOrDash(detail.settlementId)}</div>
                  <div>Origin Commission: {textOrDash(detail.originCommissionAmount)}</div>
                  <div>Award Deduction: {textOrDash(detail.awardDeductionAmount)}</div>
                  <div>Manual Adjustment: {textOrDash(detail.manualAdjustmentAmount)}</div>
                  <div>Application Time: {textOrDash(detail.applicationTime)}</div>
                  <div>Audit Time: {textOrDash(detail.auditTime)}</div>
                  <div>Settlement Time: {textOrDash(detail.settlementTime)}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Commission Details</CardTitle>
                <CardDescription>
                  Total rows: {commissionItemsQuery.data?.total ?? 0}. Summary follows the current statement and search filters.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                  {[
                    ["Total Commission", commissionItemsQuery.data?.summary?.totalCommission],
                    ["Origin Commission", commissionItemsQuery.data?.summary?.totalOriginCommission],
                    ["Award USD", commissionItemsQuery.data?.summary?.totalAwardUsd],
                    ["Origin Award USD", commissionItemsQuery.data?.summary?.totalOriginAwardUsd],
                    ["Total Volume", commissionItemsQuery.data?.summary?.totalVolume],
                    ["Open Value USD", commissionItemsQuery.data?.summary?.totalOpenValueUsd],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md border bg-background p-3">
                      <div className="text-xs text-muted-foreground">{label}</div>
                      <div className="mt-1 text-lg font-semibold">{value ?? "0.00"}</div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 rounded-lg border bg-muted/10 p-4 md:grid-cols-5">
                  <Field label="Search" className="md:col-span-2">
                    <Input
                      value={draftSearch}
                      onChange={(event) => setDraftSearch(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          applySearch();
                        }
                      }}
                      placeholder="Customer, account, order, symbol, currency, referral"
                    />
                  </Field>
                  <Field label="Page Size">
                    <select
                      className={controlClass}
                      value={String(itemPageSize)}
                      onChange={(event) =>
                        setItemQuery((current) => ({
                          ...current,
                          page: 1,
                          pageSize: Number(event.target.value),
                        }))
                      }
                    >
                      {commissionStatementItemPageSizeOptions.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Sort By">
                    <select
                      className={controlClass}
                      value={String(itemQuery.sortBy ?? "countDate")}
                      onChange={(event) =>
                        setItemQuery((current) => ({
                          ...current,
                          page: 1,
                          sortBy: event.target.value,
                        }))
                      }
                    >
                      {commissionStatementItemSortByOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Sort Order">
                    <select
                      className={controlClass}
                      value={String(itemQuery.sortOrder ?? "desc")}
                      onChange={(event) =>
                        setItemQuery((current) => ({
                          ...current,
                          page: 1,
                          sortOrder: event.target.value,
                        }))
                      }
                    >
                      {commissionStatementItemSortOrderOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div className="flex items-end gap-2 md:col-span-5">
                    <Button type="button" onClick={applySearch} disabled={commissionItemsQuery.isFetching}>
                      {commissionItemsQuery.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Search
                    </Button>
                    <Button type="button" variant="outline" onClick={resetSearch}>
                      Reset
                    </Button>
                  </div>
                </div>

                {commissionItemsQuery.isLoading ? (
                  <div className="flex h-36 items-center justify-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading commission details...
                  </div>
                ) : commissionItems.length === 0 ? (
                  <EmptyState title="No commission details" description="This statement has no matching commission rows." />
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-xl border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {commissionStatementItemColumns.map((column) => (
                              <TableHead key={column.key} className="whitespace-nowrap">
                                {column.label}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {commissionItems.map((row, index) => (
                            <TableRow key={`${row.id ?? "commission"}-${row.orderId ?? "order"}-${index}`}>
                              {commissionStatementItemColumns.map((column) => (
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
                      page={itemPage}
                      pageSize={itemPageSize}
                      total={commissionItemsQuery.data?.total ?? 0}
                      loading={commissionItemsQuery.isFetching}
                      onPrev={() =>
                        setItemQuery((current) => ({
                          ...current,
                          page: Math.max(1, itemPage - 1),
                        }))
                      }
                      onNext={() =>
                        setItemQuery((current) => ({
                          ...current,
                          page: itemPage + 1,
                        }))
                      }
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <EmptyState title="Statement not found" description="The requested commission statement detail is unavailable." />
        )}
      </DialogContent>
    </Dialog>
  );
}

export function StatementDetailDialog({
  row,
  open,
  onOpenChange,
}: {
  row: SettlementStatementRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const commissionsQuery = useSettlementStatementCommissions(row?.id, 1, 50, open && Boolean(row?.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Statement Detail</DialogTitle>
          <DialogDescription>
            Statement detail, linked commission drilldown, attachments, note, and receiver account.
          </DialogDescription>
        </DialogHeader>

        {row ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Affiliate Code" value={textOrDash(row.affiliateId)} />
              <StatCard label="Status" value={<StatusBadge status={row.status} />} />
              <StatCard label="Payable Amount" value={textOrDash(row.paidAmount)} />
              <StatCard label="Period" value={textOrDash(row.datePeriod)} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Statement Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>Name: {textOrDash(row.name)}</div>
                  <div>Email: {textOrDash(row.email)}</div>
                  <div>Medium: {textOrDash(row.medium)}</div>
                  <div>Owner: {textOrDash(row.owner)}</div>
                  <div>Application Date: {textOrDash(row.applicationDate)}</div>
                  <div>Payout Date: {textOrDash(row.payoutDate)}</div>
                  <div>Receiver Account: {textOrDash(row.receiverAccount)}</div>
                  <div>Payment Method: {textOrDash(row.paymentMethods)}</div>
                  <div>Payment Summary ID: {textOrDash(row.paymentSummaryId)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Amounts & Note</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>Origin Amount: {textOrDash(row.originAmount)}</div>
                  <div>Award Amount: {textOrDash(row.awardAmount)}</div>
                  <div>Adjustments: {textOrDash(row.adjustmentsAmount)}</div>
                  <div>Note: {textOrDash(row.note)}</div>
                  <div className="space-y-2 pt-2">
                    <div className="font-medium">Attachments</div>
                    {(row.receipts ?? []).length === 0 ? (
                      <div className="text-muted-foreground">No statement attachments.</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(row.receipts ?? []).map((item, index) => (
                          <Button
                            key={`${item.code ?? "receipt"}-${index}`}
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(String(item.path ?? "").trim(), "_blank", "noopener,noreferrer")}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            {attachmentLabel(item, index)}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Commission Drilldown</CardTitle>
              </CardHeader>
              <CardContent>
                {commissionsQuery.isLoading ? (
                  <div className="flex h-36 items-center justify-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading commission rows...
                  </div>
                ) : (commissionsQuery.data?.paymentCommissions ?? []).length === 0 ? (
                  <EmptyState title="No commission rows" description="This statement has no linked commission rows." />
                ) : (
                  <div className="overflow-x-auto rounded-xl border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Trader</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Instrument</TableHead>
                          <TableHead>Spread</TableHead>
                          <TableHead>Tier</TableHead>
                          <TableHead>Commission</TableHead>
                          <TableHead>Award USD</TableHead>
                          <TableHead>Origin Commission</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(commissionsQuery.data?.paymentCommissions ?? []).map((item, index) => (
                          <TableRow key={`${item.traderLiveAccount ?? "commission"}-${index}`}>
                            <TableCell>{textOrDash(item.traderLiveAccount)}</TableCell>
                            <TableCell>{textOrDash(item.date)}</TableCell>
                            <TableCell>{textOrDash(item.instrument)}</TableCell>
                            <TableCell>{textOrDash(item.spread)}</TableCell>
                            <TableCell>{textOrDash(item.tier)}</TableCell>
                            <TableCell>{textOrDash(item.commission)}</TableCell>
                            <TableCell>{textOrDash(item.awardUsd)}</TableCell>
                            <TableCell>{textOrDash(item.originCommission)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function PaymentSummaryDetailDialog({
  summaryId,
  open,
  onOpenChange,
}: {
  summaryId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const detailQuery = useSettlementPaymentSummaryInfo(summaryId, open && Boolean(summaryId));
  const row = detailQuery.data;
  const paymentFiles = normalizeSettlementPaymentFiles(row?.paymentFile);
  const linkedStatements = row?.paymentHistoryList ?? [];

  const summaryInfoItems = row
    ? [
        { label: "Affiliate ID", value: textOrDash(row.affiliateId) },
        { label: "Name", value: textOrDash(row.name) },
        { label: "Email", value: textOrDash(row.email) },
        { label: "Owner", value: textOrDash(row.owner) },
        { label: "Country", value: textOrDash(row.country) },
        { label: "Referral Code", value: textOrDash(row.referralCode || row.medium) },
        { label: "Medium (Legacy)", value: textOrDash(row.medium) },
        { label: "Application Date", value: textOrDash(row.applicationDate) },
        { label: "Payout Date", value: textOrDash(row.payoutDate) },
      ]
    : [];

  const overviewItems = row
    ? [
        { label: "Origin Amount", value: textOrDash(row.originAmount) },
        { label: "Adjustments", value: textOrDash(row.adjustmentsAmount) },
        { label: "Payment Method", value: textOrDash(row.paymentMethods) },
        { label: "Linked Statements", value: String(linkedStatements.length) },
      ]
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-6xl gap-0 overflow-hidden p-0 sm:rounded-3xl">
        <DialogHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-100 px-5 py-5 pr-14 sm:px-6">
          <DialogTitle className="text-xl text-slate-950 sm:text-2xl">Payment Summary Detail</DialogTitle>
          <DialogDescription className="max-w-3xl leading-6 text-slate-500">
            Summary overview, payout information, supporting files, and linked statements.
          </DialogDescription>
        </DialogHeader>

        {detailQuery.isLoading ? (
          <div className="flex h-40 items-center justify-center bg-slate-50 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-slate-500" />
            Loading summary detail...
          </div>
        ) : row ? (
          <div className="max-h-[calc(92vh-92px)] overflow-y-auto bg-slate-50/80">
            <div className="space-y-6 p-4 sm:p-6">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Card className="rounded-2xl border-slate-200/80 shadow-sm">
                  <CardHeader className="space-y-3 pb-4">
                    <CardDescription className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Summary ID
                    </CardDescription>
                    <CardTitle className="text-3xl font-semibold tracking-tight text-slate-950">
                      {textOrDash(row.id)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card className="rounded-2xl border-slate-200/80 shadow-sm">
                  <CardHeader className="space-y-3 pb-4">
                    <CardDescription className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Status
                    </CardDescription>
                    <div>
                      <StatusBadge status={row.status} className="px-3 py-1 text-sm" />
                    </div>
                  </CardHeader>
                </Card>
                <Card className="rounded-2xl border-slate-200/80 shadow-sm">
                  <CardHeader className="space-y-3 pb-4">
                    <CardDescription className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Payable Amount
                    </CardDescription>
                    <CardTitle className="text-3xl font-semibold tracking-tight text-slate-950">
                      {textOrDash(row.payableAmount)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card className="rounded-2xl border-slate-200/80 shadow-sm">
                  <CardHeader className="space-y-3 pb-4">
                    <CardDescription className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Affiliate Code
                    </CardDescription>
                    <CardTitle className="break-all text-3xl font-semibold tracking-tight text-slate-950">
                      {textOrDash(row.affiliateCode)}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <Card className="rounded-2xl border-slate-200/80 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg text-slate-950">Summary Info</CardTitle>
                    <CardDescription>
                      Core affiliate and payout context for this payment summary.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {summaryInfoItems.map((item) => (
                        <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            {item.label}
                          </div>
                          <div className="mt-2 break-all text-sm font-medium leading-6 text-slate-900">
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card className="rounded-2xl border-slate-200/80 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg text-slate-950">Payment Overview</CardTitle>
                      <CardDescription>
                        Financial breakdown, settlement method, and payout note.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {overviewItems.map((item) => (
                          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                              {item.label}
                            </div>
                            <div className="mt-2 break-all text-base font-semibold text-slate-950">
                              {item.value}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Note</div>
                        <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                          {textOrDash(row.note)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-slate-200/80 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg text-slate-950">Payment Files</CardTitle>
                      <CardDescription>
                        {paymentFiles.length > 0
                          ? `${paymentFiles.length} supporting file${paymentFiles.length > 1 ? "s" : ""} attached to this summary.`
                          : "No supporting files have been attached to this summary."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {paymentFiles.length === 0 ? (
                        <EmptyState title="No payment files" description="Upload proof or transfer files to complete the payout record." />
                      ) : (
                        <div className="space-y-3">
                          {paymentFiles.map((item, index) => {
                            const href = paymentFileHref(item);
                            const meta = paymentFileMeta(item);
                            return (
                              <div
                                key={`${paymentFileKey(item)}-${index}`}
                                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-start sm:justify-between"
                              >
                                <div className="flex min-w-0 items-start gap-3">
                                  <div className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500">
                                    <FileText className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="break-all text-sm font-medium leading-6 text-slate-900">
                                      {paymentFileLabel(item, index)}
                                    </div>
                                    <div className="mt-1 break-all text-xs leading-5 text-slate-500">
                                      {meta || textOrDash(href)}
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="w-full shrink-0 sm:w-auto"
                                  onClick={() => href && window.open(href, "_blank", "noopener,noreferrer")}
                                  disabled={!href}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Card className="rounded-2xl border-slate-200/80 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-slate-950">Linked Statements</CardTitle>
                  <CardDescription>
                    {linkedStatements.length > 0
                      ? `${linkedStatements.length} statement${linkedStatements.length > 1 ? "s" : ""} included in this payment summary.`
                      : "This payment summary does not currently include linked statement rows."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {linkedStatements.length === 0 ? (
                    <EmptyState title="No linked statements" description="This payment summary has no linked payment_history rows." />
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/90">
                            <TableHead>Period</TableHead>
                            <TableHead>Origin Amount</TableHead>
                            <TableHead>Award Amount</TableHead>
                            <TableHead>Payable Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {linkedStatements.map((item, index) => (
                            <TableRow key={`${item.datePeriod ?? "statement"}-${index}`}>
                              <TableCell className="font-medium text-slate-900">{textOrDash(item.datePeriod)}</TableCell>
                              <TableCell>{textOrDash(item.originAmount)}</TableCell>
                              <TableCell>{textOrDash(item.awardAmount)}</TableCell>
                              <TableCell>{textOrDash(item.paidAmount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <EmptyState title="Summary not found" description="The requested summary detail is unavailable." />
        )}
      </DialogContent>
    </Dialog>
  );
}

export function CreatePaymentSummaryDialog({
  rows,
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  rows: SettlementStatementRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    paymentIds: number[];
    adjustmentsAmount: string;
    note: string;
    paymentMethods: string;
    paymentFile: SettlementPaymentFile[];
  }) => Promise<void>;
  submitting: boolean;
}) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [adjustmentsAmount, setAdjustmentsAmount] = useState("0");
  const [paymentMethods, setPaymentMethods] = useState("");
  const [note, setNote] = useState("");
  const [paymentFiles, setPaymentFiles] = useState<SettlementPaymentFile[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setAdjustmentsAmount("0");
    setPaymentMethods("");
    setNote("");
    setPaymentFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [open]);

  const selectedRows = rows.filter((row) => Number(row.id ?? 0) > 0);
  const paymentIds = selectedRows.map((row) => Number(row.id ?? 0)).filter((id) => id > 0);
  const affiliateKeys = Array.from(
    new Set(selectedRows.map((row) => cleanFileText(row.affiliateId)).filter(Boolean)),
  );
  const invalidAdjustment = !isValidDecimalInput(adjustmentsAmount);
  const originTotal = sumDecimalStrings(
    selectedRows.map((row) => row.originAmount ?? row.paidAmount ?? "0"),
  );
  const currentPayableTotal = sumDecimalStrings(
    selectedRows.map((row) => row.paidAmount ?? row.originAmount ?? "0"),
  );
  const existingAdjustmentTotal = sumDecimalStrings(
    selectedRows.map((row) => row.adjustmentsAmount ?? "0"),
  );
  const previewPayableAmount = addDecimalStrings(
    originTotal,
    cleanFileText(adjustmentsAmount) || "0",
  );

  async function handleUpload(file: File | null) {
    if (!file) {
      return;
    }

    setUploading(true);
    try {
      const result = await affiliateConsoleApi.uploadAdminFile(file);
      const uploaded = result.value as AdminUploadedFile | null;
      const nextFile = buildUploadedPaymentFile(file, uploaded, getSettlementFileActor(user));
      if (!nextFile) {
        toast.error("Upload succeeded but no file metadata was returned.");
        return;
      }
      setPaymentFiles((current) => appendUniquePaymentFile(current, nextFile));
      toast.success("Payment file uploaded.");
    } catch {
      // Error toast is handled by the shared request layer.
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleCreate() {
    if (paymentIds.length === 0) {
      toast.error("Select at least one pending statement.");
      return;
    }

    if (affiliateKeys.length > 1) {
      toast.error("Selected statements must belong to the same affiliate.");
      return;
    }

    if (invalidAdjustment) {
      toast.error("Manual adjustment must be a valid decimal number.");
      return;
    }

    await onSubmit({
      paymentIds,
      adjustmentsAmount: cleanFileText(adjustmentsAmount) || "0",
      note,
      paymentMethods,
      paymentFile: paymentFiles,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Payment Summary</DialogTitle>
          <DialogDescription>
            Review the selected pending statements, add payment metadata, and create one payment summary.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Selected Statement Summary</CardTitle>
              <CardDescription>
                {selectedRows.length} statement(s) selected. The preview payable amount follows the new summary rule: origin total + manual adjustment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <StatCard label="Selected Statements" value={selectedRows.length} />
                <StatCard label="Affiliate" value={affiliateKeys.length === 1 ? affiliateKeys[0] : affiliateKeys.length || "-"} />
                <StatCard label="Origin Total" value={originTotal} />
                <StatCard label="Current Payable Total" value={currentPayableTotal} />
                <StatCard label="Preview Payable" value={previewPayableAmount} />
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-lg border bg-muted/10 p-4">
                  <div className="text-xs text-muted-foreground">Existing Statement Adjustments</div>
                  <div className="mt-1 text-lg font-semibold">{existingAdjustmentTotal}</div>
                </div>
                <div className="rounded-lg border bg-muted/10 p-4">
                  <div className="text-xs text-muted-foreground">Manual Summary Adjustment</div>
                  <div className="mt-1 text-lg font-semibold">{cleanFileText(adjustmentsAmount) || "0"}</div>
                </div>
                <div className="rounded-lg border bg-muted/10 p-4">
                  <div className="text-xs text-muted-foreground">Payment IDs</div>
                  <div className="mt-1 text-lg font-semibold">{paymentIds.join(", ") || "-"}</div>
                </div>
              </div>

              {affiliateKeys.length > 1 ? (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  Selected statements belong to multiple affiliates. The backend will reject this request, so adjust the selection before creating the summary.
                </div>
              ) : null}

              {selectedRows.length === 0 ? (
                <EmptyState title="No statements selected" description="Close this dialog, select pending statements, and try again." />
              ) : (
                <div className="overflow-x-auto rounded-xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment ID</TableHead>
                        <TableHead>Affiliate Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Origin Amount</TableHead>
                        <TableHead>Current Payable</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRows.map((row) => (
                        <TableRow key={Number(row.id ?? 0)}>
                          <TableCell>{textOrDash(row.id)}</TableCell>
                          <TableCell>{textOrDash(row.affiliateId)}</TableCell>
                          <TableCell>{textOrDash(row.name)}</TableCell>
                          <TableCell>{textOrDash(row.owner)}</TableCell>
                          <TableCell>{textOrDash(row.datePeriod)}</TableCell>
                          <TableCell>{textOrDash(row.originAmount)}</TableCell>
                          <TableCell>{textOrDash(row.paidAmount)}</TableCell>
                          <TableCell><StatusBadge status={row.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Info</CardTitle>
              <CardDescription>
                Payment method, note, manual adjustment, and file metadata are stored on the new payment summary.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Payment Method">
                  <Input
                    value={paymentMethods}
                    onChange={(event) => setPaymentMethods(event.target.value)}
                    placeholder="BANK_TRANSFER"
                  />
                </Field>
                <Field label="Manual Adjustment">
                  <Input
                    value={adjustmentsAmount}
                    onChange={(event) => setAdjustmentsAmount(event.target.value)}
                    placeholder="0"
                  />
                </Field>
              </div>

              <Field
                label="Note"
                hint="Optional note persisted to payment_summary.note."
              >
                <Textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="min-h-[120px]"
                  placeholder="manual settlement for May first half"
                />
              </Field>

              <Field label="Payment Files" hint="Uploaded files are stored as metadata objects on payment_summary.payment_file.">
                <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(event) => void handleUpload(event.target.files?.[0] ?? null)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    Upload File
                  </Button>

                  {paymentFiles.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No files uploaded.</div>
                  ) : (
                    <div className="space-y-2">
                      {paymentFiles.map((item, index) => {
                        const href = paymentFileHref(item);
                        const meta = paymentFileMeta(item);
                        return (
                          <div key={`${paymentFileKey(item)}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background p-3">
                            <div className="min-w-0">
                              <div className="truncate font-medium">{paymentFileLabel(item, index)}</div>
                              <div className="truncate text-xs text-muted-foreground">
                                {meta || textOrDash(href)}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => href && window.open(href, "_blank", "noopener,noreferrer")}
                                disabled={!href}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setPaymentFiles((current) =>
                                    current.filter((_, currentIndex) => currentIndex !== index),
                                  )
                                }
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Field>

              {invalidAdjustment ? (
                <div className="text-sm text-destructive">
                  Manual adjustment must use a valid decimal string, for example <code>0</code>, <code>-20.50</code>, or <code>320.2321</code>.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleCreate()}
            disabled={submitting || uploading || selectedRows.length === 0 || affiliateKeys.length > 1 || invalidAdjustment}
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create Bill
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditPaymentSummaryDialog({
  row,
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  row: SettlementPaymentSummaryRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    adjustmentsAmount: string;
    payoutDate: string;
    paymentMethods: string;
    note: string;
    paymentFile: SettlementPaymentFile[];
  }) => Promise<void>;
  submitting: boolean;
}) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [adjustmentsAmount, setAdjustmentsAmount] = useState("0");
  const [payoutDate, setPayoutDate] = useState("");
  const [paymentMethods, setPaymentMethods] = useState("");
  const [note, setNote] = useState("");
  const [paymentFiles, setPaymentFiles] = useState<SettlementPaymentFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const rowId = row?.id;
  const invalidAdjustment = !isValidDecimalInput(adjustmentsAmount);
  const previewPayableAmount = addDecimalStrings(
    row?.originAmount ?? "0",
    cleanFileText(adjustmentsAmount) || "0",
  );

  useEffect(() => {
    if (!open || !row) {
      return;
    }

    setAdjustmentsAmount(cleanFileText(row.adjustmentsAmount) || "0");
    setPayoutDate(row.payoutDate ?? "");
    setPaymentMethods(row.paymentMethods ?? "");
    setNote(row.note ?? "");
    setPaymentFiles(normalizeSettlementPaymentFiles(row.paymentFile));
  }, [open, row, rowId]);

  async function handleUpload(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) {
      return;
    }

    setUploading(true);
    let uploadedCount = 0;
    try {
      for (const file of files) {
        try {
          const result = await affiliateConsoleApi.uploadAdminFile(file);
          const uploaded = result.value as AdminUploadedFile | null;
          const nextFile = buildUploadedPaymentFile(file, uploaded, getSettlementFileActor(user));
          if (!nextFile) {
            toast.error("Upload succeeded but no file metadata was returned.");
            continue;
          }
          setPaymentFiles((current) => appendUniquePaymentFile(current, nextFile));
          uploadedCount += 1;
        } catch {
          // Error toast is handled by the shared request layer.
        }
      }

      if (uploadedCount > 0) {
        toast.success(
          uploadedCount === 1
            ? "Payment file uploaded."
            : `${uploadedCount} payment files uploaded.`,
        );
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl gap-0 overflow-hidden p-0 sm:rounded-3xl">
        <DialogHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-100 px-5 py-5 pr-14 sm:px-6">
          <DialogTitle className="text-xl text-slate-950 sm:text-2xl">Edit Payment Summary</DialogTitle>
          <DialogDescription className="max-w-3xl leading-6 text-slate-500">
            Update payment summary metadata before or during the withdrawal review flow.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(92vh-154px)] overflow-y-auto bg-slate-50/80">
          <div className="space-y-6 p-4 sm:p-6">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Card className="rounded-2xl border-slate-200/80 shadow-sm">
                <CardHeader className="space-y-3 pb-4">
                  <CardDescription className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Summary ID
                  </CardDescription>
                  <CardTitle className="text-3xl font-semibold tracking-tight text-slate-950">
                    {textOrDash(row?.id)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="rounded-2xl border-slate-200/80 shadow-sm">
                <CardHeader className="space-y-3 pb-4">
                  <CardDescription className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Status
                  </CardDescription>
                  <div>
                    <StatusBadge status={row?.status} className="px-3 py-1 text-sm" />
                  </div>
                </CardHeader>
              </Card>
              <Card className="rounded-2xl border-slate-200/80 shadow-sm">
                <CardHeader className="space-y-3 pb-4">
                  <CardDescription className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Origin Amount
                  </CardDescription>
                  <CardTitle className="text-3xl font-semibold tracking-tight text-slate-950">
                    {textOrDash(row?.originAmount)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="rounded-2xl border-slate-200/80 shadow-sm">
                <CardHeader className="space-y-3 pb-4">
                  <CardDescription className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Preview Payable
                  </CardDescription>
                  <CardTitle className="text-3xl font-semibold tracking-tight text-slate-950">
                    {previewPayableAmount}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <Card className="rounded-2xl border-slate-200/80 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-slate-950">Editable Fields</CardTitle>
                  <CardDescription>
                    Adjust payout metadata, review note, and manual adjustment on this summary.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field label="Manual Adjustment">
                    <Input
                      value={adjustmentsAmount}
                      onChange={(event) => setAdjustmentsAmount(event.target.value)}
                      placeholder="0"
                      className="bg-white"
                    />
                  </Field>
                  <Field label="Payout Date">
                    <Input
                      type="date"
                      value={payoutDate}
                      onChange={(event) => setPayoutDate(event.target.value)}
                      className="bg-white"
                    />
                  </Field>
                  <Field label="Payment Methods">
                    <Input
                      value={paymentMethods}
                      onChange={(event) => setPaymentMethods(event.target.value)}
                      placeholder="BANK_TRANSFER / USDT / ALIPAY"
                      className="bg-white"
                    />
                  </Field>
                  <Field label="Note" hint="Saved to payment_summary.note.">
                    <Textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      className="min-h-[180px] bg-white"
                      placeholder="Add review context, payout instructions, or decline follow-up note."
                    />
                  </Field>
                  {invalidAdjustment ? (
                    <div className="text-sm text-destructive">
                      Manual adjustment must use a valid decimal string, for example <code>0</code>, <code>-20.50</code>, or <code>320.2321</code>.
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200/80 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-slate-950">Payment Files</CardTitle>
                  <CardDescription>
                    Replace or add supporting files that should travel with this summary through review and payout.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-sm font-medium text-slate-900">Supporting attachments</div>
                        <div className="mt-1 text-sm leading-6 text-slate-500">
                          Upload proof, remittance files, or revised settlement support documents.
                        </div>
                      </div>
                      <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700">
                        {paymentFiles.length} file{paymentFiles.length === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(event) => void handleUpload(event.target.files)}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {uploading ? "Uploading..." : "Upload Files"}
                  </Button>

                  {paymentFiles.length === 0 ? (
                    <EmptyState
                      title="No payment files"
                      description="Upload transfer proof, settlement support, or revised review attachments."
                    />
                  ) : (
                    <div className="space-y-3">
                      {paymentFiles.map((item, index) => {
                        const href = paymentFileHref(item);
                        const meta = paymentFileMeta(item);
                        return (
                          <div
                            key={`${paymentFileKey(item)}-${index}`}
                            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-start sm:justify-between"
                          >
                            <div className="flex min-w-0 items-start gap-3">
                              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-500">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="break-all text-sm font-medium leading-6 text-slate-900">
                                  {paymentFileLabel(item, index)}
                                </div>
                                <div className="mt-1 break-all text-xs leading-5 text-slate-500">
                                  {meta || textOrDash(href)}
                                </div>
                              </div>
                            </div>
                            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="flex-1 sm:flex-none"
                                onClick={() => href && window.open(href, "_blank", "noopener,noreferrer")}
                                disabled={!href}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="flex-1 sm:flex-none"
                                onClick={() =>
                                  setPaymentFiles((current) =>
                                    current.filter((_, currentIndex) => currentIndex !== index),
                                  )
                                }
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={submitting || uploading || invalidAdjustment}
            onClick={() =>
              void onSubmit({
                adjustmentsAmount: cleanFileText(adjustmentsAmount) || "0",
                payoutDate,
                paymentMethods,
                note,
                paymentFile: paymentFiles,
              })
            }
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PaymentExecutionDialog({
  row,
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  row: SettlementPaymentSummaryRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    payoutDate: string;
    paymentMethods: string;
    note: string;
    paymentFile: SettlementPaymentFile[];
  }) => Promise<void>;
  submitting: boolean;
}) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [payoutDate, setPayoutDate] = useState("");
  const [paymentMethods, setPaymentMethods] = useState("");
  const [note, setNote] = useState("");
  const [paymentFiles, setPaymentFiles] = useState<SettlementPaymentFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const rowId = row?.id;

  useEffect(() => {
    if (!open || !row) {
      return;
    }
    setPayoutDate(row.payoutDate ?? "");
    setPaymentMethods(row.paymentMethods ?? "");
    setNote(row.note ?? "");
    setPaymentFiles(normalizeSettlementPaymentFiles(row.paymentFile));
  }, [open, row, rowId]);

  async function handleUpload(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) {
      return;
    }

    setUploading(true);
    let uploadedCount = 0;
    try {
      for (const file of files) {
        try {
          const result = await affiliateConsoleApi.uploadAdminFile(file);
          const uploaded = result.value as AdminUploadedFile | null;
          const nextFile = buildUploadedPaymentFile(file, uploaded, getSettlementFileActor(user));
          if (!nextFile) {
            toast.error("Upload succeeded but no file metadata was returned.");
            continue;
          }
          setPaymentFiles((current) => appendUniquePaymentFile(current, nextFile));
          uploadedCount += 1;
        } catch {
          // Error toast is handled by the shared request layer.
        }
      }

      if (uploadedCount > 0) {
        toast.success(
          uploadedCount === 1
            ? "Payment file uploaded."
            : `${uploadedCount} payment files uploaded.`,
        );
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl gap-0 overflow-hidden p-0 sm:rounded-3xl">
        <DialogHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-100 px-5 py-5 pr-14 sm:px-6">
          <DialogTitle className="text-xl text-slate-950 sm:text-2xl">Execute Payment</DialogTitle>
          <DialogDescription className="max-w-3xl leading-6 text-slate-500">
            Confirm payout details, keep existing attachments, and add more files before marking this summary as paid.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(92vh-154px)] overflow-y-auto bg-slate-50/80">
          <div className="space-y-6 p-4 sm:p-6">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Card className="rounded-2xl border-slate-200/80 shadow-sm">
                <CardHeader className="space-y-3 pb-4">
                  <CardDescription className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Summary ID
                  </CardDescription>
                  <CardTitle className="text-3xl font-semibold tracking-tight text-slate-950">
                    {textOrDash(row?.id)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="rounded-2xl border-slate-200/80 shadow-sm">
                <CardHeader className="space-y-3 pb-4">
                  <CardDescription className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Status
                  </CardDescription>
                  <div>
                    <StatusBadge status={row?.status} className="px-3 py-1 text-sm" />
                  </div>
                </CardHeader>
              </Card>
              <Card className="rounded-2xl border-slate-200/80 shadow-sm">
                <CardHeader className="space-y-3 pb-4">
                  <CardDescription className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Payable Amount
                  </CardDescription>
                  <CardTitle className="text-3xl font-semibold tracking-tight text-slate-950">
                    {textOrDash(row?.payableAmount)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="rounded-2xl border-slate-200/80 shadow-sm">
                <CardHeader className="space-y-3 pb-4">
                  <CardDescription className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Affiliate Code
                  </CardDescription>
                  <CardTitle className="break-all text-3xl font-semibold tracking-tight text-slate-950">
                    {textOrDash(row?.affiliateCode)}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <Card className="rounded-2xl border-slate-200/80 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-slate-950">Payout Details</CardTitle>
                  <CardDescription>
                    Required settlement data used when this payment summary moves from approved to paid.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field label="Payout Date">
                    <Input
                      type="date"
                      value={payoutDate}
                      onChange={(event) => setPayoutDate(event.target.value)}
                      className="bg-white"
                    />
                  </Field>
                  <Field label="Payment Methods">
                    <Input
                      value={paymentMethods}
                      onChange={(event) => setPaymentMethods(event.target.value)}
                      placeholder="BANK_TRANSFER / USDT / ALIPAY"
                      className="bg-white"
                    />
                  </Field>
                  <Field label="Payment Note" hint="Optional payout remark stored with the execution record.">
                    <Textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      className="min-h-[180px] bg-white"
                      placeholder="Add transfer batch number, operator note, or settlement context."
                    />
                  </Field>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200/80 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-slate-950">Payment Files</CardTitle>
                  <CardDescription>
                    Existing files stay in the list. You can continue uploading more files and submit them together.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-sm font-medium text-slate-900">Supporting attachments</div>
                        <div className="mt-1 text-sm leading-6 text-slate-500">
                          Uploaded files are appended to the current list. Existing attachments do not block new uploads.
                        </div>
                      </div>
                      <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700">
                        {paymentFiles.length} file{paymentFiles.length === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(event) => void handleUpload(event.target.files)}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {uploading ? "Uploading..." : "Upload More Files"}
                  </Button>

                  {paymentFiles.length === 0 ? (
                    <EmptyState
                      title="No payment files"
                      description="Upload transfer proof, remittance screenshot, or settlement attachment before final confirmation."
                    />
                  ) : (
                    <div className="space-y-3">
                      {paymentFiles.map((item, index) => {
                        const href = paymentFileHref(item);
                        const meta = paymentFileMeta(item);
                        return (
                          <div
                            key={`${paymentFileKey(item)}-${index}`}
                            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-start sm:justify-between"
                          >
                            <div className="flex min-w-0 items-start gap-3">
                              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-500">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="break-all text-sm font-medium leading-6 text-slate-900">
                                  {paymentFileLabel(item, index)}
                                </div>
                                <div className="mt-1 break-all text-xs leading-5 text-slate-500">
                                  {meta || textOrDash(href)}
                                </div>
                              </div>
                            </div>
                            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="flex-1 sm:flex-none"
                                onClick={() => href && window.open(href, "_blank", "noopener,noreferrer")}
                                disabled={!href}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="flex-1 sm:flex-none"
                                onClick={() =>
                                  setPaymentFiles((current) =>
                                    current.filter((_, currentIndex) => currentIndex !== index),
                                  )
                                }
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={submitting || uploading || !payoutDate.trim() || !paymentMethods.trim()}
            onClick={() => void onSubmit({ payoutDate, paymentMethods, note, paymentFile: paymentFiles })}
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Mark As Paid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
