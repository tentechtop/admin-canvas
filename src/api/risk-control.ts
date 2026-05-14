import type { AxiosRequestConfig } from "axios";
import { businessRequest } from "@/lib/business-http";
import type {
  BlacklistEntry,
  BlacklistListValue,
  CreateBlacklistEntryPayload,
  CreateRiskRulePayload,
  DeleteBlacklistEntryPayload,
  KolRiskFlag,
  KolRiskReviewDetail,
  KolRiskReviewItem,
  KolRiskReviewListValue,
  ListBlacklistEntriesQuery,
  ListKolRiskReviewsQuery,
  ListRiskAlertsQuery,
  ListRiskRulesQuery,
  ListWithdrawalRiskReviewsQuery,
  RecentRiskActionItem,
  ReviewKolRiskPayload,
  ReviewWithdrawalRiskPayload,
  RiskAlertItem,
  RiskAlertListValue,
  RiskAlertSummary,
  RiskDashboardCard,
  RiskDashboardTrendPoint,
  RiskDashboardValue,
  RiskPendingReviewSummary,
  RiskQueryBase,
  RiskReviewRecord,
  RiskRuleAction,
  RiskRuleCondition,
  RiskRuleItem,
  RiskRuleListValue,
  RiskRuleSummary,
  RiskSeverityDistributionItem,
  ToggleRiskRulePayload,
  TopRiskAffiliateItem,
  UpdateBlacklistEntryPayload,
  UpdateRiskAlertPayload,
  UpdateRiskRulePayload,
  WithdrawalRiskReviewDetail,
  WithdrawalRiskReviewItem,
  WithdrawalRiskReviewListValue,
} from "@/types/risk-control";

function cleanParams(params: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      if (value === undefined || value === null || value === "") {
        return false;
      }
      if (Array.isArray(value) && value.length === 0) {
        return false;
      }
      return true;
    }),
  );
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
  return value.map(mapItem);
}

function normalizeDateRange(value?: unknown) {
  const raw = toRecord(value);
  return {
    startDate: toString(raw.startDate),
    endDate: toString(raw.endDate),
  };
}

function normalizeDashboardCard(value?: unknown): RiskDashboardCard {
  const raw = toRecord(value);
  return {
    code: toString(raw.code),
    label: toString(raw.label),
    count: toNumber(raw.count),
    compareCount: toNumber(raw.compareCount),
    diffCount: toNumber(raw.diffCount),
    diffRate: toNumber(raw.diffRate),
    severity: toString(raw.severity),
  };
}

function normalizeDashboardTrendPoint(value?: unknown): RiskDashboardTrendPoint {
  const raw = toRecord(value);
  return {
    date: toString(raw.date),
    alertCount: toNumber(raw.alertCount),
    handledCount: toNumber(raw.handledCount),
    pendingKolReviewCount: toNumber(raw.pendingKolReviewCount),
    pendingWithdrawalReviewCount: toNumber(raw.pendingWithdrawalReviewCount),
    blacklistHitCount: toNumber(raw.blacklistHitCount),
  };
}

function normalizeSeverityDistributionItem(value?: unknown): RiskSeverityDistributionItem {
  const raw = toRecord(value);
  return {
    severity: toString(raw.severity),
    label: toString(raw.label),
    count: toNumber(raw.count),
    share: toNumber(raw.share),
  };
}

function normalizePendingSummary(value?: unknown): RiskPendingReviewSummary {
  const raw = toRecord(value);
  return {
    pendingKolReviewCount: toNumber(raw.pendingKolReviewCount),
    pendingWithdrawalReviewCount: toNumber(raw.pendingWithdrawalReviewCount),
    overdueAlertCount: toNumber(raw.overdueAlertCount),
    activeBlacklistCount: toNumber(raw.activeBlacklistCount),
    enabledRuleCount: toNumber(raw.enabledRuleCount),
  };
}

function normalizeTopAffiliateItem(value?: unknown): TopRiskAffiliateItem {
  const raw = toRecord(value);
  return {
    affiliateId: toString(raw.affiliateId),
    affiliateCode: toString(raw.affiliateCode),
    affiliateName: toString(raw.affiliateName),
    ownerName: toString(raw.ownerName),
    alertCount: toNumber(raw.alertCount),
    criticalAlertCount: toNumber(raw.criticalAlertCount),
    pendingReviewCount: toNumber(raw.pendingReviewCount),
    blacklistHitCount: toNumber(raw.blacklistHitCount),
    riskScore: toNumber(raw.riskScore),
  };
}

