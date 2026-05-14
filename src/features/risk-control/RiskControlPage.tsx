import { useEffect, useState, type ReactNode } from "react";
import {
  Eye,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, Field, PageIntro, StatCard, StatusBadge } from "@/features/console/shared";
import {
  useBlacklists,
  useCreateBlacklist,
  useCreateRiskRule,
  useDeleteBlacklist,
  useKolRiskReviewDetail,
  useKolRiskReviews,
  useReviewKolRisk,
  useReviewWithdrawalRisk,
  useRiskAlerts,
  useRiskDashboard,
  useRiskRuleDetail,
  useRiskRules,
  useToggleRiskRule,
  useUpdateBlacklist,
  useUpdateRiskAlert,
  useUpdateRiskRule,
  useWithdrawalRiskReviewDetail,
  useWithdrawalRiskReviews,
} from "@/features/risk-control/hooks";
import type {
  BlacklistEntry,
  CreateBlacklistEntryPayload,
  CreateRiskRulePayload,
  KolRiskReviewDetail,
  ListBlacklistEntriesQuery,
  ListKolRiskReviewsQuery,
  ListRiskAlertsQuery,
  ListRiskRulesQuery,
  ListWithdrawalRiskReviewsQuery,
  RiskAlertItem,
  RiskQueryBase,
  RiskRuleAction,
  RiskRuleCondition,
  RiskRuleItem,
  UpdateBlacklistEntryPayload,
  UpdateRiskRulePayload,
  WithdrawalRiskReviewDetail,
} from "@/types/risk-control";

export type RiskControlView =
  | "dashboard"
  | "alert-center"
  | "kol-review"
  | "withdrawal-review"
  | "blacklist"
  | "rules";

const severityOptions = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];
const alertStatusOptions = ["ALL", "OPEN", "PROCESSING", "RESOLVED", "IGNORED"];
const reviewStatusOptions = ["ALL", "PENDING", "APPROVED", "REJECTED", "MANUAL_REVIEW"];
const riskLevelOptions = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];
const targetTypeOptions = ["ACCOUNT", "AFFILIATE", "CUSTOMER", "EMAIL", "DEVICE", "IP"];
const blacklistStatusOptions = ["ACTIVE", "DISABLED", "EXPIRED"];
const ruleSceneOptions = ["REGISTRATION", "KOL_REVIEW", "WITHDRAWAL", "TRADE", "COMMISSION"];
const alertSceneOptions = ["ALL", "KOL_REVIEW", "WITHDRAWAL", "BLACKLIST", "RULE_ENGINE"];

function arrayFromSingle(value: string) {
  return value === "ALL" ? [] : [value];
}

function singleFromArray(values?: string[]) {
  return values?.[0] || "ALL";
}

function formatNumber(value?: number | string) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return "0";
  }
  return new Intl.NumberFormat("en-US").format(numeric);
}

function formatPercent(value?: number) {
  return `${(Number(value ?? 0) * 100).toFixed(2)}%`;
}

function formatMoney(value?: number | string) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return "0.00";
  }
  return numeric.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function trimArrayText(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseJsonArray<T>(value: string, fallback: T[]): T[] {
  if (!value.trim()) {
    return fallback;
  }
  const parsed = JSON.parse(value);
  return Array.isArray(parsed) ? (parsed as T[]) : fallback;
}

function PageShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageIntro title={title} description={description} actions={actions} />
      {children}
    </div>
  );
}

