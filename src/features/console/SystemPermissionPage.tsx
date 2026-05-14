import { useEffect, useMemo, useState } from "react";
import {
  CheckCheck,
  Loader2,
  Plus,
  RefreshCcw,
  Rows3,
  Search,
  Shield,
  TestTube2,
  Trash2,
  UserRoundSearch,
} from "lucide-react";
import { toast } from "sonner";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BUSINESS_API_BASE_URL, BusinessHttpError, previewToText } from "@/lib/business-http";
import type {
  AuthUserInfo,
  KolPerformanceQuery,
  KolUserQuery,
  RoleDataPermissionConfig,
  RoleDataPermissionRelation,
  ScopeType,
} from "@/types/affiliate-console";
import {
  ACTION_OPTIONS,
  RESOURCE_OPTIONS,
  SCOPE_OPTIONS,
  buildKolPermissionSet,
  KOL_RESOURCE,
} from "@/features/console/permission-constants";
import {
  EmptyState,
  Field,
  JsonPreviewCard,
  PageIntro,
  StatCard,
  StatusBadge,
} from "@/features/console/shared";
import { controlClass, prettyJson } from "@/features/console/shared-utils";

interface PermissionRowValue {
  id: string;
  resourceCode: string;
  actionCode: string;
  scopeType: ScopeType;
}

const EMPTY_KOL_USER_QUERY: KolUserQuery = {
  adminId: "",
  affiliateCode: "",
  affiliateName: "",
  affiliateMail: "",
  medium: "",
  page: "1",
  pageSize: "20",
};

const EMPTY_KOL_PERFORMANCE_QUERY: KolPerformanceQuery = {
  adminId: "",
  affiliateCode: "",
  startDate: "",
  endDate: "",
  email: "",
  owner: "",
  page: "1",
  pageSize: "20",
};

function parseRoleCodes(raw: string) {
  return raw
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, list) => list.indexOf(item) === index);
}

