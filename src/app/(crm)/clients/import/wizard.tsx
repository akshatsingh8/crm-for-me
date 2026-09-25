"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { IMPORT_FIELDS, suggestMapping, validateImportRows, type ImportField, type ImportRow, type ImportValues } from "@/lib/lead-import";

type SourceRow = { rowNumber: number; cells: string[] };
type Preview = { headers: string[]; rows: SourceRow[] };
type Mapping = Record<ImportField, string>;

export function ImportWizard() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [imported, setImported] = useState<number | null>(null);

  const mappedRows = useMemo<ImportRow[]>(() => {
    if (!preview || !mapping) return [];
    return preview.rows.map((row) => ({
      rowNumber: row.rowNumber,
      values: Object.fromEntries(IMPORT_FIELDS.map((field) => [
        field.key,
        mapping[field.key] === "" ? "" : (row.cells[Number(mapping[field.key])] ?? ""),
      ])) as ImportValues,
    }));
  }, [preview, mapping]);
  const validation = useMemo(() => mappedRows.length ? validateImportRows(mappedRows) : null, [mappedRows]);
  const missingRequired = mapping && IMPORT_FIELDS.some((field) => "required" in field && mapping[field.key] === "");
  const duplicateColumns = mapping && Object.values(mapping).filter(Boolean).length !== new Set(Object.values(mapping).filter(Boolean)).size;

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setPreview(null);
    setMapping(null);
    setError("");
    setServerErrors([]);
    setImported(null);
  }

  async function readFile() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/clients/import/preview", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not read file.");
      const parsed = result as Preview;
      setPreview(parsed);
      setMapping(suggestMapping(parsed.headers));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not read file.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmImport() {
    if (!validation || validation.errors.length || missingRequired || duplicateColumns) return;
    setBusy(true);
    setError("");
    setServerErrors([]);
    try {
      const response = await fetch("/api/clients/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mappedRows),
      });
      const result = await response.json();
      if (!response.ok) {
        setServerErrors(Array.isArray(result.errors) ? result.errors : []);
        throw new Error(result.error || "Import failed.");
      }
      setImported(result.imported);
      setPreview(null);
      setMapping(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="import-stack">
      {imported !== null ? (
        <div className="notice success"><strong>{imported} {imported === 1 ? "lead" : "leads"} imported.</strong> <Link href="/clients">View lead directory →</Link></div>
      ) : null}
      {error ? <div className="notice error" role="alert">{error}</div> : null}
      {serverErrors.length > 0 ? <div className="notice error"><ul>{serverErrors.slice(0, 8).map((message, index) => <li key={index}>{message}</li>)}</ul></div> : null}

      <section className="import-card">
        <div className="import-step"><span>1</span><div><h2>Choose a file</h2><p>Use the first sheet of an .xlsx workbook, or upload .csv or .tsv. The first nonempty row should contain column names. Maximum 5 MB and 2,000 leads.</p></div></div>
        <div className="import-upload">
          <input type="file" accept=".xlsx,.csv,.tsv" aria-label="Choose lead file" onChange={chooseFile} />
          <button type="button" className="button button-secondary" onClick={readFile} disabled={!file || busy}>{busy && !preview ? "Reading…" : "Read file"}</button>
        </div>
      </section>

      {preview && mapping ? (
        <>
          <section className="import-card">
            <div className="import-step"><span>2</span><div><h2>Map your columns</h2><p>Choose which file column fills each lead field. Required fields are marked with *; leave other fields unmapped if your file does not have them.</p></div></div>
            <div className="mapping-grid">
              {IMPORT_FIELDS.map((field) => (
                <label key={field.key}>{field.label} {"required" in field ? <span>*</span> : null}
                  <select value={mapping[field.key]} onChange={(event) => setMapping({ ...mapping, [field.key]: event.target.value })}>
                    <option value="">Do not import</option>
                    {preview.headers.map((header, index) => <option value={String(index)} key={index}>{header} (column {index + 1})</option>)}
                  </select>
                </label>
              ))}
            </div>
            {duplicateColumns ? <p className="form-error">Map each source column to only one lead field.</p> : null}
          </section>

          <section className="import-card">
            <div className="import-step"><span>3</span><div><h2>Review and confirm</h2><p>{preview.rows.length} {preview.rows.length === 1 ? "row" : "rows"} ready for review. No lead is saved until you confirm.</p></div></div>
            {validation && validation.errors.length > 0 ? (
              <div className="notice error"><strong>Fix {validation.errors.length} {validation.errors.length === 1 ? "issue" : "issues"} in the file or mapping:</strong><ul>{validation.errors.slice(0, 8).map((message, index) => <li key={index}>{message}</li>)}</ul>{validation.errors.length > 8 ? <p>Showing the first 8 issues.</p> : null}</div>
            ) : null}
            <div className="table-scroll import-preview"><table><thead><tr><th>Row</th>{IMPORT_FIELDS.filter((field) => mapping[field.key] !== "").map((field) => <th key={field.key}>{field.label}</th>)}</tr></thead><tbody>
              {mappedRows.slice(0, 5).map((row) => <tr key={row.rowNumber}><td>{row.rowNumber}</td>{IMPORT_FIELDS.filter((field) => mapping[field.key] !== "").map((field) => <td key={field.key}>{row.values[field.key] || "—"}</td>)}</tr>)}
            </tbody></table></div>
            {mappedRows.length > 5 ? <p className="import-caption">Showing the first 5 of {mappedRows.length} rows. All valid rows will be imported.</p> : null}
            <div className="import-actions"><button type="button" className="button button-primary" onClick={confirmImport} disabled={busy || !!missingRequired || !!duplicateColumns || !!validation?.errors.length}>{busy ? "Importing…" : `Confirm and import ${mappedRows.length} ${mappedRows.length === 1 ? "lead" : "leads"}`}</button></div>
          </section>
        </>
      ) : null}
    </div>
  );
}
