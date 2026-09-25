import { loadAllLeads } from "@/lib/lead-data";
import { buildDashboardMetrics } from "@/lib/dashboard-metrics";
import { DashboardOverview } from "./overview";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { leads, error } = await loadAllLeads();
  const metrics = buildDashboardMetrics(leads);

  return (
    <DashboardOverview metrics={metrics} error={error} />
  );
}
