// src/components/dashboard/SystemCommandCenter.jsx
// Precision 60-Second Command Center grounded in Goal-Setting Science,
// Behavioral Psychology (WOOP + Rolling Consistency + SDT Competence), and Autoregulated Physiology.

import React, { useMemo, useState } from "react";
import {
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Circle,
  Flame,
  Plus,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import ReadinessRing from "../ui/ReadinessRing";
import { normalizeUserGoals } from "../../services/goalEngineService";

const ZONE_COLOR = {
  PEAK: "var(--nv-matrix)",
  CALIBRATE: "var(--nv-amber)",
  RECOVER: "var(--nv-rose)",
  BASELINE: "var(--nv-accent)",
};

const INSIGHT_BAR = {
  positive: "var(--nv-matrix)",
  warning: "var(--nv-amber)",
  alert: "var(--nv-rose)",
  info: "var(--nv-accent)",
};

export default function SystemCommandCenter({
  goals,
  readiness,
  progression,
  dailyQuests = [],
  literalInsights = [],
  onToggleQuest,
  onRecordReadiness,
  onAdvanceRung,
  onRemoveGoal,
  onOpenGoalStudio,
  onAskCoach,
  onOpenKnowledgeNote,
}) {
  const normalizedGoals = useMemo(() => normalizeUserGoals(goals), [goals]);
  const goalList = useMemo(() => Object.values(normalizedGoals), [normalizedGoals]);

  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [showReadinessDial, setShowReadinessDial] = useState(false);
  const [dialSleep, setDialSleep] = useState(7.5);
  const [dialEnergy, setDialEnergy] = useState(4);
  const [dialSoreness, setDialSoreness] = useState(2);
  const [xpFlash, setXpFlash] = useState(null);

  const activeGoal =
    (selectedGoalId && normalizedGoals[selectedGoalId]) || goalList[0] || null;
  const activeRung = activeGoal?.rungs?.[activeGoal.currentRungIndex] || null;
  const completedRungsSet = new Set(activeGoal?.completedRungs || []);
  const isGoalFullyComplete =
    Boolean(activeGoal) &&
    Array.isArray(activeGoal.rungs) &&
    activeGoal.rungs.length > 0 &&
    completedRungsSet.size >= activeGoal.rungs.length;

  const completedQuestCount = dailyQuests.filter((q) => q.completed).length;
  const zoneColor = ZONE_COLOR[readiness?.zone] || ZONE_COLOR.BASELINE;

  const triggerXpFlash = (label) => {
    setXpFlash(label);
    setTimeout(() => setXpFlash(null), 2600);
  };

  const handleQuestClick = (quest) => {
    if (onToggleQuest) {
      onToggleQuest(quest.id, quest.xp);
      if (!quest.completed) {
        triggerXpFlash(`+${quest.xp} XP · Quest Complete`);
      }
    }
  };

  const handlePassRung = () => {
    if (!activeGoal || !onAdvanceRung) return;
    onAdvanceRung(activeGoal.id);
    triggerXpFlash("+120 XP · Benchmark Cleared");
  };

  const handleSaveDial = (e) => {
    e.preventDefault();
    if (onRecordReadiness) {
      onRecordReadiness({
        sleepHours: Number(dialSleep),
        energy: Number(dialEnergy),
        soreness: Number(dialSoreness),
      });
      triggerXpFlash("+15 XP · Readiness Calibrated");
    }
    setShowReadinessDial(false);
  };

  return (
    <section className="space-y-6" aria-label="System Command Center">
      {/* Row 1: Unified Operator Rank & Physiological Readiness Instrument */}
      <div className="system-window rounded-xl overflow-hidden">
        <div
          className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x"
          style={{ borderColor: "var(--nv-rule)" }}
        >
          {/* Left 7 cols: Physiological Readiness Ring + Drivers */}
          <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4 min-w-0">
              <ReadinessRing
                score={readiness?.score}
                zone={readiness?.zone}
                size={84}
                strokeWidth={6}
                label="READY"
              />
              <div className="min-w-0">
                <p
                  className="text-xs font-medium"
                  style={{ color: "var(--nv-text-muted)" }}
                >
                  Readiness · {readiness?.source || "Uncalibrated"}
                </p>
                <p
                  className="text-base sm:text-lg font-semibold mt-0.5 leading-snug"
                  style={{ color: zoneColor }}
                >
                  {readiness?.label || "Calibrate Readiness"}
                </p>
                {Array.isArray(readiness?.drivers) && readiness.drivers.length > 0 && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs tabular-nums">
                    {readiness.drivers.slice(0, 3).map((d) => (
                      <span key={d.label} style={{ color: "var(--nv-text-secondary)" }}>
                        <span style={{ color: "var(--nv-text-muted)" }}>{d.label} </span>
                        <strong className="font-semibold" style={{ color: "var(--nv-text)" }}>
                          {d.value}
                        </strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowReadinessDial((prev) => !prev)}
              className="nv-btn-secondary shrink-0 text-xs self-start sm:self-center"
              style={{ minHeight: "38px", padding: "0 0.875rem" }}
            >
              <SlidersHorizontal size={13} style={{ color: "var(--nv-accent)" }} aria-hidden="true" />
              {readiness?.hasSubjectiveToday ? "Update Check-In" : "5s Check-In"}
            </button>
          </div>

          {/* Right 5 cols: Solo-Leveling Rank, Consistency & XP Rail */}
          <div
            className="lg:col-span-5 p-5 sm:p-6 flex items-center gap-4"
            style={{ borderColor: "var(--nv-rule)" }}
          >
            <div
              className="w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 border"
              style={{
                backgroundColor: "var(--nv-accent-soft)",
                borderColor: "var(--nv-border-strong)",
                color: "var(--nv-accent)",
              }}
            >
              <span className="nv-figure text-2xl font-bold leading-none">
                {progression?.rank || "E"}
              </span>
              <span className="text-[10px] font-medium mt-1 opacity-85">Rank</span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className="text-sm font-semibold truncate"
                  style={{ color: "var(--nv-text)" }}
                >
                  Level {progression?.level || 1} · {progression?.rankTitle || "Awakened"}
                </span>
                <span
                  className="inline-flex items-center gap-1 text-xs tabular-nums"
                  style={{ color: "var(--nv-text-secondary)" }}
                >
                  <Flame size={12} style={{ color: "var(--nv-amber)" }} aria-hidden="true" />
                  {progression?.consistency14d ?? 0}% (14d)
                </span>
              </div>

              {/* Slim XP Rail */}
              <div className="mt-2.5">
                <div
                  className="h-1.5 w-full rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--nv-surface-2)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(4, progression?.levelProgressPct ?? 0)}%`,
                      backgroundColor: "var(--nv-accent)",
                    }}
                  />
                </div>
                <div
                  className="flex justify-between text-[11px] mt-1.5 tabular-nums"
                  style={{ color: "var(--nv-text-muted)" }}
                >
                  <span>{progression?.xp ?? 0} XP</span>
                  <span>
                    {progression?.nextRank
                      ? `${progression.nextRank.xpRemaining} XP to ${progression.nextRank.rank}-Rank`
                      : "Max Rank"}
                  </span>
                </div>
              </div>

              {xpFlash && (
                <p
                  role="status"
                  className="mt-2 text-xs font-medium"
                  style={{ color: "var(--nv-matrix)" }}
                >
                  {xpFlash}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 5-Second Subjective Readiness Check-In Drawer */}
        {showReadinessDial && (
          <form
            onSubmit={handleSaveDial}
            className="p-5 sm:p-6 nv-rule-top grid grid-cols-1 md:grid-cols-4 gap-5 items-end"
            style={{ backgroundColor: "var(--nv-surface-subtle)" }}
          >
            <div>
              <label
                htmlFor="cc-sleep-slider"
                className="flex justify-between text-xs font-medium mb-2"
                style={{ color: "var(--nv-text-secondary)" }}
              >
                <span>Sleep last night</span>
                <span className="font-semibold tabular-nums" style={{ color: "var(--nv-accent)" }}>
                  {Number(dialSleep).toFixed(1)} h
                </span>
              </label>
              <input
                id="cc-sleep-slider"
                type="range"
                min="3"
                max="10.5"
                step="0.5"
                value={dialSleep}
                onChange={(e) => setDialSleep(Number(e.target.value))}
                className="nv-slider"
              />
            </div>

            <div>
              <span
                className="block text-xs font-medium mb-2"
                style={{ color: "var(--nv-text-secondary)" }}
              >
                Energy / CNS drive (1–5)
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setDialEnergy(n)}
                    className="h-9 rounded-lg text-xs font-semibold border transition-colors tabular-nums"
                    style={{
                      backgroundColor:
                        dialEnergy === n ? "var(--nv-accent)" : "var(--nv-surface)",
                      borderColor: dialEnergy === n ? "var(--nv-accent)" : "var(--nv-rule)",
                      color:
                        dialEnergy === n ? "var(--nv-accent-ink)" : "var(--nv-text-secondary)",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span
                className="block text-xs font-medium mb-2"
                style={{ color: "var(--nv-text-secondary)" }}
              >
                Soreness (1 fresh – 5 high)
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setDialSoreness(n)}
                    className="h-9 rounded-lg text-xs font-semibold border transition-colors tabular-nums"
                    style={{
                      backgroundColor:
                        dialSoreness === n ? "var(--nv-amber)" : "var(--nv-surface)",
                      borderColor: dialSoreness === n ? "var(--nv-amber)" : "var(--nv-rule)",
                      color:
                        dialSoreness === n ? "var(--nv-accent-ink)" : "var(--nv-text-secondary)",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="nv-btn-primary flex-1 text-xs"
                style={{ minHeight: "38px" }}
              >
                Calibrate (+15 XP)
              </button>
              <button
                type="button"
                onClick={() => setShowReadinessDial(false)}
                className="px-3 text-xs font-medium"
                style={{ color: "var(--nv-text-muted)" }}
              >
                Close
              </button>
            </div>
          </form>
        )}

        {/* Row 2: Ruled 3-Column Literal Insights Ledger (replaces 3 heavy boxed cards) */}
        {literalInsights.length > 0 && (
          <div
            className="nv-rule-top grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x"
            style={{
              backgroundColor: "var(--nv-surface-subtle)",
              borderColor: "var(--nv-rule)",
            }}
          >
            {literalInsights.map((insight) => (
              <div
                key={insight.id}
                className="p-4 sm:px-5 flex flex-col justify-between gap-2.5"
                style={{ borderColor: "var(--nv-rule)" }}
              >
                <div>
                  <div className="flex items-start gap-2.5">
                    <span
                      className="w-1 h-4 rounded-full shrink-0 mt-0.5"
                      style={{
                        backgroundColor: INSIGHT_BAR[insight.tone] || INSIGHT_BAR.info,
                      }}
                      aria-hidden="true"
                    />
                    <h3
                      className="text-xs font-semibold leading-snug"
                      style={{ color: "var(--nv-text)" }}
                    >
                      {insight.headline}
                    </h3>
                  </div>
                  <p
                    className="text-xs leading-relaxed mt-1.5 pl-3.5"
                    style={{ color: "var(--nv-text-secondary)" }}
                  >
                    {insight.body}
                  </p>
                </div>

                <div className="flex items-center justify-between pl-3.5 pt-1">
                  {insight.kbRef && onOpenKnowledgeNote ? (
                    <button
                      type="button"
                      onClick={() => onOpenKnowledgeNote(insight.kbRef)}
                      className="text-[11px] font-medium inline-flex items-center gap-1 hover:underline"
                      style={{ color: "var(--nv-accent)" }}
                    >
                      <BookOpen size={11} aria-hidden="true" />
                      {insight.kbRef}
                    </button>
                  ) : (
                    <span />
                  )}
                  {onAskCoach && (
                    <button
                      type="button"
                      onClick={() =>
                        onAskCoach(
                          `Analyze this insight for me and give exact steps: "${insight.headline} — ${insight.body}"`
                        )
                      }
                      className="text-[11px] font-medium inline-flex items-center gap-1 hover:underline"
                      style={{ color: "var(--nv-text-muted)" }}
                    >
                      <Sparkles size={11} style={{ color: "var(--nv-accent)" }} aria-hidden="true" />
                      Ask Coach
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Row 3: 60-Second Daily Execution Workspace (Quests + Skill Progression Ladder) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Today's System Quests (5 cols, hairline-divided list) */}
        <div className="lg:col-span-5 system-window rounded-xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-baseline justify-between gap-3 pb-4 nv-rule-bottom">
              <div>
                <h2
                  className="text-sm font-semibold tracking-tight"
                  style={{ color: "var(--nv-text)" }}
                >
                  TODAY’S SYSTEM QUESTS
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--nv-text-muted)" }}>
                  Auto-scaled to today’s recovery.
                </p>
              </div>
              <span
                className="text-xs font-mono font-semibold tabular-nums"
                style={{ color: "var(--nv-accent)" }}
              >
                {completedQuestCount}/{dailyQuests.length} done
              </span>
            </div>

            <ul className="divide-y" style={{ borderColor: "var(--nv-rule)" }}>
              {dailyQuests.map((quest) => (
                <li
                  key={quest.id}
                  className="py-4 first:pt-4 last:pb-2"
                  style={{ borderColor: "var(--nv-rule)" }}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => handleQuestClick(quest)}
                      aria-label={
                        quest.completed
                          ? `Mark quest incomplete: ${quest.title}`
                          : `Complete quest: ${quest.title}`
                      }
                      className="mt-0.5 p-0.5 shrink-0 transition-transform active:scale-95"
                    >
                      {quest.completed ? (
                        <CheckCircle2 size={20} style={{ color: "var(--nv-matrix)" }} />
                      ) : (
                        <Circle size={20} style={{ color: "var(--nv-rule-2)" }} />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className="text-[11px] font-medium"
                          style={{ color: "var(--nv-accent)" }}
                        >
                          {quest.category} · {quest.badge}
                        </span>
                        <span
                          className="text-xs font-mono font-semibold tabular-nums shrink-0"
                          style={{
                            color: quest.completed
                              ? "var(--nv-matrix)"
                              : "var(--nv-text-muted)",
                          }}
                        >
                          +{quest.xp} XP
                        </span>
                      </div>

                      <p
                        className={`text-sm font-medium leading-snug ${
                          quest.completed ? "line-through opacity-55" : ""
                        }`}
                        style={{ color: "var(--nv-text)" }}
                      >
                        {quest.title}
                      </p>
                      <p
                        className="text-xs mt-1 leading-relaxed"
                        style={{ color: "var(--nv-text-secondary)" }}
                      >
                        {quest.detail}
                      </p>

                      {quest.kbRef && onOpenKnowledgeNote && (
                        <button
                          type="button"
                          onClick={() => onOpenKnowledgeNote(quest.kbRef)}
                          className="mt-2 text-[11px] font-medium inline-flex items-center gap-1 hover:underline"
                          style={{ color: "var(--nv-text-muted)" }}
                        >
                          <BookOpen
                            size={11}
                            style={{ color: "var(--nv-accent)" }}
                            aria-hidden="true"
                          />
                          Why this works ({quest.kbRef})
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {onAskCoach && (
            <button
              type="button"
              onClick={() =>
                onAskCoach(
                  "Review my readiness, active skill rung, and bottlenecks — what is the single highest-leverage thing I should nail today?"
                )
              }
              className="nv-btn-secondary mt-5 w-full text-xs"
              style={{ minHeight: "40px" }}
            >
              <Sparkles size={13} style={{ color: "var(--nv-accent)" }} aria-hidden="true" />
              Ask Coach for Today’s Adjustment
            </button>
          )}
        </div>

        {/* Right: Active Goal & Physical Skill Ladder (7 cols, ruled specification sheet) */}
        <div className="lg:col-span-7 system-window rounded-xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 nv-rule-bottom">
              <div className="flex items-center gap-2">
                <Target size={16} style={{ color: "var(--nv-accent)" }} aria-hidden="true" />
                <h2
                  className="text-sm font-semibold tracking-tight"
                  style={{ color: "var(--nv-text)" }}
                >
                  GOAL & PHYSICAL SKILL LADDER
                </h2>
              </div>
              <button
                type="button"
                onClick={onOpenGoalStudio}
                className="nv-btn-primary text-xs"
                style={{ minHeight: "36px", padding: "0 0.875rem" }}
              >
                <Plus size={14} aria-hidden="true" />
                NEW GOAL / SKILL
              </button>
            </div>

            {/* Clean Underline Goal Selector */}
            {goalList.length > 0 && (
              <div
                className="flex flex-wrap gap-2 py-3.5 nv-rule-bottom"
                role="tablist"
                aria-label="Active physical goals"
              >
                {goalList.map((g) => {
                  const isSelected = activeGoal && g.id === activeGoal.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => setSelectedGoalId(g.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-2 border transition-colors"
                      style={{
                        backgroundColor: isSelected
                          ? "var(--nv-accent-soft)"
                          : "var(--nv-surface-subtle)",
                        borderColor: isSelected ? "var(--nv-border-strong)" : "var(--nv-rule)",
                        color: isSelected ? "var(--nv-accent)" : "var(--nv-text-secondary)",
                      }}
                    >
                      <span>{g.shortName || g.name}</span>
                      <span className="font-mono text-[11px] tabular-nums opacity-85">
                        {g.progress}%
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {activeGoal && activeRung ? (
              <div className="pt-4 space-y-5">
                {/* Clean Horizontal Rung Stepper */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {activeGoal.rungs.map((rung, idx) => {
                    const isPassed = completedRungsSet.has(rung.id);
                    const isCurrent = idx === activeGoal.currentRungIndex && !isPassed;
                    return (
                      <div
                        key={rung.id}
                        className="p-2.5 rounded-lg border text-left transition-colors"
                        style={{
                          backgroundColor: isCurrent
                            ? "var(--nv-accent-soft)"
                            : isPassed
                            ? "var(--nv-matrix-soft)"
                            : "var(--nv-surface-subtle)",
                          borderColor: isCurrent
                            ? "var(--nv-accent)"
                            : isPassed
                            ? "var(--nv-matrix)"
                            : "var(--nv-rule)",
                          opacity: !isCurrent && !isPassed ? 0.6 : 1,
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className="text-[10px] font-mono tabular-nums"
                            style={{ color: "var(--nv-text-muted)" }}
                          >
                            R{idx + 1}
                          </span>
                          {isPassed ? (
                            <Check size={12} style={{ color: "var(--nv-matrix)" }} />
                          ) : isCurrent ? (
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: "var(--nv-accent)" }}
                            />
                          ) : null}
                        </div>
                        <p
                          className="text-[11px] font-medium leading-tight line-clamp-2"
                          style={{ color: "var(--nv-text)" }}
                        >
                          {rung.title}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Active Rung Specification Sheet (Ruled, Zero Nested Card Noise) */}
                <div className="nv-rule-bar pt-4 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p
                        className="text-xs font-medium"
                        style={{ color: "var(--nv-accent)" }}
                      >
                        {isGoalFullyComplete
                          ? "Protocol Mastered"
                          : `Active Rung ${activeGoal.currentRungIndex + 1} of ${activeGoal.rungs.length}`}
                      </p>
                      <h3
                        className="text-lg font-semibold mt-0.5"
                        style={{ color: "var(--nv-text)" }}
                      >
                        {activeRung.title}
                      </h3>
                    </div>
                    {goalList.length > 1 && onRemoveGoal && (
                      <button
                        type="button"
                        onClick={() => {
                          onRemoveGoal(activeGoal.id);
                          setSelectedGoalId(null);
                        }}
                        title="Remove this goal"
                        aria-label={`Remove goal ${activeGoal.name}`}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: "var(--nv-text-muted)" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Prescription vs Exit Criteria parted by a clean vertical hairline */}
                  <div
                    className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x py-3.5 nv-rule-top nv-rule-bottom"
                    style={{ borderColor: "var(--nv-rule)" }}
                  >
                    <div className="pb-3.5 md:pb-0 md:pr-5">
                      <p
                        className="text-xs font-semibold mb-1"
                        style={{ color: "var(--nv-text)" }}
                      >
                        Target Prescription
                      </p>
                      <p
                        className="text-xs sm:text-sm leading-relaxed"
                        style={{ color: "var(--nv-text-secondary)" }}
                      >
                        {activeRung.prescription}
                      </p>
                    </div>
                    <div className="pt-3.5 md:pt-0 md:pl-5" style={{ borderColor: "var(--nv-rule)" }}>
                      <p
                        className="text-xs font-semibold mb-1"
                        style={{ color: "var(--nv-matrix)" }}
                      >
                        Objective Exit Criteria
                      </p>
                      <p
                        className="text-xs sm:text-sm leading-relaxed"
                        style={{ color: "var(--nv-text-secondary)" }}
                      >
                        {activeRung.exitCriteria}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div
                      className="flex items-start gap-2"
                      style={{ color: "var(--nv-text-secondary)" }}
                    >
                      <TrendingUp
                        size={14}
                        className="shrink-0 mt-0.5"
                        style={{ color: "var(--nv-amber)" }}
                        aria-hidden="true"
                      />
                      <span>
                        <strong style={{ color: "var(--nv-text)" }}>Limiter:</strong>{" "}
                        {activeRung.limitingFactor}
                      </span>
                    </div>
                    <div
                      className="flex items-start gap-2"
                      style={{ color: "var(--nv-text-secondary)" }}
                    >
                      <Shield
                        size={14}
                        className="shrink-0 mt-0.5"
                        style={{ color: "var(--nv-accent)" }}
                        aria-hidden="true"
                      />
                      <span>
                        <strong style={{ color: "var(--nv-text)" }}>WOOP Shield:</strong>{" "}
                        {activeGoal.woop?.fallbackPlan}
                      </span>
                    </div>
                  </div>

                  {/* Verified FitLib Evidence Links */}
                  {Array.isArray(activeRung.kbRefs) && activeRung.kbRefs.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <span className="text-xs" style={{ color: "var(--nv-text-muted)" }}>
                        FitLib evidence:
                      </span>
                      {activeRung.kbRefs.map((refId) => (
                        <button
                          key={refId}
                          type="button"
                          onClick={() => onOpenKnowledgeNote && onOpenKnowledgeNote(refId)}
                          className="text-xs font-medium px-2.5 py-1 rounded-md border inline-flex items-center gap-1 transition-colors"
                          style={{
                            backgroundColor: "var(--nv-surface-subtle)",
                            borderColor: "var(--nv-rule)",
                            color: "var(--nv-accent)",
                          }}
                        >
                          <BookOpen size={11} aria-hidden="true" />
                          {refId}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Rung Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-2">
                    <button
                      type="button"
                      disabled={isGoalFullyComplete}
                      onClick={handlePassRung}
                      className="nv-btn-primary text-xs"
                      style={{
                        minHeight: "40px",
                        backgroundColor: isGoalFullyComplete
                          ? "var(--nv-matrix-soft)"
                          : "var(--nv-matrix)",
                        color: isGoalFullyComplete
                          ? "var(--nv-matrix)"
                          : "var(--nv-accent-ink)",
                      }}
                    >
                      <Award size={14} aria-hidden="true" />
                      {isGoalFullyComplete
                        ? "ALL RUNGS MASTERED"
                        : "PASS BENCHMARK & LEVEL UP (+120 XP)"}
                    </button>

                    {onAskCoach && (
                      <button
                        type="button"
                        onClick={() =>
                          onAskCoach(
                            `I am on Rung ${activeGoal.currentRungIndex + 1} (${activeRung.title}) of my ${activeGoal.name} goal. Exit criteria: "${activeRung.exitCriteria}". Limiting factor: "${activeRung.limitingFactor}". Given my current readiness, give me a crisp coaching plan to pass this rung.`
                          )
                        }
                        className="nv-btn-secondary text-xs"
                        style={{ minHeight: "40px" }}
                      >
                        <Sparkles size={13} style={{ color: "var(--nv-accent)" }} aria-hidden="true" />
                        Coach This Rung
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="text-center py-12 my-4 border border-dashed rounded-xl"
                style={{ borderColor: "var(--nv-rule)" }}
              >
                <Target
                  size={28}
                  className="mx-auto mb-2.5"
                  style={{ color: "var(--nv-text-muted)" }}
                />
                <p className="text-sm font-semibold" style={{ color: "var(--nv-text)" }}>
                  No active goal protocol
                </p>
                <p
                  className="text-xs mt-1 mb-5 max-w-sm mx-auto"
                  style={{ color: "var(--nv-text-secondary)" }}
                >
                  Pick a physical skill or performance ladder to unlock daily autoregulated quests.
                </p>
                <button
                  type="button"
                  onClick={onOpenGoalStudio}
                  className="nv-btn-primary text-xs"
                >
                  Choose First Blueprint
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
