import type { AxiosRequestConfig } from "axios";
import { businessRequest } from "@/lib/business-http";
import type {
  AffinexAnalyticsEndpoint,
  AffinexAnalyticsValueMap,
  AnalyticsDashboardConfig,
  AnalyticsQuery,
  AnalyticsSummary,
  AnalyticsTrendPoint,
  ChannelSourceAnalyticsValue,
  ChannelSourceItem,
  ChannelSourceSystemItem,
  DashboardAccountTypeItem,
  DashboardAlertItem,
  DashboardCommissionTrendPoint,
  DashboardDistributionsValue,
  DashboardGeoDistributionItem,
  DashboardKpiCard,
  DashboardKolRankingItem,
  DashboardKolValue,
  DashboardOverviewValue,
  DashboardProductDistributionItem,
  DashboardRealtimeTradeItem,
  DashboardRealtimeValue,
  DashboardRebateTypeItem,
  DashboardRecentSettlementItem,
  DashboardSettlementMonitor,
  DashboardTradeAmountTrendPoint,
  DashboardTradeVolumeSymbolPoint,
  DashboardTradeVolumeTrendPoint,
  DashboardTrendsValue,
  DashboardWidgetConfig,
  GeoAnalyticsItem,
  GeoAnalyticsValue,
  KolContributionAnalyticsValue,
  KolContributionItem,
  ProductAnalyticsItem,
  ProductAnalyticsValue,
  PromotionLinkAttributionSummary,
  PromotionLinkAttributionSummaryWire,
  PromotionLinkInventorySummary,
  PromotionLinkInventorySummaryWire,
  PromotionLinkPerformanceSummary,
  PromotionLinkPerformanceSummaryWire,
  PromotionLinkSummaryEnvelope,
  PromotionLinkSummaryQuery,
  PromotionLinkSummaryValue,
  PromotionLinkSummaryWire,
  RiskExceptionAnalyticsValue,
  RiskExceptionItem,
  RiskExceptionOverview,
  SummaryDateRange,
  TeamHierarchyAnalyticsValue,
  TeamHierarchyItem,
  TrendComparisonAnalyticsValue,
  TrendComparisonMetric,
  TrendComparisonPoint,
  UserConversionAnalyticsValue,
  UserConversionFunnel,
  UserRetentionAnalyticsValue,
  UserRetentionItem,
  UserRetentionOverview,
} from "@/types/affinex";

function cleanParams(params: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      if (value === undefined || value === null || value === "") {
        return false;
      }
      return true;
    }),
  );
}

async function requestEnvelope<TEnvelope>(config: AxiosRequestConfig) {
  const result = await businessRequest<unknown>(config);
  return {
    ...result,
    envelope: result.envelope as unknown as TEnvelope,
  };
}

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }
  return {};
}

function toString(value: unknown) {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value);
}

function toNumber(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return 0;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return Boolean(value);
}

function toArray<T>(value: unknown, mapItem: (item: unknown) => T): T[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => mapItem(item));
}

function normalizeDateRange(dateRange?: unknown): SummaryDateRange {
  const raw = toRecord(dateRange);
  return {
    startDate: toString(raw.startDate),
    endDate: toString(raw.endDate),
  };
}

function normalizeInventory(
  inventory?: PromotionLinkInventorySummaryWire,
): PromotionLinkInventorySummary {
  return {
    approvedKolCount: toNumber(inventory?.approvedKolCount),
    defaultLinkCount: toNumber(inventory?.defaultLinkCount),
    activeDefaultLinkCount: toNumber(inventory?.activeDefaultLinkCount),
    activityLinkCount: toNumber(inventory?.activityLinkCount),
    enabledActivityLinkCount: toNumber(inventory?.enabledActivityLinkCount),
    totalLinkCount: toNumber(inventory?.totalLinkCount),
    totalActiveLinkCount: toNumber(inventory?.totalActiveLinkCount),
  };
}

