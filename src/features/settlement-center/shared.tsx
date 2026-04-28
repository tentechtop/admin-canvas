import { useEffect, useRef, useState, type ReactNode } from "react";
import { Eye, FileText, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { affiliateConsoleApi } from "@/api/affiliate-console";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  EmptyState,
  Field,
  PageIntro,
  StatCard,
  StatusBadge,
} from "@/features/console/shared";
import { useSettlementPaymentSummaryInfo, useSettlementStatementCommissions } from "@/features/settlement-center/hooks";
import type {
  AdminUploadedFile,
  SettlementAttachment,
  SettlementPaymentSummaryRow,
  SettlementStatementRow,
} from "@/types/affiliate-console";

export function textOrDash(value: unknown) {
  const text = String(value ?? "").trim();
  return text || "-";
}

export function metricText(metric?: { count?: number; amount?: string }) {
  return `${metric?.count ?? 0} / ${metric?.amount ?? "0.00"}`;
}

export function splitLinks(items?: string[]) {
  return (items ?? []).filter(Boolean);
}

export function attachmentLabel(item: SettlementAttachment, index: number) {
  return item.code?.trim() || `Attachment ${index + 1}`;
}

export function PageShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6 p-6">
      <PageIntro title={title} description={description} actions={actions} />
      {children}
    </div>
  );
}

