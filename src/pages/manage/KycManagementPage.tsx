import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Loader2, Pencil, RefreshCcw, RotateCcw, Search } from "lucide-react";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CONSOLE_PLATFORM_CODE, affiliateConsoleApi } from "@/api/affiliate-console";
import { marketingCenterApi } from "@/api/marketing-center";
import AdminLayout from "@/components/admin/AdminLayout";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, Field, PageIntro, StatCard, StatusBadge } from "@/features/console/shared";
import type {
  AffiliateAuditListValue,
  AffiliateAuditQuery,
  AffiliateAuditRow,
  AuthUserInfo,
  KolKycCompanyPayload,
  KolKycIndividualPayload,
  KolKycUpdatePayload,
} from "@/types/affiliate-console";

const KYC_STATUS_ALL = "__ALL__";
const OWNER_ALL = "__ALL__";
const pageSizeOptions = ["10", "20", "50"];

const kycStatusOptions = [
  { label: "All statuses", value: KYC_STATUS_ALL },
  { label: "PENDING", value: "PENDING" },
  { label: "APPROVED", value: "APPROVED" },
  { label: "DOCUMENTS_REJECTED", value: "DOCUMENTS_REJECTED" },
  { label: "NOT_APPLIED", value: "NOT_APPLIED" },
  { label: "ACCOUNT_CLOSED", value: "ACCOUNT_CLOSED" },
];

const defaultFilters = {
  startDate: "",
  endDate: "",
  countryCodes: "",
  affiliateCode: "",
  referralCode: "",
  mail: "",
  owner: "",
  idKYCStatus: "",
} satisfies Pick<
  AffiliateAuditQuery,
  "startDate" | "endDate" | "countryCodes" | "affiliateCode" | "referralCode" | "mail" | "owner" | "idKYCStatus"
>;

const defaultQuery: AffiliateAuditQuery = {
  currentPage: 1,
  pageSize: 10,
  ...defaultFilters,
};

type EditableAccountType = "INDIVIDUAL" | "COMPANY";

interface EditorState {
  accountType: EditableAccountType;
  affiliateId: string;
  individual: KolKycIndividualPayload;
  company: KolKycCompanyPayload;
}

function ensureRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function pickFirstText(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    const normalized = String(value ?? "").trim();
    if (normalized) {
      return normalized;
    }
  }
  return "";
}

function pickFirstTextFromRecords(records: Record<string, unknown>[], keys: string[]) {
  for (const record of records) {
    const value = pickFirstText(record, keys);
    if (value) {
      return value;
    }
  }
  return "";
}

function extractAuditDetailRoot(value: unknown) {
  const record = ensureRecord(value);
  const nestedValue = ensureRecord(record.value);
  return Object.keys(nestedValue).length > 0 ? nestedValue : record;
}

function normalizeDateInput(value: unknown) {
  const normalized = String(value ?? "").trim();
  if (!normalized || normalized === "Invalid date") {
    return "";
  }
  if (normalized.includes("T") || normalized.includes(" ")) {
    return normalized.slice(0, 10);
  }
  return normalized;
}

function normalizeAccountType(value: string): EditableAccountType {
  return value.toUpperCase() === "COMPANY" ? "COMPANY" : "INDIVIDUAL";
}

function valueText(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized || "-";
}

function firstFilledText(...values: unknown[]) {
  for (const value of values) {
    const normalized = String(value ?? "").trim();
    if (normalized) {
      return normalized;
    }
  }
  return "";
}

function isEditableRow(row: AffiliateAuditRow) {
  return String(row.idKYCStatus ?? "").trim().toUpperCase() === "NOT_APPLIED";
}

function totalPagesFromValue(totalPages: unknown, total: unknown, pageSize: unknown) {
  const normalizedTotalPages = Number(totalPages ?? 0);
  if (normalizedTotalPages > 0) {
    return normalizedTotalPages;
  }

  const normalizedTotal = Number(total ?? 0);
  const normalizedPageSize = Number(pageSize ?? 10);
  if (normalizedTotal > 0 && normalizedPageSize > 0) {
    return Math.max(1, Math.ceil(normalizedTotal / normalizedPageSize));
  }

  return 1;
}

