import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Plus, RefreshCcw, Search } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  canDeleteContent,
  canEditContent,
  canOfflineContent,
  canPublishContent,
  canSubmitReview,
  marketingRoutes,
  marketingStatusOptions,
} from "@/features/marketing-center/config";
import {
  marketingQueryKeys,
  useMarketingMaterialsList,
  useMarketingTaxonomyCatalog,
} from "@/features/marketing-center/hooks";
import {
  EmptyState,
  MarketingPageShell,
  MarketingStatusBadge,
  PaginationBar,
  TaxonomySingleSelect,
} from "@/features/marketing-center/shared";
import { joinTaxonomyNames, textOrDash } from "@/features/marketing-center/utils";
import type { MarketingMaterial, MarketingMaterialsQuery } from "@/types/marketing-center";

type MaterialActionKind = "delete" | "submitReview" | "publish" | "offline";

type MaterialActionDialogState = {
  open: boolean;
  kind: MaterialActionKind | null;
  item: MarketingMaterial | null;
  comment: string;
  submitting: boolean;
};

const initialQuery: MarketingMaterialsQuery = {
  page: 1,
  pageSize: 10,
  keyword: "",
  materialType: "",
  legacyMaterialType: "",
};

const initialDialogState: MaterialActionDialogState = {
  open: false,
  kind: null,
  item: null,
  comment: "",
  submitting: false,
};

function actionCopy(kind: MaterialActionKind | null) {
  switch (kind) {
    case "delete":
      return {
        title: "Delete material",
        description: "Delete this marketing material permanently after confirmation.",
        confirmLabel: "Delete",
      };
    case "submitReview":
      return {
        title: "Submit review",
        description: "Move the current material draft into the compliance review queue.",
        confirmLabel: "Submit",
      };
    case "publish":
      return {
        title: "Publish material",
        description: "Publish this approved material so it can be consumed by downstream clients.",
        confirmLabel: "Publish",
      };
    case "offline":
      return {
        title: "Offline material",
        description: "Take this material offline. You can leave an optional operation comment.",
        confirmLabel: "Offline",
      };
    default:
      return {
        title: "Confirm action",
        description: "Confirm this material action.",
        confirmLabel: "Confirm",
      };
  }
}

const MarketingMaterialsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState<MarketingMaterialsQuery>(initialQuery);
  const [dialogState, setDialogState] = useState<MaterialActionDialogState>(initialDialogState);

  const materialsQuery = useMarketingMaterialsList(query);
  const taxonomyCatalog = useMarketingTaxonomyCatalog();
  const materials = materialsQuery.data?.items ?? [];
  const total = materialsQuery.data?.total ?? 0;

  const languages = taxonomyCatalog.data.TAXONOMY_TYPE_LANGUAGE;
  const channels = taxonomyCatalog.data.TAXONOMY_TYPE_CHANNEL;
  const scopes = taxonomyCatalog.data.TAXONOMY_TYPE_SCOPE;
  const categories = taxonomyCatalog.data.TAXONOMY_TYPE_MATERIAL_CATEGORY;

  const dialogCopy = useMemo(() => actionCopy(dialogState.kind), [dialogState.kind]);

  function updateQuery(patch: Partial<MarketingMaterialsQuery>) {
    setQuery((current) => ({
      ...current,
      ...patch,
      page: patch.page ?? 1,
    }));
  }

  function openActionDialog(kind: MaterialActionKind, item: MarketingMaterial) {
    setDialogState({
      open: true,
      kind,
      item,
      comment: "",
      submitting: false,
    });
  }

  async function refreshAll() {
    await queryClient.invalidateQueries({ queryKey: marketingQueryKeys.materials(query) });
  }

  async function submitAction() {
    const itemId = Number(dialogState.item?.id ?? 0);
    if (!dialogState.kind || itemId <= 0) {
      return;
    }

    setDialogState((current) => ({ ...current, submitting: true }));
    try {
      if (dialogState.kind === "delete") {
        await marketingCenterApi.deleteMaterial(itemId);
      } else if (dialogState.kind === "submitReview") {
        await marketingCenterApi.submitMaterialReview({
          id: itemId,
          comment: dialogState.comment.trim(),
        });
      } else if (dialogState.kind === "publish") {
        await marketingCenterApi.publishMaterial(itemId);
      } else if (dialogState.kind === "offline") {
        await marketingCenterApi.offlineMaterial({
          id: itemId,
          comment: dialogState.comment.trim(),
        });
      }

      toast.success(`Material action completed: ${dialogCopy.confirmLabel}.`);
      setDialogState(initialDialogState);
      await queryClient.invalidateQueries({ queryKey: ["marketing-center"] });
    } finally {
      setDialogState((current) => ({ ...current, submitting: false }));
    }
  }

  return (
    <MarketingPageShell
      title="Material Center"
      description="Manage draft, reviewed, published, and offline marketing materials without leaving the admin workspace."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void refreshAll()} disabled={materialsQuery.isFetching}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button type="button" onClick={() => navigate(marketingRoutes.materialCreate)}>
            <Plus className="mr-2 h-4 w-4" />
            New material
          </Button>
        </div>
      }
    >
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Material type and legacy material type are currently text inputs because the backend does not expose dedicated option dictionaries.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Keyword</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={query.keyword ?? ""}
                  placeholder="Search title or description"
                  onChange={(event) => updateQuery({ keyword: event.target.value })}
                />
              </div>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Material type</span>
              <Input
                value={query.materialType ?? ""}
                placeholder="e.g. cooperation_sample"
                onChange={(event) => updateQuery({ materialType: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Legacy material type</span>
              <Input
                value={query.legacyMaterialType ?? ""}
                placeholder="Legacy type"
                onChange={(event) => updateQuery({ legacyMaterialType: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Status</span>
              <Select
                value={query.status ?? "__all__"}
                onValueChange={(value) =>
                  updateQuery({
                    status: value === "__all__" ? undefined : (value as MarketingMaterialsQuery["status"]),
                  })
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
            <div className="space-y-2 text-sm">
              <span className="font-medium">Language</span>
              <TaxonomySingleSelect
                items={languages}
                value={query.languageId}
                placeholder="All languages"
                onChange={(value) => updateQuery({ languageId: value })}
              />
            </div>
            <div className="space-y-2 text-sm">
              <span className="font-medium">Category</span>
              <TaxonomySingleSelect
                items={categories}
                value={query.categoryId}
                placeholder="All categories"
                onChange={(value) => updateQuery({ categoryId: value })}
              />
            </div>
            <div className="space-y-2 text-sm">
              <span className="font-medium">Channel</span>
              <TaxonomySingleSelect
                items={channels}
                value={query.channelId}
                placeholder="All channels"
                onChange={(value) => updateQuery({ channelId: value })}
              />
            </div>
            <div className="space-y-2 text-sm">
              <span className="font-medium">Scope</span>
              <TaxonomySingleSelect
                items={scopes}
                value={query.scopeId}
                placeholder="All scopes"
                onChange={(value) => updateQuery({ scopeId: value })}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setQuery(initialQuery)}
              disabled={materialsQuery.isFetching}
            >
              Reset filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Materials</CardTitle>
          <CardDescription>
            Status actions are gated by the current backend workflow: draft/rejected/offline can be edited and resubmitted, approved can be published, and published content can be offlined.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {materialsQuery.isLoading ? (
            <div className="flex h-52 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading materials...
            </div>
          ) : materials.length === 0 ? (
            <EmptyState
              title="No materials matched"
              description="Try another filter combination or create the first marketing material."
            />
          ) : (
            <>
              <div className="overflow-x-auto rounded-2xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Material type</TableHead>
                      <TableHead>Legacy type</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Channels</TableHead>
                      <TableHead>Scopes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead className="w-[320px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materials.map((item) => {
                      const itemId = Number(item.id ?? 0);
                      const status = String(item.status ?? "");
                      return (
                        <TableRow key={itemId || item.title}>
                          <TableCell className="min-w-[220px]">
                            <div className="space-y-1">
                              <div className="font-medium">{textOrDash(item.title)}</div>
                              <div className="line-clamp-2 text-xs text-muted-foreground">
                                {textOrDash(item.description)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{textOrDash(item.materialType)}</TableCell>
                          <TableCell>{textOrDash(item.legacyMaterialType)}</TableCell>
                          <TableCell>{textOrDash(item.language?.name)}</TableCell>
                          <TableCell>{textOrDash(item.category?.name)}</TableCell>
                          <TableCell>{joinTaxonomyNames(item.channels)}</TableCell>
                          <TableCell>{joinTaxonomyNames(item.scopes)}</TableCell>
                          <TableCell>
                            <MarketingStatusBadge status={status} />
                          </TableCell>
                          <TableCell>{textOrDash(item.updatedAt)}</TableCell>
                          <TableCell>{textOrDash(item.publishedAt)}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              <Button asChild size="sm" variant="outline">
                                <Link to={marketingRoutes.materialDetail(itemId)}>View</Link>
                              </Button>
                              {canEditContent(status) ? (
                                <Button asChild size="sm" variant="outline">
                                  <Link to={marketingRoutes.materialEdit(itemId)}>Edit</Link>
                                </Button>
                              ) : null}
                              {canDeleteContent(status) ? (
                                <Button type="button" size="sm" variant="outline" onClick={() => openActionDialog("delete", item)}>
                                  Delete
                                </Button>
                              ) : null}
                              {canSubmitReview(status) ? (
                                <Button type="button" size="sm" variant="outline" onClick={() => openActionDialog("submitReview", item)}>
                                  Submit review
                                </Button>
                              ) : null}
                              {canPublishContent(status) ? (
                                <Button type="button" size="sm" onClick={() => openActionDialog("publish", item)}>
                                  Publish
                                </Button>
                              ) : null}
                              {canOfflineContent(status) ? (
                                <Button type="button" size="sm" variant="outline" onClick={() => openActionDialog("offline", item)}>
                                  Offline
                                </Button>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <PaginationBar
                page={query.page}
                pageSize={query.pageSize}
                total={total}
                loading={materialsQuery.isFetching}
                onPrev={() => setQuery((current) => ({ ...current, page: Math.max(1, current.page - 1) }))}
                onNext={() => setQuery((current) => ({ ...current, page: current.page + 1 }))}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogState.open}
        onOpenChange={(open) => {
          if (!open) {
            setDialogState(initialDialogState);
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{dialogCopy.title}</DialogTitle>
            <DialogDescription>
              {dialogCopy.description}
              <span className="mt-2 block font-medium text-foreground">
                {textOrDash(dialogState.item?.title)}
              </span>
            </DialogDescription>
          </DialogHeader>

          {dialogState.kind === "submitReview" || dialogState.kind === "offline" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Comment</label>
              <Textarea
                className="min-h-[120px]"
                maxLength={500}
                placeholder="Optional comment for this state transition."
                value={dialogState.comment}
                onChange={(event) =>
                  setDialogState((current) => ({
                    ...current,
                    comment: event.target.value,
                  }))
                }
              />
              <div className="text-right text-xs text-muted-foreground">
                {dialogState.comment.trim().length}/500
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogState(initialDialogState)}
              disabled={dialogState.submitting}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => void submitAction()} disabled={dialogState.submitting}>
              {dialogState.submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {dialogCopy.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MarketingPageShell>
  );
};

export default MarketingMaterialsPage;
