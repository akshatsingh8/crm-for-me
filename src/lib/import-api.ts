import "server-only";

import { isAuthenticated } from "@/lib/auth";

export async function importRequestError(request: Request): Promise<Response | null> {
  if (!(await isAuthenticated())) return Response.json({ error: "Please sign in again." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }
  return null;
}
