import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { marketingCenterApi } from "@/api/marketing-center";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  marketingBatchLinkFormSchema,
  marketingGenerateLinkFormSchema,
  type MarketingBatchLinkFormValues,
  type MarketingGenerateLinkFormValues,
} from "@/features/marketing-center/form-schemas";
import {
  useMarketingLinks,
  useMarketingTaxonomyCatalog,
} from "@/features/marketing-center/hooks";
import {
  CopyButton,
  EmptyState,
  MarketingPageShell,
  OpenButton,
  PaginationBar,
  TaxonomySingleSelect,
  ValueCard,
} from "@/features/marketing-center/shared";
import { parseAffiliateIdsText, textOrDash } from "@/features/marketing-center/utils";
import type { MarketingActivityPromotionLink, MarketingLinksQuery } from "@/types/marketing-center";

const defaultQuery: MarketingLinksQuery = {
  page: 1,
  pageSize: 10,
  activityId: undefined,
  affiliateId: "",
  channelId: undefined,
};

const MarketingLinksPage = () => {
  const queryClient = useQueryClient();
  const taxonomyCatalog = useMarketingTaxonomyCatalog();
  const [listQuery, setListQuery] = useState<MarketingLinksQuery>(defaultQuery);
  const [lastGenerated, setLastGenerated] = useState<MarketingActivityPromotionLink | null>(null);
  const [lastBatchGenerated, setLastBatchGenerated] = useState<MarketingActivityPromotionLink[]>([]);

  const linksQuery = useMarketingLinks(listQuery);
  const channels = taxonomyCatalog.data.TAXONOMY_TYPE_CHANNEL;
  const items = linksQuery.data?.items ?? [];
  const total = linksQuery.data?.total ?? 0;

  const singleForm = useForm<MarketingGenerateLinkFormValues>({
    resolver: zodResolver(marketingGenerateLinkFormSchema),
    defaultValues: {
      activityId: 0,
      affiliateId: "",
      affiliateName: "",
      channelId: 0,
      forceRegenerate: false,
    },
  });

  const batchForm = useForm<MarketingBatchLinkFormValues>({
    resolver: zodResolver(marketingBatchLinkFormSchema),
    defaultValues: {
      activityId: 0,
      affiliateIdsText: "",
      channelId: 0,
      forceRegenerate: false,
    },
  });

  const batchPreviewCount = parseAffiliateIdsText(batchForm.watch("affiliateIdsText")).length;

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["marketing-center", "links"] });
  }

  async function submitSingle(values: MarketingGenerateLinkFormValues) {
    const result = await marketingCenterApi.generateLink({
      activityId: values.activityId,
      affiliateId: values.affiliateId.trim(),
      affiliateName: values.affiliateName.trim(),
      channelId: values.channelId,
      forceRegenerate: values.forceRegenerate,
    });
    setLastGenerated(result.value ?? null);
    setLastBatchGenerated([]);
    toast.success("Promotion link generated.");
    await queryClient.invalidateQueries({ queryKey: ["marketing-center", "links"] });
  }

  async function submitBatch(values: MarketingBatchLinkFormValues) {
    const affiliateIds = parseAffiliateIdsText(values.affiliateIdsText);
    if (affiliateIds.length === 0) {
      toast.error("Enter at least one affiliate ID.");
      return;
    }

    const result = await marketingCenterApi.batchGenerateLinks({
      activityId: values.activityId,
      affiliateIds,
      channelId: values.channelId,
      forceRegenerate: values.forceRegenerate,
    });
    setLastBatchGenerated(result.value);
    setLastGenerated(null);
    toast.success(`Generated ${result.value.length} promotion links.`);
    await queryClient.invalidateQueries({ queryKey: ["marketing-center", "links"] });
  }

  return (
    <MarketingPageShell
      title="Attribution Links"
      description="Generate single or batch activity-specific promotion links, inspect stored links, and copy long or short URLs quickly."
      actions={
        <Button type="button" variant="outline" onClick={() => void refresh()} disabled={linksQuery.isFetching}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      }
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Generate single link</CardTitle>
            <CardDescription>
              Provide activity, affiliate, and channel identifiers to create or refresh one marketing attribution link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...singleForm}>
              <form className="space-y-4" onSubmit={singleForm.handleSubmit(submitSingle)}>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={singleForm.control}
                    name="activityId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activity ID</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={singleForm.control}
                    name="channelId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Channel</FormLabel>
                        <FormControl>
                          <TaxonomySingleSelect
                            items={channels}
                            value={field.value || undefined}
                            placeholder="Select a channel"
                            onChange={(value) => field.onChange(value ?? 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={singleForm.control}
                    name="affiliateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Affiliate ID</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={singleForm.control}
                    name="affiliateName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Affiliate name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={singleForm.control}
                  name="forceRegenerate"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-2xl border bg-muted/10 p-4">
                      <div className="space-y-1">
                        <FormLabel>Force regenerate</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Regenerate even if a matching promotion link already exists.
                        </div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={singleForm.formState.isSubmitting}>
                    {singleForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Generate
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Batch generate links</CardTitle>
            <CardDescription>
              Generate promotion links for multiple affiliates in one request using a comma or line separated affiliate ID list.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...batchForm}>
              <form className="space-y-4" onSubmit={batchForm.handleSubmit(submitBatch)}>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={batchForm.control}
                    name="activityId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activity ID</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={batchForm.control}
                    name="channelId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Channel</FormLabel>
                        <FormControl>
                          <TaxonomySingleSelect
                            items={channels}
                            value={field.value || undefined}
                            placeholder="Select a channel"
                            onChange={(value) => field.onChange(value ?? 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={batchForm.control}
                  name="affiliateIdsText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Affiliate IDs</FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-[140px] font-mono text-xs"
                          placeholder={"affiliate-a\naffiliate-b\naffiliate-c"}
                          {...field}
                        />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        Parsed affiliate IDs: {batchPreviewCount}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={batchForm.control}
                  name="forceRegenerate"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-2xl border bg-muted/10 p-4">
                      <div className="space-y-1">
                        <FormLabel>Force regenerate</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Regenerate even if matching promotion links already exist.
                        </div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={batchForm.formState.isSubmitting}>
                    {batchForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Batch generate
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {lastGenerated ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <ValueCard label="Latest affiliate" value={textOrDash(lastGenerated.affiliateName || lastGenerated.affiliateId)} />
          <ValueCard label="Latest long URL" value={textOrDash(lastGenerated.longUrl)} mono actions={<CopyButton value={lastGenerated.longUrl} />} />
          <ValueCard label="Latest short URL" value={textOrDash(lastGenerated.shortUrl)} mono actions={<CopyButton value={lastGenerated.shortUrl} />} />
        </div>
      ) : null}

      {lastBatchGenerated.length > 0 ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Last batch result</CardTitle>
            <CardDescription>
              The most recent batch generation response returned {lastBatchGenerated.length} links.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto rounded-2xl border p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affiliate ID</TableHead>
                  <TableHead>Affiliate Name</TableHead>
                  <TableHead>Short URL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lastBatchGenerated.map((item) => (
                  <TableRow key={`${item.activityId}-${item.affiliateId}-${item.shortUrl}`}>
                    <TableCell className="font-mono text-xs">{textOrDash(item.affiliateId)}</TableCell>
                    <TableCell>{textOrDash(item.affiliateName)}</TableCell>
                    <TableCell className="max-w-[360px] break-all">{textOrDash(item.shortUrl)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Stored links</CardTitle>
          <CardDescription>
            Query previously generated activity promotion links and copy the long or short URL directly from the table.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Activity ID</span>
              <Input
                type="number"
                value={listQuery.activityId ?? ""}
                onChange={(event) =>
                  setListQuery((current) => ({
                    ...current,
                    activityId: Number(event.target.value) || undefined,
                    page: 1,
                  }))
                }
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Affiliate ID</span>
              <Input
                value={listQuery.affiliateId ?? ""}
                onChange={(event) =>
                  setListQuery((current) => ({
                    ...current,
                    affiliateId: event.target.value,
                    page: 1,
                  }))
                }
              />
            </label>
            <div className="space-y-2 text-sm">
              <span className="font-medium">Channel</span>
              <TaxonomySingleSelect
                items={channels}
                value={listQuery.channelId}
                placeholder="All channels"
                onChange={(value) =>
                  setListQuery((current) => ({
                    ...current,
                    channelId: value,
                    page: 1,
                  }))
                }
              />
            </div>
          </div>

          {linksQuery.isLoading ? (
            <div className="flex h-52 items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading promotion links...
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="No promotion links"
              description="Generate a link or broaden the list filters."
            />
          ) : (
            <>
              <div className="overflow-x-auto rounded-2xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Activity</TableHead>
                      <TableHead>Affiliate ID</TableHead>
                      <TableHead>Affiliate Name</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Long URL</TableHead>
                      <TableHead>Short URL</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{textOrDash(item.activityId)}</TableCell>
                        <TableCell className="font-mono text-xs">{textOrDash(item.affiliateId)}</TableCell>
                        <TableCell>{textOrDash(item.affiliateName)}</TableCell>
                        <TableCell>{textOrDash(item.channel?.name)}</TableCell>
                        <TableCell className="min-w-[220px]">
                          <div className="space-y-2">
                            <div className="break-all text-xs">{textOrDash(item.longUrl)}</div>
                            <div className="flex flex-wrap gap-2">
                              <CopyButton value={item.longUrl} label="Copy" />
                              <OpenButton href={item.longUrl} label="Open" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[220px]">
                          <div className="space-y-2">
                            <div className="break-all text-xs">{textOrDash(item.shortUrl)}</div>
                            <div className="flex flex-wrap gap-2">
                              <CopyButton value={item.shortUrl} label="Copy" />
                              <OpenButton href={item.shortUrl} label="Open" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{textOrDash(item.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <PaginationBar
                page={listQuery.page}
                pageSize={listQuery.pageSize}
                total={total}
                loading={linksQuery.isFetching}
                onPrev={() =>
                  setListQuery((current) => ({
                    ...current,
                    page: Math.max(1, current.page - 1),
                  }))
                }
                onNext={() =>
                  setListQuery((current) => ({
                    ...current,
                    page: current.page + 1,
                  }))
                }
              />
            </>
          )}
        </CardContent>
      </Card>
    </MarketingPageShell>
  );
};

export default MarketingLinksPage;
