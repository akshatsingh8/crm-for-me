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
  kind: "whatsapp" | "note" | "site_visit" | "follow_up";
  details: string;
  outcome?: string;
  occurredAt?: string;
}): Promise<Result> {
  await requireAuth();
  if (!input || typeof input.details !== "string") return { error: "Invalid lead activity." };
  const details = input.details.trim();
  if (!validId(input.leadId) || !["whatsapp", "note", "site_visit", "follow_up"].includes(input.kind)) {
    return { error: "Invalid lead activity." };
  }
  if (!details) return { error: "Add a short summary before saving." };
  if (details.length > 5000) return { error: "Keep the summary under 5,000 characters." };

  const outcome = input.kind === "site_visit"
    ? input.outcome
    : input.kind === "follow_up" ? input.outcome : null;
  if (input.kind === "site_visit" && !["Scheduled", "Completed"].includes(outcome ?? "")) {
    return { error: "Choose whether the site visit is scheduled or completed." };
  }
  if (input.kind === "follow_up" && !["Completed", "Attempted"].includes(outcome ?? "")) {
    return { error: "Choose a valid follow-up result." };
  }

  let occurredAt: string | undefined;
  if (input.kind === "site_visit") {
    if (!input.occurredAt || typeof input.occurredAt !== "string") return { error: "Choose a site visit date and time." };
    const visitTime = new Date(input.occurredAt);
    if (Number.isNaN(visitTime.getTime())) return { error: "Choose a valid site visit date and time." };
    if (outcome === "Completed" && visitTime.getTime() > Date.now() + 5 * 60 * 1000) {
      return { error: "A completed visit cannot be in the future." };
    }
    occurredAt = visitTime.toISOString();
  }

  const { error } = await getSupabase().from("lead_activities").insert({
    lead_id: input.leadId,
    kind: input.kind,
    details,
    outcome,
    ...(occurredAt ? { occurred_at: occurredAt } : {}),
  });
  if (error) return { error: error.message };

  revalidatePath("/lead-calling");
  revalidatePath(`/clients/${input.leadId}`);
  return {};
}
