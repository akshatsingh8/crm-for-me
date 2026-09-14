"use server";

import { destroySession, requireAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function createClientAction(formData: FormData) {
  await requireAuth();

  const values = {
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim() || null,
    requirement: String(formData.get("requirement") ?? "").trim() || null,
    property_type: String(formData.get("property_type") ?? "").trim() || null,
    property_project: String(formData.get("property_project") ?? "").trim() || null,
    preferred_location: String(formData.get("preferred_location") ?? "").trim() || null,
    budget_min: formData.get("budget_min") ? Number(formData.get("budget_min")) : null,
    budget_max: formData.get("budget_max") ? Number(formData.get("budget_max")) : null,
    lead_source: String(formData.get("lead_source") ?? "").trim() || null,
    lead_temperature: String(formData.get("lead_temperature") ?? "").trim() || null,
    status: String(formData.get("status") ?? "").trim() || null,
    follow_up_date: String(formData.get("follow_up_date") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };

  if (!values.name || !values.phone) {
    redirect("/clients/new?error=Please%20enter%20the%20client%20name%20and%20phone%20number.");
  }

  if (values.budget_min !== null && values.budget_max !== null && values.budget_max < values.budget_min) {
    redirect("/clients/new?error=Maximum%20budget%20must%20be%20greater%20than%20minimum%20budget.");
  }

  const { error } = await getSupabase().from("real_estate_clients").insert(values);
  if (error) redirect(`/clients/new?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/dashboard");
  redirect("/dashboard?created=1");
}

function getClientValues(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim() || null,
    requirement: String(formData.get("requirement") ?? "").trim() || null,
    property_type: String(formData.get("property_type") ?? "").trim() || null,
    property_project: String(formData.get("property_project") ?? "").trim() || null,
    preferred_location: String(formData.get("preferred_location") ?? "").trim() || null,
    budget_min: formData.get("budget_min") ? Number(formData.get("budget_min")) : null,
    budget_max: formData.get("budget_max") ? Number(formData.get("budget_max")) : null,
    lead_source: String(formData.get("lead_source") ?? "").trim() || null,
    lead_temperature: String(formData.get("lead_temperature") ?? "").trim() || null,
    status: String(formData.get("status") ?? "").trim() || null,
    follow_up_date: String(formData.get("follow_up_date") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}

function getClientId(formData: FormData) {
  const id = Number(formData.get("id"));
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function updateClientAction(formData: FormData) {
  await requireAuth();
  const id = getClientId(formData);
  if (!id) redirect("/dashboard?error=Invalid%20lead.");

  const values = getClientValues(formData);
  if (!values.name || !values.phone) {
    redirect(`/clients/${id}?error=Please%20enter%20the%20client%20name%20and%20phone%20number.`);
  }
  if (values.budget_min !== null && values.budget_max !== null && values.budget_max < values.budget_min) {
    redirect(`/clients/${id}?error=Maximum%20budget%20must%20be%20greater%20than%20minimum%20budget.`);
  }

  const { error } = await getSupabase().from("real_estate_clients").update(values).eq("id", id);
  if (error) redirect(`/clients/${id}?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/dashboard");
  redirect("/dashboard?updated=1");
}

export async function updateClientStatusAction(formData: FormData) {
  await requireAuth();
  const id = getClientId(formData);
  const status = String(formData.get("status") ?? "");
  const allowedStatuses = ["New", "Contacted", "Site visit", "Negotiation", "Closed won", "Closed lost"];
  if (!id || !allowedStatuses.includes(status)) redirect("/dashboard?error=Invalid%20status%20update.");

  const { error } = await getSupabase().from("real_estate_clients").update({ status }).eq("id", id);
  if (error) redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/dashboard");
  redirect("/dashboard?updated=1");
}

export async function deleteClientAction(formData: FormData) {
  await requireAuth();
  const id = getClientId(formData);
  if (!id) redirect("/dashboard?error=Invalid%20lead.");

  const { error } = await getSupabase().from("real_estate_clients").delete().eq("id", id);
  if (error) redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/dashboard");
  redirect("/dashboard?deleted=1");
}
