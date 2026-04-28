import type { RoleDataPermissionRelation, ScopeType } from "@/types/affiliate-console";

export const KOL_RESOURCE = "kol";

export const ROLE_PERMISSION_ACTIONS = ["list", "detail", "export"] as const;

export const RESOURCE_OPTIONS = [
  "affiliate",
  "kol",
  "campaign_application",
  "performance_application",
  "payment",
  "payment_summary",
  "customer_report",
  "*",
] as const;

export const ACTION_OPTIONS = ["create", "list", "detail", "update", "export", "*"] as const;

export const SCOPE_OPTIONS: ScopeType[] = ["ALL", "SELF", "NONE"];

export function buildKolPermissionSet(scopeType: ScopeType): RoleDataPermissionRelation[] {
  return ROLE_PERMISSION_ACTIONS.map((actionCode) => ({
    resourceCode: KOL_RESOURCE,
    actionCode,
    scopeType,
  }));
}