function normalizeAttribution(
  attribution?: PromotionLinkAttributionSummaryWire,
): PromotionLinkAttributionSummary {
  return {
    callbackAttributionEventCount: toNumber(attribution?.callbackAttributionEventCount),
    callbackAttributionUserCount: toNumber(attribution?.callbackAttributionUserCount),
  };
}

function normalizePerformance(
  performance?: PromotionLinkPerformanceSummaryWire,
): PromotionLinkPerformanceSummary {
  return {
    registrationCount: toNumber(performance?.registrationCount),
    firstDepositUserCount: toNumber(performance?.firstDepositUserCount),
    successfulDepositAmountUsd: toNumber(performance?.successfulDepositAmountUsd),
    tradeUserCount: toNumber(performance?.tradeUserCount),
    tradeVolume: toNumber(performance?.tradeVolume),
    tradeAmountUsd: toNumber(performance?.tradeAmountUsd),
    earnedCommissionUsd: toNumber(performance?.earnedCommissionUsd),
    paidCommissionUsd: toNumber(performance?.paidCommissionUsd),
  };
}

function normalizeSummary(summary?: PromotionLinkSummaryWire): PromotionLinkSummaryValue {
  return {
    dateRange: normalizeDateRange(summary?.dateRange),
    inventory: normalizeInventory(summary?.inventory),
    attribution: normalizeAttribution(summary?.attribution),
    performance: normalizePerformance(summary?.performance),
  };
}

function normalizeAnalyticsSummary(value?: unknown): AnalyticsSummary {
  const raw = toRecord(value);
  return {
    dateRange: normalizeDateRange(raw.dateRange),
    visibleAffiliateCount: toNumber(raw.visibleAffiliateCount),
    approvedAffiliateCount: toNumber(raw.approvedAffiliateCount),
    registrationCount: toNumber(raw.registrationCount),
    firstDepositUserCount: toNumber(raw.firstDepositUserCount),
    depositAmountUsd: toNumber(raw.depositAmountUsd),
    tradeUserCount: toNumber(raw.tradeUserCount),
    tradeVolume: toNumber(raw.tradeVolume),
    tradeAmountUsd: toNumber(raw.tradeAmountUsd),
    earnedCommissionUsd: toNumber(raw.earnedCommissionUsd),
    paidCommissionUsd: toNumber(raw.paidCommissionUsd),
  };
}

function normalizeAnalyticsTrendPoint(value?: unknown): AnalyticsTrendPoint {
  const raw = toRecord(value);
  return {
    date: toString(raw.date),
    callbackUserCount: toNumber(raw.callbackUserCount),
    registrationCount: toNumber(raw.registrationCount),
    firstDepositUserCount: toNumber(raw.firstDepositUserCount),
    tradeUserCount: toNumber(raw.tradeUserCount),
    tradeAmountUsd: toNumber(raw.tradeAmountUsd),
    earnedCommissionUsd: toNumber(raw.earnedCommissionUsd),
  };
}

function normalizeKolContributionItem(value?: unknown): KolContributionItem {
  const raw = toRecord(value);
  return {
    affiliateId: toString(raw.affiliateId),
    affiliateCode: toString(raw.affiliateCode),
    affiliateName: toString(raw.affiliateName),
    ownerName: toString(raw.ownerName),
    countryCode: toString(raw.countryCode),
    activeLinkCount: toNumber(raw.activeLinkCount),
    registrationCount: toNumber(raw.registrationCount),
    firstDepositUserCount: toNumber(raw.firstDepositUserCount),
    tradeUserCount: toNumber(raw.tradeUserCount),
    tradeAmountUsd: toNumber(raw.tradeAmountUsd),
    earnedCommissionUsd: toNumber(raw.earnedCommissionUsd),
    contributionShare: toNumber(raw.contributionShare),
  };
}

function normalizeKolContributionValue(value?: unknown): KolContributionAnalyticsValue {
  const raw = toRecord(value);
  return {
    summary: normalizeAnalyticsSummary(raw.summary),
    trend: toArray(raw.trend, normalizeAnalyticsTrendPoint),
    contributions: toArray(raw.contributions, normalizeKolContributionItem),
  };
}

