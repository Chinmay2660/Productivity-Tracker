"use client";

import { useEffect, useState } from "react";
import Card, { CardHeader } from "@/components/ui/Card";
import { apiGet } from "@/lib/api";

type Dynamics = {
  isAdmin: boolean;
  partner: { subject: string; partnerName: string; gap: number } | null;
  behind: { userId: string; name: string; reasons: string[] }[];
  groupDonePercent: number;
  weeklyActive: number;
  memberCount: number;
};

export default function GroupDynamicsPanel({ groupId }: { groupId: string }) {
  const [data, setData] = useState<Dynamics | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<Dynamics>(`/api/group-dynamics?groupId=${groupId}`)
      .then((d) => !cancelled && setData(d))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  if (!data) return null;

  return (
    <Card>
      <CardHeader
        title="Group momentum"
        subtitle={`${data.weeklyActive} of ${data.memberCount} members practised this week · group avg ${data.groupDonePercent}% done`}
      />
      <div className="space-y-4">
        <div className="rounded-lg bg-[var(--surface-muted)] p-3 text-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">Your study partner</p>
          {data.partner ? (
            <p className="mt-1">
              Pair up with <span className="font-semibold">{data.partner.partnerName}</span> on{" "}
              <span className="font-semibold">{data.partner.subject}</span> — they&apos;re {data.partner.gap} points
              ahead of you there.
            </p>
          ) : (
            <p className="mt-1 text-[var(--muted)]">No clear gap right now. Keep going and check back.</p>
          )}
        </div>

        {data.isAdmin && (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
              Needs a nudge (admins only)
            </p>
            {data.behind.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Everyone is on pace.</p>
            ) : (
              <ul className="space-y-1.5">
                {data.behind.map((m) => (
                  <li key={m.userId} className="flex flex-wrap justify-between gap-x-3 text-sm">
                    <span className="font-medium">{m.name}</span>
                    <span className="text-xs text-[var(--muted)]">{m.reasons.join(" · ")}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
