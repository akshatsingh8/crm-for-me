import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { logoutAction } from "./actions";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/dashboard">
          <span className="brand-mark brand-mark-small">C</span>
          <span>crm for me</span>
        </Link>
        <nav>
          <Link href="/dashboard">Clients</Link>
          <Link href="/clients/new">Add client</Link>
        </nav>
        <form action={logoutAction} className="logout-form">
          <button className="nav-button" type="submit">Log out</button>
        </form>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
