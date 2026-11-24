// src/services/aerobicGoalService.js
// Apple Health Workout -> Aerobic Fitness / Cardio Goal Gap Analysis Engine.
// Maps real Apple Health workouts, HR samples, VO2 max, and resting HR against
// quantitative cardio goals and prescribes next steps grounded in FitLib Vault.

import { getFromStorage, saveToStorage } from "../utils/storageUtils";

export const AEROBIC_GOAL_STORAGE_KEY = "aerobic-cardio-goal";

export const AEROBIC_GOAL_PRESETS = [
  {
    id: "sub20-5k",
    name: "Sub-20 Minute 5K",
    shortName: "Sub-20 5K",
    distanceKm: 5,
    targetTimeMin: 20,
    targetPaceMinPerKm: 4.0,
    targetVo2Max: 50.0,
    targetWeeklyMinutes: 180,
    targetWeeklyKm: 32,
    targetWeeklySessions: 4,
    targetLongSessionMin: 55,
    targetEasyPct: 80,
    targetHardSessionsPerWeek: 1,
    description: "4:00/km pace · ~50 ml/kg/min VO2 max · 80/20 polarized running base",
  },
  {
    id: "sub25-5k",
    name: "Sub-25 Minute 5K",
    shortName: "Sub-25 5K",
    distanceKm: 5,
    targetTimeMin: 25,
    targetPaceMinPerKm: 5.0,
    targetVo2Max: 41.5,
    targetWeeklyMinutes: 135,
    targetWeeklyKm: 20,
    targetWeeklySessions: 3,
    targetLongSessionMin: 40,
    targetEasyPct: 80,
    targetHardSessionsPerWeek: 1,
    description: "5:00/km pace · ~41.5 ml/kg/min VO2 max · consistent 3×/wk aerobic base",
  },
  {
    id: "sub45-10k",
    name: "Sub-45 Minute 10K",
    shortName: "Sub-45 10K",
    distanceKm: 10,
    targetTimeMin: 45,
    targetPaceMinPerKm: 4.5,
    targetVo2Max: 47.5,
    targetWeeklyMinutes: 210,
    targetWeeklyKm: 38,
    targetWeeklySessions: 4,
    targetLongSessionMin: 70,
    targetEasyPct: 80,
    targetHardSessionsPerWeek: 1,
    description: "4:30/km pace · strong lactate threshold + 70-min aerobic long run",
  },
  {
    id: "half-marathon",
    name: "Sub-1:45 Half Marathon",
    shortName: "Sub-1:45 HM",
    distanceKm: 21.1,
    targetTimeMin: 105,
    targetPaceMinPerKm: 4.98,
    targetVo2Max: 46.0,
    targetWeeklyMinutes: 240,
    targetWeeklyKm: 42,
    targetWeeklySessions: 4,
    targetLongSessionMin: 90,
    targetEasyPct: 82,
    targetHardSessionsPerWeek: 1,
    description: "4:58/km pace · aerobic durability + 90-min sustained Zone 2 long run",
  },
  {
    id: "vo2-elite",
    name: "VO2 Max 55+ Apex Longevity",
    shortName: "VO2 Max 55+",
    distanceKm: 5,
    targetTimeMin: 18.5,
    targetPaceMinPerKm: 3.7,
    targetVo2Max: 55.0,
    targetWeeklyMinutes: 210,
    targetWeeklyKm: 30,
    targetWeeklySessions: 4,
    targetLongSessionMin: 60,
    targetEasyPct: 80,
    targetHardSessionsPerWeek: 2,
    description: "Top-tier cardiorespiratory ceiling · 160m Zone 2 + 1–2 Norwegian 4×4 blocks",
  },
  {
    id: "aerobic-base",
    name: "Aerobic Base (150m/wk Zone 2)",
    shortName: "Base 150m/wk",
    distanceKm: 5,
    targetTimeMin: 27.5,
    targetPaceMinPerKm: 5.5,
    targetVo2Max: 42.0,
    targetWeeklyMinutes: 150,
    targetWeeklyKm: 18,
    targetWeeklySessions: 3,
    targetLongSessionMin: 45,
    targetEasyPct: 85,
    targetHardSessionsPerWeek: 1,
    description: "WHO/ACSM gold-standard aerobic foundation · mitochondrial & cardiac efficiency",
  },
];

const CARDIO_KEYWORDS = [
  "run",
  "jog",
  "cycle",
  "cycling",
  "bike",
  "swim",
  "row",
  "elliptical",
  "stair",
  "hiit",
  "interval",
  "cardio",
  "walk",
  "hike",
  "hiking",
  "cross_country",
  "skierg",
  "jump_rope",
  "endurance",
  "treadmill",
  "track",
];

