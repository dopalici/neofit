// src/components/dashboard/AerobicGoalAnalyzer.jsx
// Hallmark Sport-inspired Apple Health Aerobic & Cardio Goal Results Sheet.
// Shows exact quantitative distance to cardio goals + FitLib-grounded next actions.

import React from "react";
import {
  AlertTriangle,
  BookOpen,
  HeartPulse,
  Sparkles,
  Upload,
} from "lucide-react";
import {
  AEROBIC_GOAL_PRESETS,
  formatPace,
} from "../../services/aerobicGoalService";

const PRIORITY_COLOR = {
  URGENT: "var(--nv-rose)",
  HIGH: "var(--nv-amber)",
  MEDIUM: "var(--nv-accent)",
  LOW: "var(--nv-matrix)",
};

const ACWR_COLOR = {
  "SWEET SPOT": "var(--nv-matrix)",
  "BUILDING BASE": "var(--nv-accent)",
  "HIGH RAMP": "var(--nv-amber)",
  "SPIKE RISK": "var(--nv-rose)",
  DETRAINING: "var(--nv-amber)",
  "NO DATA": "var(--nv-text-muted)",
};

const ZONE_COLOR = {
  easy: "var(--nv-matrix)",
  moderate: "var(--nv-amber)",
  hard: "var(--nv-rose)",
};

