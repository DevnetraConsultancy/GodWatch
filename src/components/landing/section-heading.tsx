import { cn } from "@/lib/utils";
import { Reveal } from "@/components/landing/reveal";

interface SectionHeadingProps {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  align?: "center" | "left";
  className?: string;
}

/**
 * Centered section header: pill eyebrow → display title → muted description.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <Reveal
      className={cn(
        "mx-auto max-w-3xl",
        centered ? "text-center" : "text-left",
        className
      )}
    >
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur",
          centered && "mx-auto"
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
        {eyebrow}
      </span>

      <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
        {title}
      </h2>

      {description ? (
        <p
          className={cn(
            "mt-4 text-balance text-base leading-relaxed text-muted-foreground sm:text-lg",
            centered ? "mx-auto max-w-2xl" : "max-w-2xl"
          )}
        >
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}
