// src/services/goalEngineService.js
// Science-backed Goal Setting (Locke & Latham + WOOP/Implementation Intentions),
// Physical Skill Progression Ladders, Autoregulated Physiological Readiness,
// and Solo-Leveling System Progression (XP, Ranks, 14-Day Consistency, Daily Quests).

import { getFromStorage, saveToStorage } from "../utils/storageUtils";

export const SYSTEM_STATE_KEY = "system-progression-state";

export const SYSTEM_RANKS = [
  { rank: "E", title: "AWAKENED", minXp: 0, accent: "text-slate-300 border-slate-600 bg-slate-900" },
  { rank: "D", title: "DISCIPLINED", minXp: 250, accent: "text-sky-300 border-sky-600 bg-sky-950/60" },
  { rank: "C", title: "ADAPTIVE", minXp: 700, accent: "text-cyan-300 border-cyan-500 bg-cyan-950/60" },
  { rank: "B", title: "VANGUARD", minXp: 1500, accent: "text-emerald-300 border-emerald-500 bg-emerald-950/60" },
  { rank: "A", title: "ELITE", minXp: 3000, accent: "text-amber-300 border-amber-500 bg-amber-950/60" },
  { rank: "S", title: "APEX", minXp: 5500, accent: "text-rose-300 border-rose-400 bg-rose-950/60" },
];

/**
 * Curated evidence-based Goal & Physical Skill Blueprints.
 * Every kbRef maps to a verified node ID in public/knowledge-base.json (synced from dopalici/fitlibvault).
 */
