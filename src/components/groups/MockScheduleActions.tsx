"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, BellRing, CalendarPlus } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";

const HOUR = 3_600_000;
const STORAGE_KEY = "mock-reminders-enabled";

/** Opens Google Calendar's "new event" screen prefilled with the mock time. */
function googleCalendarUrl(mockDate: string) {
  const start = new Date(mockDate);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "GrowthHub mock interview",
    dates: `${fmt(start)}/${fmt(new Date(start.getTime() + HOUR))}`,
    details: "Group mock interview round. Open GrowthHub to generate questions and score peers.",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** "Add to calendar" redirect plus an in-browser reminder (works while GrowthHub is open in a tab). */
export default function MockScheduleActions({ mockDate }: { mockDate?: string | null }) {
  const [enabled, setEnabled] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      setEnabled(
        localStorage.getItem(STORAGE_KEY) === "1" &&
          typeof Notification !== "undefined" &&
          Notification.permission === "granted"
      );
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!enabled || !mockDate) return;
    const start = new Date(mockDate).getTime();
    if (start < Date.now()) return;
    timer.current = setTimeout(
      () => {
        new Notification("Mock interview soon", {
          body: `Your group mock starts at ${new Date(start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
        });
      },
      Math.max(0, start - HOUR - Date.now())
    );
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [enabled, mockDate]);

  const toggle = async () => {
    if (enabled) {
      setEnabled(false);
      try {
        localStorage.setItem(STORAGE_KEY, "0");
      } catch {
        /* storage unavailable */
      }
      toast("Reminder turned off");
      return;
    }
    if (typeof Notification === "undefined") {
      toast.error("This browser doesn't support notifications");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast.error("Notifications are blocked for this site");
      return;
    }
    setEnabled(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* storage unavailable */
    }
    toast.success("You'll get a reminder 1 hour before (keep this tab open)");
  };

  if (!mockDate) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={googleCalendarUrl(mockDate)} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="sm" type="button">
          <CalendarPlus className="mr-1.5 h-4 w-4" aria-hidden /> Add to calendar
        </Button>
      </a>
      {/* Filled brand colour = on, plain outline = off. */}
      <Button
        variant={enabled ? "primary" : "outline"}
        size="sm"
        type="button"
        aria-pressed={enabled}
        onClick={() => void toggle()}
      >
        {enabled ? (
          <BellRing className="mr-1.5 h-4 w-4" aria-hidden />
        ) : (
          <Bell className="mr-1.5 h-4 w-4" aria-hidden />
        )}
        {enabled ? "Reminder on" : "Remind me 1h before"}
      </Button>
    </div>
  );
}
