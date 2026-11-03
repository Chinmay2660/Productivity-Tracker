"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing, Check } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { apiGet, apiPatch } from "@/lib/api";

type Note = {
  _id: string;
  kind: "cheer" | "nudge";
  fromName: string;
  message?: string;
  emoji?: string;
  createdAt: string;
  read: boolean;
};

function timeAgo(iso: string, now: number) {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function NoteIcon({ note }: { note: Note }) {
  if (note.kind === "cheer") return <span className="text-lg leading-none">{note.emoji ?? "👏"}</span>;
  return <BellRing className="h-4 w-4" aria-hidden />;
}

function describe(note: Note) {
  if (note.kind === "cheer") return `${note.fromName} is cheering for you 🎉`;
  return `${note.fromName} gave you a gentle nudge`;
}

/**
 * Cheers and nudges sent to you. The compact version (dashboard) only
 * appears when something is unread; the full version also keeps the recent ones.
 */
export default function NotesInbox({
  groupId,
  compact = false,
  onUnreadChange,
}: {
  groupId: string;
  compact?: boolean;
  onUnreadChange?: (unread: number) => void;
}) {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [now] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const data = await apiGet<{ items: Note[]; unread: number }>(`/api/group-notes?groupId=${groupId}`);
      setNotes(data.items);
      onUnreadChange?.(data.unread);
    } catch {
      setNotes([]);
    }
  }, [groupId, onUnreadChange]);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async (ids?: string[]) => {
    // Update the screen first; the request only records it.
    setNotes((prev) => prev?.map((n) => (!ids || ids.includes(n._id) ? { ...n, read: true } : n)) ?? prev);
    try {
      await apiPatch("/api/group-notes", { groupId, ids });
      onUnreadChange?.(
        (notes ?? []).filter((n) => !n.read && ids && !ids.includes(n._id)).length
      );
    } catch {
      void load();
    }
  };

  if (!notes) return null;
  const unread = notes.filter((n) => !n.read);
  const shown = compact ? unread : notes.slice(0, 6);
  if (shown.length === 0) return compact ? null : (
    <Card>
      <CardHeader title="For you" subtitle="Cheers and nudges from your teammates land here." />
      <p className="text-sm text-[var(--muted)]">Nothing yet. A cheer from a teammate will show up here.</p>
    </Card>
  );

  return (
    <Card className={compact ? "border border-brand/30 bg-brand/5" : undefined}>
      <CardHeader
        title={compact ? "Your team's got your back" : "For you"}
        subtitle={unread.length ? `${unread.length} new` : "All caught up"}
        action={
          unread.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => void markRead()}>
              <Check className="mr-1 h-3.5 w-3.5" aria-hidden /> Mark all read
            </Button>
          ) : undefined
        }
      />
      <ul className="space-y-2">
        {shown.map((n) => (
          <li
            key={n._id}
            className={`flex items-start gap-3 rounded-xl p-3 ${
              n.read ? "bg-[var(--surface-muted)] opacity-70" : "bg-[var(--surface-muted)] ring-1 ring-brand/25"
            }`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
              <NoteIcon note={n} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{describe(n)}</p>
              {n.message && <p className="mt-0.5 text-sm text-[var(--muted)]">{n.message}</p>}
              <p className="mt-1 text-[11px] text-[var(--muted)]">{timeAgo(n.createdAt, now)}</p>
            </div>
            {!n.read && (
              <button
                type="button"
                onClick={() => void markRead([n._id])}
                className="shrink-0 rounded-md p-1.5 text-[var(--muted)] hover:bg-[var(--card)] hover:text-[var(--foreground)]"
                aria-label="Mark as read"
              >
                <Check className="h-4 w-4" aria-hidden />
              </button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
