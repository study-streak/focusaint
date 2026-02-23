"use client";

import { useEffect, useMemo, useState } from "react";

type HabitItem = {
  id: string;
  name: string;
  minutes: number;
  videoUrl?: string;
};

type HabitPlan = {
  createdAt: number;
  activeIndex: number;
  isRunning: boolean;
  startedAt?: number;
  habits: HabitItem[];
};

function toEmbedUrl(url?: string) {
  if (!url) return "";
  
  try {
    const u = new URL(url);
    let id = "";
    
    // Handle youtu.be short links
    if (u.hostname.includes("youtu.be")) {
      id = u.pathname.substring(1); // Remove leading slash
      // Remove query parameters from ID
      id = id.split("?")[0];
    }
    // Handle youtube.com links
    else if (u.hostname.includes("youtube.com")) {
      id = u.searchParams.get("v") || "";
    }
    
    // Validate video ID (11 characters, alphanumeric + dash + underscore)
    if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
      return `https://www.youtube.com/embed/${id}?modestbranding=1&rel=0`;
    }
  } catch (err) {
    console.error("URL parsing error:", err, url);
  }
  return "";
}

function formatTime(seconds: number) {
  const safe = Math.max(0, seconds);
  const mins = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const secs = (safe % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function getRemainingSeconds(minutes: number, startedAt?: number) {
  const totalSeconds = Math.max(1, Math.floor(minutes * 60));
  if (!startedAt) return totalSeconds;
  const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
  return Math.max(0, totalSeconds - elapsedSeconds);
}

export default function FocusMode() {
  const [plan, setPlan] = useState<HabitPlan | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("habitPlan");
    if (raw) setPlan(JSON.parse(raw));
  }, []);

  const current = useMemo(() => {
    if (!plan) return null;
    return plan.habits[plan.activeIndex] ?? null;
  }, [plan]);

  useEffect(() => {
    if (!plan || !current) return;

    if (plan.isRunning) {
      setSecondsLeft(getRemainingSeconds(current.minutes, plan.startedAt));
      return;
    }

    setSecondsLeft(Math.max(1, Math.floor(current.minutes * 60)));
  }, [plan, current]);

  const start = () => {
    if (!plan) return;
    const next = completed
      ? { ...plan, activeIndex: 0, isRunning: true, startedAt: Date.now() }
      : { ...plan, isRunning: true, startedAt: Date.now() };
    setPlan(next);
    localStorage.setItem("habitPlan", JSON.stringify(next));
    setCompleted(false);
  };

  const nextHabit = () => {
    if (!plan) return;

    if (plan.activeIndex >= plan.habits.length - 1) {
      const finished = { ...plan, isRunning: false };
      setPlan(finished);
      localStorage.setItem("habitPlan", JSON.stringify(finished));
      setCompleted(true);
      return;
    }

    const next = {
      ...plan,
      activeIndex: plan.activeIndex + 1,
      startedAt: Date.now(),
      isRunning: true,
    };
    setPlan(next);
    localStorage.setItem("habitPlan", JSON.stringify(next));
  };

  useEffect(() => {
    if (!plan || !current || !plan.isRunning || completed) return;

    const interval = window.setInterval(() => {
      const remaining = getRemainingSeconds(current.minutes, plan.startedAt);
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        nextHabit();
      }
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [plan, current, completed]);

  const stop = () => {
    localStorage.removeItem("habitPlan");
    setPlan(null);
  };

  if (!plan || !current) {
    return (
      <div className="rounded-md border p-4">
        <h3 className="font-semibold">Focus Mode</h3>
        <p className="text-sm text-gray-600">No habit plan found. Start from Session Tracker.</p>
      </div>
    );
  }

  const embed = toEmbedUrl(current.videoUrl);

  return (
    <div className="rounded-md border p-4">
      <h3 className="text-lg font-semibold">Focus Mode</h3>
      <p className="mt-1 text-sm">
        Current: <b>{current.name}</b> ({current.minutes} min)
      </p>
      <p className="mt-2 text-sm font-semibold text-indigo-700">
        Time Left: {formatTime(secondsLeft)}
      </p>

      {completed && (
        <p className="mt-2 text-sm font-semibold text-green-700">Great work! You completed all habits.</p>
      )}

      {embed ? (
        <div className="mt-4 aspect-video w-full overflow-hidden rounded-md border bg-black">
          <iframe
            src={embed}
            title="Study Video"
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      ) : current.videoUrl ? (
        <div className="mt-4 p-3 rounded-md bg-yellow-50 border border-yellow-200">
          <p className="text-sm text-yellow-800">⚠ Invalid or unsupported video URL: {current.videoUrl}</p>
          <p className="text-xs text-yellow-700 mt-1">Use a standard YouTube URL (youtube.com/watch?v=ID or youtu.be/ID)</p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-gray-600">📹 No video URL for this habit.</p>
      )}

      <div className="mt-4 flex gap-2">
        {!plan.isRunning ? (
          <button onClick={start} className="rounded-md bg-green-600 px-3 py-2 text-white" type="button">
            {completed ? "Restart" : "Start"}
          </button>
        ) : (
          <button onClick={nextHabit} className="rounded-md bg-blue-600 px-3 py-2 text-white" type="button">
            Next Habit
          </button>
        )}
        <button onClick={stop} className="rounded-md bg-gray-700 px-3 py-2 text-white" type="button">
          Stop
        </button>
      </div>
    </div>
  );
}
