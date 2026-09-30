"use client";

import { useState } from "react";

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return "*".repeat(Math.max(1, digits.length));
  return `${digits.slice(0, 2)}${"*".repeat(Math.max(2, digits.length - 4))}${digits.slice(-2)}`;
}

export function PhoneDisplay({ phone, compact = false }: { phone: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copyPhone() {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <span className={`phone-display${compact ? " phone-display-compact" : ""}`}>
      <span className="phone-masked">{maskPhone(phone)}</span>
      <button className="copy-phone-button" type="button" onClick={copyPhone} aria-label={`Copy phone number for ${maskPhone(phone)}`}>
        {copied ? "Copied" : "Copy"}
      </button>
    </span>
  );
}
