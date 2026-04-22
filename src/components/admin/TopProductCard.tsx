import { ChevronDown } from "lucide-react";

const TopProductCard = () => {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-soft text-2xl">
            🖥️
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Top product</p>
            <p className="text-lg font-semibold text-card-foreground">Apple iMac 24"</p>
            <p className="text-xs font-medium text-destructive">-2% vs last month</p>
          </div>
        </div>
        <p className="text-2xl font-semibold text-card-foreground">$98,543</p>
      </div>

      <div className="mt-6 space-y-3">
        {[
          { name: "MacBook Pro 14", value: 82, sales: "$72,210" },
          { name: "iPhone 15 Pro", value: 68, sales: "$58,930" },
          { name: "iPad Air", value: 54, sales: "$41,205" },
          { name: "AirPods Pro", value: 41, sales: "$28,540" },
        ].map((row) => (
          <div key={row.name} className="flex items-center gap-3 text-sm">
            <span className="w-32 truncate text-muted-foreground">{row.name}</span>
            <div className="flex-1 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${row.value}%` }} />
            </div>
            <span className="w-20 text-right font-medium text-card-foreground">{row.sales}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
        <button className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
          Last 7 days <ChevronDown className="h-3 w-3" />
        </button>
        <button className="font-semibold uppercase tracking-wide text-primary hover:underline">
          Full report →
        </button>
      </div>
    </div>
  );
};

export default TopProductCard;