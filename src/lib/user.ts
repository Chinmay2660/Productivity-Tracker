import type { User } from "@/types";

/** Apply GrowthHub defaults for fields missing on shared-platform users (e.g. CareerFlow). */
export function normalizeUser(doc: unknown): User {
  const raw =
    doc && typeof doc === "object" && "toObject" in doc && typeof (doc as { toObject: () => unknown }).toObject === "function"
      ? (doc as { toObject: () => unknown }).toObject()
      : doc;
  const u = { ...(raw as Record<string, unknown>), _id: String((raw as { _id: unknown })._id) } as Partial<User> & { _id: string };
  return {
    _id: u._id,
    username: u.username,
    name: u.name ?? "User",
    email: u.email,
    avatar: u.avatar,
    googleId: u.googleId,
    onboardingComplete: u.onboardingComplete ?? false,
    preparationLevel: u.preparationLevel ?? "intermediate",
    dailyStudyMinutes: u.dailyStudyMinutes ?? 120,
    activeGroupId: u.activeGroupId,
    theme: u.theme ?? "system",
    studyStreak: u.studyStreak ?? 0,
    lastStudyDate: u.lastStudyDate,
    targetCtcLpa: u.targetCtcLpa,
    isGuest: u.isGuest ?? false,
    createdAt: u.createdAt ?? new Date().toISOString(),
    updatedAt: u.updatedAt ?? new Date().toISOString(),
  };
}
