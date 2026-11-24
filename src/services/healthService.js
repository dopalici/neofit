// src/services/healthService.js
// Unified health data service connecting Apple HealthKit and imported/local storage data.
import { getFromStorage, STORAGE_KEYS as HABIT_STORAGE_KEYS } from "../utils/storageUtils";
import { STORAGE_KEYS } from "./dataImportService";
import appleHealthService from "./appleHealthService";

/**
 * Fetch health data from Apple HealthKit (when native & authorized) or local imported storage.
 * Never returns fabricated mock metrics when no real data exists.
 */
export const fetchHealthData = async (forceRefresh = false) => {
  // 1. Try native Apple HealthKit first
  try {
    const available = await appleHealthService.initialize();
    if (available) {
      const authorized = appleHealthService.hasPermissions || (await appleHealthService.requestPermissions());
      if (authorized) {
        const [
          heartRateRes,
          stepsRes,
          sleepRes,
          workoutsRes,
          nutritionRes,
          weightArr,
          vo2MaxArr,
          hrvArr,
          spo2Arr,
          caloriesArr,
          basalArr,
        ] = await Promise.all([
          appleHealthService.fetchHeartRate("week", forceRefresh),
          appleHealthService.fetchSteps("week", forceRefresh),
          appleHealthService.fetchSleep("week", forceRefresh),
          appleHealthService.fetchWorkouts("month", forceRefresh),
          appleHealthService.fetchNutrition("day", forceRefresh),
          appleHealthService.fetchHealthData("weight", "month", forceRefresh),
          appleHealthService.fetchHealthData("vo2max", "year", forceRefresh),
          appleHealthService.fetchHealthData("heartRateVariability", "week", forceRefresh),
          appleHealthService.fetchHealthData("oxygenSaturation", "week", forceRefresh),
          appleHealthService.fetchHealthData("calories", "week", forceRefresh),
          appleHealthService.fetchHealthData("basalEnergy", "week", forceRefresh),
        ]);

        const hasHealthKitData =
          heartRateRes.data.length > 0 ||
          stepsRes.data.length > 0 ||
          sleepRes.data.length > 0 ||
          workoutsRes.data.length > 0 ||
          weightArr.length > 0 ||
          vo2MaxArr.length > 0;

        const manualWorkouts = getFromStorage(HABIT_STORAGE_KEYS.WORKOUT_LOGS, []);

        if (hasHealthKitData) {
          return buildHealthDataSnapshot({
            heartRate: heartRateRes.data,
            restingHeartRate: heartRateRes.restingData || [],
            heartRateVariability: hrvArr,
            oxygenSaturation: spo2Arr,
            steps: stepsRes.data,
            weight: weightArr,
            sleep: sleepRes.data,
            vo2Max: vo2MaxArr,
            workouts: [...manualWorkouts, ...workoutsRes.data],
            calories: caloriesArr,
            basalEnergy: basalArr,
            nutrition: nutritionRes.raw || [],
            source: "Apple HealthKit",
          });
        }
      }
    }
  } catch (error) {
    console.warn("HealthKit fetch unavailable, checking local imported data:", error);
  }

  // 2. Fall back to real imported health data + manually logged workouts from localStorage
  const heartRate = getFromStorage(STORAGE_KEYS.HEART_RATE_DATA, []);
  const steps = getFromStorage(STORAGE_KEYS.STEP_COUNT_DATA, []);
  const weight = getFromStorage(STORAGE_KEYS.WEIGHT_DATA, []);
  const sleep = getFromStorage(STORAGE_KEYS.SLEEP_DATA, []);
  const vo2Max = getFromStorage(STORAGE_KEYS.VO2MAX_DATA, []);
  const importedWorkouts = getFromStorage(STORAGE_KEYS.WORKOUT_DATA, []);
  const manualWorkouts = getFromStorage(HABIT_STORAGE_KEYS.WORKOUT_LOGS, []);
  const workouts = [...manualWorkouts, ...importedWorkouts];
  const nutrition = getFromStorage(STORAGE_KEYS.NUTRITION_DATA, []);

  const hasStoredData =
    heartRate.length > 0 ||
    steps.length > 0 ||
    weight.length > 0 ||
    sleep.length > 0 ||
    vo2Max.length > 0 ||
    workouts.length > 0 ||
    (Array.isArray(nutrition) && nutrition.length > 0);

  return buildHealthDataSnapshot({
    heartRate,
    steps,
    weight,
    sleep,
    vo2Max,
    workouts,
    nutrition: Array.isArray(nutrition) ? nutrition : [],
    source: hasStoredData ? "Imported Data" : "none",
  });
};