export const GOAL_BLUEPRINTS = [
  {
    id: "handstand-pushup",
    name: "Freestanding Handstand Push-Up",
    shortName: "Handstand Push-Up",
    type: "strength",
    domain: "skill",
    tagline: "Vertical pushing strength + overhead scapular stability & balance",
    estimatedWeeks: 14,
    defaultWoop: {
      cue: "Right after my warm-up mobility flow, before heavy fatigue",
      obstacle: "Low energy or wrist/shoulder tightness after desk work",
      fallbackPlan: "Cut to 2 crisp technical sets at -1 rung and 3 min wrist prep",
    },
    rungs: [
      {
        id: "hspu-1",
        title: "Scapular Elevation & Pike Foundation",
        prescription: "3×8 Floor Pike Push-Ups (3s eccentric) + 3×30s Chest-to-Wall Hold",
        exitCriteria: "3×10 clean pike push-ups @ RPE ≤ 8 with stacked wrists/shoulders",
        limitingFactor: "Overhead shoulder flexion & wrist tolerance",
        kbRefs: ["X9-GYMNASTICS-CALISTHENICS", "EXL-83-BW-PUSHUP"],
      },
      {
        id: "hspu-2",
        title: "Box-Elevated Vertical Pike",
        prescription: "4×6 Feet-Elevated Pike Push-Ups (hips stacked over hands)",
        exitCriteria: "4×8 elevated pike reps with head traveling forward in tripod",
        limitingFactor: "Anterior deltoid force output & core anti-extension",
        kbRefs: ["X9-GYMNASTICS-CALISTHENICS", "B1-PROGRESSIVE-OVERLOAD"],
      },
      {
        id: "hspu-3",
        title: "Chest-to-Wall Eccentric Negatives",
        prescription: "4×3 Slow 5-second Wall HSPU Negatives (full ROM to mat)",
        exitCriteria: "4×4 controlled 5s eccentrics with zero lumbar arch breakdown",
        limitingFactor: "Eccentric triceps & upper-trap control at bottom position",
        kbRefs: ["X9-GYMNASTICS-CALISTHENICS", "B13-STRENGTH-TRAINING-GOALS"],
      },
      {
        id: "hspu-4",
        title: "Chest-to-Wall Strict Concentric HSPU",
        prescription: "5×2–4 Strict Chest-to-Wall HSPU (2–3 min full CNS rest)",
        exitCriteria: "3×5 strict full-ROM chest-to-wall HSPUs",
        limitingFactor: "Maximal vertical pressing force & sticking-point drive",
        kbRefs: ["B1-PROGRESSIVE-OVERLOAD", "B2-PROTEIN-REQUIREMENTS"],
      },
      {
        id: "hspu-5",
        title: "Deficit Wall HSPU + Balance Integration",
        prescription: "4×3 Parallettes Deficit Wall HSPU + 10 min Freestanding Balance",
        exitCriteria: "30s freestanding line + 3×3 deficit wall HSPUs",
        limitingFactor: "Fine fingertip balance corrections under high load",
        kbRefs: ["X9-GYMNASTICS-CALISTHENICS", "A26-PRINCIPLE-RECOVERY"],
      },
      {
        id: "hspu-6",
        title: "Freestanding Handstand Push-Up",
        prescription: "5×1–2 Freestanding HSPU Singles (fresh CNS, 3 min rest)",
        exitCriteria: "3 clean freestanding HSPU reps with controlled lockout",
        limitingFactor: "Motor coordination between press & center-of-mass drift",
        kbRefs: ["X9-GYMNASTICS-CALISTHENICS", "M1-RECOVERY-MODALITIES"],
      },
    ],
  },
  {
    id: "strict-muscle-up",
    name: "Strict Bar / Ring Muscle-Up",
    shortName: "Strict Muscle-Up",
    type: "strength",
    domain: "skill",
    tagline: "Explosive pulling, false-grip transition mechanics & straight-bar dip",
    estimatedWeeks: 12,
    defaultWoop: {
      cue: "At the start of upper-body sessions when CNS is fresh",
      obstacle: "Elbow tendon irritation or forearm pump from false grip",
      fallbackPlan: "Swap high-rep kipping for 3×15s low-ring false-grip hangs + band transitions",
    },
    rungs: [
      {
        id: "mu-1",
        title: "Strict Pulling & Dip Base",
        prescription: "4×6 Chest-to-Bar Pull-Ups + 4×8 Parallel Bar Dips",
        exitCriteria: "10 strict chest-to-bar pull-ups & 12 full-depth dips",
        limitingFactor: "Raw vertical pulling & pressing capacity",
        kbRefs: ["EXL-81-BW-PULLUP", "EXL-82-BW-DIP"],
      },
      {
        id: "mu-2",
        title: "False Grip & High-Pull Power",
        prescription: "5×3 Explosive High Pull-Ups (lower chest/navel) + 3×20s False Grip Hang",
        exitCriteria: "Bar clears sternum explosively on 3 consecutive reps",
        limitingFactor: "Rate of force development in lats & wrist flexor endurance",
        kbRefs: ["X9-GYMNASTICS-CALISTHENICS", "B13-STRENGTH-TRAINING-GOALS"],
      },
      {
        id: "mu-3",
        title: "Low-Bar / Ring Transition Mechanics",
        prescription: "4×5 Feet-Assisted Slow Transitions + 3×8 Straight-Bar Dips",
        exitCriteria: "Smooth zero-chicken-wing turnover with elbows tight",
        limitingFactor: "Internal shoulder rotation strength through transition dead-zone",
        kbRefs: ["X9-GYMNASTICS-CALISTHENICS", "EXL-82-BW-DIP"],
      },
      {
        id: "mu-4",
        title: "Negative Muscle-Up Control",
        prescription: "4×3 Slow 4-second Eccentric Transitions from Support to Hang",
        exitCriteria: "Controlled descent through transition without dropping",
        limitingFactor: "Tendon stiffness & transition path accuracy",
        kbRefs: ["B1-PROGRESSIVE-OVERLOAD", "A26-PRINCIPLE-RECOVERY"],
      },
      {
        id: "mu-5",
        title: "Strict Muscle-Up Singles",
        prescription: "5×1 Strict Muscle-Up (full 3-min ATP-PCr recovery between singles)",
        exitCriteria: "3 strict consecutive muscle-ups with full lockout",
        limitingFactor: "Seamless link between high pull, turnover, and dip drive",
        kbRefs: ["X9-GYMNASTICS-CALISTHENICS", "M1-RECOVERY-MODALITIES"],
      },
    ],
  },
  {
    id: "vertical-jump",
    name: "Explosive Vertical Jump (+6 in)",
    shortName: "Vertical Jump",
    type: "strength",
    domain: "skill",
    tagline: "Maximal lower-body force + reactive stretch-shortening cycle power",
    estimatedWeeks: 10,
    defaultWoop: {
      cue: "Before any heavy squats or conditioning, on a firm non-cushioned surface",
      obstacle: "Heavy legs or patellar tendon soreness from prior training",
      fallbackPlan: "Replace depth jumps with 3×4 submaximal pogo hops + isometric split-squat holds",
    },
    rungs: [
      {
        id: "vj-1",
        title: "Landing Mechanics & Squat Strength Base",
        prescription: "3×5 Box Jump + Stick Landing + 4×5 Back Squat @ RPE 7.5",
        exitCriteria: "Silent balanced landings & 1.5× BW back squat proficiency",
        limitingFactor: "Eccentric force absorption & maximal leg strength",
        kbRefs: ["X12", "EXL-01-BB-SQUAT"],
      },
      {
        id: "vj-2",
        title: "Concentric Power & Approach Timing",
        prescription: "4×4 Countermovement Jumps (max intent) + 3×4 Trap/Barbell Speed Pulls",
        exitCriteria: "+1.5 inch jump height over baseline test",
        limitingFactor: "Rate of force development & arm-swing timing",
        kbRefs: ["X12", "F10"],
      },
      {
        id: "vj-3",
        title: "Reactive Elasticity (Depth Drops & Pogos)",
        prescription: "4×5 Low-Box Depth Jumps (<0.25s ground contact) + 3×10 Ankle Pogos",
        exitCriteria: "Crisp reactive rebound with minimal knee valgus",
        limitingFactor: "Achilles/patellar tendon stiffness & SSC recoil",
        kbRefs: ["X11-5-SPRINT-PLYOMETRICS", "X12"],
      },
      {
        id: "vj-4",
        title: "Contrast Training (PAP Peak Power)",
        prescription: "4×(3 Heavy Squats @ 82% -> 2 min rest -> 4 Max Approach Jumps)",
        exitCriteria: "+4 inch verified vertical jump test improvement",
        limitingFactor: "CNS potentiation & rapid penultimate step braking",
        kbRefs: ["X12", "B13-STRENGTH-TRAINING-GOALS"],
      },
      {
        id: "vj-5",
        title: "Peak Taper & Vertical Test",
        prescription: "Volume -40%, keep 3×3 maximal crisp approach jumps + sleep ≥ 8h",
        exitCriteria: "Hit +6 inch target vertical jump height on test day",
        limitingFactor: "Fresh CNS readiness & supercompensation timing",
        kbRefs: ["F10", "F1-SLEEP-QUALITY"],
      },
    ],
  },
  {
    id: "pistol-squat",
    name: "Strict Pistol Squat (5×5/Leg)",
    shortName: "Pistol Squat",
    type: "strength",
    domain: "skill",
    tagline: "Single-leg strength, ankle dorsiflexion & hip flexor compression",
    estimatedWeeks: 8,
    defaultWoop: {
      cue: "During lower-body warm-up right after 2 min ankle mobilization",
      obstacle: "Tight ankles or hip-flexor cramping on the extended leg",
      fallbackPlan: "Elevate heel 2cm on a plate and do 3×6 assisted split/shrimp squats",
    },
    rungs: [
      {
        id: "ps-1",
        title: "Ankle Dorsiflexion & Split-Squat Base",
        prescription: "3×8 Rear-Foot Elevated Split Squats + 2×45s Knee-to-Wall Mobility",
        exitCriteria: "Knee passes toes >10cm cleanly & balanced 3×10 split squats",
        limitingFactor: "Ankle dorsiflexion range & glute medius stabilization",
        kbRefs: ["EXL-38-DB-SPLITSQUAT", "X9-GYMNASTICS-CALISTHENICS"],
      },
      {
        id: "ps-2",
        title: "Counterbalanced Box Pistol",
        prescription: "4×5 Single-Leg Squats to Knee-Height Box (holding 4kg plate forward)",
        exitCriteria: "Zero collapse onto box across 4×6/leg",
        limitingFactor: "Bottom-position knee stability & center of mass shift",
        kbRefs: ["EXL-38-DB-SPLITSQUAT", "B1-PROGRESSIVE-OVERLOAD"],
      },
      {
        id: "ps-3",
        title: "Heel-Elevated Full Eccentric Pistols",
        prescription: "4×4 Full-ROM 4s Negatives (2cm heel wedge) + 3×10s Seated Leg Lifts",
        exitCriteria: "Controlled descent to full depth & active straight-leg hold",
        limitingFactor: "Quad length-tension strength & hip flexor compression",
        kbRefs: ["X9-GYMNASTICS-CALISTHENICS", "A19-PRINCIPLE-OVERLOAD"],
      },
      {
        id: "ps-4",
        title: "Strict Flat-Foot Pistol Squat",
        prescription: "5×3 Strict Bodyweight Pistols per leg (full depth, pause 1s)",
        exitCriteria: "5×5 clean flat-foot pistol squats on both legs",
        limitingFactor: "Bilateral symmetry & bottom-end concentric drive",
        kbRefs: ["X9-GYMNASTICS-CALISTHENICS", "B13-STRENGTH-TRAINING-GOALS"],
      },
    ],
  },
  {
    id: "aerobic-velocity",
    name: "Sub-20 5K / VO2 Max Velocity",
    shortName: "Sub-20 5K / VO2",
    type: "endurance",
    domain: "endurance",
    tagline: "80/20 polarized aerobic base + VO2 max & lactate threshold intervals",
    estimatedWeeks: 12,
    defaultWoop: {
      cue: "Morning run window right after hydrating with 500ml water + electrolytes",
      obstacle: "Elevated resting heart rate (>+5 bpm) or heavy legs from poor sleep",
      fallbackPlan: "Convert intervals into a 30-min strict Zone 2 nasal-breathing aerobic run",
    },
    rungs: [
      {
        id: "run-1",
        title: "Aerobic Base & Cadence Efficiency",
        prescription: "3×35 min Zone 2 Easy Runs (65–75% HRmax) + 4×100m Strides",
        exitCriteria: "30 km/week pain-free with <5% cardiac drift in Zone 2",
        limitingFactor: "Mitochondrial density & lower-leg tissue tolerance",
        kbRefs: ["E1-AEROBIC-ANAEROBIC", "E6-RUNNING"],
      },
      {
        id: "run-2",
        title: "Lactate Threshold Cruise Intervals",
        prescription: "1×/wk 4×8 min @ Threshold Pace (RPE 7.5, 90s jog rest) + 80% Zone 2",
        exitCriteria: "Hold steady threshold pace across all 4 reps without HR spike",
        limitingFactor: "Lactate clearance rate at sustained race effort",
        kbRefs: ["E6-RUNNING", "X1-RUNNING"],
      },
      {
        id: "run-3",
        title: "VO2 Max 4-Minute Interval Block",
        prescription: "1×/wk 5×4 min @ 90–95% HRmax (3 min easy jog recovery)",
        exitCriteria: "VO2 max trend upward & consistent splits across reps 1–5",
        limitingFactor: "Maximal cardiac stroke volume & O2 extraction",
        kbRefs: ["E11-VO2MAX-TRAINING", "E3-HIIT"],
      },
      {
        id: "run-4",
        title: "Race-Pace 1K Repeats & Running Economy",
        prescription: "5×1000m @ Target 5K Pace (2 min rest) + 2×/wk light plyometrics",
        exitCriteria: "Hit 4:00/km (or target pace) cleanly across all 5×1K repeats",
        limitingFactor: "Neuromuscular running economy at target race velocity",
        kbRefs: ["X1-RUNNING", "X11-5-SPRINT-PLYOMETRICS"],
      },
      {
        id: "run-5",
        title: "10-Day Taper & 5K Time Trial",
        prescription: "Cut weekly mileage 40%, retain short sharp strides + carb-load 24h prior",
        exitCriteria: "Complete 5K time trial at or under target benchmark",
        limitingFactor: "Glycogen saturation, sleep debt & pacing discipline",
        kbRefs: ["E6-RUNNING", "F1-SLEEP-QUALITY"],
      },
    ],
  },
  {
    id: "strength-foundation",
    name: "2× Bodyweight Strength & Hypertrophy",
    shortName: "2× BW Strength",
    type: "strength",
    domain: "strength",
    tagline: "Compound progressive overload + 10–16 hard weekly sets & protein timing",
    estimatedWeeks: 16,
    defaultWoop: {
      cue: "Scheduled 4×/week lifting slot with workout template pre-loaded",
      obstacle: "Time crunch (<35 min available) or high workday stress",
      fallbackPlan: "Run Minimum Effective Dose: 2 top compound sets @ RPE 8 + 1 antagonist superset",
    },
    rungs: [
      {
        id: "str-1",
        title: "Technical Mastery & Volume Baseline",
        prescription: "3×8 Squat, Hinge, Push, Pull @ RPE 7 + 1.8g/kg daily protein",
        exitCriteria: "4 consecutive weeks logging 10+ quality sets/muscle group",
        limitingFactor: "Movement consistency & baseline protein adherence",
        kbRefs: ["B1-PROGRESSIVE-OVERLOAD", "B2-PROTEIN-REQUIREMENTS"],
      },
      {
        id: "str-2",
        title: "Hypertrophy Accumulation Block",
        prescription: "12–16 weekly sets/muscle in 6–12 rep range @ 1–2 RIR",
        exitCriteria: "Add +10% working weight or +2 reps across core compounds",
        limitingFactor: "Mechanical tension & recovery between sessions",
        kbRefs: ["B3-HYPERTROPHY", "B1-PROGRESSIVE-OVERLOAD"],
      },
      {
        id: "str-3",
        title: "Strength Intensification (3–5 Rep Phase)",
        prescription: "4×4 Squat & Deadlift @ 80–85% 1RM + 3 min rest intervals",
        exitCriteria: "1.5× BW Squat & 1.75× BW Deadlift with crisp bar speed",
        limitingFactor: "Motor unit recruitment & bracing stability",
        kbRefs: ["EXL-01-BB-SQUAT", "EXL-03-BB-DEADLIFT"],
      },
      {
        id: "str-4",
        title: "Peaking & 2× BW Benchmark",
        prescription: "Deload 1 week (-40% volume), then work up to verified top singles",
        exitCriteria: "Hit 2× BW Deadlift / target relative strength milestone",
        limitingFactor: "CNS freshness & fatigue dissipation",
        kbRefs: ["B13-STRENGTH-TRAINING-GOALS", "A26-PRINCIPLE-RECOVERY"],
      },
    ],
  },
  {
    id: "lean-recomp",
    name: "Lean Body Recomposition",
    shortName: "Lean Recomp",
    type: "nutrition",
    domain: "bodycomp",
    tagline: "Sustainable 300–450 kcal deficit, 2.0g/kg protein & resistance retention",
    estimatedWeeks: 12,
    defaultWoop: {
      cue: "Log breakfast & pre-plan evening protein anchor before 10:00 AM",
      obstacle: "Late-night cravings or social dining out",
      fallbackPlan: "Hit daily protein floor first + 15-min post-meal walk; return to target tomorrow",
    },
    rungs: [
      {
        id: "rec-1",
        title: "Protein Floor & Step Baseline",
        prescription: "Hit ≥1.8g/kg protein (4 feedings) + 8,500+ daily steps",
        exitCriteria: "10 of 14 days hitting protein floor & step baseline",
        limitingFactor: "Evening protein distribution & NEAT drop-off",
        kbRefs: ["C1-CALORIC-TARGETS", "B2-PROTEIN-REQUIREMENTS"],
      },
      {
        id: "rec-2",
        title: "Controlled Deficit + Strength Retention",
        prescription: "300–450 kcal deficit + 3×/wk compound strength training",
        exitCriteria: "0.4–0.7% bodyweight loss/week while maintaining lift numbers",
        limitingFactor: "Adherence consistency & hunger management",
        kbRefs: ["C26-NUTRITION-FAT-LOSS", "D1-WEIGHT-LOSS-PRINCIPLES"],
      },
      {
        id: "rec-3",
        title: "Metabolic & Diet-Break Consolidation",
        prescription: "1-week maintenance refeed after 6–8 weeks + sleep ≥ 7.5h",
        exitCriteria: "Stable energy, preserved strength & zero rebound bingeing",
        limitingFactor: "Sleep debt elevating ghrelin & lowering NEAT",
        kbRefs: ["D2-DIET-ADHERENCE", "F1-SLEEP-QUALITY"],
      },
      {
        id: "rec-4",
        title: "Maintenance Lock-In",
        prescription: "Raise calories to new TDEE while keeping 3×/wk resistance + steps",
        exitCriteria: "Weight stable within ±0.8kg for 3 weeks at new lean composition",
        limitingFactor: "Transitioning from diet rules to sustainable habits",
        kbRefs: ["N3-SUSTAINABLE-HABITS", "N9-MOTIVATION-ADHERENCE-STRATEGIES"],
      },
    ],
  },
];

