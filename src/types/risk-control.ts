export interface RiskQueryBase {
  startDate?: string;
  endDate?: string;
  affiliateId?: string;
  affiliateCode?: string;
  topN?: number;
}

export interface RiskDashboardCard {
  code: string;
  label: string;
  count: number;
  compareCount: number;
  diffCount: number;
  diffRate: number;
  severity: string;
}

export interface RiskDashboardTrendPoint {
  date: string;
  alertCount: number;
  handledCount: number;
  pendingKolReviewCount: number;
  pendingWithdrawalReviewCount: number;
  blacklistHitCount: number;
}

export interface RiskSeverityDistributionItem {
  severity: string;
  label: string;
  count: number;
  share: number;
}

export interface RiskPendingReviewSummary {
  pendingKolReviewCount: number;
  pendingWithdrawalReviewCount: number;
  overdueAlertCount: number;
  activeBlacklistCount: number;
  enabledRuleCount: number;
}

export interface TopRiskAffiliateItem {
  affiliateId: string;
  affiliateCode: string;
  affiliateName: string;
  ownerName: string;
  alertCount: number;
  criticalAlertCount: number;
  pendingReviewCount: number;
  blacklistHitCount: number;
  riskScore: number;
}

export interface RecentRiskActionItem {
  actionType: string;
  targetType: string;
  targetId: string;
  targetName: string;
  operatorId: string;
  operatorName: string;
  result: string;
  createdAt: string;
}

export interface RiskDashboardValue {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  generatedAt: string;
  cards: RiskDashboardCard[];
  trend: RiskDashboardTrendPoint[];
  severityDistribution: RiskSeverityDistributionItem[];
  pendingSummary: RiskPendingReviewSummary;
  topAffiliates: TopRiskAffiliateItem[];
  recentActions: RecentRiskActionItem[];
}

export interface RiskAlertItem {
  alertId: number;
  alertCode: string;
  alertType: string;
  scene: string;
  severity: string;
  status: string;
  title: string;
  description: string;
  affiliateId: string;
  affiliateCode: string;
  affiliateName: string;
  customerId: string;
  withdrawalId: string;
  ruleCode: string;
  ruleName: string;
  assigneeId: string;
  assigneeName: string;
  riskScore: string;
  source: string;
  latestRemark: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string;
}

export interface RiskAlertSummary {
  total: number;
  openCount: number;
  processingCount: number;
  resolvedCount: number;
  ignoredCount: number;
  criticalCount: number;
  highCount: number;
}

export interface RiskAlertListValue {
  page: number;
  pageSize: number;
  total: number;
  items: RiskAlertItem[];
  summary: RiskAlertSummary;
}

export interface ListRiskAlertsQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  alertCode?: string;
  alertType?: string;
  scene?: string;
  severity?: string[];
  status?: string[];
  affiliateId?: string;
  affiliateCode?: string;
  customerId?: string;
  withdrawalId?: string;
  assigneeId?: string;
  ruleCode?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  updatedAtFrom?: string;
  updatedAtTo?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface UpdateRiskAlertPayload {
  alertId: number;
  action?: string;
  status?: string;
  assigneeId?: string;
  assigneeName?: string;
  remark?: string;
  tags?: string[];
}

export interface KolRiskFlag {
  code: string;
  label: string;
  severity: string;
  ruleCode: string;
  ruleName: string;
  description: string;
  triggerValue: string;
  thresholdValue: string;
  createdAt: string;
}

export interface KolRiskReviewItem {
  reviewId: number;
  affiliateId: string;
  affiliateCode: string;
  affiliateName: string;
  email: string;
  ownerName: string;
  countryCode: string;
  riskLevel: string;
  reviewStatus: string;
  alertCount: number;
  flagCount: number;
  hitRuleCodes: string;
  submitterId: string;
  submitterName: string;
  submittedAt: string;
  updatedAt: string;
}

export interface KolRiskReviewSummary {
  total: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  manualReviewCount: number;
}

export interface KolRiskReviewListValue {
  page: number;
  pageSize: number;
  total: number;
  items: KolRiskReviewItem[];
  summary: KolRiskReviewSummary;
}

export interface ListKolRiskReviewsQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  affiliateId?: string;
  affiliateCode?: string;
  affiliateName?: string;
  ownerName?: string;
  riskLevel?: string[];
  reviewStatus?: string[];
  submittedAtFrom?: string;
  submittedAtTo?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface RiskReviewRecord {
  operatorId: string;
  operatorName: string;
  decision: string;
  remark: string;
  createdAt: string;
}

export interface KolRiskReviewDetail {
  profile: KolRiskReviewItem;
  flags: KolRiskFlag[];
  relatedAlerts: RiskAlertItem[];
  records: RiskReviewRecord[];
  latestRemark: string;
}

