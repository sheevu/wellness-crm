import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireCurrentUser } from "./lib/auth.ts";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);
    return await ctx.db
      .query("services")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    price: v.number(),
    durationMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    if (args.name.trim().length === 0) {
      throw new ConvexError({ code: "BAD_REQUEST", message: "Service name is required" });
    }
    return await ctx.db.insert("services", {
      ownerId: user._id,
      name: args.name.trim(),
      category: args.category,
      price: args.price,
      durationMinutes: args.durationMinutes,
      active: true,
    });
  },
});

export const update = mutation({
  args: {
    serviceId: v.id("services"),
    name: v.string(),
    category: v.string(),
    price: v.number(),
    durationMinutes: v.number(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const service = await ctx.db.get("services", args.serviceId);
    if (!service || service.ownerId !== user._id) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Service not found" });
    }
    await ctx.db.patch("services", args.serviceId, {
      name: args.name.trim(),
      category: args.category,
      price: args.price,
      durationMinutes: args.durationMinutes,
      active: args.active,
    });
    return null;
  },
});

export const remove = mutation({
  args: { serviceId: v.id("services") },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const service = await ctx.db.get("services", args.serviceId);
    if (!service || service.ownerId !== user._id) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Service not found" });
    }
    await ctx.db.delete("services", args.serviceId);
    return null;
  },
});
