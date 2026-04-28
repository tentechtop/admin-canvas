import { useEffect, useState } from "react";
import { Loader2, Plus, RefreshCcw, Rows3, ShieldAlert, Trash2 } from "lucide-react";
import { affiliateConsoleApi, CONSOLE_PLATFORM_CODE } from "@/api/affiliate-console";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BUSINESS_API_BASE_URL, BusinessHttpError, previewToText } from "@/lib/business-http";
import type {
  RoleDataPermissionConfig,
  RoleDataPermissionRelation,
  ScopeType,
} from "@/types/affiliate-console";
import {
  ACTION_OPTIONS,
  RESOURCE_OPTIONS,
  SCOPE_OPTIONS,
  buildKolPermissionSet,
} from "@/features/console/permission-constants";
import {
  EmptyState,
  Field,
  JsonPreviewCard,
  PageIntro,
  StatusBadge,
} from "@/features/console/shared";
import { controlClass, prettyJson } from "@/features/console/shared-utils";
import { toast } from "sonner";

interface PermissionRowValue {
  id: string;
  resourceCode: string;
  actionCode: string;
  scopeType: ScopeType;
}

function makePermissionRow(permission?: RoleDataPermissionRelation): PermissionRowValue {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    resourceCode: String(permission?.resourceCode || "kol"),
    actionCode: String(permission?.actionCode || "list"),
    scopeType: (String(permission?.scopeType || "SELF").toUpperCase() as ScopeType) || "SELF",
  };
}

function errorPreview(error: unknown) {
  if (error instanceof BusinessHttpError) {
    return previewToText(error.preview);
  }
  return {
    request: prettyJson({ error: "Unknown request error" }),
    response: prettyJson({ message: error instanceof Error ? error.message : String(error) }),
  };
}

