import React, { Suspense, lazy, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, CheckCircle2, Circle } from "lucide-react";
import ReadinessRing from "../ui/ReadinessRing";
import { computeReadinessAssessment } from "../../services/goalEngineService";

const LandingModelCanvas = lazy(() => import("../3d/LandingModelCanvas"));

const SKILL_LADDER_SAMPLE = [
  { rung: "01", title: "Wall Plank & Hollow Body", criteria: "60 s clean hollow line × 3 sets", status: "cleared" },
  { rung: "02", title: "Floor Pike Push-Up", criteria: "3 × 10 strict reps, full lockout", status: "cleared" },
  { rung: "03", title: "Box-Elevated Pike Push-Up", criteria: "3 × 8 controlled tempo (3-1-1)", status: "active" },
  { rung: "04", title: "Chest-to-Wall Eccentric HSPU", criteria: "5 × 3 five-second lowers", status: "locked" },
  { rung: "05", title: "Chest-to-Wall Strict HSPU", criteria: "3 × 5 full range, zero kip", status: "locked" },
  { rung: "06", title: "Freestanding Handstand Push-Up", criteria: "3 unbroken strict reps", status: "locked" },
];

const PROTOCOL_STAGES = [
  {
    step: "01",
    title: "Read your real recovery.",
    body: "Apple Health sleep stages, HRV, resting heart rate, and cardio workouts sync straight from your iPhone and Apple Watch.",
  },
  {
    step: "02",
    title: "Execute three clear quests.",
    body: "Daily volume scales up when biometrics peak and drops into a deload shield automatically when fatigue spikes.",
  },
  {
    step: "03",
    title: "Clear objective rungs.",
    body: "Every physical skill and race target breaks into measurable pass criteria linked to 576 audited sports-science guides.",
  },
];

const ZONE_META = {
  PEAK: { label: "Peak · Push Intensity", color: "var(--nv-matrix)" },
  CALIBRATE: { label: "Calibrate · Steady Work", color: "var(--nv-amber)" },
  RECOVER: { label: "Recover · Deload Shield", color: "var(--nv-rose)" },
  BASELINE: { label: "Baseline · Ready", color: "var(--nv-accent)" },
};