export function FilterActions({
  onSearch,
  onReset,
  loading,
}: {
  onSearch: () => void;
  onReset: () => void;
  loading?: boolean;
}) {
  return (
    <div className="flex items-end gap-2">
      <Button type="button" onClick={onSearch} disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Search
      </Button>
      <Button type="button" variant="outline" onClick={onReset}>
        Reset
      </Button>
    </div>
  );
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
  loading?: boolean;
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

export function StatementDetailDialog({
  row,
  open,
  onOpenChange,
}: {
  row: SettlementStatementRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const commissionsQuery = useSettlementStatementCommissions(row?.id, 1, 50, open && Boolean(row?.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Statement Detail</DialogTitle>
          <DialogDescription>
            Statement detail, linked commission drilldown, attachments, note, and receiver account.
          </DialogDescription>
        </DialogHeader>

        {row ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Affiliate Code" value={textOrDash(row.affiliateId)} />
              <StatCard label="Status" value={<StatusBadge status={row.status} />} />
              <StatCard label="Payable Amount" value={textOrDash(row.paidAmount)} />
              <StatCard label="Period" value={textOrDash(row.datePeriod)} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Statement Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>Name: {textOrDash(row.name)}</div>
                  <div>Email: {textOrDash(row.email)}</div>
                  <div>Medium: {textOrDash(row.medium)}</div>
                  <div>Owner: {textOrDash(row.owner)}</div>
                  <div>Application Date: {textOrDash(row.applicationDate)}</div>
                  <div>Payout Date: {textOrDash(row.payoutDate)}</div>
                  <div>Receiver Account: {textOrDash(row.receiverAccount)}</div>
                  <div>Payment Method: {textOrDash(row.paymentMethods)}</div>
                  <div>Payment Summary ID: {textOrDash(row.paymentSummaryId)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Amounts & Note</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>Origin Amount: {textOrDash(row.originAmount)}</div>
                  <div>Award Amount: {textOrDash(row.awardAmount)}</div>
                  <div>Adjustments: {textOrDash(row.adjustmentsAmount)}</div>
                  <div>Note: {textOrDash(row.note)}</div>
                  <div className="space-y-2 pt-2">
                    <div className="font-medium">Attachments</div>
                    {(row.receipts ?? []).length === 0 ? (
                      <div className="text-muted-foreground">No statement attachments.</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(row.receipts ?? []).map((item, index) => (
                          <Button
                            key={`${item.code ?? "receipt"}-${index}`}
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(String(item.path ?? "").trim(), "_blank", "noopener,noreferrer")}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            {attachmentLabel(item, index)}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Commission Drilldown</CardTitle>
              </CardHeader>
              <CardContent>
                {commissionsQuery.isLoading ? (
                  <div className="flex h-36 items-center justify-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading commission rows...
                  </div>
                ) : (commissionsQuery.data?.paymentCommissions ?? []).length === 0 ? (
                  <EmptyState title="No commission rows" description="This statement has no linked commission rows." />
                ) : (
                  <div className="overflow-x-auto rounded-xl border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Trader</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Instrument</TableHead>
                          <TableHead>Spread</TableHead>
                          <TableHead>Tier</TableHead>
                          <TableHead>Commission</TableHead>
                          <TableHead>Award USD</TableHead>
                          <TableHead>Origin Commission</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(commissionsQuery.data?.paymentCommissions ?? []).map((item, index) => (
                          <TableRow key={`${item.traderLiveAccount ?? "commission"}-${index}`}>
                            <TableCell>{textOrDash(item.traderLiveAccount)}</TableCell>
                            <TableCell>{textOrDash(item.date)}</TableCell>
                            <TableCell>{textOrDash(item.instrument)}</TableCell>
                            <TableCell>{textOrDash(item.spread)}</TableCell>
                            <TableCell>{textOrDash(item.tier)}</TableCell>
                            <TableCell>{textOrDash(item.commission)}</TableCell>
                            <TableCell>{textOrDash(item.awardUsd)}</TableCell>
                            <TableCell>{textOrDash(item.originCommission)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function PaymentSummaryDetailDialog({
  summaryId,
  open,
  onOpenChange,
}: {
  summaryId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const detailQuery = useSettlementPaymentSummaryInfo(summaryId, open && Boolean(summaryId));
  const row = detailQuery.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Summary Detail</DialogTitle>
          <DialogDescription>Summary header, linked statements, attachments, and review state.</DialogDescription>
        </DialogHeader>

        {detailQuery.isLoading ? (
          <div className="flex h-36 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading summary detail...
          </div>
        ) : row ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Summary ID" value={textOrDash(row.id)} />
              <StatCard label="Status" value={<StatusBadge status={row.status} />} />
              <StatCard label="Payable Amount" value={textOrDash(row.payableAmount)} />
              <StatCard label="Affiliate Code" value={textOrDash(row.affiliateCode)} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Summary Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>Name: {textOrDash(row.name)}</div>
                  <div>Email: {textOrDash(row.email)}</div>
                  <div>Owner: {textOrDash(row.owner)}</div>
                  <div>Medium: {textOrDash(row.medium)}</div>
                  <div>Application Date: {textOrDash(row.applicationDate)}</div>
                  <div>Payout Date: {textOrDash(row.payoutDate)}</div>
                  <div>Payment Methods: {textOrDash(row.paymentMethods)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Amounts & Files</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>Origin Amount: {textOrDash(row.originAmount)}</div>
                  <div>Adjustments: {textOrDash(row.adjustmentsAmount)}</div>
                  <div>Note: {textOrDash(row.note)}</div>
                  <div className="space-y-2 pt-2">
                    <div className="font-medium">Payment Files</div>
                    {splitLinks(row.paymentFile).length === 0 ? (
                      <div className="text-muted-foreground">No payment files.</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {splitLinks(row.paymentFile).map((item, index) => (
                          <Button
                            key={`${item}-${index}`}
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(item, "_blank", "noopener,noreferrer")}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            File {index + 1}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Linked Statements</CardTitle>
              </CardHeader>
              <CardContent>
                {(row.paymentHistoryList ?? []).length === 0 ? (
                  <EmptyState title="No linked statements" description="This payment summary has no linked payment_history rows." />
                ) : (
                  <div className="overflow-x-auto rounded-xl border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Period</TableHead>
                          <TableHead>Origin Amount</TableHead>
                          <TableHead>Award Amount</TableHead>
                          <TableHead>Payable Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(row.paymentHistoryList ?? []).map((item, index) => (
                          <TableRow key={`${item.datePeriod ?? "statement"}-${index}`}>
                            <TableCell>{textOrDash(item.datePeriod)}</TableCell>
                            <TableCell>{textOrDash(item.originAmount)}</TableCell>
                            <TableCell>{textOrDash(item.awardAmount)}</TableCell>
                            <TableCell>{textOrDash(item.paidAmount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <EmptyState title="Summary not found" description="The requested summary detail is unavailable." />
        )}
      </DialogContent>
    </Dialog>
  );
}

export function PaymentExecutionDialog({
  row,
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  row: SettlementPaymentSummaryRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    payoutDate: string;
    paymentMethods: string;
    note: string;
    paymentFile: string[];
  }) => Promise<void>;
  submitting: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [payoutDate, setPayoutDate] = useState("");
  const [paymentMethods, setPaymentMethods] = useState("");
  const [note, setNote] = useState("");
  const [paymentFiles, setPaymentFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open || !row) {
      return;
    }
    setPayoutDate(row.payoutDate ?? "");
    setPaymentMethods(row.paymentMethods ?? "");
    setNote(row.note ?? "");
    setPaymentFiles(splitLinks(row.paymentFile));
  }, [open, row]);

  async function handleUpload(file: File | null) {
    if (!file) {
      return;
    }
    setUploading(true);
    try {
      const result = await affiliateConsoleApi.uploadAdminFile(file);
      const uploaded = result.value as AdminUploadedFile | null;
      const nextValue = String(uploaded?.downloadUrl ?? uploaded?.url ?? "").trim();
      if (!nextValue) {
        toast.error("Upload succeeded but no file URL was returned.");
        return;
      }
      setPaymentFiles((current) => Array.from(new Set([...current, nextValue])));
      toast.success("Payment file uploaded.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Execute Payment</DialogTitle>
          <DialogDescription>
            Finance action for moving an approved payment summary to paid.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <Field label="Payout Date">
            <Input type="date" value={payoutDate} onChange={(event) => setPayoutDate(event.target.value)} />
          </Field>
          <Field label="Payment Methods">
            <Input value={paymentMethods} onChange={(event) => setPaymentMethods(event.target.value)} />
          </Field>
          <Field label="Payment Note">
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} className="min-h-[120px]" />
          </Field>
          <Field label="Payment Files">
            <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(event) => void handleUpload(event.target.files?.[0] ?? null)}
              />
              <Button type="button" variant="outline" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Upload File
              </Button>
              <div className="flex flex-wrap gap-2">
                {paymentFiles.map((item, index) => (
                  <Button
                    key={`${item}-${index}`}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(item, "_blank", "noopener,noreferrer")}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    File {index + 1}
                  </Button>
                ))}
              </div>
            </div>
          </Field>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={submitting || !payoutDate.trim() || !paymentMethods.trim()}
            onClick={() => void onSubmit({ payoutDate, paymentMethods, note, paymentFile: paymentFiles })}
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Mark As Paid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