/**
 * Transform raw validated health arrays into the normalized structure expected by UI panels
 * and healthDataProcessor.
 */
function buildHealthDataSnapshot({
  heartRate = [],
  restingHeartRate = [],
  heartRateVariability = [],
  oxygenSaturation = [],
  steps = [],
  weight = [],
  sleep = [],
  vo2Max = [],
  workouts = [],
  calories = [],
  basalEnergy = [],
  nutrition = [],
  source = "none",
}) {
  const sortNewest = (arr) =>
    [...(Array.isArray(arr) ? arr : [])]
      .filter((item) => item && item.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

  const sortedHR = sortNewest(heartRate);
  const sortedRestingHR = sortNewest(restingHeartRate);
  const sortedHRV = sortNewest(heartRateVariability);
  const sortedSpO2 = sortNewest(oxygenSaturation);
  const sortedSteps = sortNewest(steps);
  const sortedWeight = sortNewest(weight);
  const sortedSleep = sortNewest(sleep);
  const sortedVo2Max = sortNewest(vo2Max);
  const sortedWorkouts = sortNewest(workouts);
  const sortedCalories = sortNewest(calories);
  const sortedBasal = sortNewest(basalEnergy);
  const sortedNutrition = Array.isArray(nutrition) ? sortNewest(nutrition) : [];

  const latestHeartRate = sortedHR[0] || null;
  const latestSteps = sortedSteps[0] || null;
  const latestWeight = sortedWeight[0] || null;
  const previousWeight = sortedWeight[1] || null;
  const latestSleep = sortedSleep[0] || null;
  const latestVo2Max = sortedVo2Max[0] || null;
  const previousVo2Max = sortedVo2Max[1] || null;

  const hrValues = sortedHR.map((item) => Number(item.value)).filter((v) => !Number.isNaN(v));
  const recentWorkouts = sortedWorkouts.slice(0, 20);

  const workoutStats = {
    count: sortedWorkouts.length,
    recentTypes: [...new Set(recentWorkouts.map((w) => w.type))].slice(0, 5),
    totalCalories: recentWorkouts.reduce((sum, w) => sum + (Number(w.calories) || 0), 0),
    averageDuration:
      recentWorkouts.length > 0
        ? recentWorkouts.reduce((sum, w) => sum + (Number(w.duration) || 0), 0) /
          recentWorkouts.length
        : 0,
  };

  const hasData = source !== "none";

  const vo2Block = {
    current: latestVo2Max ? Number(latestVo2Max.value) : null,
    previous: previousVo2Max ? Number(previousVo2Max.value) : null,
    lastUpdated: latestVo2Max ? formatDate(new Date(latestVo2Max.date)) : null,
    data: sortedVo2Max,
  };

  return {
    hasData,
    source,
    lastSynced: hasData ? formatTime(new Date()) : null,
    heartRate: {
      current: latestHeartRate ? Number(latestHeartRate.value) : null,
      min: hrValues.length > 0 ? Math.min(...hrValues) : null,
      max: hrValues.length > 0 ? Math.max(...hrValues) : null,
      avg:
        hrValues.length > 0
          ? Number((hrValues.reduce((sum, v) => sum + v, 0) / hrValues.length).toFixed(1))
          : null,
      lastUpdated: latestHeartRate ? formatTime(new Date(latestHeartRate.date)) : null,
      data: sortedHR,
    },
    restingHeartRate: {
      current: sortedRestingHR[0] ? Number(sortedRestingHR[0].value) : null,
      data: sortedRestingHR,
    },
    heartRateVariability: {
      current: sortedHRV[0] ? Number(sortedHRV[0].value) : null,
      data: sortedHRV,
    },
    oxygenSaturation: {
      current: sortedSpO2[0] ? Number(sortedSpO2[0].value) : null,
      data: sortedSpO2,
    },
    steps: {
      today: sumLatestDay(sortedSteps),
      goal: 10000,
      lastUpdated: latestSteps ? formatTime(new Date(latestSteps.date)) : null,
      data: sortedSteps,
    },
    sleep: {
      lastNight: latestSleep ? `${Number(latestSleep.value).toFixed(1)}h` : null,
      duration: latestSleep ? Number(latestSleep.value) : null,
      efficiency: latestSleep?.sleepEfficiency ?? null,
      lastUpdated: latestSleep ? formatDate(new Date(latestSleep.date)) : null,
      data: sortedSleep,
    },
    vo2Max: vo2Block,
    vo2max: vo2Block,
    weight: {
      current: latestWeight ? Number(latestWeight.value) : null,
      previous: previousWeight ? Number(previousWeight.value) : null,
      trend:
        previousWeight && latestWeight
          ? Number((Number(latestWeight.value) - Number(previousWeight.value)).toFixed(1))
          : null,
      lastUpdated: latestWeight ? formatDate(new Date(latestWeight.date)) : null,
      data: sortedWeight,
    },
    calories: {
      burned: sumLatestDay(sortedCalories),
      data: sortedCalories,
    },
    basalEnergy: {
      current: sortedBasal[0] ? Number(sortedBasal[0].value) : null,
      data: sortedBasal,
    },
    workouts: {
      recent: recentWorkouts,
      stats: workoutStats,
      data: sortedWorkouts,
    },
    nutrition: {
      data: sortedNutrition,
      recent: sortedNutrition.slice(0, 10),
      stats: {
        count: sortedNutrition.length,
        avgCalories:
          sortedNutrition.length > 0
            ? Math.round(
                sortedNutrition.reduce((sum, item) => sum + (Number(item.calories) || 0), 0) /
                  sortedNutrition.length
              )
            : 0,
        avgProtein:
          sortedNutrition.length > 0
            ? Number(
                (
                  sortedNutrition.reduce((sum, item) => sum + (Number(item.protein) || 0), 0) /
                  sortedNutrition.length
                ).toFixed(1)
              )
            : 0,
        avgCarbs:
          sortedNutrition.length > 0
            ? Number(
                (
                  sortedNutrition.reduce((sum, item) => sum + (Number(item.carbs) || 0), 0) /
                  sortedNutrition.length
                ).toFixed(1)
              )
            : 0,
        avgFat:
          sortedNutrition.length > 0
            ? Number(
                (
                  sortedNutrition.reduce((sum, item) => sum + (Number(item.fat) || 0), 0) /
                  sortedNutrition.length
                ).toFixed(1)
              )
            : 0,
      },
    },
  };
}

function sumLatestDay(sortedSamples) {
  if (!Array.isArray(sortedSamples) || sortedSamples.length === 0) return null;
  const latestDate = new Date(sortedSamples[0].date);
  if (Number.isNaN(latestDate.getTime())) {
    const val = Number(sortedSamples[0].value);
    return Number.isNaN(val) ? null : Math.round(val);
  }

  const y = latestDate.getFullYear();
  const m = latestDate.getMonth();
  const d = latestDate.getDate();

  const sameDay = sortedSamples.filter((item) => {
    const dt = new Date(item.date);
    return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
  });

  if (sameDay.length <= 1) {
    const val = Number(sameDay[0]?.value);
    return Number.isNaN(val) ? null : Math.round(val);
  }

  // Prefer Apple Watch samples over overlapping iPhone intervals to prevent double counting
  const prioritized = [...sameDay].sort((a, b) => {
    const aWatch = /watch/i.test(String(a.source || "")) ? 0 : 1;
    const bWatch = /watch/i.test(String(b.source || "")) ? 0 : 1;
    if (aWatch !== bWatch) return aWatch - bWatch;
    return new Date(a.date) - new Date(b.date);
  });

  const acceptedIntervals = [];
  let total = 0;

  for (const sample of prioritized) {
    const val = Number(sample.value);
    if (Number.isNaN(val) || val <= 0) continue;

    const start = new Date(sample.date).getTime();
    const end = sample.endDate ? new Date(sample.endDate).getTime() : NaN;
    const hasInterval = !Number.isNaN(start) && !Number.isNaN(end) && end > start;

    if (hasInterval) {
      const overlapsDifferentSource = acceptedIntervals.some(
        (existing) =>
          existing.source !== sample.source &&
          start < existing.end &&
          end > existing.start
      );
      if (overlapsDifferentSource) continue;
      acceptedIntervals.push({ start, end, source: sample.source || "" });
    }

    total += val;
  }

  return Math.round(total);
}

function formatTime(date) {
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDate(date) {
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}