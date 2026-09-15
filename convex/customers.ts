import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query } from "./_generated/server";
import { requireCurrentUser } from "./lib/auth.ts";

const funnelStageValidator = v.union(
  v.literal("lead"),
  v.literal("contacted"),
  v.literal("trial"),
  v.literal("member"),
  v.literal("retained"),
  v.literal("churned"),
);

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    searchTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    if (args.searchTerm && args.searchTerm.trim().length > 0) {
      return await ctx.db
        .query("customers")
        .withSearchIndex("search_name", (q) =>
          q.search("name", args.searchTerm!.trim()).eq("ownerId", user._id),
        )
        .paginate(args.paginationOpts);
    }
    return await ctx.db
      .query("customers")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const listByStage = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);
    return await ctx.db
      .query("customers")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .order("desc")
      .take(500);
  },
});

export const get = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const customer = await ctx.db.get("customers", args.customerId);
    if (!customer || customer.ownerId !== user._id) {
      return null;
    }
    return customer;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    source: v.string(),
    scope: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    if (args.name.trim().length === 0) {
      throw new ConvexError({ code: "BAD_REQUEST", message: "Name is required" });
    }
    if (args.phone.trim().length === 0) {
      throw new ConvexError({ code: "BAD_REQUEST", message: "Phone number is required" });
    }
    return await ctx.db.insert("customers", {
      ownerId: user._id,
      name: args.name.trim(),
      phone: args.phone.trim(),
      email: args.email?.trim(),
      source: args.source,
      scope: args.scope,
      notes: args.notes?.trim(),
      funnelStage: "lead",
      visitCount: 0,
      totalSpend: 0,
      createdAt: new Date().toISOString(),
    });
  },
});

export const update = mutation({
  args: {
    customerId: v.id("customers"),
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    source: v.string(),
    scope: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const customer = await ctx.db.get("customers", args.customerId);
    if (!customer || customer.ownerId !== user._id) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Customer not found" });
    }
    await ctx.db.patch("customers", args.customerId, {
      name: args.name.trim(),
      phone: args.phone.trim(),
      email: args.email?.trim(),
      source: args.source,
      scope: args.scope,
      notes: args.notes?.trim(),
    });
    return null;
  },
});

export const remove = mutation({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const customer = await ctx.db.get("customers", args.customerId);
    if (!customer || customer.ownerId !== user._id) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Customer not found" });
    }
    // Clean up related visits and tasks in bounded batches.
    const visits = await ctx.db
      .query("visits")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .collect();
    for (const visit of visits) {
      await ctx.db.delete("visits", visit._id);
    }
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .collect();
    for (const task of tasks) {
      await ctx.db.delete("tasks", task._id);
    }
    await ctx.db.delete("customers", args.customerId);
    return null;
  },
});

export const setFunnelStage = mutation({
  args: {
    customerId: v.id("customers"),
    funnelStage: funnelStageValidator,
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const customer = await ctx.db.get("customers", args.customerId);
    if (!customer || customer.ownerId !== user._id) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Customer not found" });
    }
    await ctx.db.patch("customers", args.customerId, { funnelStage: args.funnelStage });

    // Automation: moving into a new stage schedules a relevant follow-up task.
    const followUps: Record<string, { title: string; daysFromNow: number } | null> = {
      lead: { title: `Call ${customer.name} to introduce our services`, daysFromNow: 1 },
      contacted: { title: `Follow up with ${customer.name} to book a trial`, daysFromNow: 2 },
      trial: { title: `Check in with ${customer.name} after trial session`, daysFromNow: 1 },
      member: { title: `Welcome ${customer.name} as a member, plan their schedule`, daysFromNow: 3 },
      retained: { title: `Check in with ${customer.name} on progress`, daysFromNow: 14 },
      churned: { title: `Send a win-back offer to ${customer.name}`, daysFromNow: 7 },
    };
    const followUp = followUps[args.funnelStage];
    if (followUp) {
      const dueDate = new Date();
      dueDate.setUTCDate(dueDate.getUTCDate() + followUp.daysFromNow);
      await ctx.db.insert("tasks", {
        ownerId: user._id,
        customerId: args.customerId,
        title: followUp.title,
        dueDate: dueDate.toISOString(),
        completed: false,
        createdAt: new Date().toISOString(),
      });
    }
    return null;
  },
});
