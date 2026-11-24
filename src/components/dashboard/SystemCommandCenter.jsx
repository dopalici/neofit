// src/components/dashboard/SystemCommandCenter.jsx
// Solo-Leveling inspired 60-Second Command Center grounded in Goal-Setting Science,
// Behavioral Psychology (WOOP + Rolling Consistency + SDT Competence), and Autoregulated Physiology.

import React, { useMemo, useState } from "react";
import {
  Activity,
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
import { normalizeUserGoals } from "../../services/goalEngineService";

const ZONE_STYLES = {
  PEAK: {
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
    dot: "bg-emerald-400",
    score: "text-emerald-300",
  },
  CALIBRATE: {
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    dot: "bg-amber-400",
    score: "text-amber-300",
  },
  RECOVER: {
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/40",
    dot: "bg-rose-400",
    score: "text-rose-300",
  },
  BASELINE: {
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/40",
    dot: "bg-cyan-400",
    score: "text-cyan-300",
  },
};

const INSIGHT_DOT = {
  positive: "bg-emerald-400",
  warning: "bg-amber-400",
  alert: "bg-rose-400",
  info: "bg-cyan-400",
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
  const zoneStyle = ZONE_STYLES[readiness?.zone] || ZONE_STYLES.BASELINE;

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
    <section className="space-y-5" aria-label="System Command Center">
      {/* Row 1: Operator Status Strip + Readiness Gate */}
      <div className="system-window rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          {/* Left: Hunter / Operator Rank & Consistency */}
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center shrink-0 ${
                progression?.rankAccent || "text-cyan-300 border-cyan-500 bg-cyan-950/60"
              }`}
            >
              <span className="text-2xl font-bold font-mono leading-none">
                {progression?.rank || "E"}
              </span>
              <span className="text-[9px] font-mono tracking-widest opacity-80 mt-0.5">
                RANK
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono tracking-wider text-cyan-400">
                  LEVEL {progression?.level || 1} · {progression?.rankTitle || "AWAKENED"}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs font-mono text-slate-300 flex items-center">
                  <Flame size={12} className="mr-1 text-amber-400" />
                  14D CONSISTENCY: {progression?.consistency14d ?? 0}%
                </span>
                {xpFlash && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {xpFlash}
                  </span>
                )}
              </div>

              {/* XP Progress Bar */}
              <div className="mt-2 max-w-md">
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>
                    {progression?.xp ?? 0} XP TOTAL
                  </span>
                  <span>
                    {progression?.xpIntoLevel ?? 0}/{progression?.xpForNextLevel ?? 120} TO LV{" "}
                    {(progression?.level || 1) + 1}
                    {progression?.nextRank
                      ? ` · ${progression.nextRank.xpRemaining} XP TO ${progression.nextRank.rank}-RANK`
                      : " · MAX RANK"}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-500"
                    style={{ width: `${Math.max(4, progression?.levelProgressPct ?? 0)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Physiological Readiness Gate */}
          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-4 py-2.5 flex items-center gap-3.5">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${zoneStyle.dot}`} />
                  <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                    READINESS · {readiness?.source || "NONE"}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className={`text-2xl font-bold font-mono tabular-nums ${zoneStyle.score}`}>
                    {readiness?.score !== null && readiness?.score !== undefined
                      ? readiness.score
                      : "--"}
                  </span>
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${zoneStyle.badge}`}>
                    {readiness?.label || "CALIBRATE READINESS"}
                  </span>
                </div>
              </div>

              {Array.isArray(readiness?.drivers) && readiness.drivers.length > 0 && (
                <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-800">
                  {readiness.drivers.slice(0, 3).map((d) => (
                    <div key={d.label} className="text-right">
                      <p className="text-[10px] font-mono text-slate-500 uppercase">{d.label}</p>
                      <p className="text-xs font-mono text-slate-200 tabular-nums">{d.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowReadinessDial((prev) => !prev)}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/60 text-slate-200 rounded-lg text-xs font-mono flex items-center transition-colors"
            >
              <SlidersHorizontal size={14} className="mr-1.5 text-cyan-400" />
              {readiness?.hasSubjectiveToday ? "UPDATE CHECK-IN" : "5S CHECK-IN"}
            </button>
          </div>
        </div>

        {/* Optional 5-Second Subjective Readiness Check-In Drawer */}
        {showReadinessDial && (
          <form
            onSubmit={handleSaveDial}
            className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
          >
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                SLEEP LAST NIGHT: <span className="text-cyan-300">{Number(dialSleep).toFixed(1)}h</span>
              </label>
              <input
                type="range"
                min="3"
                max="10.5"
                step="0.5"
                value={dialSleep}
                onChange={(e) => setDialSleep(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                ENERGY / CNS DRIVE (1–5)
              </label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setDialEnergy(n)}
                    className={`flex-1 py-1.5 rounded text-xs font-mono border ${
                      dialEnergy === n
                        ? "bg-cyan-500/25 border-cyan-400 text-cyan-200"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                SORENESS / FATIGUE (1 FRESH – 5 HIGH)
              </label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setDialSoreness(n)}
                    className={`flex-1 py-1.5 rounded text-xs font-mono border ${
                      dialSoreness === n
                        ? "bg-amber-500/25 border-amber-400 text-amber-200"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs font-mono rounded-lg transition-colors"
              >
                CALIBRATE (+15 XP)
              </button>
              <button
                type="button"
                onClick={() => setShowReadinessDial(false)}
                className="px-3 py-2 text-xs font-mono text-slate-400 hover:text-slate-200"
              >
                CLOSE
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Row 2: Literal 1-Glance Insights Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {literalInsights.map((insight) => (
          <div
            key={insight.id}
            className="bg-[#0b1520] border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-2.5"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    INSIGHT_DOT[insight.tone] || INSIGHT_DOT.info
                  }`}
                />
                <h3 className="text-xs font-semibold text-slate-100 leading-snug">
                  {insight.headline}
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{insight.body}</p>
            </div>

            <div className="flex items-center justify-between pt-1">
              {insight.kbRef && onOpenKnowledgeNote ? (
                <button
                  type="button"
                  onClick={() => onOpenKnowledgeNote(insight.kbRef)}
                  className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center"
                >
                  <BookOpen size={11} className="mr-1" />
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
                  className="text-[11px] font-mono text-slate-400 hover:text-cyan-300 flex items-center"
                >
                  <Sparkles size={11} className="mr-1 text-cyan-400" />
                  ASK COACH
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Row 3: 60-Second Daily Execution Workspace (Daily Quests + Skill Progression Tree) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Today's Daily Quests (5 cols) */}
        <div className="lg:col-span-5 system-window rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Activity size={16} className="text-cyan-400" />
                  TODAY’S SYSTEM QUESTS
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  3 clear actions auto-scaled to your readiness. Done in 60 seconds.
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-cyan-300 tabular-nums">
                {completedQuestCount}/{dailyQuests.length} DONE
              </span>
            </div>

            <div className="space-y-3">
              {dailyQuests.map((quest) => (
                <div
                  key={quest.id}
                  className={`rounded-xl border p-3.5 transition-all ${
                    quest.completed
                      ? "bg-emerald-950/20 border-emerald-800/60"
                      : "bg-slate-950/75 border-slate-800 hover:border-slate-700"
                  }`}
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
                      className="mt-0.5 shrink-0 text-cyan-400 hover:text-emerald-300 transition-colors"
                    >
                      {quest.completed ? (
                        <CheckCircle2 size={20} className="text-emerald-400" />
                      ) : (
                        <Circle size={20} className="text-slate-600 hover:text-cyan-400" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono tracking-wider text-cyan-400">
                            {quest.category}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                            {quest.badge}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-400 tabular-nums">
                          +{quest.xp} XP
                        </span>
                      </div>

                      <p
                        className={`text-sm font-medium leading-snug ${
                          quest.completed ? "line-through text-slate-400" : "text-slate-100"
                        }`}
                      >
                        {quest.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {quest.detail}
                      </p>

                      {quest.kbRef && onOpenKnowledgeNote && (
                        <button
                          type="button"
                          onClick={() => onOpenKnowledgeNote(quest.kbRef)}
                          className="mt-2 text-[11px] font-mono text-slate-400 hover:text-cyan-300 flex items-center"
                        >
                          <BookOpen size={11} className="mr-1 text-cyan-400" />
                          Why this works ({quest.kbRef})
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick AI Coach CTA */}
          {onAskCoach && (
            <button
              type="button"
              onClick={() =>
                onAskCoach(
                  "Review my readiness, active skill rung, and bottlenecks — what is the single highest-leverage thing I should nail today?"
                )
              }
              className="mt-4 w-full py-2.5 px-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 rounded-lg text-xs font-mono flex items-center justify-center transition-colors"
            >
              <Sparkles size={14} className="mr-2 text-cyan-400" />
              ASK GEMINI COACH FOR TODAY’S EXACT ADJUSTMENT
            </button>
          )}
        </div>

        {/* Right: Active Goal & Physical Skill Progression Tree (7 cols) */}
        <div className="lg:col-span-7 system-window rounded-2xl p-5 flex flex-col justify-between">
          <div>
            {/* Goal Switcher + Add Goal */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-cyan-400" />
                <h2 className="text-sm font-semibold text-slate-100">
                  GOAL & PHYSICAL SKILL LADDER
                </h2>
              </div>
              <button
                type="button"
                onClick={onOpenGoalStudio}
                className="px-3 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs font-mono rounded-lg flex items-center transition-colors"
              >
                <Plus size={14} className="mr-1" />
                NEW GOAL / SKILL
              </button>
            </div>

            {goalList.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {goalList.map((g) => {
                  const isSelected = activeGoal && g.id === activeGoal.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedGoalId(g.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono border flex items-center gap-2 transition-colors ${
                        isSelected
                          ? "bg-cyan-500/15 border-cyan-400 text-cyan-200"
                          : "bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span>{g.shortName || g.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-cyan-300 tabular-nums">
                        {g.progress}%
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {activeGoal && activeRung ? (
              <div className="space-y-4">
                {/* Horizontal Skill Rung Stepper */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {activeGoal.rungs.map((rung, idx) => {
                    const isPassed = completedRungsSet.has(rung.id);
                    const isCurrent = idx === activeGoal.currentRungIndex && !isPassed;
                    return (
                      <div
                        key={rung.id}
                        className={`p-2.5 rounded-lg border text-left ${
                          isPassed
                            ? "bg-emerald-950/30 border-emerald-700/60"
                            : isCurrent
                            ? "bg-cyan-950/50 border-cyan-400"
                            : "bg-slate-950/50 border-slate-800/80 opacity-65"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono text-slate-400">
                            R{idx + 1}
                          </span>
                          {isPassed ? (
                            <Check size={12} className="text-emerald-400" />
                          ) : isCurrent ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          ) : null}
                        </div>
                        <p className="text-[11px] font-medium text-slate-200 leading-tight line-clamp-2">
                          {rung.title}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Current Rung Execution Card */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono tracking-wider text-cyan-400 uppercase">
                        {isGoalFullyComplete
                          ? "PROTOCOL MASTERED"
                          : `ACTIVE RUNG ${activeGoal.currentRungIndex + 1} OF ${activeGoal.rungs.length}`}
                      </span>
                      <h3 className="text-base font-semibold text-slate-100 mt-0.5">
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
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-[#0b1520] border border-slate-800/90 rounded-lg p-3">
                      <p className="text-[10px] font-mono text-cyan-400 uppercase mb-1">
                        TARGET PRESCRIPTION
                      </p>
                      <p className="text-slate-200 leading-relaxed">{activeRung.prescription}</p>
                    </div>
                    <div className="bg-[#0b1520] border border-slate-800/90 rounded-lg p-3">
                      <p className="text-[10px] font-mono text-emerald-400 uppercase mb-1">
                        OBJECTIVE EXIT CRITERIA (UNLOCK NEXT RUNG)
                      </p>
                      <p className="text-slate-200 leading-relaxed">{activeRung.exitCriteria}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="flex items-start gap-2 text-slate-400">
                      <TrendingUp size={14} className="text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-200">Limiter:</strong>{" "}
                        {activeRung.limitingFactor}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-slate-400">
                      <Shield size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-200">WOOP Shield:</strong>{" "}
                        {activeGoal.woop?.fallbackPlan}
                      </span>
                    </div>
                  </div>

                  {/* Verified FitLib Evidence Links */}
                  {Array.isArray(activeRung.kbRefs) && activeRung.kbRefs.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">
                        VERIFIED FITLIB EVIDENCE:
                      </span>
                      {activeRung.kbRefs.map((refId) => (
                        <button
                          key={refId}
                          type="button"
                          onClick={() => onOpenKnowledgeNote && onOpenKnowledgeNote(refId)}
                          className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-300 flex items-center transition-colors"
                        >
                          <BookOpen size={10} className="mr-1" />
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
                      className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold flex items-center transition-colors ${
                        isGoalFullyComplete
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default"
                          : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                      }`}
                    >
                      <Award size={14} className="mr-1.5" />
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
                        className="px-3.5 py-2 rounded-lg text-xs font-mono bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-cyan-200 flex items-center transition-colors"
                      >
                        <Sparkles size={13} className="mr-1.5 text-cyan-400" />
                        COACH THIS RUNG
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
                <Target size={28} className="mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-medium text-slate-200">No active goal protocol</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Pick a physical skill or performance ladder to unlock daily autoregulated quests.
                </p>
                <button
                  type="button"
                  onClick={onOpenGoalStudio}
                  className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs font-mono rounded-lg"
                >
                  CHOOSE FIRST BLUEPRINT
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
