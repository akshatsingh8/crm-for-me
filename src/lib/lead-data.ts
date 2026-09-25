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
