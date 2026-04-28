import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, RefreshCcw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { affiliateConsoleApi } from "@/api/affiliate-console";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/features/console/shared";
import { settlementQueryKeys, useSettlementDashboard, useSettlementPaymentSummaries, useSettlementStatements } from "@/features/settlement-center/hooks";
import {
  metricText,
  PageShell,
  PaymentExecutionDialog,
  PaymentSummaryDetailDialog,
  StatementDetailDialog,
} from "@/features/settlement-center/shared";
import {
  PaymentSummariesTable,
  StatementFilters,
  StatementsTable,
  SummaryFilters,
} from "@/features/settlement-center/tables";
import type {
  SettlementPaymentSummaryQuery,
  SettlementPaymentSummaryRow,
  SettlementStatementQuery,
  SettlementStatementRow,
} from "@/types/affiliate-console";

const reviewStatuses = ["PENDING", "APPLIED", "APPROVED", "DECLINED", "PAID"];

export function DashboardView() {
  const dashboardQuery = useSettlementDashboard();

  return (
    <PageShell
      title="Settlement Dashboard"
      description="Operational overview of pending applications, review queue, pending payout, paid summaries, declined items, and outstanding payable amount."
      actions={
        <Button type="button" variant="outline" onClick={() => void dashboardQuery.refetch()} disabled={dashboardQuery.isFetching}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Pending Apply" value={dashboardQuery.isLoading ? "..." : metricText(dashboardQuery.data?.pendingApply)} />
        <StatCard label="Pending Review" value={dashboardQuery.isLoading ? "..." : metricText(dashboardQuery.data?.pendingReview)} />
        <StatCard label="Pending Payout" value={dashboardQuery.isLoading ? "..." : metricText(dashboardQuery.data?.pendingPayout)} />
        <StatCard label="Paid" value={dashboardQuery.isLoading ? "..." : metricText(dashboardQuery.data?.paid)} />
        <StatCard label="Declined" value={dashboardQuery.isLoading ? "..." : metricText(dashboardQuery.data?.declined)} />
        <StatCard label="Outstanding Payable" value={dashboardQuery.data?.totalPayableAmount ?? "0.00"} />
      </div>
    </PageShell>
  );
}

export function StatementView() {
  const [filters, setFilters] = useState<SettlementStatementQuery>({
    currentPage: 1,
    pageSize: 20,
    includeNotWithdraw: true,
  });
  const [query, setQuery] = useState(filters);
  const [detailRow, setDetailRow] = useState<SettlementStatementRow | null>(null);
  const statementsQuery = useSettlementStatements(query);

  return (
    <PageShell
      title="Settlement Statement"
      description="Statement list over payment_history with affiliate, status, date range, period, payment id, attachments, and commission drilldown."
    >
      <StatementFilters
        filters={filters}
        onChange={setFilters}
        onSearch={() => setQuery({ ...filters, currentPage: 1 })}
        onReset={() => {
          const next = { currentPage: 1, pageSize: 20, includeNotWithdraw: true } satisfies SettlementStatementQuery;
          setFilters(next);
          setQuery(next);
        }}
        loading={statementsQuery.isFetching}
      />

      <StatementsTable
        data={statementsQuery.data}
        loading={statementsQuery.isLoading || statementsQuery.isFetching}
        page={query.currentPage ?? 1}
        pageSize={query.pageSize ?? 20}
        onPageChange={(page) => setQuery((current) => ({ ...current, currentPage: page }))}
        onView={setDetailRow}
      />

      <StatementDetailDialog row={detailRow} open={Boolean(detailRow)} onOpenChange={(open) => !open && setDetailRow(null)} />
    </PageShell>
  );
}

export function PaymentSummaryView() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<SettlementPaymentSummaryQuery>({ page: 1, pageSize: 20 });
  const [query, setQuery] = useState(filters);
  const [candidateFilters, setCandidateFilters] = useState<SettlementStatementQuery>({
    currentPage: 1,
    pageSize: 20,
    status: "PENDING",
  });
  const [candidateQuery, setCandidateQuery] = useState(candidateFilters);
  const [selectedStatementIds, setSelectedStatementIds] = useState<number[]>([]);
  const [detailSummaryId, setDetailSummaryId] = useState<number | undefined>(undefined);
  const [merging, setMerging] = useState(false);

  const summaryQuery = useSettlementPaymentSummaries(query);
  const candidatesQuery = useSettlementStatements(candidateQuery);

  async function refreshAll() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: settlementQueryKeys.summaries(query) }),
      queryClient.invalidateQueries({ queryKey: settlementQueryKeys.statements(candidateQuery) }),
      queryClient.invalidateQueries({ queryKey: ["settlement-center", "dashboard"] }),
    ]);
  }

  async function handleMerge() {
    if (selectedStatementIds.length === 0) {
      toast.error("Select at least one pending statement.");
      return;
    }
    setMerging(true);
    try {
      await affiliateConsoleApi.mergeSettlementPaymentSummary(selectedStatementIds);
      toast.success("Payment summary created.");
      setSelectedStatementIds([]);
      await refreshAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Merge failed");
    } finally {
      setMerging(false);
    }
  }

  return (
    <PageShell
      title="Payment Summary"
      description="payment_summary list, detail, merge flow, and attachment visibility."
      actions={
        <Button type="button" variant="outline" onClick={() => void refreshAll()} disabled={summaryQuery.isFetching || candidatesQuery.isFetching}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      }
    >
      <SummaryFilters
        filters={filters}
        onChange={setFilters}
        onSearch={() => setQuery({ ...filters, page: 1 })}
        onReset={() => {
          const next = { page: 1, pageSize: 20 } satisfies SettlementPaymentSummaryQuery;
          setFilters(next);
          setQuery(next);
        }}
        loading={summaryQuery.isFetching}
      />

      <PaymentSummariesTable
        items={summaryQuery.data?.items ?? []}
        total={summaryQuery.data?.total ?? 0}
        page={query.page ?? 1}
        pageSize={query.pageSize ?? 20}
        summaryAmount={summaryQuery.data?.summaryAmount}
        loading={summaryQuery.isLoading || summaryQuery.isFetching}
        onPageChange={(page) => setQuery((current) => ({ ...current, page }))}
        onView={(row) => setDetailSummaryId(Number(row.id))}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Merge Pending Statements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatementFilters
            filters={candidateFilters}
            onChange={setCandidateFilters}
            onSearch={() => setCandidateQuery({ ...candidateFilters, currentPage: 1, status: "PENDING", includeNotWithdraw: false })}
            onReset={() => {
              const next = { currentPage: 1, pageSize: 20, status: "PENDING" } satisfies SettlementStatementQuery;
              setCandidateFilters(next);
              setCandidateQuery(next);
              setSelectedStatementIds([]);
            }}
            loading={candidatesQuery.isFetching}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">Selected {selectedStatementIds.length} statement(s) for merge.</div>
            <Button type="button" onClick={() => void handleMerge()} disabled={merging || selectedStatementIds.length === 0}>
              {merging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Create Summary
            </Button>
          </div>

          <StatementsTable
            data={candidatesQuery.data}
            loading={candidatesQuery.isLoading || candidatesQuery.isFetching}
            page={candidateQuery.currentPage ?? 1}
            pageSize={candidateQuery.pageSize ?? 20}
            onPageChange={(page) => setCandidateQuery((current) => ({ ...current, currentPage: page }))}
            onView={() => undefined}
            selectedIds={selectedStatementIds}
            onToggleSelect={(id, checked) =>
              setSelectedStatementIds((current) => (checked ? Array.from(new Set([...current, id])) : current.filter((item) => item !== id)))
            }
            showSelect
          />
        </CardContent>
      </Card>

      <PaymentSummaryDetailDialog summaryId={detailSummaryId} open={Boolean(detailSummaryId)} onOpenChange={(open) => !open && setDetailSummaryId(undefined)} />
    </PageShell>
  );
}

