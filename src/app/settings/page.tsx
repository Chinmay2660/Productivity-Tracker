"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Copy,
  KeyRound,
  LogOut,
  Monitor,
  Moon,
  Sun,
  Target,
  Timer,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useUser } from "@/components/providers/UserProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import PageHeader from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/StateViews";
import { apiPost, getErrorMessage } from "@/lib/api";
import toast from "react-hot-toast";
import { pickCtcMotivation } from "@/lib/inspiration";
import type { ThemePreference } from "@/types";

const THEMES: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function SettingsGroup({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden !p-0">
      <div className="border-b border-[var(--border)] px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Icon className="h-4 w-4" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">{title}</h2>
            {description && (
              <p className="mt-0.5 text-xs text-[var(--muted)]">{description}</p>
            )}
          </div>
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </Card>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold capitalize text-[var(--foreground)]">{value}</p>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, updateUser, logout } = useUser();
  const { theme, setTheme } = useTheme();
  const [dailyMinutes, setDailyMinutes] = useState(user?.dailyStudyMinutes ?? 120);
  const [targetCtc, setTargetCtc] = useState(user?.targetCtcLpa ?? 0);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (user) {
      setDailyMinutes(user.dailyStudyMinutes);
      setTargetCtc(user.targetCtcLpa ?? 0);
    }
  }, [user]);

  const ctcPreview = useMemo(
    () => (targetCtc > 0 ? pickCtcMotivation(targetCtc) : null),
    [targetCtc]
  );

  const displayCode = newCode ?? null;
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const saveSettings = async () => {
    setSaving(true);
    try {
      await updateUser({
        dailyStudyMinutes: dailyMinutes,
        theme,
        targetCtcLpa: targetCtc > 0 ? targetCtc : undefined,
      });
      setTheme(theme);
      toast.success("Settings saved");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save settings"));
    } finally {
      setSaving(false);
    }
  };

  const regenerateCode = async () => {
    setRegenerating(true);
    try {
      const result = await apiPost<{ authCode: string }>("/api/auth/regenerate-code");
      setNewCode(result.authCode);
      toast.success("New login code generated");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to regenerate code"));
    } finally {
      setRegenerating(false);
    }
  };

  const copyCode = () => {
    if (!displayCode) return;
    navigator.clipboard.writeText(displayCode);
    toast.success("Code copied");
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-8">
      <PageHeader
        title="Settings"
        description="Manage your account, goals, and how the app looks."
        action={
          <Button size="sm" onClick={saveSettings} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        }
      />

      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/8 via-transparent to-transparent"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand text-lg font-bold text-white">
              {initials || "?"}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold text-[var(--foreground)]">{user.name}</p>
              <p className="text-sm text-[var(--muted)]">@{user.username}</p>
              {user.isGuest && (
                <Chip variant="warning" className="mt-2 !px-2 !py-0.5 !text-[10px]">
                  Demo account
                </Chip>
              )}
            </div>
          </div>
          <Link href={`/users/${user._id}`}>
            <Button variant="outline" size="sm">View profile</Button>
          </Link>
        </div>

        <div className="relative mt-4 grid grid-cols-3 gap-2">
          <StatPill label="Level" value={user.preparationLevel} />
          <StatPill label="Streak" value={`${user.studyStreak} days`} />
          <StatPill
            label="Daily goal"
            value={`${Math.floor(dailyMinutes / 60)}h ${dailyMinutes % 60}m`}
          />
        </div>
      </div>

      <SettingsGroup
        icon={KeyRound}
        title="Sign in"
        description="Your 6-digit code for passwordless login on other devices."
      >
        {displayCode ? (
          <div className="rounded-xl border border-brand/30 bg-brand/5 p-4">
            <p className="text-center font-mono text-2xl font-bold tracking-[0.25em] text-brand">
              {displayCode}
            </p>
            <p className="mt-2 text-center text-xs text-[var(--muted)]">
              Save this somewhere safe — your previous code no longer works.
            </p>
            <div className="mt-3 flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={copyCode}>
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Copy
              </Button>
              <Button variant="ghost" size="sm" onClick={regenerateCode} disabled={regenerating}>
                {regenerating ? "Generating…" : "New code"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--muted)]">
              Generate a fresh code if you need to sign in elsewhere or lost yours.
            </p>
            <Button variant="outline" size="sm" onClick={regenerateCode} disabled={regenerating}>
              {regenerating ? "Generating…" : "Generate login code"}
            </Button>
          </div>
        )}
      </SettingsGroup>

      <SettingsGroup
        icon={Monitor}
        title="Appearance"
        description="Choose how the interface looks on this device."
      >
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((t) => {
            const Icon = t.icon;
            const active = theme === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTheme(t.value)}
                className={clsx(
                  "flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-xs font-medium transition-colors",
                  active
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--input-border)] hover:text-[var(--foreground)]"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
                {t.label}
              </button>
            );
          })}
        </div>
      </SettingsGroup>

      <SettingsGroup
        icon={Timer}
        title="Study goal"
        description="How much time you aim to put in each day."
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-3xl font-bold tabular-nums text-brand">
              {Math.floor(dailyMinutes / 60)}
              <span className="text-lg font-semibold">h</span>
              {" "}
              {dailyMinutes % 60}
              <span className="text-lg font-semibold">m</span>
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">per day</p>
          </div>
          <div className="flex gap-1.5">
            {[60, 120, 180, 240].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setDailyMinutes(m)}
                className={clsx(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                  dailyMinutes === m
                    ? "bg-brand text-white"
                    : "bg-[var(--surface-muted)] text-[var(--muted)] hover:text-[var(--foreground)]"
                )}
              >
                {m / 60}h
              </button>
            ))}
          </div>
        </div>
        <input
          type="range"
          min={30}
          max={480}
          step={15}
          value={dailyMinutes}
          onChange={(e) => setDailyMinutes(Number(e.target.value))}
          className="mt-4 w-full accent-brand"
        />
        <div className="mt-1 flex justify-between text-[10px] text-[var(--muted)]">
          <span>30m</span>
          <span>8h</span>
        </div>
      </SettingsGroup>

      <SettingsGroup
        icon={Target}
        title="Salary target"
        description="Optional — powers CTC-themed motivation on your dashboard."
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2">
            <input
              type="number"
              min={0}
              max={200}
              step={0.5}
              value={targetCtc || ""}
              onChange={(e) => setTargetCtc(Number(e.target.value))}
              placeholder="25"
              className="w-16 bg-transparent text-lg font-semibold outline-none"
            />
            <span className="text-sm font-medium text-[var(--muted)]">LPA</span>
          </div>
          {targetCtc > 0 && (
            <p className="text-sm text-[var(--muted)]">
              ≈ ₹{Math.round((targetCtc * 100000) / 12 / 1000)}K/mo before tax
            </p>
          )}
        </div>
        {ctcPreview && (
          <blockquote className="mt-4 rounded-xl border-l-4 border-brand bg-[var(--surface-muted)] px-4 py-3 text-sm italic leading-relaxed text-[var(--foreground)]">
            {ctcPreview.text}
          </blockquote>
        )}
      </SettingsGroup>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="text-[var(--danger)] hover:border-[var(--danger)] hover:bg-[var(--chip-danger-bg)]"
        >
          <LogOut className="mr-1.5 h-3.5 w-3.5" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
