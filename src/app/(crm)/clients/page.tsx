import Link from "next/link";
import { loadAllLeads, loadTimelineLeadIds, TIMELINE_TYPES } from "@/lib/lead-data";
import { LEAD_STATUSES, isLeadStatus } from "@/lib/lead-status";
import { updateClientStatusAction } from "../actions";
import { LeadContactButtons } from "../lead-calling/lead-contact-buttons";
import { PhoneDisplay } from "../phone-display";

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

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string; deleted?: string; error?: string; q?: string; notes?: string; status?: string; timeline?: string; activity?: string; source?: string; temperature?: string }>;
}) {
  const { created, updated, deleted, error: actionError, q, notes, status, timeline, activity, source, temperature } = await searchParams;
  const { leads, error } = await loadAllLeads();
  const search = (q ?? "").trim().toLowerCase().slice(0, 120);
  const notesSearch = (notes ?? "").trim().toLowerCase().slice(0, 120);
  const statusFilter = isLeadStatus(status ?? "") ? status : "";
  const timelineSearch = (timeline ?? "").trim().toLowerCase().slice(0, 120);
  const activityFilter = TIMELINE_TYPES.some((item) => item.value === activity) ? activity! : "";
  const sources = ["Referral", "Website", "Portal", "Social media", "Walk-in", "Other"];
  const temperatures = ["Hot", "Warm", "Cold"];
  const sourceFilter = sources.includes(source ?? "") ? source : "";
  const temperatureFilter = temperatures.includes(temperature ?? "") ? temperature : "";
  const activeFilterCount = [search, notesSearch, statusFilter, timelineSearch, activityFilter, sourceFilter, temperatureFilter].filter(Boolean).length;
  const timelineMatches = timelineSearch || activityFilter ? await loadTimelineLeadIds(timelineSearch, activityFilter) : null;
  const clients = leads.filter((lead) => {
    if (statusFilter && (lead.status ?? "New") !== statusFilter) return false;
    if (sourceFilter && lead.lead_source !== sourceFilter) return false;
    if (temperatureFilter && lead.lead_temperature !== temperatureFilter) return false;
    if (notesSearch && !(lead.notes ?? "").toLowerCase().includes(notesSearch)) return false;
    if (timelineMatches && !timelineMatches.error && !timelineMatches.ids.has(lead.id)) return false;
    return !search || [lead.name, lead.phone, lead.email ?? ""].some((value) => value.toLowerCase().includes(search));
  });

  return (
    <div className="page-wrap lead-directory-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Lead directory</p>
          <h1>Leads</h1>
          <p className="muted">Search, update, and manage every property enquiry in one place.</p>
        </div>
        <div className="header-actions"><Link className="button button-secondary" href="/clients/import">Import leads</Link><Link className="button button-primary" href="/clients/new">+ Add client</Link></div>
      </header>

      {created ? <div className="notice success">Real estate lead added successfully.</div> : null}
      {updated ? <div className="notice success">Lead updated successfully.</div> : null}
      {deleted ? <div className="notice success">Lead deleted successfully.</div> : null}
      {actionError ? <div className="notice error"><strong>Could not update lead.</strong> {actionError}</div> : null}
      {error ? (
        <div className="notice error">
          <strong>Could not load leads.</strong> {error}
        </div>
      ) : null}
      {timelineMatches?.error ? <div className="notice error"><strong>Could not search timeline.</strong> {timelineMatches.error}</div> : null}

      <section className="table-card lead-directory">
        <div className="table-heading">
          <div><h2>All leads</h2><p>{leads.length} total records</p></div>
          <span>{clients.length} {clients.length === 1 ? "result" : "results"}</span>
        </div>
        <details className="lead-filter-disclosure" open={activeFilterCount > 0}>
          <summary className="lead-filter-toggle">
            <span className="lead-filter-toggle-label"><span aria-hidden="true">☷</span> Filters{activeFilterCount ? <span className="lead-filter-count">{activeFilterCount} active</span> : null}</span>
            <span className="lead-filter-chevron" aria-hidden="true">⌄</span>
          </summary>
        <form className="lead-filter-bar" action="/clients">
          <label className="sr-only" htmlFor="lead-search">Search leads</label>
          <input id="lead-search" name="q" type="search" placeholder="Search name, phone, or email" defaultValue={q ?? ""} />
          <label className="sr-only" htmlFor="lead-notes">Search lead notes</label>
          <input id="lead-notes" name="notes" type="search" placeholder="Search lead notes" defaultValue={notes ?? ""} maxLength={120} />
          <label className="sr-only" htmlFor="lead-status">Filter by status</label>
          <select id="lead-status" name="status" defaultValue={statusFilter}>
            <option value="">All statuses</option>
            {LEAD_STATUSES.map((value) => <option key={value}>{value}</option>)}
          </select>
          <label className="sr-only" htmlFor="lead-source">Filter by source</label>
          <select id="lead-source" name="source" defaultValue={sourceFilter}>
            <option value="">All sources</option>
            {sources.map((value) => <option key={value}>{value}</option>)}
          </select>
          <label className="sr-only" htmlFor="lead-temperature">Filter by priority</label>
          <select id="lead-temperature" name="temperature" defaultValue={temperatureFilter}>
            <option value="">All priorities</option>
            {temperatures.map((value) => <option key={value}>{value}</option>)}
          </select>
          <label className="sr-only" htmlFor="lead-timeline">Search timeline details</label>
          <input id="lead-timeline" name="timeline" type="search" placeholder="Search timeline text" defaultValue={timeline ?? ""} maxLength={120} />
          <label className="sr-only" htmlFor="lead-activity">Filter timeline activity</label>
          <select id="lead-activity" name="activity" defaultValue={activityFilter}>
            <option value="">All timeline activity</option>
            {TIMELINE_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <button className="button button-secondary" type="submit">Filter</button>
          {search || notesSearch || statusFilter || timelineSearch || activityFilter || sourceFilter || temperatureFilter ? <Link className="text-button" href="/clients">Clear</Link> : null}
        </form>
        </details>
        {clients.length === 0 && !error ? (
          <div className="empty-state">
            <div className="empty-icon">◎</div>
            <h3>{leads.length ? "No matching leads" : "No property leads yet"}</h3>
            <p>{leads.length ? "Try adjusting your lead or timeline filters." : "Add your first lead to start building your pipeline."}</p>
            <Link className="button button-secondary" href={leads.length ? "/clients" : "/clients/new"}>{leads.length ? "Clear filters" : "Add first lead"}</Link>
          </div>
        ) : (
          <div className="lead-list-wrap">
            <table className="lead-directory-table">
              <caption className="sr-only">Property leads and their current stage</caption>
              <colgroup><col className="lead-col-client" /><col className="lead-col-interest" /><col className="lead-col-follow-up" /><col className="lead-col-stage" /><col className="lead-col-contact" /></colgroup>
              <thead><tr><th>Lead</th><th>Interest</th><th>Follow-up</th><th>Stage</th><th>Contact</th></tr></thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td className="client-cell" data-label="Lead"><Link className="lead-link" href={`/clients/${client.id}`}><strong>{client.name}</strong><span>View profile →</span></Link><PhoneDisplay phone={client.phone} compact /></td>
                    <td data-label="Interest"><div className="lead-interest"><strong>{client.requirement || "Not specified"}</strong><small>{[client.property_type, client.preferred_location].filter(Boolean).join(" · ") || "Property details pending"}</small>{client.budget_min !== null || client.budget_max !== null ? <small>{formatBudget(client.budget_min, client.budget_max)}</small> : null}</div></td>
                    <td data-label="Follow-up"><div className="lead-follow-up">{formatDate(client.follow_up_date)}{client.lead_temperature ? <small>{client.lead_temperature} lead</small> : null}</div></td>
                    <td data-label="Stage">
                      <form action={updateClientStatusAction} className="status-control">
                        <input type="hidden" name="id" value={client.id} />
                        <select name="status" defaultValue={client.status ?? "New"} aria-label={`Update status for ${client.name}`}>
                          {LEAD_STATUSES.map((status) => <option key={status}>{status}</option>)}
                        </select>
                        <button className="text-button" type="submit">Set</button>
                      </form>
                    </td>
                    <td data-label="Contact"><LeadContactButtons leadId={client.id} name={client.name} phone={client.phone} currentStatus={client.status} /></td>
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
