export type MemberActivity = {
  userId: string;
  name: string;
  /** Done percentage per subject name, 0-100. */
  bySubject: Record<string, number>;
  donePercent: number;
  doneLast7Days: number;
  daysSinceActive: number | null;
};

export type Pairing = { subject: string; learnerId: string; mentorId: string; gap: number };

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

/** For each member, pairs their weakest subject with the member strongest in it (gap of 30+ points). */
export function suggestPairings(members: MemberActivity[]): Pairing[] {
  const pairings: Pairing[] = [];
  for (const learner of members) {
    let best: Pairing | null = null;
    for (const [subject, pct] of Object.entries(learner.bySubject)) {
      for (const mentor of members) {
        if (mentor.userId === learner.userId) continue;
        const gap = (mentor.bySubject[subject] ?? 0) - pct;
        if (gap >= 30 && (!best || gap > best.gap)) {
          best = { subject, learnerId: learner.userId, mentorId: mentor.userId, gap };
        }
      }
    }
    if (best) pairings.push(best);
  }
  return pairings;
}