function normalizeUserConversionFunnel(value?: unknown): UserConversionFunnel {
  const raw = toRecord(value);
  return {
    callbackUserCount: toNumber(raw.callbackUserCount),
    registrationCount: toNumber(raw.registrationCount),
    firstDepositUserCount: toNumber(raw.firstDepositUserCount),
    tradeUserCount: toNumber(raw.tradeUserCount),
    callbackToRegistrationRate: toNumber(raw.callbackToRegistrationRate),
    registrationToFirstDepositRate: toNumber(raw.registrationToFirstDepositRate),
    firstDepositToTradeRate: toNumber(raw.firstDepositToTradeRate),
    overallTradeRate: toNumber(raw.overallTradeRate),
  };
}

function normalizeUserConversionValue(value?: unknown): UserConversionAnalyticsValue {
  const raw = toRecord(value);
  return {
    summary: normalizeAnalyticsSummary(raw.summary),
    funnel: normalizeUserConversionFunnel(raw.funnel),
    trend: toArray(raw.trend, normalizeAnalyticsTrendPoint),
  };
}

function normalizeUserRetentionOverview(value?: unknown): UserRetentionOverview {
  const raw = toRecord(value);
  return {
    averageRetention1dRate: toNumber(raw.averageRetention1dRate),
    averageRetention7dRate: toNumber(raw.averageRetention7dRate),
    averageRetention30dRate: toNumber(raw.averageRetention30dRate),
  };
}

function normalizeUserRetentionItem(value?: unknown): UserRetentionItem {
  const raw = toRecord(value);
  return {
    cohortDate: toString(raw.cohortDate),
    registeredUserCount: toNumber(raw.registeredUserCount),
    retained1dUserCount: toNumber(raw.retained1dUserCount),
    retained7dUserCount: toNumber(raw.retained7dUserCount),
    retained30dUserCount: toNumber(raw.retained30dUserCount),
    retention1dRate: toNumber(raw.retention1dRate),
    retention7dRate: toNumber(raw.retention7dRate),
    retention30dRate: toNumber(raw.retention30dRate),
  };
}

function normalizeUserRetentionValue(value?: unknown): UserRetentionAnalyticsValue {
  const raw = toRecord(value);
  return {
    summary: normalizeAnalyticsSummary(raw.summary),
    overview: normalizeUserRetentionOverview(raw.overview),
    cohorts: toArray(raw.cohorts, normalizeUserRetentionItem),
  };
}

function normalizeProductAnalyticsItem(value?: unknown): ProductAnalyticsItem {
  const raw = toRecord(value);
  return {
    symbolCode: toString(raw.symbolCode),
    symbolType: toString(raw.symbolType),
    tradeUserCount: toNumber(raw.tradeUserCount),
    orderCount: toNumber(raw.orderCount),
    tradeVolume: toNumber(raw.tradeVolume),
    tradeAmountUsd: toNumber(raw.tradeAmountUsd),
    earnedCommissionUsd: toNumber(raw.earnedCommissionUsd),
    averageOrderValueUsd: toNumber(raw.averageOrderValueUsd),
  };
}

function normalizeProductValue(value?: unknown): ProductAnalyticsValue {
  const raw = toRecord(value);
  return {
    summary: normalizeAnalyticsSummary(raw.summary),
    products: toArray(raw.products, normalizeProductAnalyticsItem),
  };
}

function normalizeGeoAnalyticsItem(value?: unknown): GeoAnalyticsItem {
  const raw = toRecord(value);
  return {
    countryCode: toString(raw.countryCode),
    registrationCount: toNumber(raw.registrationCount),
    firstDepositUserCount: toNumber(raw.firstDepositUserCount),
    tradeUserCount: toNumber(raw.tradeUserCount),
    depositAmountUsd: toNumber(raw.depositAmountUsd),
    tradeAmountUsd: toNumber(raw.tradeAmountUsd),
    earnedCommissionUsd: toNumber(raw.earnedCommissionUsd),
  };
}

