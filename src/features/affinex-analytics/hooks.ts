import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { affinexApi } from "@/api/affinex";
import type {
  AffinexAnalyticsEndpoint,
  AnalyticsDashboardConfig,
  AnalyticsQuery,
  DashboardWidgetConfig,
} from "@/types/affinex";

export const affinexAnalyticsQueryKeys = {
  analytics: (endpoint: AffinexAnalyticsEndpoint, query: AnalyticsQuery) =>
    ["affinex-analytics", endpoint, query] as const,
  dashboardConfig: (resourceCode: string) =>
    ["affinex-analytics", "dashboard-config", resourceCode] as const,
};

export function useAffinexAnalytics(
  endpoint: AffinexAnalyticsEndpoint,
  query: AnalyticsQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: affinexAnalyticsQueryKeys.analytics(endpoint, query),
    queryFn: async () => (await affinexApi.getAnalytics(endpoint, query)).value,
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useAnalyticsDashboardConfig(
  resourceCode: string,
  enabled = true,
) {
  return useQuery({
    queryKey: affinexAnalyticsQueryKeys.dashboardConfig(resourceCode),
    queryFn: async () =>
      (await affinexApi.getAnalyticsDashboardConfig(resourceCode)).value,
    enabled: enabled && Boolean(resourceCode.trim()),
    staleTime: 30_000,
  });
}

export function useUpdateAnalyticsDashboardConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      resourceCode: string;
      defaultDatePreset?: string;
      widgets: DashboardWidgetConfig[];
    }) => {
      return (
        await affinexApi.updateAnalyticsDashboardConfig({
          resourceCode: payload.resourceCode,
          defaultDatePreset: payload.defaultDatePreset,
          widgets: payload.widgets,
        })
      ).value;
    },
    onSuccess: (value: AnalyticsDashboardConfig) => {
      queryClient.setQueryData(
        affinexAnalyticsQueryKeys.dashboardConfig(value.resourceCode),
        value,
      );
      queryClient.invalidateQueries({
        queryKey: affinexAnalyticsQueryKeys.dashboardConfig(value.resourceCode),
      });
    },
  });
}