function makePermissionRow(permission?: RoleDataPermissionRelation): PermissionRowValue {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    resourceCode: String(permission?.resourceCode || KOL_RESOURCE),
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

function deriveEditorState(role?: RoleDataPermissionConfig | null) {
  const kolPermission =
    (role?.permissions || []).find((item) => item.resourceCode === KOL_RESOURCE) || null;

  return {
    roleCode: role?.roleCode || "",
    scopeType: (kolPermission?.scopeType as ScopeType) || "SELF",
    enabled: role?.enabled ?? true,
    remark: role?.remark || "",
    permissions:
      (role?.permissions || []).length > 0
        ? (role?.permissions || []).map((permission) => makePermissionRow(permission))
        : [makePermissionRow()],
  };
}

const SystemPermissionPage = () => {
  const [platformCode, setPlatformCode] = useState(CONSOLE_PLATFORM_CODE);
  const [validateRoleCodesText, setValidateRoleCodesText] = useState("KOL_BD");
  const [authUserRoleCodesText, setAuthUserRoleCodesText] = useState("KOL_BD");
  const [authUserKeyword, setAuthUserKeyword] = useState("");

  const [roles, setRoles] = useState<RoleDataPermissionConfig[]>([]);
  const [selectedRoleCode, setSelectedRoleCode] = useState("");
  const [selectedConfigId, setSelectedConfigId] = useState(0);
  const [editorScopeType, setEditorScopeType] = useState<ScopeType>("SELF");
  const [editorEnabled, setEditorEnabled] = useState(true);
  const [editorRemark, setEditorRemark] = useState("");
  const [permissionRows, setPermissionRows] = useState<PermissionRowValue[]>([makePermissionRow()]);

  const [authUsers, setAuthUsers] = useState<AuthUserInfo[]>([]);
  const [kolUserQuery, setKolUserQuery] = useState<KolUserQuery>(EMPTY_KOL_USER_QUERY);
  const [kolPerformanceQuery, setKolPerformanceQuery] =
    useState<KolPerformanceQuery>(EMPTY_KOL_PERFORMANCE_QUERY);

  const [requestPreview, setRequestPreview] = useState("{}");
  const [responsePreview, setResponsePreview] = useState("{}");
  const [lastAction, setLastAction] = useState("No request yet.");

  const [loadingRoles, setLoadingRoles] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [runningTest, setRunningTest] = useState("");

  const currentRole = useMemo(
    () => roles.find((item) => item.roleCode === selectedRoleCode) || null,
    [roles, selectedRoleCode],
  );

  function applyPreview(action: string, preview: { request: string; response: string }) {
    setLastAction(action);
    setRequestPreview(preview.request);
    setResponsePreview(preview.response);
  }

  function syncEditor(nextRole?: RoleDataPermissionConfig | null) {
    const next = deriveEditorState(nextRole);
    setSelectedConfigId(Number(nextRole?.id || 0));
    setSelectedRoleCode(next.roleCode);
    setEditorScopeType(next.scopeType);
    setEditorEnabled(next.enabled);
    setEditorRemark(next.remark);
    setPermissionRows(next.permissions);
  }

  async function loadRoles(silent = false) {
    setLoadingRoles(true);
    try {
      const result = await affiliateConsoleApi.listRoleDataPermissions(
        platformCode.trim() || CONSOLE_PLATFORM_CODE,
      );
      const list = result.value.list ?? [];
      const nextRole =
        list.find((item) => item.roleCode === selectedRoleCode) ||
        list.find((item) => item.roleCode === currentRole?.roleCode) ||
        list[0] ||
        null;

      setRoles(list);
      syncEditor(nextRole);
      applyPreview("GET /admin/role-data-permissions/roles", previewToText(result.preview));
      if (!silent) {
        toast.success(`Loaded ${result.value.total ?? list.length} role configs.`);
      }
    } catch (error) {
      applyPreview("GET /admin/role-data-permissions/roles failed", errorPreview(error));
    } finally {
      setLoadingRoles(false);
    }
  }

  function collectPermissions(): RoleDataPermissionRelation[] {
    return permissionRows.map((row) => ({
      resourceCode: row.resourceCode,
      actionCode: row.actionCode,
      scopeType: row.scopeType,
    }));
  }

  async function saveRolePreset(
    roleCode: string,
    scopeType: ScopeType,
    enabled: boolean,
    remark: string,
  ) {
    if (!roleCode.trim()) {
      toast.error("Choose a role before saving.");
      return;
    }

    setSavingConfig(true);
    try {
      const targetRole = roles.find((item) => item.roleCode === roleCode) || null;
      const result = await affiliateConsoleApi.saveRoleDataPermission({
        id: Number(targetRole?.id || (roleCode === selectedRoleCode ? selectedConfigId : 0) || 0),
        platformCode: platformCode.trim() || CONSOLE_PLATFORM_CODE,
        roleCode: roleCode.trim(),
        enabled,
        remark: remark.trim(),
        permissions: buildKolPermissionSet(scopeType),
      });
      applyPreview("POST /admin/role-data-permissions", previewToText(result.preview));
      toast.success(`Saved ${roleCode} => ${scopeType}.`);
      await loadRoles(true);
    } catch (error) {
      applyPreview("POST /admin/role-data-permissions failed", errorPreview(error));
    } finally {
      setSavingConfig(false);
    }
  }

  async function saveRawConfig() {
    if (!selectedRoleCode.trim()) {
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
        id: selectedConfigId,
        platformCode: platformCode.trim() || CONSOLE_PLATFORM_CODE,
        roleCode: selectedRoleCode.trim(),
        enabled: editorEnabled,
        remark: editorRemark.trim(),
        permissions,
      });
      applyPreview("POST /admin/role-data-permissions", previewToText(result.preview));
      toast.success(`Saved raw permission config for ${selectedRoleCode}.`);
      await loadRoles(true);
    } catch (error) {
      applyPreview("POST /admin/role-data-permissions failed", errorPreview(error));
    } finally {
      setSavingConfig(false);
    }
  }

  async function deleteRoleConfig(id = Number(currentRole?.id || selectedConfigId || 0)) {
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
      toast.success("Role config deleted.");
      await loadRoles(true);
    } catch (error) {
      applyPreview("DELETE /admin/role-data-permissions/{id} failed", errorPreview(error));
    } finally {
      setSavingConfig(false);
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

  async function loadAuthUsers() {
    const roleCodes = parseRoleCodes(authUserRoleCodesText);
    if (roleCodes.length === 0) {
      toast.error("Fill at least one role code before loading auth users.");
      return;
    }

    setLoadingUsers(true);
    try {
      const result = await affiliateConsoleApi.listAuthUsers({
        platformCode: platformCode.trim() || CONSOLE_PLATFORM_CODE,
        roleCodes,
        keyword: authUserKeyword.trim(),
      });
      setAuthUsers(result.value.list ?? []);
      applyPreview("GET /admin/auth/users", previewToText(result.preview));
      toast.success(`Loaded ${result.value.total ?? (result.value.list ?? []).length} auth users.`);
    } catch (error) {
      applyPreview("GET /admin/auth/users failed", errorPreview(error));
    } finally {
      setLoadingUsers(false);
    }
  }

  async function validateToken() {
    const roleCodes = parseRoleCodes(validateRoleCodesText);
    if (roleCodes.length === 0) {
      toast.error("Fill at least one role code before validation.");
      return;
    }

    try {
      const result = await affiliateConsoleApi.listAuthUsers({
        platformCode: platformCode.trim() || CONSOLE_PLATFORM_CODE,
        roleCodes,
      });
      applyPreview("GET /admin/auth/users (validate token)", previewToText(result.preview));
      toast.success("Current session can access protected admin APIs.");
    } catch (error) {
      applyPreview("GET /admin/auth/users (validate token) failed", errorPreview(error));
    }
  }

  async function initScenario() {
    await saveRolePreset("KOL_BD", "SELF", true, "Console preset: KOL_BD -> SELF");
    await saveRolePreset("KOL_ADMIN", "ALL", true, "Console preset: KOL_ADMIN -> ALL");
    await saveRolePreset("KOL_MANAGE", "ALL", true, "Console preset: KOL_MANAGE -> ALL");
    await saveRolePreset("kol-admin", "ALL", true, "Console preset: kol-admin -> ALL");
  }

  function useAdminId(adminId?: number | string) {
    const value = String(adminId ?? "");
    setKolUserQuery((prev) => ({ ...prev, adminId: value }));
    setKolPerformanceQuery((prev) => ({ ...prev, adminId: value }));
  }

  async function testKolUsers() {
    setRunningTest("kol-user");
    try {
      const result = await affiliateConsoleApi.listKolUsers(kolUserQuery);
      applyPreview("GET /kol_user/list", previewToText(result.preview));
      toast.success(
        `kol_user/list returned ${result.value.total ?? (result.value.userInfo ?? []).length} rows.`,
      );
    } catch (error) {
      applyPreview("GET /kol_user/list failed", errorPreview(error));
    } finally {
      setRunningTest("");
    }
  }

  async function testKolPerformance() {
    setRunningTest("kol-performance");
    try {
      const result = await affiliateConsoleApi.listKolPerformance(kolPerformanceQuery);
      applyPreview("GET /kol_performance/admin", previewToText(result.preview));
      toast.success(
        `kol_performance/admin returned ${
          result.value.total ?? (result.value.kolPerformance ?? []).length
        } rows.`,
      );
    } catch (error) {
      applyPreview("GET /kol_performance/admin failed", errorPreview(error));
    } finally {
      setRunningTest("");
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
        syncEditor(nextRole);
        setLastAction("GET /admin/role-data-permissions/roles");
        setRequestPreview(prettyJson(result.preview.request));
        setResponsePreview(prettyJson(result.preview.response));
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
        title="System Permission Console"
        description="在一个入口里完成角色权限配置、原始权限关系编辑、角色用户查询，以及 KOL 权限验证测试，沿用现有后台接口实现，不改后端逻辑。"
        actions={
          <Button
            type="button"
            variant="secondary"
            onClick={() => void loadRoles()}
            disabled={loadingRoles}
          >
            {loadingRoles ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            Reload roles
          </Button>
        }
      />

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Unified route for permission operations</AlertTitle>
        <AlertDescription>
          This page merges the reference HTML flows into <code>/system/permission</code>:
          scenario-based role permission presets, raw permission-row editing, role user lookup,
          and endpoint verification for KOL data scope.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard
          label="Business API base"
          value={
            <span className="break-all text-lg">
              {BUSINESS_API_BASE_URL || window.location.origin}
            </span>
          }
        />
        <StatCard label="Platform code" value={<span className="text-lg">{platformCode}</span>} />
        <StatCard label="Loaded roles" value={<span className="text-lg">{roles.length}</span>} />
        <StatCard
          label="Last request"
          value={<span className="break-words text-base">{lastAction}</span>}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Session validation</CardTitle>
            <CardDescription>
              Use the current login session to validate admin APIs. No extra backend changes are
              required.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Field label="Platform code">
              <Input value={platformCode} onChange={(event) => setPlatformCode(event.target.value)} />
            </Field>
            <Field label="Role codes for validation">
              <Input
                value={validateRoleCodesText}
                onChange={(event) => setValidateRoleCodesText(event.target.value)}
                placeholder="KOL_BD,KOL_ADMIN"
              />
            </Field>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => void validateToken()}
                className="w-full"
              >
                <CheckCheck className="h-4 w-4" />
                Validate current session
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick role presets</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button type="button" variant="outline" onClick={() => void initScenario()} disabled={savingConfig}>
              Init recommended scenario
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                void saveRolePreset("KOL_BD", "SELF", true, "Console preset: KOL_BD -> SELF")
              }
              disabled={savingConfig}
            >
              KOL_BD = SELF
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                void saveRolePreset("KOL_ADMIN", "ALL", true, "Console preset: KOL_ADMIN -> ALL")
              }
              disabled={savingConfig}
            >
              KOL_ADMIN = ALL
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                void saveRolePreset("KOL_MANAGE", "ALL", true, "Console preset: KOL_MANAGE -> ALL")
              }
              disabled={savingConfig}
            >
              KOL_MANAGE = ALL
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() =>
                void saveRolePreset(
                  selectedRoleCode,
                  "NONE",
                  true,
                  `Console preset: ${selectedRoleCode} -> NONE`,
                )
              }
              disabled={savingConfig || !selectedRoleCode}
            >
              Current role = NONE
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Role config list</CardTitle>
            <CardDescription>
              Roles returned from auth merged with current role data permission configs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {roles.length === 0 ? (
              <EmptyState
                title="No roles loaded"
                description="Use Reload roles to fetch the current platform role snapshot."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role code</TableHead>
                    <TableHead>Role name</TableHead>
                    <TableHead>Configured</TableHead>
                    <TableHead>Enabled</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="w-[260px]">Actions</TableHead>
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
                              <Badge
                                key={`${role.roleCode}-${permission.resourceCode}-${permission.actionCode}-${index}`}
                                variant="outline"
                              >
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
                          <Button type="button" variant="outline" size="sm" onClick={() => syncEditor(role)}>
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              void saveRolePreset(
                                String(role.roleCode || ""),
                                "SELF",
                                true,
                                `Console preset: ${role.roleCode} -> SELF`,
                              )
                            }
                          >
                            SELF
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              void saveRolePreset(
                                String(role.roleCode || ""),
                                "ALL",
                                true,
                                `Console preset: ${role.roleCode} -> ALL`,
                              )
                            }
                          >
                            ALL
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              void saveRolePreset(
                                String(role.roleCode || ""),
                                "NONE",
                                true,
                                `Console preset: ${role.roleCode} -> NONE`,
                              )
                            }
                          >
                            NONE
                          </Button>
                          {role.id ? (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => void deleteRoleConfig(Number(role.id))}
                            >
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
            <CardTitle className="text-lg">Role editor</CardTitle>
            <CardDescription>
              Manage the selected role through either KOL presets or raw permission rows.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>Current role:</span>
                <Badge variant="outline">{selectedRoleCode || "Not selected"}</Badge>
                <span>KOL scope:</span>
                <StatusBadge status={editorScopeType} />
                <span>Status:</span>
                <StatusBadge status={editorEnabled ? "ENABLED" : "DISABLED"} />
              </div>
            </div>

            <Tabs defaultValue="preset" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preset">Scenario preset</TabsTrigger>
                <TabsTrigger value="raw">Raw relations</TabsTrigger>
              </TabsList>

              <TabsContent value="preset" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Role">
                    <select
                      className={controlClass}
                      value={selectedRoleCode}
                      onChange={(event) => {
                        const role =
                          roles.find((item) => item.roleCode === event.target.value) || null;
                        syncEditor(role);
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
                  <Field label="Scope">
                    <select
                      className={controlClass}
                      value={editorScopeType}
                      onChange={(event) => setEditorScopeType(event.target.value as ScopeType)}
                    >
                      {SCOPE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
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

                <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                  Saving this tab writes the standard KOL permission bundle:
                  <code className="mx-1">kol:list</code>
                  <code className="mx-1">kol:detail</code>
                  <code className="mx-1">kol:export</code>
                  with the same scope.
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() =>
                      void saveRolePreset(
                        selectedRoleCode,
                        editorScopeType,
                        editorEnabled,
                        editorRemark,
                      )
                    }
                    disabled={savingConfig || !selectedRoleCode}
                  >
                    {savingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Save role config
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (!selectedRoleCode) {
                        return;
                      }
                      setAuthUserRoleCodesText(selectedRoleCode);
                    }}
                    disabled={!selectedRoleCode}
                  >
                    Use current role in user query
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => void deleteRoleConfig()}
                    disabled={savingConfig || !Number(currentRole?.id || selectedConfigId || 0)}
                  >
                    Delete current config
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="raw" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Role code">
                    <Input value={selectedRoleCode} readOnly />
                  </Field>
                  <Field label="Remark">
                    <Input value={editorRemark} onChange={(event) => setEditorRemark(event.target.value)} />
                  </Field>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPermissionRows((prev) => [...prev, makePermissionRow()])}
                  >
                    <Plus className="h-4 w-4" />
                    Add permission row
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setPermissionRows(
                        buildKolPermissionSet(editorScopeType).map((permission) =>
                          makePermissionRow(permission),
                        ),
                      )
                    }
                  >
                    <Rows3 className="h-4 w-4" />
                    Sync current KOL preset
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setPermissionRows(
                        buildKolPermissionSet("SELF").map((permission) =>
                          makePermissionRow(permission),
                        ),
                      )
                    }
                  >
                    <Rows3 className="h-4 w-4" />
                    Load KOL SELF rows
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void saveRawConfig()}
                    disabled={savingConfig || !selectedRoleCode}
                  >
                    {savingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Save raw config
                  </Button>
                </div>

                <div className="space-y-3">
                  {permissionRows.map((row) => (
                    <div
                      key={row.id}
                      className="grid gap-3 rounded-xl border bg-muted/20 p-4 md:grid-cols-[1fr_1fr_1fr_auto]"
                    >
                      <Field label="resourceCode">
                        <select
                          className={controlClass}
                          value={row.resourceCode}
                          onChange={(event) =>
                            updatePermissionRow(row.id, { resourceCode: event.target.value })
                          }
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
                          onChange={(event) =>
                            updatePermissionRow(row.id, { actionCode: event.target.value })
                          }
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
                          onChange={(event) =>
                            updatePermissionRow(row.id, {
                              scopeType: event.target.value as ScopeType,
                            })
                          }
                        >
                          {SCOPE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => removePermissionRow(row.id)}
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Role users</CardTitle>
            <CardDescription>
              Query auth users by role and reuse their adminId in the verification forms.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_auto_auto]">
              <Field label="Role codes">
                <Input
                  value={authUserRoleCodesText}
                  onChange={(event) => setAuthUserRoleCodesText(event.target.value)}
                  placeholder="KOL_BD"
                />
              </Field>
              <Field label="Keyword">
                <Input
                  value={authUserKeyword}
                  onChange={(event) => setAuthUserKeyword(event.target.value)}
                  placeholder="username or email"
                />
              </Field>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!selectedRoleCode) {
                      toast.error("Select a role first.");
                      return;
                    }
                    setAuthUserRoleCodesText(selectedRoleCode);
                  }}
                >
                  Current role
                </Button>
              </div>
              <div className="flex items-end">
                <Button type="button" onClick={() => void loadAuthUsers()} disabled={loadingUsers}>
                  {loadingUsers ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserRoundSearch className="h-4 w-4" />
                  )}
                  Load users
                </Button>
              </div>
            </div>

            {authUsers.length === 0 ? (
              <EmptyState
                title="No auth users loaded"
                description="Load auth users to bring their adminId into the endpoint test forms."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin ID</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead className="w-[120px]">Use</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {authUsers.map((user) => (
                    <TableRow key={String(user.adminId ?? user.uid ?? user.email ?? "unknown-user")}>
                      <TableCell className="font-mono text-xs">{user.adminId ?? "-"}</TableCell>
                      <TableCell>{user.username || "-"}</TableCell>
                      <TableCell>{user.email || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(user.roleCodes || []).map((roleCode) => (
                            <Badge key={`${user.adminId}-${roleCode}`} variant="outline">
                              {roleCode}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => useAdminId(user.adminId)}
                        >
                          Use
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Test /kol_user/list</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="adminId">
                <Input
                  value={String(kolUserQuery.adminId ?? "")}
                  onChange={(event) =>
                    setKolUserQuery((prev) => ({ ...prev, adminId: event.target.value }))
                  }
                />
              </Field>
              <Field label="affiliateCode">
                <Input
                  value={String(kolUserQuery.affiliateCode ?? "")}
                  onChange={(event) =>
                    setKolUserQuery((prev) => ({ ...prev, affiliateCode: event.target.value }))
                  }
                />
              </Field>
              <Field label="affiliateName">
                <Input
                  value={String(kolUserQuery.affiliateName ?? "")}
                  onChange={(event) =>
                    setKolUserQuery((prev) => ({ ...prev, affiliateName: event.target.value }))
                  }
                />
              </Field>
              <Field label="affiliateMail">
                <Input
                  value={String(kolUserQuery.affiliateMail ?? "")}
                  onChange={(event) =>
                    setKolUserQuery((prev) => ({ ...prev, affiliateMail: event.target.value }))
                  }
                />
              </Field>
              <Field label="medium">
                <Input
                  value={String(kolUserQuery.medium ?? "")}
                  onChange={(event) =>
                    setKolUserQuery((prev) => ({ ...prev, medium: event.target.value }))
                  }
                />
              </Field>
              <Field label="page / size">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={String(kolUserQuery.page ?? "1")}
                    onChange={(event) =>
                      setKolUserQuery((prev) => ({ ...prev, page: event.target.value }))
                    }
                  />
                  <Input
                    value={String(kolUserQuery.pageSize ?? "20")}
                    onChange={(event) =>
                      setKolUserQuery((prev) => ({ ...prev, pageSize: event.target.value }))
                    }
                  />
                </div>
              </Field>
              <div className="md:col-span-2 flex flex-wrap gap-2">
                <Button type="button" onClick={() => void testKolUsers()} disabled={runningTest === "kol-user"}>
                  {runningTest === "kol-user" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube2 className="h-4 w-4" />
                  )}
                  Test endpoint
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setKolUserQuery(EMPTY_KOL_USER_QUERY)}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Test /kol_performance/admin</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="adminId">
                <Input
                  value={String(kolPerformanceQuery.adminId ?? "")}
                  onChange={(event) =>
                    setKolPerformanceQuery((prev) => ({ ...prev, adminId: event.target.value }))
                  }
                />
              </Field>
              <Field label="affiliateCode">
                <Input
                  value={String(kolPerformanceQuery.affiliateCode ?? "")}
                  onChange={(event) =>
                    setKolPerformanceQuery((prev) => ({
                      ...prev,
                      affiliateCode: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="startDate">
                <Input
                  value={String(kolPerformanceQuery.startDate ?? "")}
                  onChange={(event) =>
                    setKolPerformanceQuery((prev) => ({ ...prev, startDate: event.target.value }))
                  }
                  placeholder="2026-04-01"
                />
              </Field>
              <Field label="endDate">
                <Input
                  value={String(kolPerformanceQuery.endDate ?? "")}
                  onChange={(event) =>
                    setKolPerformanceQuery((prev) => ({ ...prev, endDate: event.target.value }))
                  }
                  placeholder="2026-04-30"
                />
              </Field>
              <Field label="email">
                <Input
                  value={String(kolPerformanceQuery.email ?? "")}
                  onChange={(event) =>
                    setKolPerformanceQuery((prev) => ({ ...prev, email: event.target.value }))
                  }
                />
              </Field>
              <Field label="owner">
                <Input
                  value={String(kolPerformanceQuery.owner ?? "")}
                  onChange={(event) =>
                    setKolPerformanceQuery((prev) => ({ ...prev, owner: event.target.value }))
                  }
                />
              </Field>
              <Field label="page / size">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={String(kolPerformanceQuery.page ?? "1")}
                    onChange={(event) =>
                      setKolPerformanceQuery((prev) => ({ ...prev, page: event.target.value }))
                    }
                  />
                  <Input
                    value={String(kolPerformanceQuery.pageSize ?? "20")}
                    onChange={(event) =>
                      setKolPerformanceQuery((prev) => ({
                        ...prev,
                        pageSize: event.target.value,
                      }))
                    }
                  />
                </div>
              </Field>
              <div className="md:col-span-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => void testKolPerformance()}
                  disabled={runningTest === "kol-performance"}
                >
                  {runningTest === "kol-performance" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Test endpoint
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setKolPerformanceQuery(EMPTY_KOL_PERFORMANCE_QUERY)}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <JsonPreviewCard title="Request preview" value={requestPreview} />
        <JsonPreviewCard title="Response preview" value={responsePreview} />
      </div>
    </div>
  );
};

export default SystemPermissionPage;