export function WithdrawalReviewView() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<SettlementPaymentSummaryQuery>({ page: 1, pageSize: 20 });
  const [query, setQuery] = useState(filters);
  const [detailSummaryId, setDetailSummaryId] = useState<number | undefined>(undefined);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const summariesQuery = useSettlementPaymentSummaries(query);

  async function updateStatus(id: number, status: string, note?: string) {
    setSubmittingId(id);
    try {
      await affiliateConsoleApi.updateSettlementPaymentSummary({ id, status, note });
      toast.success(`Summary moved to ${status}.`);
      await queryClient.invalidateQueries({ queryKey: ["settlement-center"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Status update failed");
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <PageShell
      title="Withdrawal Review"
      description="Review flow over payment_summary with clear PENDING / APPLIED / APPROVED / DECLINED / PAID stages."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {reviewStatuses.map((status) => {
          const count = (summariesQuery.data?.items ?? []).filter((item) => item.status === status).length;
          return <StatCard key={status} label={status} value={count} />;
        })}
      </div>

      <SummaryFilters
        filters={filters}
        onChange={setFilters}
        onSearch={() => setQuery({ ...filters, page: 1 })}
        onReset={() => {
          const next = { page: 1, pageSize: 20 } satisfies SettlementPaymentSummaryQuery;
          setFilters(next);
          setQuery(next);
        }}
        loading={summariesQuery.isFetching}
      />

      <PaymentSummariesTable
        items={summariesQuery.data?.items ?? []}
        total={summariesQuery.data?.total ?? 0}
        page={query.page ?? 1}
        pageSize={query.pageSize ?? 20}
        summaryAmount={summariesQuery.data?.summaryAmount}
        loading={summariesQuery.isLoading || summariesQuery.isFetching}
        onPageChange={(page) => setQuery((current) => ({ ...current, page }))}
        onView={(row) => setDetailSummaryId(Number(row.id))}
        renderActions={(row) => {
          const id = Number(row.id ?? 0);
          const loading = submittingId === id;
          if (row.status === "PENDING" || row.status === "DECLINED") {
            return (
              <Button type="button" size="sm" disabled={loading} onClick={() => void updateStatus(id, "APPLIED")}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Submit
              </Button>
            );
          }
          if (row.status === "APPLIED") {
            return (
              <>
                <Button type="button" size="sm" disabled={loading} onClick={() => void updateStatus(id, "APPROVED")}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={loading}
                  onClick={() => {
                    const note = window.prompt("Decline note", row.note ?? "") ?? "";
                    void updateStatus(id, "DECLINED", note);
                  }}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Decline
                </Button>
              </>
            );
          }
          return null;
        }}
      />

      <PaymentSummaryDetailDialog summaryId={detailSummaryId} open={Boolean(detailSummaryId)} onOpenChange={(open) => !open && setDetailSummaryId(undefined)} />
    </PageShell>
  );
}

export function PaymentExecutionView() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<SettlementPaymentSummaryQuery>({
    page: 1,
    pageSize: 20,
    status: "APPROVED",
  });
  const [query, setQuery] = useState(filters);
  const [detailSummaryId, setDetailSummaryId] = useState<number | undefined>(undefined);
  const [executionRow, setExecutionRow] = useState<SettlementPaymentSummaryRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const summariesQuery = useSettlementPaymentSummaries(query);

  async function handleExecute(payload: { payoutDate: string; paymentMethods: string; note: string; paymentFile: string[] }) {
    if (!executionRow?.id) {
      return;
    }
    setSubmitting(true);
    try {
      await affiliateConsoleApi.updateSettlementPaymentSummary({
        id: Number(executionRow.id),
        status: "PAID",
        payoutDate: payload.payoutDate,
        paymentMethods: payload.paymentMethods,
        note: payload.note,
        paymentFile: payload.paymentFile,
      });
      toast.success("Payment marked as paid.");
      setExecutionRow(null);
      await queryClient.invalidateQueries({ queryKey: ["settlement-center"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment execution failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell
      title="Payment Execution"
      description="Finance operation for APPROVED -> PAID with payoutDate, paymentMethods, paymentFile, and note."
    >
      <SummaryFilters
        filters={filters}
        onChange={setFilters}
        onSearch={() => setQuery({ ...filters, page: 1 })}
        onReset={() => {
          const next = { page: 1, pageSize: 20, status: "APPROVED" } satisfies SettlementPaymentSummaryQuery;
          setFilters(next);
          setQuery(next);
        }}
        loading={summariesQuery.isFetching}
      />

      <PaymentSummariesTable
        items={summariesQuery.data?.items ?? []}
        total={summariesQuery.data?.total ?? 0}
        page={query.page ?? 1}
        pageSize={query.pageSize ?? 20}
        summaryAmount={summariesQuery.data?.summaryAmount}
        loading={summariesQuery.isLoading || summariesQuery.isFetching}
        onPageChange={(page) => setQuery((current) => ({ ...current, page }))}
        onView={(row) => setDetailSummaryId(Number(row.id))}
        renderActions={(row) =>
          row.status === "APPROVED" ? (
            <Button type="button" size="sm" onClick={() => setExecutionRow(row)}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Execute
            </Button>
          ) : null
        }
      />

      <PaymentSummaryDetailDialog summaryId={detailSummaryId} open={Boolean(detailSummaryId)} onOpenChange={(open) => !open && setDetailSummaryId(undefined)} />
      <PaymentExecutionDialog row={executionRow} open={Boolean(executionRow)} onOpenChange={(open) => !open && setExecutionRow(null)} onSubmit={handleExecute} submitting={submitting} />
    </PageShell>
  );
}

export function HistoryView() {
  const [statementFilters, setStatementFilters] = useState<SettlementStatementQuery>({
    currentPage: 1,
    pageSize: 20,
    includeNotWithdraw: false,
  });
  const [statementQuery, setStatementQuery] = useState(statementFilters);
  const [summaryFilters, setSummaryFilters] = useState<SettlementPaymentSummaryQuery>({
    page: 1,
    pageSize: 20,
  });
  const [summaryQuery, setSummaryQuery] = useState(summaryFilters);
  const [statementDetailRow, setStatementDetailRow] = useState<SettlementStatementRow | null>(null);
  const [summaryDetailId, setSummaryDetailId] = useState<number | undefined>(undefined);
  const statements = useSettlementStatements(statementQuery);
  const summaries = useSettlementPaymentSummaries(summaryQuery);

  return (
    <PageShell
      title="Settlement History"
      description="Unified processed record lookup across statements and payment summaries."
    >
      <Tabs defaultValue="statements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="statements">Statements</TabsTrigger>
          <TabsTrigger value="summaries">Payment Summaries</TabsTrigger>
        </TabsList>
        <TabsContent value="statements" className="space-y-4">
          <StatementFilters
            filters={statementFilters}
            onChange={setStatementFilters}
            onSearch={() => setStatementQuery({ ...statementFilters, currentPage: 1, includeNotWithdraw: false })}
            onReset={() => {
              const next = { currentPage: 1, pageSize: 20, includeNotWithdraw: false } satisfies SettlementStatementQuery;
              setStatementFilters(next);
              setStatementQuery(next);
            }}
            loading={statements.isFetching}
          />
          <StatementsTable
            data={statements.data}
            loading={statements.isLoading || statements.isFetching}
            page={statementQuery.currentPage ?? 1}
            pageSize={statementQuery.pageSize ?? 20}
            onPageChange={(page) => setStatementQuery((current) => ({ ...current, currentPage: page }))}
            onView={setStatementDetailRow}
          />
        </TabsContent>
        <TabsContent value="summaries" className="space-y-4">
          <SummaryFilters
            filters={summaryFilters}
            onChange={setSummaryFilters}
            onSearch={() => setSummaryQuery({ ...summaryFilters, page: 1 })}
            onReset={() => {
              const next = { page: 1, pageSize: 20 } satisfies SettlementPaymentSummaryQuery;
              setSummaryFilters(next);
              setSummaryQuery(next);
            }}
            loading={summaries.isFetching}
          />
          <PaymentSummariesTable
            items={summaries.data?.items ?? []}
            total={summaries.data?.total ?? 0}
            page={summaryQuery.page ?? 1}
            pageSize={summaryQuery.pageSize ?? 20}
            summaryAmount={summaries.data?.summaryAmount}
            loading={summaries.isLoading || summaries.isFetching}
            onPageChange={(page) => setSummaryQuery((current) => ({ ...current, page }))}
            onView={(row) => setSummaryDetailId(Number(row.id))}
          />
        </TabsContent>
      </Tabs>

      <StatementDetailDialog row={statementDetailRow} open={Boolean(statementDetailRow)} onOpenChange={(open) => !open && setStatementDetailRow(null)} />
      <PaymentSummaryDetailDialog summaryId={summaryDetailId} open={Boolean(summaryDetailId)} onOpenChange={(open) => !open && setSummaryDetailId(undefined)} />
    </PageShell>
  );
}

export function ExceptionView() {
  const queryClient = useQueryClient();
  const [statementFilters, setStatementFilters] = useState<SettlementStatementQuery>({
    currentPage: 1,
    pageSize: 20,
    status: "DECLINED",
    includeNotWithdraw: false,
  });
  const [statementQuery, setStatementQuery] = useState(statementFilters);
  const [summaryFilters, setSummaryFilters] = useState<SettlementPaymentSummaryQuery>({
    page: 1,
    pageSize: 20,
    status: "DECLINED",
  });
  const [summaryQuery, setSummaryQuery] = useState(summaryFilters);
  const [summaryDetailId, setSummaryDetailId] = useState<number | undefined>(undefined);
  const [statementDetailRow, setStatementDetailRow] = useState<SettlementStatementRow | null>(null);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const declinedStatements = useSettlementStatements(statementQuery);
  const declinedSummaries = useSettlementPaymentSummaries(summaryQuery);

  async function resubmitStatement(id: number) {
    setSubmittingId(id);
    try {
      await affiliateConsoleApi.updateSettlementStatement({ id, status: "PENDING" });
      toast.success("Statement moved back to PENDING.");
      await queryClient.invalidateQueries({ queryKey: ["settlement-center"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Statement resubmit failed");
    } finally {
      setSubmittingId(null);
    }
  }

  async function resubmitSummary(id: number) {
    setSubmittingId(id);
    try {
      await affiliateConsoleApi.updateSettlementPaymentSummary({ id, status: "APPLIED" });
      toast.success("Summary moved back to APPLIED.");
      await queryClient.invalidateQueries({ queryKey: ["settlement-center"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Summary resubmit failed");
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <PageShell
      title="Settlement Exception"
      description="Minimal but real exception workspace focused on DECLINED records and resubmission support."
    >
      <Tabs defaultValue="statements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="statements">Declined Statements</TabsTrigger>
          <TabsTrigger value="summaries">Declined Summaries</TabsTrigger>
        </TabsList>
        <TabsContent value="statements" className="space-y-4">
          <StatementFilters
            filters={statementFilters}
            onChange={setStatementFilters}
            onSearch={() => setStatementQuery({ ...statementFilters, currentPage: 1, includeNotWithdraw: false })}
            onReset={() => {
              const next = {
                currentPage: 1,
                pageSize: 20,
                status: "DECLINED",
                includeNotWithdraw: false,
              } satisfies SettlementStatementQuery;
              setStatementFilters(next);
              setStatementQuery(next);
            }}
            loading={declinedStatements.isFetching}
          />
          <StatementsTable
            data={declinedStatements.data}
            loading={declinedStatements.isLoading || declinedStatements.isFetching}
            page={statementQuery.currentPage ?? 1}
            pageSize={statementQuery.pageSize ?? 20}
            onPageChange={(page) => setStatementQuery((current) => ({ ...current, currentPage: page }))}
            onView={setStatementDetailRow}
          />
          <div className="flex flex-wrap gap-2">
            {(declinedStatements.data?.items ?? [])
              .filter((row) => row.status === "DECLINED")
              .map((row) => (
                <Button key={`statement-${row.id}`} type="button" size="sm" variant="outline" disabled={submittingId === Number(row.id)} onClick={() => void resubmitStatement(Number(row.id))}>
                  {submittingId === Number(row.id) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                  Re-submit #{row.id}
                </Button>
              ))}
          </div>
        </TabsContent>
        <TabsContent value="summaries" className="space-y-4">
          <SummaryFilters
            filters={summaryFilters}
            onChange={setSummaryFilters}
            onSearch={() => setSummaryQuery({ ...summaryFilters, page: 1 })}
            onReset={() => {
              const next = { page: 1, pageSize: 20, status: "DECLINED" } satisfies SettlementPaymentSummaryQuery;
              setSummaryFilters(next);
              setSummaryQuery(next);
            }}
            loading={declinedSummaries.isFetching}
          />
          <PaymentSummariesTable
            items={declinedSummaries.data?.items ?? []}
            total={declinedSummaries.data?.total ?? 0}
            page={summaryQuery.page ?? 1}
            pageSize={summaryQuery.pageSize ?? 20}
            summaryAmount={declinedSummaries.data?.summaryAmount}
            loading={declinedSummaries.isLoading || declinedSummaries.isFetching}
            onPageChange={(page) => setSummaryQuery((current) => ({ ...current, page }))}
            onView={(row) => setSummaryDetailId(Number(row.id))}
            renderActions={(row) =>
              row.status === "DECLINED" ? (
                <Button type="button" size="sm" variant="outline" disabled={submittingId === Number(row.id)} onClick={() => void resubmitSummary(Number(row.id))}>
                  {submittingId === Number(row.id) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                  Re-submit
                </Button>
              ) : null
            }
          />
        </TabsContent>
      </Tabs>

      <StatementDetailDialog row={statementDetailRow} open={Boolean(statementDetailRow)} onOpenChange={(open) => !open && setStatementDetailRow(null)} />
      <PaymentSummaryDetailDialog summaryId={summaryDetailId} open={Boolean(summaryDetailId)} onOpenChange={(open) => !open && setSummaryDetailId(undefined)} />
    </PageShell>
  );
}

export function ConfigView() {
  return (
    <PageShell
      title="Settlement Config"
      description="Read-only settlement rules and current constraints from the existing backend workflow."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Main Chain</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <code>affiliate_commission_list</code> {"->"} <code>payment_history</code> {"->"} <code>payment_summary</code>
            </div>
            <div><code>apply_withdraw</code> on commission rows controls unwithdrawn vs applied state.</div>
            <div><code>affiliate_balance</code> is not part of settlement center execution flow.</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Flow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>Statement initial status: <code>NOTWITHDRAW</code>.</div>
            <div>User withdraw application moves statement to <code>PENDING</code>.</div>
            <div>
              Summary review flow: <code>PENDING/DECLINED</code> {"->"} <code>APPLIED</code> {"->"} <code>APPROVED/DECLINED</code> {"->"} <code>PAID</code>.
            </div>
            <div>Finance payment is manual/offline. The system records payout facts and attachments.</div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
