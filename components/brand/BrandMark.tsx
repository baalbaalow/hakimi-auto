import Image from "next/image";
import { brand } from "@/lib/brand";

type BrandMarkProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export function BrandMark({
  size = 32,
  className = "",
  priority = false,
}: BrandMarkProps) {
  return (
    <Image
      src={brand.markPath}
      alt=""
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  );
}
