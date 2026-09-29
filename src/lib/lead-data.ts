import "server-only";

import { getSupabase, type ClientRecord } from "@/lib/supabase";

const PAGE_SIZE = 1000;

export async function loadAllLeads(): Promise<{ leads: ClientRecord[]; error: string | null }> {
  const leads: ClientRecord[] = [];
  const supabase = getSupabase();

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("real_estate_clients")
      .select("*")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) return { leads: [], error: error.message };
    const page = (data ?? []) as ClientRecord[];
    leads.push(...page);
    if (page.length < PAGE_SIZE) return { leads, error: null };
  }
}

export const TIMELINE_TYPES = [
  { value: "note", label: "Notes" },
  { value: "call", label: "Calls" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "site_visit", label: "Site visits" },
  { value: "follow_up", label: "Follow-ups" },
  { value: "status_change", label: "Status changes" },
] as const;

export async function loadTimelineLeadIds(query: string, kind: string): Promise<{ ids: Set<number>; error: string | null }> {
  const ids = new Set<number>();
  const supabase = getSupabase();
  for (let offset = 0; ; offset += PAGE_SIZE) {
    let request = supabase.from("lead_activities").select("lead_id, details").order("id", { ascending: true }).range(offset, offset + PAGE_SIZE - 1);
    if (kind) request = request.eq("kind", kind);
    const { data, error } = await request;
    if (error) return { ids: new Set<number>(), error: error.message };
    const page = data ?? [];
    for (const activity of page) {
      if (!query || activity.details?.toLowerCase().includes(query)) ids.add(activity.lead_id);
    }
    if (page.length < PAGE_SIZE) return { ids, error: null };
  }
}
