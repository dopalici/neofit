// src/components/dashboard/AerobicGoalAnalyzer.jsx
// Visual Apple Health Workout -> Aerobic Fitness / Cardio Goal Gap Analyzer
// Shows exact distance from cardio goals + FitLib-grounded next-step prescriptions.

import React from "react";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Flame,
  Gauge,
  HeartPulse,
  Sparkles,
  Timer,
  TrendingUp,
  Upload,
} from "lucide-react";
import {
  AEROBIC_GOAL_PRESETS,
  formatPace,
} from "../../services/aerobicGoalService";

const PRIORITY_STYLES = {
  URGENT: "bg-rose-500/15 text-rose-300 border-rose-500/40",
  HIGH: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  MEDIUM: "bg-cyan-500/15 text-cyan-300 border-cyan-500/40",
  LOW: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
};

const ACWR_STYLES = {
  "SWEET SPOT": "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  "BUILDING BASE": "bg-cyan-500/15 text-cyan-300 border-cyan-500/40",
  "HIGH RAMP": "bg-amber-500/15 text-amber-300 border-amber-500/40",
  "SPIKE RISK": "bg-rose-500/15 text-rose-300 border-rose-500/40",
  DETRAINING: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  "NO DATA": "bg-slate-800 text-slate-400 border-slate-700",
};

