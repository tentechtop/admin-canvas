import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { marketingCenterApi } from "@/api/marketing-center";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { marketingRoutes, marketingStatusOptions } from "@/features/marketing-center/config";
import {
  useMarketingActivitiesList,
  useMarketingMaterialsList,
  useMarketingReviews,
} from "@/features/marketing-center/hooks";
import {
  EmptyState,
  MarketingPageShell,
  MarketingStatusBadge,
  PaginationBar,
} from "@/features/marketing-center/shared";
import { textOrDash } from "@/features/marketing-center/utils";
import type {
  MarketingActivitiesQuery,
  MarketingActivity,
  MarketingContentType,
  MarketingMaterialsQuery,
  MarketingMaterial,
  MarketingReviewDecision,
} from "@/types/marketing-center";

type ReviewDialogState = {
  open: boolean;
  contentType: MarketingContentType | null;
  contentId: number;
  title: string;
  decision: MarketingReviewDecision;
  comment: string;
  submitting: boolean;
};

type HistoryDialogState = {
  open: boolean;
  contentType: MarketingContentType | null;
  contentId: number;
  title: string;
};

const defaultMaterialQuery: MarketingMaterialsQuery = {
  page: 1,
  pageSize: 10,
  status: "CONTENT_STATUS_PENDING_REVIEW",
  keyword: "",
};

const defaultActivityQuery: MarketingActivitiesQuery = {
  page: 1,
  pageSize: 10,
  status: "CONTENT_STATUS_PENDING_REVIEW",
  keyword: "",
};

const initialReviewDialogState: ReviewDialogState = {
  open: false,
  contentType: null,
  contentId: 0,
  title: "",
  decision: "REVIEW_DECISION_APPROVE",
  comment: "",
  submitting: false,
};

const initialHistoryDialogState: HistoryDialogState = {
  open: false,
  contentType: null,
  contentId: 0,
  title: "",
};

