import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { prettyJson, statusVariant } from "@/features/console/shared-utils";

export function StatusBadge({
  status,
  className,
}: {
  status?: string;
  className?: string;
}) {
  const normalized = String(status ?? "").toUpperCase() || "-";
  const variant = statusVariant(normalized);
  const icon =
    variant === "success" ? (
      <CheckCircle2 className="h-3.5 w-3.5" />
    ) : variant === "destructive" ? (
      <XCircle className="h-3.5 w-3.5" />
    ) : (
      <Clock3 className="h-3.5 w-3.5" />
    );

  return (
    <Badge
      variant={
        variant === "destructive"
          ? "destructive"
          : variant === "secondary"
            ? "secondary"
            : "outline"
      }
      className={cn(
        "inline-flex items-center gap-1",
        variant === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        className,
      )}
    >
      {icon}
      {normalized}
    </Badge>
  );
}

export function PageIntro({
  title,
  description,
  actions,
}: {
  title: string;
  description: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Card className="border-0 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-slate-50 shadow-xl">
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="max-w-3xl text-slate-300">
            {description}
          </CardDescription>
        </div>
        {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
      </CardHeader>
    </Card>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      {hint ? <CardContent className="pt-0 text-sm text-muted-foreground">{hint}</CardContent> : null}
    </Card>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-2 text-sm", className)}>
      <span className="font-medium text-foreground">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function JsonPreviewCard({
  title,
  value,
  className,
}: {
  title: string;
  value: unknown;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          readOnly
          value={typeof value === "string" ? value : prettyJson(value)}
          className="min-h-[240px] font-mono text-xs leading-6"
        />
      </CardContent>
    </Card>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <AlertCircle className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
