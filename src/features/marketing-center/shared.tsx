import { useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, ChevronDown, Copy, ExternalLink, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { marketingCenterApi } from "@/api/marketing-center";
import { marketingRoutes } from "@/features/marketing-center/config";
import { contentStatusLabel, reviewDecisionLabel } from "@/features/marketing-center/config";
import { EmptyState, Field, PageIntro, StatCard } from "@/features/console/shared";
import { useMarketingFileObject } from "@/features/marketing-center/hooks";
import type {
  MarketingContentStatus,
  MarketingFileObject,
  MarketingFileRef,
  MarketingReviewDecision,
  MarketingTaxonomyItem,
} from "@/types/marketing-center";

export { EmptyState, Field, PageIntro, StatCard };

export function MarketingPageShell({
  title,
  description,
  actions,
  children,
  backTo,
}: {
  title: string;
  description: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  backTo?: string;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const fallbackTarget =
    backTo ??
    (location.pathname === marketingRoutes.workbench ? "/dashboard" : marketingRoutes.workbench);

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(fallbackTarget);
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        <PageIntro
          title={title}
          description={description}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" className="border-slate-600 bg-slate-900/40 text-slate-50 hover:bg-slate-800" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              {actions}
            </div>
          }
        />
        {children}
      </div>
    </AdminLayout>
  );
}

export function MarketingStatusBadge({ status }: { status?: MarketingContentStatus | string }) {
  const normalized = String(status ?? "");
  const className = cn(
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
    normalized === "CONTENT_STATUS_PUBLISHED" && "border-emerald-200 bg-emerald-50 text-emerald-700",
    normalized === "CONTENT_STATUS_APPROVED" && "border-sky-200 bg-sky-50 text-sky-700",
    normalized === "CONTENT_STATUS_PENDING_REVIEW" && "border-amber-200 bg-amber-50 text-amber-700",
    normalized === "CONTENT_STATUS_REJECTED" && "border-rose-200 bg-rose-50 text-rose-700",
    normalized === "CONTENT_STATUS_DRAFT" && "border-slate-200 bg-slate-50 text-slate-700",
    normalized === "CONTENT_STATUS_OFFLINE" && "border-orange-200 bg-orange-50 text-orange-700",
    !normalized && "border-slate-200 bg-slate-50 text-slate-700",
  );

  return <span className={className}>{contentStatusLabel(normalized)}</span>;
}

export function ReviewDecisionBadge({ decision }: { decision?: MarketingReviewDecision | string }) {
  const normalized = String(decision ?? "");
  const className = cn(
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
    normalized === "REVIEW_DECISION_APPROVE" && "border-emerald-200 bg-emerald-50 text-emerald-700",
    normalized === "REVIEW_DECISION_REJECT" && "border-rose-200 bg-rose-50 text-rose-700",
    !normalized && "border-slate-200 bg-slate-50 text-slate-700",
  );

  return <span className={className}>{reviewDecisionLabel(normalized)}</span>;
}

export function PaginationBar({
  page,
  pageSize,
  total,
  loading,
  onPrev,
  onNext,
}: {
  page: number;
  pageSize: number;
  total: number;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const maxSeen = Math.min(total, page * pageSize);
  const minSeen = total === 0 ? 0 : (page - 1) * pageSize + 1;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm text-muted-foreground">
      <span>
        Showing {minSeen} to {maxSeen} of {total}
      </span>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onPrev} disabled={loading || page <= 1}>
          Prev
        </Button>
        <Button type="button" variant="outline" onClick={onNext} disabled={loading || maxSeen >= total}>
          Next
        </Button>
      </div>
    </div>
  );
}

