import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireCurrentUser } from "./lib/auth.ts";

export const listForCustomer = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const customer = await ctx.db.get("customers", args.customerId);
    if (!customer || customer.ownerId !== user._id) {
      return [];
    }
    return await ctx.db
      .query("visits")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    customerId: v.id("customers"),
    serviceId: v.id("services"),
    amount: v.number(),
    visitDate: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const customer = await ctx.db.get("customers", args.customerId);
    if (!customer || customer.ownerId !== user._id) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Customer not found" });
    }
    const service = await ctx.db.get("services", args.serviceId);
    if (!service || service.ownerId !== user._id) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Service not found" });
    }
    if (args.amount < 0) {
      throw new ConvexError({ code: "BAD_REQUEST", message: "Amount cannot be negative" });
    }
    await ctx.db.insert("visits", {
      ownerId: user._id,
      customerId: args.customerId,
      serviceId: args.serviceId,
      serviceName: service.name,
      amount: args.amount,
      visitDate: args.visitDate,
      notes: args.notes?.trim(),
    });
    await ctx.db.patch("customers", args.customerId, {
      visitCount: customer.visitCount + 1,
      totalSpend: customer.totalSpend + args.amount,
      lastVisitAt: args.visitDate,
    });
    return null;
  },
});

export const remove = mutation({
  args: { visitId: v.id("visits") },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const visit = await ctx.db.get("visits", args.visitId);
    if (!visit || visit.ownerId !== user._id) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Visit not found" });
    }
    const customer = await ctx.db.get("customers", visit.customerId);
    if (customer) {
      await ctx.db.patch("customers", visit.customerId, {
        visitCount: Math.max(0, customer.visitCount - 1),
        totalSpend: Math.max(0, customer.totalSpend - visit.amount),
      });
    }
    await ctx.db.delete("visits", args.visitId);
    return null;
  },
});
