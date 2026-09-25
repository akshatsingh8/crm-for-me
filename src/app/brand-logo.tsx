export function BrandLogo({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={`brand-logo${small ? " brand-logo-small" : ""}`}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="64" height="64" rx="15" fill="#104B40" />
      <path d="M18 18v18c0 9 5.5 15 14 15s14-6 14-15v-8" stroke="white" strokeWidth="6" strokeLinecap="round" />
      <path d="m37 24 10-10m-8 0h8v8" stroke="#F1C77B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
