import { useState } from "react";
import { AlertCircle, Loader2, RefreshCcw, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useMarketingActivitiesList,
  useMarketingMaterialsList,
  useMarketingWorkbenchStats,
  usePromotionLinkSummary,
} from "@/features/marketing-center/hooks";
import {
  EmptyState,
  Field,
  MarketingPageShell,
  MarketingStatusBadge,
  PaginationBar,
} from "@/features/marketing-center/shared";
import { joinTaxonomyNames, textOrDash } from "@/features/marketing-center/utils";
import type { PromotionLinkSummaryQuery, PromotionLinkSummaryValue } from "@/types/affinex";
import type { MarketingActivitiesQuery, MarketingMaterialsQuery } from "@/types/marketing-center";

const materialSnapshotQuery: MarketingMaterialsQuery = {
  page: 1,
  pageSize: 10,
  status: "CONTENT_STATUS_PUBLISHED",
  keyword: "",
};

const activitySnapshotQuery: MarketingActivitiesQuery = {
  page: 1,
  pageSize: 10,
  status: "CONTENT_STATUS_PUBLISHED",
  keyword: "",
};

const emptyPromotionLinkSummary: PromotionLinkSummaryValue = {
  dateRange: {
    startDate: "",
    endDate: "",
  },
  inventory: {
    approvedKolCount: 0,
    defaultLinkCount: 0,
    activeDefaultLinkCount: 0,
    activityLinkCount: 0,
    enabledActivityLinkCount: 0,
    totalLinkCount: 0,
    totalActiveLinkCount: 0,
  },
  attribution: {
    callbackAttributionEventCount: 0,
    callbackAttributionUserCount: 0,
  },
  performance: {
    registrationCount: 0,
    firstDepositUserCount: 0,
    successfulDepositAmountUsd: 0,
    tradeUserCount: 0,
    tradeVolume: 0,
    tradeAmountUsd: 0,
    earnedCommissionUsd: 0,
    paidCommissionUsd: 0,
  },
};

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createDefaultPromotionLinkSummaryQuery(): PromotionLinkSummaryQuery {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 29);

  return {
    startDate: formatDateInput(startDate),
    endDate: formatDateInput(endDate),
    affiliateId: "",
  };
}

