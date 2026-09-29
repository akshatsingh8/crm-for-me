import type { ClientRecord } from "@/lib/supabase";

export const PIPELINE_STAGES = ["New", "Contacted", "Site visit", "Negotiation", "Closed won", "Closed lost"] as const;

type DashboardLead = Pick<ClientRecord,
  "created_at" | "status" | "lead_source" | "follow_up_date"
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
  const months = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(todayParts.year, todayParts.month - 12 + index, 1));
    return {
      key: date.toISOString().slice(0, 7),
      label: new Intl.DateTimeFormat("en-IN", { month: "short", timeZone: "UTC" }).format(date),
      count: 0,
    };
  });
  const pipeline = PIPELINE_STAGES.map((label) => ({ label, count: 0 }));
  const sources = new Map<string, number>();
  let open = 0;
  let due = 0;
  let overdue = 0;
  let dueToday = 0;
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
        if (lead.follow_up_date <= today) due++;
        if (lead.follow_up_date < today) overdue++;
        if (lead.follow_up_date === today) dueToday++;
      }
    }

    const source = lead.lead_source || "Unspecified";
    sources.set(source, (sources.get(source) ?? 0) + 1);
  }

  return {
    total: leads.length,
    open,
    due,
    overdue,
    dueToday,
    missingFollowUp,
    newThisMonth: months[11].count,
    previousMonth: months[10].count,
    won: pipeline[4].count,
    months,
    pipeline,
    sources: Array.from(sources, ([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
    today,
  };
}
