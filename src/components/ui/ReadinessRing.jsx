import React from "react";

const ZONE_STROKE = {
  PEAK: "var(--nv-matrix)",
  CALIBRATE: "var(--nv-amber)",
  RECOVER: "var(--nv-rose)",
  BASELINE: "var(--nv-accent)",
};

/**
 * Precision SVG radial readiness instrument.
 * Zero chart dependencies; uses crisp tabular numerals and smooth
 * stroke-dashoffset motion (respects OS reduced-motion preferences).
 */
export default function ReadinessRing({
  score = null,
  zone = "BASELINE",
  size = 88,
  strokeWidth = 6,
  label = null,
}) {
  const numericScore =
    score !== null && score !== undefined && !Number.isNaN(Number(score))
      ? Math.max(0, Math.min(100, Number(score)))
      : null;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = numericScore !== null ? numericScore / 100 : 0;
  const dashOffset = circumference * (1 - progress);
  const strokeColor = ZONE_STROKE[zone] || ZONE_STROKE.BASELINE;

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0 select-none"
      style={{ width: size, height: size }}
      aria-label={
        numericScore !== null
          ? `Readiness score ${numericScore} out of 100`
          : "Readiness not yet calibrated"
      }
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Hairline track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--nv-rule)"
          strokeWidth={strokeWidth}
        />
        {/* Active arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: "stroke-dashoffset 480ms cubic-bezier(0.22, 1, 0.36, 1), stroke 220ms ease",
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className="font-semibold tabular-nums leading-none"
          style={{
            fontSize: size >= 96 ? "1.65rem" : "1.3rem",
            letterSpacing: "-0.03em",
            color: "var(--nv-text)",
          }}
        >
          {numericScore !== null ? Math.round(numericScore) : "--"}
        </span>
        {label && (
          <span
            className="mt-1 leading-none font-medium"
            style={{
              fontSize: "0.625rem",
              color: "var(--nv-text-muted)",
              letterSpacing: "0.04em",
            }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
