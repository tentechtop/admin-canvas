import { useQuery } from "@tanstack/react-query";
import { affinexApi } from "@/api/affinex";
import type { AnalyticsQuery } from "@/types/affinex";

export const dashboardQueryKeys = {
  overview: (query: AnalyticsQuery) => ["dashboard", "overview", query] as const,
  trends: (query: AnalyticsQuery) => ["dashboard", "trends", query] as const,
  distributions: (query: AnalyticsQuery) => ["dashboard", "distributions", query] as const,
  kol: (query: AnalyticsQuery) => ["dashboard", "kol", query] as const,
  realtime: (query: AnalyticsQuery) => ["dashboard", "realtime", query] as const,
};

type DashboardQueryOptions = {
  refetchInterval?: number | false;
};

export function useDashboardOverview(query: AnalyticsQuery, options?: DashboardQueryOptions) {
  return useQuery({
    queryKey: dashboardQueryKeys.overview(query),
    queryFn: async () => (await affinexApi.getDashboardOverview(query)).value,
    placeholderData: (previous) => previous,
    refetchInterval: options?.refetchInterval,
  });
}

export function useDashboardTrends(query: AnalyticsQuery, options?: DashboardQueryOptions) {
  return useQuery({
    queryKey: dashboardQueryKeys.trends(query),
    queryFn: async () => (await affinexApi.getDashboardTrends(query)).value,
    placeholderData: (previous) => previous,
    refetchInterval: options?.refetchInterval,
  });
}

export function useDashboardDistributions(query: AnalyticsQuery, options?: DashboardQueryOptions) {
  return useQuery({
    queryKey: dashboardQueryKeys.distributions(query),
    queryFn: async () => (await affinexApi.getDashboardDistributions(query)).value,
    placeholderData: (previous) => previous,
    refetchInterval: options?.refetchInterval,
  });
}

export function useDashboardKol(query: AnalyticsQuery, options?: DashboardQueryOptions) {
  return useQuery({
    queryKey: dashboardQueryKeys.kol(query),
    queryFn: async () => (await affinexApi.getDashboardKol(query)).value,
    placeholderData: (previous) => previous,
    refetchInterval: options?.refetchInterval,
  });
}

export function useDashboardRealtime(query: AnalyticsQuery, options?: DashboardQueryOptions) {
  return useQuery({
    queryKey: dashboardQueryKeys.realtime(query),
    queryFn: async () => (await affinexApi.getDashboardRealtime(query)).value,
    placeholderData: (previous) => previous,
    refetchInterval: options?.refetchInterval,
  });
}
