import { businessRequest } from "@/lib/business-http";
import type {
  SystemOperationLogDetail,
  SystemOperationLogListItem,
  SystemOperationLogListQuery,
  SystemOperationLogsValue,
} from "@/types/system-log";

const SYSTEM_OPERATION_LOGS_ENDPOINT = "/admin/affinex/operationLogs";

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

function normalizeListItem(value: unknown): SystemOperationLogListItem {
  const raw = toRecord(value);

  return {
    id: raw.id as number | string | undefined,
    event: toStringValue(raw.event),
    module: toStringValue(raw.module),
    operatorName: toStringValue(raw.operatorName),
    operatorId: toStringValue(raw.operatorId),
    operatorType: toStringValue(raw.operatorType),
    targetType: toStringValue(raw.targetType),
    targetId: toStringValue(raw.targetId),
    result: raw.result as SystemOperationLogListItem["result"],
    requestId: toStringValue(raw.requestId),
    traceId: toStringValue(raw.traceId),
    source: toStringValue(raw.source),
    args: raw.args,
    errorMessage: toStringValue(raw.errorMessage),
    remark: toStringValue(raw.remark),
    createTime: toStringValue(raw.createTime || raw.createdAt),
  };
}

function normalizeDetail(value: unknown): SystemOperationLogDetail {
  const raw = toRecord(value);

  return {
    ...normalizeListItem(raw),
    ip: toStringValue(raw.ip),
    userAgent: toStringValue(raw.userAgent),
    beforeData: raw.beforeData,
    afterData: raw.afterData,
  };
}

function normalizeListValue(value: unknown): SystemOperationLogsValue {
  const raw = toRecord(value);

  return {
    page: toNumberValue(raw.page, 1),
    pageSize: toNumberValue(raw.pageSize, 20),
    total: toNumberValue(raw.total, 0),
    items: toArray(raw.items, normalizeListItem),
  };
}

export const systemLogApi = {
  listOperationLogs: async (query: SystemOperationLogListQuery) => {
    const result = await businessRequest<unknown>({
      url: SYSTEM_OPERATION_LOGS_ENDPOINT,
      method: "GET",
      params: cleanParams(query),
    });

    return {
      ...result,
      value: normalizeListValue(result.value),
    };
  },

  getOperationLogDetail: async (id: number | string) => {
    const result = await businessRequest<unknown>({
      url: `${SYSTEM_OPERATION_LOGS_ENDPOINT}/${id}`,
      method: "GET",
    });

    return {
      ...result,
      value: normalizeDetail(result.value),
    };
  },
};
