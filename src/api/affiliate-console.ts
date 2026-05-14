import { PLATFORM_CODE } from "@/lib/http";
import { downloadAuthenticatedExportFile } from "@/lib/business-download";
import { businessRequest } from "@/lib/business-http";
import { normalizeSettlementPaymentFiles } from "@/lib/settlement-payment-files";
import type {
  AffiliateAuditQuery,
  AffiliateDetailWithLogsValue,
  AffiliateBdOwnerUpdatePayload,
  AffiliateCampaignListQuery,
  AffiliateCampaignListValue,
  AffiliateCommissionRateLogValue,
  AffiliateCommissionRateUpdatePayload,
  AffiliateCommissionRateUpdateResult,
  AffiliateCompleteInfo,
  AffiliateModificationReviewPayload,
  KolKycUpdatePayload,
  KolKycUpdateAndStatusAuditPayload,
  AffiliateReviewLogValue,
  AdminUploadedFile,
  AffiliateReviewUpdatePayload,
  AuthUserListValue,
  AuthUserQuery,
  CustomerDetailsQuery,
  CustomerDetailValue,
  CustomerReportQuery,
  CustomerReportValue,
  KolPerformanceListValue,
  KolPerformanceQuery,
  KolUserListValue,
  KolUserQuery,
  PaymentCommissionValue,
  PaymentCurrentValue,
  PaymentHistoryValue,
  PerformanceReportQuery,
  PerformanceReportValue,
  ReviewAggregateCountValue,
  SettlementDashboardValue,
  SettlementCommissionStatementItemPageQuery,
  SettlementCommissionStatementItemPageValue,
  SettlementCommissionStatementListValue,
  SettlementCommissionStatementQuery,
  SettlementCommissionStatementRow,
  SettlementCreatePaymentSummaryPayload,
  SettlementCreatePaymentSummaryValue,
  SettlementPaymentCommissionValue,
  SettlementPaymentSummaryListValue,
  SettlementPaymentSummaryQuery,
  SettlementPaymentSummaryRow,
  SettlementStatementListValue,
  SettlementStatementQuery,
  SettlementTransactionRecordListValue,
  SettlementTransactionRecordQuery,
  SettlementUserCommissionListValue,
  SettlementExportUploadType,
  SettlementUserCommissionQuery,
  SettlementUpdatePaymentSummaryPayload,
  SettlementUpdateStatementPayload,
  RoleDataPermissionConfig,
  RoleDataPermissionListValue,
  RoleDataPermissionSavePayload,
  TradeReportQuery,
  TradeReportValue,
  AffiliateKycReviewListValue,
  AffiliateKolInfoListValue,
  AffiliateTrafficReviewListValue,
} from "@/types/affiliate-console";

export const CONSOLE_PLATFORM_CODE = PLATFORM_CODE || "kol";

function cleanParams(params: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== undefined && value !== null),
  );
}

function repeatArrayParams(params: Record<string, unknown>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, rawValue]) => {
    if (rawValue === "" || rawValue === undefined || rawValue === null) {
      return;
    }

    if (Array.isArray(rawValue)) {
      rawValue
        .filter((item) => item !== "" && item !== undefined && item !== null)
        .forEach((item) => search.append(key, String(item)));
      return;
    }

    search.append(key, String(rawValue));
  });

  return search.toString();
}

