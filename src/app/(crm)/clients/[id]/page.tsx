import Link from "next/link";
import { notFound } from "next/navigation";
import { updateClientAction } from "../../actions";
import { DeleteLeadFormAction } from "../../dashboard/delete-lead-button";
import { getSupabase, type ClientRecord } from "@/lib/supabase";

export default async function EditClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; edit?: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  const [{ data, error: loadError }, { error, edit }] = await Promise.all([
    getSupabase().from("real_estate_clients").select("*").eq("id", id).maybeSingle(),
    searchParams,
  ]);
  const client = data as ClientRecord | null;
  if (loadError || !client) notFound();

  if (edit !== "1") {
    const details = [
      ["Phone", client.phone],
      ["Email", client.email],
      ["Requirement", client.requirement],
      ["Property type", client.property_type],
      ["Property / project", client.property_project],
      ["Preferred location", client.preferred_location],
      ["Minimum budget", client.budget_min ? `₹${new Intl.NumberFormat("en-IN").format(client.budget_min)}` : null],
      ["Maximum budget", client.budget_max ? `₹${new Intl.NumberFormat("en-IN").format(client.budget_max)}` : null],
      ["Lead source", client.lead_source],
      ["Lead temperature", client.lead_temperature],
      ["Status", client.status],
      ["Next follow-up", client.follow_up_date ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${client.follow_up_date}T00:00:00`)) : null],
    ];

    return (
      <div className="page-wrap form-page">
        <Link className="back-link" href="/dashboard">← Back to clients</Link>
        <section className="client-profile">
          <header className="profile-header">
            <div>
              <p className="eyebrow">Lead profile</p>
              <h1>{client.name}</h1>
              <p className="muted">{client.phone}{client.email ? ` · ${client.email}` : ""}</p>
            </div>
            <Link className="button button-primary" href={`/clients/${client.id}?edit=1`}>Edit lead</Link>
          </header>
          <div className="profile-details">
            {details.map(([label, value]) => (
              <div className="profile-detail" key={label}>
                <span>{label}</span>
                <strong>{value || "Not specified"}</strong>
              </div>
            ))}
          </div>
          <div className="profile-notes">
            <span>Notes</span>
            <p>{client.notes || "No notes added yet."}</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-wrap form-page">
      <Link className="back-link" href={`/clients/${client.id}`}>← Back to profile</Link>
      <form action={updateClientAction} className="client-form">
        {error ? <div className="notice error"><strong>Could not save lead.</strong> {error}</div> : null}
        <input type="hidden" name="id" value={client.id} />
        <div className="form-intro">
          <p className="eyebrow">Edit property enquiry</p>
          <h1>{client.name}</h1>
          <p className="muted">Update the lead details, requirement, and next action.</p>
        </div>
        <div className="form-grid lead-form-grid">
          <label>Full name <span>*</span><input name="name" defaultValue={client.name} required autoFocus /></label>
          <label>Phone number <span>*</span><input name="phone" type="tel" defaultValue={client.phone} required /></label>
          <label className="field-full">Email address <input name="email" type="email" defaultValue={client.email ?? ""} /></label>
          <label>Requirement <select name="requirement" defaultValue={client.requirement ?? ""}><option value="">Not specified</option><option>Buy</option><option>Rent</option><option>Sell</option></select></label>
          <label>Property type <select name="property_type" defaultValue={client.property_type ?? ""}><option value="">Not specified</option><option>Apartment</option><option>Villa</option><option>Plot</option><option>Commercial</option><option>Office</option><option>Other</option></select></label>
          <label>Property / project <input name="property_project" defaultValue={client.property_project ?? ""} /></label>
          <label>Preferred location <input name="preferred_location" defaultValue={client.preferred_location ?? ""} /></label>
          <label>Minimum budget (₹) <input name="budget_min" type="number" min="0" step="1000" inputMode="numeric" defaultValue={client.budget_min ?? ""} /></label>
          <label>Maximum budget (₹) <input name="budget_max" type="number" min="0" step="1000" inputMode="numeric" defaultValue={client.budget_max ?? ""} /></label>
          <label>Lead source <select name="lead_source" defaultValue={client.lead_source ?? ""}><option value="">Not specified</option><option>Referral</option><option>Website</option><option>Portal</option><option>Social media</option><option>Walk-in</option><option>Other</option></select></label>
          <label>Lead temperature <select name="lead_temperature" defaultValue={client.lead_temperature ?? ""}><option value="">Not specified</option><option>Hot</option><option>Warm</option><option>Cold</option></select></label>
          <label>Status <select name="status" defaultValue={client.status ?? ""}><option value="">Not specified</option><option>New</option><option>Contacted</option><option>Site visit</option><option>Negotiation</option><option>Closed won</option><option>Closed lost</option></select></label>
          <label>Next follow-up <input name="follow_up_date" type="date" defaultValue={client.follow_up_date ?? ""} /></label>
          <label className="field-full">Notes <textarea name="notes" rows={4} defaultValue={client.notes ?? ""} /></label>
        </div>
        <div className="form-actions">
          <DeleteLeadFormAction name={client.name} />
          <Link className="button button-ghost" href="/dashboard">Cancel</Link>
          <button className="button button-primary" type="submit">Save changes</button>
        </div>
      </form>
    </div>
  );
}
