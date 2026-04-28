export type ScopeType = "ALL" | "SELF" | "NONE";

export type TrafficReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export type KycReviewStatus =
  | "PENDING"
  | "APPROVED"
  | "DOCUMENTS_REJECTED"
  | "NOT_APPLIED"
  | "ACCOUNT_CLOSED";

export interface AuthUserInfo {
  adminId?: number;
  uid?: string;
  username?: string;
  email?: string;
  roleCodes?: string[];
  roleNames?: string[];
  platformId?: number;
  platformCode?: string;
}

export interface AuthUserListValue {
  total?: number;
  list?: AuthUserInfo[];
}

export interface RoleDataPermissionRelation {
  resourceCode?: string;
  actionCode?: string;
  scopeType?: ScopeType | string;
}

export interface RoleDataPermissionConfig {
  id?: number;
  roleId?: number;
  roleCode?: string;
  roleName?: string;
  platformCode?: string;
  configured?: boolean;
  enabled?: boolean;
  remark?: string;
  permissions?: RoleDataPermissionRelation[];
  roleExistsInAuth?: boolean;
}

export interface RoleDataPermissionListValue {
  total?: number;
  list?: RoleDataPermissionConfig[];
}

export interface AffiliateAuditRow {
  affiliateId?: string;
  affiliateCode?: string;
  referralCode?: string;
  name?: string;
  mail?: string;
  tier?: string;
  countryCode?: string;
  compensationModel?: string;
  rs?: boolean;
  owner?: string;
  inviteCode?: string;
  shortLink?: string;
  websites?: string[];
  trafficSource?: string[];
  commissionRate?: number | string;
  accountType?: string;
  createTime?: string;
  auditTime?: string;
  trafficAuditTime?: string;
  trafficResourceStatus?: string;
  trafficResourceApprovedBy?: string;
  reviewerUsernameSnapshot?: string;
  idKYCStatus?: string;
  idApproverNotes?: string;
  applicationTime?: string;
  reviewer?: string;
  reviewTime?: string;
  remark?: string;
  bdOwnerAdminId?: string;
  bdOwnerUsernameSnapshot?: string;
  bdChangeLog?: string[];
  totalUser?: number | string;
  [key: string]: unknown;
}

export interface AffiliateAuditListValue {
  total?: number;
  totalPages?: number;
  pageSize?: number;
  currentPage?: number;
  resultList?: AffiliateAuditRow[];
}

export interface ReviewAggregateCountValue {
  pending?: number;
  approved?: number;
  rejected?: number;
}

export interface AffiliateReviewUpdatePayload {
  affiliateId: string;
  accountType?: string;
  idKYCStatus?: string;
  idApproverNotes?: string;
  trafficResourceStatus?: string;
  bdOwnerAdminId?: string;
  bdOwnerUsernameSnapshot?: string;
}

export interface KolKycIndividualPayload {
  affiliateId?: string;
  address?: string;
  birthday?: string;
  city?: string;
  firstName?: string;
  idNumber?: string;
  idType?: string;
  img?: string;
  imgContent?: string;
  lastName?: string;
  mitradeLiveAccount?: string;
  otherPhone?: string;
  phone?: string;
  number?: string;
  proofOfAddressImg?: string;
  proofOfAddressImgContent?: string;
  type?: string;
  state?: string;
  zip?: string;
}

export interface KolKycCompanyPayload {
  affiliateId?: string;
  address?: string;
  birthday?: string;
  city?: string;
  companyName?: string;
  companyRegCertImg?: string;
  companyRegCertImgContent?: string;
  companyRegNumber?: string;
  firstName?: string;
  img?: string;
  imgContent?: string;
  lastName?: string;
  mainOfficePhone?: string;
  mitradeLiveAccount?: string;
  number?: string;
  officeAddress?: string;
  officeCity?: string;
  officeZip?: string;
  otherPhone?: string;
  phone?: string;
  proofOfAddressImg?: string;
  proofOfAddressImgContent?: string;
  state?: string;
  type?: string;
  zip?: string;
}

