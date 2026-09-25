"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { recordLeadActivityAction, recordLeadCallAction } from "./actions";

type Props = {
  leadId: number;
  name: string;
  phone: string;
  currentStatus: string | null;
};

function phoneLinks(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const international = digits.length === 10 ? `91${digits}` : digits.startsWith("0") && digits.length === 11 ? `91${digits.slice(1)}` : digits;
  return {
    tel: digits ? `tel:${phone.replace(/[^\d+]/g, "")}` : null,
    whatsapp: international.length >= 10 ? `https://wa.me/${international}` : null,
  };
}

export function LeadContactButtons({ leadId, name, phone, currentStatus }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"call" | "whatsapp" | null>(null);
  const [calledAt, setCalledAt] = useState("");
  const [outcome, setOutcome] = useState<"Contacted" | "Did not connect">("Contacted");
  const [leadStatus, setLeadStatus] = useState("Contacted");
  const [details, setDetails] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const links = phoneLinks(phone);

  useEffect(() => {
    if (!mode) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) setMode(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, saving]);

  function startCall() {
    setCalledAt(new Date().toISOString());
    setOutcome("Contacted");
    setLeadStatus(currentStatus && currentStatus !== "New" ? "" : "Contacted");
    setDetails("");
    setFollowUpDate("");
    setError("");
    setMode("call");
  }

  function startWhatsapp() {
    setDetails("");
    setError("");
    setMode("whatsapp");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const result = mode === "call"
        ? await recordLeadCallAction({ leadId, outcome, details, leadStatus, followUpDate, calledAt })
        : await recordLeadActivityAction({ leadId, kind: "whatsapp", details });
      if (result.error) {
        setError(result.error);
      } else {
        setMode(null);
        router.refresh();
      }
    } catch {
      setError("Could not save this activity. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="contact-actions">
        {links.tel ? <a className="button button-primary contact-button" href={links.tel} onClick={startCall} aria-label={`Call ${name}`}>Call</a> : null}
        {links.whatsapp ? <a className="button button-whatsapp contact-button" href={links.whatsapp} target="_blank" rel="noopener noreferrer" onClick={startWhatsapp} aria-label={`WhatsApp ${name}`}>WhatsApp</a> : null}
      </div>

      {mode ? createPortal((
        <div className="feedback-backdrop">
          <section className="feedback-dialog" role="dialog" aria-modal="true" aria-labelledby={`feedback-title-${leadId}`}>
            <div className="feedback-heading">
              <div>
                <p className="eyebrow">{mode === "call" ? "Call feedback" : "WhatsApp activity"}</p>
                <h2 id={`feedback-title-${leadId}`}>{mode === "call" ? `How did the call with ${name} go?` : `What did you discuss with ${name}?`}</h2>
              </div>
              <button className="dialog-close" type="button" aria-label="Close feedback" disabled={saving} onClick={() => setMode(null)}>×</button>
            </div>
            <form onSubmit={save} className="feedback-form">
              {mode === "call" ? (
                <>
                  <label>Call result
                    <select value={outcome} onChange={(event) => {
                      const next = event.target.value as "Contacted" | "Did not connect";
                      setOutcome(next);
                      setLeadStatus(next === "Contacted" && (!currentStatus || currentStatus === "New") ? "Contacted" : "");
                    }}>
                      <option>Contacted</option><option>Did not connect</option>
                    </select>
                  </label>
                  <label>Lead status
                    <select value={leadStatus} onChange={(event) => setLeadStatus(event.target.value)}>
                      <option value="">Keep current status{currentStatus ? ` (${currentStatus})` : ""}</option>
                      <option>New</option><option>Contacted</option><option>Site visit</option><option>Negotiation</option><option>Closed won</option><option>Closed lost</option>
                    </select>
                  </label>
                </>
              ) : null}
              <label>{mode === "call" ? "Discussion / feedback" : "Conversation summary"} {mode === "whatsapp" || outcome === "Contacted" ? <span>*</span> : null}
                <textarea value={details} onChange={(event) => setDetails(event.target.value)} rows={4} maxLength={5000} required={mode === "whatsapp" || outcome === "Contacted"} placeholder={mode === "call" ? "What did they say? What happens next?" : "Messages, questions, and next steps"} />
              </label>
              {mode === "call" ? <label>Next follow-up (optional)<input type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} /></label> : null}
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              <div className="feedback-actions">
                <button className="button button-ghost" type="button" disabled={saving} onClick={() => setMode(null)}>Cancel</button>
                <button className="button button-primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save activity"}</button>
              </div>
            </form>
          </section>
        </div>
      ), document.body) : null}
    </>
  );
}
