export interface KolChangeLogListQuery {
  page: number;
  pageSize: number;
  affiliateId?: string;
  affiliateCode?: string;
  affiliateName?: string;
  email?: string;
  bizType?: string;
  bizSubType?: string;
  eventType?: string;
  changeKey?: string;
  operatorId?: string;
  operatorName?: string;
  operatorType?: string;
  source?: string;
  relatedTable?: string;
  relatedId?: string;
  requestId?: string;
  fromStatus?: string;
  toStatus?: string;
  attemptNo?: string;
  createTimeFrom?: string;
  createTimeTo?: string;
  trafficApprovedBy?: string;
}

export interface KolChangeLogListItem {
  id?: number | string;
  affiliateId?: string;
  affiliateCode?: string;
  affiliateName?: string;
  email?: string;
  bizType?: string;
  bizSubType?: string;
  eventType?: string;
  attemptNo?: string;
  fromStatus?: string;
  toStatus?: string;
  changeKey?: string;
  changeData?: unknown;
  remark?: string;
  operatorId?: string;
  operatorName?: string;
  operatorType?: string;
  source?: string;
  relatedTable?: string;
  relatedId?: string;
  requestId?: string;
  createTime?: string;
  trafficApprovedBy?: string;
}

export type KolChangeLogDetail = KolChangeLogListItem;

export interface KolChangeLogsValue {
  page: number;
  pageSize: number;
  total: number;
  items: KolChangeLogListItem[];
}