function DataCard({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function FiltersCard({
  children,
  onSearch,
  onReset,
  loading,
}: {
  children: ReactNode;
  onSearch: () => void;
  onReset: () => void;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{children}</div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={onSearch} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Search
          </Button>
          <Button type="button" variant="outline" onClick={onReset} disabled={loading}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function PaginationBar({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(Math.max(total, 0) / Math.max(pageSize, 1)));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm text-muted-foreground">
      <div>
        Page {page} / {totalPages} · Total {formatNumber(total)}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function ReviewDetailBlock({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value || "-"}</div>
    </div>
  );
}

function AlertActions({
  row,
}: {
  row: RiskAlertItem;
}) {
  const mutation = useUpdateRiskAlert();

  async function apply(status: string, action: string) {
    const remark = window.prompt(`Remark for ${action}`, row.latestRemark || "") ?? "";
    try {
      await mutation.mutateAsync({
        alertId: row.alertId,
        action,
        status,
        remark,
      });
      toast.success(`Alert ${row.alertCode || row.alertId} updated.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Alert update failed");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {row.status !== "PROCESSING" ? (
        <Button type="button" size="sm" variant="outline" onClick={() => void apply("PROCESSING", "claim")}>
          Claim
        </Button>
      ) : null}
      {row.status !== "RESOLVED" ? (
        <Button type="button" size="sm" onClick={() => void apply("RESOLVED", "resolve")}>
          Resolve
        </Button>
      ) : null}
      {row.status !== "IGNORED" ? (
        <Button type="button" size="sm" variant="destructive" onClick={() => void apply("IGNORED", "ignore")}>
          Ignore
        </Button>
      ) : null}
    </div>
  );
}

function KolReviewDialog({
  reviewId,
  open,
  onOpenChange,
}: {
  reviewId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const detailQuery = useKolRiskReviewDetail(reviewId);
  const reviewMutation = useReviewKolRisk();
  const [remark, setRemark] = useState("");

  useEffect(() => {
    setRemark(detailQuery.data?.latestRemark ?? "");
  }, [detailQuery.data?.latestRemark, reviewId]);

  async function submit(decision: string) {
    if (!reviewId) return;
    try {
      await reviewMutation.mutateAsync({
        reviewId,
        decision,
        remark,
      });
      toast.success(`KOL review ${decision.toLowerCase()} completed.`);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "KOL review failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>KOL Risk Review Detail</DialogTitle>
          <DialogDescription>Inspect flags, related alerts, and reviewer history before making a decision.</DialogDescription>
        </DialogHeader>
        {detailQuery.isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading detail...
          </div>
        ) : !detailQuery.data ? (
          <EmptyState title="No detail found" description="The selected review did not return any risk detail." />
        ) : (
          <KolReviewDialogBody detail={detailQuery.data} remark={remark} onRemarkChange={setRemark} />
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="button" variant="outline" disabled={reviewMutation.isPending} onClick={() => void submit("MANUAL_REVIEW")}>
            Manual Review
          </Button>
          <Button type="button" variant="destructive" disabled={reviewMutation.isPending} onClick={() => void submit("REJECT")}>
            Reject
          </Button>
          <Button type="button" disabled={reviewMutation.isPending} onClick={() => void submit("APPROVE")}>
            {reviewMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KolReviewDialogBody({
  detail,
  remark,
  onRemarkChange,
}: {
  detail: KolRiskReviewDetail;
  remark: string;
  onRemarkChange: (value: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ReviewDetailBlock label="Affiliate" value={detail.profile.affiliateName} />
        <ReviewDetailBlock label="Affiliate Code" value={detail.profile.affiliateCode} />
        <ReviewDetailBlock label="Risk Level" value={detail.profile.riskLevel} />
        <ReviewDetailBlock label="Review Status" value={detail.profile.reviewStatus} />
        <ReviewDetailBlock label="Owner" value={detail.profile.ownerName} />
        <ReviewDetailBlock label="Email" value={detail.profile.email} />
        <ReviewDetailBlock label="Alert Count" value={detail.profile.alertCount} />
        <ReviewDetailBlock label="Flag Count" value={detail.profile.flagCount} />
      </div>

      <DataCard title="Risk Flags">
        <SimpleFlagsTable flags={detail.flags} />
      </DataCard>

      <DataCard title="Related Alerts">
        <SimpleAlertsTable alerts={detail.relatedAlerts} />
      </DataCard>

      <DataCard title="Review History">
        <SimpleHistoryTable records={detail.records} />
      </DataCard>

      <Field label="Decision Remark">
        <Textarea rows={4} value={remark} onChange={(event) => onRemarkChange(event.target.value)} />
      </Field>
    </div>
  );
}

function WithdrawalReviewDialog({
  reviewId,
  open,
  onOpenChange,
}: {
  reviewId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const detailQuery = useWithdrawalRiskReviewDetail(reviewId);
  const reviewMutation = useReviewWithdrawalRisk();
  const [remark, setRemark] = useState("");

  useEffect(() => {
    setRemark(detailQuery.data?.latestRemark ?? "");
  }, [detailQuery.data?.latestRemark, reviewId]);

  async function submit(decision: string) {
    if (!reviewId) return;
    try {
      await reviewMutation.mutateAsync({
        reviewId,
        decision,
        remark,
      });
      toast.success(`Withdrawal review ${decision.toLowerCase()} completed.`);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Withdrawal review failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Withdrawal Risk Review Detail</DialogTitle>
          <DialogDescription>Review transaction context, triggered rules, and previous decisions before approval.</DialogDescription>
        </DialogHeader>
        {detailQuery.isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading detail...
          </div>
        ) : !detailQuery.data ? (
          <EmptyState title="No detail found" description="The selected review did not return any risk detail." />
        ) : (
          <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <ReviewDetailBlock label="Withdrawal ID" value={detailQuery.data.profile.withdrawalId} />
              <ReviewDetailBlock label="Affiliate" value={detailQuery.data.profile.affiliateName} />
              <ReviewDetailBlock label="Risk Level" value={detailQuery.data.profile.riskLevel} />
              <ReviewDetailBlock label="Review Status" value={detailQuery.data.profile.reviewStatus} />
              <ReviewDetailBlock label="Amount USD" value={detailQuery.data.profile.amountUsd} />
              <ReviewDetailBlock label="Payment Method" value={detailQuery.data.profile.paymentMethod} />
              <ReviewDetailBlock label="Settlement ID" value={detailQuery.data.profile.settlementId} />
              <ReviewDetailBlock label="Payout Account" value={detailQuery.data.profile.payoutAccount} />
            </div>

            <DataCard title="Risk Flags">
              <SimpleFlagsTable flags={detailQuery.data.flags} />
            </DataCard>

            <DataCard title="Related Alerts">
              <SimpleAlertsTable alerts={detailQuery.data.relatedAlerts} />
            </DataCard>

            <DataCard title="Review History">
              <SimpleHistoryTable records={detailQuery.data.records} />
            </DataCard>

            <Field label="Decision Remark">
              <Textarea rows={4} value={remark} onChange={(event) => setRemark(event.target.value)} />
            </Field>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="button" variant="outline" disabled={reviewMutation.isPending} onClick={() => void submit("MANUAL_REVIEW")}>
            Manual Review
          </Button>
          <Button type="button" variant="destructive" disabled={reviewMutation.isPending} onClick={() => void submit("REJECT")}>
            Reject
          </Button>
          <Button type="button" disabled={reviewMutation.isPending} onClick={() => void submit("APPROVE")}>
            {reviewMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SimpleFlagsTable({ flags }: { flags: KolRiskReviewDetail["flags"] | WithdrawalRiskReviewDetail["flags"] }) {
  if (!flags.length) {
    return <EmptyState title="No flags" description="No triggered risk flags were returned by the backend." />;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Flag</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Rule</TableHead>
          <TableHead>Trigger</TableHead>
          <TableHead>Threshold</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {flags.map((flag) => (
          <TableRow key={`${flag.code}-${flag.ruleCode}-${flag.createdAt}`}>
            <TableCell>
              <div className="font-medium">{flag.label || flag.code}</div>
              <div className="text-xs text-muted-foreground">{flag.description || "-"}</div>
            </TableCell>
            <TableCell>
              <StatusBadge status={flag.severity} />
            </TableCell>
            <TableCell>
              <div>{flag.ruleName || flag.ruleCode}</div>
              <div className="text-xs text-muted-foreground">{flag.ruleCode}</div>
            </TableCell>
            <TableCell>{flag.triggerValue || "-"}</TableCell>
            <TableCell>{flag.thresholdValue || "-"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SimpleAlertsTable({ alerts }: { alerts: RiskAlertItem[] }) {
  if (!alerts.length) {
    return <EmptyState title="No related alerts" description="No alert records are linked to this review item." />;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Alert</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Rule</TableHead>
          <TableHead>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {alerts.map((alert) => (
          <TableRow key={alert.alertId}>
            <TableCell>
              <div className="font-medium">{alert.title || alert.alertCode}</div>
              <div className="text-xs text-muted-foreground">{alert.description || "-"}</div>
            </TableCell>
            <TableCell>
              <StatusBadge status={alert.severity} />
            </TableCell>
            <TableCell>
              <StatusBadge status={alert.status} />
            </TableCell>
            <TableCell>{alert.ruleName || alert.ruleCode || "-"}</TableCell>
            <TableCell>{alert.updatedAt || "-"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SimpleHistoryTable({
  records,
}: {
  records: KolRiskReviewDetail["records"] | WithdrawalRiskReviewDetail["records"];
}) {
  if (!records.length) {
    return <EmptyState title="No history" description="No review history has been recorded for this item." />;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Operator</TableHead>
          <TableHead>Decision</TableHead>
          <TableHead>Remark</TableHead>
          <TableHead>Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record, index) => (
          <TableRow key={`${record.operatorId}-${record.createdAt}-${index}`}>
            <TableCell>{record.operatorName || record.operatorId || "-"}</TableCell>
            <TableCell>
              <StatusBadge status={record.decision} />
            </TableCell>
            <TableCell>{record.remark || "-"}</TableCell>
            <TableCell>{record.createdAt || "-"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function BlacklistDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: BlacklistEntry | null;
}) {
  const createMutation = useCreateBlacklist();
  const updateMutation = useUpdateBlacklist();
  const [targetType, setTargetType] = useState("ACCOUNT");
  const [targetValue, setTargetValue] = useState("");
  const [targetName, setTargetName] = useState("");
  const [affiliateId, setAffiliateId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [riskLevel, setRiskLevel] = useState("HIGH");
  const [reason, setReason] = useState("");
  const [source, setSource] = useState("MANUAL");
  const [status, setStatus] = useState("ACTIVE");
  const [effectiveAt, setEffectiveAt] = useState("");
  const [expireAt, setExpireAt] = useState("");
  const [tagsText, setTagsText] = useState("");

  useEffect(() => {
    if (!open) return;
    setTargetType(editing?.targetType || "ACCOUNT");
    setTargetValue(editing?.targetValue || "");
    setTargetName(editing?.targetName || "");
    setAffiliateId(editing?.affiliateId || "");
    setCustomerId(editing?.customerId || "");
    setRiskLevel(editing?.riskLevel || "HIGH");
    setReason(editing?.reason || "");
    setSource(editing?.source || "MANUAL");
    setStatus(editing?.status || "ACTIVE");
    setEffectiveAt(editing?.effectiveAt || "");
    setExpireAt(editing?.expireAt || "");
    setTagsText((editing?.tags || []).join(", "));
  }, [editing, open]);

  async function handleSubmit() {
    try {
      if (editing) {
        const payload: UpdateBlacklistEntryPayload = {
          blacklistId: editing.blacklistId,
          targetName,
          riskLevel,
          reason,
          status,
          effectiveAt,
          expireAt,
          tags: trimArrayText(tagsText),
        };
        await updateMutation.mutateAsync(payload);
        toast.success("Blacklist entry updated.");
      } else {
        const payload: CreateBlacklistEntryPayload = {
          targetType,
          targetValue,
          targetName,
          affiliateId,
          customerId,
          riskLevel,
          reason,
          source,
          effectiveAt,
          expireAt,
          tags: trimArrayText(tagsText),
        };
        await createMutation.mutateAsync(payload);
        toast.success("Blacklist entry created.");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Blacklist save failed");
    }
  }

  const submitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Blacklist Entry" : "Create Blacklist Entry"}</DialogTitle>
          <DialogDescription>Manage manual blacklist records that can block onboarding, withdrawal, or review flow.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <FilterSelect label="Target Type" value={targetType} onChange={setTargetType} options={targetTypeOptions} />
          <Field label="Target Value">
            <Input value={targetValue} onChange={(event) => setTargetValue(event.target.value)} disabled={Boolean(editing)} />
          </Field>
          <Field label="Target Name">
            <Input value={targetName} onChange={(event) => setTargetName(event.target.value)} />
          </Field>
          <Field label="Affiliate ID">
            <Input value={affiliateId} onChange={(event) => setAffiliateId(event.target.value)} />
          </Field>
          <Field label="Customer ID">
            <Input value={customerId} onChange={(event) => setCustomerId(event.target.value)} />
          </Field>
          <FilterSelect label="Risk Level" value={riskLevel} onChange={setRiskLevel} options={riskLevelOptions.filter((item) => item !== "ALL")} />
          <Field label="Source">
            <Input value={source} onChange={(event) => setSource(event.target.value)} />
          </Field>
          {editing ? (
            <FilterSelect label="Status" value={status} onChange={setStatus} options={blacklistStatusOptions} />
          ) : null}
          <Field label="Effective At">
            <Input value={effectiveAt} onChange={(event) => setEffectiveAt(event.target.value)} placeholder="YYYY-MM-DD HH:mm:ss" />
          </Field>
          <Field label="Expire At">
            <Input value={expireAt} onChange={(event) => setExpireAt(event.target.value)} placeholder="YYYY-MM-DD HH:mm:ss" />
          </Field>
        </div>
        <Field label="Reason">
          <Textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} />
        </Field>
        <Field label="Tags">
          <Input value={tagsText} onChange={(event) => setTagsText(event.target.value)} placeholder="fraud, duplicate, wallet-risk" />
        </Field>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={submitting} onClick={() => void handleSubmit()}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RiskRuleDialog({
  open,
  onOpenChange,
  ruleId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ruleId?: number;
}) {
  const detailQuery = useRiskRuleDetail(ruleId);
  const createMutation = useCreateRiskRule();
  const updateMutation = useUpdateRiskRule();
  const editing = Boolean(ruleId);

  const [ruleCode, setRuleCode] = useState("");
  const [ruleName, setRuleName] = useState("");
  const [scene, setScene] = useState("WITHDRAWAL");
  const [riskLevel, setRiskLevel] = useState("HIGH");
  const [priority, setPriority] = useState("100");
  const [enabled, setEnabled] = useState("true");
  const [description, setDescription] = useState("");
  const [conditionsJson, setConditionsJson] = useState("[]");
  const [actionsJson, setActionsJson] = useState("[]");

  useEffect(() => {
    if (!open) return;
    if (!editing) {
      setRuleCode("");
      setRuleName("");
      setScene("WITHDRAWAL");
      setRiskLevel("HIGH");
      setPriority("100");
      setEnabled("true");
      setDescription("");
      setConditionsJson("[]");
      setActionsJson("[]");
      return;
    }

    const item = detailQuery.data;
    if (!item) return;
    setRuleCode(item.ruleCode);
    setRuleName(item.ruleName);
    setScene(item.scene || "WITHDRAWAL");
    setRiskLevel(item.riskLevel || "HIGH");
    setPriority(String(item.priority || 100));
    setEnabled(String(item.enabled));
    setDescription(item.description || "");
    setConditionsJson(JSON.stringify(item.conditions || [], null, 2));
    setActionsJson(JSON.stringify(item.actions || [], null, 2));
  }, [detailQuery.data, editing, open]);

  async function handleSubmit() {
    try {
      const conditions = parseJsonArray<RiskRuleCondition>(conditionsJson, []);
      const actions = parseJsonArray<RiskRuleAction>(actionsJson, []);
      if (editing && ruleId) {
        const payload: UpdateRiskRulePayload = {
          ruleId,
          ruleName,
          scene,
          riskLevel,
          priority: Number(priority || 0),
          enabled: enabled === "true",
          description,
          conditions,
          actions,
        };
        await updateMutation.mutateAsync(payload);
        toast.success("Risk rule updated.");
      } else {
        const payload: CreateRiskRulePayload = {
          ruleCode,
          ruleName,
          scene,
          riskLevel,
          priority: Number(priority || 0),
          enabled: enabled === "true",
          description,
          conditions,
          actions,
        };
        await createMutation.mutateAsync(payload);
        toast.success("Risk rule created.");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Risk rule save failed");
    }
  }

  const submitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Risk Rule" : "Create Risk Rule"}</DialogTitle>
          <DialogDescription>Configure rule metadata, trigger conditions, and resulting risk actions.</DialogDescription>
        </DialogHeader>
        {editing && detailQuery.isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading rule...
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Rule Code">
                <Input value={ruleCode} onChange={(event) => setRuleCode(event.target.value)} disabled={editing} />
              </Field>
              <Field label="Rule Name">
                <Input value={ruleName} onChange={(event) => setRuleName(event.target.value)} />
              </Field>
              <FilterSelect label="Scene" value={scene} onChange={setScene} options={ruleSceneOptions} />
              <FilterSelect
                label="Risk Level"
                value={riskLevel}
                onChange={setRiskLevel}
                options={riskLevelOptions.filter((item) => item !== "ALL")}
              />
              <Field label="Priority">
                <Input value={priority} onChange={(event) => setPriority(event.target.value)} />
              </Field>
              <FilterSelect label="Enabled" value={enabled} onChange={setEnabled} options={["true", "false"]} />
            </div>
            <Field label="Description">
              <Textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
            </Field>
            <Field label="Conditions JSON">
              <Textarea rows={8} value={conditionsJson} onChange={(event) => setConditionsJson(event.target.value)} />
            </Field>
            <Field label="Actions JSON">
              <Textarea rows={8} value={actionsJson} onChange={(event) => setActionsJson(event.target.value)} />
            </Field>
          </>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={submitting || (editing && detailQuery.isLoading)} onClick={() => void handleSubmit()}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RiskDashboardView() {
  const [filters, setFilters] = useState<RiskQueryBase>({});
  const [query, setQuery] = useState<RiskQueryBase>({});
  const dashboardQuery = useRiskDashboard(query);

  return (
    <PageShell
      title="Risk Dashboard"
      description="High-level monitoring for alert volumes, review queues, blacklist activity, and the highest-risk affiliates in the current scope."
      actions={
        <Button type="button" variant="outline" onClick={() => void dashboardQuery.refetch()} disabled={dashboardQuery.isFetching}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      }
    >
      <FiltersCard
        loading={dashboardQuery.isFetching}
        onSearch={() => setQuery({ ...filters })}
        onReset={() => {
          setFilters({});
          setQuery({});
        }}
      >
        <Field label="Start Date">
          <Input value={filters.startDate || ""} onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))} placeholder="YYYY-MM-DD" />
        </Field>
        <Field label="End Date">
          <Input value={filters.endDate || ""} onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))} placeholder="YYYY-MM-DD" />
        </Field>
        <Field label="Affiliate ID">
          <Input value={filters.affiliateId || ""} onChange={(event) => setFilters((current) => ({ ...current, affiliateId: event.target.value }))} />
        </Field>
        <Field label="Affiliate Code">
          <Input value={filters.affiliateCode || ""} onChange={(event) => setFilters((current) => ({ ...current, affiliateCode: event.target.value }))} />
        </Field>
      </FiltersCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(dashboardQuery.data?.cards ?? []).map((card) => (
          <StatCard
            key={card.code}
            label={card.label}
            value={formatNumber(card.count)}
            hint={`Compare ${formatNumber(card.compareCount)} · Diff ${formatNumber(card.diffCount)} (${formatPercent(card.diffRate)})`}
          />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Pending KOL Review" value={formatNumber(dashboardQuery.data?.pendingSummary.pendingKolReviewCount)} />
        <StatCard label="Pending Withdrawal Review" value={formatNumber(dashboardQuery.data?.pendingSummary.pendingWithdrawalReviewCount)} />
        <StatCard label="Overdue Alerts" value={formatNumber(dashboardQuery.data?.pendingSummary.overdueAlertCount)} />
        <StatCard label="Active Blacklist" value={formatNumber(dashboardQuery.data?.pendingSummary.activeBlacklistCount)} />
        <StatCard label="Enabled Rules" value={formatNumber(dashboardQuery.data?.pendingSummary.enabledRuleCount)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DataCard title="Severity Distribution">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(dashboardQuery.data?.severityDistribution ?? []).map((item) => (
                <TableRow key={`${item.severity}-${item.label}`}>
                  <TableCell>
                    <div className="font-medium">{item.label || item.severity}</div>
                  </TableCell>
                  <TableCell>{formatNumber(item.count)}</TableCell>
                  <TableCell>{formatPercent(item.share)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataCard>

        <DataCard title="Trend">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Alerts</TableHead>
                <TableHead>Handled</TableHead>
                <TableHead>KOL Pending</TableHead>
                <TableHead>Withdrawal Pending</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(dashboardQuery.data?.trend ?? []).map((point) => (
                <TableRow key={point.date}>
                  <TableCell>{point.date}</TableCell>
                  <TableCell>{formatNumber(point.alertCount)}</TableCell>
                  <TableCell>{formatNumber(point.handledCount)}</TableCell>
                  <TableCell>{formatNumber(point.pendingKolReviewCount)}</TableCell>
                  <TableCell>{formatNumber(point.pendingWithdrawalReviewCount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DataCard title="Top Risk Affiliates">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Affiliate</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Alerts</TableHead>
                <TableHead>Critical</TableHead>
                <TableHead>Risk Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(dashboardQuery.data?.topAffiliates ?? []).map((item) => (
                <TableRow key={`${item.affiliateId}-${item.affiliateCode}`}>
                  <TableCell>
                    <div className="font-medium">{item.affiliateName || "-"}</div>
                    <div className="text-xs text-muted-foreground">{item.affiliateCode || item.affiliateId || "-"}</div>
                  </TableCell>
                  <TableCell>{item.ownerName || "-"}</TableCell>
                  <TableCell>{formatNumber(item.alertCount)}</TableCell>
                  <TableCell>{formatNumber(item.criticalAlertCount)}</TableCell>
                  <TableCell>{formatMoney(item.riskScore)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataCard>

        <DataCard title="Recent Risk Actions">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(dashboardQuery.data?.recentActions ?? []).map((item, index) => (
                <TableRow key={`${item.targetId}-${item.createdAt}-${index}`}>
                  <TableCell>{item.actionType || "-"}</TableCell>
                  <TableCell>
                    <div>{item.targetName || item.targetId || "-"}</div>
                    <div className="text-xs text-muted-foreground">{item.targetType || "-"}</div>
                  </TableCell>
                  <TableCell>{item.operatorName || item.operatorId || "-"}</TableCell>
                  <TableCell>{item.result || "-"}</TableCell>
                  <TableCell>{item.createdAt || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataCard>
      </div>
    </PageShell>
  );
}

export function AlertCenterView() {
  const [filters, setFilters] = useState<ListRiskAlertsQuery>({
    page: 1,
    pageSize: 10,
    severity: [],
    status: [],
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [query, setQuery] = useState(filters);
  const alertsQuery = useRiskAlerts(query);

  return (
    <PageShell
      title="Alert Center"
      description="Process real-time risk alerts, assign ownership, and move items through open, processing, resolved, or ignored states."
      actions={
        <Button type="button" variant="outline" onClick={() => void alertsQuery.refetch()} disabled={alertsQuery.isFetching}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total" value={formatNumber(alertsQuery.data?.summary.total)} />
        <StatCard label="Open" value={formatNumber(alertsQuery.data?.summary.openCount)} />
        <StatCard label="Processing" value={formatNumber(alertsQuery.data?.summary.processingCount)} />
        <StatCard label="Resolved" value={formatNumber(alertsQuery.data?.summary.resolvedCount)} />
        <StatCard label="Ignored" value={formatNumber(alertsQuery.data?.summary.ignoredCount)} />
      </div>

      <FiltersCard
        loading={alertsQuery.isFetching}
        onSearch={() => setQuery({ ...filters, page: 1 })}
        onReset={() => {
          const next = {
            page: 1,
            pageSize: 10,
            severity: [],
            status: [],
            sortBy: "createdAt",
            sortOrder: "desc",
          } satisfies ListRiskAlertsQuery;
          setFilters(next);
          setQuery(next);
        }}
      >
        <Field label="Keyword">
          <Input value={filters.keyword || ""} onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))} />
        </Field>
        <FilterSelect label="Severity" value={singleFromArray(filters.severity)} onChange={(value) => setFilters((current) => ({ ...current, severity: arrayFromSingle(value) }))} options={severityOptions} />
        <FilterSelect label="Status" value={singleFromArray(filters.status)} onChange={(value) => setFilters((current) => ({ ...current, status: arrayFromSingle(value) }))} options={alertStatusOptions} />
        <FilterSelect label="Scene" value={filters.scene || "ALL"} onChange={(value) => setFilters((current) => ({ ...current, scene: value === "ALL" ? "" : value }))} options={alertSceneOptions} />
      </FiltersCard>

      <DataCard title="Alert Queue" description="Buttons below perform actual backend status transitions for the selected alert.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alert</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Affiliate</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(alertsQuery.data?.items ?? []).map((row) => (
              <TableRow key={row.alertId}>
                <TableCell>
                  <div className="font-medium">{row.title || row.alertCode}</div>
                  <div className="text-xs text-muted-foreground">{row.description || row.alertType || "-"}</div>
                </TableCell>
                <TableCell><StatusBadge status={row.severity} /></TableCell>
                <TableCell><StatusBadge status={row.status} /></TableCell>
                <TableCell>
                  <div>{row.affiliateName || "-"}</div>
                  <div className="text-xs text-muted-foreground">{row.affiliateCode || row.affiliateId || "-"}</div>
                </TableCell>
                <TableCell>{row.assigneeName || row.assigneeId || "-"}</TableCell>
                <TableCell>{row.updatedAt || row.createdAt || "-"}</TableCell>
                <TableCell>
                  <AlertActions row={row} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <PaginationBar
          page={query.page ?? 1}
          pageSize={query.pageSize ?? 10}
          total={alertsQuery.data?.total ?? 0}
          onPageChange={(page) => setQuery((current) => ({ ...current, page }))}
        />
      </DataCard>
    </PageShell>
  );
}

export function KolRiskReviewView() {
  const [filters, setFilters] = useState<ListKolRiskReviewsQuery>({
    page: 1,
    pageSize: 10,
    riskLevel: [],
    reviewStatus: [],
    sortBy: "submittedAt",
    sortOrder: "desc",
  });
  const [query, setQuery] = useState(filters);
  const [detailReviewId, setDetailReviewId] = useState<number | undefined>(undefined);
  const reviewQuery = useKolRiskReviews(query);

  return (
    <PageShell
      title="KOL Risk Review"
      description="Review affiliate onboarding and KOL profile risks, inspect triggered rules, then approve, reject, or send to manual review."
      actions={
        <Button type="button" variant="outline" onClick={() => void reviewQuery.refetch()} disabled={reviewQuery.isFetching}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total" value={formatNumber(reviewQuery.data?.summary.total)} />
        <StatCard label="Pending" value={formatNumber(reviewQuery.data?.summary.pendingCount)} />
        <StatCard label="Approved" value={formatNumber(reviewQuery.data?.summary.approvedCount)} />
        <StatCard label="Rejected" value={formatNumber(reviewQuery.data?.summary.rejectedCount)} />
        <StatCard label="Manual Review" value={formatNumber(reviewQuery.data?.summary.manualReviewCount)} />
      </div>

      <FiltersCard
        loading={reviewQuery.isFetching}
        onSearch={() => setQuery({ ...filters, page: 1 })}
        onReset={() => {
          const next = {
            page: 1,
            pageSize: 10,
            riskLevel: [],
            reviewStatus: [],
            sortBy: "submittedAt",
            sortOrder: "desc",
          } satisfies ListKolRiskReviewsQuery;
          setFilters(next);
          setQuery(next);
        }}
      >
        <Field label="Keyword">
          <Input value={filters.keyword || ""} onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))} />
        </Field>
        <Field label="Affiliate Code">
          <Input value={filters.affiliateCode || ""} onChange={(event) => setFilters((current) => ({ ...current, affiliateCode: event.target.value }))} />
        </Field>
        <FilterSelect label="Risk Level" value={singleFromArray(filters.riskLevel)} onChange={(value) => setFilters((current) => ({ ...current, riskLevel: arrayFromSingle(value) }))} options={riskLevelOptions} />
        <FilterSelect label="Review Status" value={singleFromArray(filters.reviewStatus)} onChange={(value) => setFilters((current) => ({ ...current, reviewStatus: arrayFromSingle(value) }))} options={reviewStatusOptions} />
      </FiltersCard>

      <DataCard title="KOL Review Queue">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Affiliate</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(reviewQuery.data?.items ?? []).map((row) => (
              <TableRow key={row.reviewId}>
                <TableCell>
                  <div className="font-medium">{row.affiliateName || "-"}</div>
                  <div className="text-xs text-muted-foreground">{row.affiliateCode || row.affiliateId || "-"}</div>
                </TableCell>
                <TableCell><StatusBadge status={row.riskLevel} /></TableCell>
                <TableCell><StatusBadge status={row.reviewStatus} /></TableCell>
                <TableCell>{formatNumber(row.flagCount)} / {formatNumber(row.alertCount)}</TableCell>
                <TableCell>{row.ownerName || "-"}</TableCell>
                <TableCell>{row.submittedAt || "-"}</TableCell>
                <TableCell>
                  <Button type="button" size="sm" variant="outline" onClick={() => setDetailReviewId(row.reviewId)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Review
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <PaginationBar
          page={query.page ?? 1}
          pageSize={query.pageSize ?? 10}
          total={reviewQuery.data?.total ?? 0}
          onPageChange={(page) => setQuery((current) => ({ ...current, page }))}
        />
      </DataCard>

      <KolReviewDialog reviewId={detailReviewId} open={Boolean(detailReviewId)} onOpenChange={(open) => !open && setDetailReviewId(undefined)} />
    </PageShell>
  );
}

export function WithdrawalRiskReviewView() {
  const [filters, setFilters] = useState<ListWithdrawalRiskReviewsQuery>({
    page: 1,
    pageSize: 10,
    riskLevel: [],
    reviewStatus: [],
    sortBy: "submittedAt",
    sortOrder: "desc",
  });
  const [query, setQuery] = useState(filters);
  const [detailReviewId, setDetailReviewId] = useState<number | undefined>(undefined);
  const reviewQuery = useWithdrawalRiskReviews(query);

  return (
    <PageShell
      title="Withdrawal Risk Review"
      description="Handle withdrawal-related risk decisions with transaction amount, payout account, rule hits, and alert context in one place."
      actions={
        <Button type="button" variant="outline" onClick={() => void reviewQuery.refetch()} disabled={reviewQuery.isFetching}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total" value={formatNumber(reviewQuery.data?.summary.total)} />
        <StatCard label="Pending" value={formatNumber(reviewQuery.data?.summary.pendingCount)} />
        <StatCard label="Approved" value={formatNumber(reviewQuery.data?.summary.approvedCount)} />
        <StatCard label="Rejected" value={formatNumber(reviewQuery.data?.summary.rejectedCount)} />
        <StatCard label="Pending Amount" value={reviewQuery.data?.summary.pendingAmountUsd || "0.00"} />
      </div>

      <FiltersCard
        loading={reviewQuery.isFetching}
        onSearch={() => setQuery({ ...filters, page: 1 })}
        onReset={() => {
          const next = {
            page: 1,
            pageSize: 10,
            riskLevel: [],
            reviewStatus: [],
            sortBy: "submittedAt",
            sortOrder: "desc",
          } satisfies ListWithdrawalRiskReviewsQuery;
          setFilters(next);
          setQuery(next);
        }}
      >
        <Field label="Keyword">
          <Input value={filters.keyword || ""} onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))} />
        </Field>
        <Field label="Withdrawal ID">
          <Input value={filters.withdrawalId || ""} onChange={(event) => setFilters((current) => ({ ...current, withdrawalId: event.target.value }))} />
        </Field>
        <FilterSelect label="Risk Level" value={singleFromArray(filters.riskLevel)} onChange={(value) => setFilters((current) => ({ ...current, riskLevel: arrayFromSingle(value) }))} options={riskLevelOptions} />
        <FilterSelect label="Review Status" value={singleFromArray(filters.reviewStatus)} onChange={(value) => setFilters((current) => ({ ...current, reviewStatus: arrayFromSingle(value) }))} options={reviewStatusOptions} />
      </FiltersCard>

      <DataCard title="Withdrawal Review Queue">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Withdrawal</TableHead>
              <TableHead>Affiliate</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(reviewQuery.data?.items ?? []).map((row) => (
              <TableRow key={row.reviewId}>
                <TableCell>
                  <div className="font-medium">{row.withdrawalId || "-"}</div>
                  <div className="text-xs text-muted-foreground">Settlement #{row.settlementId || "-"}</div>
                </TableCell>
                <TableCell>
                  <div>{row.affiliateName || "-"}</div>
                  <div className="text-xs text-muted-foreground">{row.affiliateCode || row.affiliateId || "-"}</div>
                </TableCell>
                <TableCell>{row.amountUsd || "0.00"}</TableCell>
                <TableCell><StatusBadge status={row.riskLevel} /></TableCell>
                <TableCell><StatusBadge status={row.reviewStatus} /></TableCell>
                <TableCell>{formatNumber(row.flagCount)} / {formatNumber(row.alertCount)}</TableCell>
                <TableCell>
                  <Button type="button" size="sm" variant="outline" onClick={() => setDetailReviewId(row.reviewId)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Review
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <PaginationBar
          page={query.page ?? 1}
          pageSize={query.pageSize ?? 10}
          total={reviewQuery.data?.total ?? 0}
          onPageChange={(page) => setQuery((current) => ({ ...current, page }))}
        />
      </DataCard>

      <WithdrawalReviewDialog reviewId={detailReviewId} open={Boolean(detailReviewId)} onOpenChange={(open) => !open && setDetailReviewId(undefined)} />
    </PageShell>
  );
}

export function BlacklistManagementView() {
  const deleteMutation = useDeleteBlacklist();
  const [filters, setFilters] = useState<ListBlacklistEntriesQuery>({
    page: 1,
    pageSize: 10,
    riskLevel: [],
    status: [],
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [query, setQuery] = useState(filters);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BlacklistEntry | null>(null);
  const blacklistQuery = useBlacklists(query);

  async function handleDelete(item: BlacklistEntry) {
    const remark = window.prompt("Delete remark", item.reason || "") ?? "";
    try {
      await deleteMutation.mutateAsync({
        blacklistId: item.blacklistId,
        remark,
      });
      toast.success("Blacklist entry deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete blacklist failed");
    }
  }

  return (
    <PageShell
      title="Blacklist Management"
      description="Maintain deny-list entries for accounts, customers, devices, wallets, and other targets that should be blocked by risk policy."
      actions={
        <>
          <Button type="button" variant="outline" onClick={() => void blacklistQuery.refetch()} disabled={blacklistQuery.isFetching}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button type="button" onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" value={formatNumber(blacklistQuery.data?.summary.total)} />
        <StatCard label="Active" value={formatNumber(blacklistQuery.data?.summary.activeCount)} />
        <StatCard label="Expired" value={formatNumber(blacklistQuery.data?.summary.expiredCount)} />
        <StatCard label="Disabled" value={formatNumber(blacklistQuery.data?.summary.disabledCount)} />
      </div>

      <FiltersCard
        loading={blacklistQuery.isFetching}
        onSearch={() => setQuery({ ...filters, page: 1 })}
        onReset={() => {
          const next = {
            page: 1,
            pageSize: 10,
            riskLevel: [],
            status: [],
            sortBy: "createdAt",
            sortOrder: "desc",
          } satisfies ListBlacklistEntriesQuery;
          setFilters(next);
          setQuery(next);
        }}
      >
        <Field label="Keyword">
          <Input value={filters.keyword || ""} onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))} />
        </Field>
        <FilterSelect label="Target Type" value={filters.targetType || "ALL"} onChange={(value) => setFilters((current) => ({ ...current, targetType: value === "ALL" ? "" : value }))} options={["ALL", ...targetTypeOptions]} />
        <FilterSelect label="Risk Level" value={singleFromArray(filters.riskLevel)} onChange={(value) => setFilters((current) => ({ ...current, riskLevel: arrayFromSingle(value) }))} options={riskLevelOptions} />
        <FilterSelect label="Status" value={singleFromArray(filters.status)} onChange={(value) => setFilters((current) => ({ ...current, status: arrayFromSingle(value) }))} options={["ALL", ...blacklistStatusOptions]} />
      </FiltersCard>

      <DataCard title="Blacklist Entries">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Target</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Effective</TableHead>
              <TableHead>Expire</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(blacklistQuery.data?.items ?? []).map((item) => (
              <TableRow key={item.blacklistId}>
                <TableCell>
                  <div className="font-medium">{item.targetName || item.targetValue}</div>
                  <div className="text-xs text-muted-foreground">{item.targetType} · {item.targetValue}</div>
                </TableCell>
                <TableCell><StatusBadge status={item.riskLevel} /></TableCell>
                <TableCell><StatusBadge status={item.status} /></TableCell>
                <TableCell className="max-w-[280px]">{item.reason || "-"}</TableCell>
                <TableCell>{item.effectiveAt || "-"}</TableCell>
                <TableCell>{item.expireAt || "-"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => {
                      setEditing(item);
                      setDialogOpen(true);
                    }}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button type="button" size="sm" variant="destructive" disabled={deleteMutation.isPending} onClick={() => void handleDelete(item)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <PaginationBar
          page={query.page ?? 1}
          pageSize={query.pageSize ?? 10}
          total={blacklistQuery.data?.total ?? 0}
          onPageChange={(page) => setQuery((current) => ({ ...current, page }))}
        />
      </DataCard>

      <BlacklistDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />
    </PageShell>
  );
}

export function RiskRulesView() {
  const toggleMutation = useToggleRiskRule();
  const [filters, setFilters] = useState<ListRiskRulesQuery>({
    page: 1,
    pageSize: 10,
    riskLevel: [],
    sortBy: "priority",
    sortOrder: "asc",
  });
  const [query, setQuery] = useState(filters);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<number | undefined>(undefined);
  const rulesQuery = useRiskRules(query);

  async function handleToggle(item: RiskRuleItem) {
    try {
      await toggleMutation.mutateAsync({
        ruleId: item.ruleId,
        enabled: !item.enabled,
      });
      toast.success(`Rule ${item.enabled ? "disabled" : "enabled"}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Toggle rule failed");
    }
  }

  return (
    <PageShell
      title="Risk Rules"
      description="Maintain rule metadata, priority, trigger conditions, and downstream actions for the risk engine."
      actions={
        <>
          <Button type="button" variant="outline" onClick={() => void rulesQuery.refetch()} disabled={rulesQuery.isFetching}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button type="button" onClick={() => {
            setEditingRuleId(undefined);
            setDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            New Rule
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Rules" value={formatNumber(rulesQuery.data?.summary.total)} />
        <StatCard label="Enabled" value={formatNumber(rulesQuery.data?.summary.enabledCount)} />
        <StatCard label="Disabled" value={formatNumber(rulesQuery.data?.summary.disabledCount)} />
      </div>

      <FiltersCard
        loading={rulesQuery.isFetching}
        onSearch={() => setQuery({ ...filters, page: 1 })}
        onReset={() => {
          const next = {
            page: 1,
            pageSize: 10,
            riskLevel: [],
            sortBy: "priority",
            sortOrder: "asc",
          } satisfies ListRiskRulesQuery;
          setFilters(next);
          setQuery(next);
        }}
      >
        <Field label="Keyword">
          <Input value={filters.keyword || ""} onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))} />
        </Field>
        <FilterSelect label="Scene" value={filters.scene || "ALL"} onChange={(value) => setFilters((current) => ({ ...current, scene: value === "ALL" ? "" : value }))} options={["ALL", ...ruleSceneOptions]} />
        <FilterSelect label="Risk Level" value={singleFromArray(filters.riskLevel)} onChange={(value) => setFilters((current) => ({ ...current, riskLevel: arrayFromSingle(value) }))} options={riskLevelOptions} />
        <FilterSelect label="Enabled" value={filters.enabled || "ALL"} onChange={(value) => setFilters((current) => ({ ...current, enabled: value === "ALL" ? "" : value }))} options={["ALL", "true", "false"]} />
      </FiltersCard>

      <DataCard title="Rule List">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rule</TableHead>
              <TableHead>Scene</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(rulesQuery.data?.items ?? []).map((item) => (
              <TableRow key={item.ruleId}>
                <TableCell>
                  <div className="font-medium">{item.ruleName || item.ruleCode}</div>
                  <div className="text-xs text-muted-foreground">{item.ruleCode}</div>
                </TableCell>
                <TableCell>{item.scene || "-"}</TableCell>
                <TableCell><StatusBadge status={item.riskLevel} /></TableCell>
                <TableCell>{formatNumber(item.priority)}</TableCell>
                <TableCell><StatusBadge status={item.enabled ? "ENABLED" : "DISABLED"} /></TableCell>
                <TableCell>{item.updatedAt || "-"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => {
                      setEditingRuleId(item.ruleId);
                      setDialogOpen(true);
                    }}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button type="button" size="sm" variant={item.enabled ? "destructive" : "default"} disabled={toggleMutation.isPending} onClick={() => void handleToggle(item)}>
                      {item.enabled ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <PaginationBar
          page={query.page ?? 1}
          pageSize={query.pageSize ?? 10}
          total={rulesQuery.data?.total ?? 0}
          onPageChange={(page) => setQuery((current) => ({ ...current, page }))}
        />
      </DataCard>

      <RiskRuleDialog open={dialogOpen} onOpenChange={setDialogOpen} ruleId={editingRuleId} />
    </PageShell>
  );
}

export default function RiskControlPage({ view }: { view: RiskControlView }) {
  switch (view) {
    case "alert-center":
      return <AlertCenterView />;
    case "kol-review":
      return <KolRiskReviewView />;
    case "withdrawal-review":
      return <WithdrawalRiskReviewView />;
    case "blacklist":
      return <BlacklistManagementView />;
    case "rules":
      return <RiskRulesView />;
    case "dashboard":
    default:
      return <RiskDashboardView />;
  }
}
