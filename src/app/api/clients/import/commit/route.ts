import { revalidatePath } from "next/cache";
import { importRequestError } from "@/lib/import-api";
import { validateImportRows } from "@/lib/lead-import";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const authError = await importRequestError(request);
  if (authError) return authError;
  if (Number(request.headers.get("content-length")) > 5 * 1024 * 1024) {
    return Response.json({ error: "Import request is too large." }, { status: 413 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid import request." }, { status: 400 });
  }
  const { records, errors } = validateImportRows(body);
  if (errors.length) return Response.json({ error: "Fix the highlighted rows before importing.", errors: errors.slice(0, 50) }, { status: 400 });

  const { error } = await getSupabase().from("real_estate_clients").insert(records);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  revalidatePath("/dashboard");
  return Response.json({ imported: records.length });
}