function normalizeGeoValue(value?: unknown): GeoAnalyticsValue {
  const raw = toRecord(value);
  return {
    summary: normalizeAnalyticsSummary(raw.summary),
    geos: toArray(raw.geos, normalizeGeoAnalyticsItem),
  };
}

function normalizeChannelSourceItem(value?: unknown): ChannelSourceItem {
  const raw = toRecord(value);
  return {
    channel: toString(raw.channel),
    channelType: toString(raw.channelType),
    registrationCount: toNumber(raw.registrationCount),
    firstDepositUserCount: toNumber(raw.firstDepositUserCount),
    tradeUserCount: toNumber(raw.tradeUserCount),
    depositAmountUsd: toNumber(raw.depositAmountUsd),
    tradeAmountUsd: toNumber(raw.tradeAmountUsd),
  };
}

function normalizeChannelSourceSystemItem(value?: unknown): ChannelSourceSystemItem {
  const raw = toRecord(value);
  return {
    system: toString(raw.system),
    device: toString(raw.device),
    registrationCount: toNumber(raw.registrationCount),
    tradeUserCount: toNumber(raw.tradeUserCount),
  };
}

function normalizeChannelSourceValue(value?: unknown): ChannelSourceAnalyticsValue {
  const raw = toRecord(value);
  return {
    summary: normalizeAnalyticsSummary(raw.summary),
    sources: toArray(raw.sources, normalizeChannelSourceItem),
    systems: toArray(raw.systems, normalizeChannelSourceSystemItem),
  };
}

function normalizeTeamHierarchyItem(value?: unknown): TeamHierarchyItem {
  const raw = toRecord(value);
  return {
    ownerAdminId: toString(raw.ownerAdminId),
    ownerName: toString(raw.ownerName),
    affiliateCount: toNumber(raw.affiliateCount),
    approvedAffiliateCount: toNumber(raw.approvedAffiliateCount),
    activeLinkCount: toNumber(raw.activeLinkCount),
    registrationCount: toNumber(raw.registrationCount),
    firstDepositUserCount: toNumber(raw.firstDepositUserCount),
    tradeUserCount: toNumber(raw.tradeUserCount),
    earnedCommissionUsd: toNumber(raw.earnedCommissionUsd),
    paidCommissionUsd: toNumber(raw.paidCommissionUsd),
  };
}

function normalizeTeamHierarchyValue(value?: unknown): TeamHierarchyAnalyticsValue {
  const raw = toRecord(value);
  return {
    summary: normalizeAnalyticsSummary(raw.summary),
    teams: toArray(raw.teams, normalizeTeamHierarchyItem),
  };
}

function normalizeRiskExceptionOverview(value?: unknown): RiskExceptionOverview {
  const raw = toRecord(value);
  return {
    pendingTrafficCount: toNumber(raw.pendingTrafficCount),
    rejectedTrafficCount: toNumber(raw.rejectedTrafficCount),
    pendingKycCount: toNumber(raw.pendingKycCount),
    rejectedKycCount: toNumber(raw.rejectedKycCount),
    declinedPaymentCount: toNumber(raw.declinedPaymentCount),
    declinedPaymentAmountUsd: toNumber(raw.declinedPaymentAmountUsd),
    callbackWithoutRegistrationCount: toNumber(raw.callbackWithoutRegistrationCount),
    registrationWithoutDepositCount: toNumber(raw.registrationWithoutDepositCount),
    firstDepositWithoutTradeCount: toNumber(raw.firstDepositWithoutTradeCount),
  };
}

function normalizeRiskExceptionItem(value?: unknown): RiskExceptionItem {
  const raw = toRecord(value);
  return {
    category: toString(raw.category),
    label: toString(raw.label),
    count: toNumber(raw.count),
    amountUsd: toNumber(raw.amountUsd),
  };
}

function normalizeRiskExceptionValue(value?: unknown): RiskExceptionAnalyticsValue {
  const raw = toRecord(value);
  return {
    overview: normalizeRiskExceptionOverview(raw.overview),
    items: toArray(raw.items, normalizeRiskExceptionItem),
  };
}

