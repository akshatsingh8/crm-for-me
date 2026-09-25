import Image from "next/image";
import brandSpiritLogo from "./brand-spirit-logo.png";

export function BrandCredit() {
  return (
    <span className="brand-credit">
      <span>Powered by</span>
      <span className="brand-credit-logo"><Image src={brandSpiritLogo} alt="" width={32} height={32} /></span>
      <a href="https://brandspiritlabs.com/" target="_blank" rel="noopener noreferrer">BrandSpiritLabs.com</a>
    </span>
  );
}
