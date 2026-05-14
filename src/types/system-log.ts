export type OperationLogResultValue = number | string | boolean | null | undefined;

export interface SystemOperationLogListQuery {
  page: number;
  pageSize: number;
  event?: string;
  module?: string;
  operatorId?: string;
  targetType?: string;
  targetId?: string;
  requestId?: string;
  result?: 0 | 1;
}

export interface SystemOperationLogListItem {
  id?: number | string;
  event?: string;
  module?: string;
  operatorName?: string;
  operatorId?: string;
  operatorType?: string;
  targetType?: string;
  targetId?: string;
  result?: OperationLogResultValue;
  requestId?: string;
  traceId?: string;
  source?: string;
  args?: unknown;
  errorMessage?: string;
  remark?: string;
  createTime?: string;
}

export interface SystemOperationLogDetail extends SystemOperationLogListItem {
  ip?: string;
  userAgent?: string;
  beforeData?: unknown;
  afterData?: unknown;
}

export interface SystemOperationLogsValue {
  page: number;
  pageSize: number;
  total: number;
  items: SystemOperationLogListItem[];
}
