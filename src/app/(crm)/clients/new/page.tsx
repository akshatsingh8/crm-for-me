import Link from "next/link";
import { createClientAction } from "../../actions";

export default async function NewClientPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="page-wrap form-page">
      <Link className="back-link" href="/clients">← Back to leads</Link>

      <form action={createClientAction} className="client-form">
        {error ? <div className="notice error"><strong>Could not add client.</strong> {error}</div> : null}
        <div className="form-intro">
          <p className="eyebrow">New property enquiry</p>
          <h1>Add a lead</h1>
          <p className="muted">Capture the essentials now. You can fill in the rest whenever you have it.</p>
        </div>

        <div className="form-grid lead-form-grid">
          <label>Full name <span>*</span><input name="name" placeholder="e.g. Aditi Sharma" required autoFocus /></label>
          <label>Phone number <span>*</span><input name="phone" type="tel" placeholder="e.g. +91 98765 43210" required /></label>
          <label className="field-full">Email address <input name="email" type="email" placeholder="aditi@example.com" /></label>
          <label>Requirement <select name="requirement" defaultValue=""><option value="">Not specified</option><option>Buy</option><option>Rent</option><option>Sell</option></select></label>
          <label>Property type <select name="property_type" defaultValue=""><option value="">Not specified</option><option>Apartment</option><option>Villa</option><option>Plot</option><option>Commercial</option><option>Office</option><option>Other</option></select></label>
          <label>Property / project <input name="property_project" placeholder="e.g. DLF Camellias" /></label>
          <label>Preferred location <input name="preferred_location" placeholder="e.g. Golf Course Road, Gurugram" /></label>
          <label>Minimum budget (₹) <input name="budget_min" type="number" min="0" step="1000" inputMode="numeric" placeholder="e.g. 1,00,00,000" /></label>
          <label>Maximum budget (₹) <input name="budget_max" type="number" min="0" step="1000" inputMode="numeric" placeholder="e.g. 1,50,00,000" /></label>
          <label>Lead source <select name="lead_source" defaultValue=""><option value="">Not specified</option><option>Referral</option><option>Website</option><option>Portal</option><option>Social media</option><option>Walk-in</option><option>Other</option></select></label>
          <label>Lead temperature <select name="lead_temperature" defaultValue=""><option value="">Not specified</option><option>Hot</option><option>Warm</option><option>Cold</option></select></label>
          <label>Status <select name="status" defaultValue=""><option value="">Not specified</option><option>New</option><option>Contacted</option><option>Site visit</option><option>Negotiation</option><option>Closed won</option><option>Closed lost</option></select></label>
          <label>Next follow-up <input name="follow_up_date" type="date" /></label>
          <label className="field-full">Notes <textarea name="notes" rows={4} placeholder="Property preferences, site visit details, objections, or next steps…" /></label>
        </div>
        <div className="form-actions">
          <Link className="button button-ghost" href="/clients">Cancel</Link>
          <button className="button button-primary" type="submit">Save lead</button>
        </div>
      </form>
    </div>
  );
}
