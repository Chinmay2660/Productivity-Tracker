export function getCareerFlowApiUrl(): string {
  return (
    process.env.CAREERFLOW_API_URL ||
    process.env.JOB_TRACKER_API_URL ||
    "http://localhost:8000"
  );
}

export function getCareerFlowAppUrl(): string {
  return (
    process.env.CAREERFLOW_URL ||
    process.env.JOB_TRACKER_URL ||
    "http://localhost:3000"
  );
}

export function getGrowthHubUrl(): string {
  return (
    process.env.GROWTHHUB_URL ||
    process.env.SWITCH_PREP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:4000"
  );
}

export function googleAuthUrl(returnTo?: string): string {
  const base = `${getCareerFlowApiUrl()}/auth/google`;
  const target = returnTo || `${getGrowthHubUrl()}/api/auth/sso-callback`;
  return `${base}?returnTo=${encodeURIComponent(target)}`;
}

export async function createCareerFlowSsoUrl(): Promise<string> {
  const apiUrl = getCareerFlowApiUrl();
  const growthHubUrl = getGrowthHubUrl();
  try {
    const res = await fetch(`${apiUrl}/auth/sso-session`, { credentials: "include" });
    if (res.ok) {
      const body = await res.json();
      if (body.session) {
        return `${growthHubUrl}/api/auth/sso-callback?session=${encodeURIComponent(body.session)}`;
      }
    }
  } catch {
    // fall through
  }
  return `${apiUrl.replace(/\/$/, "")}/auth/google?returnTo=${encodeURIComponent(`${growthHubUrl}/api/auth/sso-callback`)}`;
}