const RUNNING_KEYWORDS = ["run", "jog", "treadmill", "track", "marathon", "5k", "10k"];
const HIGH_INTENSITY_KEYWORDS = ["hiit", "interval", "sprint", "vo2", "tabata", "tempo", "threshold"];
const EASY_KEYWORDS = ["walk", "hike", "liss", "zone 2", "zone2", "easy", "recovery"];

export function getSavedAerobicGoalId() {
  const saved = getFromStorage(AEROBIC_GOAL_STORAGE_KEY, null);
  if (saved && AEROBIC_GOAL_PRESETS.some((g) => g.id === saved)) {
    return saved;
  }
  return "sub20-5k";
}

export function saveAerobicGoalId(goalId) {
  if (AEROBIC_GOAL_PRESETS.some((g) => g.id === goalId)) {
    saveToStorage(AEROBIC_GOAL_STORAGE_KEY, goalId);
    return goalId;
  }
  return getSavedAerobicGoalId();
}

export function getAerobicGoalPreset(goalId) {
  return (
    AEROBIC_GOAL_PRESETS.find((g) => g.id === goalId) ||
    AEROBIC_GOAL_PRESETS[0]
  );
}

/**
 * Clean Apple Health activity names like "HKWorkoutActivityTypeRunning" -> "Running"
 */