export function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Create a structured Goal object from a Blueprint ID (or custom inputs).
 */
export function createGoalFromBlueprint(blueprintId, overrides = {}) {
  const blueprint = GOAL_BLUEPRINTS.find((b) => b.id === blueprintId) || GOAL_BLUEPRINTS[0];
  const today = new Date();
  const weeks = Number(overrides.estimatedWeeks || blueprint.estimatedWeeks || 12);
  const targetDate =
    overrides.targetDate ||
    new Date(today.getTime() + weeks * 7 * 86400000).toISOString().slice(0, 10);

  const rungs = overrides.rungs || blueprint.rungs;
  const completedRungs = Array.isArray(overrides.completedRungs) ? overrides.completedRungs : [];
  const currentRungIndex =
    typeof overrides.currentRungIndex === "number"
      ? Math.min(Math.max(0, overrides.currentRungIndex), Math.max(0, rungs.length - 1))
      : Math.min(completedRungs.length, Math.max(0, rungs.length - 1));

  return {
    id: overrides.id || `${blueprint.id}-${Date.now().toString(36)}`,
    blueprintId: blueprint.id,
    name: overrides.name || blueprint.name,
    shortName: overrides.shortName || blueprint.shortName,
    type: overrides.type || blueprint.type,
    domain: overrides.domain || blueprint.domain,
    tagline: overrides.tagline || blueprint.tagline,
    startDate: overrides.startDate || today.toISOString().slice(0, 10),
    targetDate,
    rungs,
    completedRungs,
    currentRungIndex,
    progress: rungs.length > 0 ? Math.round((completedRungs.length / rungs.length) * 100) : 0,
    woop: {
      cue: overrides.woop?.cue || blueprint.defaultWoop.cue,
      obstacle: overrides.woop?.obstacle || blueprint.defaultWoop.obstacle,
      fallbackPlan: overrides.woop?.fallbackPlan || blueprint.defaultWoop.fallbackPlan,
    },
  };
}

