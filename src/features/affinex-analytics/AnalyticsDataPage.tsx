import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCcw, RotateCcw, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/features/console/shared";
import type { AffinexAnalyticsDataPageConfig } from "@/features/affinex-analytics/config";
import {
  useAffinexAnalytics,
  useAnalyticsDashboardConfig,
} from "@/features/affinex-analytics/hooks";
import { buildAnalyticsSections } from "@/features/affinex-analytics/renderers";
import {
  AffinexPageShell,
  createFilterForm,
  EmptyState,
  mergeDashboardWidgets,
  textOrDash,
  toAnalyticsQuery,
  type AnalyticsFilterForm,
} from "@/features/affinex-analytics/shared";
import type { AnalyticsQuery } from "@/types/affinex";

export default function AnalyticsDataPage({
  page,
}: {
  page: AffinexAnalyticsDataPageConfig;
}) {
  const dashboardConfig = useAnalyticsDashboardConfig(page.resourceCode);
  const [filtersReady, setFiltersReady] = useState(false);
  const [draftFilters, setDraftFilters] = useState<AnalyticsFilterForm>(() =>
    createFilterForm(page, page.defaultDatePreset),
  );
  const [appliedQuery, setAppliedQuery] = useState<AnalyticsQuery>(() =>
    toAnalyticsQuery(createFilterForm(page, page.defaultDatePreset)),
  );

  useEffect(() => {
    if (dashboardConfig.isPending) {
      return;
    }

    const preset =
      dashboardConfig.data?.defaultDatePreset || page.defaultDatePreset;
    const nextForm = createFilterForm(page, preset);
    setDraftFilters(nextForm);
    setAppliedQuery(toAnalyticsQuery(nextForm));
    setFiltersReady(true);
  }, [
    dashboardConfig.data?.defaultDatePreset,
    dashboardConfig.isPending,
    page,
  ]);

  const analyticsQuery = useAffinexAnalytics(
    page.endpoint,
    appliedQuery,
    filtersReady,
  );

  const widgets = useMemo(
    () =>
      mergeDashboardWidgets(
        page.defaultWidgets,
        dashboardConfig.data?.widgets,
      ),
    [dashboardConfig.data?.widgets, page.defaultWidgets],
  );

  const sections = useMemo(() => {
    if (!analyticsQuery.data) {
      return [];
    }
    return buildAnalyticsSections(page, widgets, analyticsQuery.data);
  }, [analyticsQuery.data, page, widgets]);

  function updateDraft<K extends keyof AnalyticsFilterForm>(
    key: K,
    value: AnalyticsFilterForm[K],
  ) {
    setDraftFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function applyFilters() {
    if (
      draftFilters.startDate &&
      draftFilters.endDate &&
      draftFilters.endDate < draftFilters.startDate
    ) {
      toast.error("End date cannot be earlier than start date.");
      return;
    }
    if (
      page.supportsCompare &&
      draftFilters.compareStartDate &&
      draftFilters.compareEndDate &&
      draftFilters.compareEndDate < draftFilters.compareStartDate
    ) {
      toast.error(
        "Comparison end date cannot be earlier than comparison start date.",
      );
      return;
    }
    if (page.supportsTopN && draftFilters.topN) {
      const topN = Number(draftFilters.topN);
      if (!Number.isFinite(topN) || topN <= 0) {
        toast.error("Top N must be a positive number.");
        return;
      }
    }
    setAppliedQuery(toAnalyticsQuery(draftFilters));
  }

  function resetFilters() {
    const preset =
      dashboardConfig.data?.defaultDatePreset || page.defaultDatePreset;
    const nextForm = createFilterForm(page, preset);
    setDraftFilters(nextForm);
    setAppliedQuery(toAnalyticsQuery(nextForm));
  }

  async function refresh() {
    await Promise.all([dashboardConfig.refetch(), analyticsQuery.refetch()]);
  }

  return (
    <AffinexPageShell
      title={page.title}
      description={page.description}
      actions={
        <Button
          type="button"
          variant="outline"
          onClick={() => void refresh()}
          disabled={analyticsQuery.isFetching || dashboardConfig.isFetching}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      }
    >
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Query the additive Affinex analytics endpoints under
            <code className="ml-1 rounded bg-muted px-1 py-0.5">
              /admin/affinex
            </code>
            without changing any existing interface behavior.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Start date">
              <Input
                type="date"
                value={draftFilters.startDate}
                onChange={(event) => updateDraft("startDate", event.target.value)}
              />
            </Field>
            <Field label="End date">
              <Input
                type="date"
                value={draftFilters.endDate}
                onChange={(event) => updateDraft("endDate", event.target.value)}
              />
            </Field>
            <Field label="Affiliate ID">
              <Input
                value={draftFilters.affiliateId}
                onChange={(event) =>
                  updateDraft("affiliateId", event.target.value)
                }
                placeholder="Optional affiliate ID"
              />
            </Field>
            <Field label="Affiliate Code">
              <Input
                value={draftFilters.affiliateCode}
                onChange={(event) =>
                  updateDraft("affiliateCode", event.target.value)
                }
                placeholder="Optional affiliate code"
              />
            </Field>
            {page.supportsTopN ? (
              <Field label="Top N">
                <Input
                  type="number"
                  min={1}
                  value={draftFilters.topN}
                  onChange={(event) => updateDraft("topN", event.target.value)}
                  placeholder="10"
                />
              </Field>
            ) : null}
            {page.supportsCompare ? (
              <>
                <Field label="Comparison start date">
                  <Input
                    type="date"
                    value={draftFilters.compareStartDate}
                    onChange={(event) =>
                      updateDraft("compareStartDate", event.target.value)
                    }
                  />
                </Field>
                <Field label="Comparison end date">
                  <Input
                    type="date"
                    value={draftFilters.compareEndDate}
                    onChange={(event) =>
                      updateDraft("compareEndDate", event.target.value)
                    }
                  />
                </Field>
              </>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              {dashboardConfig.data?.updatedAt
                ? `Dashboard config applied at ${dashboardConfig.data.updatedAt}.`
                : "No saved dashboard config yet. Page defaults are active."}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={resetFilters}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button type="button" onClick={applyFilters}>
                Apply filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Settings2 className="h-4 w-4" />
        <AlertTitle>Dashboard-config aware</AlertTitle>
        <AlertDescription>
          Widget visibility and the default date preset are read from the
          Affinex dashboard-config endpoint for this resource code.
        </AlertDescription>
      </Alert>

      {!filtersReady || (analyticsQuery.isLoading && !analyticsQuery.data) ? (
        <div className="flex h-60 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading analytics...
        </div>
      ) : analyticsQuery.isError ? (
        <EmptyState
          title="Analytics request failed"
          description="The backend request failed. Review the toast error and adjust the filters if needed."
        />
      ) : sections.length === 0 ? (
        <EmptyState
          title="No widgets visible"
          description="This analytics page currently has no visible widgets. Update dashboard config to re-enable sections."
        />
      ) : (
        <>
          <div className="text-sm text-muted-foreground">
            Applied filters: {textOrDash(appliedQuery.startDate)} to{" "}
            {textOrDash(appliedQuery.endDate)}
            {appliedQuery.affiliateId
              ? ` · affiliateId=${appliedQuery.affiliateId}`
              : ""}
            {appliedQuery.affiliateCode
              ? ` · affiliateCode=${appliedQuery.affiliateCode}`
              : ""}
            {appliedQuery.topN ? ` · topN=${appliedQuery.topN}` : ""}
          </div>
          <div className="space-y-6">{sections.map((item) => item.content)}</div>
        </>
      )}
    </AffinexPageShell>
  );
}
