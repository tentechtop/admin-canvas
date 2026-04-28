import type { AxiosRequestConfig } from "axios";
import { businessRequest } from "@/lib/business-http";
import type {
  MarketingActivitiesListValue,
  MarketingActivity,
  MarketingBatchGenerateLinksPayload,
  MarketingCommentPayload,
  MarketingCreateActivityPayload,
  MarketingCreateMaterialPayload,
  MarketingCreateTaxonomyPayload,
  MarketingFileObject,
  MarketingFileObjectsQuery,
  MarketingFileObjectsValue,
  MarketingFileUploadEnvelope,
  MarketingGenerateLinkPayload,
  MarketingLinksListValue,
  MarketingLinksQuery,
  MarketingListEnvelope,
  MarketingMaterialsListValue,
  MarketingMaterialsQuery,
  MarketingMutationEnvelope,
  MarketingOperationLogsValue,
  MarketingAuditQuery,
  MarketingReviewPayload,
  MarketingReviewsListValue,
  MarketingTaxonomyItem,
  MarketingTaxonomyType,
  MarketingUpdateActivityPayload,
  MarketingUpdateMaterialPayload,
  MarketingUpdateTaxonomyPayload,
  MarketingActivityPromotionLink,
  MarketingReviewRecord,
  MarketingOperationLog,
  MarketingWorkbenchStatusSummary,
  MarketingWorkbenchSummaryEnvelope,
  MarketingWorkbenchSummaryValue,
} from "@/types/marketing-center";

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

function withPaging(
  page: number,
  pageSize: number,
  params: Record<string, unknown> = {},
) {
  return cleanParams({
    ...params,
    "paging.page": page,
    "paging.pageSize": pageSize,
  });
}

async function requestEnvelope<TEnvelope>(config: AxiosRequestConfig) {
  const result = await businessRequest<unknown>(config);
  return {
    ...result,
    envelope: result.envelope as unknown as TEnvelope,
  };
}

async function requestTopLevelList<T>(
  config: AxiosRequestConfig,
): Promise<{
  value: { items: T[]; total: number };
  envelope: MarketingListEnvelope<T>;
  preview: ReturnType<typeof businessRequest<unknown>> extends Promise<infer R>
    ? R["preview"]
    : never;
}> {
  const result = await requestEnvelope<MarketingListEnvelope<T>>(config);
  return {
    ...result,
    value: {
      items: result.envelope.items ?? [],
      total: Number(result.envelope.total ?? 0),
    },
  };
}

async function requestItemsOnly<T>(config: AxiosRequestConfig) {
  const result = await requestEnvelope<{
    success: boolean;
    message: string;
    items?: T[];
    errCode?: number;
    nonce?: string;
  }>(config);
  return {
    ...result,
    value: result.envelope.items ?? [],
  };
}

async function requestTopLevelItem<T>(config: AxiosRequestConfig) {
  const result = await requestEnvelope<MarketingMutationEnvelope<T>>(config);
  return {
    ...result,
    value: result.envelope.item ?? null,
  };
}

async function requestNoContent(config: AxiosRequestConfig) {
  const result = await requestEnvelope<{
    success: boolean;
    message: string;
    errCode?: number;
    nonce?: string;
  }>(config);
  return {
    ...result,
    value: result.envelope.success,
  };
}

function normalizeWorkbenchStatusSummary(
  summary?: {
    total?: number | string;
    draft?: number | string;
    pendingReview?: number | string;
    pending_review?: number | string;
    rejected?: number | string;
    approved?: number | string;
    published?: number | string;
    offline?: number | string;
  },
): MarketingWorkbenchStatusSummary {
  return {
    total: Number(summary?.total ?? 0),
    draft: Number(summary?.draft ?? 0),
    pendingReview: Number(summary?.pendingReview ?? summary?.pending_review ?? 0),
    rejected: Number(summary?.rejected ?? 0),
    approved: Number(summary?.approved ?? 0),
    published: Number(summary?.published ?? 0),
    offline: Number(summary?.offline ?? 0),
  };
}