function normalizeTrendComparisonMetric(value?: unknown): TrendComparisonMetric {
  const raw = toRecord(value);
  return {
    metricCode: toString(raw.metricCode),
    label: toString(raw.label),
    currentValue: toNumber(raw.currentValue),
    compareValue: toNumber(raw.compareValue),
    diffValue: toNumber(raw.diffValue),
    diffRate: toNumber(raw.diffRate),
  };
}

function normalizeTrendComparisonPoint(value?: unknown): TrendComparisonPoint {
  const raw = toRecord(value);
  return {
    label: toString(raw.label),
    currentDate: toString(raw.currentDate),
    compareDate: toString(raw.compareDate),
    currentRegistrationCount: toNumber(raw.currentRegistrationCount),
    compareRegistrationCount: toNumber(raw.compareRegistrationCount),
    currentTradeUserCount: toNumber(raw.currentTradeUserCount),
    compareTradeUserCount: toNumber(raw.compareTradeUserCount),
    currentTradeAmountUsd: toNumber(raw.currentTradeAmountUsd),
    compareTradeAmountUsd: toNumber(raw.compareTradeAmountUsd),
    currentEarnedCommissionUsd: toNumber(raw.currentEarnedCommissionUsd),
    compareEarnedCommissionUsd: toNumber(raw.compareEarnedCommissionUsd),
  };
}

function normalizeTrendComparisonValue(value?: unknown): TrendComparisonAnalyticsValue {
  const raw = toRecord(value);
  return {
    currentSummary: normalizeAnalyticsSummary(raw.currentSummary),
    compareSummary: normalizeAnalyticsSummary(raw.compareSummary),
    metrics: toArray(raw.metrics, normalizeTrendComparisonMetric),
    trend: toArray(raw.trend, normalizeTrendComparisonPoint),
  };
}

function normalizeDashboardWidget(value?: unknown): DashboardWidgetConfig {
  const raw = toRecord(value);
  return {
    widgetCode: toString(raw.widgetCode),
    title: toString(raw.title),
    visible: toBoolean(raw.visible),
    sort: toNumber(raw.sort),
  };
}

function normalizeAnalyticsDashboardConfig(value?: unknown): AnalyticsDashboardConfig {
  const raw = toRecord(value);
  return {
    resourceCode: toString(raw.resourceCode),
    defaultDatePreset: toString(raw.defaultDatePreset) as AnalyticsDashboardConfig["defaultDatePreset"],
    widgets: toArray(raw.widgets, normalizeDashboardWidget),
    updatedAt: toString(raw.updatedAt),
  };
}

function normalizeDashboardKpiCard(value?: unknown): DashboardKpiCard {
  const raw = toRecord(value);
  return {
    code: toString(raw.code),
    label: toString(raw.label),
    value: toNumber(raw.value),
    compareValue: toNumber(raw.compareValue),
    diffValue: toNumber(raw.diffValue),
    diffRate: toNumber(raw.diffRate),
    unit: toString(raw.unit),
  };
}

function normalizeDashboardOverviewValue(value?: unknown): DashboardOverviewValue {
  const raw = toRecord(value);
  return {
    dateRange: normalizeDateRange(raw.dateRange),
    generatedAt: toString(raw.generatedAt),
    defaultRefreshSeconds: toNumber(raw.defaultRefreshSeconds),
    cards: toArray(raw.cards, normalizeDashboardKpiCard),
  };
}

function normalizeDashboardTradeAmountTrendPoint(value?: unknown): DashboardTradeAmountTrendPoint {
  const raw = toRecord(value);
  return {
    date: toString(raw.date),
    tradeAmountUsd: toNumber(raw.tradeAmountUsd),
    tradeUserCount: toNumber(raw.tradeUserCount),
  };
}

function normalizeDashboardCommissionTrendPoint(value?: unknown): DashboardCommissionTrendPoint {
  const raw = toRecord(value);
  return {
    date: toString(raw.date),
    earnedCommissionUsd: toNumber(raw.earnedCommissionUsd),
    dayOverDayRate: toNumber(raw.dayOverDayRate),
  };
}

