import React from "react";

/**
 * Vision-safe Solo-Leveling × Matrix atmospheric backdrop.
 * Replaces eye-fatiguing full-screen CRT scanlines with a calm radial depth aura
 * and a soft top-edge dot horizon that never crosses body text.
 */
export default function ScanlineEffect() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 system-ambient-backdrop" />
      <div className="absolute top-0 left-0 right-0 h-44 system-dot-horizon opacity-60" />
    </div>
  );
}
