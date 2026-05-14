export interface PromotionLinkSummaryQuery {
  startDate?: string;
  endDate?: string;
  affiliateId?: string;
}

export interface SummaryDateRange {
  startDate: string;
  endDate: string;
}

export interface PromotionLinkInventorySummary {
  approvedKolCount: number;
  defaultLinkCount: number;
  activeDefaultLinkCount: number;
  activityLinkCount: number;
  enabledActivityLinkCount: number;
  totalLinkCount: number;
  totalActiveLinkCount: number;
}

export interface PromotionLinkAttributionSummary {
  callbackAttributionEventCount: number;
  callbackAttributionUserCount: number;
}

export interface PromotionLinkPerformanceSummary {
  registrationCount: number;
  firstDepositUserCount: number;
  successfulDepositAmountUsd: number;
  tradeUserCount: number;
  tradeVolume: number;
  tradeAmountUsd: number;
  earnedCommissionUsd: number;
  paidCommissionUsd: number;
}

export interface PromotionLinkSummaryValue {
  dateRange: SummaryDateRange;
  inventory: PromotionLinkInventorySummary;
  attribution: PromotionLinkAttributionSummary;
  performance: PromotionLinkPerformanceSummary;
}

export interface SummaryDateRangeWire {
  startDate?: string;
  endDate?: string;
}

export interface PromotionLinkInventorySummaryWire {
  approvedKolCount?: number | string;
  defaultLinkCount?: number | string;
  activeDefaultLinkCount?: number | string;
  activityLinkCount?: number | string;
  enabledActivityLinkCount?: number | string;
  totalLinkCount?: number | string;
  totalActiveLinkCount?: number | string;
}

export interface PromotionLinkAttributionSummaryWire {
  callbackAttributionEventCount?: number | string;
  callbackAttributionUserCount?: number | string;
}

export interface PromotionLinkPerformanceSummaryWire {
  registrationCount?: number | string;
  firstDepositUserCount?: number | string;
  successfulDepositAmountUsd?: number | string;
  tradeUserCount?: number | string;
  tradeVolume?: number | string;
  tradeAmountUsd?: number | string;
  earnedCommissionUsd?: number | string;
  paidCommissionUsd?: number | string;
}

export interface PromotionLinkSummaryWire {
  dateRange?: SummaryDateRangeWire;
  inventory?: PromotionLinkInventorySummaryWire;
  attribution?: PromotionLinkAttributionSummaryWire;
  performance?: PromotionLinkPerformanceSummaryWire;
}

export interface PromotionLinkSummaryEnvelope {
  success: boolean;
  message: string;
  errCode?: number;
  summary?: PromotionLinkSummaryWire;
  nonce?: string;
}

export type AffinexAnalyticsEndpoint =
  | "kolContribution"
  | "userConversion"
  | "userRetention"
  | "product"
  | "geo"
  | "channelSource"
  | "teamHierarchy"
  | "riskException"
  | "trendComparison";

export type AnalyticsDatePreset = "last7d" | "last30d" | "last90d";

export interface AnalyticsQuery {
  startDate?: string;
  endDate?: string;
  affiliateId?: string;
  affiliateCode?: string;
  topN?: number;
  compareStartDate?: string;
  compareEndDate?: string;
}

export interface AnalyticsSummary {
  dateRange: SummaryDateRange;
  visibleAffiliateCount: number;
  approvedAffiliateCount: number;
  registrationCount: number;
  firstDepositUserCount: number;
  depositAmountUsd: number;
  tradeUserCount: number;
  tradeVolume: number;
  tradeAmountUsd: number;
  earnedCommissionUsd: number;
  paidCommissionUsd: number;
}

export interface AnalyticsTrendPoint {
  date: string;
  callbackUserCount: number;
  registrationCount: number;
  firstDepositUserCount: number;
  tradeUserCount: number;
  tradeAmountUsd: number;
  earnedCommissionUsd: number;
}

export interface KolContributionItem {
  affiliateId: string;
  affiliateCode: string;
  affiliateName: string;
  ownerName: string;
  countryCode: string;
  activeLinkCount: number;
  registrationCount: number;
  firstDepositUserCount: number;
  tradeUserCount: number;
  tradeAmountUsd: number;
  earnedCommissionUsd: number;
  contributionShare: number;
}

export interface KolContributionAnalyticsValue {
  summary: AnalyticsSummary;
  trend: AnalyticsTrendPoint[];
  contributions: KolContributionItem[];
}

