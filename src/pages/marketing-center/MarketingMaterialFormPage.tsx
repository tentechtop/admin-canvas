import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { marketingCenterApi } from "@/api/marketing-center";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { marketingRoutes } from "@/features/marketing-center/config";
import {
  marketingMaterialFormSchema,
  type MarketingMaterialFormValues,
} from "@/features/marketing-center/form-schemas";
import {
  marketingQueryKeys,
  useMarketingMaterialDetail,
  useMarketingTaxonomyCatalog,
} from "@/features/marketing-center/hooks";
import {
  EmptyState,
  FileObjectField,
  MarketingPageShell,
  TaxonomyMultiSelect,
  TaxonomySingleSelect,
} from "@/features/marketing-center/shared";
import { materialFileMode, parseIdParam } from "@/features/marketing-center/utils";

const emptyValues: MarketingMaterialFormValues = {
  title: "",
  description: "",
  materialType: "",
  legacyMaterialType: "",
  languageId: 0,
  categoryId: 0,
  channelIds: [],
  scopeIds: [],
  fileId: undefined,
  coverFileId: undefined,
  cooperationSampleUrl: "",
  copyCode: "",
  size: "",
  fileType: "",
};

const MarketingMaterialFormPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const materialId = parseIdParam(id);
  const isEditMode = materialId > 0;
  const taxonomyCatalog = useMarketingTaxonomyCatalog();
  const materialQuery = useMarketingMaterialDetail(materialId, isEditMode);

  const form = useForm<MarketingMaterialFormValues>({
    resolver: zodResolver(marketingMaterialFormSchema),
    defaultValues: emptyValues,
  });

  const watchedMaterialType = form.watch("materialType");
  const currentFileMode = useMemo(
    () =>
      materialFileMode({
        materialType: watchedMaterialType,
      }),
    [watchedMaterialType],
  );

  useEffect(() => {
    if (!materialQuery.data) {
      return;
    }

    form.reset({
      title: String(materialQuery.data.title ?? ""),
      description: String(materialQuery.data.description ?? ""),
      materialType: String(materialQuery.data.materialType ?? ""),
      legacyMaterialType: String(materialQuery.data.legacyMaterialType ?? ""),
      languageId: Number(materialQuery.data.language?.id ?? 0),
      categoryId: Number(materialQuery.data.category?.id ?? 0),
      channelIds: (materialQuery.data.channels ?? []).map((item) => Number(item.id ?? 0)).filter((value) => value > 0),
      scopeIds: (materialQuery.data.scopes ?? []).map((item) => Number(item.id ?? 0)).filter((value) => value > 0),
      fileId: Number(materialQuery.data.file?.id ?? 0) || undefined,
      coverFileId: Number(materialQuery.data.cover?.id ?? 0) || undefined,
      cooperationSampleUrl: String(materialQuery.data.cooperationSampleUrl ?? ""),
      copyCode: String(materialQuery.data.copyCode ?? ""),
      size: String(materialQuery.data.size ?? ""),
      fileType: String(materialQuery.data.fileType ?? ""),
    });
  }, [form, materialQuery.data]);

  async function onSubmit(values: MarketingMaterialFormValues) {
    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      materialType: values.materialType.trim(),
      legacyMaterialType: values.legacyMaterialType.trim(),
      languageId: values.languageId,
      categoryId: values.categoryId,
      channelIds: values.channelIds,
      scopeIds: values.scopeIds,
      fileId: values.fileId,
      coverFileId: values.coverFileId,
      cooperationSampleUrl: values.cooperationSampleUrl.trim(),
      copyCode: values.copyCode.trim(),
      size: values.size.trim(),
      fileType: values.fileType.trim(),
    };

    if (isEditMode) {
      await marketingCenterApi.updateMaterial({
        id: materialId,
        ...payload,
      });
      toast.success("Material updated. Backend status will be reset to draft after edit.");
      await queryClient.invalidateQueries({ queryKey: ["marketing-center"] });
      navigate(marketingRoutes.materialDetail(materialId));
      return;
    }

    const result = await marketingCenterApi.createMaterial(payload);
    const nextId = Number(result.value?.id ?? 0);
    toast.success("Material created as draft.");
    await queryClient.invalidateQueries({ queryKey: ["marketing-center"] });
    if (nextId > 0) {
      navigate(marketingRoutes.materialDetail(nextId));
      return;
    }
    navigate(marketingRoutes.materials);
  }

  if (isEditMode && materialQuery.isLoading) {
    return (
      <MarketingPageShell
        title="Edit Material"
        description="Loading the stored material payload before entering edit mode."
      >
        <div className="flex h-64 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading material...
        </div>
      </MarketingPageShell>
    );
  }

  if (isEditMode && !materialQuery.data) {
    return (
      <MarketingPageShell
        title="Edit Material"
        description="The requested material could not be loaded for editing."
      >
        <EmptyState
          title="Material not found"
          description="The edit page requires a valid material detail payload."
        />
      </MarketingPageShell>
    );
  }

  return (
    <MarketingPageShell
      title={isEditMode ? "Edit Material" : "Create Material"}
      description={
        isEditMode
          ? "Update an existing material. Published or approved content is expected to return to draft after an edit."
          : "Create a new marketing material draft for later compliance review and publication."
      }
      actions={
        <div className="flex flex-wrap gap-2">
          {isEditMode ? (
            <Button asChild type="button" variant="outline">
              <Link to={marketingRoutes.materialDetail(materialId)}>View detail</Link>
            </Button>
          ) : null}
        </div>
      }
    >
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Material form</CardTitle>
          <CardDescription>
            Use a file upload for standard material types. For cooperation sample materials, the form accepts a direct cooperation sample URL instead of a required file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-6 lg:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="materialType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material type</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. cooperation_sample" />
                      </FormControl>
                      <FormDescription>
                        The backend currently does not expose a dedicated type dictionary for material_type.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[120px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 lg:grid-cols-2">
                <FormField
                  control={form.control}
                  name="legacyMaterialType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Legacy material type</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        This field is passed through to the backend as-is because no fixed option list is provided.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="languageId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <FormControl>
                        <TaxonomySingleSelect
                          items={taxonomyCatalog.data.TAXONOMY_TYPE_LANGUAGE}
                          value={field.value || undefined}
                          placeholder="Select a language"
                          onChange={(value) => field.onChange(value ?? 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <TaxonomySingleSelect
                          items={taxonomyCatalog.data.TAXONOMY_TYPE_MATERIAL_CATEGORY}
                          value={field.value || undefined}
                          placeholder="Select a category"
                          onChange={(value) => field.onChange(value ?? 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="channelIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Channels</FormLabel>
                      <FormControl>
                        <TaxonomyMultiSelect
                          items={taxonomyCatalog.data.TAXONOMY_TYPE_CHANNEL}
                          value={field.value}
                          placeholder="Select channels"
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="scopeIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scopes</FormLabel>
                    <FormControl>
                      <TaxonomyMultiSelect
                        items={taxonomyCatalog.data.TAXONOMY_TYPE_SCOPE}
                        value={field.value}
                        placeholder="Select scopes"
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 lg:grid-cols-2">
                {currentFileMode === "cooperation" ? (
                  <FormField
                    control={form.control}
                    name="cooperationSampleUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cooperation sample URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://example.com/sample" />
                        </FormControl>
                        <FormDescription>
                          Cooperation sample materials can use a URL instead of an uploaded file.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="fileId"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FileObjectField
                            label="Primary file"
                            fileId={field.value}
                            requiredHint="Required for non-cooperation material types."
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="coverFileId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FileObjectField
                          label="Cover file"
                          fileId={field.value}
                          requiredHint="Optional but recommended for visual materials."
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <FormField
                  control={form.control}
                  name="copyCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Copy code</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[120px] font-mono text-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Size</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. 1200x628" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fileType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>File type</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. image/png" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(isEditMode ? marketingRoutes.materialDetail(materialId) : marketingRoutes.materials)}
                  disabled={form.formState.isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isEditMode ? "Save changes" : "Create draft"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </MarketingPageShell>
  );
};

export default MarketingMaterialFormPage;
