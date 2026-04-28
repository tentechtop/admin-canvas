import { Loader2, RefreshCcw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { marketingQuickLinks } from "@/features/marketing-center/config";
import { useMarketingWorkbenchStats } from "@/features/marketing-center/hooks";
import { EmptyState, MarketingPageShell, StatCard } from "@/features/marketing-center/shared";

const MarketingWorkbenchPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const stats = useMarketingWorkbenchStats();

  const statCards = stats.data ? (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <StatCard label="Pending Materials" value={stats.pendingMaterials} hint="Materials waiting for compliance review." />
      <StatCard label="Pending Activities" value={stats.pendingActivities} hint="Activities waiting for compliance review." />
      <StatCard label="Published Materials" value={stats.publishedMaterials} hint="Currently published materials." />
      <StatCard label="Published Activities" value={stats.publishedActivities} hint="Currently published activities." />
      <StatCard label="Rejected Materials" value={stats.rejectedMaterials} hint="Materials rejected in review." />
      <StatCard label="Rejected Activities" value={stats.rejectedActivities} hint="Activities rejected in review." />
    </div>
  ) : stats.isLoading ? (
    <Card className="shadow-sm">
      <CardContent className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading workbench summary...
      </CardContent>
    </Card>
  ) : stats.isError ? (
    <Card className="shadow-sm">
      <CardContent className="space-y-4 py-10">
        <EmptyState
          title="Workbench summary unavailable"
          description="The summary endpoint could not be loaded. Retry to request the latest material and activity counts."
        />
        <div className="flex justify-center">
          <Button type="button" variant="outline" onClick={() => void stats.refetch()} disabled={stats.isFetching}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  ) : (
    <Card className="shadow-sm">
      <CardContent className="py-10">
        <EmptyState
          title="No workbench summary"
          description="The backend returned no summary payload for the current marketing workspace."
        />
      </CardContent>
    </Card>
  );

  return (
    <MarketingPageShell
      title="Marketing Center Workbench"
      description="Central workspace for operations and compliance to manage marketing materials, activities, reviews, attribution links, and audit trails."
      actions={
        <Button
          type="button"
          variant="outline"
          onClick={() => void queryClient.invalidateQueries({ queryKey: ["marketing-center", "workbench"] })}
          disabled={stats.isFetching}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      }
    >
      {statCards}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Quick access</CardTitle>
          <CardDescription>
            Use the shortcuts below to jump directly to the main operating areas.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {marketingQuickLinks.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className="rounded-2xl border bg-muted/10 p-5 text-left transition hover:border-primary hover:bg-primary/5"
            >
              <item.icon className="h-6 w-6 text-primary" />
              <div className="mt-4 text-lg font-semibold">{item.title}</div>
              <div className="mt-2 text-sm text-muted-foreground">{item.description}</div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Suggested workflow</CardTitle>
          <CardDescription>
            The current backend state machine is draft to pending review to approved to published to offline, with rejected as the negative review branch.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          {[
            { title: "Draft", desc: "Operations create or edit content in draft." },
            { title: "Pending Review", desc: "Submit the draft to compliance review." },
            { title: "Approved & Publish", desc: "Approved content can be published or later offlined." },
            { title: "Rejected", desc: "Rejected content returns for editing before the next submission." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border bg-background p-4">
              <div className="text-sm font-semibold">{item.title}</div>
              <div className="mt-2 text-sm text-muted-foreground">{item.desc}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </MarketingPageShell>
  );
};

export default MarketingWorkbenchPage;
