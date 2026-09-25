import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { BrandLogo } from "../brand-logo";
import { BrandCredit } from "../brand-credit";
import { logoutAction } from "./actions";
import { CrmNavLinks } from "./nav-links";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/dashboard">
          <BrandLogo small />
          <span className="brand-copy"><span>Udachi CRM</span><BrandCredit /></span>
        </Link>
        <nav aria-label="Workspace navigation">
          <p className="nav-label">Workspace</p>
          <CrmNavLinks />
        </nav>
        <form action={logoutAction} className="logout-form">
          <button className="nav-button" type="submit">Log out</button>
        </form>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
