/**
 * Achievement badge definitions and unlock rules.
 * `icon` names a Lucide icon; the UI maps it to the component.
 */

export type AchievementCriteriaType =
  | "TOTAL_COMPLETED"
  | "CURRENT_STREAK_DAYS"
  | "LONGEST_STREAK_DAYS"
  | "PERFECT_DAYS";

export interface AchievementCriteria {
  type: AchievementCriteriaType;
  value: number;
}

export interface AchievementDefinition {
  key: string;
  name: string;
  description: string;
  icon: AchievementIcon;
  criteria: AchievementCriteria;
}

export type AchievementIcon =
  | "footprints"
  | "flame"
  | "zap"
  | "rocket"
  | "crown"
  | "shield"
  | "medal"
  | "cpu"
  | "star"
  | "gem";

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    key: "first_step",
    name: "First Step",
    description: "Complete your first task.",
    icon: "footprints",
    criteria: { type: "TOTAL_COMPLETED", value: 1 },
  },
  {
    key: "streak_3",
    name: "Spark",
    description: "Reach a 3-day streak.",
    icon: "flame",
    criteria: { type: "CURRENT_STREAK_DAYS", value: 3 },
  },
  {
    key: "streak_7",
    name: "Week Warrior",
    description: "Reach a 7-day streak.",
    icon: "zap",
    criteria: { type: "CURRENT_STREAK_DAYS", value: 7 },
  },
  {
    key: "streak_30",
    name: "Unstoppable",
    description: "Reach a 30-day streak.",
    icon: "rocket",
    criteria: { type: "CURRENT_STREAK_DAYS", value: 30 },
  },
  {
    key: "streak_100",
    name: "Legendary",
    description: "Reach a 100-day streak.",
    icon: "crown",
    criteria: { type: "CURRENT_STREAK_DAYS", value: 100 },
  },
  {
    key: "streak_longest_30",
    name: "Iron Will",
    description: "Achieve a longest streak of 30 days.",
    icon: "shield",
    criteria: { type: "LONGEST_STREAK_DAYS", value: 30 },
  },
  {
    key: "total_100",
    name: "Century",
    description: "Complete 100 tasks in total.",
    icon: "medal",
    criteria: { type: "TOTAL_COMPLETED", value: 100 },
  },
  {
    key: "total_500",
    name: "Machine",
    description: "Complete 500 tasks in total.",
    icon: "cpu",
    criteria: { type: "TOTAL_COMPLETED", value: 500 },
  },
  {
    key: "perfect_day",
    name: "Perfect Day",
    description: "Complete every task for a single day.",
    icon: "star",
    criteria: { type: "PERFECT_DAYS", value: 1 },
  },
  {
    key: "perfect_week",
    name: "Flawless Week",
    description: "Complete every task for 7 consecutive days.",
    icon: "gem",
    criteria: { type: "LONGEST_STREAK_DAYS", value: 7 },
  },
];

export interface AchievementInputs {
  totalCompleted: number;
  currentStreak: number;
  longestStreak: number;
  perfectDays: number;
}

export function meetsCriteria(criteria: AchievementCriteria, s: AchievementInputs): boolean {
  switch (criteria.type) {
    case "TOTAL_COMPLETED":
      return s.totalCompleted >= criteria.value;
    case "CURRENT_STREAK_DAYS":
      return s.currentStreak >= criteria.value;
    case "LONGEST_STREAK_DAYS":
      return s.longestStreak >= criteria.value;
    case "PERFECT_DAYS":
      return s.perfectDays >= criteria.value;
  }
}

/** Keys of every definition whose criteria are met. */
export function earnedAchievementKeys(
  inputs: AchievementInputs,
  definitions: AchievementDefinition[] = ACHIEVEMENT_DEFINITIONS
): string[] {
  return definitions.filter((d) => meetsCriteria(d.criteria, inputs)).map((d) => d.key);
}