const ZONE_BADGE = {
  easy: "bg-emerald-950/70 text-emerald-300 border-emerald-700/50",
  moderate: "bg-amber-950/70 text-amber-300 border-amber-700/50",
  hard: "bg-rose-950/70 text-rose-300 border-rose-700/50",
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

  const acwrClass = ACWR_STYLES[volume.acwrStatus] || ACWR_STYLES["NO DATA"];

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
      parts.push(`Weekly volume target met (${volume.effectiveWeeklyMinutes}m/wk)`);
    }
    return parts.join(" · ");
  };

  return (
    <section
      className="system-window rounded-2xl p-5 sm:p-6 space-y-5"
      aria-label="Apple Health Aerobic & Cardio Goal Analyzer"
    >
      {/* Header + Goal Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <HeartPulse size={18} className="text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">
              APPLE HEALTH AEROBIC & CARDIO GOAL ENGINE
            </h2>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${acwrClass}`}>
              LOAD: {volume.acwr ? `${volume.acwr}× ` : ""}
              {volume.acwrStatus}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{buildGapHeadline()}</p>
        </div>

        {/* Preset Switcher */}
        <div className="flex flex-wrap gap-1.5">
          {AEROBIC_GOAL_PRESETS.map((preset) => {
            const active = preset.id === selectedGoalId;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectGoal && onSelectGoal(preset.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono border transition-colors ${
                  active
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-200"
                    : "bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                {preset.shortName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overall Distance-to-Goal Progress Strip */}
      <div className="bg-slate-950/85 border border-slate-800/90 rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">
              ACTIVE CARDIO BENCHMARK
            </span>
            <h3 className="text-base font-semibold text-slate-100">{goal.name}</h3>
            <p className="text-xs text-slate-400">{goal.description}</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold font-mono text-cyan-300 tabular-nums">
              {overallGoalReadinessPct}%
            </span>
            <p className="text-[10px] font-mono text-slate-400 uppercase">
              GOAL READINESS
            </p>
          </div>
        </div>
        <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${Math.max(hasCardioData ? 5 : 0, overallGoalReadinessPct)}%` }}
          />
        </div>
      </div>

      {/* 4 Quantitative Aerobic Gap Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Pillar 1: VO2 Max */}
        <div className="bg-slate-950/75 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-slate-400 flex items-center">
              <Gauge size={13} className="mr-1.5 text-cyan-400" />
              VO2 MAX
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              TARGET {vo2.target}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
              {vo2.current !== null ? vo2.current : "--"}
              <span className="text-xs font-normal text-slate-500 ml-1">ml/kg</span>
            </span>
            {vo2.trend !== null && (
              <span
                className={`text-xs font-mono ${
                  vo2.trend >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {vo2.trend >= 0 ? `+${vo2.trend}` : vo2.trend}
              </span>
            )}
          </div>
          <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400"
              style={{ width: `${vo2.progressPct ?? 0}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            {vo2.gap !== null
              ? vo2.gap > 0
                ? `Gap: +${vo2.gap} ml/kg/min to goal`
                : "Target VO2 ceiling achieved"
              : "Sync Apple Watch Cardio Fitness"}
          </p>
        </div>

        {/* Pillar 2: Pace & Projected Race Time */}
        <div className="bg-slate-950/75 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-slate-400 flex items-center">
              <Timer size={13} className="mr-1.5 text-emerald-400" />
              PACE & {goal.distanceKm}K PROJ
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              GOAL {pace.targetTimeFormatted}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
              {pace.projectedTimeFormatted}
            </span>
            <span className="text-xs font-mono text-cyan-300">
              {pace.currentFormatted}
            </span>
          </div>
          <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400"
              style={{ width: `${pace.progressPct ?? 0}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 truncate">
            {pace.source === "measured"
              ? `From run: ${pace.bestRunSummary}`
              : pace.source === "vo2-estimated"
              ? "Estimated from Apple Health VO2 max"
              : "Log a ≥1.5 km run with distance"}
          </p>
        </div>

        {/* Pillar 3: Weekly Aerobic Volume */}
        <div className="bg-slate-950/75 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-slate-400 flex items-center">
              <Activity size={13} className="mr-1.5 text-amber-400" />
              WEEKLY VOLUME
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              GOAL {volume.targetWeeklyMinutes}m
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
              {volume.weekly7dMinutes}
              <span className="text-xs font-normal text-slate-500 ml-1">min</span>
            </span>
            <span className="text-xs font-mono text-slate-400">
              {volume.weekly7dKm > 0 ? `${volume.weekly7dKm} km · ` : ""}
              {volume.weekly7dSessions}×/wk
            </span>
          </div>
          <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400"
              style={{ width: `${volume.progressPct}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            {volume.gapMinutes > 0
              ? `4-wk avg ${volume.chronicWeeklyMinutes}m · +${volume.gapMinutes}m gap`
              : `4-wk avg ${volume.chronicWeeklyMinutes}m · Target met`}
          </p>
        </div>

        {/* Pillar 4: 80/20 Polarized Intensity Split */}
        <div className="bg-slate-950/75 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-slate-400 flex items-center">
              <Flame size={13} className="mr-1.5 text-rose-400" />
              80/20 ZONE SPLIT
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              28 DAYS
            </span>
          </div>
          <div className="flex items-baseline justify-between font-mono text-xs tabular-nums">
            <span className="text-emerald-300">Z1–2 {intensity.easyPct}%</span>
            <span className="text-amber-300">Z3–4 {intensity.moderatePct}%</span>
            <span className="text-rose-300">Z5 {intensity.hardPct}%</span>
          </div>
          <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${intensity.easyPct}%` }}
              title={`Easy Z1-2: ${intensity.easyMin} min`}
            />
            <div
              className="h-full bg-amber-500"
              style={{ width: `${intensity.moderatePct}%` }}
              title={`Moderate Z3-4: ${intensity.moderateMin} min`}
            />
            <div
              className="h-full bg-rose-500"
              style={{ width: `${intensity.hardPct}%` }}
              title={`Hard Z5: ${intensity.hardMin} min`}
            />
          </div>
          <p className="text-[11px] text-slate-400 line-clamp-2">
            {intensity.verdict}
          </p>
        </div>
      </div>

      {/* What To Improve Next (Grounded in FitLib Vault) */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center">
            <TrendingUp size={14} className="mr-1.5" />
            WHAT TO IMPROVE NEXT (FITLIB-GROUNDED PRESCRIPTIONS)
          </h3>
          {onAskCoach && (
            <button
              type="button"
              onClick={() =>
                onAskCoach(
                  `Look at my Apple Health aerobic goal analysis for ${goal.name} (${overallGoalReadinessPct}% ready, VO2 ${vo2.current ?? "unknown"}/${vo2.target}, projected ${pace.projectedTimeFormatted} vs ${pace.targetTimeFormatted}, ${volume.weekly7dMinutes} min this week, 80/20 split ${intensity.easyPct}/${intensity.moderatePct}/${intensity.hardPct}). Build my exact 7-day cardio schedule.`
                )
              }
              className="text-xs font-mono px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-200 flex items-center transition-colors"
            >
              <Sparkles size={12} className="mr-1.5 text-cyan-400" />
              BUILD 7-DAY CARDIO PLAN WITH GEMINI
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {rec.category}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.MEDIUM
                    }`}
                  >
                    {rec.priority === "URGENT" && (
                      <AlertTriangle size={10} className="inline mr-1" />
                    )}
                    {rec.priority}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-100 leading-snug">
                  {rec.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">{rec.why}</p>
                <div className="pt-1 text-xs text-slate-200 bg-[#0b1520] border border-slate-800/80 rounded-lg p-2.5 leading-relaxed">
                  <strong className="text-cyan-300 font-mono text-[10px] block mb-0.5">
                    NEXT SESSION ACTION
                  </strong>
                  {rec.prescription}
                </div>
              </div>

              {rec.kbRef && onOpenKnowledgeNote && (
                <button
                  type="button"
                  onClick={() => onOpenKnowledgeNote(rec.kbRef)}
                  className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center pt-1"
                >
                  <BookOpen size={11} className="mr-1.5 shrink-0" />
                  <span className="truncate">Read FitLib: {rec.kbTitle || rec.kbRef}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Analyzed Apple Health Cardio Workouts Table or Clean Empty Action Bar */}
      <div className="pt-2 border-t border-slate-800/80">
        {recentCardioWorkouts.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                ANALYZED APPLE HEALTH CARDIO WORKOUTS ({analysis.totalCardioWorkouts28d} IN LAST 28D)
              </h4>
              <span className="text-[11px] font-mono text-slate-500">
                HRmax Ref: {analysis.maxHREstimate} bpm (Tanaka/Observed)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-[10px] text-slate-500 border-b border-slate-800">
                    <th className="py-2 pr-3">DATE</th>
                    <th className="py-2 pr-3">ACTIVITY</th>
                    <th className="py-2 pr-3">DURATION</th>
                    <th className="py-2 pr-3">DISTANCE</th>
                    <th className="py-2 pr-3">PACE</th>
                    <th className="py-2 pr-3">AVG HR</th>
                    <th className="py-2">ZONE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {recentCardioWorkouts.slice(0, 6).map((w, idx) => (
                    <tr key={`${w.date}-${idx}`} className="hover:bg-slate-900/40">
                      <td className="py-2 pr-3 text-slate-400">
                        {new Date(w.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-2 pr-3 text-slate-100 font-sans font-medium">
                        {w.label}
                      </td>
                      <td className="py-2 pr-3 tabular-nums">{Math.round(w.durationMin)} min</td>
                      <td className="py-2 pr-3 tabular-nums">
                        {w.distanceKm ? `${w.distanceKm} km` : "--"}
                      </td>
                      <td className="py-2 pr-3 tabular-nums text-cyan-300">
                        {w.paceMinPerKm ? formatPace(w.paceMinPerKm) : "--"}
                      </td>
                      <td className="py-2 pr-3 tabular-nums">
                        {w.avgHR ? `${w.avgHR} bpm` : "--"}
                      </td>
                      <td className="py-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border ${
                            ZONE_BADGE[w.zone] || ZONE_BADGE.easy
                          }`}
                        >
                          {w.zoneLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 border border-dashed border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400">
              <strong className="text-slate-200 block mb-0.5">
                No Apple Health cardio workouts detected yet
              </strong>
              Upload your Apple Health `export.xml`/CSV or log a run/bike session to unlock pace gap, 80/20 zone split, and ACWR tracking.
            </div>
            <div className="flex items-center gap-2">
              {onOpenHealthImport && (
                <button
                  type="button"
                  onClick={onOpenHealthImport}
                  className="px-3 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs font-mono rounded-lg flex items-center"
                >
                  <Upload size={13} className="mr-1.5" />
                  IMPORT APPLE HEALTH
                </button>
              )}
              {onOpenWorkouts && (
                <button
                  type="button"
                  onClick={onOpenWorkouts}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono rounded-lg"
                >
                  LOG CARDIO RUN
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
