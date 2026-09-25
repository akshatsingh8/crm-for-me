"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { recordLeadActivityAction } from "./actions";

export function ActivityNoteForm({ leadId }: { leadId: number }) {
  const router = useRouter();
  const [kind, setKind] = useState<"note" | "whatsapp" | "site_visit" | "follow_up">("note");
  const [outcome, setOutcome] = useState("Completed");
  const [visitAt, setVisitAt] = useState("");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const visitTime = kind === "site_visit" && visitAt ? new Date(visitAt) : null;
      if (kind === "site_visit" && (!visitTime || Number.isNaN(visitTime.getTime()))) {
        setError("Choose a valid site visit date and time.");
        return;
      }
      const result = await recordLeadActivityAction({
        leadId, kind, details,
        ...(kind === "site_visit" || kind === "follow_up" ? { outcome } : {}),
        ...(visitTime ? { occurredAt: visitTime.toISOString() } : {}),
      });
      if (result.error) setError(result.error);
      else {
        setDetails("");
        setVisitAt("");
        router.refresh();
      }
    } catch {
      setError("Could not save this note. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="activity-note-form" onSubmit={save}>
      <div className="activity-form-row">
        <label>Activity type
          <select value={kind} onChange={(event) => {
            setKind(event.target.value as typeof kind);
            setOutcome("Completed");
          }}>
            <option value="note">Note</option>
            <option value="whatsapp">WhatsApp message</option>
            <option value="site_visit">Site visit</option>
            <option value="follow_up">Follow-up</option>
          </select>
        </label>
        {kind === "site_visit" ? <label>Visit result
          <select value={outcome} onChange={(event) => setOutcome(event.target.value)}><option>Completed</option><option>Scheduled</option></select>
        </label> : null}
        {kind === "follow_up" ? <label>Follow-up result
          <select value={outcome} onChange={(event) => setOutcome(event.target.value)}><option>Completed</option><option>Attempted</option></select>
        </label> : null}
      </div>
      {kind === "site_visit" ? <label>Visit date and time
        <input type="datetime-local" value={visitAt} onChange={(event) => setVisitAt(event.target.value)} required />
      </label> : null}
      <label>{kind === "note" ? "Timeline note" : kind === "site_visit" ? "Visit details" : kind === "follow_up" ? "Follow-up summary" : "Conversation summary"}
        <textarea value={details} onChange={(event) => setDetails(event.target.value)} rows={3} maxLength={5000} required placeholder={kind === "site_visit" ? "Property visited, feedback, and next step" : "Conversation, decision, or next step"} />
      </label>
      {kind === "follow_up" ? <p className="activity-form-hint">To change the next scheduled date, use Edit lead above.</p> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="button button-secondary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save activity"}</button>
    </form>
  );
}
