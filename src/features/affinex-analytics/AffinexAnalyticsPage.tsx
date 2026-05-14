import type { AffinexAnalyticsResourceCode } from "@/features/affinex-analytics/config";
import { getAffinexAnalyticsPageConfig } from "@/features/affinex-analytics/config";
import AnalyticsDataPage from "@/features/affinex-analytics/AnalyticsDataPage";
import DashboardConfigPage from "@/features/affinex-analytics/DashboardConfigPage";

export default function AffinexAnalyticsPage({
  resourceCode,
}: {
  resourceCode: AffinexAnalyticsResourceCode;
}) {
  const page = getAffinexAnalyticsPageConfig(resourceCode);

  if (page.kind === "dashboardConfig") {
    return <DashboardConfigPage />;
  }

  return <AnalyticsDataPage page={page} />;
}
