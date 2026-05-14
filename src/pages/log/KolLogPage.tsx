import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ChevronDown, Loader2, RefreshCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState, Field, PageIntro } from "@/features/console/shared";
import { kolLogQueryKeys, useKolChangeLogDetail, useKolChangeLogs } from "@/features/kol-log/hooks";
import { cn } from "@/lib/utils";
import type { KolChangeLogDetail, KolChangeLogListQuery } from "@/types/kol-log";

type FilterFormState = {
  affiliateId: string;
  affiliateCode: string;
  affiliateName: string;
  email: string;
  bizType: string;
  bizSubType: string;
  eventType: string;
  changeKey: string;
  operatorId: string;
  operatorName: string;
  operatorType: string;
  source: string;
  relatedTable: string;
  relatedId: string;
  requestId: string;
  fromStatus: string;
  toStatus: string;
  attemptNo: string;
  createTimeFrom: string;
  createTimeTo: string;
  trafficApprovedBy: string;
};

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [20, 50, 100];

const defaultFilterForm: FilterFormState = {
  affiliateId: "",
  affiliateCode: "",
  affiliateName: "",
  email: "",
  bizType: "",
  bizSubType: "",
  eventType: "",
  changeKey: "",
  operatorId: "",
  operatorName: "",
  operatorType: "",
  source: "",
  relatedTable: "",
  relatedId: "",
  requestId: "",
  fromStatus: "",
  toStatus: "",
  attemptNo: "",
  createTimeFrom: "",
  createTimeTo: "",
  trafficApprovedBy: "",
};

const defaultQuery: KolChangeLogListQuery = {
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

function textOrDash(value: unknown) {
  if (value === undefined || value === null) {
    return "-";
  }
  const text = String(value).trim();
  return text ? text : "-";
}

function normalizeText(value?: string) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function normalizePageSize(value?: number) {
  const numeric = Number(value ?? DEFAULT_PAGE_SIZE);
  if (!Number.isFinite(numeric)) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.max(1, Math.min(100, Math.floor(numeric)));
}

function formatLocalDateTime(value?: string) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return "-";
  }

  const date = new Date(raw.includes("T") ? raw : raw.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}

function formatStructuredValue(value: unknown) {
  if (value === undefined || value === null) {
    return "-";
  }

  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) {
      return "-";
    }

    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return value;
    }
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function toCellText(value: unknown) {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function buildQueryFromForm(form: FilterFormState, currentPageSize: number): KolChangeLogListQuery {
  return {
    page: 1,
    pageSize: normalizePageSize(currentPageSize),
    affiliateId: normalizeText(form.affiliateId),
    affiliateCode: normalizeText(form.affiliateCode),
    affiliateName: normalizeText(form.affiliateName),
    email: normalizeText(form.email),
    bizType: normalizeText(form.bizType),
    bizSubType: normalizeText(form.bizSubType),
    eventType: normalizeText(form.eventType),
    changeKey: normalizeText(form.changeKey),
    operatorId: normalizeText(form.operatorId),
    operatorName: normalizeText(form.operatorName),
    operatorType: normalizeText(form.operatorType),
    source: normalizeText(form.source),
    relatedTable: normalizeText(form.relatedTable),
    relatedId: normalizeText(form.relatedId),
    requestId: normalizeText(form.requestId),
    fromStatus: normalizeText(form.fromStatus),
    toStatus: normalizeText(form.toStatus),
    attemptNo: normalizeText(form.attemptNo),
    createTimeFrom: normalizeText(form.createTimeFrom),
    createTimeTo: normalizeText(form.createTimeTo),
    trafficApprovedBy: normalizeText(form.trafficApprovedBy),
  };
}

function hasAdvancedFilters(form: FilterFormState) {
  return Boolean(
    form.changeKey ||
      form.operatorId ||
      form.operatorType ||
      form.source ||
      form.relatedTable ||
      form.relatedId ||
      form.requestId ||
      form.fromStatus ||
      form.toStatus ||
      form.attemptNo ||
      form.trafficApprovedBy,
  );
}

function LongText({
  value,
  className,
  mono = false,
}: {
  value: unknown;
  className?: string;
  mono?: boolean;
}) {
  const text = toCellText(value).trim();

  if (!text) {
    return <span>-</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("block truncate", mono && "font-mono text-xs", className)}>
          {text}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[32rem] whitespace-pre-wrap break-all">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

function DetailField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value?: string | number | null;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-muted/10 p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-2 text-sm break-words", mono && "font-mono text-xs")}>{textOrDash(value)}</div>
    </div>
  );
}

