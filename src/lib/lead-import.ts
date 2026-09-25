export const IMPORT_FIELDS = [
  { key: "name", label: "Full name", required: true, aliases: ["client name", "customer name", "lead name", "full name"] },
  { key: "phone", label: "Phone number", required: true, aliases: ["mobile", "mobile number", "contact number", "telephone", "phone no"] },
  { key: "email", label: "Email address", aliases: ["email id", "e mail"] },
  { key: "requirement", label: "Requirement", aliases: ["looking for", "intent"] },
  { key: "property_type", label: "Property type", aliases: ["type of property"] },
  { key: "property_project", label: "Property / project", aliases: ["project", "property name"] },
  { key: "preferred_location", label: "Preferred location", aliases: ["location", "area", "locality"] },
  { key: "budget_min", label: "Minimum budget (₹)", aliases: ["min budget", "budget from"] },
  { key: "budget_max", label: "Maximum budget (₹)", aliases: ["max budget", "budget to"] },
  { key: "lead_source", label: "Lead source", aliases: ["source", "channel"] },
  { key: "lead_temperature", label: "Lead temperature", aliases: ["temperature", "priority"] },
  { key: "status", label: "Status", aliases: ["lead status", "stage"] },
  { key: "follow_up_date", label: "Next follow-up", aliases: ["follow up", "follow up date", "next follow up"] },
  { key: "notes", label: "Notes", aliases: ["remarks", "comments", "description"] },
] as const;

export type ImportField = (typeof IMPORT_FIELDS)[number]["key"];
export type ImportValues = Record<ImportField, string>;
export type ImportRow = { rowNumber: number; values: ImportValues };

const choices: Partial<Record<ImportField, readonly string[]>> = {
  requirement: ["Buy", "Rent", "Sell"],
  property_type: ["Apartment", "Villa", "Plot", "Commercial", "Office", "Other"],
  lead_source: ["Referral", "Website", "Portal", "Social media", "Walk-in", "Other"],
  lead_temperature: ["Hot", "Warm", "Cold"],
  status: ["New", "Contacted", "Site visit", "Negotiation", "Closed won", "Closed lost"],
};

export function normalizeHeading(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function suggestMapping(headers: string[]): Record<ImportField, string> {
  return Object.fromEntries(IMPORT_FIELDS.map((field) => {
    const names = [field.key, field.label, ...field.aliases].map(normalizeHeading);
    const index = headers.findIndex((header) => names.includes(normalizeHeading(header)));
    return [field.key, index < 0 ? "" : String(index)];
  })) as Record<ImportField, string>;
}

function normalizeDate(value: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null;
  }
  const match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(value);
  if (!match) return null;
  const iso = `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  return normalizeDate(iso);
}

export function validateImportRows(input: unknown): {
  records: Record<string, string | number | null>[];
  errors: string[];
} {
  const errors: string[] = [];
  const records: Record<string, string | number | null>[] = [];
  if (!Array.isArray(input) || input.length === 0 || input.length > 2000) {
    return { records, errors: ["Import must contain between 1 and 2,000 rows."] };
  }

  for (const [index, item] of input.entries()) {
    if (!item || typeof item !== "object" || !Number.isSafeInteger(item.rowNumber) || !item.values || typeof item.values !== "object") {
      errors.push(`Row ${index + 2}: invalid row data.`);
      continue;
    }
    const row = item as ImportRow;
    const record: Record<string, string | number | null> = {};
    for (const field of IMPORT_FIELDS) {
      const raw = row.values[field.key];
      if (typeof raw !== "string" || raw.length > 10000) {
        errors.push(`Row ${row.rowNumber}: ${field.label} is invalid or too long.`);
        continue;
      }
      const value = raw.trim();
      if ("required" in field && field.required && !value) errors.push(`Row ${row.rowNumber}: ${field.label} is required.`);
      if (value.length > (field.key === "notes" ? 10000 : 500)) errors.push(`Row ${row.rowNumber}: ${field.label} is too long.`);
      if (field.key === "budget_min" || field.key === "budget_max") {
        const number = value ? Number(value.replace(/[₹,\s]/g, "")) : null;
        if (number !== null && (!Number.isFinite(number) || number < 0)) errors.push(`Row ${row.rowNumber}: ${field.label} must be a non-negative number.`);
        record[field.key] = number;
      } else if (field.key === "follow_up_date") {
        const date = value ? normalizeDate(value) : null;
        if (value && !date) errors.push(`Row ${row.rowNumber}: Next follow-up must be a valid date (YYYY-MM-DD or DD/MM/YYYY).`);
        record[field.key] = date;
      } else {
        const allowed = choices[field.key];
        const matched = allowed?.find((choice) => choice.toLowerCase() === value.toLowerCase());
        if (value && allowed && !matched) errors.push(`Row ${row.rowNumber}: ${field.label} must be one of ${allowed.join(", ")}.`);
        if (field.key === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.push(`Row ${row.rowNumber}: Email address is invalid.`);
        record[field.key] = matched ?? (value || null);
      }
    }
    if (typeof record.budget_min === "number" && typeof record.budget_max === "number" && record.budget_max < record.budget_min) {
      errors.push(`Row ${row.rowNumber}: Maximum budget is below minimum budget.`);
    }
    records.push(record);
  }
  return { records, errors };
}