/**
 * Upgrade legacy simple goals ({ name, type, progress }) into structured Skill-Ladder goals
 * without losing any user data.
 */
export function normalizeUserGoals(rawGoals = {}) {
  if (!rawGoals || typeof rawGoals !== "object") return {};
  const normalized = {};

  Object.entries(rawGoals).forEach(([key, goal]) => {
    if (!goal || typeof goal !== "object") return;
    if (Array.isArray(goal.rungs) && goal.rungs.length > 0) {
      const completedCount = Array.isArray(goal.completedRungs) ? goal.completedRungs.length : 0;
      const computedProgress = Math.round((completedCount / goal.rungs.length) * 100);
      normalized[key] = {
        ...goal,
        id: goal.id || key,
        currentRungIndex: Math.min(
          goal.currentRungIndex ?? completedCount,
          goal.rungs.length - 1
        ),
        progress: computedProgress,
      };
      return;
    }

    // Map legacy goal keys/names to matching evidence-based blueprint
    const lower = `${key} ${goal.name || ""} ${goal.type || ""}`.toLowerCase();
    let matchedBlueprint = "strength-foundation";
    if (lower.includes("handstand") || lower.includes("inversion")) {
      matchedBlueprint = "handstand-pushup";
    } else if (lower.includes("muscle")) {
      matchedBlueprint = "strict-muscle-up";
    } else if (lower.includes("jump")) {
      matchedBlueprint = "vertical-jump";
    } else if (lower.includes("pistol")) {
      matchedBlueprint = "pistol-squat";
    } else if (lower.includes("mile") || lower.includes("5k") || lower.includes("endurance") || lower.includes("velocity")) {
      matchedBlueprint = "aerobic-velocity";
    } else if (lower.includes("fat") || lower.includes("recomp") || lower.includes("weight")) {
      matchedBlueprint = "lean-recomp";
    }

    const blueprint = GOAL_BLUEPRINTS.find((b) => b.id === matchedBlueprint) || GOAL_BLUEPRINTS[0];
    normalized[key] = createGoalFromBlueprint(blueprint.id, {
      id: key,
      name: goal.name || blueprint.name,
      type: goal.type || blueprint.type,
      startDate: goal.startDate,
      targetDate: goal.targetDate,
    });
  });

  return normalized;
}