export interface KolKycUpdatePayload {
  affiliateId: string;
  accountType?: string;
  individual?: KolKycIndividualPayload;
  company?: KolKycCompanyPayload;
}

export type ModificationReviewAction = "APPROVE" | "REJECT";

export interface AffiliateModificationReviewPayload {
  affiliateId: string;
  logId: number;
  action: ModificationReviewAction;
  remark?: string;
}

export interface AffiliateCommissionRateUpdatePayload {
  affiliateId: string;
  tier: string;
  spreadPercentage: number;
}

export interface AffiliateBdOwnerUpdatePayload {
  affiliateId: string;
  bdOwnerAdminId: string;
  bdOwnerUsernameSnapshot: string;
  remark?: string;
}

export interface AffiliateCommissionRateUpdateResult {
  success?: boolean;
  message?: string;
  errCode?: number;
}

export interface AffiliateReviewLogEntry {
  id?: number | string;
  affiliateId?: string;
  bizType?: string;
  bizSubType?: string;
  attemptNo?: number | string;
  createTime?: string;
  updateTime?: string;
  operationTime?: string;
  auditTime?: string;
  action?: string;
  actionName?: string;
  operationType?: string;
  eventType?: string;
  status?: string;
  oldStatus?: string;
  newStatus?: string;
  beforeStatus?: string;
  afterStatus?: string;
  fromStatus?: string;
  toStatus?: string;
  trafficResourceStatus?: string;
  idKYCStatus?: string;
  changeKey?: string;
  changeData?: string;
  operator?: string;
  operatorId?: string;
  operatorName?: string;
  operatorType?: string;
  approvedBy?: string;
  updatedBy?: string;
  createdBy?: string;
  username?: string;
  userName?: string;
  adminName?: string;
  accountType?: string;
  bdOwnerUsernameSnapshot?: string;
  owner?: string;
  remark?: string;
  reason?: string;
  description?: string;
  notes?: string;
  comment?: string;
  message?: string;
  source?: string;
  relatedTable?: string;
  relatedId?: string;
  requestId?: string;
  [key: string]: unknown;
}

export interface AffiliateBDOwnerChangeLogDetail {
  recordId?: number | string;
  affiliateId?: string;
  bdOwnerAdminId?: number | string;
  bdOwnerUsernameSnapshot?: string;
  changeTime?: string;
  createdTime?: string;
  updatedTime?: string;
  changeLog?: AffiliateReviewLogEntry | null;
}

export interface AffiliateBaseDetail {
  affiliateId?: string;
  mail?: string;
  name?: string;
  password?: string;
  countryCode?: string;
  compensationModel?: string;
  referralCode?: string;
  paypalAccount?: string;
  receiveUpdateMailSetting?: string;
  receiveTransReportMailSetting?: string;
  updateTime?: string;
  createTime?: string;
  idAccountType?: string;
  idFirstName?: string;
  idLastName?: string;
  idPhone?: string;
  idOtherPhone?: string;
  idAddress?: string;
  idCity?: string;
  idZip?: string;
  idType?: string;
  idNumber?: string;
  idBirthday?: string;
  idProofOfAddressImg?: string;
  idImg?: string;
  idCompanyName?: string;
  idMainOfficePhone?: string;
  idCompanyReg?: string;
  idOfficeAddress?: string;
  idOfficeCity?: string;
  idOfficeZip?: string;
  idCompanyRegCertImg?: string;
  idApprovedBy?: string;
  idApproverNotes?: string;
  idTimestamp?: string;
  shortLink?: string;
  isTest?: number | string;
  deleted?: number | string;
  idMitradeLiveAccount?: string;
  trafficResourceStatus?: string;
  trafficResourceApprovedBy?: string;
  idKycStatus?: string;
  paymentMethods?: string;
  idState?: string;
  lastSyncPerformanceDate?: string;
  inviteCode?: string;
  campaignCost?: string;
  campaignStartDate?: string;
  affiliateCode?: string;
  utmSource?: string;
  [key: string]: unknown;
}

