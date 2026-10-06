import type { User } from "@/types";

export function getHomePath(user: Pick<User, "onboardingComplete">): string {
  if (!user.onboardingComplete) return "/onboarding";
  return "/dashboard";
}
