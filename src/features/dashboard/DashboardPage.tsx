import { useState, type CSSProperties, type ReactNode } from "react";
import { format, subDays } from "date-fns";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  Compass,
  ExternalLink,
  Globe2,
  RefreshCw,
  TrendingUp,
  Users2,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Funnel,
  FunnelChart,
  LabelList,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useDashboardDistributions,
  useDashboardKol,
  useDashboardOverview,
  useDashboardRealtime,
  useDashboardTrends,
} from "@/features/dashboard/hooks";
import type {
  DashboardAlertItem,
  DashboardGeoDistributionItem,
  DashboardKpiCard,
} from "@/types/affinex";

const standaloneDashboardPath = "/dashboard/screen";

const chartColors = ["#0f766e", "#ea580c", "#2563eb", "#dc2626", "#14b8a6", "#f59e0b"];
const softCardClass =
  "overflow-hidden rounded-[34px] border border-white/70 bg-white/85 shadow-[0_30px_100px_rgba(15,23,42,0.10)] backdrop-blur-xl";
const panelCardClass =
  "rounded-[28px] border border-slate-200/80 bg-white/92 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_48px_rgba(15,23,42,0.10)]";
const chartPanelClass =
  "h-full rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.96))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]";

const axisTick = { fill: "#64748b", fontSize: 11 };
const tooltipContentStyle: CSSProperties = {
  border: "1px solid rgba(226,232,240,1)",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.98)",
  color: "#0f172a",
  boxShadow: "0 18px 42px rgba(15,23,42,0.12)",
};
const tooltipLabelStyle: CSSProperties = {
  color: "#0f172a",
  marginBottom: 6,
  fontWeight: 600,
};
const legendWrapperStyle: CSSProperties = { fontSize: 12, color: "#475569", paddingTop: 10 };

const geoCoordinates: Record<string, { x: number; y: number }> = {
  US: { x: 18, y: 34 },
  CA: { x: 17, y: 20 },
  MX: { x: 20, y: 46 },
  BR: { x: 31, y: 67 },
  AR: { x: 28, y: 82 },
  CL: { x: 24, y: 78 },
  CO: { x: 24, y: 53 },
  PE: { x: 25, y: 63 },
  GB: { x: 48, y: 23 },
  FR: { x: 49, y: 29 },
  DE: { x: 52, y: 27 },
  NL: { x: 50, y: 25 },
  CH: { x: 51, y: 29 },
  ES: { x: 47, y: 34 },
  IT: { x: 53, y: 34 },
  SE: { x: 54, y: 18 },
  NO: { x: 51, y: 15 },
  PL: { x: 55, y: 25 },
  UA: { x: 58, y: 27 },
  NG: { x: 52, y: 56 },
  ZA: { x: 56, y: 82 },
  EG: { x: 58, y: 46 },
  TR: { x: 60, y: 32 },
  IL: { x: 60, y: 39 },
  QA: { x: 66, y: 44 },
  AE: { x: 67, y: 41 },
  SA: { x: 63, y: 46 },
  PK: { x: 70, y: 41 },
  IN: { x: 72, y: 47 },
  BD: { x: 77, y: 47 },
  TH: { x: 79, y: 52 },
  VN: { x: 83, y: 51 },
  SG: { x: 81, y: 61 },
  ID: { x: 84, y: 68 },
  MY: { x: 80, y: 59 },
  PH: { x: 88, y: 53 },
  CN: { x: 80, y: 37 },
  HK: { x: 82, y: 44 },
  TW: { x: 85, y: 43 },
  JP: { x: 91, y: 39 },
  KR: { x: 88, y: 36 },
  AU: { x: 86, y: 82 },
  NZ: { x: 96, y: 88 },
  KZ: { x: 69, y: 25 },
  RU: { x: 74, y: 18 },
};

const refreshOptions = [
  { label: "1 分钟", value: 60_000 },
  { label: "5 分钟", value: 300_000 },
  { label: "15 分钟", value: 900_000 },
  { label: "关闭", value: 0 },
];

