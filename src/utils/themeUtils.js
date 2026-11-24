// src/utils/themeUtils.js
// Vision-science theme controller supporting 3 ergonomic Solo-Leveling x Matrix modes:
//   - "obsidian"     : Low-halation dark obsidian + Solo-Leveling ice blue + Matrix emerald signals
//   - "matrix-night" : Low-blue circadian night mode for evening/pre-sleep viewing
//   - "daylight"     : Soft high-ambient light mode for gyms & outdoor sunlight

import { getFromStorage, saveToStorage } from "./storageUtils";

export const THEME_STORAGE_KEY = "ui-visual-theme";

export const VISUAL_THEMES = [
  {
    id: "obsidian",
    name: "System Obsidian",
    shortName: "Obsidian",
    description: "Low-halation dark slate with Solo-Leveling ice blue & Matrix emerald accents.",
    bestFor: "Everyday focus & indoor viewing",
  },
  {
    id: "matrix-night",
    name: "Matrix Night",
    shortName: "Night",
    description: "Warm charcoal with reduced short-wavelength blue light & soft phosphor emerald.",
    bestFor: "Evening check-ins & pre-sleep recovery",
  },
  {
    id: "daylight",
    name: "Daylight Clarity",
    shortName: "Daylight",
    description: "Soft glare-free slate paper with crisp dark ink & full System HUD geometry.",
    bestFor: "Bright gyms & outdoor sunlight",
  },
];

export function getSavedTheme() {
  const saved = getFromStorage(THEME_STORAGE_KEY, null);
  if (saved && VISUAL_THEMES.some((t) => t.id === saved)) {
    return saved;
  }
  return "obsidian";
}

export function applyVisualTheme(themeId) {
  const resolved = VISUAL_THEMES.some((t) => t.id === themeId) ? themeId : "obsidian";
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", resolved);
  }
  saveToStorage(THEME_STORAGE_KEY, resolved);
  return resolved;
}

export function cycleVisualTheme(currentThemeId) {
  const idx = VISUAL_THEMES.findIndex((t) => t.id === currentThemeId);
  const next = VISUAL_THEMES[(idx + 1) % VISUAL_THEMES.length];
  return applyVisualTheme(next.id);
}