function normalizeSummaryQuery(query: PromotionLinkSummaryQuery): PromotionLinkSummaryQuery {
  return {
    startDate: String(query.startDate ?? ""),
    endDate: String(query.endDate ?? ""),
    affiliateId: String(query.affiliateId ?? "").trim(),
  };
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDecimal(value: number, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatRate(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return "-";
  }
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function MetricTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-muted/10 p-4">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
      {hint ? <div className="mt-2 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

const MarketingReportsPage = () => {
  const [materialsQuery, setMaterialsQuery] = useState<MarketingMaterialsQuery>(materialSnapshotQuery);
  const [activitiesQuery, setActivitiesQuery] = useState<MarketingActivitiesQuery>(activitySnapshotQuery);
  const [draftSummaryQuery, setDraftSummaryQuery] = useState<PromotionLinkSummaryQuery>(() =>
    createDefaultPromotionLinkSummaryQuery(),
  );
  const [appliedSummaryQuery, setAppliedSummaryQuery] = useState<PromotionLinkSummaryQuery>(() =>
    createDefaultPromotionLinkSummaryQuery(),
  );

  const stats = useMarketingWorkbenchStats();
  const promotionSummary = usePromotionLinkSummary(appliedSummaryQuery);
  const materialSnapshot = useMarketingMaterialsList(materialsQuery);
  const activitySnapshot = useMarketingActivitiesList(activitiesQuery);

  const summary = promotionSummary.data ?? emptyPromotionLinkSummary;
  const inventory = summary.inventory;
  const attribution = summary.attribution;
  const performance = summary.performance;

  async function refresh() {
    await Promise.all([
      stats.refetch(),
      promotionSummary.refetch(),
      materialSnapshot.refetch(),
      activitySnapshot.refetch(),
    ]);
  }

  function applySummaryFilters() {
    const nextQuery = normalizeSummaryQuery(draftSummaryQuery);
    if (
      nextQuery.startDate &&
      nextQuery.endDate &&
      nextQuery.endDate < nextQuery.startDate
    ) {
      toast.error("End date cannot be earlier than start date.");
      return;
    }
    setAppliedSummaryQuery(nextQuery);
  }

  function resetSummaryFilters() {
    const nextQuery = createDefaultPromotionLinkSummaryQuery();
    setDraftSummaryQuery(nextQuery);
    setAppliedSummaryQuery(nextQuery);
  }

  return (
    <MarketingPageShell
      title="Data Reports"
      description="Promotion link reporting is now connected to the new Affinex summary API. This page combines approved-KOL link inventory, attribution and monetization totals with the existing content publish snapshots."
      actions={
        <Button
          type="button"
          variant="outline"
          onClick={() => void refresh()}
          disabled={
            stats.isFetching ||
            promotionSummary.isFetching ||
            materialSnapshot.isFetching ||
            activitySnapshot.isFetching
          }
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      }
    >
      <Tabs defaultValue="promotion" className="space-y-4">
        <TabsList className="grid h-auto grid-cols-3 rounded-2xl p-1">
          <TabsTrigger value="promotion">Promotion Link Summary</TabsTrigger>
          <TabsTrigger value="materials">Material Publish Snapshot</TabsTrigger>
          <TabsTrigger value="activities">Activity Publish Snapshot</TabsTrigger>
        </TabsList>

        <TabsContent value="promotion" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Summary filters</CardTitle>
              <CardDescription>
                Filter the approved-KOL promotion summary by settlement window and optional affiliate ID. The backend injects current data permission automatically for self-scoped users.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Start date">
                  <Input
                    type="date"
                    value={draftSummaryQuery.startDate ?? ""}
                    onChange={(event) =>
                      setDraftSummaryQuery((current) => ({
                        ...current,
                        startDate: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="End date">
                  <Input
                    type="date"
                    value={draftSummaryQuery.endDate ?? ""}
                    onChange={(event) =>
                      setDraftSummaryQuery((current) => ({
                        ...current,
                        endDate: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field
                  label="Affiliate ID"
                  hint="Optional. Leave empty to aggregate all approved KOLs within the current permission scope."
                >
                  <Input
                    value={draftSummaryQuery.affiliateId ?? ""}
                    onChange={(event) =>
                      setDraftSummaryQuery((current) => ({
                        ...current,
                        affiliateId: event.target.value,
                      }))
                    }
                    placeholder="affiliateId"
                  />
                </Field>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  Applied range: {textOrDash(summary.dateRange.startDate)} to{" "}
                  {textOrDash(summary.dateRange.endDate)}.
                  {appliedSummaryQuery.affiliateId
                    ? ` Current affiliate filter: ${appliedSummaryQuery.affiliateId}.`
                    : " Current affiliate filter: all approved KOLs."}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={resetSummaryFilters}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  <Button type="button" onClick={applySummaryFilters}>
                    Apply filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Current data scope</AlertTitle>
            <AlertDescription>
              Inventory totals come from approved KOL default short links plus generated activity links. Attribution uses callback invite events. Performance totals come from registration, first deposit, trade, earned commission, and paid commission facts. Link-level click PV or UV are still excluded until a dedicated click event table is added.
            </AlertDescription>
          </Alert>

          {promotionSummary.isLoading && !promotionSummary.data ? (
            <div className="flex h-60 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading promotion summary...
            </div>
          ) : (
            <>
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Link inventory</CardTitle>
                  <CardDescription>
                    Approved-KOL inventory built from default short links and activity-specific attribution links.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MetricTile
                    label="Approved KOLs"
                    value={formatInteger(inventory.approvedKolCount)}
                    hint="Current KOL scope where traffic_resource_status is APPROVED."
                  />
                  <MetricTile
                    label="Default links"
                    value={formatInteger(inventory.defaultLinkCount)}
                    hint={`Active defaults: ${formatInteger(inventory.activeDefaultLinkCount)}`}
                  />
                  <MetricTile
                    label="Activity links"
                    value={formatInteger(inventory.activityLinkCount)}
                    hint={`Enabled activity links: ${formatInteger(inventory.enabledActivityLinkCount)}`}
                  />
                  <MetricTile
                    label="Total active links"
                    value={formatInteger(inventory.totalActiveLinkCount)}
                    hint={`All stored links: ${formatInteger(inventory.totalLinkCount)}`}
                  />
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Attribution summary</CardTitle>
                  <CardDescription>
                    Callback invite events and the distinct users captured within the selected period.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <MetricTile
                    label="Callback attribution events"
                    value={formatInteger(attribution.callbackAttributionEventCount)}
                    hint="Raw callback_invite event count in the selected date range."
                  />
                  <MetricTile
                    label="Attributed users"
                    value={formatInteger(attribution.callbackAttributionUserCount)}
                    hint={`Distinct user share: ${formatRate(
                      attribution.callbackAttributionUserCount,
                      attribution.callbackAttributionEventCount,
                    )}`}
                  />
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Performance summary</CardTitle>
                  <CardDescription>
                    Conversion and monetization totals sourced from registration, deposit, trade, commission, and payout facts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MetricTile
                    label="Registrations"
                    value={formatInteger(performance.registrationCount)}
                    hint="Distinct registered users attributed to approved KOL referral codes."
                  />
                  <MetricTile
                    label="First deposit users"
                    value={formatInteger(performance.firstDepositUserCount)}
                    hint={`Registration to first deposit: ${formatRate(
                      performance.firstDepositUserCount,
                      performance.registrationCount,
                    )}`}
                  />
                  <MetricTile
                    label="Successful deposit amount"
                    value={formatUsd(performance.successfulDepositAmountUsd)}
                    hint="Paid-in capital using successful deposit facts."
                  />
                  <MetricTile
                    label="Trade users"
                    value={formatInteger(performance.tradeUserCount)}
                    hint={`Registration to trade: ${formatRate(
                      performance.tradeUserCount,
                      performance.registrationCount,
                    )}`}
                  />
                  <MetricTile
                    label="Trade volume"
                    value={formatDecimal(performance.tradeVolume, 2)}
                    hint="Unified lot-size metric using volume."
                  />
                  <MetricTile
                    label="Trade amount"
                    value={formatUsd(performance.tradeAmountUsd)}
                    hint="Aggregated by open_value_usd."
                  />
                  <MetricTile
                    label="Earned commission"
                    value={formatUsd(performance.earnedCommissionUsd)}
                    hint="Commission already calculated or finished."
                  />
                  <MetricTile
                    label="Paid commission"
                    value={formatUsd(performance.paidCommissionUsd)}
                    hint={`Paid versus earned: ${formatRate(
                      performance.paidCommissionUsd,
                      performance.earnedCommissionUsd,
                    )}`}
                  />
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Derived ratios</CardTitle>
                  <CardDescription>
                    Quick review metrics built from the same backend summary response without introducing extra data sources.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MetricTile
                    label="Active link ratio"
                    value={formatRate(inventory.totalActiveLinkCount, inventory.totalLinkCount)}
                    hint="Active links divided by all stored links."
                  />
                  <MetricTile
                    label="Activity link share"
                    value={formatRate(inventory.activityLinkCount, inventory.totalLinkCount)}
                    hint="Activity links divided by all stored links."
                  />
                  <MetricTile
                    label="Callback user rate"
                    value={formatRate(
                      attribution.callbackAttributionUserCount,
                      attribution.callbackAttributionEventCount,
                    )}
                    hint="Distinct attributed users divided by raw callback events."
                  />
                  <MetricTile
                    label="Deposit to trade activation"
                    value={formatRate(
                      performance.tradeUserCount,
                      performance.firstDepositUserCount,
                    )}
                    hint="Trade users divided by first deposit users."
                  />
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricTile label="Draft Materials" value={stats.isLoading || stats.isError ? "-" : stats.materials?.draft ?? 0} />
            <MetricTile label="Pending Materials" value={stats.isLoading || stats.isError ? "-" : stats.materials?.pendingReview ?? 0} />
            <MetricTile label="Published Materials" value={stats.isLoading || stats.isError ? "-" : stats.materials?.published ?? 0} />
            <MetricTile label="Rejected Materials" value={stats.isLoading || stats.isError ? "-" : stats.materials?.rejected ?? 0} />
            <MetricTile label="Offline Materials" value={stats.isLoading || stats.isError ? "-" : stats.materials?.offline ?? 0} />
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Published materials</CardTitle>
              <CardDescription>
                Snapshot view of currently published materials from the material list API.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {materialSnapshot.isLoading ? (
                <div className="flex h-52 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading published materials...
                </div>
              ) : (materialSnapshot.data?.items ?? []).length === 0 ? (
                <EmptyState
                  title="No published materials"
                  description="The material publish snapshot is currently empty."
                />
              ) : (
                <>
                  <div className="overflow-x-auto rounded-2xl border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Language</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Channels</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Published</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(materialSnapshot.data?.items ?? []).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{textOrDash(item.title)}</TableCell>
                            <TableCell>{textOrDash(item.materialType)}</TableCell>
                            <TableCell>{textOrDash(item.language?.name)}</TableCell>
                            <TableCell>{textOrDash(item.category?.name)}</TableCell>
                            <TableCell>{joinTaxonomyNames(item.channels)}</TableCell>
                            <TableCell>
                              <MarketingStatusBadge status={item.status} />
                            </TableCell>
                            <TableCell>{textOrDash(item.publishedAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <PaginationBar
                    page={materialsQuery.page}
                    pageSize={materialsQuery.pageSize}
                    total={materialSnapshot.data?.total ?? 0}
                    loading={materialSnapshot.isFetching}
                    onPrev={() =>
                      setMaterialsQuery((current) => ({
                        ...current,
                        page: Math.max(1, current.page - 1),
                      }))
                    }
                    onNext={() =>
                      setMaterialsQuery((current) => ({
                        ...current,
                        page: current.page + 1,
                      }))
                    }
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricTile label="Draft Activities" value={stats.isLoading || stats.isError ? "-" : stats.activities?.draft ?? 0} />
            <MetricTile label="Pending Activities" value={stats.isLoading || stats.isError ? "-" : stats.activities?.pendingReview ?? 0} />
            <MetricTile label="Published Activities" value={stats.isLoading || stats.isError ? "-" : stats.activities?.published ?? 0} />
            <MetricTile label="Rejected Activities" value={stats.isLoading || stats.isError ? "-" : stats.activities?.rejected ?? 0} />
            <MetricTile label="Offline Activities" value={stats.isLoading || stats.isError ? "-" : stats.activities?.offline ?? 0} />
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Published activities</CardTitle>
              <CardDescription>
                Snapshot view of currently published activities from the activity list API.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activitySnapshot.isLoading ? (
                <div className="flex h-52 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading published activities...
                </div>
              ) : (activitySnapshot.data?.items ?? []).length === 0 ? (
                <EmptyState
                  title="No published activities"
                  description="The activity publish snapshot is currently empty."
                />
              ) : (
                <>
                  <div className="overflow-x-auto rounded-2xl border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Language</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Carousel</TableHead>
                          <TableHead>Channels</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Published</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(activitySnapshot.data?.items ?? []).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{textOrDash(item.title)}</TableCell>
                            <TableCell>{textOrDash(item.language?.name)}</TableCell>
                            <TableCell>{textOrDash(item.category?.name)}</TableCell>
                            <TableCell>{item.carousel ? "Yes" : "No"}</TableCell>
                            <TableCell>{joinTaxonomyNames(item.channels)}</TableCell>
                            <TableCell>
                              <MarketingStatusBadge status={item.status} />
                            </TableCell>
                            <TableCell>{textOrDash(item.publishedAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <PaginationBar
                    page={activitiesQuery.page}
                    pageSize={activitiesQuery.pageSize}
                    total={activitySnapshot.data?.total ?? 0}
                    loading={activitySnapshot.isFetching}
                    onPrev={() =>
                      setActivitiesQuery((current) => ({
                        ...current,
                        page: Math.max(1, current.page - 1),
                      }))
                    }
                    onNext={() =>
                      setActivitiesQuery((current) => ({
                        ...current,
                        page: current.page + 1,
                      }))
                    }
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MarketingPageShell>
  );
};

export default MarketingReportsPage;