function normalizeDashboardTradeVolumeSymbolPoint(value?: unknown): DashboardTradeVolumeSymbolPoint {
  const raw = toRecord(value);
  return {
    symbolCode: toString(raw.symbolCode),
    tradeVolume: toNumber(raw.tradeVolume),
  };
}

function normalizeDashboardTradeVolumeTrendPoint(value?: unknown): DashboardTradeVolumeTrendPoint {
  const raw = toRecord(value);
  return {
    date: toString(raw.date),
    totalTradeVolume: toNumber(raw.totalTradeVolume),
    dayOverDayRate: toNumber(raw.dayOverDayRate),
    symbols: toArray(raw.symbols, normalizeDashboardTradeVolumeSymbolPoint),
  };
}

function normalizeDashboardTrendsValue(value?: unknown): DashboardTrendsValue {
  const raw = toRecord(value);
  return {
    dateRange: normalizeDateRange(raw.dateRange),
    tradeAmountTrend: toArray(raw.tradeAmountTrend, normalizeDashboardTradeAmountTrendPoint),
    commissionTrend: toArray(raw.commissionTrend, normalizeDashboardCommissionTrendPoint),
    tradeVolumeTrend: toArray(raw.tradeVolumeTrend, normalizeDashboardTradeVolumeTrendPoint),
  };
}

function normalizeDashboardGeoDistributionItem(value?: unknown): DashboardGeoDistributionItem {
  const raw = toRecord(value);
  return {
    countryCode: toString(raw.countryCode),
    tradeAmountUsd: toNumber(raw.tradeAmountUsd),
    tradeUserCount: toNumber(raw.tradeUserCount),
  };
}

function normalizeDashboardRebateTypeItem(value?: unknown): DashboardRebateTypeItem {
  const raw = toRecord(value);
  return {
    typeCode: toString(raw.typeCode),
    label: toString(raw.label),
    amountUsd: toNumber(raw.amountUsd),
    share: toNumber(raw.share),
  };
}

function normalizeDashboardProductDistributionItem(value?: unknown): DashboardProductDistributionItem {
  const raw = toRecord(value);
  return {
    symbolCode: toString(raw.symbolCode),
    tradeAmountUsd: toNumber(raw.tradeAmountUsd),
    tradeUserCount: toNumber(raw.tradeUserCount),
    share: toNumber(raw.share),
  };
}

function normalizeDashboardAccountTypeItem(value?: unknown): DashboardAccountTypeItem {
  const raw = toRecord(value);
  return {
    accountType: toString(raw.accountType),
    count: toNumber(raw.count),
    share: toNumber(raw.share),
  };
}

function normalizeDashboardDistributionsValue(value?: unknown): DashboardDistributionsValue {
  const raw = toRecord(value);
  return {
    dateRange: normalizeDateRange(raw.dateRange),
    geoHeatmap: toArray(raw.geoHeatmap, normalizeDashboardGeoDistributionItem),
    geoTopCountries: toArray(raw.geoTopCountries, normalizeDashboardGeoDistributionItem),
    rebateTypes: toArray(raw.rebateTypes, normalizeDashboardRebateTypeItem),
    products: toArray(raw.products, normalizeDashboardProductDistributionItem),
    accountTypes: toArray(raw.accountTypes, normalizeDashboardAccountTypeItem),
  };
}

function normalizeDashboardKolRankingItem(value?: unknown): DashboardKolRankingItem {
  const raw = toRecord(value);
  return {
    affiliateId: toString(raw.affiliateId),
    affiliateCode: toString(raw.affiliateCode),
    affiliateName: toString(raw.affiliateName),
    ownerName: toString(raw.ownerName),
    countryCode: toString(raw.countryCode),
    broughtUserCount: toNumber(raw.broughtUserCount),
    tradeAmountUsd: toNumber(raw.tradeAmountUsd),
    earnedCommissionUsd: toNumber(raw.earnedCommissionUsd),
  };
}

