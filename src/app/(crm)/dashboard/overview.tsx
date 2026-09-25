import Link from "next/link";
import { buildDashboardMetrics, PROPERTY_TYPES } from "@/lib/dashboard-metrics";

type Metrics = ReturnType<typeof buildDashboardMetrics>;

const sourceColors = ["#176252", "#5c927e", "#a9c6b5", "#b5996d", "#87999b", "#7a8a6c", "#c4ccc5"];
const stageColors = ["#176252", "#4d8872", "#88b09a", "#b5996d", "#6e8b85", "#c4ccc5"];

function TrendChart({ months }: { months: Metrics["months"] }) {
  const max = Math.max(1, ...months.map((month) => month.count));
  const points = months.map((month, index) => ({
    x: 34 + index * 138,
    y: 207 - (month.count / max) * 152,
    count: month.count,
    label: month.label,
  }));
  const line = "M " + points.map((point) => point.x + " " + point.y).join(" L ");
  const area = line + " L " + points[points.length - 1].x + " 207 L " + points[0].x + " 207 Z";

  return (
    <div className="trend-chart">
      <svg viewBox="0 0 760 225" role="img" aria-label={"New leads by month: " + months.map((month) => month.label + " " + month.count).join(", ")}>
        <defs>
          <linearGradient id="lead-trend-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#176252" stopOpacity=".18" />
            <stop offset="100%" stopColor="#176252" stopOpacity=".01" />
          </linearGradient>
        </defs>
        {[55, 106, 157, 207].map((y) => <line key={y} x1="34" x2="724" y1={y} y2={y} stroke="#e5ebe6" strokeDasharray="4 6" />)}
        <path d={area} fill="url(#lead-trend-fill)" />
        <path d={line} fill="none" stroke="#176252" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="6" fill="#fff" stroke="#176252" strokeWidth="2.5" />
            <title>{point.label + ": " + point.count + " new leads"}</title>
          </g>
        ))}
      </svg>
      <div className="trend-months" aria-hidden="true">
        {months.map((month) => <span key={month.key}>{month.label}</span>)}
      </div>
    </div>
  );
}

function SourcesChart({ sources, total }: { sources: Metrics["sources"]; total: number }) {
  let position = 0;
  const gradient = total
    ? "conic-gradient(" + sources.map((source, index) => {
      const start = position;
      position += (source.count / total) * 100;
      return sourceColors[index % sourceColors.length] + " " + start + "% " + position + "%";
    }).join(", ") + ")"
    : "#e8eeea";

  return (
    <div className="source-layout">
      <div className="source-donut" style={{ background: gradient }} role="img" aria-label={sources.map((source) => source.label + ": " + source.count).join(", ") || "No lead sources yet"}>
        <div className="source-donut-hole"><strong>{total}</strong><span>leads</span></div>
      </div>
      <div className="source-legend">
        {sources.length ? sources.map((source, index) => (
          <div className="source-legend-row" key={source.label}>
            <span className="legend-dot" style={{ backgroundColor: sourceColors[index % sourceColors.length] }} />
            <span>{source.label}</span>
            <strong>{source.count}</strong>
          </div>
        )) : <p className="muted">Add or import leads to see where they came from.</p>}
      </div>
    </div>
  );
}

function formatFollowUp(date: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
    .format(new Date(date + "T00:00:00Z"));
}