export interface AffiliateDetailWithLogsValue {
  affiliateBase?: AffiliateBaseDetail | null;
  trafficQualificationAuditLogs?: AffiliateReviewLogEntry[];
  kycAuditLogs?: AffiliateReviewLogEntry[];
  bdOwnerChangeLogs?: AffiliateBDOwnerChangeLogDetail[];
  commissionChangeLogs?: AffiliateReviewLogEntry[];
  otherChangeLogs?: AffiliateReviewLogEntry[];
}

export type AffiliateReviewLogValue =
  | AffiliateReviewLogEntry[]
  | {
      list?: AffiliateReviewLogEntry[];
      resultList?: AffiliateReviewLogEntry[];
      records?: AffiliateReviewLogEntry[];
      items?: AffiliateReviewLogEntry[];
      data?: AffiliateReviewLogEntry[];
      rows?: AffiliateReviewLogEntry[];
      logs?: AffiliateReviewLogEntry[];
      [key: string]: unknown;
    };

export interface AffiliateCommissionRateLogValue {
  affiliateId?: string;
  spreadPercentage?: number | string;
  logs?: AffiliateReviewLogEntry[];
  [key: string]: unknown;
}

export interface KolUserRow {
  liveAccount?: string;
  registrationDate?: string;
  customerCountry?: string;
  medium?: string;
  affiliateCode?: string;
  affiliateName?: string;
  affiliateMail?: string;
  [key: string]: unknown;
}

export interface KolUserListValue {
  total?: number;
  userInfo?: KolUserRow[];
}

export interface KolPerformanceRow {
  affiliateCode?: string;
  email?: string;
  owner?: string;
  commission?: number | string;
  registrations?: number | string;
  ftd?: number | string;
  qualifiedTraders?: number | string;
  [key: string]: unknown;
}

export interface KolPerformanceListValue {
  total?: number;
  kolPerformance?: KolPerformanceRow[];
}

export interface AuthUserQuery {
  platformCode: string;
  roleCodes: string[];
  keyword?: string;
}

export interface RoleDataPermissionSavePayload {
  id?: number;
  platformCode: string;
  roleCode: string;
  enabled: boolean;
  remark?: string;
  permissions: RoleDataPermissionRelation[];
}

export interface AffiliateAuditQuery {
  currentPage?: number | string;
  pageSize?: number | string;
  startDate?: string;
  endDate?: string;
  mail?: string;
  affiliateCode?: string;
  referralCode?: string;
  name?: string;
  countryCodes?: string;
  owner?: string;
  inviteCode?: string;
  shortLink?: string;
  trafficStatus?: string;
  idKYCStatus?: string;
  showTestAccount?: number | string;
  sort?: string;
  sortField?: string;
  sortModel?: string;
  adminId?: string | number;
  liveAccount?: string;
}

export interface KolUserQuery {
  adminId?: string;
  tradingAccountNumber?: string;
  affiliateCode?: string;
  affiliateName?: string;
  affiliateMail?: string;
  medium?: string;
  showTestingAccounts?: number | string;
  registrationDateStart?: string;
  registrationDateEnd?: string;
  page?: number | string;
  pageSize?: number | string;
}

export interface KolPerformanceQuery {
  adminId?: string;
  affiliateCode?: string;
  page?: number | string;
  pageSize?: number | string;
  startDate?: string;
  endDate?: string;
  email?: string;
  owner?: string;
}

export interface PaymentBatch {
  status?: string;
  periodStartDate?: string;
  periodEndDate?: string;
  commissionAmount?: number | string;
  paymentId?: number | string;
  date?: string;
  amount?: string;
  referenceNumber?: string;
  [key: string]: unknown;
}

export interface PaymentCommissionRow {
  customerId?: string;
  countDate?: string;
  symbolCode?: string;
  openValueUsd?: number | string;
  speed?: number | string;
  commission?: number | string;
  volume?: number | string;
  spreadValue?: number | string;
  orderValue?: number | string;
  [key: string]: unknown;
}

export interface PaymentCurrentValue {
  total?: number;
  payments?: PaymentBatch | null;
  commissions?: PaymentCommissionRow[];
}

