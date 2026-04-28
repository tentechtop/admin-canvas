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
  useMarketingMaterialDetail,
  useMarketingReviewHistory,
} from "@/features/marketing-center/hooks";
import {
  CopyButton,
  EmptyState,
  FilePreviewCard,
  MarketingPageShell,
  MarketingStatusBadge,
  OpenButton,
  PaginationBar,
} from "@/features/marketing-center/shared";
import {
  formatMarketingJson,
  joinTaxonomyNames,
  parseIdParam,
  prettyBytes,
  textOrDash,
} from "@/features/marketing-center/utils";
import type { MarketingMaterial } from "@/types/marketing-center";

type MaterialDetailActionKind = "submitReview" | "publish" | "offline";

type MaterialDetailActionState = {
  open: boolean;
  kind: MaterialDetailActionKind | null;
  comment: string;
  submitting: boolean;
};

const initialActionState: MaterialDetailActionState = {
  open: false,
  kind: null,
  comment: "",
  submitting: false,
};

function detailActionCopy(kind: MaterialDetailActionKind | null) {
  switch (kind) {
    case "submitReview":
      return {
        title: "Submit material review",
        description: "Move this material into the compliance review queue.",
        confirmLabel: "Submit review",
      };
    case "publish":
      return {
        title: "Publish material",
        description: "Publish this approved material so it can be consumed downstream.",
        confirmLabel: "Publish",
      };
    case "offline":
      return {
        title: "Offline material",
        description: "Take this published material offline. An optional operation comment can be added.",
        confirmLabel: "Offline",
      };
    default:
      return {
        title: "Confirm action",
        description: "Confirm the next material action.",
        confirmLabel: "Confirm",
      };
  }
}

function detailRows(material: MarketingMaterial | null) {
  if (!material) {
    return [] as Array<{ label: string; value: string }>;
  }
  return [
    { label: "ID", value: textOrDash(material.id) },
    { label: "Title", value: textOrDash(material.title) },
    { label: "Description", value: textOrDash(material.description) },
    { label: "Material Type", value: textOrDash(material.materialType) },
    { label: "Legacy Material Type", value: textOrDash(material.legacyMaterialType) },
    { label: "Language", value: textOrDash(material.language?.name) },
    { label: "Category", value: textOrDash(material.category?.name) },
    { label: "Channels", value: joinTaxonomyNames(material.channels) },
    { label: "Scopes", value: joinTaxonomyNames(material.scopes) },
    { label: "Cooperation Sample URL", value: textOrDash(material.cooperationSampleUrl) },
    { label: "Copy Code", value: textOrDash(material.copyCode) },
    { label: "Size", value: textOrDash(material.size) },
    { label: "File Type", value: textOrDash(material.fileType) },
    { label: "Reject Reason", value: textOrDash(material.rejectReason) },
    { label: "Created At", value: textOrDash(material.createdAt) },
    { label: "Updated At", value: textOrDash(material.updatedAt) },
    { label: "Published At", value: textOrDash(material.publishedAt) },
    { label: "Offline At", value: textOrDash(material.offlineAt) },
  ];
}

const MarketingMaterialDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const materialId = parseIdParam(id);
  const materialQuery = useMarketingMaterialDetail(materialId, materialId > 0);
  const reviewHistoryQuery = useMarketingReviewHistory("CONTENT_TYPE_MATERIAL", materialId);
  const [actionState, setActionState] = useState<MaterialDetailActionState>(initialActionState);

  const material = materialQuery.data ?? null;
  const status = String(material?.status ?? "");
  const rows = useMemo(() => detailRows(material), [material]);
  const actionCopy = useMemo(() => detailActionCopy(actionState.kind), [actionState.kind]);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: marketingQueryKeys.material(materialId) });
    await queryClient.invalidateQueries({
      queryKey: marketingQueryKeys.reviews({
        page: 1,
        pageSize: 20,
        contentType: "CONTENT_TYPE_MATERIAL",
        contentId: materialId,
      }),
    });
  }

  async function submitAction() {
    if (materialId <= 0 || !actionState.kind) {
      return;
    }

    setActionState((current) => ({ ...current, submitting: true }));
    try {
      if (actionState.kind === "submitReview") {
        await marketingCenterApi.submitMaterialReview({
          id: materialId,
          comment: actionState.comment.trim(),
        });
      } else if (actionState.kind === "publish") {
        await marketingCenterApi.publishMaterial(materialId);
      } else if (actionState.kind === "offline") {
        await marketingCenterApi.offlineMaterial({
          id: materialId,
          comment: actionState.comment.trim(),
        });
      }

      toast.success(`Material action completed: ${actionCopy.confirmLabel}.`);
      setActionState(initialActionState);
      await queryClient.invalidateQueries({ queryKey: ["marketing-center"] });
    } finally {
      setActionState((current) => ({ ...current, submitting: false }));
    }
  }

  return (
    <MarketingPageShell
      title="Material Detail"
      description="Inspect all stored material fields, preview file assets, and review the compliance history for this content record."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void refresh()} disabled={materialQuery.isFetching}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {canEditContent(status) ? (
            <Button asChild type="button" variant="outline">
              <Link to={marketingRoutes.materialEdit(materialId)}>Edit</Link>
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
      {materialQuery.isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading material detail...
        </div>
      ) : !material ? (
        <EmptyState
          title="Material not found"
          description="The requested material id returned no detail payload."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardDescription>Status</CardDescription>
                <CardTitle>
                  <MarketingStatusBadge status={material.status} />
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2 pt-0">
                <CopyButton value={String(material.id ?? "")} label="Copy ID" />
                {material.cooperationSampleUrl ? (
                  <OpenButton href={material.cooperationSampleUrl} label="Open sample URL" />
                ) : null}
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardDescription>File summary</CardDescription>
                <CardTitle className="text-base">
                  {textOrDash(material.file?.originalName ?? material.file?.storedName)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 text-sm text-muted-foreground">
                <div>Type: {textOrDash(material.file?.contentType)}</div>
                <div>Size: {prettyBytes(material.file?.size)}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardDescription>Cover summary</CardDescription>
                <CardTitle className="text-base">
                  {textOrDash(material.cover?.originalName ?? material.cover?.storedName)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 text-sm text-muted-foreground">
                <div>Type: {textOrDash(material.cover?.contentType)}</div>
                <div>Size: {prettyBytes(material.cover?.size)}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Stored fields</CardTitle>
              <CardDescription>
                Complete material payload returned by the backend detail endpoint.
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

          <div className="grid gap-4 xl:grid-cols-2">
            {material.file ? <FilePreviewCard title="Primary file" file={material.file} /> : null}
            {material.cover ? <FilePreviewCard title="Cover file" file={material.cover} /> : null}
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Review history</CardTitle>
              <CardDescription>
                Compliance decisions returned by <code>/admin/marketing/reviews</code> for this material.
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
                  description="This material does not have review history yet."
                />
              ) : (
                <>
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

                  <PaginationBar
                    page={1}
                    pageSize={20}
                    total={reviewHistoryQuery.data?.total ?? 0}
                    loading={reviewHistoryQuery.isFetching}
                    onPrev={() => undefined}
                    onNext={() => undefined}
                  />
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Raw detail payload</CardTitle>
              <CardDescription>
                JSON preview of the returned material detail to help operations inspect backend values precisely.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[480px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
                {formatMarketingJson(material)}
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
              <span className="mt-2 block font-medium text-foreground">{textOrDash(material?.title)}</span>
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

export default MarketingMaterialDetailPage;
