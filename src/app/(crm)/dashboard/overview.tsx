"use client";

import { useState } from "react";
import Link from "next/link";
import type { buildDashboardMetrics } from "@/lib/dashboard-metrics";

type Metrics = ReturnType<typeof buildDashboardMetrics>;

const sourceColors = ["#176b57", "#52a48b", "#9acbb5", "#b78a45", "#597a8e", "#95a796", "#ccd9d1"];
const stageColors = ["#176b57", "#41947b", "#84baa2", "#b78a45", "#597a8e", "#b5c8bc"];

function TrendChart({ months }: { months: Metrics["months"] }) {
  const [period, setPeriod] = useState<6 | 12>(6);
  const [selectedKey, setSelectedKey] = useState(months[months.length - 1].key);
  const visibleMonths = months.slice(-period);
  const selectedMonth = visibleMonths.find((month) => month.key === selectedKey) ?? visibleMonths[visibleMonths.length - 1];
  const max = Math.max(1, ...visibleMonths.map((month) => month.count));
  const points = visibleMonths.map((month, index) => ({
    x: 34 + (index * 690) / (visibleMonths.length - 1),
    y: 207 - (month.count / max) * 152,
    count: month.count,
    label: month.label,
    key: month.key,
  }));
  const line = "M " + points.map((point) => point.x + " " + point.y).join(" L ");
  const area = line + " L " + points[points.length - 1].x + " 207 L " + points[0].x + " 207 Z";

  return (
    <div className="trend-chart">
      <div className="trend-toolbar">
        <div className="trend-highlight" aria-live="polite"><strong>{selectedMonth.count}</strong><span>new {selectedMonth.count === 1 ? "lead" : "leads"} in {selectedMonth.label}</span></div>
        <div className="dashboard-segmented" aria-label="Chart period">
          <button type="button" className={period === 6 ? "is-selected" : ""} aria-pressed={period === 6} onClick={() => setPeriod(6)}>6 months</button>
          <button type="button" className={period === 12 ? "is-selected" : ""} aria-pressed={period === 12} onClick={() => setPeriod(12)}>12 months</button>
        </div>
      </div>
      <svg viewBox="0 0 760 225" role="img" aria-label={"New leads by month: " + visibleMonths.map((month) => month.label + " " + month.count).join(", ")}>
        <defs>
          <linearGradient id="lead-trend-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#176b57" stopOpacity=".22" />
            <stop offset="100%" stopColor="#176b57" stopOpacity=".01" />
          </linearGradient>
        </defs>
        {[55, 106, 157, 207].map((y) => <line key={y} x1="34" x2="724" y1={y} y2={y} stroke="#e4eee8" strokeDasharray="4 6" />)}
        <path d={area} fill="url(#lead-trend-fill)" />
        <path className="trend-line" d={line} fill="none" stroke="#176b57" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r={point.key === selectedMonth.key ? 8 : 5} fill={point.key === selectedMonth.key ? "#176b57" : "#fff"} stroke="#176b57" strokeWidth="2.5" />
            <title>{point.label + ": " + point.count + " new leads"}</title>
          </g>
        ))}
      </svg>
      <div className="trend-months" aria-label="Select a month to inspect">
        {visibleMonths.map((month) => <button type="button" key={month.key} className={month.key === selectedMonth.key ? "is-selected" : ""} aria-pressed={month.key === selectedMonth.key} onClick={() => setSelectedKey(month.key)}>{month.label}</button>)}
      </div>
    </div>
  );
}

function SourcesChart({ sources, total }: { sources: Metrics["sources"]; total: number }) {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const selected = sources.find((source) => source.label === selectedSource);
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
        <div className="source-donut-hole" aria-live="polite"><strong>{selected?.count ?? total}</strong><span>{selected ? selected.label : "total leads"}</span></div>
      </div>
      <div className="source-legend">
        {sources.length ? sources.map((source, index) => (
          <button type="button" className={"source-legend-row" + (selectedSource === source.label ? " is-selected" : "")} key={source.label} aria-pressed={selectedSource === source.label} onClick={() => setSelectedSource(selectedSource === source.label ? null : source.label)}>
            <span className="legend-dot" style={{ backgroundColor: sourceColors[index % sourceColors.length] }} />
            <span>{source.label}</span>
            <strong>{source.count}</strong>
          </button>
        )) : <p className="muted">Add or import leads to see where they came from.</p>}
      </div>
    </div>
  );
}

