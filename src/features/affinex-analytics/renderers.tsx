import type { ReactNode } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AffinexAnalyticsDataPageConfig } from "@/features/affinex-analytics/config";
import {
  comparisonCountChartConfig,
  comparisonValueChartConfig,
  EmptyState,
  formatDecimal,
  formatInteger,
  formatPercent,
  formatUsd,
  MetricTile,
  SectionCard,
  SummaryGrid,
  textOrDash,
  trendCountChartConfig,
  trendValueChartConfig,
  type WidgetSection,
} from "@/features/affinex-analytics/shared";
import type {
  AnalyticsTrendPoint,
  ChannelSourceAnalyticsValue,
  DashboardWidgetConfig,
  GeoAnalyticsValue,
  KolContributionAnalyticsValue,
  ProductAnalyticsValue,
  RiskExceptionAnalyticsValue,
  TeamHierarchyAnalyticsValue,
  TrendComparisonAnalyticsValue,
  UserConversionAnalyticsValue,
  UserRetentionAnalyticsValue,
} from "@/types/affinex";

function titleFor(widgets: DashboardWidgetConfig[], code: string, fallback: string) {
  return widgets.find((item) => item.widgetCode === code)?.title || fallback;
}

function widgetSort(widgets: DashboardWidgetConfig[], code: string) {
  return widgets.find((item) => item.widgetCode === code)?.sort ?? 0;
}

function visible(widgets: DashboardWidgetConfig[], code: string) {
  return widgets.find((item) => item.widgetCode === code)?.visible ?? true;
}

function pushSection(
  result: WidgetSection[],
  widgets: DashboardWidgetConfig[],
  widgetCode: string,
  content: ReactNode,
) {
  if (!visible(widgets, widgetCode)) {
    return;
  }
  result.push({
    widgetCode,
    sort: widgetSort(widgets, widgetCode),
    content: <div key={widgetCode}>{content}</div>,
  });
}

