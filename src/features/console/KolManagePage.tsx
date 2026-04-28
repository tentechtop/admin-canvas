import { useState } from "react";
import {
  BarChart3,
  List,
  Loader2,
  RefreshCcw,
  Search,
  Users,
} from "lucide-react";
import { affiliateConsoleApi } from "@/api/affiliate-console";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { previewToText, type ApiCallPreview, BusinessHttpError } from "@/lib/business-http";
import type { KolPerformanceListValue, KolUserListValue } from "@/types/affiliate-console";
import { EmptyState, Field, JsonPreviewCard, PageIntro, StatCard } from "@/features/console/shared";
import { prettyJson } from "@/features/console/shared-utils";
import { toast } from "sonner";

function previewFromError(error: unknown): { request: string; response: string } {
  if (error instanceof BusinessHttpError) {
    return previewToText(error.preview);
  }

  return {
    request: prettyJson({ error: "Unknown request error" }),
    response: prettyJson({
      message: error instanceof Error ? error.message : String(error),
    }),
  };
}

const defaultListQuery = {
  adminId: "",
  affiliateCode: "",
  affiliateName: "",
  affiliateMail: "",
  medium: "",
  page: "1",
  pageSize: "20",
};

const defaultStatsQuery = {
  adminId: "",
  affiliateCode: "",
  startDate: "",
  endDate: "",
  email: "",
  owner: "",
  page: "1",
  pageSize: "20",
};