export interface UserConversionFunnel {
  callbackUserCount: number;
  registrationCount: number;
  firstDepositUserCount: number;
  tradeUserCount: number;
  callbackToRegistrationRate: number;
  registrationToFirstDepositRate: number;
  firstDepositToTradeRate: number;
  overallTradeRate: number;
}

export interface UserConversionAnalyticsValue {
  summary: AnalyticsSummary;
  funnel: UserConversionFunnel;
  trend: AnalyticsTrendPoint[];
}

export interface UserRetentionOverview {
  averageRetention1dRate: number;
  averageRetention7dRate: number;
  averageRetention30dRate: number;
}

export interface UserRetentionItem {
  cohortDate: string;
  registeredUserCount: number;
  retained1dUserCount: number;
  retained7dUserCount: number;
  retained30dUserCount: number;
  retention1dRate: number;
  retention7dRate: number;
  retention30dRate: number;
}

export interface UserRetentionAnalyticsValue {
  summary: AnalyticsSummary;
  overview: UserRetentionOverview;
  cohorts: UserRetentionItem[];
}

export interface ProductAnalyticsItem {
  symbolCode: string;
  symbolType: string;
  tradeUserCount: number;
  orderCount: number;
  tradeVolume: number;
  tradeAmountUsd: number;
  earnedCommissionUsd: number;
  averageOrderValueUsd: number;
}

export interface ProductAnalyticsValue {
  summary: AnalyticsSummary;
  products: ProductAnalyticsItem[];
}

export interface GeoAnalyticsItem {
  countryCode: string;
  registrationCount: number;
  firstDepositUserCount: number;
  tradeUserCount: number;
  depositAmountUsd: number;
  tradeAmountUsd: number;
  earnedCommissionUsd: number;
}

export interface GeoAnalyticsValue {
  summary: AnalyticsSummary;
  geos: GeoAnalyticsItem[];
}

export interface ChannelSourceItem {
  channel: string;
  channelType: string;
  registrationCount: number;
  firstDepositUserCount: number;
  tradeUserCount: number;
  depositAmountUsd: number;
  tradeAmountUsd: number;
}

export interface ChannelSourceSystemItem {
  system: string;
  device: string;
  registrationCount: number;
  tradeUserCount: number;
}

export interface ChannelSourceAnalyticsValue {
  summary: AnalyticsSummary;
  sources: ChannelSourceItem[];
  systems: ChannelSourceSystemItem[];
}

export interface TeamHierarchyItem {
  ownerAdminId: string;
  ownerName: string;
  affiliateCount: number;
  approvedAffiliateCount: number;
  activeLinkCount: number;
  registrationCount: number;
  firstDepositUserCount: number;
  tradeUserCount: number;
  earnedCommissionUsd: number;
  paidCommissionUsd: number;
}

export interface TeamHierarchyAnalyticsValue {
  summary: AnalyticsSummary;
  teams: TeamHierarchyItem[];
}

export interface RiskExceptionOverview {
  pendingTrafficCount: number;
  rejectedTrafficCount: number;
  pendingKycCount: number;
  rejectedKycCount: number;
  declinedPaymentCount: number;
  declinedPaymentAmountUsd: number;
  callbackWithoutRegistrationCount: number;
  registrationWithoutDepositCount: number;
  firstDepositWithoutTradeCount: number;
}

export interface RiskExceptionItem {
  category: string;
  label: string;
  count: number;
  amountUsd: number;
}

export interface RiskExceptionAnalyticsValue {
  overview: RiskExceptionOverview;
  items: RiskExceptionItem[];
}

export interface TrendComparisonMetric {
  metricCode: string;
  label: string;
  currentValue: number;
  compareValue: number;
  diffValue: number;
  diffRate: number;
}

export interface TrendComparisonPoint {
  label: string;
  currentDate: string;
  compareDate: string;
  currentRegistrationCount: number;
  compareRegistrationCount: number;
  currentTradeUserCount: number;
  compareTradeUserCount: number;
  currentTradeAmountUsd: number;
  compareTradeAmountUsd: number;
  currentEarnedCommissionUsd: number;
  compareEarnedCommissionUsd: number;
}

export interface TrendComparisonAnalyticsValue {
  currentSummary: AnalyticsSummary;
  compareSummary: AnalyticsSummary;
  metrics: TrendComparisonMetric[];
  trend: TrendComparisonPoint[];
}

