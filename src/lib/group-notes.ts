/** Shared by the API (validation) and the UI (pickers), so the two can't drift apart. */

export const NOTE_KINDS = ["cheer", "nudge"] as const;
export type NoteKind = (typeof NOTE_KINDS)[number];

export const CHEER_EMOJIS = ["👏", "🔥", "💪", "🎉"] as const;

export const NUDGE_PRESETS = [
  "Hey! A quick 10-minute session today would keep the team streak alive.",
  "We miss you in the leaderboard. Want to knock out one question together?",
  "No pressure, just checking in. Anything blocking you that we can help with?",
  "Small steps count. Pick one easy question and mark it done today.",
] as const;

export const NOTE_MAX_LENGTH = 160;

/** One note of each kind per sender and recipient per this window. */
export const NOTE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/** Each member is asked to complete this many questions per week. */
export const WEEKLY_GOAL_PER_MEMBER = 5;
