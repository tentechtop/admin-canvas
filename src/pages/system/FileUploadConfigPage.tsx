import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, Loader2, RefreshCcw } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageIntro } from "@/features/console/shared";
import type {
  FileStorageConfig,
  FileStorageConfigProvider,
  FileStorageConfigType,
} from "@/types/file-storage-config";

function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

const fileUploadConfigSchema = z
  .object({
    provider: z.enum(["local", "coss"]),
    uploadUrl: z.string().trim().optional().default(""),
    publicBaseUrl: z.string().trim().optional().default(""),
    localRootDir: z.string().trim().optional().default(""),
  })
  .superRefine((value, ctx) => {
    if (value.uploadUrl && !isValidHttpUrl(value.uploadUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["uploadUrl"],
        message: "Upload URL must be a valid http or https URL.",
      });
    }

    if (value.publicBaseUrl && !isValidHttpUrl(value.publicBaseUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["publicBaseUrl"],
        message: "Public base URL must be a valid http or https URL.",
      });
    }

    if (value.provider === "coss") {
      if (!value.uploadUrl.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["uploadUrl"],
          message: "Upload URL is required for COSS.",
        });
      }

      if (!value.publicBaseUrl.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["publicBaseUrl"],
          message: "Public base URL is required for COSS.",
        });
      }
    }

    if (value.provider === "local" && !value.localRootDir.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["localRootDir"],
        message: "Local root directory is required for Local storage.",
      });
    }
  });

type FileUploadConfigFormValues = z.infer<typeof fileUploadConfigSchema>;

const storageTabs: Array<{
  value: FileStorageConfigType;
  label: string;
  description: string;
}> = [
  {
    value: "local",
    label: "Local",
    description: "配置本地文件存储使用的访问地址与根目录。",
  },
  {
    value: "coss",
    label: "COSS",
    description: "配置 COSS 使用的上传地址与公开访问地址。",
  },
];

function getFileStorageConfigQueryKey(type: FileStorageConfigType) {
  return ["system", "file-storage-config", type] as const;
}

function toFormValues(
  provider: FileStorageConfigProvider,
  config?: FileStorageConfig | null,
): FileUploadConfigFormValues {
  return {
    provider,
    uploadUrl: String(config?.uploadUrl ?? ""),
    publicBaseUrl: String(config?.publicBaseUrl ?? ""),
    localRootDir: String(config?.localRootDir ?? ""),
  };
}

function textOrDash(value?: string) {
  return value && value.trim() ? value : "-";
}

function StorageConfigTabPanel({
  type,
  isActive,
}: {
  type: FileStorageConfigType;
  isActive: boolean;
}) {
  const configQuery = useQuery({
    queryKey: getFileStorageConfigQueryKey(type),
    queryFn: async () => (await fileStorageConfigApi.getConfig(type)).value,
    enabled: isActive,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const form = useForm<FileUploadConfigFormValues>({
    resolver: zodResolver(fileUploadConfigSchema),
    defaultValues: toFormValues(type),
  });

  useEffect(() => {
    form.reset(toFormValues(type, configQuery.data));
  }, [configQuery.data, form, type]);

  async function handleRefresh() {
    await configQuery.refetch();
  }

  async function onSubmit(values: FileUploadConfigFormValues) {
    const result = await fileStorageConfigApi.updateConfig({
      provider: type,
      uploadUrl: type === "coss" ? values.uploadUrl.trim() : "",
      publicBaseUrl: values.publicBaseUrl.trim(),
      localRootDir: type === "local" ? values.localRootDir.trim() : "",
    });

    form.reset(toFormValues(type, result.value));
    toast.success(`${type === "local" ? "Local" : "COSS"} 配置已保存。`);
    await handleRefresh();
  }

  if (configQuery.isLoading && !configQuery.data) {
    return (
      <Card className="shadow-sm">
        <CardContent className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          正在加载 {type === "local" ? "Local" : "COSS"} 配置...
        </CardContent>
      </Card>
    );
  }

  if (configQuery.isError && !configQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>配置加载失败</AlertTitle>
        <AlertDescription className="space-y-3">
          <div>{configQuery.error instanceof Error ? configQuery.error.message : "请求失败。"}</div>
          <Button type="button" variant="outline" onClick={() => void handleRefresh()} disabled={configQuery.isFetching}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            重试
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>{type === "local" ? "Local 存储配置" : "COSS 存储配置"}</CardTitle>
          <CardDescription>
            {type === "local"
              ? "Local 需要填写 publicBaseUrl、localRootDir。"
              : "COSS 需要填写 publicBaseUrl、uploadUrl。"}
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleRefresh()}
          disabled={configQuery.isFetching || form.formState.isSubmitting}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-6 lg:grid-cols-2">
              <FormField
                control={form.control}
                name="publicBaseUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>publicBaseUrl</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="https://demo-resource.mistorebox.com"
                      />
                    </FormControl>
                    <FormDescription>
                      {type === "local"
                        ? "Local 可填写该访问前缀。"
                        : "COSS 必填，作为文件公开访问前缀。"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {type === "coss" ? (
                <FormField
                  control={form.control}
                  name="uploadUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>uploadUrl</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://demo-resource.mistorebox.com/api/op/resource/v1/file/upload" />
                      </FormControl>
                      <FormDescription>COSS 必填，上传接口地址需要在这里填写。</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="localRootDir"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>localRootDir</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="F:/workSpace2028/file" />
                      </FormControl>
                      <FormDescription>Local 必填，服务端本地存储根目录。</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="grid gap-2">
                <span className="text-sm font-medium text-foreground">provider</span>
                <Input value={type} readOnly disabled />
              </div>
              <div className="grid gap-2">
                <span className="text-sm font-medium text-foreground">updatedAt</span>
                <Input value={textOrDash(configQuery.data?.updatedAt)} readOnly disabled />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                保存
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

const FileUploadConfigPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FileStorageConfigType>("local");

  const infoLines = useMemo(
    () => [
      "Local Tab 固定请求 GET /admin/file_storage/config?type=local。",
      "COSS Tab 固定请求 GET /admin/file_storage/config?type=coss。",
      "Local 保存时提交 publicBaseUrl、localRootDir，uploadUrl 会传空字符串。",
      "COSS 保存时需要填写 publicBaseUrl、uploadUrl，localRootDir 会传空字符串。",
    ],
    [],
  );

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/dashboard");
  }

  return (
    <div className="space-y-6 p-6">
      <PageIntro
        title="文件存储配置"
        description="管理 Local 与 COSS 两类文件存储配置。每个 Tab 都会独立加载、独立保存，不互相影响。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回
            </Button>
          </div>
        }
      />

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>配置说明</AlertTitle>
        <AlertDescription>
          <ul className="list-disc space-y-1 pl-4">
            {infoLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FileStorageConfigType)} className="space-y-4">
        <TabsList className="grid h-auto grid-cols-2 gap-2 rounded-2xl bg-transparent p-0 md:w-[320px]">
          {storageTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="rounded-xl border data-[state=active]:border-primary">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {storageTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">{tab.label}</CardTitle>
                <CardDescription>{tab.description}</CardDescription>
              </CardHeader>
            </Card>
            <StorageConfigTabPanel type={tab.value} isActive={activeTab === tab.value} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default FileUploadConfigPage;