export interface PaymentHistoryValue {
  total?: number;
  currentPage?: number;
  pageSize?: number;
  totalPages?: number;
  payments?: PaymentBatch[];
  resultList?: PaymentBatch[];
}

export type SettlementStatementStatus =
  | "NOTWITHDRAW"
  | "PENDING"
  | "APPLIED"
  | "APPROVED"
  | "PAID"
  | "DECLINED"
  | "MERGED"
  | "WITHDRAWING";

export interface SettlementDashboardMetric {
  count?: number;
  amount?: string;
}

export interface SettlementDashboardValue {
  pendingApply?: SettlementDashboardMetric;
  pendingReview?: SettlementDashboardMetric;
  pendingPayout?: SettlementDashboardMetric;
  paid?: SettlementDashboardMetric;
  declined?: SettlementDashboardMetric;
  totalPayableAmount?: string;
}

export interface SettlementAttachment {
  code?: string;
  path?: string;
}

export interface SettlementStatementRow {
  id?: number | string;
  affiliateId?: string;
  name?: string;
  medium?: string;
  email?: string;
  paidAmount?: string;
  applicationDate?: string;
  status?: SettlementStatementStatus | string;
  payoutDate?: string;
  oldAffiliateId?: string;
  datePeriod?: string;
  owner?: string;
  paymentMethods?: string;
  awardAmount?: number;
  adjustmentsAmount?: number;
  originAmount?: number;
  receiverAccount?: string;
  note?: string;
  receipts?: SettlementAttachment[];
  paymentSummaryId?: number;
}

export interface SettlementStatementListValue {
  total: number;
  items: SettlementStatementRow[];
  summaryAmount?: string;
}

export interface SettlementStatementQuery {
  affiliateId?: string;
  name?: string;
  trafficApprovedBy?: string;
  status?: string;
  dateRange?: string;
  currentPage?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  paymentId?: string;
  periodStartDate?: string;
  periodEndDate?: string;
  paymentSummaryId?: number;
  includeNotWithdraw?: boolean;
}

export interface SettlementPaymentCommissionRow {
  traderLiveAccount?: string;
  date?: string;
  instrument?: string;
  spread?: number | string;
  tier?: string;
  commission?: number | string;
  affiliateCode?: string;
  affiliateEmail?: string;
  kolOwnerName?: string;
  tradeTime?: string;
  awardUsd?: number | string;
  originCommission?: number | string;
}

export interface SettlementPaymentCommissionValue {
  total?: number;
  paymentCommissions?: SettlementPaymentCommissionRow[];
}

export interface SettlementPaymentSummaryHistoryRow {
  datePeriod?: string;
  originAmount?: number;
  awardAmount?: number;
  paidAmount?: string;
}

export interface SettlementPaymentSummaryRow {
  id?: number;
  affiliateId?: string;
  affiliateCode?: string;
  payableAmount?: string;
  adjustmentsAmount?: number;
  status?: string;
  payoutDate?: string;
  note?: string;
  applicationDate?: string;
  paymentMethods?: string;
  paymentFile?: string[];
  paymentHistoryList?: SettlementPaymentSummaryHistoryRow[];
  medium?: string;
  name?: string;
  email?: string;
  owner?: string;
  originAmount?: number;
}

export interface SettlementPaymentSummaryListValue {
  total: number;
  items: SettlementPaymentSummaryRow[];
  summaryAmount?: string;
}

export interface SettlementPaymentSummaryQuery {
  affiliateId?: string;
  status?: string;
  dateRange?: string;
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  trafficApprovedBy?: string;
}

export interface SettlementUpdatePaymentSummaryPayload {
  id: number;
  status?: string;
  payoutDate?: string;
  paymentMethods?: string;
  note?: string;
  paymentFile?: string[];
  adjustmentsAmount?: number;
}

export interface SettlementUpdateStatementPayload {
  id: number;
  status?: string;
  payoutDate?: string;
  paymentMethods?: string;
  adjustmentsAmount?: number;
}

