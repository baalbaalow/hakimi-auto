import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/brand";

type BrandLogoProps = {
  href?: string;
  priority?: boolean;
  className?: string;
};

export function BrandLogo({
  href = "/",
  priority = false,
  className = "",
}: BrandLogoProps) {
  const logo = (
    <Image
      src={brand.logoPath}
      alt={`${brand.name} logo`}
      width={190}
      height={48}
      priority={priority}
      className={`h-8 w-auto ${className}`.trim()}
    />
  );

  if (!href) {
    return logo;
  }

  return (
    <Link href={href} aria-label={`${brand.name} home`} className="focus-ring rounded-[var(--radius-sm)]">
      {logo}
    </Link>
  );
}
