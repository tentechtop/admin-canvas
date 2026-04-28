import { PLATFORM_CODE } from "@/lib/http";
import { businessRequest } from "@/lib/business-http";
import type {
  AffiliateAuditListValue,
  AffiliateAuditQuery,
  AffiliateDetailWithLogsValue,
  AffiliateBdOwnerUpdatePayload,
  AffiliateCampaignListQuery,
  AffiliateCampaignListValue,
  AffiliateCommissionRateLogValue,
  AffiliateCommissionRateUpdatePayload,
  AffiliateCommissionRateUpdateResult,
  AffiliateModificationReviewPayload,
  KolKycUpdatePayload,
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
  SettlementPaymentCommissionValue,
  SettlementPaymentSummaryListValue,
  SettlementPaymentSummaryQuery,
  SettlementPaymentSummaryRow,
  SettlementStatementListValue,
  SettlementStatementQuery,
  SettlementUpdatePaymentSummaryPayload,
  SettlementUpdateStatementPayload,
  RoleDataPermissionConfig,
  RoleDataPermissionListValue,
  RoleDataPermissionSavePayload,
  TradeReportQuery,
  TradeReportValue,
} from "@/types/affiliate-console";

export const CONSOLE_PLATFORM_CODE = PLATFORM_CODE || "kol";

function cleanParams(params: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== undefined && value !== null),
  );
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
    businessRequest<AffiliateAuditListValue>({
      url: "/affiliate/list",
      method: "GET",
      params,
    }),

  listKycReviews: (params: AffiliateAuditQuery) =>
    businessRequest<AffiliateAuditListValue>({
      url: "/admin/affiliate/kycReview",
      method: "GET",
      params: cleanParams(params),
    }),

  listKolInfoStatistics: (params: AffiliateAuditQuery) =>
    businessRequest<AffiliateAuditListValue>({
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
      paymentSummary?: SettlementPaymentSummaryRow[];
    }>({
      url: "/admin/payment_summary",
      method: "GET",
      params: cleanParams({
        affiliateId: params.affiliateId,
        status: params.status,
        dateRange: params.dateRange,
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        startDate: params.startDate,
        endDate: params.endDate,
        trafficApprovedBy: params.trafficApprovedBy,
      }),
    });

    const rawItems = result.value.paymentSummary ?? [];
    const summaryRow = rawItems.find((item) => String(item.affiliateId ?? "").toUpperCase() === "TOTAL");

    return {
      ...result,
      value: {
        total: Number(result.value.total ?? 0),
        items: rawItems.filter((item) => String(item.affiliateId ?? "").toUpperCase() !== "TOTAL"),
        summaryAmount: summaryRow?.payableAmount,
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
      value: result.value ?? {},
    };
  },

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
        paymentFile: payload.paymentFile,
      }),
    }),

  uploadAdminFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const result = await businessRequest<unknown>({
      url: "/admin/files/upload",
      method: "POST",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return {
      ...result,
      value:
        ((result.envelope as { item?: AdminUploadedFile; value?: AdminUploadedFile }).item ??
          (result.envelope as { item?: AdminUploadedFile; value?: AdminUploadedFile }).value ??
          null),
    };
  },
};
