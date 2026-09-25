import type { ClientRecord } from "@/lib/supabase";

export const PIPELINE_STAGES = ["New", "Contacted", "Site visit", "Negotiation", "Closed won", "Closed lost"] as const;
export const REQUIREMENTS = ["Buy", "Rent", "Sell", "Unspecified"] as const;
export const PROPERTY_TYPES = ["Apartment", "Villa", "Plot", "Commercial", "Office", "Other", "Unspecified"] as const;

type DashboardLead = Pick<ClientRecord,
  "id" | "name" | "created_at" | "status" | "lead_source" | "requirement" |
  "property_type" | "lead_temperature" | "follow_up_date" | "budget_min" | "budget_max" |
  "preferred_location"
>;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
});

function parts(value: Date) {
  const result = Object.fromEntries(dateFormatter.formatToParts(value).map((part) => [part.type, part.value]));
  return { year: Number(result.year), month: Number(result.month), day: Number(result.day) };
}

export function buildDashboardMetrics(leads: DashboardLead[], now = new Date()) {
  const todayParts = parts(now);
  const today = `${todayParts.year}-${String(todayParts.month).padStart(2, "0")}-${String(todayParts.day).padStart(2, "0")}`;
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(todayParts.year, todayParts.month - 6 + index, 1));
    return {
      key: date.toISOString().slice(0, 7),
      label: new Intl.DateTimeFormat("en-IN", { month: "short", timeZone: "UTC" }).format(date),
      count: 0,
    };
  });
  const pipeline = PIPELINE_STAGES.map((label) => ({ label, count: 0 }));
  const sources = new Map<string, number>();
  const matrix = REQUIREMENTS.map((requirement) => ({
    requirement,
    cells: PROPERTY_TYPES.map((propertyType) => ({ propertyType, count: 0 })),
  }));
  const dataHealth = [
    { label: "Requirement", count: 0 },
    { label: "Property type", count: 0 },
    { label: "Location", count: 0 },
    { label: "Budget", count: 0 },
    { label: "Lead source", count: 0 },
    { label: "Follow-up date", count: 0 },
  ];
  const followUps: DashboardLead[] = [];
  let open = 0;
  let due = 0;
  let hot = 0;
  let missingFollowUp = 0;

  for (const lead of leads) {
    const created = new Date(lead.created_at);
    if (!Number.isNaN(created.getTime())) {
      const createdParts = parts(created);
      const key = `${createdParts.year}-${String(createdParts.month).padStart(2, "0")}`;
      const month = months.find((item) => item.key === key);
      if (month) month.count++;
    }

    const status = lead.status ?? "New";
    pipeline.find((stage) => stage.label === status)!.count++;
    const isOpen = status !== "Closed won" && status !== "Closed lost";
    if (isOpen) {
      open++;
      if (!lead.follow_up_date) missingFollowUp++;
      else {
        followUps.push(lead);
        if (lead.follow_up_date <= today) due++;
      }
    }
    if (lead.lead_temperature === "Hot") hot++;

    const source = lead.lead_source || "Unspecified";
    sources.set(source, (sources.get(source) ?? 0) + 1);
    const requirement = lead.requirement ?? "Unspecified";
    const propertyType = lead.property_type ?? "Unspecified";
    matrix.find((row) => row.requirement === requirement)!
      .cells.find((cell) => cell.propertyType === propertyType)!.count++;

    if (lead.requirement) dataHealth[0].count++;
    if (lead.property_type) dataHealth[1].count++;
    if (lead.preferred_location) dataHealth[2].count++;
    if (lead.budget_min !== null || lead.budget_max !== null) dataHealth[3].count++;
    if (lead.lead_source) dataHealth[4].count++;
    if (lead.follow_up_date) dataHealth[5].count++;
  }

  followUps.sort((a, b) => (a.follow_up_date ?? "").localeCompare(b.follow_up_date ?? ""));
  return {
    total: leads.length,
    open,
    due,
    hot,
    missingFollowUp,
    newThisMonth: months[5].count,
    previousMonth: months[4].count,
    won: pipeline[4].count,
    months,
    pipeline,
    sources: Array.from(sources, ([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
    matrix,
    dataHealth,
    followUps: followUps.slice(0, 5),
    today,
  };
}
