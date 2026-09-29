export const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Interested",
  "Nurturing",
  "Future potential",
  "Site visit",
  "Negotiation",
  "Closed won",
  "Not interested",
  "Closed lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const CLOSED_LEAD_STATUSES: readonly LeadStatus[] = ["Closed won", "Not interested", "Closed lost"];

export function isLeadStatus(value: string): value is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(value);
}
