import { Cpu, Crown, Flame, Footprints, Gem, Lock, Medal, Rocket, Shield, Star, Zap, type LucideIcon } from "lucide-react";
import type { AchievementIcon } from "@/lib/achievements";
import type { AchievementDTO } from "@/types/dto";
import { cn } from "@/lib/utils";

const ICONS: Record<AchievementIcon, LucideIcon> = {
  footprints: Footprints,
  flame: Flame,
  zap: Zap,
  rocket: Rocket,
  crown: Crown,
  shield: Shield,
  medal: Medal,
  cpu: Cpu,
  star: Star,
  gem: Gem,
};

export function AchievementGrid({ achievements, timeZone }: { achievements: AchievementDTO[]; timeZone: string }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {achievements.map((a) => {
        const Icon = ICONS[a.icon] ?? Star;
        const unlocked = a.unlockedAt !== null;
        return (
          <li
            key={a.key}
            className={cn(
              "flex flex-col gap-2 rounded-lg border p-3 transition-colors",
              unlocked ? "border-transparent bg-accent-soft" : "border-dashed border-line"
            )}
          >
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-md",
                unlocked ? "bg-accent text-accent-fg" : "bg-glass-hover text-fg-subtle"
              )}
            >
              {unlocked ? <Icon className="size-5" aria-hidden /> : <Lock className="size-4" aria-hidden />}
            </span>
            <div>
              <p className="text-sm font-semibold">{a.name}</p>
              <p className="text-xs text-fg-muted">{a.description}</p>
              <p className="mt-1 text-xs font-medium text-fg-subtle">
                {unlocked
                  ? `Unlocked ${new Date(a.unlockedAt!).toLocaleDateString("en-US", { timeZone, month: "short", day: "numeric", year: "numeric" })}`
                  : "Locked"}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
