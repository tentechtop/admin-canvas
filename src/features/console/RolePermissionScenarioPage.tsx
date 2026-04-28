import { useEffect, useMemo, useState } from "react";
import {
  CheckCheck,
  Loader2,
  RefreshCcw,
  Search,
  Shield,
  TestTube2,
  UserRoundSearch,
} from "lucide-react";
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
import { toast } from "sonner";
import type {
  AuthUserInfo,
  RoleDataPermissionConfig,
  ScopeType,
} from "@/types/affiliate-console";
import {
  EmptyState,
  Field,
  JsonPreviewCard,
  PageIntro,
  StatusBadge,
} from "@/features/console/shared";
import { controlClass, prettyJson } from "@/features/console/shared-utils";
import { buildKolPermissionSet, KOL_RESOURCE } from "@/features/console/permission-constants";

function parseRoleCodes(raw: string) {
  return raw
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, list) => list.indexOf(item) === index);
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
  return {
    roleCode: role?.roleCode || "",
    scopeType:
      ((role?.permissions || []).find((item) => item.resourceCode === KOL_RESOURCE)?.scopeType as ScopeType) ||
      "SELF",
    enabled: role?.enabled ?? true,
    remark: role?.remark || "",
  };
}

const RolePermissionScenarioPage = () => {
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

  const [authUsers, setAuthUsers] = useState<AuthUserInfo[]>([]);
  const [kolUserQuery, setKolUserQuery] = useState({
    adminId: "",
    affiliateCode: "",
    affiliateName: "",
    affiliateMail: "",
    medium: "",
    page: "1",
    pageSize: "20",
  });
  const [kolPerformanceQuery, setKolPerformanceQuery] = useState({
    adminId: "",
    affiliateCode: "",
    startDate: "",
    endDate: "",
    email: "",
    owner: "",
    page: "1",
    pageSize: "20",
  });

  const [requestPreview, setRequestPreview] = useState("{}");
  const [responsePreview, setResponsePreview] = useState("{}");
  const [lastAction, setLastAction] = useState("No request yet.");

  const [loadingRoles, setLoadingRoles] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [runningTest, setRunningTest] = useState("");

  const currentRole = useMemo(
    () => roles.find((item) => item.roleCode === selectedRoleCode) || null,
    [roles, selectedRoleCode],
  );

  function syncEditor(nextRole?: RoleDataPermissionConfig | null) {
    const next = deriveEditorState(nextRole);
    setSelectedConfigId(Number(nextRole?.id || 0));
    setSelectedRoleCode(next.roleCode);
    setEditorScopeType(next.scopeType);
    setEditorEnabled(next.enabled);
    setEditorRemark(next.remark);
  }

  function applyPreview(action: string, preview: { request: string; response: string }) {
    setLastAction(action);
    setRequestPreview(preview.request);
    setResponsePreview(preview.response);
  }

  async function loadRoles(silent = false) {
    setLoadingRoles(true);
    try {
      const result = await affiliateConsoleApi.listRoleDataPermissions(platformCode.trim() || CONSOLE_PLATFORM_CODE);
      setRoles(result.value.list ?? []);
      applyPreview("GET /admin/role-data-permissions/roles", previewToText(result.preview));
      const nextRole =
        (result.value.list ?? []).find((item) => item.roleCode === selectedRoleCode) ||
        (result.value.list ?? [])[0] ||
        null;
      syncEditor(nextRole);
      if (!silent) {
        toast.success(`Loaded ${result.value.total ?? (result.value.list ?? []).length} roles.`);
      }
    } catch (error) {
      applyPreview("GET /admin/role-data-permissions/roles failed", errorPreview(error));
    } finally {
      setLoadingRoles(false);
    }
  }

  async function saveRole(
    roleCode: string,
    scopeType: ScopeType,
    enabled: boolean,
    remark: string,
  ) {
    if (!roleCode.trim()) {
      toast.error("Choose a role before saving.");
      return;
    }
    setSavingRole(true);
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
      setSavingRole(false);
    }
  }

  async function deleteRole(id: number) {
    if (!id) {
      toast.error("Current role has no saved config.");
      return;
    }
    if (!window.confirm(`Delete role config #${id}?`)) {
      return;
    }
    setSavingRole(true);
    try {
      const result = await affiliateConsoleApi.deleteRoleDataPermission(id);
      applyPreview("DELETE /admin/role-data-permissions/{id}", previewToText(result.preview));
      toast.success("Role config deleted.");
      await loadRoles(true);
    } catch (error) {
      applyPreview("DELETE /admin/role-data-permissions/{id} failed", errorPreview(error));
    } finally {
      setSavingRole(false);
    }
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
      toast.success("Current token can access protected admin APIs.");
    } catch (error) {
      applyPreview("GET /admin/auth/users (validate token) failed", errorPreview(error));
    }
  }

  async function initScenario() {
    await saveRole("KOL_BD", "SELF", true, "Console preset: KOL_BD -> SELF");
    await saveRole("KOL_ADMIN", "ALL", true, "Console preset: KOL_ADMIN -> ALL");
    await saveRole("KOL_MANAGE", "ALL", true, "Console preset: KOL_MANAGE -> ALL");
  }

  async function testKolUsers() {
    setRunningTest("kol-user");
    try {
      const result = await affiliateConsoleApi.listKolUsers(kolUserQuery);
      applyPreview("GET /kol_user/list", previewToText(result.preview));
      toast.success(`kol_user/list returned ${result.value.total ?? (result.value.userInfo ?? []).length} rows.`);
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
        `kol_performance/admin returned ${result.value.total ?? (result.value.kolPerformance ?? []).length} rows.`,
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
        const next = deriveEditorState(nextRole);

        setRoles(list);
        setLastAction("GET /admin/role-data-permissions/roles");
        setRequestPreview(prettyJson(result.preview.request));
        setResponsePreview(prettyJson(result.preview.response));
        setSelectedConfigId(Number(nextRole?.id || 0));
        setSelectedRoleCode(next.roleCode);
        setEditorScopeType(next.scopeType);
        setEditorEnabled(next.enabled);
        setEditorRemark(next.remark);
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
        title="Role Permission Scenario"
        description="Validate auth-platform users, configure KOL role data scope presets, and test how SELF vs ALL vs NONE affects /kol_user/list and /kol_performance/admin."
        actions={
          <Button type="button" variant="secondary" onClick={() => void loadRoles()} disabled={loadingRoles}>
            {loadingRoles ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Reload roles
          </Button>
        }
      />

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>What this page changes</AlertTitle>
        <AlertDescription>
          Saving here writes one KOL permission set per role: <code>kol:list</code>, <code>kol:detail</code>, and <code>kol:export</code> with the same scope.
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
            <CardDescription>Current token status</CardDescription>
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

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Session validation</CardTitle>
            <CardDescription>Use the current auth login session. No extra token pasting is required.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Field label="Platform code">
              <Input value={platformCode} onChange={(event) => setPlatformCode(event.target.value)} />
            </Field>
            <Field label="Role codes for token validation">
              <Input
                value={validateRoleCodesText}
                onChange={(event) => setValidateRoleCodesText(event.target.value)}
              />
            </Field>
            <div className="flex items-end">
              <Button type="button" variant="outline" onClick={() => void validateToken()} className="w-full">
                <CheckCheck className="h-4 w-4" />
                Validate current token
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Role shortcuts</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button type="button" variant="outline" onClick={() => void initScenario()} disabled={savingRole}>
              Init recommended scenario
            </Button>
            <Button type="button" variant="outline" onClick={() => void saveRole("KOL_BD", "SELF", true, "Console preset: KOL_BD -> SELF")} disabled={savingRole}>
              KOL_BD = SELF
            </Button>
            <Button type="button" variant="outline" onClick={() => void saveRole("KOL_ADMIN", "ALL", true, "Console preset: KOL_ADMIN -> ALL")} disabled={savingRole}>
              KOL_ADMIN = ALL
            </Button>
            <Button type="button" variant="outline" onClick={() => void saveRole("KOL_MANAGE", "ALL", true, "Console preset: KOL_MANAGE -> ALL")} disabled={savingRole}>
              KOL_MANAGE = ALL
            </Button>
            <Button type="button" variant="destructive" onClick={() => void saveRole(selectedRoleCode, "NONE", true, `Console preset: ${selectedRoleCode} -> NONE`)} disabled={savingRole || !selectedRoleCode}>
              Current role = NONE
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">KOL role config</CardTitle>
            <CardDescription>Manage one KOL data-scope preset for each auth role.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <Field label="Role">
              <select
                className={controlClass}
                value={selectedRoleCode}
                onChange={(event) => {
                  const role = roles.find((item) => item.roleCode === event.target.value) || null;
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
                <option value="SELF">SELF</option>
                <option value="ALL">ALL</option>
                <option value="NONE">NONE</option>
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
            <div className="md:col-span-4 flex flex-wrap gap-2">
              <Button type="button" onClick={() => void saveRole(selectedRoleCode, editorScopeType, editorEnabled, editorRemark)} disabled={savingRole}>
                {savingRole ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save role config
              </Button>
              <Button type="button" variant="destructive" onClick={() => void deleteRole(Number(currentRole?.id || selectedConfigId || 0))} disabled={savingRole || !Number(currentRole?.id || selectedConfigId || 0)}>
                Delete current config
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Role preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-lg border bg-muted/20 p-3">
              Resource bundle: <code>kol:list/detail/export</code>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              Current scope: <StatusBadge status={editorScopeType} />
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              Current state: <StatusBadge status={editorEnabled ? "ENABLED" : "DISABLED"} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Role list</CardTitle>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <EmptyState title="No roles loaded" description="Use Reload roles to fetch the current platform role snapshot." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role code</TableHead>
                  <TableHead>Role name</TableHead>
                  <TableHead>Configured</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="w-[240px]">Actions</TableHead>
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
                        <Button type="button" variant="outline" size="sm" onClick={() => syncEditor(role)}>
                          Edit
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => void saveRole(String(role.roleCode || ""), "SELF", true, `Console preset: ${role.roleCode} -> SELF`)}>
                          SELF
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => void saveRole(String(role.roleCode || ""), "ALL", true, `Console preset: ${role.roleCode} -> ALL`)}>
                          ALL
                        </Button>
                        <Button type="button" variant="destructive" size="sm" onClick={() => void saveRole(String(role.roleCode || ""), "NONE", true, `Console preset: ${role.roleCode} -> NONE`)}>
                          NONE
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Auth users by role</CardTitle>
            <CardDescription>Use this list to pick an adminId for KOL scope testing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Role codes">
                <Input value={authUserRoleCodesText} onChange={(event) => setAuthUserRoleCodesText(event.target.value)} />
              </Field>
              <Field label="Keyword">
                <Input value={authUserKeyword} onChange={(event) => setAuthUserKeyword(event.target.value)} placeholder="username or email" />
              </Field>
              <div className="flex items-end">
                <Button type="button" onClick={() => void loadAuthUsers()} disabled={loadingUsers} className="w-full">
                  {loadingUsers ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRoundSearch className="h-4 w-4" />}
                  Load auth users
                </Button>
              </div>
            </div>

            {authUsers.length === 0 ? (
              <EmptyState title="No auth users loaded" description="Load auth users to reuse their adminId in the test forms below." />
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
                          onClick={() => {
                            const adminId = String(user.adminId ?? "");
                            setKolUserQuery((prev) => ({ ...prev, adminId }));
                            setKolPerformanceQuery((prev) => ({ ...prev, adminId }));
                          }}
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
                <Input value={kolUserQuery.adminId} onChange={(event) => setKolUserQuery((prev) => ({ ...prev, adminId: event.target.value }))} />
              </Field>
              <Field label="affiliateCode">
                <Input value={kolUserQuery.affiliateCode} onChange={(event) => setKolUserQuery((prev) => ({ ...prev, affiliateCode: event.target.value }))} />
              </Field>
              <Field label="affiliateName">
                <Input value={kolUserQuery.affiliateName} onChange={(event) => setKolUserQuery((prev) => ({ ...prev, affiliateName: event.target.value }))} />
              </Field>
              <Field label="affiliateMail">
                <Input value={kolUserQuery.affiliateMail} onChange={(event) => setKolUserQuery((prev) => ({ ...prev, affiliateMail: event.target.value }))} />
              </Field>
              <Field label="medium">
                <Input value={kolUserQuery.medium} onChange={(event) => setKolUserQuery((prev) => ({ ...prev, medium: event.target.value }))} />
              </Field>
              <Field label="page / size">
                <div className="grid grid-cols-2 gap-2">
                  <Input value={kolUserQuery.page} onChange={(event) => setKolUserQuery((prev) => ({ ...prev, page: event.target.value }))} />
                  <Input value={kolUserQuery.pageSize} onChange={(event) => setKolUserQuery((prev) => ({ ...prev, pageSize: event.target.value }))} />
                </div>
              </Field>
              <div className="md:col-span-2 flex flex-wrap gap-2">
                <Button type="button" onClick={() => void testKolUsers()} disabled={runningTest === "kol-user"}>
                  {runningTest === "kol-user" ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube2 className="h-4 w-4" />}
                  Test endpoint
                </Button>
                <Button type="button" variant="outline" onClick={() => setKolUserQuery({ adminId: "", affiliateCode: "", affiliateName: "", affiliateMail: "", medium: "", page: "1", pageSize: "20" })}>
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
                <Input value={kolPerformanceQuery.adminId} onChange={(event) => setKolPerformanceQuery((prev) => ({ ...prev, adminId: event.target.value }))} />
              </Field>
              <Field label="affiliateCode">
                <Input value={kolPerformanceQuery.affiliateCode} onChange={(event) => setKolPerformanceQuery((prev) => ({ ...prev, affiliateCode: event.target.value }))} />
              </Field>
              <Field label="startDate">
                <Input value={kolPerformanceQuery.startDate} onChange={(event) => setKolPerformanceQuery((prev) => ({ ...prev, startDate: event.target.value }))} placeholder="2026-04-01" />
              </Field>
              <Field label="endDate">
                <Input value={kolPerformanceQuery.endDate} onChange={(event) => setKolPerformanceQuery((prev) => ({ ...prev, endDate: event.target.value }))} placeholder="2026-04-30" />
              </Field>
              <Field label="email">
                <Input value={kolPerformanceQuery.email} onChange={(event) => setKolPerformanceQuery((prev) => ({ ...prev, email: event.target.value }))} />
              </Field>
              <Field label="owner">
                <Input value={kolPerformanceQuery.owner} onChange={(event) => setKolPerformanceQuery((prev) => ({ ...prev, owner: event.target.value }))} />
              </Field>
              <Field label="page / size">
                <div className="grid grid-cols-2 gap-2">
                  <Input value={kolPerformanceQuery.page} onChange={(event) => setKolPerformanceQuery((prev) => ({ ...prev, page: event.target.value }))} />
                  <Input value={kolPerformanceQuery.pageSize} onChange={(event) => setKolPerformanceQuery((prev) => ({ ...prev, pageSize: event.target.value }))} />
                </div>
              </Field>
              <div className="md:col-span-2 flex flex-wrap gap-2">
                <Button type="button" onClick={() => void testKolPerformance()} disabled={runningTest === "kol-performance"}>
                  {runningTest === "kol-performance" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Test endpoint
                </Button>
                <Button type="button" variant="outline" onClick={() => setKolPerformanceQuery({ adminId: "", affiliateCode: "", startDate: "", endDate: "", email: "", owner: "", page: "1", pageSize: "20" })}>
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

export default RolePermissionScenarioPage;
