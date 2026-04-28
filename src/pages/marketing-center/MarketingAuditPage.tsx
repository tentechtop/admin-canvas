import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { contentTypeOptions } from "@/features/marketing-center/config";
import {
  useMarketingOperationLogs,
  useMarketingReviews,
} from "@/features/marketing-center/hooks";
import {
  EmptyState,
  MarketingPageShell,
  PaginationBar,
  PayloadDialog,
  ReviewDecisionBadge,
} from "@/features/marketing-center/shared";
import { formatMarketingJson, textOrDash } from "@/features/marketing-center/utils";
import type { MarketingAuditQuery } from "@/types/marketing-center";

const defaultLogsQuery: MarketingAuditQuery = {
  page: 1,
  pageSize: 10,
  contentType: undefined,
  contentId: undefined,
};

const defaultReviewQuery: MarketingAuditQuery = {
  page: 1,
  pageSize: 10,
  contentType: undefined,
  contentId: undefined,
};

const MarketingAuditPage = () => {
  const queryClient = useQueryClient();
  const [logsQuery, setLogsQuery] = useState<MarketingAuditQuery>(defaultLogsQuery);
  const [reviewQuery, setReviewQuery] = useState<MarketingAuditQuery>(defaultReviewQuery);
  const [payloadDialog, setPayloadDialog] = useState({
    open: false,
    title: "",
    content: "",
  });

  const logsResult = useMarketingOperationLogs(logsQuery);
  const reviewsResult = useMarketingReviews(reviewQuery);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["marketing-center", "operation-logs"] });
    await queryClient.invalidateQueries({ queryKey: ["marketing-center", "reviews"] });
  }

  return (
    <MarketingPageShell
      title="Operation Audit"
      description="Inspect two backend audit streams: operation logs for content actions and review records for compliance decisions."
      actions={
        <Button type="button" variant="outline" onClick={() => void refresh()}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      }
    >
      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList className="grid h-auto grid-cols-2 rounded-2xl p-1">
          <TabsTrigger value="logs">Operation Logs</TabsTrigger>
          <TabsTrigger value="reviews">Review Records</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Operation logs</CardTitle>
              <CardDescription>
                Filter by content type and content ID to inspect create, update, submit, publish, and offline actions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2 text-sm">
                  <span className="font-medium">Content type</span>
                  <Select
                    value={logsQuery.contentType ?? "__all__"}
                    onValueChange={(value) =>
                      setLogsQuery((current) => ({
                        ...current,
                        contentType: value === "__all__" ? undefined : (value as MarketingAuditQuery["contentType"]),
                        page: 1,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All content types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All content types</SelectItem>
                      {contentTypeOptions.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-medium">Content ID</span>
                  <Input
                    type="number"
                    value={logsQuery.contentId ?? ""}
                    onChange={(event) =>
                      setLogsQuery((current) => ({
                        ...current,
                        contentId: Number(event.target.value) || undefined,
                        page: 1,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-medium">Page size</span>
                  <Select
                    value={String(logsQuery.pageSize)}
                    onValueChange={(value) =>
                      setLogsQuery((current) => ({
                        ...current,
                        pageSize: Number(value),
                        page: 1,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Page size" />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 50].map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              </div>

              {logsResult.isLoading ? (
                <div className="flex h-52 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading operation logs...
                </div>
              ) : (logsResult.data?.items ?? []).length === 0 ? (
                <EmptyState title="No operation logs" description="No operation logs matched the current filters." />
              ) : (
                <>
                  <div className="overflow-x-auto rounded-2xl border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Content Type</TableHead>
                          <TableHead>Content ID</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Operator</TableHead>
                          <TableHead>Detail</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(logsResult.data?.items ?? []).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{textOrDash(item.contentType)}</TableCell>
                            <TableCell>{textOrDash(item.contentId)}</TableCell>
                            <TableCell>{textOrDash(item.action)}</TableCell>
                            <TableCell>{textOrDash(item.operatorName || item.operatorId)}</TableCell>
                            <TableCell className="max-w-[280px]">
                              <div className="space-y-2">
                                <div className="line-clamp-2 whitespace-pre-wrap break-words text-sm">
                                  {textOrDash(item.detail)}
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setPayloadDialog({
                                      open: true,
                                      title: `Operation log #${item.id}`,
                                      content: formatMarketingJson(item.detail),
                                    })
                                  }
                                >
                                  View detail
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>{textOrDash(item.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <PaginationBar
                    page={logsQuery.page}
                    pageSize={logsQuery.pageSize}
                    total={logsResult.data?.total ?? 0}
                    loading={logsResult.isFetching}
                    onPrev={() =>
                      setLogsQuery((current) => ({
                        ...current,
                        page: Math.max(1, current.page - 1),
                      }))
                    }
                    onNext={() =>
                      setLogsQuery((current) => ({
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

        <TabsContent value="reviews" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Review records</CardTitle>
              <CardDescription>
                Filter by content type and content ID to inspect review decisions and reviewer comments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2 text-sm">
                  <span className="font-medium">Content type</span>
                  <Select
                    value={reviewQuery.contentType ?? "__all__"}
                    onValueChange={(value) =>
                      setReviewQuery((current) => ({
                        ...current,
                        contentType: value === "__all__" ? undefined : (value as MarketingAuditQuery["contentType"]),
                        page: 1,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All content types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All content types</SelectItem>
                      {contentTypeOptions.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-medium">Content ID</span>
                  <Input
                    type="number"
                    value={reviewQuery.contentId ?? ""}
                    onChange={(event) =>
                      setReviewQuery((current) => ({
                        ...current,
                        contentId: Number(event.target.value) || undefined,
                        page: 1,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-medium">Page size</span>
                  <Select
                    value={String(reviewQuery.pageSize)}
                    onValueChange={(value) =>
                      setReviewQuery((current) => ({
                        ...current,
                        pageSize: Number(value),
                        page: 1,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Page size" />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 50].map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              </div>

              {reviewsResult.isLoading ? (
                <div className="flex h-52 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading review records...
                </div>
              ) : (reviewsResult.data?.items ?? []).length === 0 ? (
                <EmptyState title="No review records" description="No review records matched the current filters." />
              ) : (
                <>
                  <div className="overflow-x-auto rounded-2xl border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Content Type</TableHead>
                          <TableHead>Content ID</TableHead>
                          <TableHead>Decision</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Reviewer</TableHead>
                          <TableHead>Comment</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(reviewsResult.data?.items ?? []).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{textOrDash(item.contentType)}</TableCell>
                            <TableCell>{textOrDash(item.contentId)}</TableCell>
                            <TableCell>
                              <ReviewDecisionBadge decision={item.decision} />
                            </TableCell>
                            <TableCell>{textOrDash(item.fromStatus)}</TableCell>
                            <TableCell>{textOrDash(item.toStatus)}</TableCell>
                            <TableCell>{textOrDash(item.reviewerName || item.reviewerId)}</TableCell>
                            <TableCell className="max-w-[280px] whitespace-pre-wrap break-words">
                              {textOrDash(item.comment)}
                            </TableCell>
                            <TableCell>{textOrDash(item.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <PaginationBar
                    page={reviewQuery.page}
                    pageSize={reviewQuery.pageSize}
                    total={reviewsResult.data?.total ?? 0}
                    loading={reviewsResult.isFetching}
                    onPrev={() =>
                      setReviewQuery((current) => ({
                        ...current,
                        page: Math.max(1, current.page - 1),
                      }))
                    }
                    onNext={() =>
                      setReviewQuery((current) => ({
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

      <PayloadDialog
        open={payloadDialog.open}
        title={payloadDialog.title}
        content={payloadDialog.content}
        onOpenChange={(open) => {
          if (!open) {
            setPayloadDialog({
              open: false,
              title: "",
              content: "",
            });
          }
        }}
      />
    </MarketingPageShell>
  );
};

export default MarketingAuditPage;
