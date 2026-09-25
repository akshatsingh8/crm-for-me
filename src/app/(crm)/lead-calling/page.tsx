import Link from "next/link";
import { getSupabase, type ClientRecord, type LeadActivity } from "@/lib/supabase";
import { LeadContactButtons } from "./lead-contact-buttons";

export const dynamic = "force-dynamic";

type CallingLead = Pick<ClientRecord,
  "id" | "name" | "phone" | "status" | "requirement" | "property_type" |
  "preferred_location" | "notes" | "created_at" | "calling_status" | "last_called_at"
> & { lead_activities: Pick<LeadActivity, "id" | "kind" | "outcome" | "details" | "occurred_at">[] };

const views = [
  { value: "uncalled", label: "Uncalled", status: "Uncalled" },
  { value: "contacted", label: "Contacted", status: "Contacted" },
  { value: "did-not-connect", label: "Did not connect", status: "Did not connect" },
] as const;

function formatCallTime(value: string | null) {
  if (!value) return "No calls logged";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function activityTitle(activity: CallingLead["lead_activities"][number]) {
  if (activity.kind === "call") return `Call · ${activity.outcome ?? "Logged"}`;
  if (activity.kind === "whatsapp") return "WhatsApp conversation";
  if (activity.kind === "status_change") return "Lead status updated";
  return "Note added";
}

export default async function LeadCallingPage({ searchParams }: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const active = views.find((item) => item.value === view) ?? views[0];
  const { data, error } = await getSupabase()
    .from("real_estate_clients")
    .select("id,name,phone,status,requirement,property_type,preferred_location,notes,created_at,calling_status,last_called_at,lead_activities(id,kind,outcome,details,occurred_at)")
    .order("occurred_at", { referencedTable: "lead_activities", ascending: false })
    .order("id", { referencedTable: "lead_activities", ascending: false })
    .limit(1, { referencedTable: "lead_activities" })
    .order("created_at", { ascending: false });
  const leads = (data ?? []) as CallingLead[];
  const filtered = leads.filter((lead) => (lead.calling_status ?? "Uncalled") === active.status);

  return (
    <div className="page-wrap calling-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Outreach workspace</p>
          <h1>Lead calling</h1>
          <p className="muted">Call leads, record what happened, and keep every conversation on their timeline.</p>
        </div>
        <Link className="button button-secondary" href="/clients/new">+ Add lead</Link>
      </header>

      {error ? <div className="notice error"><strong>Could not load leads.</strong> {error.message}</div> : null}

      <nav className="calling-tabs" aria-label="Calling lists">
        {views.map((item) => (
          <Link key={item.value} href={item.value === "uncalled" ? "/lead-calling" : `/lead-calling?view=${item.value}`}
            className={`calling-tab${active.value === item.value ? " is-active" : ""}`}
            aria-current={active.value === item.value ? "page" : undefined}>
            <span>{item.label}</span>
            <strong>{leads.filter((lead) => (lead.calling_status ?? "Uncalled") === item.status).length}</strong>
          </Link>
        ))}
      </nav>

      <section className="calling-list" aria-label={`${active.label} leads`}>
        <div className="calling-list-heading">
          <h2>{active.label}</h2>
          <span>{filtered.length} {filtered.length === 1 ? "lead" : "leads"}</span>
        </div>
        {filtered.length === 0 && !error ? (
          <div className="empty-state">
            <div className="empty-icon">☎</div>
            <h3>No {active.label.toLowerCase()} leads</h3>
            <p>{active.value === "uncalled" ? "New leads appear here until you log their first call." : "Leads with this call result will appear here."}</p>
          </div>
        ) : null}
        {filtered.map((lead) => {
          const latestActivity = lead.lead_activities[0];
          return (
            <article className="calling-card" key={lead.id}>
              <div className="calling-card-main">
                <div className="calling-card-title">
                  <Link href={`/clients/${lead.id}`}><h3>{lead.name}</h3></Link>
                  <span className="status">{lead.status ?? "New"}</span>
                </div>
                <p className="calling-phone">{lead.phone}</p>
                <div className="calling-meta">
                  <span>{lead.requirement ?? "Requirement pending"}{lead.property_type ? ` · ${lead.property_type}` : ""}</span>
                  {lead.preferred_location ? <span>{lead.preferred_location}</span> : null}
                  <span>{formatCallTime(lead.last_called_at)}</span>
                </div>
              </div>
              <div className="calling-context">
                <div className="calling-detail">
                  <span className="calling-detail-label">Latest activity</span>
                  <div className="calling-detail-heading">
                    <strong>{latestActivity ? activityTitle(latestActivity) : "Lead added"}</strong>
                    <time dateTime={latestActivity?.occurred_at ?? lead.created_at}>{formatCallTime(latestActivity?.occurred_at ?? lead.created_at)}</time>
                  </div>
                  <p>{latestActivity?.details || (latestActivity ? "No details recorded." : "Added to the CRM.")}</p>
                </div>
                <div className="calling-detail">
                  <span className="calling-detail-label">Lead note</span>
                  <p>{lead.notes?.trim() || "No note added yet."}</p>
                </div>
              </div>
              <div className="calling-card-actions">
                <LeadContactButtons leadId={lead.id} name={lead.name} phone={lead.phone} currentStatus={lead.status} />
                <Link className="calling-profile-link" href={`/clients/${lead.id}`}>View timeline →</Link>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