export function formatWorkoutActivityLabel(rawType = "") {
  const cleaned = String(rawType || "Workout")
    .replace(/^HKWorkoutActivityType/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
  return cleaned || "Cardio Workout";
}

export function isCardioWorkout(workout) {
  if (!workout) return false;
  const descriptor = `${workout.type || ""} ${workout.name || ""}`.toLowerCase();
  if (CARDIO_KEYWORDS.some((kw) => descriptor.includes(kw))) return true;
  // Also count any session with meaningful distance recorded (>= 0.5 km)
  const distKm = normalizeDistanceKm(workout);
  return distKm !== null && distKm >= 0.5;
}

export function isRunningWorkout(workout) {
  if (!workout) return false;
  const descriptor = `${workout.type || ""} ${workout.name || ""}`.toLowerCase();
  return RUNNING_KEYWORDS.some((kw) => descriptor.includes(kw));
}

export function normalizeDurationMinutes(workout) {
  const raw = Number(workout?.duration);
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  const unit = String(workout?.unit || "minutes").toLowerCase();
  if (unit.startsWith("s")) {
    // Guard against legacy Apple Health XML exports that labeled minutes as "seconds"
    return raw > 180 ? raw / 60 : raw;
  }
  if (unit.startsWith("h")) return raw * 60;
  return raw;
}

export function normalizeDistanceKm(workout) {
  const raw = Number(workout?.distance ?? workout?.distanceKm);
  if (!Number.isFinite(raw) || raw <= 0) return null;
  const unit = String(workout?.distanceUnit || "").toLowerCase();
  if (unit === "mi" || unit === "mile" || unit === "miles") {
    return Number((raw * 1.60934).toFixed(2));
  }
  if (unit === "m" || unit === "meter" || unit === "meters" || (!unit && raw > 150)) {
    return Number((raw / 1000).toFixed(2));
  }
  return Number(raw.toFixed(2));
}

/**
 * Format decimal minutes per km (e.g. 4.5 -> "4:30 /km")
 */
export function formatPace(minPerKm) {
  if (!Number.isFinite(minPerKm) || minPerKm <= 0) return "--";
  const totalSec = Math.round(minPerKm * 60);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${String(secs).padStart(2, "0")} /km`;
}

/**
 * Format total minutes into mm:ss or h:mm:ss
 */
export function formatRaceTime(totalMinutes) {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return "--";
  const totalSec = Math.round(totalMinutes * 60);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

/**
 * Estimate race time at targetDistanceKm from a reference run using Riegel's endurance formula:
 * T2 = T1 * (D2 / D1)^1.06
 */
export function projectRaceTimeRiegel(refDistanceKm, refDurationMin, targetDistanceKm) {
  if (!refDistanceKm || !refDurationMin || !targetDistanceKm) return null;
  return refDurationMin * Math.pow(targetDistanceKm / refDistanceKm, 1.06);
}

/**
 * Estimate 5K time (minutes) from VO2 max using Daniels/Léger relationship:
 * ~50 ml/kg/min ≈ 20:00 5K, ~42 ≈ 24:45, ~60 ≈ 16:40.
 */
export function estimateTimeFromVo2Max(vo2Max, distanceKm = 5) {
  if (!Number.isFinite(vo2Max) || vo2Max < 20) return null;
  // Calibrated regression across Jack Daniels VDOT tables (VO2 30..75 -> 5K time)
  const est5kMin = Math.max(13.5, Math.min(45, 58.2 - 0.764 * vo2Max + 0.0022 * vo2Max * vo2Max));
  if (distanceKm === 5) return est5kMin;
  return projectRaceTimeRiegel(5, est5kMin, distanceKm);
}

/**
 * Estimate heart rate max safely using observed Apple Health max HR or Tanaka (208 - 0.7 * age),
 * avoiding the higher-error "220 - age" formula (per FitLib E13-HR-ZONE-TRAINING).
 */
function estimateMaxHeartRate(healthData, userAge = 30) {
  const tanaka = Math.round(208 - 0.7 * userAge);
  const observedMax = Number(healthData?.heartRate?.max) || 0;
  const workoutMaxes = (healthData?.workouts?.data || [])
    .map((w) => Number(w?.maxHeartRate || w?.heartRate?.max) || 0)
    .filter((v) => v >= 140 && v <= 225);
  const peakObserved = Math.max(observedMax, ...workoutMaxes, 0);
  if (peakObserved >= 165 && peakObserved <= 220) {
    return Math.max(peakObserved, tanaka);
  }
  return tanaka;
}

/**
 * Cross-correlate Apple Health heartRate time-series samples inside a workout window
 * when the workout object itself lacks averageHeartRate.
 */
function resolveWorkoutHeartRate(workout, hrSamples = []) {
  const directAvg = Number(workout?.averageHeartRate ?? workout?.heartRate?.average);
  const directMax = Number(workout?.maxHeartRate ?? workout?.heartRate?.max);
  if (Number.isFinite(directAvg) && directAvg > 40) {
    return {
      avgHR: Math.round(directAvg),
      maxHR: Number.isFinite(directMax) && directMax > 40 ? Math.round(directMax) : null,
    };
  }

  if (!Array.isArray(hrSamples) || hrSamples.length === 0 || !workout?.date) {
    return { avgHR: null, maxHR: null };
  }

  const startMs = new Date(workout.date).getTime();
  const durationMin = normalizeDurationMinutes(workout);
  const endMs = workout.endDate
    ? new Date(workout.endDate).getTime()
    : startMs + Math.max(5, durationMin) * 60000;

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    return { avgHR: null, maxHR: null };
  }

  const matching = hrSamples
    .filter((s) => {
      if (!s?.date) return false;
      const t = new Date(s.date).getTime();
      return t >= startMs - 60000 && t <= endMs + 60000;
    })
    .map((s) => Number(s.value))
    .filter((v) => Number.isFinite(v) && v >= 45 && v <= 225);

  if (matching.length === 0) return { avgHR: null, maxHR: null };
  const avgHR = Math.round(matching.reduce((sum, v) => sum + v, 0) / matching.length);
  const maxHR = Math.round(Math.max(...matching));
  return { avgHR, maxHR };
}

/**
 * Classify a cardio workout into Seiler's 3-zone polarized buckets:
 *   - "easy"     (Zone 1-2 Aerobic Base: <75% HRmax or <65% HRR)
 *   - "moderate" (Zone 3-4 Grey Zone / Threshold: 75-87% HRmax)
 *   - "hard"     (Zone 5 VO2 Max / HIIT: >=88% HRmax)
 */
function classifyWorkoutIntensity(workout, avgHR, maxHR, restingHR) {
  if (avgHR && maxHR) {
    const pctMax = (avgHR / maxHR) * 100;
    // Use Karvonen Heart Rate Reserve when valid resting HR is available
    const pctIntensity =
      restingHR && restingHR > 35 && restingHR < maxHR - 40
        ? ((avgHR - restingHR) / (maxHR - restingHR)) * 100
        : pctMax;

    if (pctIntensity >= 85 || pctMax >= 88) {
      return { zone: "hard", label: "Z5 · VO2 / HIIT", pctMax: Math.round(pctMax) };
    }
    if (pctIntensity >= 70 || pctMax >= 75) {
      return { zone: "moderate", label: "Z3–4 · Threshold", pctMax: Math.round(pctMax) };
    }
    return { zone: "easy", label: "Z1–2 · Aerobic Base", pctMax: Math.round(pctMax) };
  }

  // Fallback to explicit intensity tag or workout type/calorie burn rate when HR wasn't recorded
  const explicit = String(workout?.intensity || "").toLowerCase();
  if (explicit === "high" || explicit === "maximal") {
    return { zone: "hard", label: "Z5 · VO2 / HIIT", pctMax: null };
  }
  if (explicit === "moderate") {
    return { zone: "moderate", label: "Z3–4 · Threshold", pctMax: null };
  }
  if (explicit === "low") {
    return { zone: "easy", label: "Z1–2 · Aerobic Base", pctMax: null };
  }

  const descriptor = `${workout?.type || ""} ${workout?.name || ""}`.toLowerCase();
  if (HIGH_INTENSITY_KEYWORDS.some((kw) => descriptor.includes(kw))) {
    return { zone: "hard", label: "Z5 · VO2 / HIIT", pctMax: null };
  }
  if (EASY_KEYWORDS.some((kw) => descriptor.includes(kw))) {
    return { zone: "easy", label: "Z1–2 · Aerobic Base", pctMax: null };
  }

  const durationMin = normalizeDurationMinutes(workout);
  const kcalPerMin =
    durationMin > 0 && Number(workout?.calories) > 0
      ? Number(workout.calories) / durationMin
      : null;

  if (kcalPerMin !== null) {
    if (kcalPerMin >= 13.5) return { zone: "hard", label: "Z5 · High Output", pctMax: null };
    if (kcalPerMin >= 10.5) return { zone: "moderate", label: "Z3–4 · Tempo", pctMax: null };
  }

  return { zone: "easy", label: "Z1–2 · Aerobic Base", pctMax: null };
}

/**
 * Full Apple Health Workout -> Aerobic Fitness / Cardio Goal Gap Analysis.
 */
export function analyzeAerobicGoalProgress(healthData, goalId = getSavedAerobicGoalId(), options = {}) {
  const goal = getAerobicGoalPreset(goalId);
  const nowMs = options.nowMs || Date.now();
  const sevenDaysAgo = nowMs - 7 * 86400000;
  const twentyEightDaysAgo = nowMs - 28 * 86400000;

  const rawWorkouts = Array.isArray(healthData?.workouts?.data) ? healthData.workouts.data : [];
  const hrSamples = Array.isArray(healthData?.heartRate?.data) ? healthData.heartRate.data : [];
  const restingHR =
    Number(healthData?.restingHeartRate?.current) ||
    Number(healthData?.heartRate?.min) ||
    null;
  const maxHR = estimateMaxHeartRate(healthData, options.userAge || 30);

  // 1. Filter & enrich Apple Health cardio workouts
  const allCardioWorkouts = rawWorkouts
    .filter((w) => w && w.date && isCardioWorkout(w))
    .map((w) => {
      const durationMin = Number(normalizeDurationMinutes(w).toFixed(1));
      const distanceKm = normalizeDistanceKm(w);
      const { avgHR, maxHR: sessionMaxHR } = resolveWorkoutHeartRate(w, hrSamples);
      const zoneInfo = classifyWorkoutIntensity(w, avgHR, maxHR, restingHR);
      const paceMinPerKm =
        distanceKm && distanceKm >= 0.4 && durationMin > 0
          ? Number((durationMin / distanceKm).toFixed(2))
          : null;

      return {
        date: w.date,
        timestamp: new Date(w.date).getTime(),
        type: w.type || "cardio",
        label: formatWorkoutActivityLabel(w.name || w.type),
        isRun: isRunningWorkout(w),
        durationMin,
        distanceKm,
        calories: Number(w.calories) || null,
        avgHR,
        maxHR: sessionMaxHR,
        paceMinPerKm,
        zone: zoneInfo.zone,
        zoneLabel: zoneInfo.label,
        pctMaxHR: zoneInfo.pctMax,
        source: w.source || healthData?.source || "Apple Health",
      };
    })
    .filter((w) => Number.isFinite(w.timestamp) && w.durationMin > 0)
    .sort((a, b) => b.timestamp - a.timestamp);

  const last7dWorkouts = allCardioWorkouts.filter((w) => w.timestamp >= sevenDaysAgo);
  const last28dWorkouts = allCardioWorkouts.filter((w) => w.timestamp >= twentyEightDaysAgo);

  // 2. Weekly Volume & Acute:Chronic Workload Ratio (ACWR)
  const weekly7dMinutes = Math.round(last7dWorkouts.reduce((s, w) => s + w.durationMin, 0));
  const weekly7dKm = Number(
    last7dWorkouts.reduce((s, w) => s + (w.distanceKm || 0), 0).toFixed(1)
  );
  const total28dMinutes = last28dWorkouts.reduce((s, w) => s + w.durationMin, 0);
  const total28dKm = last28dWorkouts.reduce((s, w) => s + (w.distanceKm || 0), 0);
  const chronicWeeklyMinutes = Math.round(total28dMinutes / 4);
  const chronicWeeklyKm = Number((total28dKm / 4).toFixed(1));
  const longestSession28dMin = last28dWorkouts.reduce(
    (max, w) => Math.max(max, w.durationMin),
    0
  );

  // Effective weekly minutes blends current week and 4-week chronic baseline
  const effectiveWeeklyMinutes = Math.max(weekly7dMinutes, chronicWeeklyMinutes);
  const volumeGapMin = Math.max(0, goal.targetWeeklyMinutes - effectiveWeeklyMinutes);
  const volumeProgressPct = Math.min(
    100,
    Math.round((effectiveWeeklyMinutes / goal.targetWeeklyMinutes) * 100)
  );

  let acwr = null;
  let acwrStatus = "NO DATA";
  if (chronicWeeklyMinutes >= 20) {
    acwr = Number((weekly7dMinutes / chronicWeeklyMinutes).toFixed(2));
    if (acwr > 1.5) acwrStatus = "SPIKE RISK";
    else if (acwr > 1.3) acwrStatus = "HIGH RAMP";
    else if (acwr >= 0.8) acwrStatus = "SWEET SPOT";
    else acwrStatus = "DETRAINING";
  } else if (weekly7dMinutes > 0) {
    acwrStatus = "BUILDING BASE";
  }

  // 3. 80/20 Polarized Intensity Distribution (last 28 days)
  const zoneMinutes = { easy: 0, moderate: 0, hard: 0 };
  let hardSessions28d = 0;
  last28dWorkouts.forEach((w) => {
    zoneMinutes[w.zone] = (zoneMinutes[w.zone] || 0) + w.durationMin;
    if (w.zone === "hard") hardSessions28d += 1;
  });
  const totalZoneMin = zoneMinutes.easy + zoneMinutes.moderate + zoneMinutes.hard;
  const intensitySplit =
    totalZoneMin > 0
      ? {
          easyPct: Math.round((zoneMinutes.easy / totalZoneMin) * 100),
          moderatePct: Math.round((zoneMinutes.moderate / totalZoneMin) * 100),
          hardPct: Math.round((zoneMinutes.hard / totalZoneMin) * 100),
          easyMin: Math.round(zoneMinutes.easy),
          moderateMin: Math.round(zoneMinutes.moderate),
          hardMin: Math.round(zoneMinutes.hard),
        }
      : { easyPct: 0, moderatePct: 0, hardPct: 0, easyMin: 0, moderateMin: 0, hardMin: 0 };

  let polarizationScore = null;
  let polarizationVerdict = "Log cardio workouts to assess 80/20 zone distribution.";
  if (totalZoneMin >= 30) {
    const easyDelta = Math.abs(intensitySplit.easyPct - goal.targetEasyPct);
    const greyPenalty = Math.max(0, intensitySplit.moderatePct - 15) * 1.4;
    polarizationScore = Math.max(20, Math.min(100, Math.round(100 - easyDelta * 0.9 - greyPenalty)));

    if (intensitySplit.moderatePct > 30) {
      polarizationVerdict = `Threshold Trap: ${intensitySplit.moderatePct}% of volume is moderate Zone 3–4 "grey zone" — too hard to recover well, too soft for peak VO2 gains.`;
    } else if (intensitySplit.hardPct > 30) {
      polarizationVerdict = `Over-intensified: ${intensitySplit.hardPct}% high-intensity risks autonomic fatigue & injury; shift more volume to easy Zone 2.`;
    } else if (intensitySplit.hardPct === 0 && totalZoneMin >= 120) {
      polarizationVerdict = `100% easy/moderate base with 0 VO2 max intervals — ready to add 1 structured high-intensity session/week.`;
    } else {
      polarizationVerdict = `Well-polarized (${intensitySplit.easyPct}% easy / ${intensitySplit.moderatePct}% moderate / ${intensitySplit.hardPct}% hard) — aligns closely with Seiler's 80/20 model.`;
    }
  }

  // 4. VO2 Max Gap (Real Apple Health VO2 Max)
  const currentVo2 =
    typeof healthData?.vo2Max?.current === "number" && healthData.vo2Max.current > 0
      ? Number(healthData.vo2Max.current.toFixed(1))
      : null;
  const previousVo2 =
    typeof healthData?.vo2Max?.previous === "number" && healthData.vo2Max.previous > 0
      ? Number(healthData.vo2Max.previous.toFixed(1))
      : null;
  const vo2Trend =
    currentVo2 !== null && previousVo2 !== null
      ? Number((currentVo2 - previousVo2).toFixed(1))
      : null;
  const vo2Gap =
    currentVo2 !== null ? Number(Math.max(0, goal.targetVo2Max - currentVo2).toFixed(1)) : null;
  const vo2ProgressPct =
    currentVo2 !== null
      ? Math.max(0, Math.min(100, Math.round((currentVo2 / goal.targetVo2Max) * 100)))
      : null;

  // 5. Measured Pace & Projected Race Time Gap (from Apple Health runs >= 1.5 km, or VO2 fallback)
  const qualifyingRuns = last28dWorkouts.filter(
    (w) => w.isRun && w.distanceKm && w.distanceKm >= 1.5 && w.paceMinPerKm && w.paceMinPerKm >= 2.5 && w.paceMinPerKm <= 12
  );
  let bestRun = null;
  let currentPaceMinPerKm = null;
  let projectedRaceTimeMin = null;
  let paceSource = "none";

  if (qualifyingRuns.length > 0) {
    // Pick the run yielding the fastest Riegel-projected race time for the target distance
    bestRun = qualifyingRuns.reduce((best, run) => {
      const proj = projectRaceTimeRiegel(run.distanceKm, run.durationMin, goal.distanceKm);
      const bestProj = best
        ? projectRaceTimeRiegel(best.distanceKm, best.durationMin, goal.distanceKm)
        : Infinity;
      return proj < bestProj ? run : best;
    }, null);

    projectedRaceTimeMin = Number(
      projectRaceTimeRiegel(bestRun.distanceKm, bestRun.durationMin, goal.distanceKm).toFixed(2)
    );
    currentPaceMinPerKm = Number((projectedRaceTimeMin / goal.distanceKm).toFixed(2));
    paceSource = "measured";
  } else if (currentVo2 !== null) {
    projectedRaceTimeMin = Number(estimateTimeFromVo2Max(currentVo2, goal.distanceKm).toFixed(2));
    currentPaceMinPerKm = Number((projectedRaceTimeMin / goal.distanceKm).toFixed(2));
    paceSource = "vo2-estimated";
  }

  const paceGapMinPerKm =
    currentPaceMinPerKm !== null
      ? Number(Math.max(0, currentPaceMinPerKm - goal.targetPaceMinPerKm).toFixed(2))
      : null;
  const timeGapMin =
    projectedRaceTimeMin !== null
      ? Number(Math.max(0, projectedRaceTimeMin - goal.targetTimeMin).toFixed(2))
      : null;

  const paceProgressPct =
    projectedRaceTimeMin !== null
      ? Math.max(
          0,
          Math.min(100, Math.round((goal.targetTimeMin / projectedRaceTimeMin) * 100))
        )
      : null;

  // 6. Composite Distance-to-Goal Readiness % (weighted only across pillars with real data)
  const weightedPillars = [];
  if (vo2ProgressPct !== null) weightedPillars.push({ pct: vo2ProgressPct, weight: 0.35 });
  if (paceProgressPct !== null) weightedPillars.push({ pct: paceProgressPct, weight: 0.3 });
  if (allCardioWorkouts.length > 0) weightedPillars.push({ pct: volumeProgressPct, weight: 0.25 });
  if (polarizationScore !== null) weightedPillars.push({ pct: polarizationScore, weight: 0.1 });

  const overallGoalReadinessPct =
    weightedPillars.length > 0
      ? Math.round(
          weightedPillars.reduce((sum, p) => sum + p.pct * p.weight, 0) /
            weightedPillars.reduce((sum, p) => sum + p.weight, 0)
        )
      : 0;

  const hasCardioData = allCardioWorkouts.length > 0 || currentVo2 !== null;

  // 7. Prioritized "What to Improve Next" Prescriptions (Grounded in FitLib Vault)
  const recommendations = [];

  if (!hasCardioData) {
    recommendations.push({
      id: "rec-sync-baseline",
      priority: "HIGH",
      category: "BASELINE TELEMETRY",
      title: "Import Apple Health Workouts or Log 1 Baseline Run",
      why: "No Apple Health cardio workouts or VO2 Max readings are synced yet.",
      prescription:
        "Import your Apple Health export (Health Data tab) or log a 20–30 min easy run with distance so the System can compute your exact pace, VO2, and 80/20 gap.",
      kbRef: "F5",
      kbTitle: "F5. VO2 Max Testing Protocols",
    });
  } else {
    // Priority 1: Injury / Overtraining Spike Guard (ACWR > 1.45)
    if (acwr !== null && acwr > 1.45) {
      recommendations.push({
        id: "rec-acwr-deload",
        priority: "URGENT",
        category: "LOAD SAFETY",
        title: `Taper Weekly Spike (ACWR ${acwr}x > 1.5 Safe Cap)`,
        why: `Your 7-day aerobic load (${weekly7dMinutes} min) jumped well above your 4-week average (${chronicWeeklyMinutes} min/wk), elevating overuse injury risk.`,
        prescription:
          "Hold total cardio volume flat or cut 20% for 5–7 days, keep runs strictly easy Zone 2, and prioritize 8h sleep before resuming progression.",
        kbRef: "F3-INJURY-PREVENTION",
        kbTitle: "F3. Injury Prevention & Load Management",
      });
    }

    // Priority 2: Grey-Zone / Threshold Trap Fix
    if (intensitySplit.moderatePct > 30) {
      recommendations.push({
        id: "rec-fix-grey-zone",
        priority: "HIGH",
        category: "80/20 POLARIZATION",
        title: `Escape the "Grey Zone" (${intensitySplit.moderatePct}% Moderate Volume)`,
        why: "Too much training sits in Zone 3–4 (hard enough to accumulate fatigue, too slow to maximize stroke volume & mitochondrial adaptations).",
        prescription: `Slow your easy days down below ${Math.round(maxHR * 0.72)} bpm (conversational nasal pace) for 80% of minutes, and keep 1 dedicated quality session truly crisp.`,
        kbRef: "E13-HR-ZONE-TRAINING",
        kbTitle: "E13. Heart Rate Zone Training",
      });
    }

    // Priority 3: Aerobic Volume Gap
    if (volumeGapMin >= 25) {
      const safeNextWeekMin =
        effectiveWeeklyMinutes > 0
          ? Math.min(goal.targetWeeklyMinutes, Math.round(effectiveWeeklyMinutes * 1.12) + 10)
          : Math.min(90, goal.targetWeeklyMinutes);
      recommendations.push({
        id: "rec-volume-ramp",
        priority: "HIGH",
        category: "AEROBIC VOLUME",
        title: `Close Weekly Volume Gap (+${volumeGapMin} min/wk to Target)`,
        why: `Current aerobic volume is ${effectiveWeeklyMinutes} min/wk vs. ${goal.targetWeeklyMinutes} min/wk needed for ${goal.shortName}.`,
        prescription: `Build safely (~10% rule) to ${safeNextWeekMin} min next week by adding one ${Math.min(45, Math.max(25, volumeGapMin))}-min Zone 2 steady-state run or bike session.`,
        kbRef: "E2-LISS",
        kbTitle: "E2. Steady-State Cardio (LISS)",
      });
    }

    // Priority 4: VO2 Max Ceiling Gap
    if ((vo2Gap !== null && vo2Gap >= 2.0) || (hardSessions28d < 2 && effectiveWeeklyMinutes >= 90)) {
      recommendations.push({
        id: "rec-vo2-intervals",
        priority: vo2Gap && vo2Gap >= 5 ? "HIGH" : "MEDIUM",
        category: "VO2 MAX CEILING",
        title:
          vo2Gap !== null
            ? `Raise VO2 Max (+${vo2Gap} ml/kg/min Gap to ${goal.targetVo2Max})`
            : "Add 1 Weekly VO2 Max Interval Session",
        why: "Helgerud & Midgley evidence shows 3–5 min intervals at 90–95% HRmax elicit the largest gains in cardiac stroke volume and VO2 max.",
        prescription: `Schedule 1×/wk Norwegian 4×4 intervals: 4 rounds of 4 min @ ${Math.round(maxHR * 0.9)}–${Math.round(maxHR * 0.95)} bpm with 3 min easy jog recovery.`,
        kbRef: "E11-VO2MAX-TRAINING",
        kbTitle: "E11. VO2 Max Training",
      });
    }

    // Priority 5: Race Pace / Lactate Threshold & Running Economy
    if (paceGapMinPerKm !== null && paceGapMinPerKm > 0.15) {
      recommendations.push({
        id: "rec-threshold-economy",
        priority: "MEDIUM",
        category: "RACE PACE & ECONOMY",
        title: `Bridge Pace Gap (-${formatPace(paceGapMinPerKm).replace(" /km", "")}/km Faster Needed)`,
        why: `Projected ${goal.distanceKm}K time is ${formatRaceTime(projectedRaceTimeMin)} vs. ${formatRaceTime(goal.targetTimeMin)} target.`,
        prescription:
          "Add 1×/wk Lactate Threshold cruise intervals (3×8 min @ comfortably hard RPE 7.5, 90s jog) + 2×/wk heavy lower-body strength/plyometrics to cut oxygen cost per km.",
        kbRef: "X1-1-RUNNING-STRENGTH",
        kbTitle: "X1.1. Strength Training for Runners",
      });
    }

    // Priority 6: Long Run Durability (for 10K / Half Marathon)
    if (
      goal.targetLongSessionMin >= 60 &&
      longestSession28dMin > 0 &&
      longestSession28dMin < goal.targetLongSessionMin - 15
    ) {
      recommendations.push({
        id: "rec-long-run",
        priority: "MEDIUM",
        category: "DURABILITY",
        title: `Extend Weekly Long Session (${Math.round(longestSession28dMin)} -> ${goal.targetLongSessionMin} min)`,
        why: `${goal.shortName} requires late-race muscular & glycogen durability beyond your current longest 28-day session.`,
        prescription: `Extend your weekend easy aerobic session by +8–10 minutes every week until you comfortably hit ${goal.targetLongSessionMin} min in Zone 2.`,
        kbRef: "X1-RUNNING",
        kbTitle: "X1. Running (Track, Road, Trail)",
      });
    }

    // Fallback when user is already hitting all targets
    if (recommendations.length === 0) {
      recommendations.push({
        id: "rec-taper-peak",
        priority: "LOW",
        category: "PEAK & TEST",
        title: `Goal Metrics Met — Taper & Test ${goal.shortName}`,
        why: "Your Apple Health VO2 max, weekly volume, and intensity balance meet or exceed target benchmarks.",
        prescription:
          "Execute a 7–10 day taper (-35% volume, keep short race-pace strides), prioritize ≥8h sleep, and run a verified time trial.",
        kbRef: "F1-SLEEP-QUALITY",
        kbTitle: "F1. Sleep Quality and Quantity",
      });
    }
  }

  return {
    goal,
    hasCardioData,
    overallGoalReadinessPct,
    maxHREstimate: maxHR,
    restingHR,
    vo2: {
      current: currentVo2,
      previous: previousVo2,
      trend: vo2Trend,
      target: goal.targetVo2Max,
      gap: vo2Gap,
      progressPct: vo2ProgressPct,
    },
    pace: {
      source: paceSource,
      currentMinPerKm: currentPaceMinPerKm,
      currentFormatted: formatPace(currentPaceMinPerKm),
      targetMinPerKm: goal.targetPaceMinPerKm,
      targetFormatted: formatPace(goal.targetPaceMinPerKm),
      gapMinPerKm: paceGapMinPerKm,
      projectedTimeMin: projectedRaceTimeMin,
      projectedTimeFormatted: formatRaceTime(projectedRaceTimeMin),
      targetTimeFormatted: formatRaceTime(goal.targetTimeMin),
      timeGapMin,
      progressPct: paceProgressPct,
      bestRunSummary: bestRun
        ? `${bestRun.distanceKm} km in ${Math.round(bestRun.durationMin)} min (${formatPace(bestRun.paceMinPerKm)})`
        : null,
    },
    volume: {
      weekly7dMinutes,
      weekly7dKm,
      weekly7dSessions: last7dWorkouts.length,
      chronicWeeklyMinutes,
      chronicWeeklyKm,
      effectiveWeeklyMinutes,
      targetWeeklyMinutes: goal.targetWeeklyMinutes,
      gapMinutes: volumeGapMin,
      progressPct: volumeProgressPct,
      longestSession28dMin: Math.round(longestSession28dMin),
      acwr,
      acwrStatus,
    },
    intensity: {
      ...intensitySplit,
      hardSessions28d,
      polarizationScore,
      verdict: polarizationVerdict,
    },
    recommendations: recommendations.slice(0, 3),
    recentCardioWorkouts: allCardioWorkouts.slice(0, 8),
    totalCardioWorkouts28d: last28dWorkouts.length,
  };
}