function normalizeRecentRiskActionItem(value?: unknown): RecentRiskActionItem {
  const raw = toRecord(value);
  return {
    actionType: toString(raw.actionType),
    targetType: toString(raw.targetType),
    targetId: toString(raw.targetId),
    targetName: toString(raw.targetName),
    operatorId: toString(raw.operatorId),
    operatorName: toString(raw.operatorName),
    result: toString(raw.result),
    createdAt: toString(raw.createdAt),
  };
}

function normalizeRiskDashboardValue(value?: unknown): RiskDashboardValue {
  const raw = toRecord(value);
  return {
    dateRange: normalizeDateRange(raw.dateRange),
    generatedAt: toString(raw.generatedAt),
    cards: toArray(raw.cards, normalizeDashboardCard),
    trend: toArray(raw.trend, normalizeDashboardTrendPoint),
    severityDistribution: toArray(raw.severityDistribution, normalizeSeverityDistributionItem),
    pendingSummary: normalizePendingSummary(raw.pendingSummary),
    topAffiliates: toArray(raw.topAffiliates, normalizeTopAffiliateItem),
    recentActions: toArray(raw.recentActions, normalizeRecentRiskActionItem),
  };
}

function normalizeRiskAlertItem(value?: unknown): RiskAlertItem {
  const raw = toRecord(value);
  return {
    alertId: toNumber(raw.alertId),
    alertCode: toString(raw.alertCode),
    alertType: toString(raw.alertType),
    scene: toString(raw.scene),
    severity: toString(raw.severity),
    status: toString(raw.status),
    title: toString(raw.title),
    description: toString(raw.description),
    affiliateId: toString(raw.affiliateId),
    affiliateCode: toString(raw.affiliateCode),
    affiliateName: toString(raw.affiliateName),
    customerId: toString(raw.customerId),
    withdrawalId: toString(raw.withdrawalId),
    ruleCode: toString(raw.ruleCode),
    ruleName: toString(raw.ruleName),
    assigneeId: toString(raw.assigneeId),
    assigneeName: toString(raw.assigneeName),
    riskScore: toString(raw.riskScore),
    source: toString(raw.source),
    latestRemark: toString(raw.latestRemark),
    createdAt: toString(raw.createdAt),
    updatedAt: toString(raw.updatedAt),
    resolvedAt: toString(raw.resolvedAt),
  };
}

function normalizeRiskAlertSummary(value?: unknown): RiskAlertSummary {
  const raw = toRecord(value);
  return {
    total: toNumber(raw.total),
    openCount: toNumber(raw.openCount),
    processingCount: toNumber(raw.processingCount),
    resolvedCount: toNumber(raw.resolvedCount),
    ignoredCount: toNumber(raw.ignoredCount),
    criticalCount: toNumber(raw.criticalCount),
    highCount: toNumber(raw.highCount),
  };
}

function normalizeRiskAlertListValue(value?: unknown): RiskAlertListValue {
  const raw = toRecord(value);
  return {
    page: toNumber(raw.page),
    pageSize: toNumber(raw.pageSize),
    total: toNumber(raw.total),
    items: toArray(raw.items, normalizeRiskAlertItem),
    summary: normalizeRiskAlertSummary(raw.summary),
  };
}

function normalizeKolRiskFlag(value?: unknown): KolRiskFlag {
  const raw = toRecord(value);
  return {
    code: toString(raw.code),
    label: toString(raw.label),
    severity: toString(raw.severity),
    ruleCode: toString(raw.ruleCode),
    ruleName: toString(raw.ruleName),
    description: toString(raw.description),
    triggerValue: toString(raw.triggerValue),
    thresholdValue: toString(raw.thresholdValue),
    createdAt: toString(raw.createdAt),
  };
}

