import React from "react";

/**
 * Subtle tonal atmosphere for NeoVitru.
 * Pure low-contrast zenith lighting with zero scanlines, zero dot grids,
 * and zero visual interference over typography.
 */
export default function ScanlineEffect() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute inset-0 system-ambient-backdrop" />
    </div>
  );
}