function buildSettlementUserCommissionParams(
  params: SettlementUserCommissionQuery,
  options?: { includePagination?: boolean; uploadType?: SettlementExportUploadType },
) {
  const includePagination = options?.includePagination ?? true;

  return cleanParams({
    ...(includePagination
      ? {
          page: params.page ?? 1,
          pageSize: params.pageSize ?? 20,
        }
      : {}),
    statementId: params.statementId,
    affiliateCode: params.affiliateCode,
    referralCode: params.referralCode,
    affiliateName: params.affiliateName,
    email: params.email,
    ownerName: params.ownerName,
    customerId: params.customerId,
    spAccount: params.spAccount,
    orderNo: params.orderNo,
    orderId: params.orderId,
    symbolCode: params.symbolCode,
    currencyType: params.currencyType,
    status: params.status,
    withdrawStatus: params.withdrawStatus,
    countDateFrom: params.countDateFrom,
    countDateTo: params.countDateTo,
    commissionMin: params.commissionMin,
    commissionMax: params.commissionMax,
    awardUsdMin: params.awardUsdMin,
    awardUsdMax: params.awardUsdMax,
    openValueUsdMin: params.openValueUsdMin,
    openValueUsdMax: params.openValueUsdMax,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    trafficApprovedBy: params.trafficApprovedBy,
    uploadType: options?.uploadType,
  });
}

function normalizeSettlementPaymentSummaryRow(row: SettlementPaymentSummaryRow): SettlementPaymentSummaryRow {
  return {
    ...row,
    paymentFile: normalizeSettlementPaymentFiles(row.paymentFile),
  };
}