const MarketingComplianceReviewPage = () => {
  const queryClient = useQueryClient();
  const [materialQuery, setMaterialQuery] = useState<MarketingMaterialsQuery>(defaultMaterialQuery);
  const [activityQuery, setActivityQuery] = useState<MarketingActivitiesQuery>(defaultActivityQuery);
  const [reviewDialog, setReviewDialog] = useState<ReviewDialogState>(initialReviewDialogState);
  const [historyDialog, setHistoryDialog] = useState<HistoryDialogState>(initialHistoryDialogState);

  const materialsResult = useMarketingMaterialsList(materialQuery);
  const activitiesResult = useMarketingActivitiesList(activityQuery);
  const historyQuery = useMarketingReviews({
    page: 1,
    pageSize: 20,
    contentType: historyDialog.contentType ?? undefined,
    contentId: historyDialog.contentId || undefined,
  });

  const historyRows = historyQuery.data?.items ?? [];

  const reviewTitle = useMemo(() => {
    const decisionText =
      reviewDialog.decision === "REVIEW_DECISION_REJECT" ? "Reject" : "Approve";
    return `${decisionText} content`;
  }, [reviewDialog.decision]);

  async function refreshAll() {
    await queryClient.invalidateQueries({ queryKey: ["marketing-center", "materials"] });
    await queryClient.invalidateQueries({ queryKey: ["marketing-center", "activities"] });
    await queryClient.invalidateQueries({ queryKey: ["marketing-center", "reviews"] });
  }

  function openReviewDialog(
    contentType: MarketingContentType,
    item: MarketingMaterial | MarketingActivity,
    decision: MarketingReviewDecision,
  ) {
    setReviewDialog({
      open: true,
      contentType,
      contentId: Number(item.id ?? 0),
      title: String(item.title ?? ""),
      decision,
      comment: "",
      submitting: false,
    });
  }

  async function submitReview() {
    if (!reviewDialog.contentType || reviewDialog.contentId <= 0) {
      return;
    }
    if (
      reviewDialog.decision === "REVIEW_DECISION_REJECT" &&
      !reviewDialog.comment.trim()
    ) {
      toast.error("A rejection comment is required.");
      return;
    }

    setReviewDialog((current) => ({ ...current, submitting: true }));
    try {
      if (reviewDialog.contentType === "CONTENT_TYPE_MATERIAL") {
        await marketingCenterApi.reviewMaterial({
          id: reviewDialog.contentId,
          decision: reviewDialog.decision,
          comment: reviewDialog.comment.trim(),
        });
      } else {
        await marketingCenterApi.reviewActivity({
          id: reviewDialog.contentId,
          decision: reviewDialog.decision,
          comment: reviewDialog.comment.trim(),
        });
      }

      toast.success("Review decision submitted.");
      setReviewDialog(initialReviewDialogState);
      await queryClient.invalidateQueries({ queryKey: ["marketing-center"] });
    } finally {
      setReviewDialog((current) => ({ ...current, submitting: false }));
    }
  }

  return (
    <MarketingPageShell
      title="Compliance Review"
      description="Review materials and activities awaiting compliance approval, inspect their history, and record review decisions."
      actions={
        <Button type="button" variant="outline" onClick={() => void refreshAll()}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      }
    >
      <Tabs defaultValue="materials" className="space-y-4">
        <TabsList className="grid h-auto grid-cols-2 rounded-2xl p-1">
          <TabsTrigger value="materials">
            Material Reviews ({materialsResult.data?.total ?? 0})
          </TabsTrigger>
          <TabsTrigger value="activities">
            Activity Reviews ({activitiesResult.data?.total ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Material review queue</CardTitle>
              <CardDescription>
                Default scope is pending review. Change the status filter if you need to inspect older material states.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2 text-sm">
                  <span className="font-medium">Keyword</span>
                  <input
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={materialQuery.keyword ?? ""}
                    onChange={(event) =>
                      setMaterialQuery((current) => ({
                        ...current,
                        keyword: event.target.value,
                        page: 1,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-medium">Status</span>
                  <Select
                    value={materialQuery.status ?? "__all__"}
                    onValueChange={(value) =>
                      setMaterialQuery((current) => ({
                        ...current,
                        status: value === "__all__" ? undefined : (value as MarketingMaterialsQuery["status"]),
                        page: 1,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All statuses</SelectItem>
                      {marketingStatusOptions.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-medium">Page size</span>
                  <Select
                    value={String(materialQuery.pageSize)}
                    onValueChange={(value) =>
                      setMaterialQuery((current) => ({
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

              {materialsResult.isLoading ? (
                <div className="flex h-52 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading material review queue...
                </div>
              ) : (materialsResult.data?.items ?? []).length === 0 ? (
                <EmptyState
                  title="No material reviews"
                  description="No materials matched the current review filters."
                />
              ) : (
                <>
                  <div className="overflow-x-auto rounded-2xl border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Updated</TableHead>
                          <TableHead>Reject Reason</TableHead>
                          <TableHead className="w-[320px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(materialsResult.data?.items ?? []).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{textOrDash(item.title)}</TableCell>
                            <TableCell>
                              <MarketingStatusBadge status={item.status} />
                            </TableCell>
                            <TableCell>{textOrDash(item.updatedAt)}</TableCell>
                            <TableCell className="max-w-[260px] whitespace-pre-wrap break-words">
                              {textOrDash(item.rejectReason)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                <Button asChild size="sm" variant="outline">
                                  <Link to={marketingRoutes.materialDetail(Number(item.id ?? 0))}>View</Link>
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => openReviewDialog("CONTENT_TYPE_MATERIAL", item, "REVIEW_DECISION_APPROVE")}
                                >
                                  Approve
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => openReviewDialog("CONTENT_TYPE_MATERIAL", item, "REVIEW_DECISION_REJECT")}
                                >
                                  Reject
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setHistoryDialog({
                                      open: true,
                                      contentType: "CONTENT_TYPE_MATERIAL",
                                      contentId: Number(item.id ?? 0),
                                      title: String(item.title ?? ""),
                                    })
                                  }
                                >
                                  History
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <PaginationBar
                    page={materialQuery.page}
                    pageSize={materialQuery.pageSize}
                    total={materialsResult.data?.total ?? 0}
                    loading={materialsResult.isFetching}
                    onPrev={() =>
                      setMaterialQuery((current) => ({
                        ...current,
                        page: Math.max(1, current.page - 1),
                      }))
                    }
                    onNext={() =>
                      setMaterialQuery((current) => ({
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
              <CardTitle>Activity review queue</CardTitle>
              <CardDescription>
                Default scope is pending review. Change the status filter if you need to inspect older activity states.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2 text-sm">
                  <span className="font-medium">Keyword</span>
                  <input
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={activityQuery.keyword ?? ""}
                    onChange={(event) =>
                      setActivityQuery((current) => ({
                        ...current,
                        keyword: event.target.value,
                        page: 1,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-medium">Status</span>
                  <Select
                    value={activityQuery.status ?? "__all__"}
                    onValueChange={(value) =>
                      setActivityQuery((current) => ({
                        ...current,
                        status: value === "__all__" ? undefined : (value as MarketingActivitiesQuery["status"]),
                        page: 1,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All statuses</SelectItem>
                      {marketingStatusOptions.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-medium">Page size</span>
                  <Select
                    value={String(activityQuery.pageSize)}
                    onValueChange={(value) =>
                      setActivityQuery((current) => ({
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

              {activitiesResult.isLoading ? (
                <div className="flex h-52 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading activity review queue...
                </div>
              ) : (activitiesResult.data?.items ?? []).length === 0 ? (
                <EmptyState
                  title="No activity reviews"
                  description="No activities matched the current review filters."
                />
              ) : (
                <>
                  <div className="overflow-x-auto rounded-2xl border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Updated</TableHead>
                          <TableHead>Reject Reason</TableHead>
                          <TableHead className="w-[320px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(activitiesResult.data?.items ?? []).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{textOrDash(item.title)}</TableCell>
                            <TableCell>
                              <MarketingStatusBadge status={item.status} />
                            </TableCell>
                            <TableCell>{textOrDash(item.updatedAt)}</TableCell>
                            <TableCell className="max-w-[260px] whitespace-pre-wrap break-words">
                              {textOrDash(item.rejectReason)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                <Button asChild size="sm" variant="outline">
                                  <Link to={marketingRoutes.activityDetail(Number(item.id ?? 0))}>View</Link>
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => openReviewDialog("CONTENT_TYPE_ACTIVITY", item, "REVIEW_DECISION_APPROVE")}
                                >
                                  Approve
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => openReviewDialog("CONTENT_TYPE_ACTIVITY", item, "REVIEW_DECISION_REJECT")}
                                >
                                  Reject
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setHistoryDialog({
                                      open: true,
                                      contentType: "CONTENT_TYPE_ACTIVITY",
                                      contentId: Number(item.id ?? 0),
                                      title: String(item.title ?? ""),
                                    })
                                  }
                                >
                                  History
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <PaginationBar
                    page={activityQuery.page}
                    pageSize={activityQuery.pageSize}
                    total={activitiesResult.data?.total ?? 0}
                    loading={activitiesResult.isFetching}
                    onPrev={() =>
                      setActivityQuery((current) => ({
                        ...current,
                        page: Math.max(1, current.page - 1),
                      }))
                    }
                    onNext={() =>
                      setActivityQuery((current) => ({
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

      <Dialog
        open={reviewDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setReviewDialog(initialReviewDialogState);
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{reviewTitle}</DialogTitle>
            <DialogDescription>
              Review target:
              <span className="mt-2 block font-medium text-foreground">
                {reviewDialog.title || "-"}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-2xl border bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
              Decision:{" "}
              <span className="font-medium text-foreground">
                {reviewDialog.decision === "REVIEW_DECISION_REJECT" ? "Reject" : "Approve"}
              </span>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Comment</label>
              <Textarea
                className="min-h-[140px]"
                maxLength={500}
                placeholder={
                  reviewDialog.decision === "REVIEW_DECISION_REJECT"
                    ? "Rejection comment is required."
                    : "Optional approval comment."
                }
                value={reviewDialog.comment}
                onChange={(event) =>
                  setReviewDialog((current) => ({
                    ...current,
                    comment: event.target.value,
                  }))
                }
              />
              <div className="text-right text-xs text-muted-foreground">
                {reviewDialog.comment.trim().length}/500
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReviewDialog(initialReviewDialogState)}
              disabled={reviewDialog.submitting}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => void submitReview()} disabled={reviewDialog.submitting}>
              {reviewDialog.submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit decision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={historyDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setHistoryDialog(initialHistoryDialogState);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>Review history</DialogTitle>
            <DialogDescription>{historyDialog.title || "Content review records"}</DialogDescription>
          </DialogHeader>
          {historyQuery.isLoading ? (
            <div className="flex h-40 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading review history...
            </div>
          ) : historyRows.length === 0 ? (
            <EmptyState
              title="No review history"
              description="The selected content does not have stored review records."
            />
          ) : (
            <div className="overflow-x-auto rounded-2xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Created</TableHead>
                    <TableHead>Decision</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Reviewer</TableHead>
                    <TableHead>Comment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyRows.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{textOrDash(item.createdAt)}</TableCell>
                      <TableCell>{textOrDash(item.decision)}</TableCell>
                      <TableCell>{textOrDash(item.fromStatus)}</TableCell>
                      <TableCell>{textOrDash(item.toStatus)}</TableCell>
                      <TableCell>{textOrDash(item.reviewerName || item.reviewerId)}</TableCell>
                      <TableCell className="max-w-[280px] whitespace-pre-wrap break-words">
                        {textOrDash(item.comment)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MarketingPageShell>
  );
};

export default MarketingComplianceReviewPage;
