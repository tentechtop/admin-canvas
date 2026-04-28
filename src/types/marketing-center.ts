export type MarketingTaxonomyType =
  | "TAXONOMY_TYPE_LANGUAGE"
  | "TAXONOMY_TYPE_CHANNEL"
  | "TAXONOMY_TYPE_SCOPE"
  | "TAXONOMY_TYPE_MATERIAL_CATEGORY"
  | "TAXONOMY_TYPE_ACTIVITY_CATEGORY";

export type MarketingContentType =
  | "CONTENT_TYPE_MATERIAL"
  | "CONTENT_TYPE_ACTIVITY";

export type MarketingContentStatus =
  | "CONTENT_STATUS_UNSPECIFIED"
  | "CONTENT_STATUS_DRAFT"
  | "CONTENT_STATUS_PENDING_REVIEW"
  | "CONTENT_STATUS_REJECTED"
  | "CONTENT_STATUS_APPROVED"
  | "CONTENT_STATUS_PUBLISHED"
  | "CONTENT_STATUS_OFFLINE";

export type MarketingReviewDecision =
  | "REVIEW_DECISION_UNSPECIFIED"
  | "REVIEW_DECISION_APPROVE"
  | "REVIEW_DECISION_REJECT";

export interface MarketingTaxonomyItem {
  id?: number;
  type?: MarketingTaxonomyType;
  code?: string;
  name?: string;
  locale?: string;
  sort?: number;
  enabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MarketingFileRef {
  id?: number;
  originalName?: string;
  storedName?: string;
  contentType?: string;
  size?: number;
  url?: string;
  downloadUrl?: string;
}

export interface MarketingFileObject {
  id?: number;
  originalName?: string;
  storedName?: string;
  ext?: string;
  size?: number;
  contentType?: string;
  storageProvider?: string;
  url?: string;
  downloadUrl?: string;
  createdAt?: string;
}

export interface MarketingMaterial {
  id?: number;
  title?: string;
  description?: string;
  materialType?: string;
  legacyMaterialType?: string;
  language?: MarketingTaxonomyItem;
  category?: MarketingTaxonomyItem;
  channels?: MarketingTaxonomyItem[];
  scopes?: MarketingTaxonomyItem[];
  file?: MarketingFileRef;
  cover?: MarketingFileRef;
  cooperationSampleUrl?: string;
  copyCode?: string;
  size?: string;
  fileType?: string;
  status?: MarketingContentStatus;
  rejectReason?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  offlineAt?: string;
}

export interface MarketingActivity {
  id?: number;
  title?: string;
  description?: string;
  language?: MarketingTaxonomyItem;
  category?: MarketingTaxonomyItem;
  channels?: MarketingTaxonomyItem[];
  scopes?: MarketingTaxonomyItem[];
  cover?: MarketingFileRef;
  carousel?: boolean;
  landingUrl?: string;
  status?: MarketingContentStatus;
  rejectReason?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  offlineAt?: string;
}

export interface MarketingReviewRecord {
  id?: number;
  contentType?: MarketingContentType;
  contentId?: number;
  fromStatus?: MarketingContentStatus;
  toStatus?: MarketingContentStatus;
  decision?: MarketingReviewDecision;
  reviewerId?: string;
  reviewerName?: string;
  comment?: string;
  createdAt?: string;
}

export interface MarketingOperationLog {
  id?: number;
  contentType?: MarketingContentType;
  contentId?: number;
  action?: string;
  operatorId?: string;
  operatorName?: string;
  detail?: string;
  createdAt?: string;
}

export interface MarketingWorkbenchStatusSummary {
  total: number;
  draft: number;
  pendingReview: number;
  rejected: number;
  approved: number;
  published: number;
  offline: number;
}

export interface MarketingWorkbenchStatusSummaryWire {
  total?: number | string;
  draft?: number | string;
  pendingReview?: number | string;
  pending_review?: number | string;
  rejected?: number | string;
  approved?: number | string;
  published?: number | string;
  offline?: number | string;
}

export interface MarketingWorkbenchSummaryValue {
  materials: MarketingWorkbenchStatusSummary;
  activities: MarketingWorkbenchStatusSummary;
}

export interface MarketingActivityPromotionLink {
  id?: number;
  activityId?: number;
  affiliateId?: string;
  affiliateName?: string;
  channel?: MarketingTaxonomyItem;
  longUrl?: string;
  shortUrl?: string;
  enabled?: boolean;
  createdAt?: string;
}

export interface MarketingListQueryBase {
  page: number;
  pageSize: number;
}

export interface MarketingMaterialsQuery extends MarketingListQueryBase {
  keyword?: string;
  materialType?: string;
  legacyMaterialType?: string;
  languageId?: number;
  categoryId?: number;
  channelId?: number;
  scopeId?: number;
  status?: MarketingContentStatus;
}

export interface MarketingActivitiesQuery extends MarketingListQueryBase {
  keyword?: string;
  languageId?: number;
  categoryId?: number;
  channelId?: number;
  scopeId?: number;
  status?: MarketingContentStatus;
  carouselOnly?: boolean;
}

export interface MarketingLinksQuery extends MarketingListQueryBase {
  activityId?: number;
  affiliateId?: string;
  channelId?: number;
}

export interface MarketingAuditQuery extends MarketingListQueryBase {
  contentType?: MarketingContentType;
  contentId?: number;
}

export interface MarketingFileObjectsQuery extends MarketingListQueryBase {
  keyword?: string;
}

export interface MarketingMaterialsListValue {
  items: MarketingMaterial[];
  total: number;
}

export interface MarketingActivitiesListValue {
  items: MarketingActivity[];
  total: number;
}

export interface MarketingLinksListValue {
  items: MarketingActivityPromotionLink[];
  total: number;
}

export interface MarketingReviewsListValue {
  items: MarketingReviewRecord[];
  total: number;
}

export interface MarketingOperationLogsValue {
  items: MarketingOperationLog[];
  total: number;
}

export interface MarketingFileObjectsValue {
  items: MarketingFileObject[];
  total: number;
}

export interface MarketingCreateMaterialPayload {
  title: string;
  description: string;
  materialType: string;
  legacyMaterialType: string;
  languageId: number;
  categoryId: number;
  channelIds: number[];
  scopeIds: number[];
  fileId?: number;
  coverFileId?: number;
  cooperationSampleUrl?: string;
  copyCode?: string;
  size?: string;
  fileType?: string;
}

export interface MarketingUpdateMaterialPayload extends MarketingCreateMaterialPayload {
  id: number;
}

export interface MarketingCreateActivityPayload {
  title: string;
  description: string;
  languageId: number;
  categoryId: number;
  channelIds: number[];
  scopeIds: number[];
  coverFileId?: number;
  carousel: boolean;
  landingUrl: string;
}

export interface MarketingUpdateActivityPayload extends MarketingCreateActivityPayload {
  id: number;
}

export interface MarketingReviewPayload {
  id: number;
  decision: MarketingReviewDecision;
  comment?: string;
}

export interface MarketingCommentPayload {
  id: number;
  comment?: string;
}

export interface MarketingCreateTaxonomyPayload {
  type: MarketingTaxonomyType;
  code: string;
  name: string;
  locale?: string;
  sort?: number;
  enabled: boolean;
}

export interface MarketingUpdateTaxonomyPayload {
  id: number;
  name: string;
  locale?: string;
  sort?: number;
  enabled: boolean;
}

export interface MarketingGenerateLinkPayload {
  activityId: number;
  affiliateId: string;
  affiliateName?: string;
  channelId: number;
  forceRegenerate: boolean;
}

export interface MarketingBatchGenerateLinksPayload {
  activityId: number;
  affiliateIds: string[];
  channelId: number;
  forceRegenerate: boolean;
}

export interface MarketingMutationEnvelope<T> {
  success: boolean;
  message: string;
  item?: T;
  errCode?: number;
  nonce?: string;
}

export interface MarketingListEnvelope<T> {
  success: boolean;
  message: string;
  items?: T[];
  total?: number;
  errCode?: number;
  nonce?: string;
}

export interface MarketingFileUploadEnvelope {
  success: boolean;
  message: string;
  item?: MarketingFileObject;
  errCode?: number;
}

export interface MarketingWorkbenchSummaryEnvelope {
  success: boolean;
  message: string;
  materials?: MarketingWorkbenchStatusSummaryWire;
  activities?: MarketingWorkbenchStatusSummaryWire;
  errCode?: number;
  code?: number;
  nonce?: string;
}