function formatCompact(value: number, unit = "") {
  const abs = Math.abs(value);
  let display = value.toFixed(2);
  if (abs >= 1_000_000) {
    display = `${(value / 1_000_000).toFixed(2)}M`;
  } else if (abs >= 1_000) {
    display = `${(value / 1_000).toFixed(2)}K`;
  } else if (Number.isInteger(value)) {
    display = value.toLocaleString();
  }
  return unit === "USD" ? `$${display}` : `${display}${unit === "lots" ? " lots" : ""}`;
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatDateTime(value: string) {
  if (!value) {
    return "--";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return format(date, "yyyy-MM-dd HH:mm");
}

function getRankTone(index: number) {
  if (index === 0) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (index === 1) {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }
  if (index === 2) {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }
  return "border-slate-200 bg-white text-slate-500";
}

function getSettlementStatusTone(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized.includes("approved") || normalized.includes("success") || normalized.includes("paid")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (normalized.includes("declined") || normalized.includes("rejected") || normalized.includes("failed")) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (normalized.includes("pending") || normalized.includes("processing")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-slate-200 bg-white text-slate-600";
}

function getOrderTypeTone(orderType: string) {
  const normalized = orderType.trim().toLowerCase();
  if (normalized.includes("buy")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (normalized.includes("sell")) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (normalized.includes("market")) {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }
  return "border-slate-200 bg-white text-slate-600";
}

function SectionTitle({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] text-slate-700 shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-[0.26em] text-slate-400">{eyebrow}</div>
        <div className="mt-1 text-lg font-semibold tracking-tight text-slate-950">{title}</div>
        {description ? <div className="mt-1 text-sm leading-6 text-slate-500">{description}</div> : null}
      </div>
    </div>
  );
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/85 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
      <div className="text-[11px] font-medium tracking-[0.04em] text-slate-500">{label}</div>
      <div className="mt-1.5 text-base font-semibold tracking-tight text-slate-950">{value}</div>
    </div>
  );
}

function HeroStat({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] font-medium tracking-[0.04em] text-slate-500">{label}</div>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          {icon}
        </div>
      </div>
      <div className="mt-2 text-[28px] font-semibold tracking-tight text-slate-950">{value}</div>
      <div className="mt-1.5 text-xs leading-5 text-slate-500">{helper}</div>
    </div>
  );
}

function DashboardKpiTile({ card, index }: { card: DashboardKpiCard; index: number }) {
  const positive = card.diffValue >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  const deltaTone = positive
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-rose-200 bg-rose-50 text-rose-700";
  const accent = chartColors[index % chartColors.length];

  return (
    <Card className={`${panelCardClass} relative overflow-hidden`}>
      <div
        className="absolute inset-x-0 top-0 h-1.5"
        style={{ background: `linear-gradient(90deg, ${accent}, rgba(255,255,255,0))` }}
      />
      <div
        className="absolute right-0 top-0 h-28 w-28 rounded-full blur-3xl"
        style={{ backgroundColor: `${accent}18` }}
      />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{card.label}</p>
            <p className="mt-3 truncate text-[30px] font-semibold tracking-tight text-slate-950">
              {formatCompact(card.value, card.unit)}
            </p>
          </div>
          <Badge variant="outline" className={`${deltaTone} border px-2.5 py-1`}>
            <Icon className="mr-1 h-3.5 w-3.5" />
            {formatPercent(card.diffRate)}
          </Badge>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3 py-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">对比基线</div>
            <div className="mt-1 text-sm font-medium text-slate-800">
              {formatCompact(card.compareValue, card.unit)}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3 py-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">变化值</div>
            <div className="mt-1 text-sm font-medium text-slate-800">
              {formatCompact(card.diffValue, card.unit)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GeoHeatBoard({ items }: { items: DashboardGeoDistributionItem[] }) {
  const fallback = [
    { x: 20, y: 32 },
    { x: 34, y: 65 },
    { x: 53, y: 46 },
    { x: 74, y: 35 },
    { x: 84, y: 78 },
  ];
  const sortedItems = [...items].sort((left, right) => right.tradeAmountUsd - left.tradeAmountUsd);
  const maxAmount = sortedItems[0]?.tradeAmountUsd ?? 0;
  const leadMarket = sortedItems[0];
  const headlineMarkets = sortedItems.slice(0, 3);
  const visibleMarkets = sortedItems.slice(0, 14);

  return (
    <div className="relative h-[23rem] overflow-hidden rounded-[26px] border border-slate-200 bg-[radial-gradient(circle_at_20%_18%,rgba(20,184,166,0.18),transparent_26%),radial-gradient(circle_at_88%_72%,rgba(249,115,22,0.14),transparent_22%),linear-gradient(180deg,#ffffff,#f8fafc)]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/78 to-transparent" />
      <div className="absolute inset-[14px] overflow-hidden rounded-[22px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.62))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
        <svg
          viewBox="0 0 1000 420"
          className="h-full w-full"
          aria-hidden="true"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="worldFill" x1="8%" y1="0%" x2="95%" y2="100%">
              <stop offset="0%" stopColor="#dbeafe" />
              <stop offset="45%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
            <radialGradient id="mapGlow" cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor="rgba(15,118,110,0.12)" />
              <stop offset="100%" stopColor="rgba(15,118,110,0)" />
            </radialGradient>
          </defs>

          <rect x="0" y="0" width="1000" height="420" fill="url(#mapGlow)" />

          <g fill="none" stroke="rgba(148,163,184,0.16)" strokeWidth="1">
            <path d="M0 70h1000" />
            <path d="M0 140h1000" />
            <path d="M0 210h1000" />
            <path d="M0 280h1000" />
            <path d="M0 350h1000" />
            <path d="M125 0v420" />
            <path d="M250 0v420" />
            <path d="M375 0v420" />
            <path d="M500 0v420" />
            <path d="M625 0v420" />
            <path d="M750 0v420" />
            <path d="M875 0v420" />
          </g>

          <g fill="url(#worldFill)" stroke="rgba(100,116,139,0.28)" strokeWidth="1.4">
            <path d="M70 114L112 84L168 72L220 72L263 94L286 125L278 152L246 168L214 164L198 181L176 194L144 202L115 194L94 168L80 140Z" />
            <path d="M208 208L238 220L260 247L268 284L262 325L248 360L228 344L220 304L212 260L196 226Z" />
            <path d="M236 54L258 34L288 40L298 58L292 78L266 84L244 76Z" />
            <path d="M430 120L454 102L486 98L504 108L506 126L484 138L454 138L438 130Z" />
            <path d="M462 166L490 156L520 166L548 192L558 228L552 274L536 322L514 352L490 338L476 300L470 250L458 206Z" />
            <path d="M504 118L548 94L606 86L666 92L734 106L790 126L834 152L850 170L840 184L804 190L776 182L742 194L714 212L678 214L648 202L620 208L586 194L560 178L526 170L510 152Z" />
            <path d="M642 202L672 194L694 208L706 230L700 260L680 278L658 272L642 246Z" />
            <path d="M728 224L756 220L782 236L792 262L786 286L760 292L734 280L720 252Z" />
            <path d="M790 296L828 304L862 320L874 344L866 362L828 368L790 354L768 330L772 310Z" />
            <path d="M842 176L858 168L872 174L874 188L862 198L848 192Z" />
            <path d="M386 102L400 90L414 96L414 110L398 116L388 110Z" />
          </g>
        </svg>
      </div>

      <div className="absolute left-5 top-5 max-w-[270px] rounded-2xl border border-white/85 bg-white/80 p-4 shadow-[0_12px_24px_rgba(15,23,42,0.08)] backdrop-blur">
        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Global market map</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          将主要交易热度压缩在一块轻量热力板里，既能看出区域集中度，也不会把大屏视觉挤得太满。
        </p>
        {leadMarket ? (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
            <span className="h-2 w-2 rounded-full bg-teal-500" />
            Top market {leadMarket.countryCode}
          </div>
        ) : null}
        {headlineMarkets.length ? (
          <div className="mt-4 grid gap-2">
            {headlineMarkets.map((item, index) => (
              <div
                key={`${item.countryCode}-${index}-headline`}
                className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-2 text-xs text-slate-600"
              >
                <span className="font-medium text-slate-800">
                  #{index + 1} {item.countryCode}
                </span>
                <span>${formatCompact(item.tradeAmountUsd).replace("$", "")}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="absolute right-5 top-5 hidden rounded-2xl border border-white/85 bg-white/80 px-4 py-3 text-xs text-slate-500 shadow-[0_12px_24px_rgba(15,23,42,0.08)] backdrop-blur md:block">
        <div className="font-medium uppercase tracking-[0.18em] text-slate-400">Heat scale</div>
        <div className="mt-3 flex items-center gap-3">
          <span>Low</span>
          <div className="h-2 w-24 rounded-full bg-[linear-gradient(90deg,rgba(45,212,191,0.18),rgba(20,184,166,0.9))]" />
          <span>High</span>
        </div>
      </div>

      {visibleMarkets.map((item, index) => {
        const coord = geoCoordinates[item.countryCode] ?? fallback[index % fallback.length];
        const intensity = maxAmount > 0 ? item.tradeAmountUsd / maxAmount : 0.35;
        const size = 16 + intensity * 34;
        const isHeadline = index < 3;
        return (
          <div
            key={`${item.countryCode}-${index}`}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${coord.x}%`,
              top: `${coord.y}%`,
            }}
            title={`${item.countryCode}: $${item.tradeAmountUsd.toFixed(2)}`}
          >
            <div
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal-400/45 bg-teal-400/18 shadow-[0_0_28px_rgba(20,184,166,0.22)] ${isHeadline ? "animate-pulse" : ""}`}
              style={{
                left: "50%",
                top: "50%",
                width: `${size}px`,
                height: `${size}px`,
              }}
            >
              <div className="absolute inset-[22%] rounded-full bg-teal-500/75" />
            </div>
            <div
              className={`pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-200/80 bg-slate-950/88 px-2.5 py-1 text-[10px] font-medium text-white shadow-lg transition ${
                isHeadline ? "top-[calc(100%+14px)] opacity-100" : "top-[calc(100%+10px)] opacity-0 group-hover:opacity-100"
              }`}
            >
              {item.countryCode} · ${formatCompact(item.tradeAmountUsd).replace("$", "")}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GeoDistributionPie({ items }: { items: DashboardGeoDistributionItem[] }) {
  const sortedItems = [...items].sort((left, right) => right.tradeAmountUsd - left.tradeAmountUsd);
  const mainItems = sortedItems.slice(0, 5);
  const others = sortedItems.slice(5);
  const othersAmount = others.reduce((total, item) => total + item.tradeAmountUsd, 0);
  const othersUsers = others.reduce((total, item) => total + item.tradeUserCount, 0);
  const totalAmount = sortedItems.reduce((total, item) => total + item.tradeAmountUsd, 0);
  const pieData =
    othersAmount > 0
      ? [
          ...mainItems,
          {
            countryCode: "OTHERS",
            tradeAmountUsd: othersAmount,
            tradeUserCount: othersUsers,
          },
        ]
      : mainItems;

  return (
    <div className={`${chartPanelClass} flex h-[23rem] flex-col`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Region mix</div>
          <div className="mt-1 text-sm font-medium text-slate-900">国家成交占比</div>
        </div>
        <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">
          {pieData.length} slices
        </Badge>
      </div>

      <div className="mt-3 min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={tooltipContentStyle}
              labelStyle={tooltipLabelStyle}
              formatter={(value: number, _name, item) => {
                const share = totalAmount > 0 ? ((value / totalAmount) * 100).toFixed(1) : "0.0";
                const payload = item.payload as DashboardGeoDistributionItem;
                return [`$${value.toFixed(2)} (${share}%)`, `${payload.countryCode}`];
              }}
            />
            <Legend
              wrapperStyle={legendWrapperStyle}
              formatter={(value, _entry, index) => (
                <span className="text-xs text-slate-600">
                  {value}
                  {pieData[index] && totalAmount > 0
                    ? ` ${((pieData[index].tradeAmountUsd / totalAmount) * 100).toFixed(1)}%`
                    : ""}
                </span>
              )}
            />
            <Pie
              data={pieData}
              dataKey="tradeAmountUsd"
              nameKey="countryCode"
              innerRadius={54}
              outerRadius={84}
              paddingAngle={3}
              stroke="rgba(255,255,255,0.95)"
              strokeWidth={2}
            >
              {pieData.map((item, index) => (
                <Cell key={`${item.countryCode}-${index}-pie`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {pieData.slice(0, 4).map((item, index) => (
          <div
            key={`${item.countryCode}-${index}-summary`}
            className="rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-2 text-xs text-slate-600"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: chartColors[index % chartColors.length] }}
              />
              <span className="font-medium text-slate-800">{item.countryCode}</span>
            </div>
            <div className="mt-1">
              ${item.tradeAmountUsd.toFixed(2)}
              {totalAmount > 0 ? ` / ${((item.tradeAmountUsd / totalAmount) * 100).toFixed(1)}%` : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertBadge({ item }: { item: DashboardAlertItem }) {
  const tone =
    item.severity === "critical"
      ? "border-rose-200 bg-rose-50/90 text-rose-700"
      : item.severity === "warning"
        ? "border-amber-200 bg-amber-50/90 text-amber-700"
        : "border-sky-200 bg-sky-50/90 text-sky-700";

  const label =
    item.severity === "critical"
      ? "Critical"
      : item.severity === "warning"
        ? "Warning"
        : "Notice";

  return (
    <div className={`rounded-[22px] border p-4 ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.18em] opacity-75">{label}</div>
          <p className="mt-1 truncate text-sm font-medium">{item.label}</p>
        </div>
        <div className="rounded-2xl bg-white/70 px-3 py-2 text-lg font-semibold shadow-sm">{item.count}</div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  icon,
  eyebrow,
  children,
  description,
  contentClassName = "h-80",
}: {
  title: string;
  icon: ReactNode;
  eyebrow: string;
  children: ReactNode;
  description?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={panelCardClass}>
      <CardHeader className="pb-3">
        <SectionTitle icon={icon} eyebrow={eyebrow} title={title} description={description} />
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}

type DashboardPageProps = {
  standalone?: boolean;
};

export default function DashboardPage({ standalone = false }: DashboardPageProps) {
  const navigate = useNavigate();
  const [refreshInterval, setRefreshInterval] = useState(300_000);
  const today = format(new Date(), "yyyy-MM-dd");
  const last7dStart = format(subDays(new Date(), 6), "yyyy-MM-dd");

  const overviewQuery = { startDate: today, endDate: today };
  const sevenDayQuery = { startDate: last7dStart, endDate: today, topN: 8 };
  const refetchInterval = refreshInterval > 0 ? refreshInterval : false;

  const overview = useDashboardOverview(overviewQuery, { refetchInterval });
  const trends = useDashboardTrends(sevenDayQuery, { refetchInterval });
  const distributions = useDashboardDistributions(sevenDayQuery, { refetchInterval });
  const kol = useDashboardKol(sevenDayQuery, { refetchInterval });
  const realtime = useDashboardRealtime(overviewQuery, { refetchInterval });

  const generatedAt = formatDateTime(overview.data?.generatedAt ?? "");
  const tradeVolumeSymbols =
    trends.data?.tradeVolumeTrend[trends.data.tradeVolumeTrend.length - 1]?.symbols ?? [];
  const topCountry = distributions.data?.geoTopCountries[0];
  const topKol = kol.data?.ranking[0];
  const totalAlertCount =
    realtime.data?.alerts.reduce((total, item) => total + item.count, 0) ?? 0;
  const refreshLabel =
    refreshOptions.find((option) => option.value === refreshInterval)?.label ?? "--";
  const isRefreshing =
    overview.isFetching ||
    trends.isFetching ||
    distributions.isFetching ||
    kol.isFetching ||
    realtime.isFetching;

  const openStandaloneWindow = () => {
    window.open(
      standaloneDashboardPath,
      "affinex-dashboard-screen",
      "noopener,noreferrer,width=1680,height=960",
    );
  };

  const refreshAll = () => {
    void Promise.all([
      overview.refetch(),
      trends.refetch(),
      distributions.refetch(),
      kol.refetch(),
      realtime.refetch(),
    ]);
  };

  const funnelData = [
    { name: "点击归因", value: kol.data?.funnel.callbackUserCount ?? 0 },
    { name: "注册用户", value: kol.data?.funnel.registrationCount ?? 0 },
    { name: "入金用户", value: kol.data?.funnel.firstDepositUserCount ?? 0 },
    { name: "交易用户", value: kol.data?.funnel.tradeUserCount ?? 0 },
  ];

  const settlementMonitor = realtime.data?.settlementMonitor;
  const recentTrades = realtime.data?.recentTrades ?? [];
  const recentSettlements = realtime.data?.recentSettlements ?? [];
  const recentTradeAmountTotal = recentTrades.reduce((total, item) => total + item.tradeAmountUsd, 0);
  const recentTradeVolumeTotal = recentTrades.reduce((total, item) => total + item.volume, 0);
  const recentTradeSymbolCount = new Set(recentTrades.map((item) => item.symbolCode)).size;
  const recentSettlementAmountTotal = recentSettlements.reduce(
    (total, item) => total + item.payableAmountUsd,
    0,
  );
  const approvedSettlementCount = recentSettlements.filter((item) =>
    item.status.trim().toLowerCase().includes("approved"),
  ).length;

  return (
    <div
      className={
        standalone
          ? "relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#dff7f1_0%,transparent_24%),radial-gradient(circle_at_top_right,#ffe9d8_0%,transparent_26%),linear-gradient(180deg,#f8fafc,#eef2ff)] px-3 py-4 md:px-6 md:py-6"
          : "space-y-6 bg-transparent"
      }
    >
      {standalone ? (
        <>
          <div className="pointer-events-none absolute left-[-120px] top-[-120px] h-72 w-72 rounded-full bg-teal-200/40 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-120px] right-[-100px] h-80 w-80 rounded-full bg-orange-200/35 blur-3xl" />
        </>
      ) : null}

      <div className={standalone ? "relative mx-auto max-w-[1680px]" : ""}>
        <section className={softCardClass}>
          <div className="relative">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,118,110,0.05),transparent_28%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.10),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,250,252,0.92))]" />
            <div className="absolute right-[-72px] top-[-88px] h-52 w-52 rounded-full bg-orange-100/80 blur-3xl" />
            <div className="absolute left-[-48px] top-8 h-44 w-44 rounded-full bg-teal-100/80 blur-3xl" />

            <div className="relative border-b border-slate-200/80 px-5 py-4 md:px-7 md:py-5">
              <div className="mb-5 rounded-[24px] border border-slate-200/90 bg-white/95 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.08)] backdrop-blur md:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                        Console Actions
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {isRefreshing ? "Syncing" : "System Ready"}
                      </div>
                      <div className="text-xs font-medium text-slate-500">Auto refresh {refreshLabel}</div>
                    </div>
                    <div className="mt-3 text-sm font-semibold tracking-tight text-slate-900 md:text-[15px]">
                      {isRefreshing ? "正在同步全部模块数据，请稍候。" : "操作区已准备好，可以直接刷新或切换展示模式。"}
                    </div>
                    <div className="mt-1 text-xs leading-6 text-slate-500">
                      数据时间 {generatedAt || "--"} · Top 市场 {topCountry?.countryCode || "--"} · 风险事件 {totalAlertCount}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 rounded-[20px] border border-slate-200 bg-slate-50 p-2">
                    {standalone ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 rounded-[14px] border-slate-200 bg-white px-4 text-slate-700 shadow-sm hover:bg-slate-50"
                        onClick={() => navigate("/dashboard")}
                      >
                        返回后台
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 rounded-[14px] border-slate-200 bg-white px-4 text-slate-700 shadow-sm hover:bg-slate-50"
                        onClick={openStandaloneWindow}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        新窗口展示
                      </Button>
                    )}


                    <Button
                        type="button"
                        variant="outline"
                        className="h-10 rounded-[14px] border-slate-200 bg-white px-4 text-slate-700 shadow-sm hover:bg-slate-50"
                        onClick={refreshAll}
                    >
                      <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                      立即刷新
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_400px]">
                <div className="max-w-4xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-500 shadow-sm">
                    <Compass className="h-3 w-3 text-teal-600" />
                    Affinex Data Board
                  </div>

                  <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 md:text-[38px]">
                    KOL 业务数据大屏
                  </h1>
                  <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryChip
                      label="数据窗口"
                      value={`${last7dStart} 至 ${today}`}
                    />
                    <SummaryChip
                      label="Top 市场"
                      value={topCountry ? topCountry.countryCode : "--"}
                    />
                    <SummaryChip
                      label="Top KOL"
                      value={
                        topKol?.affiliateName || topKol?.affiliateCode || topKol?.affiliateId || "--"
                      }
                    />
                    <SummaryChip
                      label="风险事件"
                      value={`${totalAlertCount.toLocaleString()} 条`}
                    />
                  </div>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  <HeroStat
                    label="数据时间"
                    value={generatedAt || "--"}
                    helper="默认按日汇总，同时支持自动刷新和手动强制同步。"
                    icon={<Clock3 className="h-4 w-4" />}
                  />
                  <HeroStat
                    label="刷新策略"
                    value={refreshLabel}
                    helper="大屏模式建议保持 5 分钟节奏，稳定且足够实时。"
                    icon={<RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />}
                  />
                  <HeroStat
                    label="交易热区"
                    value={
                      topCountry
                        ? `${topCountry.countryCode} / ${topCountry.tradeUserCount.toLocaleString()} users`
                        : "--"
                    }
                    helper="热力板会把交易金额最高的区域做更强的视觉强调。"
                    icon={<Globe2 className="h-4 w-4" />}
                  />
                  <HeroStat
                    label="结算状态"
                    value={formatCompact(settlementMonitor?.pendingSettlementAmountUsd ?? 0, "USD")}
                    helper="这里优先露出待结算金额，让财务风险更容易被第一眼看见。"
                    icon={<Wallet className="h-4 w-4" />}
                  />

                </div>
              </div>
            </div>

            <div className="relative px-5 py-5 md:px-7 md:py-7">
              <div className="min-w-0 space-y-6">
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                  {(overview.data?.cards ?? []).map((card, index) => (
                    <DashboardKpiTile key={card.code} card={card} index={index} />
                  ))}
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <ChartCard
                    eyebrow="Trend"
                    title="交易金额趋势"
                    icon={<TrendingUp className="h-4 w-4" />}
                    description="柱状看金额，折线看交易用户数，保留双轴对比但减少噪音。"
                  >
                    <div className={chartPanelClass}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={trends.data?.tradeAmountTrend ?? []}>
                          <CartesianGrid stroke="rgba(148,163,184,0.18)" vertical={false} />
                          <XAxis dataKey="date" tick={axisTick} axisLine={false} tickLine={false} />
                          <YAxis
                            yAxisId="left"
                            tick={axisTick}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={axisTick}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={tooltipContentStyle}
                            labelStyle={tooltipLabelStyle}
                            cursor={{ fill: "rgba(148,163,184,0.08)" }}
                          />
                          <Legend wrapperStyle={legendWrapperStyle} />
                          <Bar
                            yAxisId="left"
                            dataKey="tradeAmountUsd"
                            name="交易金额"
                            fill="#ea580c"
                            barSize={20}
                            radius={[10, 10, 0, 0]}
                          />
                          <Line
                            yAxisId="right"
                            dataKey="tradeUserCount"
                            name="交易用户数"
                            stroke="#0f766e"
                            strokeWidth={2.4}
                            dot={{ r: 2.5, fill: "#0f766e", strokeWidth: 0 }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartCard>

                  <ChartCard
                    eyebrow="Trend"
                    title="返佣金额趋势"
                    icon={<Wallet className="h-4 w-4" />}
                    description="保留返佣走势和日环比关系，但整体更适合白底大屏阅读。"
                  >
                    <div className={chartPanelClass}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={trends.data?.commissionTrend ?? []}>
                          <CartesianGrid stroke="rgba(148,163,184,0.18)" vertical={false} />
                          <XAxis dataKey="date" tick={axisTick} axisLine={false} tickLine={false} />
                          <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={tooltipContentStyle}
                            labelStyle={tooltipLabelStyle}
                            cursor={{ fill: "rgba(148,163,184,0.08)" }}
                          />
                          <Legend wrapperStyle={legendWrapperStyle} />
                          <Line
                            dataKey="earnedCommissionUsd"
                            name="返佣总额"
                            stroke="#2563eb"
                            strokeWidth={2.6}
                            dot={{ r: 2.5, fill: "#2563eb", strokeWidth: 0 }}
                          />
                          <Bar
                            dataKey="dayOverDayRate"
                            name="环比"
                            fill="#f59e0b"
                            barSize={18}
                            radius={[10, 10, 0, 0]}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartCard>
                </div>

                <ChartCard
                  eyebrow="Trend"
                  title="交易手数趋势"
                  icon={<Globe2 className="h-4 w-4" />}
                  description="按品种堆叠展示，横向大屏下会比传统列表更高效。"
                >
                  <div className={chartPanelClass}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trends.data?.tradeVolumeTrend ?? []}>
                        <CartesianGrid stroke="rgba(148,163,184,0.18)" vertical={false} />
                        <XAxis dataKey="date" tick={axisTick} axisLine={false} tickLine={false} />
                        <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={tooltipContentStyle}
                          labelStyle={tooltipLabelStyle}
                          cursor={{ fill: "rgba(148,163,184,0.08)" }}
                        />
                        <Legend wrapperStyle={legendWrapperStyle} />
                        {tradeVolumeSymbols.map((symbol, index) => (
                          <Bar
                            key={symbol.symbolCode}
                            dataKey={(row) =>
                              row.symbols.find((item) => item.symbolCode === symbol.symbolCode)
                                ?.tradeVolume ?? 0
                            }
                            stackId="volume"
                            name={symbol.symbolCode}
                            fill={chartColors[index % chartColors.length]}
                            radius={index === tradeVolumeSymbols.length - 1 ? [10, 10, 0, 0] : 0}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <div className="grid gap-4 2xl:grid-cols-[1.35fr_0.92fr_0.92fr]">
                  <Card className={panelCardClass}>
                    <CardHeader className="pb-3">
                      <SectionTitle
                        icon={<Globe2 className="h-4 w-4" />}
                        eyebrow="Structure"
                        title="全球地区交易分布"
                        description="热力板和 Top 市场并排呈现，既直观又不会显得过重。"
                      />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.95fr)]">
                        <GeoHeatBoard items={distributions.data?.geoHeatmap ?? []} />
                        <GeoDistributionPie
                          items={
                            (distributions.data?.geoTopCountries?.length
                              ? distributions.data?.geoTopCountries
                              : distributions.data?.geoHeatmap) ?? []
                          }
                        />
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        {(distributions.data?.geoTopCountries ?? []).map((item, index) => (
                          <div
                            key={`${item.countryCode}-${index}`}
                            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm"
                          >
                            <div className="flex items-center gap-3">
                              <Badge
                                variant="outline"
                                className={`${getRankTone(index)} border px-2.5 py-1`}
                              >
                                #{index + 1}
                              </Badge>
                              <span className="font-medium text-slate-800">{item.countryCode}</span>
                            </div>
                            <div className="text-right text-slate-600">
                              <div className="font-medium text-slate-900">
                                ${item.tradeAmountUsd.toFixed(2)}
                              </div>
                              <div className="text-xs text-slate-500">
                                {item.tradeUserCount} users
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <ChartCard
                    eyebrow="Structure"
                    title="返佣类型结构"
                    icon={<Wallet className="h-4 w-4" />}
                  >
                    <div className={chartPanelClass}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} />
                          <Legend wrapperStyle={legendWrapperStyle} />
                          <Pie
                            data={distributions.data?.rebateTypes ?? []}
                            dataKey="amountUsd"
                            nameKey="label"
                            innerRadius={52}
                            outerRadius={74}
                            paddingAngle={3}
                          >
                            {(distributions.data?.rebateTypes ?? []).map((item, index) => (
                              <Cell key={item.typeCode} fill={chartColors[index % chartColors.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartCard>

                  <div className="grid gap-4">
                    <ChartCard
                      eyebrow="Structure"
                      title="交易品种分布"
                      icon={<TrendingUp className="h-4 w-4" />}
                    >
                      <div className={chartPanelClass}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} />
                            <Legend wrapperStyle={legendWrapperStyle} />
                            <Pie
                              data={distributions.data?.products ?? []}
                              dataKey="tradeUserCount"
                              nameKey="symbolCode"
                              innerRadius={44}
                              outerRadius={66}
                              paddingAngle={3}
                            >
                              {(distributions.data?.products ?? []).map((item, index) => (
                                <Cell key={item.symbolCode} fill={chartColors[index % chartColors.length]} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </ChartCard>

                    <ChartCard
                      eyebrow="Structure"
                      title="账户类型分布"
                      icon={<Users2 className="h-4 w-4" />}
                    >
                      <div className={chartPanelClass}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} />
                            <Legend wrapperStyle={legendWrapperStyle} />
                            <Pie
                              data={distributions.data?.accountTypes ?? []}
                              dataKey="count"
                              nameKey="accountType"
                              innerRadius={40}
                              outerRadius={62}
                              paddingAngle={3}
                            >
                              {(distributions.data?.accountTypes ?? []).map((item, index) => (
                                <Cell key={item.accountType} fill={chartColors[index % chartColors.length]} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </ChartCard>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.2fr_0.95fr]">
                  <Card className={panelCardClass}>
                    <CardHeader className="pb-3">
                      <SectionTitle
                        icon={<Users2 className="h-4 w-4" />}
                        eyebrow="KOL"
                        title="KOL 贡献排行"
                        description="表格去掉厚重底色，改成更适合大屏扫读的轻量信息层。"
                      />
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-3">
                        <table className="min-w-full text-left text-sm">
                          <thead className="text-slate-500">
                            <tr>
                              <th className="pb-3 font-medium">KOL</th>
                              <th className="pb-3 font-medium">Owner</th>
                              <th className="pb-3 text-right font-medium">用户数</th>
                              <th className="pb-3 text-right font-medium">交易金额</th>
                              <th className="pb-3 text-right font-medium">返佣金额</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-slate-700">
                            {(kol.data?.ranking ?? []).map((item, index) => (
                              <tr key={item.affiliateId} className="transition hover:bg-white/90">
                                <td className="py-4 pr-4">
                                  <div className="flex items-center gap-3">
                                    <Badge
                                      variant="outline"
                                      className={`${getRankTone(index)} border px-2.5 py-1`}
                                    >
                                      #{index + 1}
                                    </Badge>
                                    <div>
                                      <div className="font-medium text-slate-900">
                                        {item.affiliateName || item.affiliateCode || item.affiliateId}
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        {item.countryCode || "--"}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4">{item.ownerName || "Unassigned"}</td>
                                <td className="py-4 text-right">{item.broughtUserCount.toLocaleString()}</td>
                                <td className="py-4 text-right font-medium text-slate-900">
                                  ${item.tradeAmountUsd.toFixed(2)}
                                </td>
                                <td className="py-4 text-right font-medium text-teal-700">
                                  ${item.earnedCommissionUsd.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={panelCardClass}>
                    <CardHeader className="pb-3">
                      <SectionTitle
                        icon={<Users2 className="h-4 w-4" />}
                        eyebrow="KOL"
                        title="KOL 用户转化漏斗"
                        description="漏斗仍然保留，但放进更克制的容器里，读数更稳。"
                      />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="h-72 rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <FunnelChart>
                            <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} />
                            <Funnel dataKey="value" data={funnelData} isAnimationActive>
                              <LabelList position="right" fill="#334155" stroke="none" dataKey="name" />
                            </Funnel>
                          </FunnelChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                          点击到注册
                          <div className="mt-1 font-semibold text-slate-900">
                            {formatPercent(kol.data?.funnel.callbackToRegistrationRate ?? 0)}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                          注册到入金
                          <div className="mt-1 font-semibold text-slate-900">
                            {formatPercent(kol.data?.funnel.registrationToFirstDepositRate ?? 0)}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                          入金到交易
                          <div className="mt-1 font-semibold text-slate-900">
                            {formatPercent(kol.data?.funnel.firstDepositToTradeRate ?? 0)}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                          整体交易转化
                          <div className="mt-1 font-semibold text-slate-900">
                            {formatPercent(kol.data?.funnel.overallTradeRate ?? 0)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 2xl:grid-cols-[1.1fr_1fr_0.88fr]">
                  <Card className={panelCardClass}>
                    <CardHeader className="pb-3">
                      <SectionTitle
                        icon={<TrendingUp className="h-4 w-4" />}
                        eyebrow="Realtime"
                        title="实时交易流水"
                        description="滚动流水改成轻卡片列表，信息更完整，阅读也没那么疲劳。"
                      />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="rounded-[18px] border border-slate-200 bg-slate-50/90 px-3 py-2.5">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Trades</div>
                          <div className="mt-1 text-lg font-semibold text-slate-900">
                            {recentTrades.length.toLocaleString()}
                          </div>
                        </div>
                        <div className="rounded-[18px] border border-slate-200 bg-slate-50/90 px-3 py-2.5">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Symbols</div>
                          <div className="mt-1 text-lg font-semibold text-slate-900">
                            {recentTradeSymbolCount.toLocaleString()}
                          </div>
                        </div>
                        <div className="rounded-[18px] border border-slate-200 bg-slate-50/90 px-3 py-2.5">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Amount</div>
                          <div className="mt-1 text-lg font-semibold text-slate-900">
                            {formatCompact(recentTradeAmountTotal, "USD")}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {formatCompact(recentTradeVolumeTotal, "lots")}
                          </div>
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)]">
                        <div className="hidden grid-cols-[1.15fr_1fr_0.8fr_0.95fr_0.8fr] gap-3 border-b border-slate-200 bg-slate-50/90 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 lg:grid">
                          <span>Symbol / KOL</span>
                          <span>Open Time</span>
                          <span>Volume</span>
                          <span className="text-right">Amount</span>
                          <span className="text-right">Type</span>
                        </div>

                        <ScrollArea className="h-[25rem] pr-2">
                          <div className="divide-y divide-slate-200/80">
                            {recentTrades.map((item, index) => (
                              <div
                                key={`${item.openTime}-${index}`}
                                className="grid gap-2 px-4 py-3 text-sm text-slate-600 lg:grid-cols-[1.15fr_1fr_0.8fr_0.95fr_0.8fr] lg:items-center lg:gap-3"
                              >
                                <div className="min-w-0">
                                  <div className="truncate font-semibold text-slate-900">{item.symbolCode}</div>
                                  <div className="truncate text-xs text-slate-500">
                                    {item.affiliateName || "Unknown KOL"}
                                  </div>
                                </div>
                                <div className="text-xs text-slate-500 lg:text-sm">
                                  {formatDateTime(item.openTime)}
                                </div>
                                <div className="font-medium text-slate-700">
                                  {item.volume.toFixed(2)} lots
                                </div>
                                <div className="font-semibold text-slate-900 lg:text-right">
                                  ${item.tradeAmountUsd.toFixed(2)}
                                </div>
                                <div className="lg:text-right">
                                  <Badge
                                    variant="outline"
                                    className={`${getOrderTypeTone(item.orderType || "")} border px-2.5 py-0.5`}
                                  >
                                    {item.orderType || "--"}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={panelCardClass}>
                    <CardHeader className="pb-3">
                      <SectionTitle
                        icon={<Wallet className="h-4 w-4" />}
                        eyebrow="Realtime"
                        title="返佣结算监控"
                        description="结算面板和最近单据分层展示，视觉上更像真正的运营看板。"
                      />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-[18px] border border-slate-200 bg-slate-50/90 px-3 py-2.5">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Pending</div>
                          <div className="mt-1 text-lg font-semibold text-slate-900">
                            {formatCompact(settlementMonitor?.pendingSettlementAmountUsd ?? 0, "USD")}
                          </div>
                        </div>
                        <div className="rounded-[18px] border border-slate-200 bg-slate-50/90 px-3 py-2.5">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Month</div>
                          <div className="mt-1 text-lg font-semibold text-slate-900">
                            {formatCompact(settlementMonitor?.monthSettledAmountUsd ?? 0, "USD")}
                          </div>
                        </div>
                        <div className="rounded-[18px] border border-slate-200 bg-slate-50/90 px-3 py-2.5">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Settling KOL</div>
                          <div className="mt-1 text-lg font-semibold text-slate-900">
                            {(settlementMonitor?.settlingKolCount ?? 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="rounded-[18px] border border-slate-200 bg-slate-50/90 px-3 py-2.5">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Recent Total</div>
                          <div className="mt-1 text-lg font-semibold text-slate-900">
                            {formatCompact(recentSettlementAmountTotal, "USD")}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {approvedSettlementCount.toLocaleString()} approved
                          </div>
                        </div>
                      </div>

                      <div className="hidden">
                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                          <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                            待结算返佣
                          </div>
                          <div className="mt-2 text-xl font-semibold text-slate-900">
                            {formatCompact(settlementMonitor?.pendingSettlementAmountUsd ?? 0, "USD")}
                          </div>
                        </div>
                        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                          <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                            本月已结算
                          </div>
                          <div className="mt-2 text-xl font-semibold text-slate-900">
                            {formatCompact(settlementMonitor?.monthSettledAmountUsd ?? 0, "USD")}
                          </div>
                        </div>
                        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                          <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                            累计已结算
                          </div>
                          <div className="mt-2 text-xl font-semibold text-slate-900">
                            {formatCompact(settlementMonitor?.cumulativeSettledAmountUsd ?? 0, "USD")}
                          </div>
                        </div>
                        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                          <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                            结算中 KOL
                          </div>
                          <div className="mt-2 text-xl font-semibold text-slate-900">
                            {(settlementMonitor?.settlingKolCount ?? 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      </div>

                      <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)]">
                        <div className="hidden grid-cols-[1.15fr_0.95fr_0.9fr_0.8fr] gap-3 border-b border-slate-200 bg-slate-50/90 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 lg:grid">
                          <span>KOL / ID</span>
                          <span>Settlement Time</span>
                          <span className="text-right">Payable</span>
                          <span className="text-right">Status</span>
                        </div>

                        <ScrollArea className="h-[18.5rem] pr-2">
                          <div className="divide-y divide-slate-200/80">
                            {recentSettlements.map((item) => (
                              <div
                                key={item.settlementId}
                                className="grid gap-2 px-4 py-3 text-sm text-slate-600 lg:grid-cols-[1.15fr_0.95fr_0.9fr_0.8fr] lg:items-center lg:gap-3"
                              >
                                <div className="min-w-0">
                                  <div className="truncate font-semibold text-slate-900">
                                    {item.affiliateName || "Unknown KOL"}
                                  </div>
                                  <div className="text-xs text-slate-500">#{item.settlementId}</div>
                                </div>
                                <div className="text-xs text-slate-500 lg:text-sm">
                                  {formatDateTime(item.settlementTime)}
                                </div>
                                <div className="font-semibold text-slate-900 lg:text-right">
                                  ${item.payableAmountUsd.toFixed(2)}
                                </div>
                                <div className="lg:text-right">
                                  <Badge
                                    variant="outline"
                                    className={`${getSettlementStatusTone(item.status)} border px-2.5 py-0.5`}
                                  >
                                    {item.status}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>

                      <div className="hidden">
                        <ScrollArea className="h-44 pr-3">
                        <div className="space-y-3">
                          {(realtime.data?.recentSettlements ?? []).map((item) => (
                            <div
                              key={item.settlementId}
                              className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="font-medium text-slate-900">{item.affiliateName}</div>
                                  <div className="text-xs text-slate-500">#{item.settlementId}</div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="border-slate-200 bg-white text-slate-600"
                                >
                                  {item.status}
                                </Badge>
                              </div>
                              <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                                <span>{formatDateTime(item.settlementTime)}</span>
                                <span className="font-medium text-slate-900">
                                  ${item.payableAmountUsd.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        </ScrollArea>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={panelCardClass}>
                    <CardHeader className="pb-3">
                      <SectionTitle
                        icon={<AlertTriangle className="h-4 w-4" />}
                        eyebrow="Alert"
                        title="风险与待办"
                        description="右侧做成高频提醒列，适合不断扫一眼的工作习惯。"
                      />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="rounded-[22px] border border-slate-200 bg-slate-50/90 p-4">
                        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                          Alert Summary
                        </div>
                        <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                          {totalAlertCount.toLocaleString()}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          当前聚合风险事件总量，适合做一眼感知。
                        </div>
                      </div>
                      {(realtime.data?.alerts ?? []).map((item) => (
                        <AlertBadge key={item.code} item={item} />
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
