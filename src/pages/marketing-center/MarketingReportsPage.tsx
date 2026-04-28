import { useState } from "react";
import { AlertCircle, Loader2, RefreshCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useMarketingActivitiesList,
  useMarketingMaterialsList,
  useMarketingWorkbenchStats,
} from "@/features/marketing-center/hooks";
import {
  EmptyState,
  MarketingPageShell,
  MarketingStatusBadge,
  PaginationBar,
  StatCard,
} from "@/features/marketing-center/shared";
import { joinTaxonomyNames, textOrDash } from "@/features/marketing-center/utils";
import type { MarketingActivitiesQuery, MarketingMaterialsQuery } from "@/types/marketing-center";

const materialSnapshotQuery: MarketingMaterialsQuery = {
  page: 1,
  pageSize: 10,
  status: "CONTENT_STATUS_PUBLISHED",
  keyword: "",
};

const activitySnapshotQuery: MarketingActivitiesQuery = {
  page: 1,
  pageSize: 10,
  status: "CONTENT_STATUS_PUBLISHED",
  keyword: "",
};

const MarketingReportsPage = () => {
  const [materialsQuery, setMaterialsQuery] = useState<MarketingMaterialsQuery>(materialSnapshotQuery);
  const [activitiesQuery, setActivitiesQuery] = useState<MarketingActivitiesQuery>(activitySnapshotQuery);

  const stats = useMarketingWorkbenchStats();
  const materialSnapshot = useMarketingMaterialsList(materialsQuery);
  const activitySnapshot = useMarketingActivitiesList(activitiesQuery);

  async function refresh() {
    await Promise.all([
      stats.refetch(),
      materialSnapshot.refetch(),
      activitySnapshot.refetch(),
    ]);
  }

  return (
    <MarketingPageShell
      title="Data Reports"
      description="A deliverable first version of marketing reporting that stays honest about backend limits: publish snapshots and aggregate list totals are available, but deeper click, download, and conversion reporting still needs dedicated backend APIs."
      actions={
        <Button
          type="button"
          variant="outline"
          onClick={() => void refresh()}
          disabled={stats.isFetching || materialSnapshot.isFetching || activitySnapshot.isFetching}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      }
    >
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Backend reporting gap</AlertTitle>
        <AlertDescription>
          Click-through, download, and conversion analytics are not rendered here because the backend does not currently provide a dedicated marketing report aggregation API for those metrics.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Draft Materials" value={stats.isLoading || stats.isError ? "-" : (stats.materials?.draft ?? 0)} />
        <StatCard label="Pending Materials" value={stats.isLoading || stats.isError ? "-" : (stats.materials?.pendingReview ?? 0)} />
        <StatCard label="Published Materials" value={stats.isLoading || stats.isError ? "-" : (stats.materials?.published ?? 0)} />
        <StatCard label="Rejected Materials" value={stats.isLoading || stats.isError ? "-" : (stats.materials?.rejected ?? 0)} />
        <StatCard label="Offline Materials" value={stats.isLoading || stats.isError ? "-" : (stats.materials?.offline ?? 0)} />
        <StatCard label="Draft Activities" value={stats.isLoading || stats.isError ? "-" : (stats.activities?.draft ?? 0)} />
        <StatCard label="Pending Activities" value={stats.isLoading || stats.isError ? "-" : (stats.activities?.pendingReview ?? 0)} />
        <StatCard label="Published Activities" value={stats.isLoading || stats.isError ? "-" : (stats.activities?.published ?? 0)} />
        <StatCard label="Rejected Activities" value={stats.isLoading || stats.isError ? "-" : (stats.activities?.rejected ?? 0)} />
        <StatCard label="Offline Activities" value={stats.isLoading || stats.isError ? "-" : (stats.activities?.offline ?? 0)} />
      </div>

      <Tabs defaultValue="materials" className="space-y-4">
        <TabsList className="grid h-auto grid-cols-2 rounded-2xl p-1">
          <TabsTrigger value="materials">Material Publish Snapshot</TabsTrigger>
          <TabsTrigger value="activities">Activity Publish Snapshot</TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Published materials</CardTitle>
              <CardDescription>
                Snapshot view of currently published materials from the material list API.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {materialSnapshot.isLoading ? (
                <div className="flex h-52 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading published materials...
                </div>
              ) : (materialSnapshot.data?.items ?? []).length === 0 ? (
                <EmptyState
                  title="No published materials"
                  description="The material publish snapshot is currently empty."
                />
              ) : (
                <>
                  <div className="overflow-x-auto rounded-2xl border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Language</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Channels</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Published</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(materialSnapshot.data?.items ?? []).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{textOrDash(item.title)}</TableCell>
                            <TableCell>{textOrDash(item.materialType)}</TableCell>
                            <TableCell>{textOrDash(item.language?.name)}</TableCell>
                            <TableCell>{textOrDash(item.category?.name)}</TableCell>
                            <TableCell>{joinTaxonomyNames(item.channels)}</TableCell>
                            <TableCell>
                              <MarketingStatusBadge status={item.status} />
                            </TableCell>
                            <TableCell>{textOrDash(item.publishedAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <PaginationBar
                    page={materialsQuery.page}
                    pageSize={materialsQuery.pageSize}
                    total={materialSnapshot.data?.total ?? 0}
                    loading={materialSnapshot.isFetching}
                    onPrev={() =>
                      setMaterialsQuery((current) => ({
                        ...current,
                        page: Math.max(1, current.page - 1),
                      }))
                    }
                    onNext={() =>
                      setMaterialsQuery((current) => ({
                        ...current,
                        page: current.page + 1,
                      }))
                    }
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Published activities</CardTitle>
              <CardDescription>
                Snapshot view of currently published activities from the activity list API.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activitySnapshot.isLoading ? (
                <div className="flex h-52 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading published activities...
                </div>
              ) : (activitySnapshot.data?.items ?? []).length === 0 ? (
                <EmptyState
                  title="No published activities"
                  description="The activity publish snapshot is currently empty."
                />
              ) : (
                <>
                  <div className="overflow-x-auto rounded-2xl border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Language</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Carousel</TableHead>
                          <TableHead>Channels</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Published</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(activitySnapshot.data?.items ?? []).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{textOrDash(item.title)}</TableCell>
                            <TableCell>{textOrDash(item.language?.name)}</TableCell>
                            <TableCell>{textOrDash(item.category?.name)}</TableCell>
                            <TableCell>{item.carousel ? "Yes" : "No"}</TableCell>
                            <TableCell>{joinTaxonomyNames(item.channels)}</TableCell>
                            <TableCell>
                              <MarketingStatusBadge status={item.status} />
                            </TableCell>
                            <TableCell>{textOrDash(item.publishedAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <PaginationBar
                    page={activitiesQuery.page}
                    pageSize={activitiesQuery.pageSize}
                    total={activitySnapshot.data?.total ?? 0}
                    loading={activitySnapshot.isFetching}
                    onPrev={() =>
                      setActivitiesQuery((current) => ({
                        ...current,
                        page: Math.max(1, current.page - 1),
                      }))
                    }
                    onNext={() =>
                      setActivitiesQuery((current) => ({
                        ...current,
                        page: current.page + 1,
                      }))
                    }
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MarketingPageShell>
  );
};

export default MarketingReportsPage;
