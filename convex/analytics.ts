import { query } from "./_generated/server";
import { requireCurrentUser } from "./lib/auth.ts";
import type { Doc } from "./_generated/dataModel.d.ts";

const MONTHS_OF_TREND = 6;

function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7); // YYYY-MM
}

export const getDashboard = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);

    const customers = await ctx.db
      .query("customers")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .take(2000);

    // Bounded read: a small/medium business's full visit history fits comfortably
    // within this cap. Revisit with pagination if visit volume grows much larger.
    const visits = await ctx.db
      .query("visits")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .order("desc")
      .take(2000);

    const now = new Date();
    const currentMonthKey = now.toISOString().slice(0, 7);

    let visitsThisMonth = 0;
    let revenueThisMonth = 0;
    const monthBuckets = new Map<string, { visits: number; revenue: number }>();

    for (const visit of visits as Doc<"visits">[]) {
      const key = monthKey(visit.visitDate);
      if (key === currentMonthKey) {
        visitsThisMonth += 1;
        revenueThisMonth += visit.amount;
      }
      const bucket = monthBuckets.get(key) ?? { visits: 0, revenue: 0 };
      bucket.visits += 1;
      bucket.revenue += visit.amount;
      monthBuckets.set(key, bucket);
    }

    const trend: { month: string; visits: number; revenue: number }[] = [];
    for (let i = MONTHS_OF_TREND - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const bucket = monthBuckets.get(key) ?? { visits: 0, revenue: 0 };
      trend.push({
        month: d.toLocaleDateString("en-IN", { month: "short" }),
        visits: bucket.visits,
        revenue: bucket.revenue,
      });
    }

    const funnelCounts: Record<Doc<"customers">["funnelStage"], number> = {
      lead: 0,
      contacted: 0,
      trial: 0,
      member: 0,
      retained: 0,
      churned: 0,
    };
    let totalSpend = 0;
    for (const customer of customers as Doc<"customers">[]) {
      funnelCounts[customer.funnelStage] += 1;
      totalSpend += customer.totalSpend;
    }

    const activeCustomers = customers.length - funnelCounts.churned;
    const membersOrRetained = funnelCounts.member + funnelCounts.retained;
    const conversionRate =
      customers.length > 0 ? Math.round((membersOrRetained / customers.length) * 100) : 0;

    return {
      totalCustomers: customers.length,
      activeCustomers,
      visitsThisMonth,
      revenueThisMonth,
      totalRevenue: totalSpend,
      conversionRate,
      funnelCounts,
      trend,
    };
  },
});
