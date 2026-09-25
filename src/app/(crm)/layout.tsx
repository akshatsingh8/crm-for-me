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
          <p className="nav-label">Workspace</p>
          <Link href="/dashboard"><span className="nav-icon">◉</span>Clients</Link>
          <Link href="/clients/new"><span className="nav-icon">＋</span>Add client</Link>
          <Link href="/clients/import"><span className="nav-icon">⇧</span>Import leads</Link>
        </nav>
        <form action={logoutAction} className="logout-form">
          <button className="nav-button" type="submit">Log out</button>
        </form>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