export function DashboardOverview({ metrics, error }: { metrics: Metrics; error: string | null }) {
  const maxMatrixCount = Math.max(1, ...metrics.matrix.flatMap((row) => row.cells.map((cell) => cell.count)));
  const todayLabel = new Intl.DateTimeFormat("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata",
  }).format(new Date());

  return (
    <div className="page-wrap dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Real estate workspace</p>
          <h1>Overview</h1>
          <p className="muted">A clear view of your leads, pipeline, and next steps.</p>
        </div>
        <div className="dashboard-header-side">
          <span className="dashboard-date">{todayLabel}</span>
          <Link className="button button-primary" href="/clients/new">+ Add lead</Link>
        </div>
      </header>

      {error ? <div className="notice error"><strong>Could not load dashboard.</strong> {error}</div> : null}

      <section className="dashboard-kpis" aria-label="Key metrics">
        <article className="dashboard-kpi">
          <span className="kpi-icon kpi-icon-blue">◎</span>
          <div><p>Total leads</p><strong>{metrics.total}</strong><small>Across your workspace</small></div>
        </article>
        <article className="dashboard-kpi">
          <span className="kpi-icon kpi-icon-cyan">↗</span>
          <div><p>New this month</p><strong>{metrics.newThisMonth}</strong><small>{metrics.previousMonth} in the previous month</small></div>
        </article>
        <article className="dashboard-kpi">
          <span className="kpi-icon kpi-icon-violet">◇</span>
          <div><p>Open opportunities</p><strong>{metrics.open}</strong><small>{metrics.won} closed won</small></div>
        </article>
        <article className="dashboard-kpi">
          <span className="kpi-icon kpi-icon-amber">◷</span>
          <div><p>Follow-ups due</p><strong>{metrics.due}</strong><small>{metrics.missingFollowUp} open leads unscheduled</small></div>
        </article>
      </section>

      <div className="dashboard-main-grid">
        <section className="dashboard-panel trend-panel">
          <div className="panel-heading">
            <div><p className="panel-kicker">Growth</p><h2>Lead activity</h2><span>New leads added over the last six months</span></div>
            <span className="panel-tag">Last 6 months</span>
          </div>
          <TrendChart months={metrics.months} />
          <div className="chart-footnote"><span className="legend-dot" /> New leads by month</div>
        </section>

        <section className="dashboard-panel pipeline-panel">
          <div className="panel-heading">
            <div><p className="panel-kicker">Pipeline</p><h2>Current stages</h2><span>Where leads sit today</span></div>
            <Link href="/clients" className="panel-link">View leads →</Link>
          </div>
          <div className="pipeline-list">
            {metrics.pipeline.map((stage, index) => {
              const percent = metrics.total ? Math.round((stage.count / metrics.total) * 100) : 0;
              return (
                <Link className="pipeline-row" href={"/clients?status=" + encodeURIComponent(stage.label)} key={stage.label}>
                  <div><span>{stage.label}</span><strong>{stage.count}</strong></div>
                  <div className="pipeline-track"><span style={{ width: percent + "%", backgroundColor: stageColors[index] }} /></div>
                </Link>
              );
            })}
          </div>
          <p className="panel-note">Each lead is counted in its current stage.</p>
        </section>
      </div>

      <div className="dashboard-secondary-grid">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <div><p className="panel-kicker">Acquisition</p><h2>Lead sources</h2><span>How enquiries reached you</span></div>
          </div>
          <SourcesChart sources={metrics.sources} total={metrics.total} />
        </section>
        <section className="dashboard-panel followup-panel">
          <div className="panel-heading">
            <div><p className="panel-kicker">Next actions</p><h2>Upcoming follow-ups</h2><span>Scheduled on open leads</span></div>
            <Link href="/clients" className="panel-link">All leads →</Link>
          </div>
          {metrics.followUps.length ? (
            <div className="followup-list">
              {metrics.followUps.map((lead) => (
                <Link href={"/clients/" + lead.id} className="followup-row" key={lead.id}>
                  <span className="followup-avatar">{lead.name.slice(0, 1).toUpperCase()}</span>
                  <span className="followup-person"><strong>{lead.name}</strong><small>{lead.status ?? "New"} lead</small></span>
                  <span className={"followup-date" + (lead.follow_up_date! <= metrics.today ? " is-due" : "")}>{formatFollowUp(lead.follow_up_date!)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty"><span>◷</span><strong>No follow-ups scheduled</strong><p>Set a follow-up date on a lead to see it here.</p><Link href="/clients">Browse leads →</Link></div>
          )}
          {metrics.missingFollowUp > 0 ? <div className="followup-reminder">{metrics.missingFollowUp} open {metrics.missingFollowUp === 1 ? "lead has" : "leads have"} no follow-up date.</div> : null}
        </section>
      </div>

      <div className="dashboard-bottom-grid">
        <section className="dashboard-panel matrix-panel">
          <div className="panel-heading">
            <div><p className="panel-kicker">Lead profile</p><h2>Requirement × property type</h2><span>Enquiries by what clients want</span></div>
          </div>
          <div className="matrix-scroll">
            <table className="matrix-table">
              <thead><tr><th>Requirement</th>{PROPERTY_TYPES.map((type) => <th key={type}>{type}</th>)}</tr></thead>
              <tbody>{metrics.matrix.map((row) => (
                <tr key={row.requirement}><th scope="row">{row.requirement}</th>{row.cells.map((cell) => {
                  const strength = cell.count / maxMatrixCount;
                  return <td key={cell.propertyType}><span title={row.requirement + " / " + cell.propertyType + ": " + cell.count} style={{
                    backgroundColor: cell.count ? "rgba(23, 98, 82, " + (0.14 + strength * 0.74) + ")" : "#f1f5f1",
                    color: strength > 0.55 ? "#fff" : "#29443a",
                  }}>{cell.count}</span></td>;
                })}</tr>
              ))}</tbody>
            </table>
          </div>
          <p className="matrix-scroll-hint">Scroll sideways to see all property types →</p>
          <p className="panel-note">Unspecified includes leads without a requirement or property type.</p>
        </section>

        <section className="dashboard-panel health-panel">
          <div className="panel-heading">
            <div><p className="panel-kicker">Data quality</p><h2>Lead details filled</h2><span>Share of leads with each field</span></div>
          </div>
          <div className="health-list">
            {metrics.dataHealth.map((field) => {
              const percent = metrics.total ? Math.round((field.count / metrics.total) * 100) : 0;
              return <div className="health-row" key={field.label}>
                <div><span>{field.label}</span><strong>{percent}%</strong></div>
                <div className="health-track"><span style={{ width: percent + "%" }} /></div>
              </div>;
            })}
          </div>
          <p className="panel-note">{metrics.hot} hot {metrics.hot === 1 ? "lead" : "leads"} marked in the CRM.</p>
        </section>
      </div>
    </div>
  );
}