function TrendTable({ trend }: { trend: AnalyticsTrendPoint[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Callback Users</TableHead>
            <TableHead>Registrations</TableHead>
            <TableHead>First Deposit Users</TableHead>
            <TableHead>Trade Users</TableHead>
            <TableHead>Trade Amount</TableHead>
            <TableHead>Earned Commission</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trend.map((item) => (
            <TableRow key={item.date}>
              <TableCell>{textOrDash(item.date)}</TableCell>
              <TableCell>{formatInteger(item.callbackUserCount)}</TableCell>
              <TableCell>{formatInteger(item.registrationCount)}</TableCell>
              <TableCell>{formatInteger(item.firstDepositUserCount)}</TableCell>
              <TableCell>{formatInteger(item.tradeUserCount)}</TableCell>
              <TableCell>{formatUsd(item.tradeAmountUsd)}</TableCell>
              <TableCell>{formatUsd(item.earnedCommissionUsd)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TrendSection({
  title,
  description,
  trend,
}: {
  title: string;
  description: string;
  trend: AnalyticsTrendPoint[];
}) {
  return (
    <SectionCard title={title} description={description}>
      {trend.length === 0 ? (
        <EmptyState
          title="No trend data"
          description="No daily data was returned for the selected filter set."
        />
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">User counts</CardTitle>
                <CardDescription>
                  Registrations, first deposits, and trade users by day.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer className="h-[280px] w-full" config={trendCountChartConfig}>
                  <LineChart data={trend}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line dataKey="registrationCount" type="monotone" stroke="var(--color-registrationCount)" strokeWidth={2} dot={false} />
                    <Line dataKey="firstDepositUserCount" type="monotone" stroke="var(--color-firstDepositUserCount)" strokeWidth={2} dot={false} />
                    <Line dataKey="tradeUserCount" type="monotone" stroke="var(--color-tradeUserCount)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Value metrics</CardTitle>
                <CardDescription>
                  Trade amount and earned commission by day.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer className="h-[280px] w-full" config={trendValueChartConfig}>
                  <LineChart data={trend}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line dataKey="tradeAmountUsd" type="monotone" stroke="var(--color-tradeAmountUsd)" strokeWidth={2} dot={false} />
                    <Line dataKey="earnedCommissionUsd" type="monotone" stroke="var(--color-earnedCommissionUsd)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
          <TrendTable trend={trend} />
        </>
      )}
    </SectionCard>
  );
}

export function buildAnalyticsSections(
  page: AffinexAnalyticsDataPageConfig,
  widgets: DashboardWidgetConfig[],
  data: unknown,
): WidgetSection[] {
  const result: WidgetSection[] = [];

  switch (page.endpoint) {
    case "kolContribution": {
      const value = data as KolContributionAnalyticsValue;
      pushSection(
        result,
        widgets,
        "summary",
        <SectionCard title={titleFor(widgets, "summary", "KPI Summary")} description={`Applied range: ${textOrDash(value.summary.dateRange.startDate)} to ${textOrDash(value.summary.dateRange.endDate)}.`}>
          <SummaryGrid summary={value.summary} />
        </SectionCard>,
      );
      pushSection(
        result,
        widgets,
        "trend",
        <TrendSection title={titleFor(widgets, "trend", "Daily Trend")} description="Daily user and value movements for the current KOL scope." trend={value.trend} />,
      );
      pushSection(
        result,
        widgets,
        "contributions",
        <SectionCard title={titleFor(widgets, "contributions", "Contribution Ranking")} description="Top KOL contribution rows ordered by earned commission.">
          {value.contributions.length === 0 ? (
            <EmptyState title="No contribution rows" description="No KOL contribution records were returned for the selected filters." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border">
              <Table><TableHeader><TableRow><TableHead>Affiliate ID</TableHead><TableHead>Affiliate Code</TableHead><TableHead>Affiliate Name</TableHead><TableHead>Owner</TableHead><TableHead>Country</TableHead><TableHead>Active Links</TableHead><TableHead>Registrations</TableHead><TableHead>First Deposits</TableHead><TableHead>Trade Users</TableHead><TableHead>Trade Amount</TableHead><TableHead>Earned Commission</TableHead><TableHead>Contribution Share</TableHead></TableRow></TableHeader><TableBody>{value.contributions.map((item) => <TableRow key={`${item.affiliateId}-${item.affiliateCode}`}><TableCell>{textOrDash(item.affiliateId)}</TableCell><TableCell>{textOrDash(item.affiliateCode)}</TableCell><TableCell>{textOrDash(item.affiliateName)}</TableCell><TableCell>{textOrDash(item.ownerName)}</TableCell><TableCell>{textOrDash(item.countryCode)}</TableCell><TableCell>{formatInteger(item.activeLinkCount)}</TableCell><TableCell>{formatInteger(item.registrationCount)}</TableCell><TableCell>{formatInteger(item.firstDepositUserCount)}</TableCell><TableCell>{formatInteger(item.tradeUserCount)}</TableCell><TableCell>{formatUsd(item.tradeAmountUsd)}</TableCell><TableCell>{formatUsd(item.earnedCommissionUsd)}</TableCell><TableCell>{formatPercent(item.contributionShare)}</TableCell></TableRow>)}</TableBody></Table>
            </div>
          )}
        </SectionCard>,
      );
      break;
    }
    case "userConversion": {
      const value = data as UserConversionAnalyticsValue;
      pushSection(result, widgets, "summary", <SectionCard title={titleFor(widgets, "summary", "KPI Summary")} description={`Applied range: ${textOrDash(value.summary.dateRange.startDate)} to ${textOrDash(value.summary.dateRange.endDate)}.`}><SummaryGrid summary={value.summary} /></SectionCard>);
      pushSection(result, widgets, "funnel", <SectionCard title={titleFor(widgets, "funnel", "Conversion Funnel")} description="Core conversion steps from attributed callback users to active traders."><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><MetricTile label="Callback Users" value={formatInteger(value.funnel.callbackUserCount)} hint={`To registration: ${formatPercent(value.funnel.callbackToRegistrationRate)}`} /><MetricTile label="Registrations" value={formatInteger(value.funnel.registrationCount)} hint={`To first deposit: ${formatPercent(value.funnel.registrationToFirstDepositRate)}`} /><MetricTile label="First Deposit Users" value={formatInteger(value.funnel.firstDepositUserCount)} hint={`To trade: ${formatPercent(value.funnel.firstDepositToTradeRate)}`} /><MetricTile label="Trade Users" value={formatInteger(value.funnel.tradeUserCount)} hint={`Overall trade rate: ${formatPercent(value.funnel.overallTradeRate)}`} /></div></SectionCard>);
      pushSection(result, widgets, "trend", <TrendSection title={titleFor(widgets, "trend", "Daily Trend")} description="Daily user and value movements that support the conversion funnel." trend={value.trend} />);
      break;
    }
    case "userRetention": {
      const value = data as UserRetentionAnalyticsValue;
      pushSection(result, widgets, "summary", <SectionCard title={titleFor(widgets, "summary", "KPI Summary")} description={`Applied range: ${textOrDash(value.summary.dateRange.startDate)} to ${textOrDash(value.summary.dateRange.endDate)}.`}><SummaryGrid summary={value.summary} /></SectionCard>);
      pushSection(result, widgets, "overview", <SectionCard title={titleFor(widgets, "overview", "Retention Overview")} description="Average retention rates across all returned cohorts."><div className="grid gap-4 md:grid-cols-3"><MetricTile label="Average 1D Retention" value={formatPercent(value.overview.averageRetention1dRate)} /><MetricTile label="Average 7D Retention" value={formatPercent(value.overview.averageRetention7dRate)} /><MetricTile label="Average 30D Retention" value={formatPercent(value.overview.averageRetention30dRate)} /></div></SectionCard>);
      pushSection(result, widgets, "cohorts", <SectionCard title={titleFor(widgets, "cohorts", "Cohort Breakdown")} description="Cohort rows by registration date with retained user counts and rates.">{value.cohorts.length === 0 ? <EmptyState title="No cohorts returned" description="No retention cohorts were returned for the selected date range." /> : <div className="overflow-x-auto rounded-2xl border"><Table><TableHeader><TableRow><TableHead>Cohort Date</TableHead><TableHead>Registered Users</TableHead><TableHead>Retained 1D Users</TableHead><TableHead>1D Rate</TableHead><TableHead>Retained 7D Users</TableHead><TableHead>7D Rate</TableHead><TableHead>Retained 30D Users</TableHead><TableHead>30D Rate</TableHead></TableRow></TableHeader><TableBody>{value.cohorts.map((item) => <TableRow key={item.cohortDate}><TableCell>{textOrDash(item.cohortDate)}</TableCell><TableCell>{formatInteger(item.registeredUserCount)}</TableCell><TableCell>{formatInteger(item.retained1dUserCount)}</TableCell><TableCell>{formatPercent(item.retention1dRate)}</TableCell><TableCell>{formatInteger(item.retained7dUserCount)}</TableCell><TableCell>{formatPercent(item.retention7dRate)}</TableCell><TableCell>{formatInteger(item.retained30dUserCount)}</TableCell><TableCell>{formatPercent(item.retention30dRate)}</TableCell></TableRow>)}</TableBody></Table></div>}</SectionCard>);
      break;
    }
    case "product": {
      const value = data as ProductAnalyticsValue;
      pushSection(result, widgets, "summary", <SectionCard title={titleFor(widgets, "summary", "KPI Summary")} description={`Applied range: ${textOrDash(value.summary.dateRange.startDate)} to ${textOrDash(value.summary.dateRange.endDate)}.`}><SummaryGrid summary={value.summary} /></SectionCard>);
      pushSection(result, widgets, "products", <SectionCard title={titleFor(widgets, "products", "Product Ranking")} description="Product ranking by trade amount and monetization.">{value.products.length === 0 ? <EmptyState title="No product metrics" description="No product analytics rows were returned for the selected filters." /> : <div className="overflow-x-auto rounded-2xl border"><Table><TableHeader><TableRow><TableHead>Symbol Code</TableHead><TableHead>Symbol Type</TableHead><TableHead>Trade Users</TableHead><TableHead>Order Count</TableHead><TableHead>Trade Volume</TableHead><TableHead>Trade Amount</TableHead><TableHead>Earned Commission</TableHead><TableHead>Average Order Value</TableHead></TableRow></TableHeader><TableBody>{value.products.map((item) => <TableRow key={`${item.symbolCode}-${item.symbolType}`}><TableCell>{textOrDash(item.symbolCode)}</TableCell><TableCell>{textOrDash(item.symbolType)}</TableCell><TableCell>{formatInteger(item.tradeUserCount)}</TableCell><TableCell>{formatInteger(item.orderCount)}</TableCell><TableCell>{formatDecimal(item.tradeVolume)}</TableCell><TableCell>{formatUsd(item.tradeAmountUsd)}</TableCell><TableCell>{formatUsd(item.earnedCommissionUsd)}</TableCell><TableCell>{formatUsd(item.averageOrderValueUsd)}</TableCell></TableRow>)}</TableBody></Table></div>}</SectionCard>);
      break;
    }
    case "geo": {
      const value = data as GeoAnalyticsValue;
      pushSection(result, widgets, "summary", <SectionCard title={titleFor(widgets, "summary", "KPI Summary")} description={`Applied range: ${textOrDash(value.summary.dateRange.startDate)} to ${textOrDash(value.summary.dateRange.endDate)}.`}><SummaryGrid summary={value.summary} /></SectionCard>);
      pushSection(result, widgets, "geos", <SectionCard title={titleFor(widgets, "geos", "Geo Ranking")} description="Country-level registration, deposit, trade, and commission metrics.">{value.geos.length === 0 ? <EmptyState title="No geo metrics" description="No geo analytics rows were returned for the selected filters." /> : <div className="overflow-x-auto rounded-2xl border"><Table><TableHeader><TableRow><TableHead>Country Code</TableHead><TableHead>Registrations</TableHead><TableHead>First Deposit Users</TableHead><TableHead>Trade Users</TableHead><TableHead>Deposit Amount</TableHead><TableHead>Trade Amount</TableHead><TableHead>Earned Commission</TableHead></TableRow></TableHeader><TableBody>{value.geos.map((item) => <TableRow key={item.countryCode}><TableCell>{textOrDash(item.countryCode)}</TableCell><TableCell>{formatInteger(item.registrationCount)}</TableCell><TableCell>{formatInteger(item.firstDepositUserCount)}</TableCell><TableCell>{formatInteger(item.tradeUserCount)}</TableCell><TableCell>{formatUsd(item.depositAmountUsd)}</TableCell><TableCell>{formatUsd(item.tradeAmountUsd)}</TableCell><TableCell>{formatUsd(item.earnedCommissionUsd)}</TableCell></TableRow>)}</TableBody></Table></div>}</SectionCard>);
      break;
    }
    case "channelSource": {
      const value = data as ChannelSourceAnalyticsValue;
      pushSection(result, widgets, "summary", <SectionCard title={titleFor(widgets, "summary", "KPI Summary")} description={`Applied range: ${textOrDash(value.summary.dateRange.startDate)} to ${textOrDash(value.summary.dateRange.endDate)}.`}><SummaryGrid summary={value.summary} /></SectionCard>);
      pushSection(result, widgets, "sources", <SectionCard title={titleFor(widgets, "sources", "Source Breakdown")} description="Acquisition metrics by marketing channel and channel type.">{value.sources.length === 0 ? <EmptyState title="No source rows" description="No source analytics rows were returned for the selected filters." /> : <div className="overflow-x-auto rounded-2xl border"><Table><TableHeader><TableRow><TableHead>Channel</TableHead><TableHead>Channel Type</TableHead><TableHead>Registrations</TableHead><TableHead>First Deposit Users</TableHead><TableHead>Trade Users</TableHead><TableHead>Deposit Amount</TableHead><TableHead>Trade Amount</TableHead></TableRow></TableHeader><TableBody>{value.sources.map((item) => <TableRow key={`${item.channel}-${item.channelType}`}><TableCell>{textOrDash(item.channel)}</TableCell><TableCell>{textOrDash(item.channelType)}</TableCell><TableCell>{formatInteger(item.registrationCount)}</TableCell><TableCell>{formatInteger(item.firstDepositUserCount)}</TableCell><TableCell>{formatInteger(item.tradeUserCount)}</TableCell><TableCell>{formatUsd(item.depositAmountUsd)}</TableCell><TableCell>{formatUsd(item.tradeAmountUsd)}</TableCell></TableRow>)}</TableBody></Table></div>}</SectionCard>);
      pushSection(result, widgets, "systems", <SectionCard title={titleFor(widgets, "systems", "System Breakdown")} description="Registration and trade activation by operating system and device.">{value.systems.length === 0 ? <EmptyState title="No system rows" description="No system analytics rows were returned for the selected filters." /> : <div className="overflow-x-auto rounded-2xl border"><Table><TableHeader><TableRow><TableHead>System</TableHead><TableHead>Device</TableHead><TableHead>Registrations</TableHead><TableHead>Trade Users</TableHead></TableRow></TableHeader><TableBody>{value.systems.map((item) => <TableRow key={`${item.system}-${item.device}`}><TableCell>{textOrDash(item.system)}</TableCell><TableCell>{textOrDash(item.device)}</TableCell><TableCell>{formatInteger(item.registrationCount)}</TableCell><TableCell>{formatInteger(item.tradeUserCount)}</TableCell></TableRow>)}</TableBody></Table></div>}</SectionCard>);
      break;
    }
    case "teamHierarchy": {
      const value = data as TeamHierarchyAnalyticsValue;
      pushSection(result, widgets, "summary", <SectionCard title={titleFor(widgets, "summary", "KPI Summary")} description={`Applied range: ${textOrDash(value.summary.dateRange.startDate)} to ${textOrDash(value.summary.dateRange.endDate)}.`}><SummaryGrid summary={value.summary} /></SectionCard>);
      pushSection(result, widgets, "teams", <SectionCard title={titleFor(widgets, "teams", "Team Ranking")} description="Owner-level aggregation of affiliate coverage, activity, and commission.">{value.teams.length === 0 ? <EmptyState title="No team rows" description="No team hierarchy rows were returned for the selected filters." /> : <div className="overflow-x-auto rounded-2xl border"><Table><TableHeader><TableRow><TableHead>Owner Admin ID</TableHead><TableHead>Owner Name</TableHead><TableHead>Affiliate Count</TableHead><TableHead>Approved Affiliates</TableHead><TableHead>Active Links</TableHead><TableHead>Registrations</TableHead><TableHead>First Deposit Users</TableHead><TableHead>Trade Users</TableHead><TableHead>Earned Commission</TableHead><TableHead>Paid Commission</TableHead></TableRow></TableHeader><TableBody>{value.teams.map((item) => <TableRow key={`${item.ownerAdminId}-${item.ownerName}`}><TableCell>{textOrDash(item.ownerAdminId)}</TableCell><TableCell>{textOrDash(item.ownerName)}</TableCell><TableCell>{formatInteger(item.affiliateCount)}</TableCell><TableCell>{formatInteger(item.approvedAffiliateCount)}</TableCell><TableCell>{formatInteger(item.activeLinkCount)}</TableCell><TableCell>{formatInteger(item.registrationCount)}</TableCell><TableCell>{formatInteger(item.firstDepositUserCount)}</TableCell><TableCell>{formatInteger(item.tradeUserCount)}</TableCell><TableCell>{formatUsd(item.earnedCommissionUsd)}</TableCell><TableCell>{formatUsd(item.paidCommissionUsd)}</TableCell></TableRow>)}</TableBody></Table></div>}</SectionCard>);
      break;
    }
    case "riskException": {
      const value = data as RiskExceptionAnalyticsValue;
      pushSection(result, widgets, "overview", <SectionCard title={titleFor(widgets, "overview", "Risk Overview")} description="Headline exception counts that usually require operational attention."><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><MetricTile label="Pending Traffic Review" value={formatInteger(value.overview.pendingTrafficCount)} /><MetricTile label="Rejected Traffic Review" value={formatInteger(value.overview.rejectedTrafficCount)} /><MetricTile label="Pending KYC Review" value={formatInteger(value.overview.pendingKycCount)} /><MetricTile label="Rejected KYC Review" value={formatInteger(value.overview.rejectedKycCount)} /><MetricTile label="Declined Payment Summaries" value={formatInteger(value.overview.declinedPaymentCount)} hint={formatUsd(value.overview.declinedPaymentAmountUsd)} /><MetricTile label="Callback Without Registration" value={formatInteger(value.overview.callbackWithoutRegistrationCount)} /><MetricTile label="Registrations Without Deposit" value={formatInteger(value.overview.registrationWithoutDepositCount)} /><MetricTile label="First Deposits Without Trade" value={formatInteger(value.overview.firstDepositWithoutTradeCount)} /></div></SectionCard>);
      pushSection(result, widgets, "issues", <SectionCard title={titleFor(widgets, "issues", "Exception Items")} description="Flat exception list returned by the backend for quick scanning or export preparation.">{value.items.length === 0 ? <EmptyState title="No exception items" description="No risk or exception items were returned for the selected filters." /> : <div className="overflow-x-auto rounded-2xl border"><Table><TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Label</TableHead><TableHead>Count</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader><TableBody>{value.items.map((item) => <TableRow key={`${item.category}-${item.label}`}><TableCell>{textOrDash(item.category)}</TableCell><TableCell>{textOrDash(item.label)}</TableCell><TableCell>{formatInteger(item.count)}</TableCell><TableCell>{item.amountUsd ? formatUsd(item.amountUsd) : "-"}</TableCell></TableRow>)}</TableBody></Table></div>}</SectionCard>);
      break;
    }
    case "trendComparison": {
      const value = data as TrendComparisonAnalyticsValue;
      pushSection(result, widgets, "currentSummary", <SectionCard title={titleFor(widgets, "currentSummary", "Current Period KPI")} description={`Current range: ${textOrDash(value.currentSummary.dateRange.startDate)} to ${textOrDash(value.currentSummary.dateRange.endDate)}.`}><SummaryGrid summary={value.currentSummary} /></SectionCard>);
      pushSection(result, widgets, "compareSummary", <SectionCard title={titleFor(widgets, "compareSummary", "Comparison Period KPI")} description={`Comparison range: ${textOrDash(value.compareSummary.dateRange.startDate)} to ${textOrDash(value.compareSummary.dateRange.endDate)}.`}><SummaryGrid summary={value.compareSummary} /></SectionCard>);
      pushSection(result, widgets, "metrics", <SectionCard title={titleFor(widgets, "metrics", "Change Metrics")} description="Metric-level differences between the current and comparison windows.">{value.metrics.length === 0 ? <EmptyState title="No comparison metrics" description="No trend comparison metrics were returned for the selected filters." /> : <div className="overflow-x-auto rounded-2xl border"><Table><TableHeader><TableRow><TableHead>Metric</TableHead><TableHead>Current Value</TableHead><TableHead>Comparison Value</TableHead><TableHead>Diff Value</TableHead><TableHead>Diff Rate</TableHead></TableRow></TableHeader><TableBody>{value.metrics.map((item) => <TableRow key={item.metricCode}><TableCell>{textOrDash(item.label)}</TableCell><TableCell>{formatDecimal(item.currentValue)}</TableCell><TableCell>{formatDecimal(item.compareValue)}</TableCell><TableCell>{formatDecimal(item.diffValue)}</TableCell><TableCell>{formatPercent(item.diffRate)}</TableCell></TableRow>)}</TableBody></Table></div>}</SectionCard>);
      pushSection(result, widgets, "trend", <SectionCard title={titleFor(widgets, "trend", "Aligned Trend")} description="D1, D2, D3 style alignment between the current and comparison windows.">{value.trend.length === 0 ? <EmptyState title="No aligned trend points" description="No trend comparison points were returned for the selected filters." /> : <><div className="grid gap-4 xl:grid-cols-2"><Card className="border-dashed"><CardHeader className="pb-3"><CardTitle className="text-base">Registration comparison</CardTitle><CardDescription>Current and comparison registrations aligned by day bucket.</CardDescription></CardHeader><CardContent><ChartContainer className="h-[280px] w-full" config={comparisonCountChartConfig}><LineChart data={value.trend}><CartesianGrid vertical={false} /><XAxis dataKey="label" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} /><ChartTooltip content={<ChartTooltipContent />} /><ChartLegend content={<ChartLegendContent />} /><Line dataKey="currentRegistrationCount" type="monotone" stroke="var(--color-currentRegistrationCount)" strokeWidth={2} dot={false} /><Line dataKey="compareRegistrationCount" type="monotone" stroke="var(--color-compareRegistrationCount)" strokeWidth={2} dot={false} /></LineChart></ChartContainer></CardContent></Card><Card className="border-dashed"><CardHeader className="pb-3"><CardTitle className="text-base">Commission comparison</CardTitle><CardDescription>Current and comparison earned commission aligned by day bucket.</CardDescription></CardHeader><CardContent><ChartContainer className="h-[280px] w-full" config={comparisonValueChartConfig}><LineChart data={value.trend}><CartesianGrid vertical={false} /><XAxis dataKey="label" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} /><ChartTooltip content={<ChartTooltipContent />} /><ChartLegend content={<ChartLegendContent />} /><Line dataKey="currentEarnedCommissionUsd" type="monotone" stroke="var(--color-currentEarnedCommissionUsd)" strokeWidth={2} dot={false} /><Line dataKey="compareEarnedCommissionUsd" type="monotone" stroke="var(--color-compareEarnedCommissionUsd)" strokeWidth={2} dot={false} /></LineChart></ChartContainer></CardContent></Card></div><div className="overflow-x-auto rounded-2xl border"><Table><TableHeader><TableRow><TableHead>Bucket</TableHead><TableHead>Current Date</TableHead><TableHead>Comparison Date</TableHead><TableHead>Current Registrations</TableHead><TableHead>Comparison Registrations</TableHead><TableHead>Current Trade Users</TableHead><TableHead>Comparison Trade Users</TableHead><TableHead>Current Trade Amount</TableHead><TableHead>Comparison Trade Amount</TableHead><TableHead>Current Commission</TableHead><TableHead>Comparison Commission</TableHead></TableRow></TableHeader><TableBody>{value.trend.map((item) => <TableRow key={item.label}><TableCell>{textOrDash(item.label)}</TableCell><TableCell>{textOrDash(item.currentDate)}</TableCell><TableCell>{textOrDash(item.compareDate)}</TableCell><TableCell>{formatInteger(item.currentRegistrationCount)}</TableCell><TableCell>{formatInteger(item.compareRegistrationCount)}</TableCell><TableCell>{formatInteger(item.currentTradeUserCount)}</TableCell><TableCell>{formatInteger(item.compareTradeUserCount)}</TableCell><TableCell>{formatUsd(item.currentTradeAmountUsd)}</TableCell><TableCell>{formatUsd(item.compareTradeAmountUsd)}</TableCell><TableCell>{formatUsd(item.currentEarnedCommissionUsd)}</TableCell><TableCell>{formatUsd(item.compareEarnedCommissionUsd)}</TableCell></TableRow>)}</TableBody></Table></div></>}</SectionCard>);
      break;
    }
  }

  return result.sort((a, b) => a.sort - b.sort);
}