function normalizeKolRiskReviewItem(value?: unknown): KolRiskReviewItem {
  const raw = toRecord(value);
  return {
    reviewId: toNumber(raw.reviewId),
    affiliateId: toString(raw.affiliateId),
    affiliateCode: toString(raw.affiliateCode),
    affiliateName: toString(raw.affiliateName),
    email: toString(raw.email),
    ownerName: toString(raw.ownerName),
    countryCode: toString(raw.countryCode),
    riskLevel: toString(raw.riskLevel),
    reviewStatus: toString(raw.reviewStatus),
    alertCount: toNumber(raw.alertCount),
    flagCount: toNumber(raw.flagCount),
    hitRuleCodes: toString(raw.hitRuleCodes),
    submitterId: toString(raw.submitterId),
    submitterName: toString(raw.submitterName),
    submittedAt: toString(raw.submittedAt),
    updatedAt: toString(raw.updatedAt),
  };
}

function normalizeRiskReviewRecord(value?: unknown): RiskReviewRecord {
  const raw = toRecord(value);
  return {
    operatorId: toString(raw.operatorId),
    operatorName: toString(raw.operatorName),
    decision: toString(raw.decision),
    remark: toString(raw.remark),
    createdAt: toString(raw.createdAt),
  };
}

function normalizeKolRiskReviewListValue(value?: unknown): KolRiskReviewListValue {
  const raw = toRecord(value);
  const summary = toRecord(raw.summary);
  return {
    page: toNumber(raw.page),
    pageSize: toNumber(raw.pageSize),
    total: toNumber(raw.total),
    items: toArray(raw.items, normalizeKolRiskReviewItem),
    summary: {
      total: toNumber(summary.total),
      pendingCount: toNumber(summary.pendingCount),
      approvedCount: toNumber(summary.approvedCount),
      rejectedCount: toNumber(summary.rejectedCount),
      manualReviewCount: toNumber(summary.manualReviewCount),
    },
  };
}

function normalizeKolRiskReviewDetail(value?: unknown): KolRiskReviewDetail {
  const raw = toRecord(value);
  return {
    profile: normalizeKolRiskReviewItem(raw.profile),
    flags: toArray(raw.flags, normalizeKolRiskFlag),
    relatedAlerts: toArray(raw.relatedAlerts, normalizeRiskAlertItem),
    records: toArray(raw.records, normalizeRiskReviewRecord),
    latestRemark: toString(raw.latestRemark),
  };
}

function normalizeWithdrawalRiskReviewItem(value?: unknown): WithdrawalRiskReviewItem {
  const raw = toRecord(value);
  return {
    reviewId: toNumber(raw.reviewId),
    statementId: toNumber(raw.statementId),
    settlementId: toNumber(raw.settlementId),
    withdrawalId: toString(raw.withdrawalId),
    affiliateId: toString(raw.affiliateId),
    affiliateCode: toString(raw.affiliateCode),
    affiliateName: toString(raw.affiliateName),
    ownerName: toString(raw.ownerName),
    amountUsd: toString(raw.amountUsd),
    paymentMethod: toString(raw.paymentMethod),
    riskLevel: toString(raw.riskLevel),
    reviewStatus: toString(raw.reviewStatus),
    alertCount: toNumber(raw.alertCount),
    flagCount: toNumber(raw.flagCount),
    payoutAccount: toString(raw.payoutAccount),
    submittedAt: toString(raw.submittedAt),
    updatedAt: toString(raw.updatedAt),
  };
}

function normalizeWithdrawalRiskReviewListValue(value?: unknown): WithdrawalRiskReviewListValue {
  const raw = toRecord(value);
  const summary = toRecord(raw.summary);
  return {
    page: toNumber(raw.page),
    pageSize: toNumber(raw.pageSize),
    total: toNumber(raw.total),
    items: toArray(raw.items, normalizeWithdrawalRiskReviewItem),
    summary: {
      total: toNumber(summary.total),
      pendingCount: toNumber(summary.pendingCount),
      approvedCount: toNumber(summary.approvedCount),
      rejectedCount: toNumber(summary.rejectedCount),
      manualReviewCount: toNumber(summary.manualReviewCount),
      pendingAmountUsd: toString(summary.pendingAmountUsd),
    },
  };
}

function normalizeWithdrawalRiskReviewDetail(value?: unknown): WithdrawalRiskReviewDetail {
  const raw = toRecord(value);
  return {
    profile: normalizeWithdrawalRiskReviewItem(raw.profile),
    flags: toArray(raw.flags, normalizeKolRiskFlag),
    relatedAlerts: toArray(raw.relatedAlerts, normalizeRiskAlertItem),
    records: toArray(raw.records, normalizeRiskReviewRecord),
    latestRemark: toString(raw.latestRemark),
  };
}