function guessImageMimeType(fileName: string) {
  const normalized = fileName.toLowerCase();
  if (normalized.endsWith(".png")) return "image/png";
  if (normalized.endsWith(".gif")) return "image/gif";
  if (normalized.endsWith(".webp")) return "image/webp";
  if (normalized.endsWith(".bmp")) return "image/bmp";
  if (normalized.endsWith(".svg")) return "image/svg+xml";
  return "image/jpeg";
}

function buildImagePreviewSrc(fileName: string, content: string) {
  const normalizedContent = String(content ?? "").trim();
  if (normalizedContent) {
    return `data:${guessImageMimeType(fileName)};base64,${normalizedContent}`;
  }

  const normalizedFileName = String(fileName ?? "").trim();
  if (/^(https?:\/\/|data:|blob:|\/)/i.test(normalizedFileName)) {
    return normalizedFileName;
  }

  return "";
}

function buildEditorState(detailValue: unknown, row: AffiliateAuditRow): EditorState {
  const detail = extractAuditDetailRoot(detailValue);
  const individualInfo = ensureRecord(detail.individualInfo ?? detail.individual);
  const companyInfo = ensureRecord(detail.companyInfo ?? detail.company);
  const affiliateId =
    pickFirstText(detail, ["affiliateId", "affiliate_id"]) || String(row.affiliateId ?? "").trim();
  const accountType = normalizeAccountType(
    pickFirstText(detail, ["accountType", "idAccountType"]) || String(row.accountType ?? ""),
  );

  return {
    accountType,
    affiliateId,
    individual: {
      affiliateId,
      firstName: pickFirstTextFromRecords([individualInfo, detail], ["firstName", "idFirstName"]),
      lastName: pickFirstTextFromRecords([individualInfo, detail], ["lastName", "idLastName"]),
      phone: pickFirstTextFromRecords([individualInfo, detail], ["phone", "idPhone"]),
      otherPhone: pickFirstTextFromRecords([individualInfo, detail], ["otherPhone", "idOtherPhone"]),
      address: pickFirstTextFromRecords([individualInfo, detail], ["address", "idAddress"]),
      city: pickFirstTextFromRecords([individualInfo, detail], ["city", "idCity"]),
      state: pickFirstTextFromRecords([individualInfo, detail], ["state", "idState"]),
      zip: pickFirstTextFromRecords([individualInfo, detail], ["zip", "idZip"]),
      type: pickFirstTextFromRecords([individualInfo, detail], ["type", "idType"]),
      number: pickFirstTextFromRecords([individualInfo, detail], ["number", "idNumber"]),
      idType: pickFirstTextFromRecords([individualInfo, detail], ["idType", "type", "idType"]),
      idNumber: pickFirstTextFromRecords([individualInfo, detail], ["idNumber", "number", "idNumber"]),
      birthday: normalizeDateInput(individualInfo.birthday ?? detail.idBirthday ?? detail.birthday),
      mitradeLiveAccount: pickFirstTextFromRecords(
        [individualInfo, ensureRecord(detail.paymentMethods), detail],
        ["idMitradeLiveAccount", "mitradeLiveAccount"],
      ),
      img: pickFirstTextFromRecords([individualInfo, detail], ["idImg", "img"]),
      imgContent: "",
      proofOfAddressImg: pickFirstTextFromRecords(
        [individualInfo, detail],
        ["proofOfAddressImg", "idProofOfAddressImg"],
      ),
      proofOfAddressImgContent: "",
    },
    company: {
      affiliateId,
      firstName: pickFirstTextFromRecords([companyInfo, detail], ["firstName", "idFirstName"]),
      lastName: pickFirstTextFromRecords([companyInfo, detail], ["lastName", "idLastName"]),
      phone: pickFirstTextFromRecords([companyInfo, detail], ["phone", "idPhone"]),
      otherPhone: pickFirstTextFromRecords([companyInfo, detail], ["otherPhone", "idOtherPhone"]),
      address: pickFirstTextFromRecords([companyInfo, detail], ["address", "idAddress"]),
      city: pickFirstTextFromRecords([companyInfo, detail], ["city", "idCity"]),
      state: pickFirstTextFromRecords([companyInfo, detail], ["state", "idState"]),
      zip: pickFirstTextFromRecords([companyInfo, detail], ["zip", "idZip"]),
      type: pickFirstTextFromRecords([companyInfo, detail], ["type", "idType"]),
      number: pickFirstTextFromRecords([companyInfo, detail], ["number", "idNumber"]),
      birthday: normalizeDateInput(companyInfo.birthday ?? detail.idBirthday ?? detail.birthday),
      companyName: pickFirstTextFromRecords([companyInfo, detail], ["companyName", "idCompanyName"]),
      companyRegNumber: pickFirstTextFromRecords(
        [companyInfo, detail],
        ["companyRegNumber", "idCompanyReg"],
      ),
      mainOfficePhone: pickFirstTextFromRecords(
        [companyInfo, detail],
        ["mainOfficePhone", "idMainOfficePhone"],
      ),
      officeAddress: pickFirstTextFromRecords([companyInfo, detail], ["officeAddress", "idOfficeAddress"]),
      officeCity: pickFirstTextFromRecords([companyInfo, detail], ["officeCity", "idOfficeCity"]),
      officeZip: pickFirstTextFromRecords([companyInfo, detail], ["officeZip", "idOfficeZip"]),
      mitradeLiveAccount: pickFirstTextFromRecords(
        [companyInfo, ensureRecord(detail.paymentMethods), detail],
        ["idMitradeLiveAccount", "mitradeLiveAccount"],
      ),
      img: pickFirstTextFromRecords([companyInfo, detail], ["idImg", "img"]),
      imgContent: "",
      proofOfAddressImg: pickFirstTextFromRecords(
        [companyInfo, detail],
        ["proofOfAddressImg", "idProofOfAddressImg"],
      ),
      proofOfAddressImgContent: "",
      companyRegCertImg: pickFirstTextFromRecords(
        [companyInfo, detail],
        ["companyRegCertImg", "idCompanyRegCertImg"],
      ),
      companyRegCertImgContent: "",
    },
  };
}

