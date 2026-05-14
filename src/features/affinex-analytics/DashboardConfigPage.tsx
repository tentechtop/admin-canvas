import { useEffect, useState } from "react";
import { Loader2, Save, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  configurableAffinexAnalyticsPages,
  getAffinexAnalyticsPageConfig,
  type AffinexAnalyticsResourceCode,
} from "@/features/affinex-analytics/config";
import {
  useAnalyticsDashboardConfig,
  useUpdateAnalyticsDashboardConfig,
} from "@/features/affinex-analytics/hooks";
import {
  AffinexPageShell,
  datePresetOptions,
  EmptyState,
  mergeDashboardWidgets,
  MetricTile,
  SectionCard,
} from "@/features/affinex-analytics/shared";
import { Field } from "@/features/console/shared";
import type { AnalyticsDatePreset, DashboardWidgetConfig } from "@/types/affinex";

export default function DashboardConfigPage() {
  const [resourceCode, setResourceCode] = useState<AffinexAnalyticsResourceCode>(
    configurableAffinexAnalyticsPages[0].resourceCode,
  );
  const page = getAffinexAnalyticsPageConfig(resourceCode);
  const configQuery = useAnalyticsDashboardConfig(resourceCode);
  const updateMutation = useUpdateAnalyticsDashboardConfig();
  const [defaultDatePreset, setDefaultDatePreset] = useState<
    AnalyticsDatePreset | ""
  >("");
  const [draftWidgets, setDraftWidgets] = useState<DashboardWidgetConfig[]>([]);

  useEffect(() => {
    if (page.kind !== "analytics" || configQuery.isPending) {
      return;
    }
    setDefaultDatePreset(
      configQuery.data?.defaultDatePreset || page.defaultDatePreset,
    );
    setDraftWidgets(
      mergeDashboardWidgets(page.defaultWidgets, configQuery.data?.widgets),
    );
  }, [configQuery.data, configQuery.isPending, page]);

  if (page.kind !== "analytics") {
    return null;
  }

  async function saveConfig() {
    const value = await updateMutation.mutateAsync({
      resourceCode,
      defaultDatePreset,
      widgets: draftWidgets
        .map((widget, index) => ({
          ...widget,
          sort: widget.sort || index + 1,
          title: widget.title.trim(),
        }))
        .sort((a, b) => a.sort - b.sort),
    });
    toast.success(`Saved dashboard config for ${value.resourceCode}.`);
  }

  return (
    <AffinexPageShell
      title="Dashboard Config"
      description="Configure default date presets and widget visibility for each Affinex analytics page. These settings are persisted per current admin user."
      actions={
        <Button
          type="button"
          onClick={() => void saveConfig()}
          disabled={
            updateMutation.isPending || configQuery.isPending || draftWidgets.length === 0
          }
        >
          {updateMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save config
        </Button>
      }
    >
      <SectionCard
        title="Dashboard target"
        description="Select the analytics page whose widgets and default date preset should be customized."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Analytics page">
            <Select
              value={resourceCode}
              onValueChange={(value) =>
                setResourceCode(value as AffinexAnalyticsResourceCode)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an analytics page" />
              </SelectTrigger>
              <SelectContent>
                {configurableAffinexAnalyticsPages.map((item) => (
                  <SelectItem key={item.resourceCode} value={item.resourceCode}>
                    {item.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Default date preset">
            <Select
              value={defaultDatePreset}
              onValueChange={(value) =>
                setDefaultDatePreset(value as AnalyticsDatePreset)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a default date preset" />
              </SelectTrigger>
              <SelectContent>
                {datePresetOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </SectionCard>

      <Alert>
        <Settings2 className="h-4 w-4" />
        <AlertTitle>Saved behavior</AlertTitle>
        <AlertDescription>
          The analytics pages read this config on load, merge it with the default widget set, and then request data from the matching
          <code className="mx-1 rounded bg-muted px-1 py-0.5">/admin/affinex/analytics/*</code>
          endpoint.
        </AlertDescription>
      </Alert>

      <SectionCard
        title="Widget configuration"
        description={
          configQuery.data?.updatedAt
            ? `Last updated at ${configQuery.data.updatedAt}.`
            : "No saved config yet. The defaults below will be saved on first submit."
        }
      >
        {configQuery.isPending ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading dashboard config...
          </div>
        ) : draftWidgets.length === 0 ? (
          <EmptyState
            title="No widgets available"
            description="This analytics page does not expose any configurable widgets."
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Widget Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Visible</TableHead>
                    <TableHead>Sort</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {draftWidgets.map((widget, index) => (
                    <TableRow key={widget.widgetCode}>
                      <TableCell className="font-mono text-xs">
                        {widget.widgetCode}
                      </TableCell>
                      <TableCell>
                        <Input
                          value={widget.title}
                          onChange={(event) =>
                            setDraftWidgets((current) =>
                              current.map((item) =>
                                item.widgetCode === widget.widgetCode
                                  ? { ...item, title: event.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={widget.visible}
                          onCheckedChange={(checked) =>
                            setDraftWidgets((current) =>
                              current.map((item) =>
                                item.widgetCode === widget.widgetCode
                                  ? { ...item, visible: checked }
                                  : item,
                              ),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="w-[120px]">
                        <Input
                          type="number"
                          min={1}
                          value={widget.sort}
                          onChange={(event) =>
                            setDraftWidgets((current) =>
                              current.map((item) =>
                                item.widgetCode === widget.widgetCode
                                  ? {
                                      ...item,
                                      sort:
                                        Number(event.target.value) || index + 1,
                                    }
                                  : item,
                              ),
                            )
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {draftWidgets
                .slice()
                .sort((a, b) => a.sort - b.sort)
                .map((widget) => (
                  <MetricTile
                    key={widget.widgetCode}
                    label={widget.widgetCode}
                    value={widget.visible ? "Visible" : "Hidden"}
                    hint={`Sort ${widget.sort} · ${widget.title || "Untitled widget"}`}
                  />
                ))}
            </div>
          </>
        )}
      </SectionCard>
    </AffinexPageShell>
  );
}