function normalizeBlacklistEntry(value?: unknown): BlacklistEntry {
  const raw = toRecord(value);
  return {
    blacklistId: toNumber(raw.blacklistId),
    targetType: toString(raw.targetType),
    targetValue: toString(raw.targetValue),
    targetName: toString(raw.targetName),
    affiliateId: toString(raw.affiliateId),
    customerId: toString(raw.customerId),
    riskLevel: toString(raw.riskLevel),
    reason: toString(raw.reason),
    source: toString(raw.source),
    status: toString(raw.status),
    effectiveAt: toString(raw.effectiveAt),
    expireAt: toString(raw.expireAt),
    createdAt: toString(raw.createdAt),
    updatedAt: toString(raw.updatedAt),
    operatorId: toString(raw.operatorId),
    operatorName: toString(raw.operatorName),
    tags: toArray(raw.tags, toString),
  };
}

function normalizeBlacklistListValue(value?: unknown): BlacklistListValue {
  const raw = toRecord(value);
  const summary = toRecord(raw.summary);
  return {
    page: toNumber(raw.page),
    pageSize: toNumber(raw.pageSize),
    total: toNumber(raw.total),
    items: toArray(raw.items, normalizeBlacklistEntry),
    summary: {
      total: toNumber(summary.total),
      activeCount: toNumber(summary.activeCount),
      expiredCount: toNumber(summary.expiredCount),
      disabledCount: toNumber(summary.disabledCount),
    },
  };
}

function normalizeRiskRuleCondition(value?: unknown): RiskRuleCondition {
  const raw = toRecord(value);
  return {
    field: toString(raw.field),
    operator: toString(raw.operator),
    value: toString(raw.value),
    unit: toString(raw.unit),
  };
}

function normalizeRiskRuleAction(value?: unknown): RiskRuleAction {
  const raw = toRecord(value);
  return {
    action: toString(raw.action),
    params: toString(raw.params),
  };
}

function normalizeRiskRuleItem(value?: unknown): RiskRuleItem {
  const raw = toRecord(value);
  return {
    ruleId: toNumber(raw.ruleId),
    ruleCode: toString(raw.ruleCode),
    ruleName: toString(raw.ruleName),
    scene: toString(raw.scene),
    riskLevel: toString(raw.riskLevel),
    priority: toNumber(raw.priority),
    enabled: toBoolean(raw.enabled),
    description: toString(raw.description),
    conditions: toArray(raw.conditions, normalizeRiskRuleCondition),
    actions: toArray(raw.actions, normalizeRiskRuleAction),
    createdAt: toString(raw.createdAt),
    updatedAt: toString(raw.updatedAt),
    updatedBy: toString(raw.updatedBy),
  };
}

function normalizeRiskRuleListValue(value?: unknown): RiskRuleListValue {
  const raw = toRecord(value);
  const summary = toRecord(raw.summary);
  return {
    page: toNumber(raw.page),
    pageSize: toNumber(raw.pageSize),
    total: toNumber(raw.total),
    items: toArray(raw.items, normalizeRiskRuleItem),
    summary: {
      total: toNumber(summary.total),
      enabledCount: toNumber(summary.enabledCount),
      disabledCount: toNumber(summary.disabledCount),
    },
  };
}

async function requestValue<T>(config: AxiosRequestConfig, normalize: (value?: unknown) => T) {
  const result = await businessRequest<unknown>(config);
  return {
    ...result,
    value: normalize(result.value),
  };
}