/**
 * Load persisted Solo-Leveling progression state (XP, daily quests, subjective check-ins).
 */
export function getSystemState() {
  const defaultState = {
    xp: 0,
    completedQuestsByDate: {},
    subjectiveReadinessByDate: {},
    passedBenchmarks: [],
  };
  const saved = getFromStorage(SYSTEM_STATE_KEY, null);
  if (!saved || typeof saved !== "object") return defaultState;
  return {
    ...defaultState,
    ...saved,
    completedQuestsByDate: saved.completedQuestsByDate || {},
    subjectiveReadinessByDate: saved.subjectiveReadinessByDate || {},
    passedBenchmarks: Array.isArray(saved.passedBenchmarks) ? saved.passedBenchmarks : [],
  };
}

export function saveSystemState(nextState) {
  saveToStorage(SYSTEM_STATE_KEY, nextState);
  return nextState;
}

/**
 * Compute Hunter/Operator Rank, Level, XP progress, and 14-day Rolling Consistency %.
 * Rolling consistency prevents the "what-the-hell effect" when a single rest/sick day breaks a streak.
 */
export function computeProgressionSummary(systemState = getSystemState()) {
  const xp = Math.max(0, Number(systemState?.xp) || 0);
  const level = Math.floor(xp / 120) + 1;
  const xpIntoLevel = xp % 120;
  const xpForNextLevel = 120;

  let currentRank = SYSTEM_RANKS[0];
  let nextRank = SYSTEM_RANKS[1];
  for (let i = 0; i < SYSTEM_RANKS.length; i += 1) {
    if (xp >= SYSTEM_RANKS[i].minXp) {
      currentRank = SYSTEM_RANKS[i];
      nextRank = SYSTEM_RANKS[i + 1] || null;
    }
  }

  // Rolling 14-day consistency: % of days in the past 14 days with >= 1 completed quest
  const questsMap = systemState?.completedQuestsByDate || {};
  const today = new Date();
  let activeDaysLast14 = 0;
  for (let offset = 0; offset < 14; offset += 1) {
    const d = new Date(today.getTime() - offset * 86400000).toISOString().slice(0, 10);
    if (Array.isArray(questsMap[d]) && questsMap[d].length > 0) {
      activeDaysLast14 += 1;
    }
  }
  const consistency14d = Math.round((activeDaysLast14 / 14) * 100);

  return {
    xp,
    level,
    xpIntoLevel,
    xpForNextLevel,
    levelProgressPct: Math.round((xpIntoLevel / xpForNextLevel) * 100),
    rank: currentRank.rank,
    rankTitle: currentRank.title,
    rankAccent: currentRank.accent,
    nextRank: nextRank ? { rank: nextRank.rank, title: nextRank.title, xpRemaining: Math.max(0, nextRank.minXp - xp) } : null,
    consistency14d,
    activeDaysLast14,
  };
}

/**
 * Record a 5-second subjective readiness check-in for today (gives Day-1 autoregulation without Apple Watch).
 */
export function recordSubjectiveReadiness({ sleepHours, energy, soreness }) {
  const state = getSystemState();
  const today = getTodayIsoDate();
  const entry = {
    date: today,
    sleepHours: Math.max(2, Math.min(12, Number(sleepHours) || 7)),
    energy: Math.max(1, Math.min(5, Number(energy) || 3)),
    soreness: Math.max(1, Math.min(5, Number(soreness) || 2)), // 1 = fresh, 5 = wrecked
    recordedAt: new Date().toISOString(),
  };
  const alreadyCheckedIn = Boolean(state.subjectiveReadinessByDate[today]);
  const next = {
    ...state,
    xp: state.xp + (alreadyCheckedIn ? 0 : 15),
    subjectiveReadinessByDate: {
      ...state.subjectiveReadinessByDate,
      [today]: entry,
    },
  };
  return saveSystemState(next);
}

/**
 * Toggle a Daily Quest complete/incomplete for today and award/revert XP cleanly.
 */
export function toggleDailyQuest(questId, xpReward = 35) {
  const state = getSystemState();
  const today = getTodayIsoDate();
  const existing = Array.isArray(state.completedQuestsByDate[today])
    ? state.completedQuestsByDate[today]
    : [];
  const isAlreadyDone = existing.includes(questId);
  const updatedToday = isAlreadyDone
    ? existing.filter((id) => id !== questId)
    : [...existing, questId];

  const next = {
    ...state,
    xp: Math.max(0, state.xp + (isAlreadyDone ? -xpReward : xpReward)),
    completedQuestsByDate: {
      ...state.completedQuestsByDate,
      [today]: updatedToday,
    },
  };
  return saveSystemState(next);
}

/**
 * Mark a Goal's current skill rung as passed (objective benchmark met), advance to next rung, and award Milestone XP.
 */
export function advanceGoalRung(goals, goalId) {
  const normalized = normalizeUserGoals(goals);
  const goal = normalized[goalId];
  if (!goal || !Array.isArray(goal.rungs) || goal.rungs.length === 0) {
    return { updatedGoals: normalized, systemState: getSystemState(), xpAwarded: 0 };
  }

  const currentRung = goal.rungs[goal.currentRungIndex];
  if (!currentRung) {
    return { updatedGoals: normalized, systemState: getSystemState(), xpAwarded: 0 };
  }

  const completedSet = new Set(goal.completedRungs || []);
  const newlyCompleted = !completedSet.has(currentRung.id);
  completedSet.add(currentRung.id);
  const completedRungs = Array.from(completedSet);
  const nextIndex = Math.min(goal.rungs.length - 1, goal.currentRungIndex + 1);
  const progress = Math.round((completedRungs.length / goal.rungs.length) * 100);

  const updatedGoals = {
    ...normalized,
    [goalId]: {
      ...goal,
      completedRungs,
      currentRungIndex: nextIndex,
      progress,
    },
  };

  let systemState = getSystemState();
  const xpAwarded = newlyCompleted ? 120 : 0;
  if (xpAwarded > 0) {
    systemState = saveSystemState({
      ...systemState,
      xp: systemState.xp + xpAwarded,
      passedBenchmarks: [
        ...systemState.passedBenchmarks,
        {
          goalId,
          goalName: goal.shortName || goal.name,
          rungId: currentRung.id,
          rungTitle: currentRung.title,
          passedAt: new Date().toISOString(),
        },
      ],
    });
  }

  return { updatedGoals, systemState, xpAwarded };
}

