import { businessRequest } from "@/lib/business-http";
import type {
  KolChangeLogDetail,
  KolChangeLogListItem,
  KolChangeLogListQuery,
  KolChangeLogsValue,
} from "@/types/kol-log";

const KOL_CHANGE_LOGS_ENDPOINT = "/admin/affinex/kolChangeLogs";

function cleanParams(params: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== undefined && value !== null),
  );
}

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }
  return {};
}

function toArray<T>(value: unknown, mapItem: (item: unknown) => T): T[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map(mapItem);
}

function toStringValue(value: unknown) {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value);
}

function toNumberValue(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toIdValue(value: unknown) {
  if (typeof value === "number" || typeof value === "string") {
    return value;
  }
  return undefined;
}

function normalizeListItem(value: unknown): KolChangeLogListItem {
  const raw = toRecord(value);

  return {
    id: toIdValue(raw.id),
    affiliateId: toStringValue(raw.affiliateId),
    affiliateCode: toStringValue(raw.affiliateCode),
    affiliateName: toStringValue(raw.affiliateName),
    email: toStringValue(raw.email),
    bizType: toStringValue(raw.bizType),
    bizSubType: toStringValue(raw.bizSubType),
    eventType: toStringValue(raw.eventType),
    attemptNo: toStringValue(raw.attemptNo),
    fromStatus: toStringValue(raw.fromStatus),
    toStatus: toStringValue(raw.toStatus),
    changeKey: toStringValue(raw.changeKey),
    changeData: raw.changeData,
    remark: toStringValue(raw.remark),
    operatorId: toStringValue(raw.operatorId),
    operatorName: toStringValue(raw.operatorName),
    operatorType: toStringValue(raw.operatorType),
    source: toStringValue(raw.source),
    relatedTable: toStringValue(raw.relatedTable),
    relatedId: toStringValue(raw.relatedId),
    requestId: toStringValue(raw.requestId),
    createTime: toStringValue(raw.createTime || raw.createdAt),
    trafficApprovedBy: toStringValue(raw.trafficApprovedBy),
  };
}

function normalizeDetail(value: unknown): KolChangeLogDetail {
  return normalizeListItem(value);
}

function normalizeListValue(value: unknown): KolChangeLogsValue {
  const raw = toRecord(value);

  return {
    page: toNumberValue(raw.page, 1),
    pageSize: toNumberValue(raw.pageSize, 20),
    total: toNumberValue(raw.total, 0),
    items: toArray(raw.items, normalizeListItem),
  };
}

export const kolLogApi = {
  listKolChangeLogs: async (query: KolChangeLogListQuery) => {
    const result = await businessRequest<unknown>({
      url: KOL_CHANGE_LOGS_ENDPOINT,
      method: "GET",
      params: cleanParams(query),
    });

    return {
      ...result,
      value: normalizeListValue(result.value),
    };
  },

  getKolChangeLogDetail: async (id: number | string) => {
    const result = await businessRequest<unknown>({
      url: `${KOL_CHANGE_LOGS_ENDPOINT}/${id}`,
      method: "GET",
    });

    return {
      ...result,
      value: normalizeDetail(result.value),
    };
  },
};