/**
 * Compact ~90-token summary of the Apple Health Cardio Gap for Gemini Coach prompting.
 */
export function buildAerobicCoachBrief(analysis) {
  if (!analysis) return null;
  return {
    cardioGoal: analysis.goal.name,
    goalReadinessPct: analysis.overallGoalReadinessPct,
    vo2Max: analysis.vo2.current !== null
      ? `${analysis.vo2.current} / ${analysis.vo2.target} ml/kg/min (gap ${analysis.vo2.gap})`
      : "not synced",
    projectedPerformance:
      analysis.pace.projectedTimeFormatted !== "--"
        ? `${analysis.pace.projectedTimeFormatted} (${analysis.pace.currentFormatted}, ${analysis.pace.source}) vs target ${analysis.pace.targetTimeFormatted}`
        : "no qualifying run/VO2",
    weeklyVolume: `${analysis.volume.effectiveWeeklyMinutes}/${analysis.volume.targetWeeklyMinutes} min/wk (7d: ${analysis.volume.weekly7dMinutes}m, ${analysis.volume.weekly7dKm}km, ACWR: ${analysis.volume.acwr ?? "N/A"} ${analysis.volume.acwrStatus})`,
    zoneSplit28d: `${analysis.intensity.easyPct}% easy / ${analysis.intensity.moderatePct}% moderate / ${analysis.intensity.hardPct}% hard`,
    topPriorities: analysis.recommendations.map((r) => `${r.title} [${r.kbRef}]`),
  };
}