function applyDocumentFieldPayload<T extends Record<string, unknown>>(
  payload: T,
  fileField: keyof T,
  contentField: keyof T,
) {
  const nextPayload = { ...payload };
  const fileName = String(nextPayload[fileField] ?? "").trim();
  const fileContent = String(nextPayload[contentField] ?? "").trim();

  if (!fileName) {
    delete nextPayload[fileField];
    delete nextPayload[contentField];
    return nextPayload;
  }

  nextPayload[fileField] = fileName as T[keyof T];

  if (fileContent) {
    nextPayload[contentField] = fileContent as T[keyof T];
  } else {
    delete nextPayload[contentField];
  }

  return nextPayload;
}

function buildUpdatePayload(state: EditorState): KolKycUpdatePayload {
  return state.accountType === "COMPANY"
    ? {
        affiliateId: state.affiliateId,
        accountType: state.accountType,
        company: applyDocumentFieldPayload(
          applyDocumentFieldPayload(
            applyDocumentFieldPayload({ ...state.company, affiliateId: state.affiliateId }, "img", "imgContent"),
            "proofOfAddressImg",
            "proofOfAddressImgContent",
          ),
          "companyRegCertImg",
          "companyRegCertImgContent",
        ),
      }
    : {
        affiliateId: state.affiliateId,
        accountType: state.accountType,
        individual: applyDocumentFieldPayload(
          applyDocumentFieldPayload({ ...state.individual, affiliateId: state.affiliateId }, "img", "imgContent"),
          "proofOfAddressImg",
          "proofOfAddressImgContent",
        ),
      };
}

