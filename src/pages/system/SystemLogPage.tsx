import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Copy, Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  systemLogQueryKeys,
  useSystemOperationLogDetail,
  useSystemOperationLogs,
} from "@/features/system-log/hooks";
import { EmptyState, PageIntro } from "@/features/console/shared";
import { cn } from "@/lib/utils";
import type {
  OperationLogResultValue,
  SystemOperationLogDetail,
  SystemOperationLogListItem,
  SystemOperationLogListQuery,
} from "@/types/system-log";

type FilterFormState = {
  event: string;
  module: string;
  operatorId: string;
  targetType: string;
  targetId: string;
  requestId: string;
  result: "__all__" | "1" | "0";
};

const DEFAULT_PAGE_SIZE = 20;

const defaultFilterForm: FilterFormState = {
  event: "",
  module: "",
  operatorId: "",
  targetType: "",
  targetId: "",
  requestId: "",
  result: "__all__",
};

const defaultQuery: SystemOperationLogListQuery = {
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

function getResultMeta(result: OperationLogResultValue) {
  const normalized = String(result ?? "").trim().toLowerCase();
  if (normalized === "1" || normalized === "true" || normalized === "success") {
    return {
      label: "Success",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }
  if (normalized === "0" || normalized === "false" || normalized === "fail" || normalized === "failed") {
    return {
      label: "Failed",
      className: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }
  return {
    label: normalized ? `Unknown (${normalized})` : "Unknown",
    className: "border-slate-200 bg-slate-50 text-slate-600",
  };
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

function tryParseJson(value: unknown) {
  if (typeof value !== "string") {
    return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
  }

  const raw = value.trim();
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getParsedArgs(item?: Pick<SystemOperationLogListItem, "args">) {
  return tryParseJson(item?.args);
}

function getDerivedTargetId(item?: Pick<SystemOperationLogListItem, "targetId" | "args">) {
  const explicitTargetId = String(item?.targetId ?? "").trim();
  if (explicitTargetId) {
    return explicitTargetId;
  }

  const parsedArgs = getParsedArgs(item);
  const affiliateId = String(parsedArgs?.affiliateId ?? "").trim();
  return affiliateId || "";
}

function getDerivedRequestId(item?: Pick<SystemOperationLogListItem, "requestId" | "traceId">) {
  return String(item?.requestId ?? "").trim() || String(item?.traceId ?? "").trim();
}

function getArgsSummary(item?: Pick<SystemOperationLogListItem, "args">) {
  const parsedArgs = getParsedArgs(item);
  if (!parsedArgs) {
    return "";
  }

  const updateValue = parsedArgs.Update;
  const logsLength = Array.isArray(parsedArgs.Logs) ? parsedArgs.Logs.length : null;
  const summaryParts = [
    typeof updateValue === "boolean" ? `Update: ${updateValue ? "true" : "false"}` : "",
    logsLength !== null ? `Changes: ${logsLength}` : "",
  ].filter(Boolean);

  return summaryParts.join(" | ");
}

function buildQueryFromForm(form: FilterFormState, currentPageSize: number): SystemOperationLogListQuery {
  return {
    page: 1,
    pageSize: currentPageSize,
    event: form.event.trim() || undefined,
    module: form.module.trim() || undefined,
    operatorId: form.operatorId.trim() || undefined,
    targetType: form.targetType.trim() || undefined,
    targetId: form.targetId.trim() || undefined,
    requestId: form.requestId.trim() || undefined,
    result: form.result === "__all__" ? undefined : (Number(form.result) as 0 | 1),
  };
}

function ResultBadge({ value }: { value: OperationLogResultValue }) {
  const meta = getResultMeta(value);
  return (
    <Badge variant="outline" className={cn("inline-flex items-center justify-center", meta.className)}>
      {meta.label}
    </Badge>
  );
}

function CopyTextButton({
  value,
  label = "Copy",
}: {
  value?: string | number;
  label?: string;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="h-7 px-2 text-muted-foreground hover:text-foreground"
      onClick={async () => {
        const text = String(value ?? "").trim();
        if (!text) {
          toast.error("Nothing to copy.");
          return;
        }
        await navigator.clipboard.writeText(text);
        toast.success("Copied.");
      }}
    >
      <Copy className="mr-1 h-3.5 w-3.5" />
      {label}
    </Button>
  );
}

function CopyableInlineValue({
  value,
  className,
  label,
}: {
  value?: string | number;
  className?: string;
  label?: string;
}) {
  const text = String(value ?? "").trim();

  if (!text) {
    return <span>-</span>;
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="truncate font-mono text-xs">{text}</span>
      <CopyTextButton value={text} label={label} />
    </div>
  );
}

function DetailField({
  label,
  value,
  copyable = false,
  mono = false,
}: {
  label: string;
  value?: string | number | null;
  copyable?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-muted/10 p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-2 text-sm", mono && "font-mono break-all")}>
        {copyable ? <CopyableInlineValue value={value ?? undefined} /> : textOrDash(value)}
      </div>
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
        <ScrollArea className="h-[220px] rounded-xl border bg-slate-950 p-4">
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
  const detailQuery = useSystemOperationLogDetail(logId, open);
  const detail = detailQuery.data as SystemOperationLogDetail | undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>Log Details</SheetTitle>
          <SheetDescription>
            Review the full operation log context, request chain, and before/after payloads.
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
                <div className="grid gap-4 md:grid-cols-2">
                  <DetailField label="ID" value={detail.id ?? ""} mono />
                  <div className="rounded-xl border bg-muted/10 p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Result</div>
                    <div className="mt-2">
                      <ResultBadge value={detail.result} />
                    </div>
                  </div>
                  <DetailField label="Event" value={detail.event} />
                  <DetailField label="Module" value={detail.module} />
                  <DetailField label="Operator ID" value={detail.operatorId} mono />
                  <DetailField label="Operator Name" value={detail.operatorName} />
                  <DetailField label="Operator Type" value={detail.operatorType} />
                  <DetailField label="Target Type" value={detail.targetType} />
                  <DetailField label="Target ID" value={getDerivedTargetId(detail)} copyable mono />
                  <DetailField label="Request ID" value={getDerivedRequestId(detail)} copyable mono />
                  <DetailField label="Trace ID" value={detail.traceId} copyable mono />
                  <DetailField label="Source" value={detail.source} />
                  <DetailField label="IP" value={detail.ip} mono />
                  <DetailField label="Create Time" value={formatLocalDateTime(detail.createTime)} />
                </div>

                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">User Agent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl border bg-muted/10 p-4 font-mono text-xs break-all">
                      {textOrDash(detail.userAgent)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Error Message</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl border bg-muted/10 p-4 text-sm whitespace-pre-wrap break-words">
                      {textOrDash(detail.errorMessage)}
                    </div>
                  </CardContent>
                </Card>

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

                <div className="grid gap-4">
                  <StructuredBlock title="Args" value={detail.args} />
                  <StructuredBlock title="Before Data" value={detail.beforeData} />
                  <StructuredBlock title="After Data" value={detail.afterData} />
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

const SystemLogPage = () => {
  const queryClient = useQueryClient();
  const [filterForm, setFilterForm] = useState<FilterFormState>(defaultFilterForm);
  const [query, setQuery] = useState<SystemOperationLogListQuery>(defaultQuery);
  const [detailState, setDetailState] = useState<{
    open: boolean;
    logId?: number | string;
  }>({ open: false });

  const listQuery = useSystemOperationLogs(query);
  const items = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: systemLogQueryKeys.all });
  }

  function handleSearch() {
    setQuery(buildQueryFromForm(filterForm, query.pageSize));
  }

  function handleReset() {
    setFilterForm(defaultFilterForm);
    setQuery({
      ...defaultQuery,
      pageSize: query.pageSize,
    });
  }

  return (
    <div className="space-y-6 p-6">
      <PageIntro
        title="System Logs"
        description="View operation logs for operators and admins, with multi-field filtering, paging, and a detail drawer."
        actions={
          <Button type="button" variant="outline" onClick={() => void refresh()} disabled={listQuery.isFetching}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Update the filters and click Search to request data. Current filters stay applied while paging.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2 text-sm">
              <span className="font-medium">event</span>
              <Input
                value={filterForm.event}
                onChange={(event) =>
                  setFilterForm((current) => ({
                    ...current,
                    event: event.target.value,
                  }))
                }
                placeholder="Enter event"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">module</span>
              <Input
                value={filterForm.module}
                onChange={(event) =>
                  setFilterForm((current) => ({
                    ...current,
                    module: event.target.value,
                  }))
                }
                placeholder="Enter module"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">operatorId</span>
              <Input
                value={filterForm.operatorId}
                onChange={(event) =>
                  setFilterForm((current) => ({
                    ...current,
                    operatorId: event.target.value,
                  }))
                }
                placeholder="Enter operatorId"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">targetType</span>
              <Input
                value={filterForm.targetType}
                onChange={(event) =>
                  setFilterForm((current) => ({
                    ...current,
                    targetType: event.target.value,
                  }))
                }
                placeholder="Enter targetType"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">targetId</span>
              <Input
                value={filterForm.targetId}
                onChange={(event) =>
                  setFilterForm((current) => ({
                    ...current,
                    targetId: event.target.value,
                  }))
                }
                placeholder="Enter targetId"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">requestId</span>
              <Input
                value={filterForm.requestId}
                onChange={(event) =>
                  setFilterForm((current) => ({
                    ...current,
                    requestId: event.target.value,
                  }))
                }
                placeholder="Enter requestId"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">result</span>
              <Select
                value={filterForm.result}
                onValueChange={(value: FilterFormState["result"]) =>
                  setFilterForm((current) => ({
                    ...current,
                    result: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All</SelectItem>
                  <SelectItem value="1">Success (1)</SelectItem>
                  <SelectItem value="0">Failed (0)</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">pageSize</span>
              <Select
                value={String(query.pageSize)}
                onValueChange={(value) =>
                  setQuery((current) => ({
                    ...current,
                    page: 1,
                    pageSize: Number(value),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select page size" />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>

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
            <CardTitle>System Log List</CardTitle>
            <CardDescription>Sorted by latest time by default, with {total} total records.</CardDescription>
          </div>
          {listQuery.isFetching && listQuery.data ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing list...
            </div>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {listQuery.isLoading ? (
            <div className="flex h-64 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading system logs...
            </div>
          ) : listQuery.isError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Failed to load system logs</AlertTitle>
              <AlertDescription className="space-y-3">
                <div>{listQuery.error instanceof Error ? listQuery.error.message : "Request failed."}</div>
                <Button type="button" variant="outline" onClick={() => void listQuery.refetch()}>
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : items.length === 0 ? (
            <EmptyState title="No system logs" description="No operation_log records matched the current filters." />
          ) : (
            <>
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[88px]">ID</TableHead>
                    <TableHead className="w-[180px]">Event</TableHead>
                    <TableHead className="w-[160px]">Module</TableHead>
                    <TableHead className="w-[140px]">Operator Name</TableHead>
                    <TableHead className="w-[140px]">Operator ID</TableHead>
                    <TableHead className="w-[120px]">Target Type</TableHead>
                    <TableHead className="w-[160px]">Target ID</TableHead>
                    <TableHead className="w-[100px]">Result</TableHead>
                    <TableHead className="w-[180px]">Request ID</TableHead>
                    <TableHead className="w-[180px]">Create Time</TableHead>
                    <TableHead className="w-[96px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={String(item.id ?? `${item.requestId}-${item.createTime}`)}>
                      <TableCell className="font-mono text-xs">{textOrDash(item.id)}</TableCell>
                      <TableCell className="max-w-[180px]">
                        <div className="space-y-1">
                          <div className="truncate font-medium" title={item.event}>
                            {textOrDash(item.event)}
                          </div>
                          {getArgsSummary(item) ? (
                            <div className="truncate text-xs text-muted-foreground" title={getArgsSummary(item)}>
                              {getArgsSummary(item)}
                            </div>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="truncate" title={item.module}>
                        {textOrDash(item.module)}
                      </TableCell>
                      <TableCell className="truncate" title={item.operatorName}>
                        {textOrDash(item.operatorName)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{textOrDash(item.operatorId)}</TableCell>
                      <TableCell className="truncate" title={item.targetType}>
                        {textOrDash(item.targetType)}
                      </TableCell>
                      <TableCell>
                        <CopyableInlineValue value={getDerivedTargetId(item)} label="Copy" />
                      </TableCell>
                      <TableCell>
                        <ResultBadge value={item.result} />
                      </TableCell>
                      <TableCell>
                        <CopyableInlineValue value={getDerivedRequestId(item)} label="Copy" />
                      </TableCell>
                      <TableCell>{formatLocalDateTime(item.createTime)}</TableCell>
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
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

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

export default SystemLogPage;
