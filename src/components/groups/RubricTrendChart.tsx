"use client";

import { useEffect, useState } from "react";
import Card, { CardHeader } from "@/components/ui/Card";
import { apiGet } from "@/lib/api";

type Point = {
  roundNumber: number;
  score: number | null;
  reviewers: number;
  rubric: Record<string, number | null>;
};

const DIMENSIONS = [
  { key: "communication", color: "#6366f1" },
  { key: "correctness", color: "#10b981" },
  { key: "depth", color: "#f59e0b" },
  { key: "confidence", color: "#ec4899" },
];

const W = 320;
const H = 140;
const PAD = 24;

export default function RubricTrendChart({ groupId }: { groupId: string }) {
  const [points, setPoints] = useState<Point[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ points: Point[] }>(`/api/mock-interviews/trends?groupId=${groupId}`)
      .then((d) => !cancelled && setPoints(d.points))
      .catch(() => !cancelled && setPoints([]));
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  if (points === null) return null;

  const x = (i: number) => (points.length === 1 ? W / 2 : PAD + (i * (W - PAD * 2)) / (points.length - 1));
  const y = (v: number) => H - PAD - ((v - 1) / 4) * (H - PAD * 2);

  return (
    <Card>
      <CardHeader
        title="Your feedback trend"
        subtitle="Average peer rating per round (1–5). Are you improving?"
      />
      {points.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Ratings from peers will chart here after your first mock.</p>
      ) : (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Rubric ratings by round">
            {[1, 2, 3, 4, 5].map((v) => (
              <g key={v}>
                <line x1={PAD} x2={W - PAD} y1={y(v)} y2={y(v)} stroke="currentColor" opacity={0.1} />
                <text x={6} y={y(v) + 3} fontSize={8} fill="currentColor" opacity={0.5}>
                  {v}
                </text>
              </g>
            ))}
            {DIMENSIONS.map((d) => {
              const pts = points
                .map((p, i) => (p.rubric[d.key] != null ? ([x(i), y(p.rubric[d.key] as number)] as const) : null))
                .filter((p): p is readonly [number, number] => p !== null);
              return (
                <g key={d.key}>
                  {pts.length > 1 && (
                    <polyline fill="none" stroke={d.color} strokeWidth={2} points={pts.map((p) => p.join(",")).join(" ")} />
                  )}
                  {pts.map(([px, py], i) => (
                    <circle key={i} cx={px} cy={py} r={3} fill={d.color} />
                  ))}
                </g>
              );
            })}
            {points.map((p, i) => (
              <text key={p.roundNumber} x={x(i)} y={H - 6} fontSize={8} textAnchor="middle" fill="currentColor" opacity={0.6}>
                R{p.roundNumber}
              </text>
            ))}
          </svg>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {DIMENSIONS.map((d) => (
              <li key={d.key} className="flex items-center gap-1.5 capitalize">
                <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                {d.key}
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
