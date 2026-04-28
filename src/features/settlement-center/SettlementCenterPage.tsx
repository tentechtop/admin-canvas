import {
  ConfigView,
  DashboardView,
  ExceptionView,
  HistoryView,
  PaymentExecutionView,
  PaymentSummaryView,
  StatementView,
  WithdrawalReviewView,
} from "@/features/settlement-center/views";

export type SettlementPageView =
  | "dashboard"
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
