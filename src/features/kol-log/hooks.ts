import { useQuery } from "@tanstack/react-query";
import { kolLogApi } from "@/api/kol-log";
import type { KolChangeLogListQuery } from "@/types/kol-log";

export const kolLogQueryKeys = {
  all: ["kol-log"] as const,
  list: (query: KolChangeLogListQuery) => [...kolLogQueryKeys.all, "list", query] as const,
  detail: (id: number | string) => [...kolLogQueryKeys.all, "detail", id] as const,
};

export function useKolChangeLogs(query: KolChangeLogListQuery) {
  return useQuery({
    queryKey: kolLogQueryKeys.list(query),
    queryFn: async () => (await kolLogApi.listKolChangeLogs(query)).value,
    placeholderData: (previous) => previous,
  });
}

export function useKolChangeLogDetail(id?: number | string, enabled = true) {
  return useQuery({
    queryKey: kolLogQueryKeys.detail(String(id ?? "")),
    queryFn: async () => (await kolLogApi.getKolChangeLogDetail(String(id))).value,
    enabled: enabled && String(id ?? "").trim().length > 0,
  });
}