export default function LandingPage() {
  const navigate = useNavigate();

  // Interactive Readiness Simulator state (real physiological model, zero static mocks)
  const [simSleep, setSimSleep] = useState(7.8);
  const [simHrv, setSimHrv] = useState(64);
  const [checkedQuests, setCheckedQuests] = useState({ q1: true, q2: false, q3: false });
  const [specimenTab, setSpecimenTab] = useState("ladder");

  const simReadiness = useMemo(() => {
    const restingHr = Math.round(76 - (simHrv - 24) * 0.34);
    return computeReadinessAssessment(
      {
        source: "Apple HealthKit",
        sleep: { duration: simSleep },
        heartRateVariability: { current: simHrv },
        restingHeartRate: { current: Math.max(46, Math.min(82, restingHr)) },
        workouts: { data: [] },
      },
      { protein: { consumed: 135, goal: 145 } },
      {}
    );
  }, [simSleep, simHrv]);

  const simQuests = useMemo(() => {
    const isRecover = simReadiness.zone === "RECOVER";
    const isCalibrate = simReadiness.zone === "CALIBRATE";
    return [
      {
        id: "q1",
        tag: isRecover ? "Deload Shield" : isCalibrate ? "Technical" : "Primary Skill",
        title: isRecover
          ? "15 min scapular mobility & wrist prep (zero failure)"
          : isCalibrate
          ? "Box-Elevated Pike Push-Ups · 3 × 6 crisp reps (RPE 7)"
          : "Box-Elevated Pike Push-Ups · 4 × 8 full ROM (Rung 3/6)",
        xp: isRecover ? 35 : 50,
      },
      {
        id: "q2",
        tag: isRecover ? "Parasympathetic" : "Aerobic Base",
        title: isRecover
          ? "25 min Zone 1 walk outdoors (<118 bpm)"
          : "35 min Zone 2 run (132–144 bpm · Seiler 80/20)",
        xp: 40,
      },
      {
        id: "q3",
        tag: "Recovery Anchor",
        title: "Hit 145 g protein target & lights down 8 h before alarm",
        xp: 35,
      },
    ];
  }, [simReadiness.zone]);

  const simXp = useMemo(() => {
    const base = 310;
    const bonus = simQuests.reduce(
      (sum, q) => (checkedQuests[q.id] ? sum + q.xp : sum),
      0
    );
    return base + bonus;
  }, [checkedQuests, simQuests]);

  const zoneInfo = ZONE_META[simReadiness.zone] || ZONE_META.BASELINE;

  const handleStart = () => {
    navigate("/dashboard");
  };

  const toggleSimQuest = (id) => {
    setCheckedQuests((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="nv-app-shell nv-shell min-h-screen relative">
      {/* Minimal Edge-Aligned Top Navigation */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md safe-top"
        style={{
          backgroundColor: "color-mix(in oklab, var(--nv-bg) 86%, transparent)",
          borderColor: "var(--nv-rule)",
        }}
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
          <a
            href="#top"
            className="text-base font-bold tracking-wider"
            style={{ color: "var(--nv-text)" }}
          >
            NEO•VITRU
          </a>

          <nav
            aria-label="Landing Navigation"
            className="hidden md:flex items-center gap-8 text-sm"
            style={{ color: "var(--nv-text-secondary)" }}
          >
            <a href="#simulator" className="hover:text-white transition-colors">
              Readiness Gate
            </a>
            <a href="#protocol" className="hover:text-white transition-colors">
              Daily Loop
            </a>
            <a href="#specimen" className="hover:text-white transition-colors">
              Ladders & Cardio
            </a>
          </nav>

          <button
            type="button"
            onClick={handleStart}
            className="nv-btn-primary text-xs sm:text-sm"
            style={{ minHeight: "38px", padding: "0 1rem" }}
          >
            Open System
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* SECTION 1: FULL-BLEED EDITORIAL POSTER HERO */}
      <section
        id="top"
        className="relative min-h-[82vh] flex flex-col justify-between border-b"
        style={{ borderColor: "var(--nv-rule)" }}
      >
        {/* Dramatic architectural photograph with directional left scrim */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-black">
          <img
            src="/images/hero-athlete.jpg"
            alt="Athlete crouched at the starting blocks in dramatic monochrome rim light"
            className="w-full h-full object-cover object-[72%_center] sm:object-right opacity-85"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(95deg, oklch(12% 0.014 245 / 0.96) 0%, oklch(12% 0.014 245 / 0.84) 44%, oklch(12% 0.014 245 / 0.34) 76%, oklch(12% 0.014 245 / 0.18) 100%)",
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-40"
            style={{
              background:
                "linear-gradient(to top, var(--nv-bg) 0%, transparent 100%)",
            }}
          />
        </div>

        {/* Hero Copy (One screen, zero eyebrow pill, sharp contrast) */}
        <div className="relative z-10 mx-auto max-w-6xl w-full px-5 sm:px-8 pt-20 pb-14 lg:pt-28 lg:pb-16 nv-settle">
          <div className="max-w-xl space-y-6">
            <div>
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.04]"
                style={{ color: "#f1f5f9", letterSpacing: "-0.032em" }}
              >
                NeoVitru.
                <span className="block mt-1 font-normal" style={{ color: "var(--nv-accent)" }}>
                  Train by signal.
                </span>
              </h1>
              <p
                className="mt-4 text-base sm:text-lg font-medium"
                style={{ color: "#cbd5e1" }}
              >
                The Future of Human Enhancement.
              </p>
            </div>

            <p
              className="text-sm sm:text-base leading-relaxed max-w-md"
              style={{ color: "#9fb0c4" }}
            >
              Apple Health recovery signals and 576 audited sports-science guides, distilled into
              three clear daily quests you check off in sixty seconds.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={handleStart}
                className="nv-btn-primary px-6"
              >
                Begin Your Evolution
                <ArrowRight size={16} aria-hidden="true" />
              </button>
              <a
                href="#simulator"
                className="nv-btn-secondary"
                style={{ color: "#e2e8f0", borderColor: "rgba(226, 232, 240, 0.28)" }}
              >
                Test the Readiness Gate
              </a>
            </div>
          </div>
        </div>

        {/* Grounded factual specification bar parted by hairlines */}
        <div
          className="relative z-10 border-t"
          style={{
            borderColor: "rgba(148, 163, 184, 0.18)",
            backgroundColor: "color-mix(in oklab, var(--nv-bg) 82%, transparent)",
          }}
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-8 py-5 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x"
            style={{ borderColor: "var(--nv-rule)" }}
          >
            <div className="md:pr-6">
              <p className="nv-figure text-2xl sm:text-3xl font-semibold" style={{ color: "var(--nv-text)" }}>
                576
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--nv-text-muted)" }}>
                Audited FitLib science guides
              </p>
            </div>
            <div className="md:px-6" style={{ borderColor: "var(--nv-rule)" }}>
              <p className="nv-figure text-2xl sm:text-3xl font-semibold" style={{ color: "var(--nv-text)" }}>
                7
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--nv-text-muted)" }}>
                Skill & aerobic progression ladders
              </p>
            </div>
            <div className="md:px-6" style={{ borderColor: "var(--nv-rule)" }}>
              <p className="nv-figure text-2xl sm:text-3xl font-semibold" style={{ color: "var(--nv-text)" }}>
                60 s
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--nv-text-muted)" }}>
                Daily check-in to clear next step
              </p>
            </div>
            <div className="md:pl-6" style={{ borderColor: "var(--nv-rule)" }}>
              <p className="nv-figure text-2xl sm:text-3xl font-semibold" style={{ color: "var(--nv-text)" }}>
                Local
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--nv-text-muted)" }}>
                On-device Apple HealthKit & web storage
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: LIVE INTERACTIVE READINESS GATE (SHOW, DO NOT DESCRIBE) */}
      <section
        id="simulator"
        className="py-16 sm:py-24 border-b"
        style={{
          backgroundColor: "var(--nv-bg-elevated)",
          borderColor: "var(--nv-rule)",
        }}
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="max-w-2xl mb-10">
            <h2
              className="text-2xl sm:text-4xl font-semibold"
              style={{ color: "var(--nv-text)" }}
            >
              Drag your recovery. Watch today’s plan adapt.
            </h2>
            <p className="mt-3 text-sm sm:text-base" style={{ color: "var(--nv-text-secondary)" }}>
              This runs the exact autoregulation model inside the app. Drop sleep or HRV to see
              how the deload shield protects consistency instead of forcing junk volume.
            </p>
          </div>

          <div
            className="system-window rounded-xl grid grid-cols-1 lg:grid-cols-12 overflow-hidden"
          >
            {/* Left: Interactive Biometric Controls + SVG Readiness Ring */}
            <div
              className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between gap-8 lg:border-r"
              style={{ borderColor: "var(--nv-rule)" }}
            >
              <div className="flex items-center gap-5">
                <ReadinessRing
                  score={simReadiness.score}
                  zone={simReadiness.zone}
                  size={104}
                  strokeWidth={7}
                  label="SCORE"
                />
                <div className="min-w-0">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: zoneInfo.color }}
                  >
                    {zoneInfo.label}
                  </p>
                  <p
                    className="text-xs mt-1.5 leading-relaxed"
                    style={{ color: "var(--nv-text-secondary)" }}
                  >
                    {simReadiness.guidance ||
                      "Biometrics calibrated. Daily training volume scaled automatically."}
                  </p>
                </div>
              </div>

              <div className="space-y-6 pt-6 nv-rule-top">
                <div>
                  <div className="flex items-baseline justify-between text-sm mb-2.5">
                    <label
                      htmlFor="sim-sleep-slider"
                      className="font-medium"
                      style={{ color: "var(--nv-text)" }}
                    >
                      Sleep last night
                    </label>
                    <span
                      className="font-mono font-semibold tabular-nums"
                      style={{ color: "var(--nv-accent)" }}
                    >
                      {simSleep.toFixed(1)} h
                    </span>
                  </div>
                  <input
                    id="sim-sleep-slider"
                    type="range"
                    min="4.5"
                    max="9.5"
                    step="0.5"
                    value={simSleep}
                    onChange={(e) => setSimSleep(Number(e.target.value))}
                    className="nv-slider"
                  />
                  <div
                    className="flex justify-between text-[11px] mt-1.5 tabular-nums"
                    style={{ color: "var(--nv-text-muted)" }}
                  >
                    <span>4.5 h (sleep debt)</span>
                    <span>7.5 h</span>
                    <span>9.5 h</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between text-sm mb-2.5">
                    <label
                      htmlFor="sim-hrv-slider"
                      className="font-medium"
                      style={{ color: "var(--nv-text)" }}
                    >
                      Morning HRV (SDNN)
                    </label>
                    <span
                      className="font-mono font-semibold tabular-nums"
                      style={{ color: "var(--nv-accent)" }}
                    >
                      {simHrv} ms
                    </span>
                  </div>
                  <input
                    id="sim-hrv-slider"
                    type="range"
                    min="22"
                    max="90"
                    step="2"
                    value={simHrv}
                    onChange={(e) => setSimHrv(Number(e.target.value))}
                    className="nv-slider"
                  />
                  <div
                    className="flex justify-between text-[11px] mt-1.5 tabular-nums"
                    style={{ color: "var(--nv-text-muted)" }}
                  >
                    <span>22 ms (strained)</span>
                    <span>55 ms</span>
                    <span>90 ms</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Live Adapting Quests + Tactile Rank Bar */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 nv-rule-bottom">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm"
                      style={{
                        backgroundColor: "var(--nv-accent-soft)",
                        color: "var(--nv-accent)",
                        border: "1px solid var(--nv-border-strong)",
                      }}
                    >
                      C
                    </span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--nv-text)" }}>
                        Sample Operator · Level 6
                      </p>
                      <p className="text-xs tabular-nums" style={{ color: "var(--nv-text-muted)" }}>
                        {simXp} / 480 XP to B-Rank
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-mono tabular-nums"
                    style={{ color: "var(--nv-text-secondary)" }}
                  >
                    Tap a quest to test
                  </span>
                </div>

                {/* Hairline-divided interactive quests (zero nested boxes) */}
                <ul className="divide-y" style={{ borderColor: "var(--nv-rule)" }}>
                  {simQuests.map((quest) => {
                    const done = Boolean(checkedQuests[quest.id]);
                    return (
                      <li key={quest.id} style={{ borderColor: "var(--nv-rule)" }}>
                        <button
                          type="button"
                          onClick={() => toggleSimQuest(quest.id)}
                          className="w-full py-4 flex items-start justify-between gap-4 text-left transition-colors hover:opacity-95"
                        >
                          <span className="flex items-start gap-3.5 min-w-0">
                            {done ? (
                              <CheckCircle2
                                size={20}
                                className="shrink-0 mt-0.5"
                                style={{ color: "var(--nv-matrix)" }}
                              />
                            ) : (
                              <Circle
                                size={20}
                                className="shrink-0 mt-0.5"
                                style={{ color: "var(--nv-rule-2)" }}
                              />
                            )}
                            <span className="min-w-0">
                              <span
                                className="block text-xs font-medium mb-0.5"
                                style={{ color: zoneInfo.color }}
                              >
                                {quest.tag}
                              </span>
                              <span
                                className={`block text-sm font-medium leading-snug ${
                                  done ? "line-through opacity-55" : ""
                                }`}
                                style={{ color: "var(--nv-text)" }}
                              >
                                {quest.title}
                              </span>
                            </span>
                          </span>
                          <span
                            className="font-mono text-xs font-semibold shrink-0 tabular-nums pt-0.5"
                            style={{ color: done ? "var(--nv-matrix)" : "var(--nv-text-muted)" }}
                          >
                            +{quest.xp} XP
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Clean XP Track */}
              <div className="pt-4 nv-rule-top">
                <div
                  className="h-1.5 w-full rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--nv-surface-2)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.round((simXp / 480) * 100))}%`,
                      backgroundColor: "var(--nv-accent)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: RULED 3-STAGE DAILY LOOP (ZERO GENERIC ICON BENTO BOXES) */}
      <section id="protocol" className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="max-w-xl mb-12">
            <h2
              className="text-2xl sm:text-4xl font-semibold"
              style={{ color: "var(--nv-text)" }}
            >
              Built for focus, not screen time.
            </h2>
          </div>

          <div
            className="nv-rule-bar grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x"
            style={{ borderColor: "var(--nv-rule)" }}
          >
            {PROTOCOL_STAGES.map((item, idx) => (
              <div
                key={item.step}
                className={`py-8 md:py-10 ${
                  idx === 0 ? "md:pr-8" : idx === 1 ? "md:px-8" : "md:pl-8"
                }`}
                style={{ borderColor: "var(--nv-rule)" }}
              >
                <span
                  className="nv-figure block text-4xl sm:text-5xl font-light"
                  style={{ color: "var(--nv-accent)" }}
                >
                  {item.step}
                </span>
                <h3
                  className="mt-5 text-lg font-semibold"
                  style={{ color: "var(--nv-text)" }}
                >
                  {item.title}
                </h3>
                <p
                  className="mt-2.5 text-sm leading-relaxed"
                  style={{ color: "var(--nv-text-secondary)" }}
                >
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: INTERACTIVE SPECIMEN (SKILL LADDER / CARDIO ENGINE / 3D AVATAR) */}
      <section
        id="specimen"
        className="py-16 sm:py-24 border-t"
        style={{
          backgroundColor: "var(--nv-bg-elevated)",
          borderColor: "var(--nv-rule)",
        }}
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="max-w-xl">
              <h2
                className="text-2xl sm:text-4xl font-semibold"
                style={{ color: "var(--nv-text)" }}
              >
                Every goal reduced to measurable pass criteria.
              </h2>
              <p className="mt-2.5 text-sm sm:text-base" style={{ color: "var(--nv-text-secondary)" }}>
                Switch between a bodyweight skill ladder, the Apple Health cardio gap analyzer,
                or the optional interactive 3D biometric viewer.
              </p>
            </div>

            {/* Clean segmented switcher */}
            <div
              className="inline-flex rounded-lg p-1 self-start"
              style={{
                backgroundColor: "var(--nv-surface)",
                border: "1px solid var(--nv-rule)",
              }}
              role="tablist"
              aria-label="Product specimen views"
            >
              {[
                { id: "ladder", label: "Skill Ladder" },
                { id: "cardio", label: "Cardio Engine" },
                { id: "avatar", label: "3D Avatar" },
              ].map((tab) => {
                const active = specimenTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSpecimenTab(tab.id)}
                    className="px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: active ? "var(--nv-accent)" : "transparent",
                      color: active ? "var(--nv-accent-ink)" : "var(--nv-text-secondary)",
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {specimenTab === "ladder" && (
            <div className="system-window rounded-xl overflow-hidden">
              <div
                className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b"
                style={{ borderColor: "var(--nv-rule)" }}
              >
                <div>
                  <h3 className="text-base font-semibold" style={{ color: "var(--nv-text)" }}>
                    Strict Handstand Push-Up Ladder
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: "var(--nv-text-muted)" }}>
                    Objective exit criteria unlock the next rung. Linked to FitLib X9.
                  </p>
                </div>
                <span
                  className="text-xs font-mono font-semibold tabular-nums"
                  style={{ color: "var(--nv-accent)" }}
                >
                  Rung 3 of 6 active
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr
                      className="text-xs border-b"
                      style={{
                        color: "var(--nv-text-muted)",
                        borderColor: "var(--nv-rule)",
                      }}
                    >
                      <th className="py-3 pl-6 pr-4 font-medium w-16">Rung</th>
                      <th className="py-3 px-4 font-medium">Movement</th>
                      <th className="py-3 px-4 font-medium">Pass Criteria</th>
                      <th className="py-3 pl-4 pr-6 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--nv-rule)" }}>
                    {SKILL_LADDER_SAMPLE.map((row) => {
                      const isActive = row.status === "active";
                      const isCleared = row.status === "cleared";
                      return (
                        <tr
                          key={row.rung}
                          style={{
                            borderColor: "var(--nv-rule)",
                            backgroundColor: isActive ? "var(--nv-accent-soft)" : "transparent",
                          }}
                        >
                          <td
                            className="py-3.5 pl-6 pr-4 font-mono text-xs tabular-nums"
                            style={{ color: "var(--nv-text-muted)" }}
                          >
                            {row.rung}
                          </td>
                          <td
                            className="py-3.5 px-4 font-medium"
                            style={{ color: "var(--nv-text)" }}
                          >
                            {row.title}
                          </td>
                          <td
                            className="py-3.5 px-4 text-xs sm:text-sm"
                            style={{ color: "var(--nv-text-secondary)" }}
                          >
                            {row.criteria}
                          </td>
                          <td className="py-3.5 pl-4 pr-6 text-right text-xs font-medium">
                            {isCleared ? (
                              <span
                                className="inline-flex items-center gap-1"
                                style={{ color: "var(--nv-matrix)" }}
                              >
                                <Check size={13} /> Cleared
                              </span>
                            ) : isActive ? (
                              <span style={{ color: "var(--nv-accent)" }}>In focus</span>
                            ) : (
                              <span style={{ color: "var(--nv-text-muted)" }}>Upcoming</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {specimenTab === "cardio" && (
            <div className="system-window rounded-xl p-6 sm:p-8 space-y-8">
              <div className="flex flex-wrap items-baseline justify-between gap-4 pb-5 nv-rule-bottom">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: "var(--nv-text)" }}>
                    Sub-20 Minute 5K · Sample Telemetry Specimen
                  </h3>
                  <p className="text-xs mt-1" style={{ color: "var(--nv-text-muted)" }}>
                    Computes real VO2 max ceiling gap, Riegel race projection, Seiler 80/20 zone split, and ACWR injury guard from Apple Health runs.
                  </p>
                </div>
                <span
                  className="nv-figure text-3xl font-semibold"
                  style={{ color: "var(--nv-accent)" }}
                >
                  78%
                </span>
              </div>

              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x"
                style={{ borderColor: "var(--nv-rule)" }}
              >
                <div className="py-4 sm:py-0 sm:pr-6">
                  <p className="text-xs" style={{ color: "var(--nv-text-muted)" }}>VO2 Max Gap</p>
                  <p className="nv-figure text-3xl font-semibold mt-2" style={{ color: "var(--nv-text)" }}>
                    47.2 <span className="text-sm font-normal" style={{ color: "var(--nv-text-muted)" }}>/ 50</span>
                  </p>
                  <p className="text-xs mt-2" style={{ color: "var(--nv-text-secondary)" }}>
                    +2.8 ml/kg/min to ceiling
                  </p>
                </div>
                <div className="py-4 sm:py-0 sm:px-6" style={{ borderColor: "var(--nv-rule)" }}>
                  <p className="text-xs" style={{ color: "var(--nv-text-muted)" }}>Projected 5K</p>
                  <p className="nv-figure text-3xl font-semibold mt-2" style={{ color: "var(--nv-text)" }}>
                    21:00
                  </p>
                  <p className="text-xs mt-2" style={{ color: "var(--nv-text-secondary)" }}>
                    4:12 /km vs 4:00 /km target
                  </p>
                </div>
                <div className="py-4 sm:py-0 sm:px-6" style={{ borderColor: "var(--nv-rule)" }}>
                  <p className="text-xs" style={{ color: "var(--nv-text-muted)" }}>80/20 Polarized Split</p>
                  <p className="nv-figure text-3xl font-semibold mt-2" style={{ color: "var(--nv-matrix)" }}>
                    81%
                  </p>
                  <div className="h-1.5 w-full rounded-full overflow-hidden flex mt-3" style={{ backgroundColor: "var(--nv-surface-2)" }}>
                    <div style={{ width: "81%", backgroundColor: "var(--nv-matrix)" }} />
                    <div style={{ width: "9%", backgroundColor: "var(--nv-amber)" }} />
                    <div style={{ width: "10%", backgroundColor: "var(--nv-rose)" }} />
                  </div>
                </div>
                <div className="py-4 sm:py-0 sm:pl-6" style={{ borderColor: "var(--nv-rule)" }}>
                  <p className="text-xs" style={{ color: "var(--nv-text-muted)" }}>Acute : Chronic Load</p>
                  <p className="nv-figure text-3xl font-semibold mt-2" style={{ color: "var(--nv-text)" }}>
                    1.08×
                  </p>
                  <p className="text-xs mt-2" style={{ color: "var(--nv-matrix)" }}>
                    Sweet spot (0.8–1.3 safe band)
                  </p>
                </div>
              </div>
            </div>
          )}

          {specimenTab === "avatar" && (
            <div className="system-window rounded-xl overflow-hidden">
              <div className="h-[380px] sm:h-[440px]">
                <Suspense
                  fallback={
                    <div
                      className="h-full flex items-center justify-center text-sm"
                      style={{ color: "var(--nv-text-muted)" }}
                    >
                      Loading interactive 3D anatomy viewer...
                    </div>
                  }
                >
                  <LandingModelCanvas />
                </Suspense>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 5: CLOSING MAST & FOOTER */}
      <footer
        className="py-16 sm:py-20 border-t"
        style={{ borderColor: "var(--nv-rule)" }}
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 nv-rule-bottom">
            <div className="max-w-lg">
              <h2
                className="text-2xl sm:text-4xl font-semibold"
                style={{ color: "var(--nv-text)" }}
              >
                Open the System. Clear today’s three steps.
              </h2>
              <p className="mt-3 text-sm" style={{ color: "var(--nv-text-secondary)" }}>
                Runs directly in your browser and natively on iPhone XS through iPhone 16 with
                Apple HealthKit. Zero account wall.
              </p>
            </div>
            <button
              type="button"
              onClick={handleStart}
              className="nv-btn-primary px-7 self-start md:self-auto"
            >
              Open System
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>

          <div
            className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
            style={{ color: "var(--nv-text-muted)" }}
          >
            <span className="font-semibold tracking-wider" style={{ color: "var(--nv-text-secondary)" }}>
              NEO•VITRU
            </span>
            <span>Local-first biometrics · 576 FitLib guides · Built for Web & iOS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}