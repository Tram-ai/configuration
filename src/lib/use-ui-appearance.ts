"use client";

import { useEffect, useState } from "react";

export type UiAppearance = "light" | "dark";

const UI_APPEARANCE_STORAGE_KEY = "tram-init-web-appearance";

export function useUiAppearance() {
  const [appearance, setAppearance] = useState<UiAppearance>("light");
  const [appearanceInitialized, setAppearanceInitialized] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedAppearance = window.localStorage.getItem(UI_APPEARANCE_STORAGE_KEY);
    if (savedAppearance === "light" || savedAppearance === "dark") {
      setAppearance(savedAppearance);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setAppearance("dark");
    }

    setAppearanceInitialized(true);
  }, []);

  useEffect(() => {
    if (!appearanceInitialized || typeof window === "undefined") {
      return;
    }

    const root = document.documentElement;
    root.dataset.uiAppearance = appearance;
    root.style.colorScheme = appearance;
    window.localStorage.setItem(UI_APPEARANCE_STORAGE_KEY, appearance);
  }, [appearance, appearanceInitialized]);

  return {
    appearance,
    appearanceInitialized,
    setAppearance,
  };
}