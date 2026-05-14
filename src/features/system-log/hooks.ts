import { useQuery } from "@tanstack/react-query";
import { systemLogApi } from "@/api/system-log";
import type { SystemOperationLogListQuery } from "@/types/system-log";

export const systemLogQueryKeys = {
  all: ["system-log"] as const,
  list: (query: SystemOperationLogListQuery) => [...systemLogQueryKeys.all, "list", query] as const,
  detail: (id: number | string) => [...systemLogQueryKeys.all, "detail", id] as const,
};

export function useSystemOperationLogs(query: SystemOperationLogListQuery) {
  return useQuery({
    queryKey: systemLogQueryKeys.list(query),
    queryFn: async () => (await systemLogApi.listOperationLogs(query)).value,
    placeholderData: (previous) => previous,
  });
}

export function useSystemOperationLogDetail(id?: number | string, enabled = true) {
  return useQuery({
    queryKey: systemLogQueryKeys.detail(String(id ?? "")),
    queryFn: async () => (await systemLogApi.getOperationLogDetail(String(id))).value,
    enabled: enabled && String(id ?? "").trim().length > 0,
  });
}