export interface AdminUploadedFile {
  id?: number;
  originalName?: string;
  storedName?: string;
  contentType?: string;
  size?: number;
  url?: string;
  downloadUrl?: string;
}

export interface AffiliateCampaignSummaryRow {
  mail?: string;
  name?: string;
  createTime?: string;
  compensationModel?: string;
  idKYCStatus?: string;
  registrations?: number | string;
  qualifiedTraders?: number | string;
  commissionEarned?: number | string;
  accountBalance?: number | string;
}

export interface AffiliateCampaignListValue {
  total?: number;
  totalPages?: number;
  pageSize?: number;
  currentPage?: number;
  resultList?: AffiliateCampaignSummaryRow[];
}

export interface AffiliateCampaignListQuery {
  currentPage?: number | string;
  pageSize?: number | string;
  sortField?: string;
  sortModel?: string;
  mail?: string;
  showTestAccount?: string;
}

export interface CustomerDetailRow {
  customerLiveAccount?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCountry?: string;
  customerRegDate?: string;
  customerKycStatus?: string;
  affiliateEmail?: string;
  affiliateName?: string;
  affiliateRegDate?: string;
  customerId?: string;
  affiliateCountry?: string;
  [key: string]: unknown;
}

export interface CustomerDetailValue {
  total?: number;
  resultList?: CustomerDetailRow[];
}

export interface CustomerDetailsQuery {
  affiliateId: string;
  currentPage?: number | string;
  pageSize?: number | string;
  startDate?: string;
  endDate?: string;
  affiliateEmail?: string;
  customerEmail?: string;
}

export interface CustomerReportRow {
  customerId?: string;
  country?: string;
  signupDate?: string;
  platform?: string;
  deviceOS?: string;
  fullSignupDate?: string;
  ftdDate?: string;
  qualifiedDate?: string;
  firstDepositAmount?: string;
  totalOrderValue?: string;
  commission?: string;
  totalDepositAmount?: string;
  note?: string;
  originCustomerId?: string;
  [key: string]: unknown;
}

export interface CustomerReportValue {
  currentPage?: number;
  total?: number;
  pageSize?: number;
  totalPages?: number;
  resultList?: CustomerReportRow[];
}

export interface CustomerReportQuery {
  affiliateId: string;
  date?: string;
  from?: string;
  to?: string;
  fields?: string;
  countryCode?: string;
  sortField?: string;
  sort?: string;
  currentPage?: number | string;
  pageSize?: number | string;
}

export interface PerformanceReportRow {
  date?: string;
  installsAndroid?: number | string;
  installsIOS?: number | string;
  signups?: number | string;
  qualifiedCustomers?: number | string;
  fullSignups?: number | string;
  conversionRatio?: number | string;
  totalOrderValue?: number | string;
  commission?: number | string;
  [key: string]: unknown;
}

export type PerformanceReportSummary = PerformanceReportRow;

export interface PerformanceReportValue {
  currentPage?: number;
  total?: number;
  pageSize?: number;
  totalPages?: number;
  resultList?: PerformanceReportRow[];
  summary?: PerformanceReportSummary;
}

export interface PerformanceReportQuery {
  affiliateId: string;
  groupBy?: string;
  from?: string;
  to?: string;
  fields?: string;
  countryCode?: string;
  currentPage?: number | string;
  pageSize?: number | string;
  sortField?: string;
  sort?: string;
}

export interface TradeReportRow {
  customerId?: string;
  countryCode?: string;
  symbolCode?: string;
  openTime?: string;
  volume?: number | string;
  spreadValue?: number | string;
  orderValue?: number | string;
  [key: string]: unknown;
}

export interface TradeReportValue {
  currentPage?: number;
  total?: number;
  pageSize?: number;
  totalPages?: number;
  resultList?: TradeReportRow[];
}

export interface TradeReportQuery {
  affiliateId: string;
  groupByInstrument?: boolean | string;
  from?: string;
  to?: string;
  fields?: string;
  currentPage?: number | string;
  pageSize?: number | string;
  sortField?: string;
  sort?: string;
}
