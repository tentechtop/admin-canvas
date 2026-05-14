import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  EmptyState,
  PageIntro,
} from "@/features/console/shared";
import type {
  AnalyticsDatePreset,
  AnalyticsQuery,
  AnalyticsSummary,
  DashboardWidgetConfig,
} from "@/types/affinex";
import type { AffinexAnalyticsDataPageConfig } from "@/features/affinex-analytics/config";

export type AnalyticsFilterForm = {
  startDate: string;
  endDate: string;
  affiliateId: string;
  affiliateCode: string;
  topN: string;
  compareStartDate: string;
  compareEndDate: string;
};

export type WidgetSection = {
  widgetCode: string;
  sort: number;
  content: ReactNode;
};

export const datePresetOptions: Array<{
  value: AnalyticsDatePreset;
  label: string;
  days: number;
}> = [
  { value: "last7d", label: "Last 7 days", days: 7 },
  { value: "last30d", label: "Last 30 days", days: 30 },
  { value: "last90d", label: "Last 90 days", days: 90 },
];

export const trendCountChartConfig = {
  registrationCount: { label: "Registrations", color: "#0f766e" },
  firstDepositUserCount: { label: "First Deposit Users", color: "#0284c7" },
  tradeUserCount: { label: "Trade Users", color: "#ca8a04" },
};

export const trendValueChartConfig = {
  tradeAmountUsd: { label: "Trade Amount USD", color: "#7c3aed" },
  earnedCommissionUsd: { label: "Earned Commission USD", color: "#dc2626" },
};

export const comparisonCountChartConfig = {
  currentRegistrationCount: { label: "Current Registrations", color: "#0f766e" },
  compareRegistrationCount: { label: "Comparison Registrations", color: "#94a3b8" },
};

export const comparisonValueChartConfig = {
  currentEarnedCommissionUsd: {
    label: "Current Earned Commission USD",
    color: "#dc2626",
  },
  compareEarnedCommissionUsd: {
    label: "Comparison Earned Commission USD",
    color: "#94a3b8",
  },
};

export function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function resolvePresetDays(preset: AnalyticsDatePreset | "" | undefined) {
  return datePresetOptions.find((item) => item.value === preset)?.days ?? 30;
}

export function createFilterForm(
  page: AffinexAnalyticsDataPageConfig,
  preset: AnalyticsDatePreset | "" | undefined,
): AnalyticsFilterForm {
  const days = resolvePresetDays(preset || page.defaultDatePreset);
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (days - 1));

  return {
    startDate: formatDateInput(startDate),
    endDate: formatDateInput(endDate),
    affiliateId: "",
    affiliateCode: "",
    topN: String(page.defaultTopN),
    compareStartDate: "",
    compareEndDate: "",
  };
}

export function toAnalyticsQuery(form: AnalyticsFilterForm): AnalyticsQuery {
  const topN = Number(form.topN);
  return {
    startDate: form.startDate.trim(),
    endDate: form.endDate.trim(),
    affiliateId: form.affiliateId.trim(),
    affiliateCode: form.affiliateCode.trim(),
    topN: Number.isFinite(topN) && topN > 0 ? topN : undefined,
    compareStartDate: form.compareStartDate.trim(),
    compareEndDate: form.compareEndDate.trim(),
  };
}

export function formatInteger(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export function formatDecimal(value: number, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value ?? 0);
}

export function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

export function formatPercent(value: number) {
  return `${((value ?? 0) * 100).toFixed(1)}%`;
}

export function textOrDash(value?: string | number | null) {
  if (value === undefined || value === null || value === "") {
    return "-";
  }
  return String(value);
}

export function mergeDashboardWidgets(
  defaultWidgets: DashboardWidgetConfig[],
  savedWidgets?: DashboardWidgetConfig[],
) {
  const savedByCode = new Map(
    (savedWidgets ?? []).map((widget) => [widget.widgetCode, widget]),
  );

  return defaultWidgets
    .map((widget) => {
      const saved = savedByCode.get(widget.widgetCode);
      return {
        ...widget,
        title: saved?.title?.trim() || widget.title,
        visible: saved?.visible ?? widget.visible,
        sort: saved?.sort ?? widget.sort,
      };
    })
    .sort((a, b) => a.sort - b.sort);
}

export function AffinexPageShell({
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

export function MetricTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-muted/10 p-4 shadow-sm">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
      {hint ? <div className="mt-2 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export function SummaryGrid({ summary }: { summary: AnalyticsSummary }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricTile
        label="Visible Affiliates"
        value={formatInteger(summary.visibleAffiliateCount)}
        hint={`Approved affiliates: ${formatInteger(summary.approvedAffiliateCount)}`}
      />
      <MetricTile
        label="Registrations"
        value={formatInteger(summary.registrationCount)}
        hint={`First deposit users: ${formatInteger(summary.firstDepositUserCount)}`}
      />
      <MetricTile
        label="Deposit Amount"
        value={formatUsd(summary.depositAmountUsd)}
        hint={`Trade users: ${formatInteger(summary.tradeUserCount)}`}
      />
      <MetricTile
        label="Trade Volume"
        value={formatDecimal(summary.tradeVolume)}
        hint={`Trade amount: ${formatUsd(summary.tradeAmountUsd)}`}
      />
      <MetricTile
        label="Earned Commission"
        value={formatUsd(summary.earnedCommissionUsd)}
        hint={`Paid commission: ${formatUsd(summary.paidCommissionUsd)}`}
      />
      <MetricTile
        label="Deposit Conversion"
        value={formatPercent(
          summary.registrationCount > 0
            ? summary.firstDepositUserCount / summary.registrationCount
            : 0,
        )}
        hint="First deposit users divided by registrations."
      />
      <MetricTile
        label="Trade Activation"
        value={formatPercent(
          summary.firstDepositUserCount > 0
            ? summary.tradeUserCount / summary.firstDepositUserCount
            : 0,
        )}
        hint="Trade users divided by first deposit users."
      />
      <MetricTile
        label="Commission Payout Rate"
        value={formatPercent(
          summary.earnedCommissionUsd > 0
            ? summary.paidCommissionUsd / summary.earnedCommissionUsd
            : 0,
        )}
        hint="Paid commission divided by earned commission."
      />
    </div>
  );
}

export { EmptyState };
