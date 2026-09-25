"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { recordLeadActivityAction } from "./actions";

export function ActivityNoteForm({ leadId }: { leadId: number }) {
  const router = useRouter();
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const result = await recordLeadActivityAction({ leadId, kind: "note", details });
      if (result.error) setError(result.error);
      else {
        setDetails("");
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
      <label>Add a timeline note<textarea value={details} onChange={(event) => setDetails(event.target.value)} rows={3} maxLength={5000} required placeholder="Conversation, decision, or next step" /></label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="button button-secondary" type="submit" disabled={saving}>{saving ? "Saving…" : "Add note"}</button>
    </form>
  );
}
