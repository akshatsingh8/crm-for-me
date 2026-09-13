"use server";

import { createSession, credentialsAreValid } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!credentialsAreValid(id, password)) redirect("/login?error=1");
  await createSession();
  redirect("/dashboard");
}