const RoleDataPermissionPage = () => {
  const [platformCode, setPlatformCode] = useState(CONSOLE_PLATFORM_CODE);
  const [roles, setRoles] = useState<RoleDataPermissionConfig[]>([]);
  const [currentRoleCode, setCurrentRoleCode] = useState("");
  const [currentConfigId, setCurrentConfigId] = useState(0);
  const [editorEnabled, setEditorEnabled] = useState(true);
  const [editorRemark, setEditorRemark] = useState("");
  const [permissionRows, setPermissionRows] = useState<PermissionRowValue[]>([
    makePermissionRow(),
  ]);

  const [requestPreview, setRequestPreview] = useState("{}");
  const [responsePreview, setResponsePreview] = useState("{}");
  const [lastAction, setLastAction] = useState("No request yet.");

  const [loadingRoles, setLoadingRoles] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  function applyPreview(action: string, preview: { request: string; response: string }) {
    setLastAction(action);
    setRequestPreview(preview.request);
    setResponsePreview(preview.response);
  }

  function fillEditor(role?: RoleDataPermissionConfig | null) {
    setCurrentConfigId(Number(role?.id || 0));
    setCurrentRoleCode(role?.roleCode || "");
    setEditorEnabled(role?.enabled ?? true);
    setEditorRemark(role?.remark || "");
    const nextRows =
      (role?.permissions || []).length > 0
        ? (role?.permissions || []).map((permission) => makePermissionRow(permission))
        : [makePermissionRow()];
    setPermissionRows(nextRows);
  }

  async function loadRoles(silent = false) {
    setLoadingRoles(true);
    try {
      const result = await affiliateConsoleApi.listRoleDataPermissions(platformCode.trim() || CONSOLE_PLATFORM_CODE);
      setRoles(result.value.list ?? []);
      applyPreview("GET /admin/role-data-permissions/roles", previewToText(result.preview));
      const nextRole =
        (result.value.list ?? []).find((item) => item.roleCode === currentRoleCode) ||
        (result.value.list ?? [])[0] ||
        null;
      fillEditor(nextRole);
      if (!silent) {
        toast.success(`Loaded ${result.value.total ?? (result.value.list ?? []).length} role configs.`);
      }
    } catch (error) {
      applyPreview("GET /admin/role-data-permissions/roles failed", errorPreview(error));
    } finally {
      setLoadingRoles(false);
    }
  }

  function updatePermissionRow(id: string, patch: Partial<PermissionRowValue>) {
    setPermissionRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function removePermissionRow(id: string) {
    setPermissionRows((prev) => {
      const next = prev.filter((row) => row.id !== id);
      return next.length > 0 ? next : [makePermissionRow()];
    });
  }

  function collectPermissions(): RoleDataPermissionRelation[] {
    return permissionRows.map((row) => ({
      resourceCode: row.resourceCode,
      actionCode: row.actionCode,
      scopeType: row.scopeType,
    }));
  }

  async function saveCurrentConfig() {
    if (!currentRoleCode.trim()) {
      toast.error("Choose a role before saving.");
      return;
    }
    const permissions = collectPermissions();
    if (permissions.length === 0) {
      toast.error("At least one permission row is required.");
      return;
    }

    setSavingConfig(true);
    try {
      const result = await affiliateConsoleApi.saveRoleDataPermission({
        id: currentConfigId,
        platformCode: platformCode.trim() || CONSOLE_PLATFORM_CODE,
        roleCode: currentRoleCode.trim(),
        enabled: editorEnabled,
        remark: editorRemark.trim(),
        permissions,
      });
      applyPreview("POST /admin/role-data-permissions", previewToText(result.preview));
      toast.success(`Saved role data permission config for ${currentRoleCode}.`);
      await loadRoles(true);
    } catch (error) {
      applyPreview("POST /admin/role-data-permissions failed", errorPreview(error));
    } finally {
      setSavingConfig(false);
    }
  }

  async function deleteCurrentConfig(id = currentConfigId) {
    if (!id) {
      toast.error("Current role has no saved config.");
      return;
    }
    if (!window.confirm(`Delete role config #${id}?`)) {
      return;
    }
    setSavingConfig(true);
    try {
      const result = await affiliateConsoleApi.deleteRoleDataPermission(id);
      applyPreview("DELETE /admin/role-data-permissions/{id}", previewToText(result.preview));
      toast.success("Role data permission config deleted.");
      await loadRoles(true);
    } catch (error) {
      applyPreview("DELETE /admin/role-data-permissions/{id} failed", errorPreview(error));
    } finally {
      setSavingConfig(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const result = await affiliateConsoleApi.listRoleDataPermissions(CONSOLE_PLATFORM_CODE);
        if (cancelled) {
          return;
        }

        const list = result.value.list ?? [];
        const nextRole = list[0] || null;
        setRoles(list);
        setLastAction("GET /admin/role-data-permissions/roles");
        setRequestPreview(prettyJson(result.preview.request));
        setResponsePreview(prettyJson(result.preview.response));
        setCurrentConfigId(Number(nextRole?.id || 0));
        setCurrentRoleCode(nextRole?.roleCode || "");
        setEditorEnabled(nextRole?.enabled ?? true);
        setEditorRemark(nextRole?.remark || "");
        setPermissionRows(
          (nextRole?.permissions || []).length > 0
            ? (nextRole?.permissions || []).map((permission) => makePermissionRow(permission))
            : [makePermissionRow()],
        );
      } catch (error) {
        if (cancelled) {
          return;
        }
        const preview = errorPreview(error);
        setLastAction("GET /admin/role-data-permissions/roles failed");
        setRequestPreview(preview.request);
        setResponsePreview(preview.response);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageIntro
        title="Role Data Permission Editor"
        description="Edit raw resourceCode + actionCode + scopeType relations for each auth role. This page is the fine-grained counterpart to the KOL scenario presets."
        actions={
          <Button type="button" variant="secondary" onClick={() => void loadRoles()} disabled={loadingRoles}>
            {loadingRoles ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Reload roles
          </Button>
        }
      />

      <Alert>
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Direct relation editor</AlertTitle>
        <AlertDescription>
          Every row below maps to one stored relation: <code>resourceCode + actionCode + scopeType</code>. Use this page when presets are not enough and you need exact backend data-scope relations.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Business API base</CardDescription>
            <CardTitle className="break-all text-lg">{BUSINESS_API_BASE_URL || window.location.origin}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Current session</CardDescription>
            <CardTitle className="text-lg">READY</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Last request</CardDescription>
            <CardTitle className="text-lg">{lastAction}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Base config</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Field label="Platform code">
            <Input value={platformCode} onChange={(event) => setPlatformCode(event.target.value)} />
          </Field>
          <Field label="Current role">
            <select
              className={controlClass}
              value={currentRoleCode}
              onChange={(event) => {
                const role = roles.find((item) => item.roleCode === event.target.value) || null;
                fillEditor(role);
              }}
            >
              {roles.length === 0 ? (
                <option value="">Load roles first</option>
              ) : (
                roles.map((role) => (
                  <option key={role.roleCode} value={role.roleCode}>
                    {role.roleCode} - {role.roleName}
                  </option>
                ))
              )}
            </select>
          </Field>
          <div className="flex items-end">
            <Button type="button" variant="outline" className="w-full" onClick={() => void loadRoles()} disabled={loadingRoles}>
              <RefreshCcw className="h-4 w-4" />
              Reload current snapshot
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Role config list</CardTitle>
            <CardDescription>Auth roles merged with current local data-permission configs.</CardDescription>
          </CardHeader>
          <CardContent>
            {roles.length === 0 ? (
              <EmptyState title="No role configs loaded" description="Use Reload roles to query the current platform snapshot." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role code</TableHead>
                    <TableHead>Role name</TableHead>
                    <TableHead>Configured</TableHead>
                    <TableHead>Enabled</TableHead>
                    <TableHead>Permission rows</TableHead>
                    <TableHead className="w-[180px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.roleCode}>
                      <TableCell className="font-medium">{role.roleCode}</TableCell>
                      <TableCell>{role.roleName || "-"}</TableCell>
                      <TableCell>
                        <StatusBadge status={role.configured ? "CONFIGURED" : "UNSET"} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={role.enabled ? "ENABLED" : "DISABLED"} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(role.permissions || []).length > 0 ? (
                            (role.permissions || []).map((permission, index) => (
                              <Badge key={`${role.roleCode}-${permission.resourceCode}-${permission.actionCode}-${index}`} variant="outline">
                                {permission.resourceCode}:{permission.actionCode}={permission.scopeType}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="secondary">EMPTY</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => fillEditor(role)}>
                            Edit
                          </Button>
                          {role.id ? (
                            <Button type="button" variant="destructive" size="sm" onClick={() => void deleteCurrentConfig(Number(role.id))}>
                              Delete
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current role editor</CardTitle>
            <CardDescription>Edit exact permission relations for the selected role.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Role code">
                <Input value={currentRoleCode} readOnly />
              </Field>
              <Field label="Enabled">
                <select
                  className={controlClass}
                  value={editorEnabled ? "true" : "false"}
                  onChange={(event) => setEditorEnabled(event.target.value === "true")}
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </Field>
              <Field label="Remark">
                <Input value={editorRemark} onChange={(event) => setEditorRemark(event.target.value)} />
              </Field>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setPermissionRows((prev) => [...prev, makePermissionRow()])}>
                <Plus className="h-4 w-4" />
                Add permission row
              </Button>
              <Button type="button" variant="outline" onClick={() => setPermissionRows(buildKolPermissionSet("SELF").map((permission) => makePermissionRow(permission)))}>
                <Rows3 className="h-4 w-4" />
                Load KOL preset rows
              </Button>
              <Button type="button" onClick={() => void saveCurrentConfig()} disabled={savingConfig}>
                {savingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save current config
              </Button>
              <Button type="button" variant="destructive" onClick={() => void deleteCurrentConfig()} disabled={savingConfig || !currentConfigId}>
                Delete current config
              </Button>
            </div>

            <div className="space-y-3">
              {permissionRows.map((row) => (
                <div key={row.id} className="grid gap-3 rounded-xl border bg-muted/20 p-4 md:grid-cols-[1fr_1fr_1fr_auto]">
                  <Field label="resourceCode">
                    <select
                      className={controlClass}
                      value={row.resourceCode}
                      onChange={(event) => updatePermissionRow(row.id, { resourceCode: event.target.value })}
                    >
                      {RESOURCE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="actionCode">
                    <select
                      className={controlClass}
                      value={row.actionCode}
                      onChange={(event) => updatePermissionRow(row.id, { actionCode: event.target.value })}
                    >
                      {ACTION_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="scopeType">
                    <select
                      className={controlClass}
                      value={row.scopeType}
                      onChange={(event) => updatePermissionRow(row.id, { scopeType: event.target.value as ScopeType })}
                    >
                      {SCOPE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div className="flex items-end">
                    <Button type="button" variant="destructive" onClick={() => removePermissionRow(row.id)} className="w-full">
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <JsonPreviewCard title="Request preview" value={requestPreview} />
        <JsonPreviewCard title="Response preview" value={responsePreview} />
      </div>
    </div>
  );
};

export default RoleDataPermissionPage;