export const affiliateConsoleApi = {
  listAuthUsers: (params: AuthUserQuery) =>
    businessRequest<AuthUserListValue>({
      url: "/admin/auth/users",
      method: "GET",
      params,
    }),

  listRoleDataPermissions: (platformCode = CONSOLE_PLATFORM_CODE) =>
    businessRequest<RoleDataPermissionListValue>({
      url: "/admin/role-data-permissions/roles",
      method: "GET",
      params: { platformCode },
    }),

  saveRoleDataPermission: (payload: RoleDataPermissionSavePayload) =>
    businessRequest<RoleDataPermissionConfig>({
      url: "/admin/role-data-permissions",
      method: "POST",
      data: payload,
    }),

  deleteRoleDataPermission: (id: number) =>
    businessRequest<boolean>({
      url: `/admin/role-data-permissions/${id}`,
      method: "DELETE",
    }),

  listAffiliates: (params: AffiliateAuditQuery) =>
    businessRequest<AffiliateTrafficReviewListValue>({
      url: "/affiliate/list",
      method: "GET",
      params,
    }),

  listKycReviews: (params: AffiliateAuditQuery) =>
    businessRequest<AffiliateKycReviewListValue>({
      url: "/admin/affiliate/kycReview",
      method: "GET",
      params: cleanParams(params),
    }),

  listKolInfoStatistics: (params: AffiliateAuditQuery) =>
    businessRequest<AffiliateKolInfoListValue>({
      url: "/admin/kolUserStatistics",
      method: "GET",
      params: cleanParams(params),
    }),

  getAuditDetail: (affiliateId: string) =>
    businessRequest<Record<string, unknown>>({
      url: "/audit",
      method: "GET",
      params: { affiliateId },
    }),

  getAffiliateDetailWithLogs: (affiliateId: string) =>
    businessRequest<AffiliateDetailWithLogsValue>({
      url: "/admin/affiliate/detail_with_logs",
      method: "GET",
      params: { affiliateId },
    }),

  getAffiliateChangeLogs: (affiliateId: string) =>
    businessRequest<AffiliateReviewLogValue>({
      url: "/affiliate/change_logs",
      method: "GET",
      params: { affiliateId },
    }),

  getAffiliateCampaignList: (params: AffiliateCampaignListQuery) =>
    businessRequest<AffiliateCampaignListValue>({
      url: "/affiliate/campaign/list",
      method: "GET",
      params: cleanParams(params),
    }),

  getTrafficReviewLogs: (affiliateId: string) =>
    businessRequest<AffiliateReviewLogValue>({
      url: "/admin/affiliate/getAffiliateTrafficResourceStatusLog",
      method: "GET",
      params: { affiliateId },
    }),

  getKycReviewLogs: (affiliateId: string) =>
    businessRequest<AffiliateReviewLogValue>({
      url: "/admin/affiliate/getAffiliateIdKycStatusLog",
      method: "GET",
      params: { affiliateId },
    }),

  updateAffiliateCommissionRate: async (payload: AffiliateCommissionRateUpdatePayload) => {
    const result = await businessRequest<unknown>({
      url: "/admin/affiliate/commission_rate",
      method: "POST",
      data: payload,
    });
    const envelope = result.envelope as unknown as Record<string, unknown>;
    return {
      ...result,
      value: {
        success: Boolean(envelope.success),
        message: String(envelope.message ?? ""),
        errCode: Number(envelope.errCode ?? 0),
      } satisfies AffiliateCommissionRateUpdateResult,
    };
  },

  getAffiliateCommissionRateLog: (affiliateId: string) =>
    businessRequest<AffiliateCommissionRateLogValue>({
      url: "/admin/affiliate/getAffiliateCommissionRateLog",
      method: "GET",
      params: { affiliateId },
    }),

  getCurrentPayment: (affiliateId: string) =>
    businessRequest<PaymentCurrentValue>({
      url: "/payment/current",
      method: "GET",
      params: {
        affiliateId,
        page: 1,
        pageSize: 20,
      },
    }),

  getPaymentHistory: async (params: {
    affiliateId: string;
    status?: string;
    date?: string;
    page?: number | string;
    pageSize?: number | string;
  }) => {
    const result = await businessRequest<PaymentHistoryValue>({
      url: "/payment/history_new",
      method: "GET",
      params: cleanParams({
        affiliateId: params.affiliateId,
        status: params.status,
        date: params.date,
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
      }),
    });

    return {
      ...result,
      value: {
        ...result.value,
        payments: result.value.payments ?? result.value.resultList ?? [],
      },
    };
  },

  getPaymentCommissions: (params: {
    affiliateId: string;
    paymentId?: number | string;
    periodStartDate?: string;
    periodEndDate?: string;
    page?: number | string;
    pageSize?: number | string;
  }) =>
    businessRequest<PaymentCommissionValue>({
      url: "/payment/commission",
      method: "GET",
      params: cleanParams({
        affiliateId: params.affiliateId,
        paymentId: params.paymentId,
        periodStartDate: params.periodStartDate,
        periodEndDate: params.periodEndDate,
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
      }),
    }),

  updateAffiliateReview: (payload: AffiliateReviewUpdatePayload) =>
    businessRequest<Record<string, unknown>>({
      url: "/affiliate",
      method: "PUT",
      data: payload,
    }),

  updateKolKyc: (payload: KolKycUpdatePayload) =>
    businessRequest<Record<string, unknown>>({
      url: "/admin/kolKycUpdate",
      method: "PUT",
      data: payload,
    }),

  updateKolKycAndKycStatusAudit: (payload: KolKycUpdateAndStatusAuditPayload) =>
    businessRequest<AffiliateCompleteInfo>({
      url: "/admin/kolKycUpdateAndKycStatusAudit",
      method: "PUT",
      data: payload,
    }),

  reviewModificationApplication: (payload: AffiliateModificationReviewPayload) =>
    businessRequest<Record<string, unknown>>({
      url: "/admin/affiliate/reviewModificationApplication",
      method: "POST",
      data: payload,
    }),

  updateAffiliateBdOwner: (payload: AffiliateBdOwnerUpdatePayload) =>
    businessRequest<Record<string, unknown>>({
      url: "/admin/affiliate/bd_owner",
      method: "POST",
      data: payload,
    }),

  getTrafficReviewCounts: () =>
    businessRequest<ReviewAggregateCountValue>({
      url: "/affiliate/countALL/review/traffic",
      method: "GET",
    }),

  getKycReviewCounts: () =>
    businessRequest<ReviewAggregateCountValue>({
      url: "/affiliate/countALL/review/kyc",
      method: "GET",
    }),

  listKolUsers: (params: KolUserQuery) =>
    businessRequest<KolUserListValue>({
      url: "/kol_user/list",
      method: "GET",
      params,
    }),

  listKolPerformance: (params: KolPerformanceQuery) =>
    businessRequest<KolPerformanceListValue>({
      url: "/kol_performance/admin",
      method: "GET",
      params,
    }),

  getCustomerDetails: (params: CustomerDetailsQuery) =>
    businessRequest<CustomerDetailValue>({
      url: "/customer/details",
      method: "GET",
      params: cleanParams(params),
    }),

  getCustomerReport: (params: CustomerReportQuery) =>
    businessRequest<CustomerReportValue>({
      url: "/report/customer",
      method: "GET",
      params: cleanParams(params),
    }),

  getPerformanceReport: (params: PerformanceReportQuery) =>
    businessRequest<PerformanceReportValue>({
      url: "/report/performance",
      method: "GET",
      params: cleanParams(params),
    }),

  getTradeReport: (params: TradeReportQuery) =>
    businessRequest<TradeReportValue>({
      url: "/report/trade",
      method: "GET",
      params: cleanParams(params),
    }),

  getSettlementDashboard: (adminId?: number | string) =>
    businessRequest<SettlementDashboardValue>({
      url: "/admin/settlement/dashboard",
      method: "GET",
      params: cleanParams({ adminId }),
    }),

  listSettlementCommissionStatements: (params: SettlementCommissionStatementQuery) =>
    businessRequest<SettlementCommissionStatementListValue>({
      url: "/admin/affinex/commissionStatement",
      method: "GET",
      params: cleanParams({
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        statementId: params.statementId,
        settlementId: params.settlementId,
        affiliateCode: params.affiliateCode,
        referralCode: params.referralCode,
        affiliateName: params.affiliateName,
        email: params.email,
        ownerName: params.ownerName,
        status: params.status,
        periodStartDateFrom: params.periodStartDateFrom,
        periodStartDateTo: params.periodStartDateTo,
        periodEndDateFrom: params.periodEndDateFrom,
        periodEndDateTo: params.periodEndDateTo,
        applicationTimeFrom: params.applicationTimeFrom,
        applicationTimeTo: params.applicationTimeTo,
        auditTimeFrom: params.auditTimeFrom,
        auditTimeTo: params.auditTimeTo,
        settlementTimeFrom: params.settlementTimeFrom,
        settlementTimeTo: params.settlementTimeTo,
        payableAmountMin: params.payableAmountMin,
        payableAmountMax: params.payableAmountMax,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        trafficApprovedBy: params.trafficApprovedBy,
      }),
      paramsSerializer: { serialize: repeatArrayParams },
    }),

  getSettlementCommissionStatementDetail: (statementId: number | string) =>
    businessRequest<SettlementCommissionStatementRow>({
      url: "/admin/affinex/getCommissionStatementDetail",
      method: "GET",
      params: cleanParams({ statementId }),
    }),

  listSettlementCommissionStatementItems: (params: SettlementCommissionStatementItemPageQuery) =>
    businessRequest<SettlementCommissionStatementItemPageValue>({
      url: "/admin/affinex/getCommissionStatementItemPage",
      method: "GET",
      params: cleanParams({
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        statementId: params.statementId,
        paymentId: params.paymentId,
        search: params.search,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        trafficApprovedBy: params.trafficApprovedBy,
      }),
    }),

  listSettlementTransactionRecords: (params: SettlementTransactionRecordQuery) =>
    businessRequest<SettlementTransactionRecordListValue>({
      url: "/admin/affinex/customerTrade",
      method: "GET",
      params: cleanParams({
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        customerId: params.customerId,
        spAccount: params.spAccount,
        affiliateCode: params.affiliateCode,
        referralCode: params.referralCode,
        affiliateName: params.affiliateName,
        email: params.email,
        ownerName: params.ownerName,
        orderNo: params.orderNo,
        orderId: params.orderId,
        symbolCode: params.symbolCode,
        symbolType: params.symbolType,
        orderType: params.orderType,
        orderStatus: params.orderStatus,
        openSystem: params.openSystem,
        currency: params.currency,
        openTimeFrom: params.openTimeFrom,
        openTimeTo: params.openTimeTo,
        closeTimeFrom: params.closeTimeFrom,
        closeTimeTo: params.closeTimeTo,
        openValueUsdMin: params.openValueUsdMin,
        openValueUsdMax: params.openValueUsdMax,
        profitMin: params.profitMin,
        profitMax: params.profitMax,
        orderSpreadAwardUsdMin: params.orderSpreadAwardUsdMin,
        orderSpreadAwardUsdMax: params.orderSpreadAwardUsdMax,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        trafficApprovedBy: params.trafficApprovedBy,
      }),
      paramsSerializer: { serialize: repeatArrayParams },
    }),

  listSettlementUserCommissions: (params: SettlementUserCommissionQuery) =>
    businessRequest<SettlementUserCommissionListValue>({
      url: "/admin/affinex/userCommission",
      method: "GET",
      params: buildSettlementUserCommissionParams(params),
      paramsSerializer: { serialize: repeatArrayParams },
    }),

  exportSettlementUserCommissions: (
    params: SettlementUserCommissionQuery,
    options?: {
      includePagination?: boolean;
      uploadType: SettlementExportUploadType;
      signal?: AbortSignal;
    },
  ) =>
    downloadAuthenticatedExportFile({
      url: "/admin/affinex/export/userCommission",
      method: "GET",
      params: buildSettlementUserCommissionParams(params, options),
      paramsSerializer: { serialize: repeatArrayParams },
      signal: options?.signal,
    }),

  listSettlementStatements: async (params: SettlementStatementQuery) => {
    const result = await businessRequest<{
      total?: number;
      paymentHistoryDetails?: SettlementStatementListValue["items"];
    }>({
      url: "/payment/history/details_admin",
      method: "GET",
      params: cleanParams({
        affiliateId: params.affiliateId,
        name: params.name,
        trafficApprovedBy: params.trafficApprovedBy,
        status: params.status,
        dateRange: params.dateRange,
        currentPage: params.currentPage ?? 1,
        pageSize: params.pageSize ?? 20,
        startDate: params.startDate,
        endDate: params.endDate,
        paymentId: params.paymentId,
        periodStartDate: params.periodStartDate,
        periodEndDate: params.periodEndDate,
        paymentSummaryId: params.paymentSummaryId,
        includeNotWithdraw: params.includeNotWithdraw,
      }),
    });

    const rawItems = result.value.paymentHistoryDetails ?? [];
    const summaryRow = rawItems.find((item) => String(item.affiliateId ?? "").toUpperCase() === "TOTAL");

    return {
      ...result,
      value: {
        total: Number(result.value.total ?? 0),
        items: rawItems.filter((item) => String(item.affiliateId ?? "").toUpperCase() !== "TOTAL"),
        summaryAmount: summaryRow?.paidAmount,
      } satisfies SettlementStatementListValue,
    };
  },

  getSettlementStatementCommissions: (params: {
    paymentId: number | string;
    page?: number | string;
    pageSize?: number | string;
  }) =>
    businessRequest<SettlementPaymentCommissionValue>({
      url: "/payment/commissions_admin",
      method: "GET",
      params: cleanParams({
        paymentId: params.paymentId,
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 50,
      }),
    }),

  updateSettlementStatement: (payload: SettlementUpdateStatementPayload) =>
    businessRequest<{ success?: boolean; errCode?: number; message?: string }>({
      url: "/payment/history/admin",
      method: "PUT",
      data: payload,
    }),

  listSettlementPaymentSummaries: async (params: SettlementPaymentSummaryQuery) => {
    const result = await businessRequest<{
      total?: number;
      items?: SettlementPaymentSummaryRow[];
      paymentSummary?: SettlementPaymentSummaryRow[];
      summary?: {
        totalPayableAmount?: string;
        pendingReviewPayableAmount?: string;
        paidPayableAmount?: string;
        unpaidPayableAmount?: string;
        amountPayableSum?: string;
      };
    }>({
      url: "/admin/payment_summary",
      method: "GET",
      params: cleanParams({
        id: params.id,
        country: params.country,
        affiliateId: params.affiliateId,
        affiliateCode: params.affiliateCode,
        referralCode: params.referralCode,
        mail: params.mail,
        ownerId: params.ownerId,
        status: params.status,
        dateRange: params.dateRange,
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        startDate: params.startDate,
        endDate: params.endDate,
        trafficApprovedBy: params.trafficApprovedBy,
      }),
    });

    const rawItems = (result.value.items ?? result.value.paymentSummary ?? []).map((item) =>
      normalizeSettlementPaymentSummaryRow(item),
    );
    const summaryRow = rawItems.find((item) => String(item.affiliateId ?? "").toUpperCase() === "TOTAL");
    const normalizedItems =
      result.value.items == null
        ? rawItems.filter((item) => String(item.affiliateId ?? "").toUpperCase() !== "TOTAL")
        : rawItems;
    const summaryAmount =
      result.value.summary?.totalPayableAmount ??
      result.value.summary?.amountPayableSum ??
      summaryRow?.payableAmount;
    const summary =
      result.value.summary == null && !summaryAmount
        ? undefined
        : {
            totalPayableAmount: result.value.summary?.totalPayableAmount ?? summaryAmount,
            pendingReviewPayableAmount: result.value.summary?.pendingReviewPayableAmount,
            paidPayableAmount: result.value.summary?.paidPayableAmount,
            unpaidPayableAmount: result.value.summary?.unpaidPayableAmount,
          };

    return {
      ...result,
      value: {
        total: Number(result.value.total ?? 0),
        items: normalizedItems,
        summary,
        summaryAmount,
      } satisfies SettlementPaymentSummaryListValue,
    };
  },

  getSettlementPaymentSummaryInfo: async (id: number | string) => {
    const result = await businessRequest<SettlementPaymentSummaryRow>({
      url: "/admin/payment_summary_info",
      method: "GET",
      params: { id },
    });

    return {
      ...result,
      value: normalizeSettlementPaymentSummaryRow(result.value ?? {}),
    };
  },

  createSettlementPaymentSummary: (payload: SettlementCreatePaymentSummaryPayload) =>
    businessRequest<SettlementCreatePaymentSummaryValue>({
      url: "/admin/affinex/createPaymentSummary",
      method: "POST",
      data: (() => {
        const paymentFiles = normalizeSettlementPaymentFiles(payload.paymentFile);

        return cleanParams({
          paymentIds: payload.paymentIds
            .map((id) => Number(id))
            .filter((id) => Number.isInteger(id) && id > 0),
          adjustmentsAmount: String(payload.adjustmentsAmount ?? "").trim() || "0",
          note: String(payload.note ?? "").trim(),
          paymentMethods: String(payload.paymentMethods ?? "").trim(),
          paymentFile: paymentFiles.length > 0 ? paymentFiles : undefined,
        });
      })(),
    }),

  mergeSettlementPaymentSummary: (paymentIds: Array<number | string>, adminId?: number | string) =>
    businessRequest<{ success?: boolean; code?: number; message?: string }>({
      url: "/admin/payment_summary",
      method: "POST",
      data: {
        paymentIds: paymentIds.join(","),
        adminId,
      },
    }),

  updateSettlementPaymentSummary: (payload: SettlementUpdatePaymentSummaryPayload) =>
    businessRequest<{ success?: boolean; code?: number; message?: string }>({
      url: "/admin/payment_summary",
      method: "PUT",
      data: cleanParams({
        ...payload,
        paymentFile: Object.prototype.hasOwnProperty.call(payload, "paymentFile")
          ? normalizeSettlementPaymentFiles(payload.paymentFile)
          : undefined,
      }),
    }),

  uploadAdminFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const result = await businessRequest<AdminUploadedFile[]>({
      url: "/resource-api/op/resource/v1/file/upload",
      method: "POST",
      data: formData,
    });

    return {
      ...result,
      value: (result.value ?? [])[0] ?? null,
    };
  },
};