const KolManagePage = () => {
  const [activeTab, setActiveTab] = useState("list");
  const [listQuery, setListQuery] = useState(defaultListQuery);
  const [statsQuery, setStatsQuery] = useState(defaultStatsQuery);

  const [listData, setListData] = useState<KolUserListValue>({});
  const [statsData, setStatsData] = useState<KolPerformanceListValue>({});
  const [listPreview, setListPreview] = useState<ApiCallPreview | null>(null);
  const [statsPreview, setStatsPreview] = useState<ApiCallPreview | null>(null);

  const [loadingList, setLoadingList] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  async function loadList(showToast = true) {
    setLoadingList(true);
    try {
      const result = await affiliateConsoleApi.listKolUsers(listQuery);
      setListData(result.value ?? {});
      setListPreview(result.preview);
      if (showToast) {
        toast.success(
          `Loaded ${result.value.total ?? (result.value.userInfo ?? []).length} KOL records.`,
        );
      }
    } catch (error) {
      const preview = previewFromError(error);
      setListPreview({
        request: JSON.parse(preview.request),
        response: JSON.parse(preview.response),
      });
    } finally {
      setLoadingList(false);
    }
  }

  async function loadStats(showToast = true) {
    setLoadingStats(true);
    try {
      const result = await affiliateConsoleApi.listKolPerformance(statsQuery);
      setStatsData(result.value ?? {});
      setStatsPreview(result.preview);
      if (showToast) {
        toast.success(
          `Loaded ${result.value.total ?? (result.value.kolPerformance ?? []).length} KOL statistics rows.`,
        );
      }
    } catch (error) {
      const preview = previewFromError(error);
      setStatsPreview({
        request: JSON.parse(preview.request),
        response: JSON.parse(preview.response),
      });
    } finally {
      setLoadingStats(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageIntro
        title="KOL Management"
        description="Manage KOL list queries and statistics queries in the authenticated admin session. These views use /kol_user/list and /kol_performance/admin directly."
        actions={
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              activeTab === "list" ? void loadList(false) : void loadStats(false)
            }
            disabled={loadingList || loadingStats}
          >
            {loadingList || loadingStats ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            Refresh Current Tab
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">
            <List className="mr-2 h-4 w-4" />
            KOL List
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3 className="mr-2 h-4 w-4" />
            KOL Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Total KOL Rows" value={listData.total ?? 0} />
            <StatCard label="Current Page" value={listQuery.page} />
            <StatCard label="Page Size" value={listQuery.pageSize} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">KOL list filters</CardTitle>
              <CardDescription>Query `/kol_user/list` directly.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <Field label="adminId">
                <Input
                  value={listQuery.adminId}
                  onChange={(event) =>
                    setListQuery((prev) => ({ ...prev, adminId: event.target.value }))
                  }
                />
              </Field>
              <Field label="affiliateCode">
                <Input
                  value={listQuery.affiliateCode}
                  onChange={(event) =>
                    setListQuery((prev) => ({ ...prev, affiliateCode: event.target.value }))
                  }
                />
              </Field>
              <Field label="affiliateName">
                <Input
                  value={listQuery.affiliateName}
                  onChange={(event) =>
                    setListQuery((prev) => ({ ...prev, affiliateName: event.target.value }))
                  }
                />
              </Field>
              <Field label="affiliateMail">
                <Input
                  value={listQuery.affiliateMail}
                  onChange={(event) =>
                    setListQuery((prev) => ({ ...prev, affiliateMail: event.target.value }))
                  }
                />
              </Field>
              <Field label="medium">
                <Input
                  value={listQuery.medium}
                  onChange={(event) =>
                    setListQuery((prev) => ({ ...prev, medium: event.target.value }))
                  }
                />
              </Field>
              <Field label="page">
                <Input
                  value={listQuery.page}
                  onChange={(event) =>
                    setListQuery((prev) => ({ ...prev, page: event.target.value }))
                  }
                />
              </Field>
              <Field label="pageSize">
                <Input
                  value={listQuery.pageSize}
                  onChange={(event) =>
                    setListQuery((prev) => ({ ...prev, pageSize: event.target.value }))
                  }
                />
              </Field>
              <div className="flex items-end gap-2">
                <Button type="button" onClick={() => void loadList()} disabled={loadingList}>
                  {loadingList ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Search
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setListQuery(defaultListQuery)}
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">KOL list result</CardTitle>
            </CardHeader>
            <CardContent>
              {(listData.userInfo ?? []).length === 0 ? (
                <EmptyState
                  title="No KOL list data"
                  description="Run a query to load KOL list results."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Affiliate Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Medium</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Live Account</TableHead>
                      <TableHead>Registration Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(listData.userInfo ?? []).map((row, index) => (
                      <TableRow
                        key={`${row.affiliateCode ?? "kol"}-${row.liveAccount ?? index}`}
                      >
                        <TableCell>{String(row.affiliateCode ?? "-")}</TableCell>
                        <TableCell>{String(row.affiliateName ?? "-")}</TableCell>
                        <TableCell>{String(row.affiliateMail ?? "-")}</TableCell>
                        <TableCell>{String(row.medium ?? "-")}</TableCell>
                        <TableCell>{String(row.customerCountry ?? "-")}</TableCell>
                        <TableCell>{String(row.liveAccount ?? "-")}</TableCell>
                        <TableCell>{String(row.registrationDate ?? "-")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <JsonPreviewCard
              title="KOL list request preview"
              value={listPreview ? prettyJson(listPreview.request) : "{}"}
            />
            <JsonPreviewCard
              title="KOL list response preview"
              value={listPreview ? prettyJson(listPreview.response) : "{}"}
            />
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Total Stats Rows" value={statsData.total ?? 0} />
            <StatCard label="Current Page" value={statsQuery.page} />
            <StatCard label="Page Size" value={statsQuery.pageSize} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">KOL statistics filters</CardTitle>
              <CardDescription>Query `/kol_performance/admin` directly.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <Field label="adminId">
                <Input
                  value={statsQuery.adminId}
                  onChange={(event) =>
                    setStatsQuery((prev) => ({ ...prev, adminId: event.target.value }))
                  }
                />
              </Field>
              <Field label="affiliateCode">
                <Input
                  value={statsQuery.affiliateCode}
                  onChange={(event) =>
                    setStatsQuery((prev) => ({ ...prev, affiliateCode: event.target.value }))
                  }
                />
              </Field>
              <Field label="startDate">
                <Input
                  value={statsQuery.startDate}
                  onChange={(event) =>
                    setStatsQuery((prev) => ({ ...prev, startDate: event.target.value }))
                  }
                  placeholder="2026-04-01"
                />
              </Field>
              <Field label="endDate">
                <Input
                  value={statsQuery.endDate}
                  onChange={(event) =>
                    setStatsQuery((prev) => ({ ...prev, endDate: event.target.value }))
                  }
                  placeholder="2026-04-30"
                />
              </Field>
              <Field label="email">
                <Input
                  value={statsQuery.email}
                  onChange={(event) =>
                    setStatsQuery((prev) => ({ ...prev, email: event.target.value }))
                  }
                />
              </Field>
              <Field label="owner">
                <Input
                  value={statsQuery.owner}
                  onChange={(event) =>
                    setStatsQuery((prev) => ({ ...prev, owner: event.target.value }))
                  }
                />
              </Field>
              <Field label="page">
                <Input
                  value={statsQuery.page}
                  onChange={(event) =>
                    setStatsQuery((prev) => ({ ...prev, page: event.target.value }))
                  }
                />
              </Field>
              <Field label="pageSize">
                <Input
                  value={statsQuery.pageSize}
                  onChange={(event) =>
                    setStatsQuery((prev) => ({ ...prev, pageSize: event.target.value }))
                  }
                />
              </Field>
              <div className="flex items-end gap-2">
                <Button type="button" onClick={() => void loadStats()} disabled={loadingStats}>
                  {loadingStats ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Users className="h-4 w-4" />
                  )}
                  Search
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStatsQuery(defaultStatsQuery)}
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">KOL statistics result</CardTitle>
            </CardHeader>
            <CardContent>
              {(statsData.kolPerformance ?? []).length === 0 ? (
                <EmptyState
                  title="No statistics data"
                  description="Run a query to load KOL statistics results."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Affiliate Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Registrations</TableHead>
                      <TableHead>Qualified Traders</TableHead>
                      <TableHead>Total User</TableHead>
                      <TableHead>Commission</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(statsData.kolPerformance ?? []).map((row, index) => (
                      <TableRow
                        key={`${row.affiliateCode ?? "stats"}-${row.email ?? index}`}
                      >
                        <TableCell>{String(row.affiliateCode ?? "-")}</TableCell>
                        <TableCell>{String((row as { name?: unknown }).name ?? "-")}</TableCell>
                        <TableCell>{String(row.email ?? "-")}</TableCell>
                        <TableCell>{String(row.owner ?? "-")}</TableCell>
                        <TableCell>{String((row as { registrations?: unknown }).registrations ?? "-")}</TableCell>
                        <TableCell>{String((row as { qualifiedTraders?: unknown }).qualifiedTraders ?? "-")}</TableCell>
                        <TableCell>{String((row as { totalUser?: unknown }).totalUser ?? "-")}</TableCell>
                        <TableCell>{String((row as { commission?: unknown }).commission ?? "-")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <JsonPreviewCard
              title="KOL stats request preview"
              value={statsPreview ? prettyJson(statsPreview.request) : "{}"}
            />
            <JsonPreviewCard
              title="KOL stats response preview"
              value={statsPreview ? prettyJson(statsPreview.response) : "{}"}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KolManagePage;