export function CopyButton({
  value,
  label = "Copy",
}: {
  value?: string;
  label?: string;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={async () => {
        const text = String(value ?? "").trim();
        if (!text) {
          toast.error("Nothing to copy.");
          return;
        }
        await navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard.");
      }}
    >
      <Copy className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}

export function OpenButton({
  href,
  label = "Open",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={() => {
        const target = String(href ?? "").trim();
        if (!target) {
          toast.error("No URL available.");
          return;
        }
        window.open(target, "_blank", "noopener,noreferrer");
      }}
    >
      <ExternalLink className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}

export function FilePreviewCard({
  title,
  file,
}: {
  title: string;
  file?: MarketingFileRef | MarketingFileObject | null;
}) {
  const url = String(file?.url ?? "").trim();
  const downloadUrl = String(file?.downloadUrl ?? "").trim();
  const contentType = String(file?.contentType ?? "").toLowerCase();
  const isImage = contentType.startsWith("image/");

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>
          {String(file?.originalName ?? file?.storedName ?? "-")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isImage && url ? (
          <div className="overflow-hidden rounded-xl border bg-muted/20 p-2">
            <img src={url} alt={String(file?.originalName ?? "preview")} className="max-h-64 w-full rounded-lg object-contain" />
          </div>
        ) : (
          <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
            Preview is not available for this file type.
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <OpenButton href={url} label="Preview" />
          <OpenButton href={downloadUrl || url} label="Download" />
          <CopyButton value={url} label="Copy URL" />
        </div>
      </CardContent>
    </Card>
  );
}

export function TaxonomySingleSelect({
  items,
  value,
  placeholder,
  disabled,
  onChange,
}: {
  items: MarketingTaxonomyItem[];
  value?: number;
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: number | undefined) => void;
}) {
  const selected = items.find((item) => Number(item.id ?? 0) === Number(value ?? 0));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" disabled={disabled} className="w-full justify-between">
          <span className="truncate">{selected?.name || placeholder || "Select an option"}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No option matched.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => {
                const itemId = Number(item.id ?? 0);
                const selectedItem = itemId === Number(value ?? 0);
                return (
                  <CommandItem
                    key={`${itemId}-${item.code}`}
                    value={`${item.name ?? ""} ${item.code ?? ""}`}
                    onSelect={() => onChange(selectedItem ? undefined : itemId)}
                  >
                    <Check className={cn("mr-2 h-4 w-4", selectedItem ? "opacity-100" : "opacity-0")} />
                    <span className="truncate">{item.name || item.code || itemId}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function TaxonomyMultiSelect({
  items,
  value,
  placeholder,
  onChange,
}: {
  items: MarketingTaxonomyItem[];
  value: number[];
  placeholder?: string;
  onChange: (value: number[]) => void;
}) {
  const selectedLabels = useMemo(
    () =>
      items
        .filter((item) => value.includes(Number(item.id ?? 0)))
        .map((item) => item.name || item.code || String(item.id ?? "")),
    [items, value],
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" className="w-full justify-between">
          <span className="truncate">
            {selectedLabels.length > 0 ? selectedLabels.join(", ") : placeholder || "Select one or more"}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList className="max-h-[280px]">
            <CommandEmpty>No option matched.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => {
                const itemId = Number(item.id ?? 0);
                const selected = value.includes(itemId);
                return (
                  <CommandItem
                    key={`${itemId}-${item.code}`}
                    value={`${item.name ?? ""} ${item.code ?? ""}`}
                    onSelect={() =>
                      onChange(
                        selected
                          ? value.filter((entry) => entry !== itemId)
                          : [...value, itemId],
                      )
                    }
                  >
                    <Check className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
                    <span className="truncate">{item.name || item.code || itemId}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function FileObjectField({
  label,
  fileId,
  requiredHint,
  onChange,
}: {
  label: string;
  fileId?: number;
  requiredHint?: string;
  onChange: (fileId?: number) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { data: fileObject, isLoading } = useMarketingFileObject(fileId);

  async function handleUpload(file: File | null) {
    if (!file) {
      return;
    }
    setUploading(true);
    try {
      const result = await marketingCenterApi.uploadFile(file);
      const nextId = Number(result.value?.id ?? 0);
      if (nextId <= 0) {
        toast.error("Upload succeeded but no file id was returned.");
        return;
      }
      onChange(nextId);
      toast.success("File uploaded successfully.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleDelete() {
    if (!fileId) {
      onChange(undefined);
      setConfirmDelete(false);
      return;
    }
    setRemoving(true);
    try {
      await marketingCenterApi.deleteFileObject(fileId);
      onChange(undefined);
      toast.success("File object deleted.");
      setConfirmDelete(false);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <Field label={label} hint={requiredHint}>
      <div className="space-y-3 rounded-2xl border bg-muted/20 p-4">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(event) => void handleUpload(event.target.files?.[0] ?? null)}
        />

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading file metadata...
          </div>
        ) : fileObject ? (
          <div className="space-y-2">
            <div className="text-sm font-medium">{fileObject.originalName || fileObject.storedName || `File #${fileId}`}</div>
            <div className="text-xs text-muted-foreground">
              {String(fileObject.contentType || "-")} · {String(fileObject.size ?? "-")} bytes
            </div>
            <div className="flex flex-wrap gap-2">
              <OpenButton href={fileObject.url} label="Preview" />
              <OpenButton href={fileObject.downloadUrl || fileObject.url} label="Download" />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Replace
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={removing}
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm text-muted-foreground">No file selected.</div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload file
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file object</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the current file object reference from the form and calls the backend delete endpoint.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={removing} onClick={(event) => {
              event.preventDefault();
              void handleDelete();
            }}>
              {removing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Field>
  );
}

export function PayloadDialog({
  open,
  title,
  description,
  content,
  onOpenChange,
}: {
  open: boolean;
  title: string;
  description?: string;
  content: string;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] rounded-xl border bg-slate-950 p-4">
          <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-6 text-slate-100">
            {content}
          </pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function ValueCard({
  label,
  value,
  mono = false,
  actions,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  actions?: React.ReactNode;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardDescription>{label}</CardDescription>
        <CardTitle className={cn("text-lg", mono && "font-mono text-sm")}>{value}</CardTitle>
      </CardHeader>
      {actions ? <CardContent className="flex flex-wrap gap-2 pt-0">{actions}</CardContent> : null}
    </Card>
  );
}
