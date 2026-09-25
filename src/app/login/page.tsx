import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { BrandCredit } from "../brand-credit";
import { loginAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAuthenticated()) redirect("/dashboard");
  const { error } = await searchParams;

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand"><span className="brand-copy"><span>Udachi CRM</span><BrandCredit /></span></div>
        <p className="eyebrow">Welcome back</p>
        <h1>Your leads, in one place.</h1>
        <p className="muted">Sign in to manage client enquiries and follow-ups with clarity.</p>

        <form action={loginAction} className="form-stack">
          <label>
            Login ID
            <input name="id" autoComplete="username" placeholder="Enter your ID" required autoFocus />
          </label>
          <label>
            Password
            <input name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required />
          </label>
          {error ? <p className="form-error">The login ID or password is incorrect.</p> : null}
          <button className="button button-primary button-wide" type="submit">Sign in</button>
        </form>
      </section>
    </main>
  );
}