export interface DashboardWidgetConfig {
  widgetCode: string;
  title: string;
  visible: boolean;
  sort: number;
}

export interface AnalyticsDashboardConfig {
  resourceCode: string;
  defaultDatePreset: AnalyticsDatePreset | "";
  widgets: DashboardWidgetConfig[];
  updatedAt: string;
}

export interface AffinexAnalyticsValueMap {
  kolContribution: KolContributionAnalyticsValue;
  userConversion: UserConversionAnalyticsValue;
  userRetention: UserRetentionAnalyticsValue;
  product: ProductAnalyticsValue;
  geo: GeoAnalyticsValue;
  channelSource: ChannelSourceAnalyticsValue;
  teamHierarchy: TeamHierarchyAnalyticsValue;
  riskException: RiskExceptionAnalyticsValue;
  trendComparison: TrendComparisonAnalyticsValue;
}

export interface DashboardKpiCard {
  code: string;
  label: string;
  value: number;
  compareValue: number;
  diffValue: number;
  diffRate: number;
  unit: string;
}

export interface DashboardOverviewValue {
  dateRange: SummaryDateRange;
  generatedAt: string;
  defaultRefreshSeconds: number;
  cards: DashboardKpiCard[];
}

export interface DashboardTradeAmountTrendPoint {
  date: string;
  tradeAmountUsd: number;
  tradeUserCount: number;
}

export interface DashboardCommissionTrendPoint {
  date: string;
  earnedCommissionUsd: number;
  dayOverDayRate: number;
}

export interface DashboardTradeVolumeSymbolPoint {
  symbolCode: string;
  tradeVolume: number;
}

export interface DashboardTradeVolumeTrendPoint {
  date: string;
  totalTradeVolume: number;
  dayOverDayRate: number;
  symbols: DashboardTradeVolumeSymbolPoint[];
}

export interface DashboardTrendsValue {
  dateRange: SummaryDateRange;
  tradeAmountTrend: DashboardTradeAmountTrendPoint[];
  commissionTrend: DashboardCommissionTrendPoint[];
  tradeVolumeTrend: DashboardTradeVolumeTrendPoint[];
}

export interface DashboardGeoDistributionItem {
  countryCode: string;
  tradeAmountUsd: number;
  tradeUserCount: number;
}

export interface DashboardRebateTypeItem {
  typeCode: string;
  label: string;
  amountUsd: number;
  share: number;
}

export interface DashboardProductDistributionItem {
  symbolCode: string;
  tradeAmountUsd: number;
  tradeUserCount: number;
  share: number;
}

export interface DashboardAccountTypeItem {
  accountType: string;
  count: number;
  share: number;
}

export interface DashboardDistributionsValue {
  dateRange: SummaryDateRange;
  geoHeatmap: DashboardGeoDistributionItem[];
  geoTopCountries: DashboardGeoDistributionItem[];
  rebateTypes: DashboardRebateTypeItem[];
  products: DashboardProductDistributionItem[];
  accountTypes: DashboardAccountTypeItem[];
}

export interface DashboardKolRankingItem {
  affiliateId: string;
  affiliateCode: string;
  affiliateName: string;
  ownerName: string;
  countryCode: string;
  broughtUserCount: number;
  tradeAmountUsd: number;
  earnedCommissionUsd: number;
}

export interface DashboardKolValue {
  dateRange: SummaryDateRange;
  totalKolCount: number;
  ranking: DashboardKolRankingItem[];
  funnel: UserConversionFunnel;
}

export interface DashboardRealtimeTradeItem {
  openTime: string;
  symbolCode: string;
  orderType: string;
  volume: number;
  tradeAmountUsd: number;
  affiliateName: string;
}

export interface DashboardSettlementMonitor {
  pendingSettlementAmountUsd: number;
  monthSettledAmountUsd: number;
  cumulativeSettledAmountUsd: number;
  settlingKolCount: number;
}

export interface DashboardRecentSettlementItem {
  settlementId: number;
  affiliateName: string;
  payableAmountUsd: number;
  settlementTime: string;
  status: string;
}

export interface DashboardAlertItem {
  code: string;
  label: string;
  count: number;
  severity: string;
}

export interface DashboardRealtimeValue {
  dateRange: SummaryDateRange;
  settlementMonitor: DashboardSettlementMonitor;
  recentTrades: DashboardRealtimeTradeItem[];
  recentSettlements: DashboardRecentSettlementItem[];
  alerts: DashboardAlertItem[];
}
