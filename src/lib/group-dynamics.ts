export type MemberActivity = {
  userId: string;
  name: string;
  /** Done percentage per subject name, 0-100. */
  bySubject: Record<string, number>;
  donePercent: number;
  doneLast7Days: number;
  daysSinceActive: number | null;
};

const BEHIND_GAP = 20;
const INACTIVE_DAYS = 3;

/** Flags members well under the group median or inactive for several days. */
export function findBehind(members: MemberActivity[]) {
  if (members.length < 2) return [];
  const sorted = [...members].map((m) => m.donePercent).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return members
    .map((m) => {
      const reasons: string[] = [];
      if (median - m.donePercent >= BEHIND_GAP) reasons.push(`${m.donePercent}% done vs group median ${median}%`);
      if (m.daysSinceActive === null) reasons.push("no activity yet");
      else if (m.daysSinceActive >= INACTIVE_DAYS) reasons.push(`inactive for ${m.daysSinceActive} days`);
      return { userId: m.userId, name: m.name, reasons };
    })
    .filter((m) => m.reasons.length > 0);
}
