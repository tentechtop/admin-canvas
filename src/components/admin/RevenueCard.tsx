import { ChevronDown } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { d: "01 Feb", a: 4200, b: 3100 },
  { d: "02 Feb", a: 3800, b: 3400 },
  { d: "03 Feb", a: 5100, b: 3900 },
  { d: "04 Feb", a: 4600, b: 4200 },
  { d: "05 Feb", a: 6200, b: 4800 },
  { d: "06 Feb", a: 5400, b: 5100 },
  { d: "07 Feb", a: 7100, b: 5600 },
];

const RevenueCard = () => {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Total revenue</p>
          <p className="mt-1 text-3xl font-semibold text-card-foreground">$45,385</p>
          <p className="mt-1 text-xs font-medium text-success">+12.5% vs last week</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary" /> Revenue
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-chart-3" /> Previous period
          </span>
        </div>
      </div>

      <div className="mt-4 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="d" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Line type="monotone" dataKey="a" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="b" stroke="hsl(var(--chart-3))" strokeWidth={2.5} dot={false} />
            <Legend wrapperStyle={{ display: "none" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
        <button className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
          Last 7 days <ChevronDown className="h-3 w-3" />
        </button>
        <button className="font-semibold uppercase tracking-wide text-primary hover:underline">
          Sales report →
        </button>
      </div>
    </div>
  );
};

export default RevenueCard;