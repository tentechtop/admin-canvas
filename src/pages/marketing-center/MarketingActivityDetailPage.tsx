import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  canEditContent,
  canOfflineContent,
  canPublishContent,
  canSubmitReview,
  marketingRoutes,
} from "@/features/marketing-center/config";
import {
  marketingQueryKeys,
  useMarketingActivityDetail,
  useMarketingReviewHistory,
} from "@/features/marketing-center/hooks";
import {
  EmptyState,
  FilePreviewCard,
  MarketingPageShell,
  MarketingStatusBadge,
  OpenButton,
} from "@/features/marketing-center/shared";
import {
  booleanLabel,
  formatMarketingJson,
  joinTaxonomyNames,
  parseIdParam,
  prettyBytes,
  textOrDash,
} from "@/features/marketing-center/utils";
import type { MarketingActivity } from "@/types/marketing-center";

type ActivityDetailActionKind = "submitReview" | "publish" | "offline";

type ActivityDetailActionState = {
  open: boolean;
  kind: ActivityDetailActionKind | null;
  comment: string;
  submitting: boolean;
};

const initialActionState: ActivityDetailActionState = {
  open: false,
  kind: null,
  comment: "",
  submitting: false,
};

function detailActionCopy(kind: ActivityDetailActionKind | null) {
  switch (kind) {
    case "submitReview":
      return {
        title: "Submit activity review",
        description: "Move this activity into the compliance review queue.",
        confirmLabel: "Submit review",
      };
    case "publish":
      return {
        title: "Publish activity",
        description: "Publish this approved activity for downstream consumption.",
        confirmLabel: "Publish",
      };
    case "offline":
      return {
        title: "Offline activity",
        description: "Take this activity offline. You can keep an optional operation comment.",
        confirmLabel: "Offline",
      };
    default:
      return {
        title: "Confirm action",
        description: "Confirm the next activity action.",
        confirmLabel: "Confirm",
      };
  }
}

function detailRows(activity: MarketingActivity | null) {
  if (!activity) {
    return [] as Array<{ label: string; value: string }>;
  }
  return [
    { label: "ID", value: textOrDash(activity.id) },
    { label: "Title", value: textOrDash(activity.title) },
    { label: "Description", value: textOrDash(activity.description) },
    { label: "Language", value: textOrDash(activity.language?.name) },
    { label: "Category", value: textOrDash(activity.category?.name) },
    { label: "Channels", value: joinTaxonomyNames(activity.channels) },
    { label: "Scopes", value: joinTaxonomyNames(activity.scopes) },
    { label: "Carousel", value: booleanLabel(activity.carousel) },
    { label: "Landing URL", value: textOrDash(activity.landingUrl) },
    { label: "Reject Reason", value: textOrDash(activity.rejectReason) },
    { label: "Created At", value: textOrDash(activity.createdAt) },
    { label: "Updated At", value: textOrDash(activity.updatedAt) },
    { label: "Published At", value: textOrDash(activity.publishedAt) },
    { label: "Offline At", value: textOrDash(activity.offlineAt) },
  ];
}

const MarketingActivityDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const activityId = parseIdParam(id);
  const activityQuery = useMarketingActivityDetail(activityId, activityId > 0);
  const reviewHistoryQuery = useMarketingReviewHistory("CONTENT_TYPE_ACTIVITY", activityId);
  const [actionState, setActionState] = useState<ActivityDetailActionState>(initialActionState);

  const activity = activityQuery.data ?? null;
  const status = String(activity?.status ?? "");
  const rows = useMemo(() => detailRows(activity), [activity]);
  const actionCopy = useMemo(() => detailActionCopy(actionState.kind), [actionState.kind]);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: marketingQueryKeys.activity(activityId) });
    await queryClient.invalidateQueries({
      queryKey: marketingQueryKeys.reviews({
        page: 1,
        pageSize: 20,
        contentType: "CONTENT_TYPE_ACTIVITY",
        contentId: activityId,
      }),
    });
  }

  async function submitAction() {
    if (activityId <= 0 || !actionState.kind) {
      return;
    }

    setActionState((current) => ({ ...current, submitting: true }));
    try {
      if (actionState.kind === "submitReview") {
        await marketingCenterApi.submitActivityReview({
          id: activityId,
          comment: actionState.comment.trim(),
        });
      } else if (actionState.kind === "publish") {
        await marketingCenterApi.publishActivity(activityId);
      } else if (actionState.kind === "offline") {
        await marketingCenterApi.offlineActivity({
          id: activityId,
          comment: actionState.comment.trim(),
        });
      }

      toast.success(`Activity action completed: ${actionCopy.confirmLabel}.`);
      setActionState(initialActionState);
      await queryClient.invalidateQueries({ queryKey: ["marketing-center"] });
    } finally {
      setActionState((current) => ({ ...current, submitting: false }));
    }
  }

  return (
    <MarketingPageShell
      title="Activity Detail"
      description="Inspect all stored activity fields, preview the cover asset, and review the compliance history for this activity."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void refresh()} disabled={activityQuery.isFetching}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {canEditContent(status) ? (
            <Button asChild type="button" variant="outline">
              <Link to={marketingRoutes.activityEdit(activityId)}>Edit</Link>
            </Button>
          ) : null}
          {canSubmitReview(status) ? (
            <Button type="button" onClick={() => setActionState({ open: true, kind: "submitReview", comment: "", submitting: false })}>
              Submit review
            </Button>
          ) : null}
          {canPublishContent(status) ? (
            <Button type="button" onClick={() => setActionState({ open: true, kind: "publish", comment: "", submitting: false })}>
              Publish
            </Button>
          ) : null}
          {canOfflineContent(status) ? (
            <Button type="button" variant="outline" onClick={() => setActionState({ open: true, kind: "offline", comment: "", submitting: false })}>
              Offline
            </Button>
          ) : null}
        </div>
      }
    >
      {activityQuery.isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading activity detail...
        </div>
      ) : !activity ? (
        <EmptyState
          title="Activity not found"
          description="The requested activity id returned no detail payload."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardDescription>Status</CardDescription>
                <CardTitle>
                  <MarketingStatusBadge status={activity.status} />
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2 pt-0">
                {activity.landingUrl ? <OpenButton href={activity.landingUrl} label="Open landing URL" /> : null}
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardDescription>Cover summary</CardDescription>
                <CardTitle className="text-base">
                  {textOrDash(activity.cover?.originalName ?? activity.cover?.storedName)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 text-sm text-muted-foreground">
                <div>Type: {textOrDash(activity.cover?.contentType)}</div>
                <div>Size: {prettyBytes(activity.cover?.size)}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardDescription>Presentation</CardDescription>
                <CardTitle className="text-base">{booleanLabel(activity.carousel)}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">
                Carousel determines whether the activity can participate in carousel placements.
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Stored fields</CardTitle>
              <CardDescription>
                Complete activity payload returned by the backend detail endpoint.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {rows.map((row) => (
                <div key={row.label} className="rounded-2xl border bg-muted/10 p-4">
                  <div className="text-xs uppercase tracking-[0.28em] text-muted-foreground">{row.label}</div>
                  <div className="mt-3 break-all text-sm font-medium text-foreground">{row.value}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          {activity.cover ? <FilePreviewCard title="Cover file" file={activity.cover} /> : null}

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Review history</CardTitle>
              <CardDescription>
                Compliance decisions returned by <code>/admin/marketing/reviews</code> for this activity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {reviewHistoryQuery.isLoading ? (
                <div className="flex h-40 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading review history...
                </div>
              ) : (reviewHistoryQuery.data?.items ?? []).length === 0 ? (
                <EmptyState
                  title="No review records"
                  description="This activity does not have review history yet."
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
                      {(reviewHistoryQuery.data?.items ?? []).map((item) => (
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
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Raw detail payload</CardTitle>
              <CardDescription>
                JSON preview of the returned activity detail to help operations inspect backend values precisely.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[480px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
                {formatMarketingJson(activity)}
              </pre>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog
        open={actionState.open}
        onOpenChange={(open) => {
          if (!open) {
            setActionState(initialActionState);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionCopy.title}</DialogTitle>
            <DialogDescription>
              {actionCopy.description}
              <span className="mt-2 block font-medium text-foreground">{textOrDash(activity?.title)}</span>
            </DialogDescription>
          </DialogHeader>
          {actionState.kind === "submitReview" || actionState.kind === "offline" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Comment</label>
              <Textarea
                className="min-h-[120px]"
                maxLength={500}
                placeholder="Optional comment for this action."
                value={actionState.comment}
                onChange={(event) =>
                  setActionState((current) => ({
                    ...current,
                    comment: event.target.value,
                  }))
                }
              />
              <div className="text-right text-xs text-muted-foreground">
                {actionState.comment.trim().length}/500
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setActionState(initialActionState)}
              disabled={actionState.submitting}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => void submitAction()} disabled={actionState.submitting}>
              {actionState.submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {actionCopy.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MarketingPageShell>
  );
};

export default MarketingActivityDetailPage;