/**
 * Compute physiological Readiness (0–100) + Autoregulation Zone from Apple Health / Imported Data
 * with transparent fallback to today's 5-second Subjective Check-In.
 */
export function computeReadinessAssessment(healthData, nutritionData, systemState = getSystemState()) {
  const today = getTodayIsoDate();
  const subjective = systemState?.subjectiveReadinessByDate?.[today] || null;

  const sleepHours =
    typeof healthData?.sleep?.duration === "number" && healthData.sleep.duration > 0
      ? healthData.sleep.duration
      : null;
  const hrv =
    typeof healthData?.heartRateVariability?.current === "number" &&
    healthData.heartRateVariability.current > 0
      ? healthData.heartRateVariability.current
      : null;
  const restingHr =
    typeof healthData?.restingHeartRate?.current === "number" &&
    healthData.restingHeartRate.current > 0
      ? healthData.restingHeartRate.current
      : typeof healthData?.heartRate?.min === "number" && healthData.heartRate.min > 0
      ? healthData.heartRate.min
      : null;

  const workoutsArr = Array.isArray(healthData?.workouts?.data) ? healthData.workouts.data : [];
  const sevenDaysAgo = Date.now() - 7 * 86400000;
  const recentWorkouts = workoutsArr.filter((w) => w?.date && new Date(w.date).getTime() >= sevenDaysAgo);
  const weeklyMinutes = recentWorkouts.reduce((sum, w) => sum + (Number(w.duration) || 0), 0);

  const proteinConsumed = Number(nutritionData?.protein?.consumed) || 0;
  const proteinGoal = Number(nutritionData?.protein?.goal) || 140;
  const proteinPct = proteinGoal > 0 ? Math.round((proteinConsumed / proteinGoal) * 100) : 0;

  const drivers = [];
  const weightedComponents = [];

  // 1. Objective Sleep (calibrated: <5h = severe deficit, 6-6.5h = moderate, >=7.5h = optimal)
  if (sleepHours !== null) {
    const sleepScore = Math.max(10, Math.min(100, Math.round(((sleepHours - 3.5) / 4.5) * 100)));
    weightedComponents.push({ score: sleepScore, weight: 0.4 });
    drivers.push({
      label: "Sleep",
      value: `${sleepHours.toFixed(1)}h`,
      status: sleepHours >= 7.2 ? "optimal" : sleepHours >= 6.0 ? "moderate" : "low",
    });
  }

  // 2. Objective HRV (calibrated: <30ms suppressed, 40-55ms moderate, >=65ms strong vagal tone)
  if (hrv !== null) {
    const hrvScore = Math.max(10, Math.min(100, Math.round(((hrv - 10) / 70) * 100)));
    weightedComponents.push({ score: hrvScore, weight: 0.35 });
    drivers.push({
      label: "HRV",
      value: `${Math.round(hrv)} ms`,
      status: hrv >= 55 ? "optimal" : hrv >= 38 ? "moderate" : "low",
    });
  }

  // 3. Objective Resting Heart Rate (calibrated: <=55 optimal, 60-70 moderate, >=75 elevated stress)
  if (restingHr !== null) {
    const rhrScore = Math.max(15, Math.min(100, Math.round(115 - (restingHr - 40) * 2.0)));
    weightedComponents.push({ score: rhrScore, weight: 0.25 });
    drivers.push({
      label: "Resting HR",
      value: `${Math.round(restingHr)} bpm`,
      status: restingHr <= 60 ? "optimal" : restingHr <= 72 ? "moderate" : "low",
    });
  }

  let source = "NONE";
  let score = null;

  if (weightedComponents.length > 0) {
    const totalWeight = weightedComponents.reduce((s, c) => s + c.weight, 0);
    score = Math.round(
      weightedComponents.reduce((s, c) => s + c.score * c.weight, 0) / totalWeight
    );
    // Fatigue penalty if extreme 7-day load without deload
    if (weeklyMinutes > 480) {
      score = Math.max(30, score - 8);
    }
    source = healthData?.source && healthData.source !== "none" ? healthData.source.toUpperCase() : "BIOMETRICS";
  } else if (subjective) {
    const subjSleep = Math.max(25, Math.min(100, Math.round((subjective.sleepHours / 8) * 100)));
    const subjEnergy = Math.round((subjective.energy / 5) * 100);
    const subjFreshness = Math.round(((6 - subjective.soreness) / 5) * 100);
    score = Math.round(subjSleep * 0.4 + subjEnergy * 0.35 + subjFreshness * 0.25);
    source = "SUBJECTIVE CHECK-IN";
    drivers.push(
      {
        label: "Sleep",
        value: `${subjective.sleepHours.toFixed(1)}h`,
        status: subjective.sleepHours >= 7 ? "optimal" : subjective.sleepHours >= 6 ? "moderate" : "low",
      },
      {
        label: "Energy",
        value: `${subjective.energy}/5`,
        status: subjective.energy >= 4 ? "optimal" : subjective.energy >= 3 ? "moderate" : "low",
      },
      {
        label: "Freshness",
        value: `${6 - subjective.soreness}/5`,
        status: subjective.soreness <= 2 ? "optimal" : subjective.soreness <= 3 ? "moderate" : "low",
      }
    );
  }

  // Add 7d Load driver if workouts exist
  if (recentWorkouts.length > 0) {
    drivers.push({
      label: "7d Load",
      value: `${recentWorkouts.length} sess · ${Math.round(weeklyMinutes)}m`,
      status: weeklyMinutes > 480 ? "moderate" : "optimal",
    });
  }

  let zone = "BASELINE";
  let label = "CALIBRATE READINESS";
  let volumeModifier = 0.85;
  let intensityGuidance =
    "Sync Apple Health or take a 5-second Readiness Check-In so the System can autoregulate today's training dose.";

  if (score !== null) {
    if (score >= 75) {
      zone = "PEAK";
      label = "GREEN · PUSH & PROGRESS";
      volumeModifier = 1.0;
      intensityGuidance =
        "High CNS & recovery readiness. Full prescribed volume + progressive overload or new skill benchmark attempt.";
    } else if (score >= 50) {
      zone = "CALIBRATE";
      label = "AMBER · SKILL & QUALITY";
      volumeModifier = 0.75;
      intensityGuidance =
        "Moderate recovery. Cut working volume ~25%, keep crisp technical skill sets @ RPE 6–7, and prioritize sleep/protein.";
    } else {
      zone = "RECOVER";
      label = "RED · DELOAD & RESTORE";
      volumeModifier = 0.4;
      intensityGuidance =
        "Low physiological readiness. Skip high-CNS maximal attempts; execute 25-min Zone 2 walk, mobility, and sleep restoration.";
    }
  }

  // Identify #1 real bottleneck
  let bottleneck = null;
  if ((sleepHours !== null && sleepHours < 6.5) || (subjective && subjective.sleepHours < 6.5)) {
    const hrs = sleepHours ?? subjective.sleepHours;
    bottleneck = {
      type: "sleep",
      title: `Sleep debt (${hrs.toFixed(1)}h last night)`,
      action: "Set a 45-min pre-bed screen cutoff tonight to restore HRV & motor consolidation.",
      kbRef: "F1-SLEEP-QUALITY",
    };
  } else if (hrv !== null && hrv < 38) {
    bottleneck = {
      type: "hrv",
      title: `Suppressed HRV (${Math.round(hrv)} ms)`,
      action: "Autonomic fatigue detected — swap maximal sets for submaximal technique + nasal Zone 2.",
      kbRef: "M1-RECOVERY-MODALITIES",
    };
  } else if (proteinGoal > 0 && proteinConsumed > 0 && proteinPct < 75) {
    const gap = Math.max(15, Math.round(proteinGoal - proteinConsumed));
    bottleneck = {
      type: "protein",
      title: `Protein gap (-${gap}g to target)`,
      action: `Add a ${Math.min(45, gap)}g protein feeding (0.4g/kg) to maximize muscle protein synthesis.`,
      kbRef: "B2-PROTEIN-REQUIREMENTS",
    };
  } else if (proteinConsumed === 0 && score !== null) {
    bottleneck = {
      type: "protein",
      title: `Fueling unlogged (0/${proteinGoal}g protein)`,
      action: `Anchor at least ${Math.round(proteinGoal / 3)}g protein at your next meal to protect lean tissue.`,
      kbRef: "B2-PROTEIN-REQUIREMENTS",
    };
  } else if (weeklyMinutes === 0) {
    bottleneck = {
      type: "stimulus",
      title: "No training session logged in 7 days",
      action: "Use the 10-minute minimum effective dose to restart neuromuscular adaptation today.",
      kbRef: "N3-SUSTAINABLE-HABITS",
    };
  }

  return {
    score,
    zone,
    label,
    source,
    volumeModifier,
    intensityGuidance,
    drivers,
    bottleneck,
    weeklyWorkouts: recentWorkouts.length,
    weeklyMinutes: Math.round(weeklyMinutes),
    proteinPct,
    proteinGap: Math.max(0, Math.round(proteinGoal - proteinConsumed)),
    hasSubjectiveToday: Boolean(subjective),
  };
}

