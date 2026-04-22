import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer } from "recharts";

type StatCardProps = {
  label: string;
  value: string;
  delta: number;
  data: number[];
  variant?: "vertical" | "horizontal";
};

const StatCard = ({ label, value, delta, data, variant = "vertical" }: StatCardProps) => {
  const positive = delta >= 0;
  const chartData = data.map((v, i) => ({ i, v }));

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-card-foreground">{value}</p>
          <p
            className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${
              positive ? "text-success" : "text-destructive"
            }`}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta)}%
            <span className="text-muted-foreground">Since last month</span>
          </p>
        </div>
        <div className="h-16 w-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout={variant === "horizontal" ? "vertical" : "horizontal"}>
              <Bar dataKey="v" fill="hsl(var(--primary))" radius={2} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StatCard;