function normalizeDashboardKolValue(value?: unknown): DashboardKolValue {
  const raw = toRecord(value);
  return {
    dateRange: normalizeDateRange(raw.dateRange),
    totalKolCount: toNumber(raw.totalKolCount),
    ranking: toArray(raw.ranking, normalizeDashboardKolRankingItem),
    funnel: normalizeUserConversionFunnel(raw.funnel),
  };
}

function normalizeDashboardRealtimeTradeItem(value?: unknown): DashboardRealtimeTradeItem {
  const raw = toRecord(value);
  return {
    openTime: toString(raw.openTime),
    symbolCode: toString(raw.symbolCode),
    orderType: toString(raw.orderType),
    volume: toNumber(raw.volume),
    tradeAmountUsd: toNumber(raw.tradeAmountUsd),
    affiliateName: toString(raw.affiliateName),
  };
}

function normalizeDashboardSettlementMonitor(value?: unknown): DashboardSettlementMonitor {
  const raw = toRecord(value);
  return {
    pendingSettlementAmountUsd: toNumber(raw.pendingSettlementAmountUsd),
    monthSettledAmountUsd: toNumber(raw.monthSettledAmountUsd),
    cumulativeSettledAmountUsd: toNumber(raw.cumulativeSettledAmountUsd),
    settlingKolCount: toNumber(raw.settlingKolCount),
  };
}

function normalizeDashboardRecentSettlementItem(value?: unknown): DashboardRecentSettlementItem {
  const raw = toRecord(value);
  return {
    settlementId: toNumber(raw.settlementId),
    affiliateName: toString(raw.affiliateName),
    payableAmountUsd: toNumber(raw.payableAmountUsd),
    settlementTime: toString(raw.settlementTime),
    status: toString(raw.status),
  };
}

function normalizeDashboardAlertItem(value?: unknown): DashboardAlertItem {
  const raw = toRecord(value);
  return {
    code: toString(raw.code),
    label: toString(raw.label),
    count: toNumber(raw.count),
    severity: toString(raw.severity),
  };
}

function normalizeDashboardRealtimeValue(value?: unknown): DashboardRealtimeValue {
  const raw = toRecord(value);
  return {
    dateRange: normalizeDateRange(raw.dateRange),
    settlementMonitor: normalizeDashboardSettlementMonitor(raw.settlementMonitor),
    recentTrades: toArray(raw.recentTrades, normalizeDashboardRealtimeTradeItem),
    recentSettlements: toArray(raw.recentSettlements, normalizeDashboardRecentSettlementItem),
    alerts: toArray(raw.alerts, normalizeDashboardAlertItem),
  };
}

const analyticsPaths: Record<AffinexAnalyticsEndpoint, string> = {
  kolContribution: "/admin/affinex/analytics/kolContribution",
  userConversion: "/admin/affinex/analytics/userConversion",
  userRetention: "/admin/affinex/analytics/userRetention",
  product: "/admin/affinex/analytics/product",
  geo: "/admin/affinex/analytics/geo",
  channelSource: "/admin/affinex/analytics/channelSource",
  teamHierarchy: "/admin/affinex/analytics/teamHierarchy",
  riskException: "/admin/affinex/analytics/riskException",
  trendComparison: "/admin/affinex/analytics/trendComparison",
};

const analyticsNormalizers: {
  [TEndpoint in AffinexAnalyticsEndpoint]: (value?: unknown) => AffinexAnalyticsValueMap[TEndpoint];
} = {
  kolContribution: normalizeKolContributionValue,
  userConversion: normalizeUserConversionValue,
  userRetention: normalizeUserRetentionValue,
  product: normalizeProductValue,
  geo: normalizeGeoValue,
  channelSource: normalizeChannelSourceValue,
  teamHierarchy: normalizeTeamHierarchyValue,
  riskException: normalizeRiskExceptionValue,
  trendComparison: normalizeTrendComparisonValue,
};

