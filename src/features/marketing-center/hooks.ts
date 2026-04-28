import { useQueries, useQuery } from "@tanstack/react-query";
import { marketingCenterApi } from "@/api/marketing-center";
import { taxonomyTabs } from "@/features/marketing-center/config";
import type {
  MarketingActivitiesQuery,
  MarketingAuditQuery,
  MarketingContentStatus,
  MarketingContentType,
  MarketingFileObjectsQuery,
  MarketingLinksQuery,
  MarketingMaterialsQuery,
  MarketingTaxonomyType,
} from "@/types/marketing-center";

export const marketingQueryKeys = {
  taxonomies: (type: MarketingTaxonomyType, includeDisabled: boolean) =>
    ["marketing-center", "taxonomies", type, includeDisabled] as const,
  materials: (query: MarketingMaterialsQuery) =>
    ["marketing-center", "materials", query] as const,
  material: (id: number) => ["marketing-center", "materials", "detail", id] as const,
  activities: (query: MarketingActivitiesQuery) =>
    ["marketing-center", "activities", query] as const,
  activity: (id: number) => ["marketing-center", "activities", "detail", id] as const,
  links: (query: MarketingLinksQuery) => ["marketing-center", "links", query] as const,
  reviews: (query: MarketingAuditQuery) => ["marketing-center", "reviews", query] as const,
  operations: (query: MarketingAuditQuery) =>
    ["marketing-center", "operation-logs", query] as const,
  fileObject: (id: number) => ["marketing-center", "file-object", id] as const,
  fileObjects: (query: MarketingFileObjectsQuery) =>
    ["marketing-center", "file-objects", query] as const,
  workbenchSummary: () => ["marketing-center", "workbench", "summary"] as const,
};

export function useMarketingTaxonomies(
  type: MarketingTaxonomyType,
  includeDisabled = true,
) {
  return useQuery({
    queryKey: marketingQueryKeys.taxonomies(type, includeDisabled),
    queryFn: async () => (await marketingCenterApi.listTaxonomies(type, includeDisabled)).value,
    staleTime: 60_000,
  });
}

export function useMarketingTaxonomyCatalog(includeDisabled = true) {
  const results = useQueries({
    queries: taxonomyTabs.map((item) => ({
      queryKey: marketingQueryKeys.taxonomies(item.value, includeDisabled),
      queryFn: async () =>
        (await marketingCenterApi.listTaxonomies(item.value, includeDisabled)).value,
      staleTime: 60_000,
    })),
  });

  return {
    isLoading: results.some((item) => item.isLoading),
    isFetching: results.some((item) => item.isFetching),
    isError: results.some((item) => item.isError),
    data: taxonomyTabs.reduce<Record<MarketingTaxonomyType, NonNullable<(typeof results)[number]["data"]>>>(
      (acc, item, index) => {
        acc[item.value] = results[index].data ?? [];
        return acc;
      },
      {
        TAXONOMY_TYPE_LANGUAGE: [],
        TAXONOMY_TYPE_CHANNEL: [],
        TAXONOMY_TYPE_SCOPE: [],
        TAXONOMY_TYPE_MATERIAL_CATEGORY: [],
        TAXONOMY_TYPE_ACTIVITY_CATEGORY: [],
      },
    ),
    errors: results.map((item) => item.error).filter(Boolean),
  };
}

export function useMarketingMaterialsList(query: MarketingMaterialsQuery) {
  return useQuery({
    queryKey: marketingQueryKeys.materials(query),
    queryFn: async () => (await marketingCenterApi.listMaterials(query)).value,
    placeholderData: (previous) => previous,
  });
}

export function useMarketingMaterialDetail(id: number, enabled = true) {
  return useQuery({
    queryKey: marketingQueryKeys.material(id),
    queryFn: async () => (await marketingCenterApi.getMaterialDetail(id)).value,
    enabled: enabled && Number.isFinite(id) && id > 0,
  });
}

export function useMarketingActivitiesList(query: MarketingActivitiesQuery) {
  return useQuery({
    queryKey: marketingQueryKeys.activities(query),
    queryFn: async () => (await marketingCenterApi.listActivities(query)).value,
    placeholderData: (previous) => previous,
  });
}

export function useMarketingActivityDetail(id: number, enabled = true) {
  return useQuery({
    queryKey: marketingQueryKeys.activity(id),
    queryFn: async () => (await marketingCenterApi.getActivityDetail(id)).value,
    enabled: enabled && Number.isFinite(id) && id > 0,
  });
}

export function useMarketingLinks(query: MarketingLinksQuery) {
  return useQuery({
    queryKey: marketingQueryKeys.links(query),
    queryFn: async () => (await marketingCenterApi.listLinks(query)).value,
    placeholderData: (previous) => previous,
  });
}

export function useMarketingReviews(query: MarketingAuditQuery) {
  return useQuery({
    queryKey: marketingQueryKeys.reviews(query),
    queryFn: async () => (await marketingCenterApi.listReviewRecords(query)).value,
    placeholderData: (previous) => previous,
  });
}

export function useMarketingReviewHistory(
  contentType: MarketingContentType,
  contentId?: number,
) {
  return useMarketingReviews({
    page: 1,
    pageSize: 20,
    contentType,
    contentId,
  });
}

export function useMarketingOperationLogs(query: MarketingAuditQuery) {
  return useQuery({
    queryKey: marketingQueryKeys.operations(query),
    queryFn: async () => (await marketingCenterApi.listOperationLogs(query)).value,
    placeholderData: (previous) => previous,
  });
}

export function useMarketingFileObject(id?: number) {
  return useQuery({
    queryKey: marketingQueryKeys.fileObject(Number(id ?? 0)),
    queryFn: async () => (await marketingCenterApi.getFileObject(Number(id))).value,
    enabled: Number(id ?? 0) > 0,
    staleTime: 60_000,
  });
}

export function useMarketingFileObjects(query: MarketingFileObjectsQuery) {
  return useQuery({
    queryKey: marketingQueryKeys.fileObjects(query),
    queryFn: async () => (await marketingCenterApi.listFileObjects(query)).value,
    placeholderData: (previous) => previous,
  });
}

export function useMarketingWorkbenchStats() {
  const query = useQuery({
    queryKey: marketingQueryKeys.workbenchSummary(),
    queryFn: async () => (await marketingCenterApi.getWorkbenchSummary()).value,
    staleTime: 30_000,
  });

  const materials = query.data?.materials;
  const activities = query.data?.activities;

  return {
    ...query,
    materials,
    activities,
    pendingMaterials: materials?.pendingReview ?? 0,
    publishedMaterials: materials?.published ?? 0,
    rejectedMaterials: materials?.rejected ?? 0,
    pendingActivities: activities?.pendingReview ?? 0,
    publishedActivities: activities?.published ?? 0,
    rejectedActivities: activities?.rejected ?? 0,
  };
}
