import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { riskControlApi } from "@/api/risk-control";
import type {
  CreateBlacklistEntryPayload,
  CreateRiskRulePayload,
  DeleteBlacklistEntryPayload,
  ListBlacklistEntriesQuery,
  ListKolRiskReviewsQuery,
  ListRiskAlertsQuery,
  ListRiskRulesQuery,
  ListWithdrawalRiskReviewsQuery,
  ReviewKolRiskPayload,
  ReviewWithdrawalRiskPayload,
  RiskQueryBase,
  ToggleRiskRulePayload,
  UpdateBlacklistEntryPayload,
  UpdateRiskAlertPayload,
  UpdateRiskRulePayload,
} from "@/types/risk-control";

export const riskControlQueryKeys = {
  dashboard: (query: RiskQueryBase) => ["risk-control", "dashboard", query] as const,
  alerts: (query: ListRiskAlertsQuery) => ["risk-control", "alerts", query] as const,
  kolReviews: (query: ListKolRiskReviewsQuery) => ["risk-control", "kol-reviews", query] as const,
  kolReviewDetail: (reviewId: number) => ["risk-control", "kol-review-detail", reviewId] as const,
  withdrawalReviews: (query: ListWithdrawalRiskReviewsQuery) =>
    ["risk-control", "withdrawal-reviews", query] as const,
  withdrawalReviewDetail: (reviewId: number) =>
    ["risk-control", "withdrawal-review-detail", reviewId] as const,
  blacklists: (query: ListBlacklistEntriesQuery) => ["risk-control", "blacklists", query] as const,
  rules: (query: ListRiskRulesQuery) => ["risk-control", "rules", query] as const,
  ruleDetail: (ruleId: number) => ["risk-control", "rule-detail", ruleId] as const,
};

export function useRiskDashboard(query: RiskQueryBase) {
  return useQuery({
    queryKey: riskControlQueryKeys.dashboard(query),
    queryFn: async () => (await riskControlApi.getDashboard(query)).value,
    placeholderData: (previous) => previous,
  });
}

export function useRiskAlerts(query: ListRiskAlertsQuery) {
  return useQuery({
    queryKey: riskControlQueryKeys.alerts(query),
    queryFn: async () => (await riskControlApi.listAlerts(query)).value,
    placeholderData: (previous) => previous,
  });
}

export function useUpdateRiskAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateRiskAlertPayload) => (await riskControlApi.updateAlert(payload)).value,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk-control", "alerts"] });
      queryClient.invalidateQueries({ queryKey: ["risk-control", "dashboard"] });
    },
  });
}

export function useKolRiskReviews(query: ListKolRiskReviewsQuery) {
  return useQuery({
    queryKey: riskControlQueryKeys.kolReviews(query),
    queryFn: async () => (await riskControlApi.listKolReviews(query)).value,
    placeholderData: (previous) => previous,
  });
}

export function useKolRiskReviewDetail(reviewId?: number) {
  return useQuery({
    queryKey: riskControlQueryKeys.kolReviewDetail(reviewId ?? 0),
    queryFn: async () => (await riskControlApi.getKolReviewDetail(reviewId ?? 0)).value,
    enabled: Boolean(reviewId),
  });
}

export function useReviewKolRisk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ReviewKolRiskPayload) => (await riskControlApi.reviewKolRisk(payload)).value,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["risk-control", "kol-reviews"] });
      queryClient.invalidateQueries({ queryKey: riskControlQueryKeys.kolReviewDetail(variables.reviewId) });
      queryClient.invalidateQueries({ queryKey: ["risk-control", "dashboard"] });
    },
  });
}

export function useWithdrawalRiskReviews(query: ListWithdrawalRiskReviewsQuery) {
  return useQuery({
    queryKey: riskControlQueryKeys.withdrawalReviews(query),
    queryFn: async () => (await riskControlApi.listWithdrawalReviews(query)).value,
    placeholderData: (previous) => previous,
  });
}

export function useWithdrawalRiskReviewDetail(reviewId?: number) {
  return useQuery({
    queryKey: riskControlQueryKeys.withdrawalReviewDetail(reviewId ?? 0),
    queryFn: async () => (await riskControlApi.getWithdrawalReviewDetail(reviewId ?? 0)).value,
    enabled: Boolean(reviewId),
  });
}

export function useReviewWithdrawalRisk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ReviewWithdrawalRiskPayload) =>
      (await riskControlApi.reviewWithdrawalRisk(payload)).value,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["risk-control", "withdrawal-reviews"] });
      queryClient.invalidateQueries({
        queryKey: riskControlQueryKeys.withdrawalReviewDetail(variables.reviewId),
      });
      queryClient.invalidateQueries({ queryKey: ["risk-control", "dashboard"] });
    },
  });
}

export function useBlacklists(query: ListBlacklistEntriesQuery) {
  return useQuery({
    queryKey: riskControlQueryKeys.blacklists(query),
    queryFn: async () => (await riskControlApi.listBlacklists(query)).value,
    placeholderData: (previous) => previous,
  });
}

export function useCreateBlacklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateBlacklistEntryPayload) => (await riskControlApi.createBlacklist(payload)).value,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk-control", "blacklists"] });
      queryClient.invalidateQueries({ queryKey: ["risk-control", "dashboard"] });
    },
  });
}

export function useUpdateBlacklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateBlacklistEntryPayload) => (await riskControlApi.updateBlacklist(payload)).value,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk-control", "blacklists"] });
      queryClient.invalidateQueries({ queryKey: ["risk-control", "dashboard"] });
    },
  });
}

export function useDeleteBlacklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: DeleteBlacklistEntryPayload) => (await riskControlApi.deleteBlacklist(payload)).value,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk-control", "blacklists"] });
      queryClient.invalidateQueries({ queryKey: ["risk-control", "dashboard"] });
    },
  });
}

export function useRiskRules(query: ListRiskRulesQuery) {
  return useQuery({
    queryKey: riskControlQueryKeys.rules(query),
    queryFn: async () => (await riskControlApi.listRules(query)).value,
    placeholderData: (previous) => previous,
  });
}

export function useRiskRuleDetail(ruleId?: number) {
  return useQuery({
    queryKey: riskControlQueryKeys.ruleDetail(ruleId ?? 0),
    queryFn: async () => (await riskControlApi.getRuleDetail(ruleId ?? 0)).value,
    enabled: Boolean(ruleId),
  });
}

export function useCreateRiskRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateRiskRulePayload) => (await riskControlApi.createRule(payload)).value,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk-control", "rules"] });
      queryClient.invalidateQueries({ queryKey: ["risk-control", "dashboard"] });
    },
  });
}

export function useUpdateRiskRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateRiskRulePayload) => (await riskControlApi.updateRule(payload)).value,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["risk-control", "rules"] });
      queryClient.invalidateQueries({ queryKey: riskControlQueryKeys.ruleDetail(variables.ruleId) });
      queryClient.invalidateQueries({ queryKey: ["risk-control", "dashboard"] });
    },
  });
}

export function useToggleRiskRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ToggleRiskRulePayload) => (await riskControlApi.toggleRule(payload)).value,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["risk-control", "rules"] });
      queryClient.invalidateQueries({ queryKey: riskControlQueryKeys.ruleDetail(variables.ruleId) });
      queryClient.invalidateQueries({ queryKey: ["risk-control", "dashboard"] });
    },
  });
}
