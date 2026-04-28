import { useQuery } from "@tanstack/react-query";
import { affiliateConsoleApi } from "@/api/affiliate-console";
import type {
  SettlementPaymentSummaryQuery,
  SettlementStatementQuery,
} from "@/types/affiliate-console";

export const settlementQueryKeys = {
  dashboard: (adminId?: number | string) =>
    ["settlement-center", "dashboard", adminId ?? "all"] as const,
  statements: (query: SettlementStatementQuery) =>
    ["settlement-center", "statements", query] as const,
  statementCommissions: (paymentId?: number | string, page = 1, pageSize = 50) =>
    ["settlement-center", "statement-commissions", paymentId ?? 0, page, pageSize] as const,
  summaries: (query: SettlementPaymentSummaryQuery) =>
    ["settlement-center", "summaries", query] as const,
  summaryInfo: (id?: number | string) =>
    ["settlement-center", "summary-info", id ?? 0] as const,
};

export function useSettlementDashboard(adminId?: number | string) {
  return useQuery({
    queryKey: settlementQueryKeys.dashboard(adminId),
    queryFn: async () => (await affiliateConsoleApi.getSettlementDashboard(adminId)).value,
    staleTime: 30_000,
  });
}

export function useSettlementStatements(query: SettlementStatementQuery) {
  return useQuery({
    queryKey: settlementQueryKeys.statements(query),
    queryFn: async () => (await affiliateConsoleApi.listSettlementStatements(query)).value,
    placeholderData: (previous) => previous,
  });
}

export function useSettlementStatementCommissions(
  paymentId?: number | string,
  page = 1,
  pageSize = 50,
  enabled = true,
) {
  return useQuery({
    queryKey: settlementQueryKeys.statementCommissions(paymentId, page, pageSize),
    queryFn: async () =>
      (
        await affiliateConsoleApi.getSettlementStatementCommissions({
          paymentId: Number(paymentId),
          page,
          pageSize,
        })
      ).value,
    enabled: enabled && Number(paymentId ?? 0) > 0,
  });
}

export function useSettlementPaymentSummaries(query: SettlementPaymentSummaryQuery) {
  return useQuery({
    queryKey: settlementQueryKeys.summaries(query),
    queryFn: async () => (await affiliateConsoleApi.listSettlementPaymentSummaries(query)).value,
    placeholderData: (previous) => previous,
  });
}

export function useSettlementPaymentSummaryInfo(
  id?: number | string,
  enabled = true,
) {
  return useQuery({
    queryKey: settlementQueryKeys.summaryInfo(id),
    queryFn: async () =>
      (await affiliateConsoleApi.getSettlementPaymentSummaryInfo(Number(id))).value,
    enabled: enabled && Number(id ?? 0) > 0,
  });
}
