import { readSheet } from "read-excel-file/node";
import Papa from "papaparse";
import { importRequestError } from "@/lib/import-api";

export const runtime = "nodejs";

type SourceRow = { rowNumber: number; cells: string[] };

function cellText(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value === null ? "" : String(value).trim();
}

export async function POST(request: Request) {
  const authError = await importRequestError(request);
  if (authError) return authError;
  if (Number(request.headers.get("content-length")) > 5 * 1024 * 1024 + 20000) {
    return Response.json({ error: "File must be 5 MB or smaller." }, { status: 413 });
  }
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Choose a file to import." }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return Response.json({ error: "File must be 5 MB or smaller." }, { status: 400 });

  const extension = file.name.toLowerCase().split(".").pop();
  if (!["xlsx", "csv", "tsv"].includes(extension ?? "")) {
    return Response.json({ error: "Use an .xlsx, .csv, or .tsv file." }, { status: 400 });
  }

  try {
    let rows: SourceRow[] = [];
    if (extension === "xlsx") {
      const sheet = await readSheet(Buffer.from(await file.arrayBuffer()));
      if (sheet.length > 2001 || sheet.some((row) => row.length > 60)) {
        return Response.json({ error: "Import at most 2,000 leads and 60 columns at a time." }, { status: 400 });
      }
      rows = sheet.map((row, index) => ({ rowNumber: index + 1, cells: row.map(cellText) }))
        .filter((row) => row.cells.some((cell) => cell.trim()));
    } else {
      const text = (await file.text()).replace(/^\uFEFF/, "");
      const parsed = Papa.parse<string[]>(text, { delimiter: extension === "tsv" ? "\t" : "", skipEmptyLines: "greedy" });
      if (parsed.errors.length) return Response.json({ error: `Could not read file: ${parsed.errors[0].message}` }, { status: 400 });
      rows = parsed.data.filter((cells) => cells.some((cell) => cell.trim())).map((cells, index) => ({ rowNumber: index + 1, cells }));
    }

    if (rows.length < 2) return Response.json({ error: "Include a header row and at least one lead." }, { status: 400 });
    if (rows.length > 2001) return Response.json({ error: "Import at most 2,000 leads at a time." }, { status: 400 });
    const headers = rows[0].cells.map((cell, index) => cell.trim() || `Column ${index + 1}`);
    if (headers.length > 60 || rows.some((row) => row.cells.length > 60)) {
      return Response.json({ error: "Files can have at most 60 columns." }, { status: 400 });
    }
    return Response.json({ headers, rows: rows.slice(1) });
  } catch {
    return Response.json({ error: "Could not read this file. Check that it is a valid spreadsheet or delimited text file." }, { status: 400 });
  }
}