export default function AerobicGoalAnalyzer({
  analysis,
  selectedGoalId,
  onSelectGoal,
  onOpenKnowledgeNote,
  onAskCoach,
  onOpenHealthImport,
  onOpenWorkouts,
}) {
  if (!analysis) return null;

  const {
    goal,
    hasCardioData,
    overallGoalReadinessPct,
    vo2,
    pace,
    volume,
    intensity,
    recommendations,
    recentCardioWorkouts,
  } = analysis;

  const acwrColor = ACWR_COLOR[volume.acwrStatus] || ACWR_COLOR["NO DATA"];

  const buildGapHeadline = () => {
    if (!hasCardioData) {
      return "Sync Apple Health workouts or log a cardio run to calculate your exact distance to goal.";
    }
    const parts = [];
    if (vo2.gap !== null) {
      parts.push(
        vo2.gap > 0
          ? `${vo2.gap} ml/kg/min VO2 max to gain`
          : `VO2 max target met (${vo2.current})`
      );
    }
    if (pace.gapMinPerKm !== null) {
      parts.push(
        pace.gapMinPerKm > 0
          ? `${formatPace(pace.gapMinPerKm).replace(" /km", "")}/km faster pace needed`
          : `Target pace met (${pace.currentFormatted})`
      );
    }
    if (volume.gapMinutes > 0) {
      parts.push(`+${volume.gapMinutes} min/wk aerobic volume needed`);
    } else if (volume.effectiveWeeklyMinutes > 0) {
      parts.push(`Weekly volume target met (${volume.effectiveWeeklyMinutes} m/wk)`);
    }
    return parts.join(" · ");
  };

  return (
    <section
      className="system-window rounded-xl p-5 sm:p-6 space-y-6"
      aria-label="Apple Health Aerobic & Cardio Goal Analyzer"
    >
      {/* Header + Preset Switcher */}
      <div className="flex flex-col gap-4 pb-5 nv-rule-bottom">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <HeartPulse size={16} style={{ color: "var(--nv-accent)" }} className="shrink-0" aria-hidden="true" />
            <h2
              className="text-sm font-semibold tracking-tight"
              style={{ color: "var(--nv-text)" }}
            >
              APPLE HEALTH AEROBIC & CARDIO GOAL ENGINE
            </h2>
          </div>
          <span
            className="text-xs font-mono font-medium tabular-nums shrink-0"
            style={{ color: acwrColor }}
          >
            Load: {volume.acwr ? `${volume.acwr}× ` : ""}
            {volume.acwrStatus}
          </span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <p className="text-xs" style={{ color: "var(--nv-text-secondary)" }}>
            {buildGapHeadline()}
          </p>

          {/* Single-row Goal Preset Switcher */}
          <div className="flex flex-wrap gap-1.5 shrink-0" role="tablist" aria-label="Aerobic goal target">
            {AEROBIC_GOAL_PRESETS.map((preset) => {
              const active = preset.id === selectedGoalId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onSelectGoal && onSelectGoal(preset.id)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-colors"
                  style={{
                    backgroundColor: active
                      ? "var(--nv-accent)"
                      : "var(--nv-surface-subtle)",
                    borderColor: active ? "var(--nv-accent)" : "var(--nv-rule)",
                    color: active ? "var(--nv-accent-ink)" : "var(--nv-text-secondary)",
                  }}
                >
                  {preset.shortName}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Benchmark Readiness Rail */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold" style={{ color: "var(--nv-text)" }}>
              {goal.name}
            </h3>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--nv-text-secondary)" }}>
              {goal.description}
            </p>
          </div>
          <div className="text-right">
            <span
              className="nv-figure text-3xl sm:text-4xl font-semibold"
              style={{ color: "var(--nv-accent)" }}
            >
              {overallGoalReadinessPct}%
            </span>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--nv-text-muted)" }}>
              Goal readiness
            </p>
          </div>
        </div>
        <div
          className="h-2 w-full rounded-full overflow-hidden"
          style={{ backgroundColor: "var(--nv-surface-2)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(hasCardioData ? 5 : 0, overallGoalReadinessPct)}%`,
              backgroundColor: "var(--nv-accent)",
            }}
          />
        </div>
      </div>

      {/* 4 Quantitative Aerobic Gap Pillars — Ruled Olympic Timing Sheet */}
      <div
        className="nv-rule-bar pt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x gap-y-5 sm:gap-5 lg:gap-0"
        style={{ borderColor: "var(--nv-rule)" }}
      >
        {/* Pillar 1: VO2 Max */}
        <div className="lg:pr-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium" style={{ color: "var(--nv-text-muted)" }}>
              VO2 Max
            </span>
            <span className="font-mono tabular-nums" style={{ color: "var(--nv-text-muted)" }}>
              Target {vo2.target}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span
              className="nv-figure text-2xl sm:text-3xl font-semibold"
              style={{ color: "var(--nv-text)" }}
            >
              {vo2.current !== null ? vo2.current : "--"}
              <span
                className="text-xs font-normal ml-1"
                style={{ color: "var(--nv-text-muted)" }}
              >
                ml/kg
              </span>
            </span>
            {vo2.trend !== null && (
              <span
                className="text-xs font-mono font-semibold tabular-nums"
                style={{
                  color: vo2.trend >= 0 ? "var(--nv-matrix)" : "var(--nv-rose)",
                }}
              >
                {vo2.trend >= 0 ? `+${vo2.trend}` : vo2.trend}
              </span>
            )}
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--nv-surface-2)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${vo2.progressPct ?? 0}%`,
                backgroundColor: "var(--nv-accent)",
              }}
            />
          </div>
          <p className="text-xs" style={{ color: "var(--nv-text-secondary)" }}>
            {vo2.gap !== null
              ? vo2.gap > 0
                ? `+${vo2.gap} ml/kg/min to goal`
                : "Target VO2 ceiling achieved"
              : "Sync Apple Watch Cardio Fitness"}
          </p>
        </div>

        {/* Pillar 2: Pace & Projected Race Time */}
        <div
          className="pt-5 sm:pt-0 lg:px-5 space-y-2"
          style={{ borderColor: "var(--nv-rule)" }}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium" style={{ color: "var(--nv-text-muted)" }}>
              {goal.distanceKm}K Projection
            </span>
            <span className="font-mono tabular-nums" style={{ color: "var(--nv-text-muted)" }}>
              Goal {pace.targetTimeFormatted}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span
              className="nv-figure text-2xl sm:text-3xl font-semibold"
              style={{ color: "var(--nv-text)" }}
            >
              {pace.projectedTimeFormatted}
            </span>
            <span
              className="text-xs font-mono font-medium tabular-nums"
              style={{ color: "var(--nv-accent)" }}
            >
              {pace.currentFormatted}
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--nv-surface-2)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${pace.progressPct ?? 0}%`,
                backgroundColor: "var(--nv-matrix)",
              }}
            />
          </div>
          <p className="text-xs truncate" style={{ color: "var(--nv-text-secondary)" }}>
            {pace.source === "measured"
              ? `Best run: ${pace.bestRunSummary}`
              : pace.source === "vo2-estimated"
              ? "Estimated from Apple Health VO2 max"
              : "Log a ≥1.5 km run with distance"}
          </p>
        </div>

        {/* Pillar 3: Weekly Aerobic Volume */}
        <div
          className="pt-5 sm:pt-0 lg:px-5 space-y-2"
          style={{ borderColor: "var(--nv-rule)" }}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium" style={{ color: "var(--nv-text-muted)" }}>
              Weekly Volume
            </span>
            <span className="font-mono tabular-nums" style={{ color: "var(--nv-text-muted)" }}>
              Goal {volume.targetWeeklyMinutes} m
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span
              className="nv-figure text-2xl sm:text-3xl font-semibold"
              style={{ color: "var(--nv-text)" }}
            >
              {volume.weekly7dMinutes}
              <span
                className="text-xs font-normal ml-1"
                style={{ color: "var(--nv-text-muted)" }}
              >
                min
              </span>
            </span>
            <span
              className="text-xs font-mono tabular-nums"
              style={{ color: "var(--nv-text-secondary)" }}
            >
              {volume.weekly7dKm > 0 ? `${volume.weekly7dKm} km · ` : ""}
              {volume.weekly7dSessions}×
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--nv-surface-2)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${volume.progressPct}%`,
                backgroundColor: "var(--nv-amber)",
              }}
            />
          </div>
          <p className="text-xs" style={{ color: "var(--nv-text-secondary)" }}>
            {volume.gapMinutes > 0
              ? `4-wk avg ${volume.chronicWeeklyMinutes} m · +${volume.gapMinutes} m gap`
              : `4-wk avg ${volume.chronicWeeklyMinutes} m · On target`}
          </p>
        </div>

        {/* Pillar 4: 80/20 Polarized Intensity Split */}
        <div
          className="pt-5 sm:pt-0 lg:pl-5 space-y-2"
          style={{ borderColor: "var(--nv-rule)" }}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium" style={{ color: "var(--nv-text-muted)" }}>
              80/20 Zone Split
            </span>
            <span className="font-mono tabular-nums" style={{ color: "var(--nv-text-muted)" }}>
              28 days
            </span>
          </div>
          <div className="flex items-baseline justify-between text-xs font-mono font-semibold tabular-nums pt-1">
            <span style={{ color: "var(--nv-matrix)" }}>Z1–2 {intensity.easyPct}%</span>
            <span style={{ color: "var(--nv-amber)" }}>Z3–4 {intensity.moderatePct}%</span>
            <span style={{ color: "var(--nv-rose)" }}>Z5 {intensity.hardPct}%</span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden flex"
            style={{ backgroundColor: "var(--nv-surface-2)" }}
          >
            <div
              style={{ width: `${intensity.easyPct}%`, backgroundColor: "var(--nv-matrix)" }}
              title={`Easy Z1-2: ${intensity.easyMin} min`}
            />
            <div
              style={{ width: `${intensity.moderatePct}%`, backgroundColor: "var(--nv-amber)" }}
              title={`Moderate Z3-4: ${intensity.moderateMin} min`}
            />
            <div
              style={{ width: `${intensity.hardPct}%`, backgroundColor: "var(--nv-rose)" }}
              title={`Hard Z5: ${intensity.hardMin} min`}
            />
          </div>
          <p className="text-xs line-clamp-2" style={{ color: "var(--nv-text-secondary)" }}>
            {intensity.verdict}
          </p>
        </div>
      </div>

      {/* What To Improve Next — Ruled 3-Column FitLib Prescription Ledger */}
      <div className="pt-5 nv-rule-top space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold" style={{ color: "var(--nv-text)" }}>
            What to Improve Next
          </h3>
          {onAskCoach && (
            <button
              type="button"
              onClick={() =>
                onAskCoach(
                  `Look at my Apple Health aerobic goal analysis for ${goal.name} (${overallGoalReadinessPct}% ready, VO2 ${vo2.current ?? "unknown"}/${vo2.target}, projected ${pace.projectedTimeFormatted} vs ${pace.targetTimeFormatted}, ${volume.weekly7dMinutes} min this week, 80/20 split ${intensity.easyPct}/${intensity.moderatePct}/${intensity.hardPct}). Build my exact 7-day cardio schedule.`
                )
              }
              className="nv-btn-secondary text-xs"
              style={{ minHeight: "36px", padding: "0 0.875rem" }}
            >
              <Sparkles size={12} style={{ color: "var(--nv-accent)" }} aria-hidden="true" />
              Build 7-Day Cardio Plan
            </button>
          )}
        </div>

        <div
          className={`grid grid-cols-1 ${
            recommendations.length === 1
              ? "md:grid-cols-1"
              : recommendations.length === 2
              ? "md:grid-cols-2"
              : "md:grid-cols-3"
          } divide-y md:divide-y-0 md:divide-x rounded-xl border overflow-hidden`}
          style={{
            backgroundColor: "var(--nv-surface-subtle)",
            borderColor: "var(--nv-rule)",
          }}
        >
          {recommendations.map((rec) => {
            const prioColor = PRIORITY_COLOR[rec.priority] || PRIORITY_COLOR.MEDIUM;
            return (
              <div
                key={rec.id}
                className="p-4 sm:p-5 flex flex-col justify-between gap-3.5"
                style={{ borderColor: "var(--nv-rule)" }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-medium">
                    <span style={{ color: "var(--nv-text-muted)" }}>{rec.category}</span>
                    <span className="inline-flex items-center gap-1" style={{ color: prioColor }}>
                      {rec.priority === "URGENT" && (
                        <AlertTriangle size={11} aria-hidden="true" />
                      )}
                      {rec.priority}
                    </span>
                  </div>
                  <h4
                    className="text-sm font-semibold leading-snug"
                    style={{ color: "var(--nv-text)" }}
                  >
                    {rec.title}
                  </h4>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--nv-text-secondary)" }}>
                    {rec.why}
                  </p>
                  <p
                    className="text-xs leading-relaxed pt-2 nv-rule-top"
                    style={{ color: "var(--nv-text)" }}
                  >
                    <strong className="font-semibold" style={{ color: "var(--nv-accent)" }}>
                      Next session:{" "}
                    </strong>
                    {rec.prescription}
                  </p>
                </div>

                {rec.kbRef && onOpenKnowledgeNote && (
                  <button
                    type="button"
                    onClick={() => onOpenKnowledgeNote(rec.kbRef)}
                    className="text-xs font-medium inline-flex items-center gap-1.5 hover:underline self-start"
                    style={{ color: "var(--nv-accent)" }}
                  >
                    <BookOpen size={12} className="shrink-0" aria-hidden="true" />
                    <span className="truncate">Read FitLib: {rec.kbTitle || rec.kbRef}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Analyzed Apple Health Workouts Results Table or Clean Empty Bar */}
      <div className="pt-5 nv-rule-top">
        {recentCardioWorkouts.length > 0 ? (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h4 className="text-xs font-semibold" style={{ color: "var(--nv-text)" }}>
                Analyzed Apple Health Cardio Sessions ({analysis.totalCardioWorkouts28d} in 28d)
              </h4>
              <span
                className="text-xs font-mono tabular-nums"
                style={{ color: "var(--nv-text-muted)" }}
              >
                HRmax Ref: {analysis.maxHREstimate} bpm
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr
                    className="border-b"
                    style={{
                      color: "var(--nv-text-muted)",
                      borderColor: "var(--nv-rule)",
                    }}
                  >
                    <th className="py-2.5 pr-3 font-medium">Date</th>
                    <th className="py-2.5 pr-3 font-medium">Activity</th>
                    <th className="py-2.5 pr-3 font-medium">Duration</th>
                    <th className="py-2.5 pr-3 font-medium">Distance</th>
                    <th className="py-2.5 pr-3 font-medium">Pace</th>
                    <th className="py-2.5 pr-3 font-medium">Avg HR</th>
                    <th className="py-2.5 font-medium text-right">Zone</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--nv-rule)" }}>
                  {recentCardioWorkouts.slice(0, 6).map((w, idx) => (
                    <tr key={`${w.date}-${idx}`} style={{ borderColor: "var(--nv-rule)" }}>
                      <td className="py-2.5 pr-3" style={{ color: "var(--nv-text-muted)" }}>
                        {new Date(w.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-2.5 pr-3 font-medium" style={{ color: "var(--nv-text)" }}>
                        {w.label}
                      </td>
                      <td
                        className="py-2.5 pr-3 font-mono tabular-nums"
                        style={{ color: "var(--nv-text-secondary)" }}
                      >
                        {Math.round(w.durationMin)} min
                      </td>
                      <td
                        className="py-2.5 pr-3 font-mono tabular-nums"
                        style={{ color: "var(--nv-text-secondary)" }}
                      >
                        {w.distanceKm ? `${w.distanceKm} km` : "--"}
                      </td>
                      <td
                        className="py-2.5 pr-3 font-mono font-medium tabular-nums"
                        style={{ color: "var(--nv-accent)" }}
                      >
                        {w.paceMinPerKm ? formatPace(w.paceMinPerKm) : "--"}
                      </td>
                      <td
                        className="py-2.5 pr-3 font-mono tabular-nums"
                        style={{ color: "var(--nv-text-secondary)" }}
                      >
                        {w.avgHR ? `${w.avgHR} bpm` : "--"}
                      </td>
                      <td
                        className="py-2.5 text-right font-medium"
                        style={{ color: ZONE_COLOR[w.zone] || ZONE_COLOR.easy }}
                      >
                        {w.zoneLabel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs max-w-lg" style={{ color: "var(--nv-text-secondary)" }}>
              <strong className="block mb-0.5 text-sm font-semibold" style={{ color: "var(--nv-text)" }}>
                No Apple Health cardio workouts detected yet
              </strong>
              Sync Apple Health on iPhone, import your Apple Health XML export, or log a run to
              unlock pace projections, 80/20 zone splits, and ACWR load monitoring.
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {onOpenHealthImport && (
                <button
                  type="button"
                  onClick={onOpenHealthImport}
                  className="nv-btn-primary text-xs"
                  style={{ minHeight: "38px" }}
                >
                  <Upload size={13} aria-hidden="true" />
                  Import Apple Health
                </button>
              )}
              {onOpenWorkouts && (
                <button
                  type="button"
                  onClick={onOpenWorkouts}
                  className="nv-btn-secondary text-xs"
                  style={{ minHeight: "38px" }}
                >
                  Log Cardio Run
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
