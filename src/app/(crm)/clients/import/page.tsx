import Link from "next/link";
import { ImportWizard } from "./wizard";

export default function ImportClientsPage() {
  return (
    <div className="page-wrap narrow-page">
      <Link className="back-link" href="/clients">← Back to leads</Link>
      <header className="page-header">
        <div>
          <p className="eyebrow">Bulk add leads</p>
          <h1>Import leads</h1>
          <p className="muted">Upload an Excel, CSV, or TSV file. Match its columns, review the records, and confirm before anything is saved.</p>
        </div>
      </header>
      <ImportWizard />
    </div>
  );
}
