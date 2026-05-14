import type {
  AffinexAnalyticsEndpoint,
  AnalyticsDatePreset,
  DashboardWidgetConfig,
} from "@/types/affinex";

export type AffinexAnalyticsResourceCode =
  | "KOL_ANALYTICS_KOL_CONTRIBUTION"
  | "KOL_ANALYTICS_USER_CONVERSION"
  | "KOL_ANALYTICS_USER_RETENTION"
  | "KOL_ANALYTICS_PRODUCT"
  | "KOL_ANALYTICS_GEO"
  | "KOL_ANALYTICS_CHANNEL_SOURCE"
  | "KOL_ANALYTICS_TEAM_HIERARCHY"
  | "KOL_ANALYTICS_RISK_EXCEPTION"
  | "KOL_ANALYTICS_TREND_COMPARISON"
  | "KOL_ANALYTICS_DASHBOARD_CONFIG";

interface BasePageConfig {
  resourceCode: AffinexAnalyticsResourceCode;
  title: string;
  description: string;
}

export interface AffinexAnalyticsDataPageConfig extends BasePageConfig {
  kind: "analytics";
  endpoint: AffinexAnalyticsEndpoint;
  defaultDatePreset: AnalyticsDatePreset;
  defaultTopN: number;
  supportsTopN: boolean;
  supportsCompare: boolean;
  defaultWidgets: DashboardWidgetConfig[];
}

export interface AffinexAnalyticsDashboardPageConfig extends BasePageConfig {
  kind: "dashboardConfig";
}

export type AffinexAnalyticsPageConfig =
  | AffinexAnalyticsDataPageConfig
  | AffinexAnalyticsDashboardPageConfig;

function widgets(items: Array<[string, string, boolean?]>): DashboardWidgetConfig[] {
  return items.map(([widgetCode, title, visible = true], index) => ({
    widgetCode,
    title,
    visible,
    sort: index + 1,
  }));
}

export const affinexAnalyticsPageConfigs: Record<
  AffinexAnalyticsResourceCode,
  AffinexAnalyticsPageConfig