export function DashboardOverview({ metrics, error }: { metrics: Metrics; error: string | null }) {
  const todayLabel = new Intl.DateTimeFormat("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(metrics.today + "T00:00:00Z"));
  const focus = metrics.due > 0
    ? { label: "Follow-up priority", title: `${metrics.due} ${metrics.due === 1 ? "conversation needs" : "conversations need"} attention`, detail: `${metrics.overdue} overdue · ${metrics.dueToday} due today`, href: "/lead-calling", action: "Open calling workspace" }
    : metrics.missingFollowUp > 0
      ? { label: "Plan the next step", title: `${metrics.missingFollowUp} open ${metrics.missingFollowUp === 1 ? "lead needs" : "leads need"} a follow-up date`, detail: "Schedule the next contact to keep your pipeline moving.", href: "/clients", action: "Review leads" }
      : metrics.total === 0
        ? { label: "Get started", title: "Your workspace is ready for its first lead", detail: "Add a lead or import your existing list to begin tracking activity.", href: "/clients/new", action: "Add your first lead" }
        : { label: "All clear", title: "Your follow-ups are on track", detail: `${metrics.open} open opportunities are in your pipeline.`, href: "/clients", action: "Explore leads" };

  return (
    <div className="page-wrap dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Real estate workspace / Overview</p>
          <h1>Good to see you.</h1>
          <p className="muted">Your pipeline, priorities, and next actions in one place.</p>
        </div>
        <div className="dashboard-header-side">
          <span className="dashboard-date">{todayLabel}</span>
          <Link className="button button-primary" href="/clients/new">+ Add lead</Link>
        </div>
      </header>

      {error ? <div className="notice error"><strong>Could not load dashboard.</strong> {error}</div> : null}

      <section className="dashboard-focus" aria-label="Recommended next action">
        <div className="dashboard-focus-copy"><span className="dashboard-focus-label"><span className="dashboard-focus-spark" /> {focus.label}</span><h2>{focus.title}</h2><p>{focus.detail}</p></div>
        <Link href={focus.href} className="dashboard-focus-action">{focus.action} <span aria-hidden="true">↗</span></Link>
      </section>

      <section className="dashboard-kpis" aria-label="Key metrics">
        <Link href="/clients" className="dashboard-kpi">
          <span className="kpi-icon kpi-icon-blue">◎</span>
          <div><p>Total leads</p><strong>{metrics.total}</strong><small>View all leads <span aria-hidden="true">↗</span></small></div>
        </Link>
        <article className="dashboard-kpi">
          <span className="kpi-icon kpi-icon-cyan">↗</span>
          <div><p>New this month</p><strong>{metrics.newThisMonth}</strong><small>{metrics.previousMonth} last month</small></div>
        </article>
        <Link href="/clients" className="dashboard-kpi">
          <span className="kpi-icon kpi-icon-violet">◇</span>
          <div><p>Open opportunities</p><strong>{metrics.open}</strong><small>{metrics.won} closed won <span aria-hidden="true">↗</span></small></div>
        </Link>
        <Link href="/lead-calling" className="dashboard-kpi">
          <span className="kpi-icon kpi-icon-amber">◷</span>
          <div><p>Follow-ups due</p><strong>{metrics.due}</strong><small>{metrics.overdue} overdue <span aria-hidden="true">↗</span></small></div>
        </Link>
      </section>

      <div className="dashboard-main-grid">
        <section className="dashboard-panel trend-panel">
          <div className="panel-heading">
            <div><p className="panel-kicker">Growth</p><h2>Lead activity</h2><span>New leads added by month</span></div>
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

      <section className="dashboard-panel sources-panel">
        <div className="panel-heading">
          <div><p className="panel-kicker">Acquisition</p><h2>Lead sources</h2><span>How enquiries reached you</span></div>
        </div>
        <SourcesChart sources={metrics.sources} total={metrics.total} />
      </section>
    </div>
  );
}
