import { Calendar } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { m: "Jan", a: 320, b: 180, c: 240 },
  { m: "Feb", a: 480, b: 260, c: 200 },
  { m: "Mar", a: 520, b: 320, c: 280 },
  { m: "Apr", a: 610, b: 290, c: 360 },
  { m: "May", a: 380, b: 220, c: 180 },
  { m: "Jun", a: 720, b: 410, c: 320 },
  { m: "Jul", a: 540, b: 360, c: 290 },
  { m: "Aug", a: 690, b: 430, c: 350 },
  { m: "Sep", a: 440, b: 280, c: 220 },
  { m: "Oct", a: 580, b: 340, c: 300 },
  { m: "Nov", a: 660, b: 390, c: 340 },
  { m: "Dec", a: 510, b: 320, c: 260 },
];

const SalesByCategory = () => {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Sales by category</p>
          <h3 className="mt-1 text-2xl font-semibold text-card-foreground">Desktop PC</h3>
          <p className="mt-1 text-xs font-medium text-success">+2.3% Since last month</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
          <Calendar className="h-3.5 w-3.5" />
          Last 12 months
        </button>
      </div>

      <div className="mt-6 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="m" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted))" }}
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="a" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="b" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="c" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
        <span className="text-muted-foreground">12 months overview</span>
        <button className="font-semibold uppercase tracking-wide text-primary hover:underline">
          Sales report →
        </button>
      </div>
    </div>
  );
};

export default SalesByCategory;