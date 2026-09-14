import Link from "next/link";
import { getSupabase, type ClientRecord } from "@/lib/supabase";
import { updateClientStatusAction } from "../actions";
import { DeleteLeadButton } from "./delete-lead-button";

export const dynamic = "force-dynamic";

function formatDate(date: string | null) {
  if (!date) return "Not scheduled";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${date}T00:00:00`));
}

function formatBudget(min: number | null, max: number | null) {
  const format = (value: number) => new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

  if (min !== null && max !== null) return `${format(min)} – ${format(max)}`;
  if (min !== null) return `From ${format(min)}`;
  if (max !== null) return `Up to ${format(max)}`;
  return "Not specified";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string; deleted?: string; error?: string }>;
}) {
  const { created, updated, deleted, error: actionError } = await searchParams;
  const { data, error } = await getSupabase()
    .from("real_estate_clients")
    .select("*")
    .order("created_at", { ascending: false });
  const clients = (data ?? []) as ClientRecord[];

  return (
    <div className="page-wrap">
      <header className="page-header">
        <div>
          <p className="eyebrow">Real estate workspace</p>
          <h1>Property leads</h1>
          <p className="muted">Track every buyer, seller, property requirement, and follow-up.</p>
        </div>
        <Link className="button button-primary" href="/clients/new">+ Add client</Link>
      </header>

      {created ? <div className="notice success">Real estate lead added successfully.</div> : null}
      {updated ? <div className="notice success">Lead updated successfully.</div> : null}
      {deleted ? <div className="notice success">Lead deleted successfully.</div> : null}
      {actionError ? <div className="notice error"><strong>Could not update lead.</strong> {actionError}</div> : null}
      {error ? (
        <div className="notice error">
          <strong>Could not load clients.</strong> {error.message}
        </div>
      ) : null}

      <section className="stats-grid">
        <article className="stat-card"><span>Total leads</span><strong>{clients.length}</strong></article>
        <article className="stat-card"><span>Hot leads</span><strong>{clients.filter((client) => client.lead_temperature === "Hot").length}</strong></article>
        <article className="stat-card"><span>Open opportunities</span><strong>{clients.filter((client) => !client.status?.startsWith("Closed")).length}</strong></article>
      </section>

      <section className="table-card">
        <div className="table-heading">
          <h2>Lead directory</h2>
          <span>{clients.length} {clients.length === 1 ? "record" : "records"}</span>
        </div>
        {clients.length === 0 && !error ? (
          <div className="empty-state">
            <div className="empty-icon">◎</div>
            <h3>No property leads yet</h3>
            <p>Add your first lead to start building your pipeline.</p>
            <Link className="button button-secondary" href="/clients/new">Add first lead</Link>
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead><tr><th>Client</th><th>Requirement</th><th>Location</th><th>Budget</th><th>Follow-up</th><th>Source</th><th>Status</th><th>Notes</th><th>Actions</th></tr></thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td className="client-cell"><Link className="lead-link" href={`/clients/${client.id}`}><strong>{client.name}</strong><small>{client.phone}{client.email ? ` · ${client.email}` : ""}</small><span>View profile →</span></Link></td>
                    <td><strong>{client.requirement || "Not specified"}</strong><small>{client.property_type || "Property type pending"}{client.property_project ? ` · ${client.property_project}` : ""}</small></td>
                    <td>{client.preferred_location || "—"}</td>
                    <td className="budget-cell">{formatBudget(client.budget_min, client.budget_max)}</td>
                    <td>{formatDate(client.follow_up_date)}{client.lead_temperature ? <small>{client.lead_temperature} lead</small> : null}</td>
                    <td>{client.lead_source || "—"}</td>
                    <td>
                      <form action={updateClientStatusAction} className="status-control">
                        <input type="hidden" name="id" value={client.id} />
                        <select name="status" defaultValue={client.status ?? "New"} aria-label={`Update status for ${client.name}`}>
                          <option>New</option><option>Contacted</option><option>Site visit</option><option>Negotiation</option><option>Closed won</option><option>Closed lost</option>
                        </select>
                        <button className="text-button" type="submit">Set</button>
                      </form>
                    </td>
                    <td className="notes-cell">{client.notes || "—"}</td>
                    <td>
                      <div className="row-actions">
                        <Link className="text-button" href={`/clients/${client.id}?edit=1`}>Edit</Link>
                        <DeleteLeadButton id={client.id} name={client.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
