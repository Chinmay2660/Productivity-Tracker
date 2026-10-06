"use client";

import type { MemberGamificationStat } from "@/types";

const RANK_STYLES = ["text-amber-500", "text-stone-400", "text-orange-700"];

export default function GroupLeaderboardChart({
  members,
  maxPoints,
}: {
  members: MemberGamificationStat[];
  maxPoints: number;
}) {
  if (members.length === 0) {
    return <p className="text-sm text-[var(--muted)]">No points yet — complete group questions on time.</p>;
  }

  const scale = Math.max(maxPoints, 1);

  return (
    <div className="space-y-2.5">
      {members.map((member, index) => (
        <div key={member.userId}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`w-5 shrink-0 text-center text-xs font-bold ${
                  RANK_STYLES[index] ?? "text-[var(--muted)]"
                }`}
              >
                {index + 1}
              </span>
              <span className="truncate font-medium">{member.name}</span>
            </div>
            <span className="shrink-0 font-semibold text-brand">{member.totalPoints} pts</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand/80 to-brand transition-all"
              style={{ width: `${(member.totalPoints / scale) * 100}%` }}
            />
          </div>
          <p className="mt-0.5 text-[10px] text-[var(--muted)]">
            {member.perfect} on-time · {member.good} next-day · {member.pending} pending
          </p>
        </div>
      ))}
    </div>
  );
}