export const marketingCenterApi = {
  getWorkbenchSummary: async () => {
    const result = await requestEnvelope<MarketingWorkbenchSummaryEnvelope>({
      url: "/admin/marketing/workbench/summary",
      method: "GET",
    });

    const value: MarketingWorkbenchSummaryValue = {
      materials: normalizeWorkbenchStatusSummary(result.envelope.materials),
      activities: normalizeWorkbenchStatusSummary(result.envelope.activities),
    };

    return {
      ...result,
      value,
    };
  },

  listTaxonomies: (type: MarketingTaxonomyType, includeDisabled = true) =>
    requestItemsOnly<MarketingTaxonomyItem>({
      url: "/admin/marketing/taxonomies",
      method: "GET",
      params: cleanParams({
        type,
        includeDisabled,
      }),
    }),

  createTaxonomy: (payload: MarketingCreateTaxonomyPayload) =>
    requestTopLevelItem<MarketingTaxonomyItem>({
      url: "/admin/marketing/taxonomies",
      method: "POST",
      data: payload,
    }),

  updateTaxonomy: (payload: MarketingUpdateTaxonomyPayload) =>
    requestTopLevelItem<MarketingTaxonomyItem>({
      url: `/admin/marketing/taxonomies/${payload.id}`,
      method: "PUT",
      data: payload,
    }),

  deleteTaxonomy: (id: number) =>
    requestTopLevelItem<MarketingTaxonomyItem>({
      url: `/admin/marketing/taxonomies/${id}:delete`,
      method: "POST",
      data: { id },
    }),

  listMaterials: (query: MarketingMaterialsQuery) =>
    requestTopLevelList<MarketingMaterial>({
      url: "/admin/marketing/materials",
      method: "GET",
      params: withPaging(query.page, query.pageSize, {
        keyword: query.keyword,
        materialType: query.materialType,
        legacyMaterialType: query.legacyMaterialType,
        languageId: query.languageId,
        categoryId: query.categoryId,
        channelId: query.channelId,
        scopeId: query.scopeId,
        status: query.status,
      }),
    }),

  getMaterialDetail: (id: number) =>
    requestTopLevelItem<MarketingMaterial>({
      url: `/admin/marketing/materials/${id}`,
      method: "GET",
    }),

  createMaterial: (payload: MarketingCreateMaterialPayload) =>
    requestTopLevelItem<MarketingMaterial>({
      url: "/admin/marketing/materials",
      method: "POST",
      data: payload,
    }),

  updateMaterial: (payload: MarketingUpdateMaterialPayload) =>
    requestTopLevelItem<MarketingMaterial>({
      url: `/admin/marketing/materials/${payload.id}`,
      method: "PUT",
      data: payload,
    }),

  deleteMaterial: (id: number) =>
    requestTopLevelItem<MarketingMaterial>({
      url: `/admin/marketing/materials/${id}:delete`,
      method: "POST",
      data: { id },
    }),

  submitMaterialReview: (payload: MarketingCommentPayload) =>
    requestTopLevelItem<MarketingMaterial>({
      url: `/admin/marketing/materials/${payload.id}:submit_review`,
      method: "POST",
      data: payload,
    }),

  reviewMaterial: (payload: MarketingReviewPayload) =>
    requestTopLevelItem<MarketingMaterial>({
      url: `/admin/marketing/materials/${payload.id}:review`,
      method: "POST",
      data: payload,
    }),

  publishMaterial: (id: number) =>
    requestTopLevelItem<MarketingMaterial>({
      url: `/admin/marketing/materials/${id}:publish`,
      method: "POST",
      data: { id },
    }),

  offlineMaterial: (payload: MarketingCommentPayload) =>
    requestTopLevelItem<MarketingMaterial>({
      url: `/admin/marketing/materials/${payload.id}:offline`,
      method: "POST",
      data: payload,
    }),

  listActivities: (query: MarketingActivitiesQuery) =>
    requestTopLevelList<MarketingActivity>({
      url: "/admin/marketing/activities",
      method: "GET",
      params: withPaging(query.page, query.pageSize, {
        keyword: query.keyword,
        languageId: query.languageId,
        categoryId: query.categoryId,
        channelId: query.channelId,
        scopeId: query.scopeId,
        status: query.status,
        carouselOnly: query.carouselOnly,
      }),
    }),

  getActivityDetail: (id: number) =>
    requestTopLevelItem<MarketingActivity>({
      url: `/admin/marketing/activities/${id}`,
      method: "GET",
    }),

  createActivity: (payload: MarketingCreateActivityPayload) =>
    requestTopLevelItem<MarketingActivity>({
      url: "/admin/marketing/activities",
      method: "POST",
      data: payload,
    }),

  updateActivity: (payload: MarketingUpdateActivityPayload) =>
    requestTopLevelItem<MarketingActivity>({
      url: `/admin/marketing/activities/${payload.id}`,
      method: "PUT",
      data: payload,
    }),

  deleteActivity: (id: number) =>
    requestTopLevelItem<MarketingActivity>({
      url: `/admin/marketing/activities/${id}:delete`,
      method: "POST",
      data: { id },
    }),

  submitActivityReview: (payload: MarketingCommentPayload) =>
    requestTopLevelItem<MarketingActivity>({
      url: `/admin/marketing/activities/${payload.id}:submit_review`,
      method: "POST",
      data: payload,
    }),

  reviewActivity: (payload: MarketingReviewPayload) =>
    requestTopLevelItem<MarketingActivity>({
      url: `/admin/marketing/activities/${payload.id}:review`,
      method: "POST",
      data: payload,
    }),

  publishActivity: (id: number) =>
    requestTopLevelItem<MarketingActivity>({
      url: `/admin/marketing/activities/${id}:publish`,
      method: "POST",
      data: { id },
    }),

  offlineActivity: (payload: MarketingCommentPayload) =>
    requestTopLevelItem<MarketingActivity>({
      url: `/admin/marketing/activities/${payload.id}:offline`,
      method: "POST",
      data: payload,
    }),

  generateLink: (payload: MarketingGenerateLinkPayload) =>
    requestTopLevelItem<MarketingActivityPromotionLink>({
      url: "/admin/marketing/activity_links:generate",
      method: "POST",
      data: payload,
    }),

  batchGenerateLinks: (payload: MarketingBatchGenerateLinksPayload) =>
    requestItemsOnly<MarketingActivityPromotionLink>({
      url: "/admin/marketing/activity_links:batch_generate",
      method: "POST",
      data: payload,
    }),

  listLinks: (query: MarketingLinksQuery) =>
    requestTopLevelList<MarketingActivityPromotionLink>({
      url: "/admin/marketing/activity_links",
      method: "GET",
      params: withPaging(query.page, query.pageSize, {
        activityId: query.activityId,
        affiliateId: query.affiliateId,
        channelId: query.channelId,
      }),
    }),

  listReviewRecords: (query: MarketingAuditQuery) =>
    requestTopLevelList<MarketingReviewRecord>({
      url: "/admin/marketing/reviews",
      method: "GET",
      params: withPaging(query.page, query.pageSize, {
        contentType: query.contentType,
        contentId: query.contentId,
      }),
    }),

  listOperationLogs: (query: MarketingAuditQuery) =>
    requestTopLevelList<MarketingOperationLog>({
      url: "/admin/marketing/operation_logs",
      method: "GET",
      params: withPaging(query.page, query.pageSize, {
        contentType: query.contentType,
        contentId: query.contentId,
      }),
    }),

  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const result = await requestEnvelope<MarketingFileUploadEnvelope>({
      url: "/admin/files/upload",
      method: "POST",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return {
      ...result,
      value: result.envelope.item ?? null,
    };
  },

  listFileObjects: (query: MarketingFileObjectsQuery) =>
    requestTopLevelList<MarketingFileObject>({
      url: "/admin/file_objects",
      method: "GET",
      params: cleanParams({
        page: query.page,
        pageSize: query.pageSize,
        keyword: query.keyword,
      }),
    }),

  getFileObject: (id: number) =>
    requestTopLevelItem<MarketingFileObject>({
      url: `/admin/file_objects/${id}`,
      method: "GET",
    }),

  deleteFileObject: (id: number) =>
    requestNoContent({
      url: `/admin/file_objects/${id}:delete`,
      method: "POST",
      data: { id },
    }),
};

export type MarketingCenterApi = typeof marketingCenterApi;
