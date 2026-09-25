import "server-only";

import { createClient } from "@supabase/supabase-js";

export type ClientRecord = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  requirement: "Buy" | "Rent" | "Sell" | null;
  property_type: "Apartment" | "Villa" | "Plot" | "Commercial" | "Office" | "Other" | null;
  property_project: string | null;
  preferred_location: string | null;
  budget_min: number | null;
  budget_max: number | null;
  lead_source: "Referral" | "Website" | "Portal" | "Social media" | "Walk-in" | "Other" | null;
  lead_temperature: "Hot" | "Warm" | "Cold" | null;
  status: "New" | "Contacted" | "Site visit" | "Negotiation" | "Closed won" | "Closed lost" | null;
  follow_up_date: string | null;
  notes: string | null;
  created_at: string;
  calling_status: "Uncalled" | "Contacted" | "Did not connect";
  last_called_at: string | null;
};

export type LeadActivity = {
  id: number;
  lead_id: number;
  kind: "call" | "whatsapp" | "note" | "status_change";
  outcome: string | null;
  details: string | null;
  occurred_at: string;
  created_at: string;
};

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const accessToken = process.env.CRM_DB_ACCESS_TOKEN;

  if (!url || !key || !accessToken) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-crm-access-token": accessToken } },
  });
}