/**
 * Generate today's 3 Solo-Leveling Daily Quests, scientifically autoregulated by Readiness + Active Goal Rung.
 */
export function generateDailyQuests(goals, readiness, nutritionData, systemState = getSystemState()) {
  const normalized = normalizeUserGoals(goals);
  const goalList = Object.values(normalized);
  const primaryGoal = goalList[0] || createGoalFromBlueprint("handstand-pushup");
  const activeRung =
    primaryGoal.rungs?.[primaryGoal.currentRungIndex] || primaryGoal.rungs?.[0];

  const today = getTodayIsoDate();
  const completedIds = Array.isArray(systemState?.completedQuestsByDate?.[today])
    ? systemState.completedQuestsByDate[today]
    : [];

  // Quest 1: Goal-specific skill/training quest scaled by Readiness Zone
  let q1Title = `${primaryGoal.shortName || primaryGoal.name}: ${activeRung?.title || "Core Session"}`;
  let q1Detail = activeRung?.prescription || "Complete your scheduled progression session.";
  let q1Badge = "FULL DOSE";
  let q1KbRef = activeRung?.kbRefs?.[0] || "B1-PROGRESSIVE-OVERLOAD";

  if (readiness.zone === "CALIBRATE") {
    q1Badge = "AUTOREGULATED -25%";
    q1Detail = `${primaryGoal.woop?.fallbackPlan || "Cut 1–2 sets & focus on crisp RPE 6–7 technique"} (Base: ${activeRung?.prescription})`;
  } else if (readiness.zone === "RECOVER") {
    q1Badge = "DELOAD SHIELD";
    q1Title = `CNS Recovery Protocol (${primaryGoal.shortName || primaryGoal.name})`;
    q1Detail = "25-min Zone 2 walk + 10 min joint mobility for target joints. Zero maximal efforts today.";
    q1KbRef = "M4-ACTIVE-RECOVERY";
  }

  // Quest 2: Physiological Bottleneck (Protein / Sleep / Hydration)
  const proteinGoal = Number(nutritionData?.protein?.goal) || 140;
  const proteinConsumed = Number(nutritionData?.protein?.consumed) || 0;
  const waterGoal = Number(nutritionData?.water?.goal) || 3;
  const waterConsumed = Number(nutritionData?.water?.consumed) || 0;

  let q2 = {
    id: `quest-physio-${today}`,
    category: "PHYSIOLOGY",
    title: `Hit Daily Protein Floor (${proteinConsumed}/${proteinGoal}g)`,
    detail: `Distribute ~${Math.round(proteinGoal / 4)}g across 4 meals to sustain muscle protein synthesis.`,
    xp: 35,
    badge: "RECOVERY FUEL",
    kbRef: "B2-PROTEIN-REQUIREMENTS",
  };

  if (readiness.bottleneck?.type === "sleep") {
    q2 = {
      id: `quest-physio-${today}`,
      category: "RECOVERY",
      title: "Restore Sleep Architecture (Target 7.5–8.5h)",
      detail: readiness.bottleneck.action,
      xp: 40,
      badge: "PRIORITY FIX",
      kbRef: "F1-SLEEP-QUALITY",
    };
  } else if (proteinConsumed >= proteinGoal * 0.85 && waterConsumed < waterGoal) {
    q2 = {
      id: `quest-physio-${today}`,
      category: "HYDRATION",
      title: `Complete Hydration Target (${waterConsumed.toFixed(1)}/${waterGoal}L)`,
      detail: "Even 2% dehydration degrades neuromuscular power and cognitive focus.",
      xp: 30,
      badge: "CELLULAR",
      kbRef: "M1-RECOVERY-MODALITIES",
    };
  }

  // Quest 3: Behavioral Execution Anchor (Implementation Intention / WOOP)
  const q3 = {
    id: `quest-anchor-${today}`,
    category: "EXECUTION",
    title: "Execute If-Then Trigger & Log 1 Signal",
    detail: `Trigger: "${primaryGoal.woop?.cue || "Start with a 5-minute warm-up at your scheduled window"}" — log your workout or readiness check-in.`,
    xp: 25,
    badge: "WOOP ANCHOR",
    kbRef: "N3-SUSTAINABLE-HABITS",
  };

  const rawQuests = [
    {
      id: `quest-primary-${primaryGoal.id}-${today}`,
      category: primaryGoal.domain === "skill" ? "SKILL QUEST" : "TRAINING QUEST",
      title: q1Title,
      detail: q1Detail,
      xp: readiness.zone === "PEAK" ? 50 : 40,
      badge: q1Badge,
      kbRef: q1KbRef,
      goalId: primaryGoal.id,
    },
    q2,
    q3,
  ];

  return rawQuests.map((q) => ({
    ...q,
    completed: completedIds.includes(q.id),
  }));
}