export const affinexApi = {
  getPromotionLinkSummary: async (query: PromotionLinkSummaryQuery) => {
    const result = await requestEnvelope<PromotionLinkSummaryEnvelope>({
      url: "/admin/affinex/promotionLinkSummary",
      method: "GET",
      params: cleanParams({
        startDate: query.startDate,
        endDate: query.endDate,
        affiliateId: query.affiliateId?.trim(),
      }),
    });

    return {
      ...result,
      value: normalizeSummary(result.envelope.summary),
    };
  },

  getAnalytics: async <TEndpoint extends AffinexAnalyticsEndpoint>(
    endpoint: TEndpoint,
    query: AnalyticsQuery,
  ) => {
    const result = await businessRequest<unknown>({
      url: analyticsPaths[endpoint],
      method: "GET",
      params: cleanParams({
        startDate: query.startDate,
        endDate: query.endDate,
        affiliateId: query.affiliateId?.trim(),
        affiliateCode: query.affiliateCode?.trim(),
        topN: query.topN,
        compareStartDate: query.compareStartDate,
        compareEndDate: query.compareEndDate,
      }),
    });

    return {
      ...result,
      value: analyticsNormalizers[endpoint](result.value),
    };
  },

  getAnalyticsDashboardConfig: async (resourceCode: string) => {
    const result = await businessRequest<unknown>({
      url: "/admin/affinex/analytics/dashboardConfig",
      method: "GET",
      params: cleanParams({
        resourceCode: resourceCode.trim(),
      }),
    });

    return {
      ...result,
      value: normalizeAnalyticsDashboardConfig(result.value),
    };
  },

  updateAnalyticsDashboardConfig: async (payload: {
    resourceCode: string;
    defaultDatePreset?: string;
    widgets?: DashboardWidgetConfig[];
  }) => {
    const result = await businessRequest<unknown>({
      url: "/admin/affinex/analytics/dashboardConfig",
      method: "PUT",
      data: {
        resourceCode: payload.resourceCode.trim(),
        defaultDatePreset: payload.defaultDatePreset?.trim() ?? "",
        widgets: (payload.widgets ?? []).map((widget) => ({
          widgetCode: widget.widgetCode,
          title: widget.title,
          visible: widget.visible,
          sort: widget.sort,
        })),
      },
    });

    return {
      ...result,
      value: normalizeAnalyticsDashboardConfig(result.value),
    };
  },

  getDashboardOverview: async (query: AnalyticsQuery) => {
    const result = await businessRequest<unknown>({
      url: "/admin/affinex/dashboard/overview",
      method: "GET",
      params: cleanParams(query),
    });

    return {
      ...result,
      value: normalizeDashboardOverviewValue(result.value),
    };
  },

  getDashboardTrends: async (query: AnalyticsQuery) => {
    const result = await businessRequest<unknown>({
      url: "/admin/affinex/dashboard/trends",
      method: "GET",
      params: cleanParams(query),
    });

    return {
      ...result,
      value: normalizeDashboardTrendsValue(result.value),
    };
  },

  getDashboardDistributions: async (query: AnalyticsQuery) => {
    const result = await businessRequest<unknown>({
      url: "/admin/affinex/dashboard/distributions",
      method: "GET",
      params: cleanParams(query),
    });

    return {
      ...result,
      value: normalizeDashboardDistributionsValue(result.value),
    };
  },

  getDashboardKol: async (query: AnalyticsQuery) => {
    const result = await businessRequest<unknown>({
      url: "/admin/affinex/dashboard/kol",
      method: "GET",
      params: cleanParams(query),
    });

    return {
      ...result,
      value: normalizeDashboardKolValue(result.value),
    };
  },

  getDashboardRealtime: async (query: AnalyticsQuery) => {
    const result = await businessRequest<unknown>({
      url: "/admin/affinex/dashboard/realtime",
      method: "GET",
      params: cleanParams(query),
    });

    return {
      ...result,
      value: normalizeDashboardRealtimeValue(result.value),
    };
  },
};

export type AffinexApi = typeof affinexApi;
