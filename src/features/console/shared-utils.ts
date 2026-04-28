export function prettyJson(value: unknown) {
  return JSON.stringify(value ?? null, null, 2);
}

export function statusVariant(status?: string) {
  const normalized = String(status ?? "").toUpperCase();
  if (normalized.includes("APPROVED") || normalized === "ALL") {
    return "success";
  }
  if (
    normalized.includes("REJECTED") ||
    normalized.includes("NONE") ||
    normalized.includes("FAILED")
  ) {
    return "destructive";
  }
  return "secondary";
}

export const controlClass =
  "h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
