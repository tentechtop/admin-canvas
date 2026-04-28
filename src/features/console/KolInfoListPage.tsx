import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCcw, RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CONSOLE_PLATFORM_CODE, affiliateConsoleApi } from "@/api/affiliate-console";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { AffiliateAuditListValue, AffiliateAuditQuery, AffiliateAuditRow, AuthUserInfo } from "@/types/affiliate-console";

const KYC_STATUS_ALL = "__ALL__";
const OWNER_ALL = "__ALL__";
const pageSizeOptions = ["10", "20", "50"];

const kycStatusOptions = [
  { label: "All KYC statuses", value: KYC_STATUS_ALL },
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
  name: "",
  idKYCStatus: "",
} satisfies Pick<
  AffiliateAuditQuery,
  "startDate" | "endDate" | "countryCodes" | "affiliateCode" | "referralCode" | "mail" | "owner" | "name" | "idKYCStatus"
>;

const defaultQuery: AffiliateAuditQuery = {
  currentPage: 1,
  pageSize: 10,
  ...defaultFilters,
};

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

function valueText(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized || "-";
}

export function KolInfoListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(defaultFilters);
  const [query, setQuery] = useState<AffiliateAuditQuery>(defaultQuery);

  const listQuery = useQuery<AffiliateAuditListValue>({
    queryKey: ["kol-info-list", query],
    queryFn: async () => {
      const result = await affiliateConsoleApi.listKolInfoStatistics(query);
      return result.value ?? {};
    },
    placeholderData: keepPreviousData,
  });

  const ownerOptionsQuery = useQuery<AuthUserInfo[]>({
    queryKey: ["kol-info-list", "owner-options"],
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
  const totalPages = totalPagesFromValue(listQuery.data?.totalPages, total, pageSize);

  function runSearch() {
    setQuery((prev) => ({ ...prev, ...filters, currentPage: 1 }));
  }

  function resetSearch() {
    setFilters(defaultFilters);
    setQuery(defaultQuery);
  }

  function updatePage(nextPage: number) {
    setQuery((prev) => ({ ...prev, currentPage: Math.min(Math.max(1, nextPage), totalPages) }));
  }

  function updatePageSize(nextPageSize: string) {
    setQuery((prev) => ({ ...prev, pageSize: Number(nextPageSize), currentPage: 1 }));
  }

  return (
    <div className="space-y-6">
      <PageIntro
        title="KOL Info List"
        description="This page remains a read-only information list for KOL records returned by `/admin/kolUserStatistics`."
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
          <CardDescription>This page keeps the original info-list filters and does not host the dedicated KYC management flow.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Apply Time"><div className="grid grid-cols-2 gap-2"><Input type="date" value={filters.startDate} onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value }))} /><Input type="date" value={filters.endDate} onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value }))} /></div></Field>
          <Field label="Country"><Input value={filters.countryCodes} onChange={(event) => setFilters((prev) => ({ ...prev, countryCodes: event.target.value }))} placeholder="Filter by country code" /></Field>
          <Field label="Affiliate Code"><Input value={filters.affiliateCode} onChange={(event) => setFilters((prev) => ({ ...prev, affiliateCode: event.target.value }))} placeholder="Filter by affiliate code" /></Field>
          <Field label="Referral Code"><Input value={filters.referralCode} onChange={(event) => setFilters((prev) => ({ ...prev, referralCode: event.target.value }))} placeholder="Filter by referral code" /></Field>
          <Field label="Name"><Input value={filters.name} onChange={(event) => setFilters((prev) => ({ ...prev, name: event.target.value }))} placeholder="Filter by name" /></Field>
          <Field label="Email"><Input value={filters.mail} onChange={(event) => setFilters((prev) => ({ ...prev, mail: event.target.value }))} placeholder="Filter by email" /></Field>
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
          <CardTitle className="text-lg">KOL Info List</CardTitle>
          <CardDescription>This list stays focused on information display. Use the dedicated `/manage/kyc` page for KYC management actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.length === 0 && listQuery.isLoading ? (
            <div className="flex h-52 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading KOL info rows...</div>
          ) : rows.length === 0 ? (
            <EmptyState title="No KOL info rows" description="Adjust filters or run a new query to load KOL information." />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Affiliate Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>KYC Status</TableHead>
                      <TableHead>Traffic Status</TableHead>
                      <TableHead>Invite Code</TableHead>
                      <TableHead>Short Link</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Total User</TableHead>
                      <TableHead>Commission Rate</TableHead>
                      <TableHead>Create Time</TableHead>
                      <TableHead>Profile</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={`${row.affiliateId}-${row.affiliateCode}`}>
                        <TableCell className="font-medium">{valueText(row.affiliateCode)}</TableCell>
                        <TableCell>{valueText(row.name)}</TableCell>
                        <TableCell>{valueText(row.mail)}</TableCell>
                        <TableCell>{valueText(row.countryCode)}</TableCell>
                        <TableCell><StatusBadge status={String(row.idKYCStatus ?? "")} /></TableCell>
                        <TableCell><StatusBadge status={String(row.trafficResourceStatus ?? "")} /></TableCell>
                        <TableCell>{valueText(row.inviteCode)}</TableCell>
                        <TableCell className="max-w-[260px] break-all">{valueText(row.shortLink)}</TableCell>
                        <TableCell>{valueText(row.bdOwnerUsernameSnapshot ?? row.owner)}</TableCell>
                        <TableCell>{valueText(row.totalUser)}</TableCell>
                        <TableCell>{valueText(row.commissionRate)}</TableCell>
                        <TableCell>{valueText(row.createTime)}</TableCell>
                        <TableCell><Button type="button" variant="outline" size="sm" onClick={() => navigate(`/manage/affiliate-profile/${row.affiliateId}`)}>View</Button></TableCell>
                      </TableRow>
                    ))}
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
    </div>
  );
}

export default KolInfoListPage;