function StructuredBlock({
  title,
  value,
}: {
  title: string;
  value: unknown;
}) {
  const content = useMemo(() => formatStructuredValue(value), [value]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[260px] rounded-xl border bg-slate-950 p-4">
          <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-6 text-slate-100">
            {content}
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function DetailSheet({
  open,
  logId,
  onOpenChange,
}: {
  open: boolean;
  logId?: number | string;
  onOpenChange: (open: boolean) => void;
}) {
  const detailQuery = useKolChangeLogDetail(logId, open);
  const detail = detailQuery.data as KolChangeLogDetail | undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-4xl">
        <SheetHeader>
          <SheetTitle>KOL 日志详情</SheetTitle>
          <SheetDescription>
            查看本次变更的完整上下文、状态流转、操作人信息与原始变更数据。
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 h-[calc(100vh-7rem)]">
          {detailQuery.isLoading ? (
            <div className="flex h-full items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading log details...
            </div>
          ) : detailQuery.isError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Failed to load log details</AlertTitle>
              <AlertDescription className="space-y-3">
                <div>{detailQuery.error instanceof Error ? detailQuery.error.message : "Request failed."}</div>
                <Button type="button" variant="outline" onClick={() => void detailQuery.refetch()}>
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : !detail ? (
            <EmptyState title="No details available" description="The backend did not return detail data for this log." />
          ) : (
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4 pb-8">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <DetailField label="ID" value={detail.id ?? ""} mono />
                  <DetailField label="Create Time" value={formatLocalDateTime(detail.createTime)} />
                  <DetailField label="Attempt No" value={detail.attemptNo} />
                  <DetailField label="Affiliate ID" value={detail.affiliateId} mono />
                  <DetailField label="Affiliate Code" value={detail.affiliateCode} />
                  <DetailField label="Affiliate Name" value={detail.affiliateName} />
                  <DetailField label="Email" value={detail.email} />
                  <DetailField label="Biz Type" value={detail.bizType} />
                  <DetailField label="Biz Sub Type" value={detail.bizSubType} />
                  <DetailField label="Event Type" value={detail.eventType} />
                  <DetailField label="Change Key" value={detail.changeKey} />
                  <DetailField label="From Status" value={detail.fromStatus} />
                  <DetailField label="To Status" value={detail.toStatus} />
                  <DetailField label="Operator Name" value={detail.operatorName} />
                  <DetailField label="Operator ID" value={detail.operatorId} mono />
                  <DetailField label="Operator Type" value={detail.operatorType} />
                  <DetailField label="Source" value={detail.source} />
                  <DetailField label="Related Table" value={detail.relatedTable} />
                  <DetailField label="Related ID" value={detail.relatedId} mono />
                  <DetailField label="Request ID" value={detail.requestId} mono />
                  <DetailField label="Traffic Approved By" value={detail.trafficApprovedBy} />
                </div>

                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Remark</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl border bg-muted/10 p-4 text-sm whitespace-pre-wrap break-words">
                      {textOrDash(detail.remark)}
                    </div>
                  </CardContent>
                </Card>

                <StructuredBlock title="Change Data" value={detail.changeData} />
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

const KolLogPage = () => {
  const queryClient = useQueryClient();
  const [filterForm, setFilterForm] = useState<FilterFormState>(defaultFilterForm);
  const [query, setQuery] = useState<KolChangeLogListQuery>(defaultQuery);
  const [detailState, setDetailState] = useState<{
    open: boolean;
    logId?: number | string;
  }>({ open: false });
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    document.title = "KOL日志 | Mitrade Admin";
  }, []);

  const listQuery = useKolChangeLogs(query);
  const items = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  const shouldOpenAdvanced = useMemo(() => advancedOpen || hasAdvancedFilters(filterForm), [advancedOpen, filterForm]);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: kolLogQueryKeys.all });
  }

  function handleSearch() {
    setQuery(buildQueryFromForm(filterForm, query.pageSize));
  }

  function handleReset() {
    setFilterForm(defaultFilterForm);
    setAdvancedOpen(false);
    setQuery({
      ...defaultQuery,
      pageSize: query.pageSize,
    });
  }

  function updateField<K extends keyof FilterFormState>(key: K, value: FilterFormState[K]) {
    setFilterForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <div className="space-y-6 p-6">
      <PageIntro
        title="KOL日志"
        description="查看 KOL 变更日志，支持多条件筛选、分页查询和详情查看。"
        actions={
          <Button type="button" variant="outline" onClick={() => void refresh()} disabled={listQuery.isFetching}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
          <CardDescription>优先按常用字段筛选，更多条件可展开后继续补充。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Affiliate ID">
              <Input value={filterForm.affiliateId} onChange={(event) => updateField("affiliateId", event.target.value)} />
            </Field>
            <Field label="Affiliate Code">
              <Input value={filterForm.affiliateCode} onChange={(event) => updateField("affiliateCode", event.target.value)} />
            </Field>
            <Field label="Affiliate Name">
              <Input value={filterForm.affiliateName} onChange={(event) => updateField("affiliateName", event.target.value)} />
            </Field>
            <Field label="Email">
              <Input value={filterForm.email} onChange={(event) => updateField("email", event.target.value)} />
            </Field>
            <Field label="Biz Type">
              <Input value={filterForm.bizType} onChange={(event) => updateField("bizType", event.target.value)} />
            </Field>
            <Field label="Biz Sub Type">
              <Input value={filterForm.bizSubType} onChange={(event) => updateField("bizSubType", event.target.value)} />
            </Field>
            <Field label="Event Type">
              <Input value={filterForm.eventType} onChange={(event) => updateField("eventType", event.target.value)} />
            </Field>
            <Field label="Operator Name">
              <Input value={filterForm.operatorName} onChange={(event) => updateField("operatorName", event.target.value)} />
            </Field>
            <Field label="Create Time From" hint="Supports raw backend time text, for example YYYY-MM-DD HH:MM:SS.">
              <Input
                value={filterForm.createTimeFrom}
                onChange={(event) => updateField("createTimeFrom", event.target.value)}
                placeholder="2026-05-01 00:00:00"
              />
            </Field>
            <Field label="Create Time To" hint="Supports raw backend time text, for example YYYY-MM-DD HH:MM:SS.">
              <Input
                value={filterForm.createTimeTo}
                onChange={(event) => updateField("createTimeTo", event.target.value)}
                placeholder="2026-05-12 23:59:59"
              />
            </Field>
          </div>

          <Collapsible open={shouldOpenAdvanced} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" className="px-0 text-muted-foreground hover:text-foreground">
                更多筛选
                <ChevronDown className={cn("ml-2 h-4 w-4 transition-transform", shouldOpenAdvanced && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Change Key">
                  <Input value={filterForm.changeKey} onChange={(event) => updateField("changeKey", event.target.value)} />
                </Field>
                <Field label="Operator ID">
                  <Input value={filterForm.operatorId} onChange={(event) => updateField("operatorId", event.target.value)} />
                </Field>
                <Field label="Operator Type">
                  <Input value={filterForm.operatorType} onChange={(event) => updateField("operatorType", event.target.value)} />
                </Field>
                <Field label="Source">
                  <Input value={filterForm.source} onChange={(event) => updateField("source", event.target.value)} />
                </Field>
                <Field label="Related Table">
                  <Input value={filterForm.relatedTable} onChange={(event) => updateField("relatedTable", event.target.value)} />
                </Field>
                <Field label="Related ID">
                  <Input value={filterForm.relatedId} onChange={(event) => updateField("relatedId", event.target.value)} />
                </Field>
                <Field label="Request ID">
                  <Input value={filterForm.requestId} onChange={(event) => updateField("requestId", event.target.value)} />
                </Field>
                <Field label="From Status">
                  <Input value={filterForm.fromStatus} onChange={(event) => updateField("fromStatus", event.target.value)} />
                </Field>
                <Field label="To Status">
                  <Input value={filterForm.toStatus} onChange={(event) => updateField("toStatus", event.target.value)} />
                </Field>
                <Field label="Attempt No">
                  <Input value={filterForm.attemptNo} onChange={(event) => updateField("attemptNo", event.target.value)} />
                </Field>
                <Field label="Traffic Approved By">
                  <Input
                    value={filterForm.trafficApprovedBy}
                    onChange={(event) => updateField("trafficApprovedBy", event.target.value)}
                  />
                </Field>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={handleSearch} disabled={listQuery.isFetching}>
              Search
            </Button>
            <Button type="button" variant="outline" onClick={handleReset} disabled={listQuery.isFetching}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle>KOL Log List</CardTitle>
            <CardDescription>Keep backend order as-is. Current result has {total} total records.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {listQuery.isFetching && listQuery.data ? (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refreshing list...
              </div>
            ) : null}
            <div className="min-w-[140px]">
              <Select
                value={String(query.pageSize)}
                onValueChange={(value) =>
                  setQuery((current) => ({
                    ...current,
                    page: 1,
                    pageSize: normalizePageSize(Number(value)),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Page Size" />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {listQuery.isLoading ? (
            <div className="flex h-64 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading KOL logs...
            </div>
          ) : listQuery.isError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Failed to load KOL logs</AlertTitle>
              <AlertDescription className="space-y-3">
                <div>{listQuery.error instanceof Error ? listQuery.error.message : "Request failed."}</div>
                <Button type="button" variant="outline" onClick={() => void listQuery.refetch()}>
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : items.length === 0 ? (
            <EmptyState title="No KOL logs" description="No records matched the current filters." />
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border">
                <Table className="table-fixed min-w-[1860px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Create Time</TableHead>
                      <TableHead className="w-[120px]">Affiliate ID</TableHead>
                      <TableHead className="w-[150px]">Affiliate Code</TableHead>
                      <TableHead className="w-[180px]">Affiliate Name</TableHead>
                      <TableHead className="w-[200px]">Email</TableHead>
                      <TableHead className="w-[120px]">Biz Type</TableHead>
                      <TableHead className="w-[140px]">Biz Sub Type</TableHead>
                      <TableHead className="w-[140px]">Event Type</TableHead>
                      <TableHead className="w-[180px]">Change Key</TableHead>
                      <TableHead className="w-[120px]">From Status</TableHead>
                      <TableHead className="w-[120px]">To Status</TableHead>
                      <TableHead className="w-[150px]">Operator Name</TableHead>
                      <TableHead className="w-[120px]">Operator ID</TableHead>
                      <TableHead className="w-[140px]">Source</TableHead>
                      <TableHead className="w-[96px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={String(item.id ?? `${item.requestId}-${item.createTime}`)}>
                        <TableCell>{formatLocalDateTime(item.createTime)}</TableCell>
                        <TableCell>
                          <LongText value={item.affiliateId} mono />
                        </TableCell>
                        <TableCell>
                          <LongText value={item.affiliateCode} />
                        </TableCell>
                        <TableCell>
                          <LongText value={item.affiliateName} />
                        </TableCell>
                        <TableCell>
                          <LongText value={item.email} />
                        </TableCell>
                        <TableCell>
                          <LongText value={item.bizType} />
                        </TableCell>
                        <TableCell>
                          <LongText value={item.bizSubType} />
                        </TableCell>
                        <TableCell>
                          <LongText value={item.eventType} />
                        </TableCell>
                        <TableCell>
                          <LongText value={item.changeKey} />
                        </TableCell>
                        <TableCell>
                          <LongText value={item.fromStatus} />
                        </TableCell>
                        <TableCell>
                          <LongText value={item.toStatus} />
                        </TableCell>
                        <TableCell>
                          <LongText value={item.operatorName} />
                        </TableCell>
                        <TableCell>
                          <LongText value={item.operatorId} mono />
                        </TableCell>
                        <TableCell>
                          <LongText value={item.source} />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setDetailState({
                                open: true,
                                logId: item.id,
                              })
                            }
                          >
                            详情
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <div>
                  Page {query.page} of {totalPages}, {total} total
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={listQuery.isFetching || query.page <= 1}
                    onClick={() =>
                      setQuery((current) => ({
                        ...current,
                        page: Math.max(1, current.page - 1),
                      }))
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={listQuery.isFetching || query.page >= totalPages}
                    onClick={() =>
                      setQuery((current) => ({
                        ...current,
                        page: current.page + 1,
                      }))
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <DetailSheet
        open={detailState.open}
        logId={detailState.logId}
        onOpenChange={(open) =>
          setDetailState((current) => ({
            ...current,
            open,
          }))
        }
      />
    </div>
  );
};

export default KolLogPage;