export const riskControlApi = {
  getDashboard: async (query: RiskQueryBase) =>
    requestValue(
      {
        url: "/admin/affinex/risk/dashboard",
        method: "GET",
        params: cleanParams(query),
      },
      normalizeRiskDashboardValue,
    ),

  listAlerts: async (query: ListRiskAlertsQuery) =>
    requestValue(
      {
        url: "/admin/affinex/risk/alerts",
        method: "GET",
        params: cleanParams(query),
      },
      normalizeRiskAlertListValue,
    ),

  updateAlert: async (payload: UpdateRiskAlertPayload) =>
    requestValue(
      {
        url: `/admin/affinex/risk/alerts/${payload.alertId}`,
        method: "PUT",
        data: payload,
      },
      normalizeRiskAlertItem,
    ),

  listKolReviews: async (query: ListKolRiskReviewsQuery) =>
    requestValue(
      {
        url: "/admin/affinex/risk/kolReviews",
        method: "GET",
        params: cleanParams(query),
      },
      normalizeKolRiskReviewListValue,
    ),

  getKolReviewDetail: async (reviewId: number) =>
    requestValue(
      {
        url: `/admin/affinex/risk/kolReviews/${reviewId}`,
        method: "GET",
      },
      normalizeKolRiskReviewDetail,
    ),

  reviewKolRisk: async (payload: ReviewKolRiskPayload) =>
    requestValue(
      {
        url: `/admin/affinex/risk/kolReviews/${payload.reviewId}:review`,
        method: "POST",
        data: payload,
      },
      normalizeKolRiskReviewDetail,
    ),

  listWithdrawalReviews: async (query: ListWithdrawalRiskReviewsQuery) =>
    requestValue(
      {
        url: "/admin/affinex/risk/withdrawalReviews",
        method: "GET",
        params: cleanParams(query),
      },
      normalizeWithdrawalRiskReviewListValue,
    ),

  getWithdrawalReviewDetail: async (reviewId: number) =>
    requestValue(
      {
        url: `/admin/affinex/risk/withdrawalReviews/${reviewId}`,
        method: "GET",
      },
      normalizeWithdrawalRiskReviewDetail,
    ),

  reviewWithdrawalRisk: async (payload: ReviewWithdrawalRiskPayload) =>
    requestValue(
      {
        url: `/admin/affinex/risk/withdrawalReviews/${payload.reviewId}:review`,
        method: "POST",
        data: payload,
      },
      normalizeWithdrawalRiskReviewDetail,
    ),

  listBlacklists: async (query: ListBlacklistEntriesQuery) =>
    requestValue(
      {
        url: "/admin/affinex/risk/blacklists",
        method: "GET",
        params: cleanParams(query),
      },
      normalizeBlacklistListValue,
    ),

  createBlacklist: async (payload: CreateBlacklistEntryPayload) =>
    requestValue(
      {
        url: "/admin/affinex/risk/blacklists",
        method: "POST",
        data: payload,
      },
      normalizeBlacklistEntry,
    ),

  updateBlacklist: async (payload: UpdateBlacklistEntryPayload) =>
    requestValue(
      {
        url: `/admin/affinex/risk/blacklists/${payload.blacklistId}`,
        method: "PUT",
        data: payload,
      },
      normalizeBlacklistEntry,
    ),

  deleteBlacklist: async (payload: DeleteBlacklistEntryPayload) =>
    requestValue(
      {
        url: `/admin/affinex/risk/blacklists/${payload.blacklistId}:delete`,
        method: "POST",
        data: payload,
      },
      normalizeBlacklistEntry,
    ),

  listRules: async (query: ListRiskRulesQuery) =>
    requestValue(
      {
        url: "/admin/affinex/risk/rules",
        method: "GET",
        params: cleanParams(query),
      },
      normalizeRiskRuleListValue,
    ),

  getRuleDetail: async (ruleId: number) =>
    requestValue(
      {
        url: `/admin/affinex/risk/rules/${ruleId}`,
        method: "GET",
      },
      normalizeRiskRuleItem,
    ),

  createRule: async (payload: CreateRiskRulePayload) =>
    requestValue(
      {
        url: "/admin/affinex/risk/rules",
        method: "POST",
        data: payload,
      },
      normalizeRiskRuleItem,
    ),

  updateRule: async (payload: UpdateRiskRulePayload) =>
    requestValue(
      {
        url: `/admin/affinex/risk/rules/${payload.ruleId}`,
        method: "PUT",
        data: payload,
      },
      normalizeRiskRuleItem,
    ),

  toggleRule: async (payload: ToggleRiskRulePayload) =>
    requestValue(
      {
        url: `/admin/affinex/risk/rules/${payload.ruleId}:toggle`,
        method: "POST",
        data: payload,
      },
      normalizeRiskRuleItem,
    ),
};

export type RiskControlApi = typeof riskControlApi;
