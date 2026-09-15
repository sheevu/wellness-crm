// Shared CRM constants tailored for an Indian health & wellness business.

export const FUNNEL_STAGES = [
  { value: "lead", label: "Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "trial", label: "Trial" },
  { value: "member", label: "Member" },
  { value: "retained", label: "Retained" },
  { value: "churned", label: "Churned" },
] as const;

export type FunnelStage = (typeof FUNNEL_STAGES)[number]["value"];

export const FUNNEL_STAGE_LABELS: Record<FunnelStage, string> = {
  lead: "Lead",
  contacted: "Contacted",
  trial: "Trial",
  member: "Member",
  retained: "Retained",
  churned: "Churned",
};

export const FUNNEL_STAGE_COLORS: Record<FunnelStage, string> = {
  lead: "bg-chart-4/20 text-chart-4 border-chart-4/40",
  contacted: "bg-chart-3/20 text-chart-3 border-chart-3/40",
  trial: "bg-chart-5/20 text-chart-5 border-chart-5/40",
  member: "bg-primary/15 text-primary border-primary/40",
  retained: "bg-chart-2/15 text-chart-2 border-chart-2/40",
  churned: "bg-destructive/10 text-destructive border-destructive/30",
};

export const LEAD_SOURCES = [
  "Walk-in",
  "Instagram",
  "WhatsApp",
  "Referral",
  "Google Search",
  "Facebook",
  "Local Camp/Event",
] as const;

export const SERVICE_SCOPES = [
  "Weight Loss",
  "Diabetes Care",
  "Yoga & Meditation",
  "Skin & Hair Care",
  "Nutrition & Diet",
  "Physiotherapy",
  "Prenatal & Postnatal Care",
  "Ayurveda Wellness",
  "General Fitness",
] as const;

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