/**
 * Generate 2–3 high-signal, plain-English Literal Insights readable in <5 seconds.
 */
export function generateLiteralInsights(goals, readiness, nutritionData, progression) {
  const insights = [];
  const normalized = normalizeUserGoals(goals);
  const primaryGoal = Object.values(normalized)[0];
  const activeRung = primaryGoal?.rungs?.[primaryGoal.currentRungIndex];

  // 1. Physiological Readiness Verdict
  if (readiness.score !== null) {
    insights.push({
      id: "readiness-verdict",
      tone: readiness.zone === "PEAK" ? "positive" : readiness.zone === "CALIBRATE" ? "warning" : "alert",
      headline: `Readiness ${readiness.score}/100 (${readiness.zone})`,
      body: readiness.intensityGuidance,
    });
  } else {
    insights.push({
      id: "readiness-calibrate",
      tone: "info",
      headline: "No biometrics synced yet — 5s check-in unlocks autoregulation",
      body: "Connect Apple Health on iOS, upload an export, or tap Calibrate Readiness above for instant daily dose scaling.",
    });
  }

  // 2. #1 Real Bottleneck
  if (readiness.bottleneck) {
    insights.push({
      id: "top-bottleneck",
      tone: "warning",
      headline: `Bottleneck: ${readiness.bottleneck.title}`,
      body: readiness.bottleneck.action,
      kbRef: readiness.bottleneck.kbRef,
    });
  }

  // 3. Skill / Momentum Insight
  if (primaryGoal && activeRung) {
    insights.push({
      id: "next-milestone",
      tone: "positive",
      headline: `Next Unlock (${primaryGoal.shortName || primaryGoal.name} · Rung ${primaryGoal.currentRungIndex + 1}/${primaryGoal.rungs.length})`,
      body: `Exit benchmark: ${activeRung.exitCriteria}. 14-day consistency: ${progression.consistency14d}%.`,
      kbRef: activeRung.kbRefs?.[0],
    });
  }

  return insights.slice(0, 3);
}

/**
 * Compress Apple Health + Readiness + Goals + Current Rungs + Nutrition into a ~160-token JSON brief
 * for ultra-cheap, high-precision Gemini 2.5 Flash / Flash-Lite coaching.
 */
export function buildAITelemetryBrief({ healthData, nutritionData, goals, readiness, progression }) {
  const normalized = normalizeUserGoals(goals);
  const compactGoals = Object.values(normalized).slice(0, 3).map((g) => {
    const rung = g.rungs?.[g.currentRungIndex];
    return {
      goal: g.shortName || g.name,
      domain: g.domain || g.type,
      progressPct: g.progress,
      rung: rung ? `${g.currentRungIndex + 1}/${g.rungs.length}: ${rung.title}` : "N/A",
      exitCriteria: rung?.exitCriteria || null,
      limitingFactor: rung?.limitingFactor || null,
      woopFallback: g.woop?.fallbackPlan || null,
    };
  });

  return {
    rank: `${progression?.rank || "E"}-Rank (Lv ${progression?.level || 1}, 14d consistency ${progression?.consistency14d ?? 0}%)`,
    readiness: {
      score: readiness?.score ?? null,
      zone: readiness?.zone || "BASELINE",
      source: readiness?.source || "NONE",
      volumeModifier: readiness?.volumeModifier ?? 1.0,
      bottleneck: readiness?.bottleneck?.title || null,
    },
    biometrics: {
      restingHR: healthData?.restingHeartRate?.current ?? healthData?.heartRate?.min ?? null,
      hrvMs: healthData?.heartRateVariability?.current ?? null,
      vo2Max: healthData?.vo2Max?.current ?? null,
      sleepHrs: healthData?.sleep?.duration ?? null,
      stepsToday: healthData?.steps?.today ?? null,
      weightKg: healthData?.weight?.current ?? null,
      weeklyWorkouts: readiness?.weeklyWorkouts ?? 0,
      weeklyWorkoutMin: readiness?.weeklyMinutes ?? 0,
    },
    nutrition: nutritionData
      ? {
          kcal: `${nutritionData.calories?.consumed ?? 0}/${nutritionData.calories?.goal ?? 2200}`,
          proteinG: `${nutritionData.protein?.consumed ?? 0}/${nutritionData.protein?.goal ?? 140}`,
          waterL: `${nutritionData.water?.consumed ?? 0}/${nutritionData.water?.goal ?? 3}`,
        }
      : null,
    activeGoals: compactGoals,
  };
}