function KycImageField({
  label,
  fileName,
  fileContent,
  hint,
  onFileChange,
  onClear,
}: {
  label: string;
  fileName?: string;
  fileContent?: string;
  hint?: string;
  onFileChange: (nextName: string, nextContent: string) => void;
  onClear: () => void;
}) {
  const previewSrc = buildImagePreviewSrc(String(fileName ?? ""), String(fileContent ?? ""));

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      return;
    }

    try {
      const result = await marketingCenterApi.uploadFile(file);
      const uploadedUrl = String(result.value?.url ?? "").trim();
      if (!uploadedUrl) {
        toast.error("Upload succeeded but no file URL was returned.");
        return;
      }
      onFileChange(uploadedUrl, "");
      toast.success("Image uploaded successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload the selected image.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <Field label={label} hint={hint}>
      <div className="space-y-3 rounded-lg border bg-muted/15 p-4">
        <Input type="file" accept="image/*" onChange={(event) => void handleFileChange(event)} />
        <div className="text-sm text-muted-foreground">
          {String(fileName ?? "").trim() ? `Current file: ${String(fileName)}` : "No image selected."}
        </div>
        {previewSrc ? (
          <div className="overflow-hidden rounded-lg border bg-white p-2">
            <img src={previewSrc} alt={label} className="max-h-44 w-full rounded object-contain" />
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {previewSrc ? (
            <Button type="button" variant="outline" size="sm" asChild>
              <a href={previewSrc} target="_blank" rel="noreferrer">
                Preview
              </a>
            </Button>
          ) : null}
          {String(fileName ?? "").trim() ? (
            <Button type="button" variant="outline" size="sm" onClick={onClear}>
              Clear
            </Button>
          ) : null}
        </div>
      </div>
    </Field>
  );
}

export default function KycManagementPage() {
  const navigate = useNavigate();
  const editorBodyRef = useRef<HTMLDivElement | null>(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [query, setQuery] = useState<AffiliateAuditQuery>(defaultQuery);
  const [searchRevision, setSearchRevision] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<AffiliateAuditRow | null>(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorSaving, setEditorSaving] = useState(false);
  const [editorError, setEditorError] = useState("");
  const [editorState, setEditorState] = useState<EditorState | null>(null);

  const listQuery = useQuery<AffiliateAuditListValue>({
    queryKey: ["manage-kyc", query, searchRevision],
    queryFn: async () => {
      const result = await affiliateConsoleApi.listKolInfoStatistics(query);
      return result.value ?? {};
    },
    placeholderData: keepPreviousData,
  });

  const ownerOptionsQuery = useQuery<AuthUserInfo[]>({
    queryKey: ["manage-kyc", "owner-options"],
    queryFn: async () => {
      const result = await affiliateConsoleApi.listAuthUsers({
        platformCode: CONSOLE_PLATFORM_CODE,
        roleCodes: ["KOL_BD"],
      });
      return result.value?.list ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const rows = useMemo(
    () => ((listQuery.data?.resultList ?? []) as AffiliateAuditRow[]),
    [listQuery.data?.resultList],
  );
  const total = Number(listQuery.data?.total ?? 0);
  const currentPage = Number(listQuery.data?.currentPage ?? query.currentPage ?? 1);
  const pageSize = Number(listQuery.data?.pageSize ?? query.pageSize ?? 10);
  const totalPages = totalPagesFromValue(listQuery.data?.totalPages, listQuery.data?.total, pageSize);

  useEffect(() => {
    if (!editorOpen) {
      return;
    }
    const frameId = window.requestAnimationFrame(() => {
      editorBodyRef.current?.scrollTo({ top: 0 });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [editorOpen, editingRow?.affiliateId]);

  function closeEditor() {
    setEditorOpen(false);
    setEditingRow(null);
    setEditorState(null);
    setEditorError("");
    setEditorLoading(false);
    setEditorSaving(false);
  }

  function runSearch() {
    setQuery((prev) => ({ ...prev, ...filters, currentPage: 1 }));
    setSearchRevision((prev) => prev + 1);
  }

  function resetSearch() {
    setFilters(defaultFilters);
    setQuery(defaultQuery);
    setSearchRevision((prev) => prev + 1);
  }

  function updatePage(nextPage: number) {
    setQuery((prev) => ({ ...prev, currentPage: Math.min(Math.max(1, nextPage), totalPages) }));
  }

  function updatePageSize(nextPageSize: string) {
    setQuery((prev) => ({ ...prev, pageSize: Number(nextPageSize), currentPage: 1 }));
  }

  async function openEditor(row: AffiliateAuditRow) {
    const affiliateId = String(row.affiliateId ?? "").trim();
    if (!affiliateId) {
      toast.error("affiliateId is required before editing KYC.");
      return;
    }

    setEditingRow(row);
    setEditorOpen(true);
    setEditorState(null);
    setEditorError("");
    setEditorLoading(true);

    try {
      const result = await affiliateConsoleApi.getAuditDetail(affiliateId);
      setEditorState(buildEditorState(result.value, row));
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : "Failed to load affiliate detail.");
    } finally {
      setEditorLoading(false);
    }
  }

  async function submitEditor() {
    if (!editingRow || !editorState) {
      return;
    }
    const affiliateId = String(editingRow.affiliateId ?? editorState.affiliateId ?? "").trim();
    if (!affiliateId) {
      setEditorError("affiliateId is required before saving KYC information.");
      return;
    }
    setEditorSaving(true);
    try {
      await affiliateConsoleApi.updateKolKyc(buildUpdatePayload({ ...editorState, affiliateId }));
      toast.success("KYC information updated.");
      closeEditor();
      await listQuery.refetch();
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : "Failed to update KYC information.");
    } finally {
      setEditorSaving(false);
    }
  }

  function updateIndividualField(field: keyof KolKycIndividualPayload, value: string) {
    setEditorState((prev) => (prev ? { ...prev, individual: { ...prev.individual, [field]: value } } : prev));
  }

  function updateCompanyField(field: keyof KolKycCompanyPayload, value: string) {
    setEditorState((prev) => (prev ? { ...prev, company: { ...prev.company, [field]: value } } : prev));
  }

  function updateIndividualImageFields(
    fileField: "img" | "proofOfAddressImg",
    contentField: "imgContent" | "proofOfAddressImgContent",
    fileName: string,
    fileContent: string,
  ) {
    setEditorState((prev) => (prev ? { ...prev, individual: { ...prev.individual, [fileField]: fileName, [contentField]: fileContent } } : prev));
  }

  function updateCompanyImageFields(
    fileField: "img" | "proofOfAddressImg" | "companyRegCertImg",
    contentField: "imgContent" | "proofOfAddressImgContent" | "companyRegCertImgContent",
    fileName: string,
    fileContent: string,
  ) {
    setEditorState((prev) => (prev ? { ...prev, company: { ...prev.company, [fileField]: fileName, [contentField]: fileContent } } : prev));
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
      <PageIntro
        title="KYC Management"
        description="This fixed page hosts the KYC management flow. The table uses `/admin/kolUserStatistics`, view actions reuse the affiliate profile page, and edit actions submit through `/admin/kolKycUpdate`."
        actions={
          <Button type="button" variant="secondary" onClick={() => void listQuery.refetch()} disabled={listQuery.isFetching}>
            {listQuery.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Rows" value={total} hint="Source: /admin/kolUserStatistics" />
        <StatCard label="Current Page" value={currentPage} hint={`Total pages: ${totalPages}`} />
        <StatCard label="Page Size" value={pageSize} hint="Use the footer controls to switch page size." />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>The filter set matches the KYC management layout: application time, country, affiliate ID, source channel, email, owner, and KYC status.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Application Time"><div className="grid grid-cols-2 gap-2"><Input type="date" value={filters.startDate} onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value }))} /><Input type="date" value={filters.endDate} onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value }))} /></div></Field>
          <Field label="Country"><Input value={filters.countryCodes} onChange={(event) => setFilters((prev) => ({ ...prev, countryCodes: event.target.value }))} placeholder="Enter country code" /></Field>
          <Field label="Affiliate ID"><Input value={filters.affiliateCode} onChange={(event) => setFilters((prev) => ({ ...prev, affiliateCode: event.target.value }))} placeholder="Enter affiliate ID" /></Field>
          <Field label="Source Channel"><Input value={filters.referralCode} onChange={(event) => setFilters((prev) => ({ ...prev, referralCode: event.target.value }))} placeholder="Enter source channel" /></Field>
          <Field label="Email"><Input value={filters.mail} onChange={(event) => setFilters((prev) => ({ ...prev, mail: event.target.value }))} placeholder="Enter email" /></Field>
          <Field label="Owner">
            <Select value={filters.owner || OWNER_ALL} onValueChange={(value) => setFilters((prev) => ({ ...prev, owner: value === OWNER_ALL ? "" : value }))}>
              <SelectTrigger><SelectValue placeholder={ownerOptionsQuery.isLoading ? "Loading owners..." : "Select owner"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value={OWNER_ALL}>All owners</SelectItem>
                {(ownerOptionsQuery.data ?? []).map((user) => {
                  const adminId = String(user.adminId ?? "").trim();
                  if (!adminId) return null;
                  const username = String(user.username ?? "").trim();
                  const email = String(user.email ?? "").trim();
                  const displayName = username || email || adminId;
                  return <SelectItem key={adminId} value={adminId}>{`${displayName} (${adminId})`}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </Field>
          <Field label="KYC Status">
            <Select value={filters.idKYCStatus || KYC_STATUS_ALL} onValueChange={(value) => setFilters((prev) => ({ ...prev, idKYCStatus: value === KYC_STATUS_ALL ? "" : value }))}>
              <SelectTrigger><SelectValue placeholder="Select KYC status" /></SelectTrigger>
              <SelectContent>{kycStatusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <div className="flex items-end gap-2">
            <Button type="button" onClick={runSearch} disabled={listQuery.isFetching}>{listQuery.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Search</Button>
            <Button type="button" variant="outline" onClick={resetSearch}><RotateCcw className="h-4 w-4" />Reset</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">KYC List</CardTitle>
          <CardDescription>The table follows the KYC management columns and only allows edit actions when the current KYC status is `NOT_APPLIED`.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.length === 0 && listQuery.isLoading ? (
            <div className="flex h-52 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading KYC rows...</div>
          ) : rows.length === 0 ? (
            <EmptyState title="No KYC rows" description="Adjust filters or run a new query to load KYC records." />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader><TableRow><TableHead>Affiliate ID</TableHead><TableHead>Source Channel</TableHead><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Country</TableHead><TableHead>Owner</TableHead><TableHead>KYC Status</TableHead><TableHead>Application Time</TableHead><TableHead>Identity Detail</TableHead><TableHead>Reviewer</TableHead><TableHead>Review Time</TableHead><TableHead>Remark</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {rows.map((row) => {
                      const editable = isEditableRow(row);
                      const ownerText = firstFilledText(row.bdOwnerUsernameSnapshot, row.owner);
                      return (
                        <TableRow key={`${row.affiliateId}-${row.affiliateCode}`}>
                          <TableCell className="font-medium">{valueText(row.affiliateCode)}</TableCell>
                          <TableCell className="max-w-[240px] break-all">{valueText(row.referralCode)}</TableCell>
                          <TableCell>{valueText(row.name)}</TableCell>
                          <TableCell>{valueText(row.mail)}</TableCell>
                          <TableCell>{valueText(row.countryCode)}</TableCell>
                          <TableCell>{valueText(ownerText)}</TableCell>
                          <TableCell><StatusBadge status={String(row.idKYCStatus ?? "")} /></TableCell>
                          <TableCell>{valueText(firstFilledText(row.applicationTime, row.createTime))}</TableCell>
                          <TableCell>
                            {editable ? (
                              <Button type="button" size="sm" onClick={() => void openEditor(row)}><Pencil className="mr-2 h-4 w-4" />Edit</Button>
                            ) : (
                              <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/manage/affiliate-profile/${row.affiliateId}`)}>View</Button>
                            )}
                          </TableCell>
                          <TableCell>{valueText(row.reviewer)}</TableCell>
                          <TableCell>{valueText(row.reviewTime)}</TableCell>
                          <TableCell className="max-w-[320px] break-all">{valueText(firstFilledText(row.remark, row.idApproverNotes))}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">Showing page {currentPage} of {totalPages}, total {total} rows.</div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">Page size</span>
                  <Select value={String(pageSize)} onValueChange={updatePageSize}>
                    <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{pageSizeOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button type="button" variant="outline" onClick={() => updatePage(currentPage - 1)} disabled={currentPage <= 1 || listQuery.isFetching}>Previous</Button>
                  <Button type="button" variant="outline" onClick={() => updatePage(currentPage + 1)} disabled={currentPage >= totalPages || listQuery.isFetching}>Next</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={editorOpen} onOpenChange={(nextOpen) => (!nextOpen ? closeEditor() : setEditorOpen(nextOpen))}>
        <DialogContent className="flex max-h-[92vh] max-w-5xl flex-col overflow-hidden p-0">
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>Edit KYC Detail</DialogTitle>
            <DialogDescription>This editor only updates KYC profile fields for `NOT_APPLIED` rows.</DialogDescription>
          </DialogHeader>
          <div ref={editorBodyRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {editorLoading ? (
              <div className="flex h-60 items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading KYC detail...</div>
            ) : editorError && !editorState ? (
              <EmptyState title="Failed to load KYC detail" description={<span className="space-y-3"><span className="block">{editorError}</span><Button type="button" variant="outline" onClick={() => (editingRow ? void openEditor(editingRow) : undefined)}>Retry</Button></span>} />
            ) : editorState ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4"><StatCard label="affiliateId" value={editorState.affiliateId} /><StatCard label="accountType" value={editorState.accountType} /><StatCard label="trafficStatus" value={String(editingRow?.trafficResourceStatus ?? "-")} /><StatCard label="kycStatus" value={String(editingRow?.idKYCStatus ?? "-")} /></div>
                {editorError ? <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{editorError}</div> : null}
                {editorState.accountType === "COMPANY" ? (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="firstName"><Input value={editorState.company.firstName ?? ""} onChange={(event) => updateCompanyField("firstName", event.target.value)} /></Field>
                      <Field label="lastName"><Input value={editorState.company.lastName ?? ""} onChange={(event) => updateCompanyField("lastName", event.target.value)} /></Field>
                      <Field label="birthday"><Input type="date" value={editorState.company.birthday ?? ""} onChange={(event) => updateCompanyField("birthday", event.target.value)} /></Field>
                      <Field label="mitradeLiveAccount"><Input value={editorState.company.mitradeLiveAccount ?? ""} onChange={(event) => updateCompanyField("mitradeLiveAccount", event.target.value)} /></Field>
                      <Field label="phone"><Input value={editorState.company.phone ?? ""} onChange={(event) => updateCompanyField("phone", event.target.value)} /></Field>
                      <Field label="otherPhone"><Input value={editorState.company.otherPhone ?? ""} onChange={(event) => updateCompanyField("otherPhone", event.target.value)} /></Field>
                      <Field label="type"><Input value={editorState.company.type ?? ""} onChange={(event) => updateCompanyField("type", event.target.value)} /></Field>
                      <Field label="number"><Input value={editorState.company.number ?? ""} onChange={(event) => updateCompanyField("number", event.target.value)} /></Field>
                      <Field label="address"><Input value={editorState.company.address ?? ""} onChange={(event) => updateCompanyField("address", event.target.value)} /></Field>
                      <Field label="city"><Input value={editorState.company.city ?? ""} onChange={(event) => updateCompanyField("city", event.target.value)} /></Field>
                      <Field label="state"><Input value={editorState.company.state ?? ""} onChange={(event) => updateCompanyField("state", event.target.value)} /></Field>
                      <Field label="zip"><Input value={editorState.company.zip ?? ""} onChange={(event) => updateCompanyField("zip", event.target.value)} /></Field>
                      <Field label="companyName"><Input value={editorState.company.companyName ?? ""} onChange={(event) => updateCompanyField("companyName", event.target.value)} /></Field>
                      <Field label="companyRegNumber"><Input value={editorState.company.companyRegNumber ?? ""} onChange={(event) => updateCompanyField("companyRegNumber", event.target.value)} /></Field>
                      <Field label="mainOfficePhone"><Input value={editorState.company.mainOfficePhone ?? ""} onChange={(event) => updateCompanyField("mainOfficePhone", event.target.value)} /></Field>
                      <Field label="officeAddress"><Input value={editorState.company.officeAddress ?? ""} onChange={(event) => updateCompanyField("officeAddress", event.target.value)} /></Field>
                      <Field label="officeCity"><Input value={editorState.company.officeCity ?? ""} onChange={(event) => updateCompanyField("officeCity", event.target.value)} /></Field>
                      <Field label="officeZip"><Input value={editorState.company.officeZip ?? ""} onChange={(event) => updateCompanyField("officeZip", event.target.value)} /></Field>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <KycImageField label="ID Image" fileName={editorState.company.img} fileContent={editorState.company.imgContent} hint="Upload or replace the primary ID image." onFileChange={(fileName, fileContent) => updateCompanyImageFields("img", "imgContent", fileName, fileContent)} onClear={() => updateCompanyImageFields("img", "imgContent", "", "")} />
                      <KycImageField label="Proof Of Address Image" fileName={editorState.company.proofOfAddressImg} fileContent={editorState.company.proofOfAddressImgContent} hint="Upload or replace the proof of address image." onFileChange={(fileName, fileContent) => updateCompanyImageFields("proofOfAddressImg", "proofOfAddressImgContent", fileName, fileContent)} onClear={() => updateCompanyImageFields("proofOfAddressImg", "proofOfAddressImgContent", "", "")} />
                      <KycImageField label="Company Registration Certificate" fileName={editorState.company.companyRegCertImg} fileContent={editorState.company.companyRegCertImgContent} hint="Upload or replace the company certificate image." onFileChange={(fileName, fileContent) => updateCompanyImageFields("companyRegCertImg", "companyRegCertImgContent", fileName, fileContent)} onClear={() => updateCompanyImageFields("companyRegCertImg", "companyRegCertImgContent", "", "")} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="firstName"><Input value={editorState.individual.firstName ?? ""} onChange={(event) => updateIndividualField("firstName", event.target.value)} /></Field>
                      <Field label="lastName"><Input value={editorState.individual.lastName ?? ""} onChange={(event) => updateIndividualField("lastName", event.target.value)} /></Field>
                      <Field label="birthday"><Input type="date" value={editorState.individual.birthday ?? ""} onChange={(event) => updateIndividualField("birthday", event.target.value)} /></Field>
                      <Field label="mitradeLiveAccount"><Input value={editorState.individual.mitradeLiveAccount ?? ""} onChange={(event) => updateIndividualField("mitradeLiveAccount", event.target.value)} /></Field>
                      <Field label="phone"><Input value={editorState.individual.phone ?? ""} onChange={(event) => updateIndividualField("phone", event.target.value)} /></Field>
                      <Field label="otherPhone"><Input value={editorState.individual.otherPhone ?? ""} onChange={(event) => updateIndividualField("otherPhone", event.target.value)} /></Field>
                      <Field label="type"><Input value={editorState.individual.type ?? ""} onChange={(event) => updateIndividualField("type", event.target.value)} /></Field>
                      <Field label="number"><Input value={editorState.individual.number ?? ""} onChange={(event) => updateIndividualField("number", event.target.value)} /></Field>
                      <Field label="idType"><Input value={editorState.individual.idType ?? ""} onChange={(event) => updateIndividualField("idType", event.target.value)} /></Field>
                      <Field label="idNumber"><Input value={editorState.individual.idNumber ?? ""} onChange={(event) => updateIndividualField("idNumber", event.target.value)} /></Field>
                      <Field label="address"><Input value={editorState.individual.address ?? ""} onChange={(event) => updateIndividualField("address", event.target.value)} /></Field>
                      <Field label="city"><Input value={editorState.individual.city ?? ""} onChange={(event) => updateIndividualField("city", event.target.value)} /></Field>
                      <Field label="state"><Input value={editorState.individual.state ?? ""} onChange={(event) => updateIndividualField("state", event.target.value)} /></Field>
                      <Field label="zip"><Input value={editorState.individual.zip ?? ""} onChange={(event) => updateIndividualField("zip", event.target.value)} /></Field>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <KycImageField label="ID Image" fileName={editorState.individual.img} fileContent={editorState.individual.imgContent} hint="Upload or replace the primary ID image." onFileChange={(fileName, fileContent) => updateIndividualImageFields("img", "imgContent", fileName, fileContent)} onClear={() => updateIndividualImageFields("img", "imgContent", "", "")} />
                      <KycImageField label="Proof Of Address Image" fileName={editorState.individual.proofOfAddressImg} fileContent={editorState.individual.proofOfAddressImgContent} hint="Upload or replace the proof of address image." onFileChange={(fileName, fileContent) => updateIndividualImageFields("proofOfAddressImg", "proofOfAddressImgContent", fileName, fileContent)} onClear={() => updateIndividualImageFields("proofOfAddressImg", "proofOfAddressImgContent", "", "")} />
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
          <DialogFooter className="shrink-0 border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={closeEditor}>Cancel</Button>
            <Button type="button" onClick={() => void submitEditor()} disabled={!editorState || editorLoading || editorSaving}>{editorSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save</Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
