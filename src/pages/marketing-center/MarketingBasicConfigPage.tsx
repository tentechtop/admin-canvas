import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCcw, Trash2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { marketingCenterApi } from "@/api/marketing-center";
import { marketingTaxonomyFormSchema, type MarketingTaxonomyFormValues } from "@/features/marketing-center/form-schemas";
import { marketingQueryKeys, useMarketingTaxonomies } from "@/features/marketing-center/hooks";
import { EmptyState, MarketingPageShell } from "@/features/marketing-center/shared";
import { taxonomyTabs, taxonomyTypeLabel } from "@/features/marketing-center/config";
import type { MarketingTaxonomyItem, MarketingTaxonomyType } from "@/types/marketing-center";

type TaxonomyDialogState = {
  open: boolean;
  mode: "create" | "edit";
  type: MarketingTaxonomyType;
  item: MarketingTaxonomyItem | null;
};

const initialDialogState: TaxonomyDialogState = {
  open: false,
  mode: "create",
  type: "TAXONOMY_TYPE_LANGUAGE",
  item: null,
};

const MarketingBasicConfigPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<MarketingTaxonomyType>("TAXONOMY_TYPE_LANGUAGE");
  const [dialogState, setDialogState] = useState<TaxonomyDialogState>(initialDialogState);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<MarketingTaxonomyItem | null>(null);

  const taxonomyQuery = useMarketingTaxonomies(activeTab, true);
  const items = taxonomyQuery.data ?? [];

  const form = useForm<MarketingTaxonomyFormValues>({
    resolver: zodResolver(marketingTaxonomyFormSchema),
    defaultValues: {
      code: "",
      name: "",
      locale: "",
      sort: 0,
      enabled: true,
    },
  });

  const activeLabel = useMemo(
    () => taxonomyTabs.find((item) => item.value === activeTab)?.label ?? taxonomyTypeLabel(activeTab),
    [activeTab],
  );

  function openCreateDialog(type: MarketingTaxonomyType) {
    form.reset({
      code: "",
      name: "",
      locale: "",
      sort: 0,
      enabled: true,
    });
    setDialogState({
      open: true,
      mode: "create",
      type,
      item: null,
    });
  }

  function openEditDialog(item: MarketingTaxonomyItem) {
    form.reset({
      code: String(item.code ?? ""),
      name: String(item.name ?? ""),
      locale: String(item.locale ?? ""),
      sort: Number(item.sort ?? 0),
      enabled: Boolean(item.enabled),
    });
    setDialogState({
      open: true,
      mode: "edit",
      type: activeTab,
      item,
    });
  }

  async function invalidateTaxonomies() {
    await queryClient.invalidateQueries({ queryKey: ["marketing-center", "taxonomies"] });
  }

  async function onSubmit(values: MarketingTaxonomyFormValues) {
    setSubmitting(true);
    try {
      if (dialogState.mode === "create") {
        await marketingCenterApi.createTaxonomy({
          type: dialogState.type,
          code: values.code,
          name: values.name,
          locale: values.locale,
          sort: values.sort,
          enabled: values.enabled,
        });
      } else if (dialogState.item?.id) {
        await marketingCenterApi.updateTaxonomy({
          id: Number(dialogState.item.id),
          name: values.name,
          locale: values.locale,
          sort: values.sort,
          enabled: values.enabled,
        });
      }
      setDialogState(initialDialogState);
      await invalidateTaxonomies();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item: MarketingTaxonomyItem) {
    const id = Number(item.id ?? 0);
    if (id <= 0) {
      return;
    }
    setDeletingId(id);
    try {
      await marketingCenterApi.deleteTaxonomy(id);
      await invalidateTaxonomies();
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggle(item: MarketingTaxonomyItem, enabled: boolean) {
    const id = Number(item.id ?? 0);
    if (id <= 0) {
      return;
    }
    await marketingCenterApi.updateTaxonomy({
      id,
      name: String(item.name ?? ""),
      locale: String(item.locale ?? ""),
      sort: Number(item.sort ?? 0),
      enabled,
    });
    await invalidateTaxonomies();
  }

  return (
    <MarketingPageShell
      title="Marketing Basic Config"
      description="Manage taxonomy dimensions used by materials, activities, links, and reports."
      actions={
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => void invalidateTaxonomies()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button type="button" onClick={() => openCreateDialog(activeTab)}>
            <Plus className="mr-2 h-4 w-4" />
            New {activeLabel}
          </Button>
        </div>
      }
    >
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as MarketingTaxonomyType)} className="space-y-4">
        <TabsList className="grid h-auto grid-cols-2 gap-2 rounded-2xl bg-transparent p-0 md:grid-cols-5">
          {taxonomyTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="rounded-xl border data-[state=active]:border-primary">
              <tab.icon className="mr-2 h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {taxonomyTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>{tab.label}</CardTitle>
                <CardDescription>
                  Create, edit, enable, sort, and delete taxonomy values for the {tab.shortLabel} dimension.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {taxonomyQuery.isLoading ? (
                  <div className="rounded-2xl border bg-muted/20 p-6 text-sm text-muted-foreground">
                    Loading {tab.label.toLowerCase()} taxonomy...
                  </div>
                ) : items.length === 0 ? (
                  <EmptyState
                    title={`No ${tab.label.toLowerCase()} taxonomy`}
                    description="Create the first taxonomy record for this dimension."
                  />
                ) : (
                  <div className="overflow-x-auto rounded-2xl border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Locale</TableHead>
                          <TableHead>Sort</TableHead>
                          <TableHead>Enabled</TableHead>
                          <TableHead>Updated</TableHead>
                          <TableHead className="w-[180px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => {
                          const id = Number(item.id ?? 0);
                          return (
                            <TableRow key={`${tab.value}-${id}`}>
                              <TableCell className="font-mono text-xs">{id || "-"}</TableCell>
                              <TableCell>{taxonomyTypeLabel(item.type)}</TableCell>
                              <TableCell>{String(item.code ?? "-")}</TableCell>
                              <TableCell>{String(item.name ?? "-")}</TableCell>
                              <TableCell>{String(item.locale ?? "-")}</TableCell>
                              <TableCell>{String(item.sort ?? "-")}</TableCell>
                              <TableCell>
                                <Switch
                                  checked={Boolean(item.enabled)}
                                  onCheckedChange={(enabled) => void handleToggle(item, enabled)}
                                />
                              </TableCell>
                              <TableCell>{String(item.updatedAt ?? "-")}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-2">
                                  <Button type="button" size="sm" variant="outline" onClick={() => openEditDialog(item)}>
                                    Edit
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={deletingId === id}
                                    onClick={() => setDeleteCandidate(item)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={dialogState.open} onOpenChange={(open) => setDialogState((current) => ({ ...current, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogState.mode === "create" ? `Create ${activeLabel}` : `Edit ${activeLabel}`}</DialogTitle>
            <DialogDescription>
              The taxonomy type is fixed by the active tab. Existing codes remain immutable during edit.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={dialogState.mode === "edit"} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="locale"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Locale</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sort"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-2xl border bg-muted/10 p-4">
                    <div>
                      <FormLabel>Enabled</FormLabel>
                      <div className="text-sm text-muted-foreground">Disable to hide the taxonomy in create/edit selectors.</div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogState(initialDialogState)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteCandidate)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteCandidate(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete taxonomy</AlertDialogTitle>
            <AlertDialogDescription>
              Delete taxonomy <strong>{deleteCandidate?.name || deleteCandidate?.code || "-"}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingId)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={Boolean(deletingId)}
              onClick={(event) => {
                event.preventDefault();
                if (deleteCandidate) {
                  void handleDelete(deleteCandidate).finally(() => setDeleteCandidate(null));
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MarketingPageShell>
  );
};

export default MarketingBasicConfigPage;
