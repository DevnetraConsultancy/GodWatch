import Image from "next/image";
import { cn, initials } from "@/lib/utils";

/** User avatar: Google photo when available, otherwise initials. */
export function Avatar({
  name,
  image,
  size = 32,
  className,
}: {
  name: string;
  image: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-soft font-semibold text-accent-text ring-1 ring-glass-border",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {image ? (
        <Image src={image} alt="" width={size} height={size} className="size-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
    </span>
  );
}
