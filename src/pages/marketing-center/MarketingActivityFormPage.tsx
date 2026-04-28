import { useEffect } from "react";
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
  marketingActivityFormSchema,
  type MarketingActivityFormValues,
} from "@/features/marketing-center/form-schemas";
import {
  useMarketingActivityDetail,
  useMarketingTaxonomyCatalog,
} from "@/features/marketing-center/hooks";
import {
  EmptyState,
  FileObjectField,
  MarketingPageShell,
  TaxonomyMultiSelect,
  TaxonomySingleSelect,
} from "@/features/marketing-center/shared";
import { parseIdParam } from "@/features/marketing-center/utils";

const emptyValues: MarketingActivityFormValues = {
  title: "",
  description: "",
  languageId: 0,
  categoryId: 0,
  channelIds: [],
  scopeIds: [],
  coverFileId: undefined,
  carousel: false,
  landingUrl: "",
};

const MarketingActivityFormPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const activityId = parseIdParam(id);
  const isEditMode = activityId > 0;
  const taxonomyCatalog = useMarketingTaxonomyCatalog();
  const activityQuery = useMarketingActivityDetail(activityId, isEditMode);

  const form = useForm<MarketingActivityFormValues>({
    resolver: zodResolver(marketingActivityFormSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!activityQuery.data) {
      return;
    }

    form.reset({
      title: String(activityQuery.data.title ?? ""),
      description: String(activityQuery.data.description ?? ""),
      languageId: Number(activityQuery.data.language?.id ?? 0),
      categoryId: Number(activityQuery.data.category?.id ?? 0),
      channelIds: (activityQuery.data.channels ?? []).map((item) => Number(item.id ?? 0)).filter((value) => value > 0),
      scopeIds: (activityQuery.data.scopes ?? []).map((item) => Number(item.id ?? 0)).filter((value) => value > 0),
      coverFileId: Number(activityQuery.data.cover?.id ?? 0) || undefined,
      carousel: Boolean(activityQuery.data.carousel),
      landingUrl: String(activityQuery.data.landingUrl ?? ""),
    });
  }, [activityQuery.data, form]);

  async function onSubmit(values: MarketingActivityFormValues) {
    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      languageId: values.languageId,
      categoryId: values.categoryId,
      channelIds: values.channelIds,
      scopeIds: values.scopeIds,
      coverFileId: values.coverFileId,
      carousel: values.carousel,
      landingUrl: values.landingUrl.trim(),
    };

    if (isEditMode) {
      await marketingCenterApi.updateActivity({
        id: activityId,
        ...payload,
      });
      toast.success("Activity updated. Backend status will be reset to draft after edit.");
      await queryClient.invalidateQueries({ queryKey: ["marketing-center"] });
      navigate(marketingRoutes.activityDetail(activityId));
      return;
    }

    const result = await marketingCenterApi.createActivity(payload);
    const nextId = Number(result.value?.id ?? 0);
    toast.success("Activity created as draft.");
    await queryClient.invalidateQueries({ queryKey: ["marketing-center"] });
    if (nextId > 0) {
      navigate(marketingRoutes.activityDetail(nextId));
      return;
    }
    navigate(marketingRoutes.activities);
  }

  if (isEditMode && activityQuery.isLoading) {
    return (
      <MarketingPageShell
        title="Edit Activity"
        description="Loading the stored activity payload before entering edit mode."
      >
        <div className="flex h-64 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading activity...
        </div>
      </MarketingPageShell>
    );
  }

  if (isEditMode && !activityQuery.data) {
    return (
      <MarketingPageShell
        title="Edit Activity"
        description="The requested activity could not be loaded for editing."
      >
        <EmptyState
          title="Activity not found"
          description="The edit page requires a valid activity detail payload."
        />
      </MarketingPageShell>
    );
  }

  return (
    <MarketingPageShell
      title={isEditMode ? "Edit Activity" : "Create Activity"}
      description={
        isEditMode
          ? "Update an existing activity. Approved or published records are expected to fall back to draft after edit."
          : "Create a new marketing activity draft for later compliance review and publication."
      }
      actions={
        <div className="flex flex-wrap gap-2">
          {isEditMode ? (
            <Button asChild type="button" variant="outline">
              <Link to={marketingRoutes.activityDetail(activityId)}>View detail</Link>
            </Button>
          ) : null}
        </div>
      }
    >
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Activity form</CardTitle>
          <CardDescription>
            Create landing-page activities with taxonomy targeting, carousel support, and an optional cover asset.
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
                  name="landingUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Landing URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://example.com/landing" />
                      </FormControl>
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
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <TaxonomySingleSelect
                          items={taxonomyCatalog.data.TAXONOMY_TYPE_ACTIVITY_CATEGORY}
                          value={field.value || undefined}
                          placeholder="Select a category"
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
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <FormField
                  control={form.control}
                  name="coverFileId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FileObjectField
                          label="Cover file"
                          fileId={field.value}
                          requiredHint="Optional but recommended for carousel and listing presentations."
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="carousel"
                  render={({ field }) => (
                    <FormItem className="flex h-full items-center justify-between rounded-2xl border bg-muted/10 p-4">
                      <div className="space-y-2">
                        <FormLabel>Carousel</FormLabel>
                        <FormDescription>
                          Turn this on if the activity should be eligible for carousel placements.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(isEditMode ? marketingRoutes.activityDetail(activityId) : marketingRoutes.activities)}
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

export default MarketingActivityFormPage;
