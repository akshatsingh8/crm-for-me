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
      <path d="m16 17 13 13a4 4 0 0 0 6 0l13-13M32 32l12 17" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
