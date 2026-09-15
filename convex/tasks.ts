import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireCurrentUser } from "./lib/auth.ts";

export const listPending = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);
    return await ctx.db
      .query("tasks")
      .withIndex("by_owner_and_completed", (q) =>
        q.eq("ownerId", user._id).eq("completed", false),
      )
      .order("asc")
      .take(200);
  },
});

export const complete = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const task = await ctx.db.get("tasks", args.taskId);
    if (!task || task.ownerId !== user._id) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Task not found" });
    }
    await ctx.db.patch("tasks", args.taskId, { completed: true });
    return null;
  },
});
