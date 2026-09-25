"use server";

import { requireAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

type Result = { error?: string };
type CallInput = {
  leadId: number;
  outcome: "Contacted" | "Did not connect";
  details: string;
  leadStatus: string;
  followUpDate: string;
  calledAt: string;
};

const statuses = ["New", "Contacted", "Site visit", "Negotiation", "Closed won", "Closed lost"];

function validId(id: number) {
  return Number.isSafeInteger(id) && id > 0;
}

export async function recordLeadCallAction(input: CallInput): Promise<Result> {
  await requireAuth();
  if (!input || typeof input.details !== "string" || typeof input.calledAt !== "string") {
    return { error: "Invalid call feedback." };
  }
  const details = input.details.trim();
  if (!validId(input.leadId) || !["Contacted", "Did not connect"].includes(input.outcome)) {
    return { error: "Choose a valid lead and call result." };
  }
  if (input.outcome === "Contacted" && !details) {
    return { error: "Add a short summary of the conversation." };
  }
  if (details.length > 5000) return { error: "Keep the call summary under 5,000 characters." };
  if (input.leadStatus && !statuses.includes(input.leadStatus)) return { error: "Choose a valid lead status." };
  if (input.followUpDate && !/^\d{4}-\d{2}-\d{2}$/.test(input.followUpDate)) {
    return { error: "Choose a valid follow-up date." };
  }
  const calledAt = new Date(input.calledAt);
  if (Number.isNaN(calledAt.getTime())) return { error: "The call time is invalid. Start a new call." };

  const { error } = await getSupabase().rpc("record_lead_call", {
    p_lead_id: input.leadId,
    p_outcome: input.outcome,
    p_details: details,
    p_lead_status: input.leadStatus || null,
    p_follow_up_date: input.followUpDate || null,
    p_called_at: calledAt.toISOString(),
  });
  if (error) return { error: error.message };

  revalidatePath("/lead-calling");
  revalidatePath("/dashboard");
  revalidatePath("/clients");
  revalidatePath(`/clients/${input.leadId}`);
  return {};
}

export async function recordLeadActivityAction(input: {
  leadId: number;
  kind: "whatsapp" | "note";
  details: string;
}): Promise<Result> {
  await requireAuth();
  if (!input || typeof input.details !== "string") return { error: "Invalid lead activity." };
  const details = input.details.trim();
  if (!validId(input.leadId) || !["whatsapp", "note"].includes(input.kind)) {
    return { error: "Invalid lead activity." };
  }
  if (!details) return { error: "Add a short summary before saving." };
  if (details.length > 5000) return { error: "Keep the summary under 5,000 characters." };

  const { error } = await getSupabase().from("lead_activities").insert({
    lead_id: input.leadId,
    kind: input.kind,
    details,
  });
  if (error) return { error: error.message };

  revalidatePath("/lead-calling");
  revalidatePath(`/clients/${input.leadId}`);
  return {};
}
