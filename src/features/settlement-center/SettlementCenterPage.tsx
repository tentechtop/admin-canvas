import {
  CommissionStatementView,
  ConfigView,
  DashboardView,
  ExceptionView,
  HistoryView,
  KolCommissionView,
  PaymentExecutionView,
  PaymentSummaryView,
  StatementView,
  WithdrawalReviewView,
} from "@/features/settlement-center/views";
import { TransactionRecordsView } from "@/features/settlement-center/transaction-records";

export type SettlementPageView =
  | "dashboard"
  | "transaction-records"
  | "kol-commission"
  | "commission-statement"
  | "statement"
  | "withdrawal-review"
  | "payment-summary"
  | "payment-execution"
  | "history"
  | "exception"
  | "config";

export default function SettlementCenterPage({ view }: { view: SettlementPageView }) {
  switch (view) {
    case "dashboard":
      return <DashboardView />;
    case "transaction-records":
      return <TransactionRecordsView />;
    case "kol-commission":
      return <KolCommissionView />;
    case "commission-statement":
      return <CommissionStatementView />;
    case "statement":
      return <StatementView />;
    case "withdrawal-review":
      return <WithdrawalReviewView />;
    case "payment-summary":
      return <PaymentSummaryView />;
    case "payment-execution":
      return <PaymentExecutionView />;
    case "history":
      return <HistoryView />;
    case "exception":
      return <ExceptionView />;
    case "config":
      return <ConfigView />;
    default:
      return <DashboardView />;
  }
}
