import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AlertCircle, AlertTriangle, ArrowLeft, Loader2, RefreshCcw } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { fileStorageConfigApi } from "@/api/file-storage-config";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageIntro } from "@/features/console/shared";
import type { FileStorageConfig } from "@/types/file-storage-config";

const fileStorageConfigQueryKey = ["system", "file-upload-config"] as const;

const providerOptions = ["local", "oss", "minio"] as const;

const fileUploadConfigSchema = z
  .object({
    provider: z.string().trim().min(1, "Provider is required."),
    publicBaseUrl: z.string().trim().optional().default(""),
    localRootDir: z.string().trim().optional().default(""),
  })
  .superRefine((value, ctx) => {
    if (value.publicBaseUrl) {
      try {
        const parsed = new URL(value.publicBaseUrl);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          throw new Error("invalid protocol");
        }
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["publicBaseUrl"],
          message: "Public base URL must be a valid http or https URL.",
        });
      }
    }

    if (value.provider === "local" && !value.localRootDir.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["localRootDir"],
        message: "Local root directory is recommended for the local provider.",
      });
    }
  });

type FileUploadConfigFormValues = z.infer<typeof fileUploadConfigSchema>;

function toFormValues(config?: FileStorageConfig | null): FileUploadConfigFormValues {
  return {
    provider: String(config?.provider ?? "local"),
    publicBaseUrl: String(config?.publicBaseUrl ?? ""),
    localRootDir: String(config?.localRootDir ?? ""),
  };
}

function textOrDash(value?: string) {
  return value && value.trim() ? value : "-";
}

const FileUploadConfigPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const configQuery = useQuery({
    queryKey: fileStorageConfigQueryKey,
    queryFn: async () => (await fileStorageConfigApi.getConfig()).value,
    staleTime: 30_000,
  });

  const form = useForm<FileUploadConfigFormValues>({
    resolver: zodResolver(fileUploadConfigSchema),
    defaultValues: toFormValues(),
  });

  useEffect(() => {
    if (!configQuery.data) {
      return;
    }
    form.reset(toFormValues(configQuery.data));
  }, [configQuery.data, form]);

  const provider = form.watch("provider");
  const lastUpdatedAt = configQuery.data?.updatedAt ?? "";
  const nonLocalProviderSelected = provider !== "local";

  const infoLines = useMemo(
    () => [
      "local: local file system storage and the currently usable production option.",
      "oss: reserved configuration, not enabled yet.",
      "minio: reserved configuration, not enabled yet.",
      "Changing publicBaseUrl affects file URLs returned to the frontend.",
      "Changing localRootDir may break historical file access. Update carefully.",
    ],
    [],
  );

  async function handleRefresh() {
    await configQuery.refetch();
  }

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/dashboard");
  }

  async function onSubmit(values: FileUploadConfigFormValues) {
    const result = await fileStorageConfigApi.updateConfig({
      provider: values.provider.trim(),
      publicBaseUrl: values.publicBaseUrl.trim(),
      localRootDir: values.localRootDir.trim(),
    });

    queryClient.setQueryData(fileStorageConfigQueryKey, result.value);
    form.reset(toFormValues(result.value));
    toast.success("File storage configuration saved.");
  }

  if (configQuery.isLoading) {
    return (
      <div className="space-y-6 p-6">
        <PageIntro
          title="File Upload Config"
          description="Manage backend file storage provider settings used by upload and file object APIs."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button type="button" variant="outline" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading
              </Button>
            </div>
          }
        />
        <Card className="shadow-sm">
          <CardContent className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading file storage configuration...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (configQuery.isError) {
    return (
      <div className="space-y-6 p-6">
        <PageIntro
          title="File Upload Config"
          description="Manage backend file storage provider settings used by upload and file object APIs."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button type="button" variant="outline" onClick={() => void handleRefresh()} disabled={configQuery.isFetching}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          }
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load configuration</AlertTitle>
          <AlertDescription>
            {configQuery.error instanceof Error ? configQuery.error.message : "Request failed."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageIntro
        title="File Upload Config"
        description="View and update backend file storage settings. This page controls the provider and URL/path fields used by file upload and retrieval endpoints."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button type="button" variant="outline" onClick={() => void handleRefresh()} disabled={configQuery.isFetching || form.formState.isSubmitting}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        }
      />

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Storage behavior notes</AlertTitle>
        <AlertDescription>
          <ul className="list-disc space-y-1 pl-4">
            {infoLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>

      {nonLocalProviderSelected ? (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900 [&>svg]:text-amber-700">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Non-local provider selected</AlertTitle>
          <AlertDescription>
            The selected provider can still be saved, but only the local provider is currently production-ready. Keep the related path and URL values aligned with your backend deployment plan.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardDescription>Current provider</CardDescription>
            <CardTitle className="text-xl uppercase">{textOrDash(provider)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm md:col-span-2">
          <CardHeader className="pb-3">
            <CardDescription>Last updated</CardDescription>
            <CardTitle className="text-xl">{textOrDash(lastUpdatedAt)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Storage settings</CardTitle>
          <CardDescription>
            Update the active storage provider, the public base URL used in returned file links, and the local file system root directory.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-6 lg:grid-cols-2">
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {providerOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Supported options are local, oss, and minio. Only local is currently fully usable.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="publicBaseUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Public Base URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="http://localhost:8090" />
                      </FormControl>
                      <FormDescription>
                        Optional. If set, the value should be a valid http or https URL.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="localRootDir"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local Root Directory</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="F:/workSpace2028/file" />
                    </FormControl>
                    <FormDescription>
                      Primarily used by the local provider. The field stays editable for oss and minio so you can preserve planned values without switching providers back and forth.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FileUploadConfigPage;
