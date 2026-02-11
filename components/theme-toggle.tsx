"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "idea-vault-theme";
type ThemeMode = "day" | "night";

function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", mode);
}

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("day");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = (window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? "day";
    const initialMode: ThemeMode = stored === "night" ? "night" : "day";
    setMode(initialMode);
    applyTheme(initialMode);
    setIsReady(true);
  }, []);

  function onToggle() {
    const nextMode: ThemeMode = mode === "day" ? "night" : "day";
    setMode(nextMode);
    window.localStorage.setItem(STORAGE_KEY, nextMode);
    applyTheme(nextMode);
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${mode === "day" ? "night" : "day"} mode`}
      title={`Switch to ${mode === "day" ? "night" : "day"} mode`}
      disabled={!isReady}
    >
      <span className="theme-toggle-track">
        <span className="theme-toggle-icon sun" aria-hidden>
          ☀
        </span>
        <span className="theme-toggle-icon moon" aria-hidden>
          ☾
        </span>
        <span className={`theme-toggle-knob ${mode === "night" ? "is-night" : ""}`} />
      </span>
    </button>
  );
}
