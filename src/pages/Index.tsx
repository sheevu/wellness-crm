import { Authenticated, Unauthenticated, AuthLoading, useQuery } from "convex/react";
import { Link } from "react-router-dom";
import {
  Users,
  Sparkles,
  ArrowRight,
  TrendingUp,
  UserCheck,
  Target,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import {
  FUNNEL_STAGES,
  FUNNEL_STAGE_LABELS,
  type FunnelStage,
  formatInr,
} from "@/lib/crm-constants.ts";

const FUNNEL_CHART_COLORS: Record<FunnelStage, string> = {
  lead: "var(--chart-4)",
  contacted: "var(--chart-3)",
  trial: "var(--chart-5)",
  member: "var(--primary)",
  retained: "var(--chart-2)",
  churned: "var(--destructive)",
};

function DashboardInner() {
  const stats = useQuery(api.analytics.getDashboard, {});

  const statCards = stats
    ? [
        {
          label: "Total Customers",
          value: stats.totalCustomers,
          icon: Users,
          color: "from-primary to-chart-4",
        },
        {
          label: "Visits This Month",
          value: stats.visitsThisMonth,
          icon: TrendingUp,
          color: "from-accent to-chart-2",
        },
        {
          label: "Revenue This Month",
          value: formatInr(stats.revenueThisMonth),
          icon: Sparkles,
          color: "from-chart-5 to-primary",
        },
        {
          label: "Conversion Rate",
          value: `${stats.conversionRate}%`,
          icon: Target,
          color: "from-chart-2 to-chart-3",
        },
      ]
    : [];

  const funnelChartData = stats
    ? FUNNEL_STAGES.map((stage) => ({
        stage: FUNNEL_STAGE_LABELS[stage.value],
        count: stats.funnelCounts[stage.value],
        color: FUNNEL_CHART_COLORS[stage.value],
      })).filter((d) => d.count > 0)
    : [];

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Namaste! 🙏</h1>
        <p className="text-muted-foreground">Here's how your wellness business is doing.</p>
      </div>

      {stats === undefined ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div
                className={`mb-3 flex size-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-primary-foreground`}
              >
                <stat.icon className="size-5" />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {stats === undefined ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-80 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-1 flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <h2 className="font-display text-lg font-bold">Visit &amp; Revenue Trend</h2>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">Last 6 months</p>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={stats.trend}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.75rem",
                    color: "var(--card-foreground)",
                    fontSize: "0.8rem",
                  }}
                  formatter={(value, name) => {
                    const numeric = typeof value === "number" ? value : Number(value ?? 0);
                    return name === "revenue" ? [formatInr(numeric), "Revenue"] : [numeric, "Visits"];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--primary)"
                  fill="url(#revenueGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-1 flex items-center gap-2">
              <UserCheck className="size-4 text-accent" />
              <h2 className="font-display text-lg font-bold">Funnel Breakdown</h2>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">Where your customers stand today</p>
            {funnelChartData.length === 0 ? (
              <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">
                Add customers to see your funnel breakdown
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={funnelChartData}
                    dataKey="count"
                    nameKey="stage"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {funnelChartData.map((entry) => (
                      <Cell key={entry.stage} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.75rem",
                      color: "var(--card-foreground)",
                      fontSize: "0.8rem",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            {funnelChartData.length > 0 && (
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {funnelChartData.map((entry) => (
                  <div key={entry.stage} className="flex items-center gap-1.5 text-xs">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-muted-foreground">
                      {entry.stage} ({entry.count})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {stats !== undefined && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-1 flex items-center gap-2">
            <Sparkles className="size-4 text-chart-5" />
            <h2 className="font-display text-lg font-bold">Monthly Visits</h2>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">Last 6 months</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.75rem",
                  color: "var(--card-foreground)",
                  fontSize: "0.8rem",
                }}
              />
              <Bar dataKey="visits" fill="var(--accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          to="/customers"
          className="group flex items-center justify-between rounded-2xl bg-gradient-to-br from-primary to-accent p-6 text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5"
        >
          <div>
            <p className="font-display text-lg font-bold">Manage Customers</p>
            <p className="text-sm opacity-90">Add customers, log visits, track progress</p>
          </div>
          <ArrowRight className="size-6 transition-transform group-hover:translate-x-1" />
        </Link>
        <Link
          to="/funnel"
          className="group flex items-center justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <div>
            <p className="font-display text-lg font-bold">Sales Funnel</p>
            <p className="text-sm text-muted-foreground">Move customers through your journey</p>
          </div>
          <ArrowRight className="size-6 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>
        <Link
          to="/services"
          className="group flex items-center justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <div>
            <p className="font-display text-lg font-bold">Manage Services</p>
            <p className="text-sm text-muted-foreground">Set up your treatments and pricing</p>
          </div>
          <ArrowRight className="size-6 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}

export default function Index() {
  return (
    <>
      <Authenticated>
        <DashboardInner />
      </Authenticated>
      <Unauthenticated>
        <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 p-8 text-center">
          <div className="flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-accent text-4xl shadow-lg">
            🌿
          </div>
          <div>
            <h1 className="font-display text-4xl font-bold text-balance">
              PoshanCare Wellness CRM
            </h1>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground text-balance">
              Track customers, visits, and grow your health & wellness business.
            </p>
          </div>
          <SignInButton size="lg" />
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="mx-auto max-w-5xl space-y-4 p-8">
          <Skeleton className="h-10 w-1/3" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        </div>
      </AuthLoading>
    </>
  );
}
