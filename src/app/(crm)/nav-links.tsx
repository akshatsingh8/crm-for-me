"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function CrmNavLinks() {
  const pathname = usePathname();
  const dashboardActive = pathname === "/dashboard";
  const clientsActive = pathname === "/clients" || (pathname.startsWith("/clients/") && pathname !== "/clients/new");
  return (
    <>
      <Link className={dashboardActive ? "is-active" : ""} aria-current={dashboardActive ? "page" : undefined} href="/dashboard"><span className="nav-icon">▦</span>Dashboard</Link>
      <Link className={clientsActive ? "is-active" : ""} aria-current={clientsActive ? "page" : undefined} href="/clients"><span className="nav-icon">◉</span>Leads</Link>
      <Link className={pathname === "/lead-calling" ? "is-active" : ""} aria-current={pathname === "/lead-calling" ? "page" : undefined} href="/lead-calling"><span className="nav-icon">☎</span>Lead calling</Link>
      <Link className={pathname === "/clients/new" ? "is-active" : ""} aria-current={pathname === "/clients/new" ? "page" : undefined} href="/clients/new"><span className="nav-icon">＋</span>Add client</Link>
    </>
  );
}
