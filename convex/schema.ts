import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  }).index("by_token", ["tokenIdentifier"]),

  services: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    category: v.string(),
    price: v.number(), // INR
    durationMinutes: v.number(),
    active: v.boolean(),
  }).index("by_owner", ["ownerId"]),

  customers: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    phone: v.string(), // stored with +91 prefix
    email: v.optional(v.string()),
    source: v.string(), // e.g. Walk-in, Instagram, Referral, WhatsApp
    scope: v.string(), // e.g. Weight Loss, Skin Care, Yoga, Nutrition
    notes: v.optional(v.string()),
    funnelStage: v.union(
      v.literal("lead"),
      v.literal("contacted"),
      v.literal("trial"),
      v.literal("member"),
      v.literal("retained"),
      v.literal("churned"),
    ),
    visitCount: v.number(),
    totalSpend: v.number(), // INR
    lastVisitAt: v.optional(v.string()), // ISO 8601 UTC
    createdAt: v.string(), // ISO 8601 UTC
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_and_stage", ["ownerId", "funnelStage"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["ownerId"],
    }),

  visits: defineTable({
    ownerId: v.id("users"),
    customerId: v.id("customers"),
    serviceId: v.id("services"),
    serviceName: v.string(), // denormalized for history even if service edited later
    amount: v.number(), // INR
    visitDate: v.string(), // ISO 8601 UTC
    notes: v.optional(v.string()),
  })
    .index("by_customer", ["customerId"])
    .index("by_owner", ["ownerId"]),

  tasks: defineTable({
    ownerId: v.id("users"),
    customerId: v.id("customers"),
    title: v.string(),
    dueDate: v.string(), // ISO 8601 UTC
    completed: v.boolean(),
    createdAt: v.string(), // ISO 8601 UTC
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_and_completed", ["ownerId", "completed"])
    .index("by_customer", ["customerId"]),
});