> = {
  KOL_ANALYTICS_KOL_CONTRIBUTION: {
    resourceCode: "KOL_ANALYTICS_KOL_CONTRIBUTION",
    kind: "analytics",
    endpoint: "kolContribution",
    title: "KOL Contribution Analytics",
    description:
      "Rank KOLs by conversion, trading activity, and earned commission within the current Affinex permission scope.",
    defaultDatePreset: "last30d",
    defaultTopN: 10,
    supportsTopN: true,
    supportsCompare: false,
    defaultWidgets: widgets([
      ["summary", "KPI Summary"],
      ["trend", "Daily Trend"],
      ["contributions", "Contribution Ranking"],
    ]),
  },
  KOL_ANALYTICS_USER_CONVERSION: {
    resourceCode: "KOL_ANALYTICS_USER_CONVERSION",
    kind: "analytics",
    endpoint: "userConversion",
    title: "User Conversion Analytics",
    description:
      "Track the callback-to-registration funnel and daily conversion trend for the selected KOL scope.",
    defaultDatePreset: "last30d",
    defaultTopN: 10,
    supportsTopN: false,
    supportsCompare: false,
    defaultWidgets: widgets([
      ["summary", "KPI Summary"],
      ["funnel", "Conversion Funnel"],
      ["trend", "Daily Trend"],
    ]),
  },
  KOL_ANALYTICS_USER_RETENTION: {
    resourceCode: "KOL_ANALYTICS_USER_RETENTION",
    kind: "analytics",
    endpoint: "userRetention",
    title: "User Retention Analytics",
    description:
      "Inspect cohort-based retention after registration using retained trading activity within each time bucket.",
    defaultDatePreset: "last30d",
    defaultTopN: 10,
    supportsTopN: false,
    supportsCompare: false,
    defaultWidgets: widgets([
      ["summary", "KPI Summary"],
      ["overview", "Retention Overview"],
      ["cohorts", "Cohort Breakdown"],
    ]),
  },
  KOL_ANALYTICS_PRODUCT: {
    resourceCode: "KOL_ANALYTICS_PRODUCT",
    kind: "analytics",
    endpoint: "product",
    title: "Product Analytics",
    description:
      "Review trading performance by product and symbol type, including trade amount, order count, and commission.",
    defaultDatePreset: "last30d",
    defaultTopN: 15,
    supportsTopN: true,
    supportsCompare: false,
    defaultWidgets: widgets([
      ["summary", "KPI Summary"],
      ["products", "Product Ranking"],
    ]),
  },
  KOL_ANALYTICS_GEO: {
    resourceCode: "KOL_ANALYTICS_GEO",
    kind: "analytics",
    endpoint: "geo",
    title: "Geo Analytics",
    description:
      "Compare registration, deposit, trade, and commission performance across countries or regional traffic sources.",
    defaultDatePreset: "last30d",
    defaultTopN: 15,
    supportsTopN: true,
    supportsCompare: false,
    defaultWidgets: widgets([
      ["summary", "KPI Summary"],
      ["geos", "Geo Ranking"],
    ]),
  },
  KOL_ANALYTICS_CHANNEL_SOURCE: {
    resourceCode: "KOL_ANALYTICS_CHANNEL_SOURCE",
    kind: "analytics",
    endpoint: "channelSource",
    title: "Channel Source Analytics",
    description:
      "Break down acquisition quality by marketing channel, channel type, operating system, and device class.",
    defaultDatePreset: "last30d",
    defaultTopN: 15,
    supportsTopN: true,
    supportsCompare: false,
    defaultWidgets: widgets([
      ["summary", "KPI Summary"],
      ["sources", "Source Breakdown"],
      ["systems", "System Breakdown"],
    ]),
  },
  KOL_ANALYTICS_TEAM_HIERARCHY: {
    resourceCode: "KOL_ANALYTICS_TEAM_HIERARCHY",
    kind: "analytics",
    endpoint: "teamHierarchy",
    title: "Team Hierarchy Analytics",
    description:
      "Aggregate KOL activity and monetization by owner team, with visibility into approved affiliates and active links.",
    defaultDatePreset: "last30d",
    defaultTopN: 15,
    supportsTopN: true,
    supportsCompare: false,
    defaultWidgets: widgets([
      ["summary", "KPI Summary"],
      ["teams", "Team Ranking"],
    ]),
  },
  KOL_ANALYTICS_RISK_EXCEPTION: {
    resourceCode: "KOL_ANALYTICS_RISK_EXCEPTION",
    kind: "analytics",
    endpoint: "riskException",
    title: "Risk & Exception Analytics",
    description:
      "Surface pending reviews, rejected records, declined payouts, and conversion gaps that need manual attention.",
    defaultDatePreset: "last30d",
    defaultTopN: 10,
    supportsTopN: false,
    supportsCompare: false,
    defaultWidgets: widgets([
      ["overview", "Risk Overview"],
      ["issues", "Exception Items"],
    ]),
  },
  KOL_ANALYTICS_TREND_COMPARISON: {
    resourceCode: "KOL_ANALYTICS_TREND_COMPARISON",
    kind: "analytics",
    endpoint: "trendComparison",
    title: "Trend Comparison Analytics",
    description:
      "Compare the current period against a previous window to highlight growth, contraction, and directional changes.",
    defaultDatePreset: "last30d",
    defaultTopN: 10,
    supportsTopN: false,
    supportsCompare: true,
    defaultWidgets: widgets([
      ["currentSummary", "Current Period KPI"],
      ["compareSummary", "Comparison Period KPI"],
      ["metrics", "Change Metrics"],
      ["trend", "Aligned Trend"],
    ]),
  },
  KOL_ANALYTICS_DASHBOARD_CONFIG: {
    resourceCode: "KOL_ANALYTICS_DASHBOARD_CONFIG",
    kind: "dashboardConfig",
    title: "Dashboard Config",
    description:
      "Persist default date presets and widget visibility for each Affinex analytics page without changing backend menus or routes.",
  },
};

export const configurableAffinexAnalyticsPages =
  Object.values(affinexAnalyticsPageConfigs).filter(
    (page): page is AffinexAnalyticsDataPageConfig => page.kind === "analytics",
  );

export function getAffinexAnalyticsPageConfig(
  resourceCode: AffinexAnalyticsResourceCode,
) {
  return affinexAnalyticsPageConfigs[resourceCode];
}