export interface ReviewKolRiskPayload {
  reviewId: number;
  decision: string;
  remark?: string;
  tags?: string[];
}

export interface WithdrawalRiskReviewItem {
  reviewId: number;
  statementId: number;
  settlementId: number;
  withdrawalId: string;
  affiliateId: string;
  affiliateCode: string;
  affiliateName: string;
  ownerName: string;
  amountUsd: string;
  paymentMethod: string;
  riskLevel: string;
  reviewStatus: string;
  alertCount: number;
  flagCount: number;
  payoutAccount: string;
  submittedAt: string;
  updatedAt: string;
}

export interface WithdrawalRiskReviewSummary {
  total: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  manualReviewCount: number;
  pendingAmountUsd: string;
}

export interface WithdrawalRiskReviewListValue {
  page: number;
  pageSize: number;
  total: number;
  items: WithdrawalRiskReviewItem[];
  summary: WithdrawalRiskReviewSummary;
}

export interface ListWithdrawalRiskReviewsQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  withdrawalId?: string;
  statementId?: number;
  settlementId?: number;
  affiliateId?: string;
  affiliateCode?: string;
  affiliateName?: string;
  riskLevel?: string[];
  reviewStatus?: string[];
  submittedAtFrom?: string;
  submittedAtTo?: string;
  amountMin?: string;
  amountMax?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface WithdrawalRiskReviewDetail {
  profile: WithdrawalRiskReviewItem;
  flags: KolRiskFlag[];
  relatedAlerts: RiskAlertItem[];
  records: RiskReviewRecord[];
  latestRemark: string;
}

export interface ReviewWithdrawalRiskPayload {
  reviewId: number;
  decision: string;
  remark?: string;
  tags?: string[];
}

export interface BlacklistEntry {
  blacklistId: number;
  targetType: string;
  targetValue: string;
  targetName: string;
  affiliateId: string;
  customerId: string;
  riskLevel: string;
  reason: string;
  source: string;
  status: string;
  effectiveAt: string;
  expireAt: string;
  createdAt: string;
  updatedAt: string;
  operatorId: string;
  operatorName: string;
  tags: string[];
}

export interface BlacklistSummary {
  total: number;
  activeCount: number;
  expiredCount: number;
  disabledCount: number;
}

export interface BlacklistListValue {
  page: number;
  pageSize: number;
  total: number;
  items: BlacklistEntry[];
  summary: BlacklistSummary;
}

export interface ListBlacklistEntriesQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  targetType?: string;
  targetValue?: string;
  affiliateId?: string;
  customerId?: string;
  riskLevel?: string[];
  status?: string[];
  effectiveAtFrom?: string;
  effectiveAtTo?: string;
  expireAtFrom?: string;
  expireAtTo?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface CreateBlacklistEntryPayload {
  targetType: string;
  targetValue: string;
  targetName?: string;
  affiliateId?: string;
  customerId?: string;
  riskLevel: string;
  reason: string;
  source?: string;
  effectiveAt?: string;
  expireAt?: string;
  tags?: string[];
}

export interface UpdateBlacklistEntryPayload {
  blacklistId: number;
  targetName?: string;
  riskLevel?: string;
  reason?: string;
  status?: string;
  effectiveAt?: string;
  expireAt?: string;
  tags?: string[];
}

export interface DeleteBlacklistEntryPayload {
  blacklistId: number;
  remark?: string;
}

export interface RiskRuleCondition {
  field: string;
  operator: string;
  value: string;
  unit: string;
}

export interface RiskRuleAction {
  action: string;
  params: string;
}

export interface RiskRuleItem {
  ruleId: number;
  ruleCode: string;
  ruleName: string;
  scene: string;
  riskLevel: string;
  priority: number;
  enabled: boolean;
  description: string;
  conditions: RiskRuleCondition[];
  actions: RiskRuleAction[];
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface RiskRuleSummary {
  total: number;
  enabledCount: number;
  disabledCount: number;
}

export interface RiskRuleListValue {
  page: number;
  pageSize: number;
  total: number;
  items: RiskRuleItem[];
  summary: RiskRuleSummary;
}

export interface ListRiskRulesQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  scene?: string;
  riskLevel?: string[];
  ruleCode?: string;
  enabled?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface CreateRiskRulePayload {
  ruleCode: string;
  ruleName: string;
  scene: string;
  riskLevel: string;
  priority: number;
  enabled: boolean;
  description?: string;
  conditions?: RiskRuleCondition[];
  actions?: RiskRuleAction[];
}

export interface UpdateRiskRulePayload {
  ruleId: number;
  ruleName: string;
  scene: string;
  riskLevel: string;
  priority: number;
  enabled: boolean;
  description?: string;
  conditions?: RiskRuleCondition[];
  actions?: RiskRuleAction[];
}

export interface ToggleRiskRulePayload {
  ruleId: number;
  enabled: boolean;
}
