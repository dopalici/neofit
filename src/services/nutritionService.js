// src/services/nutritionService.js
// Real nutrition tracking service with localStorage persistence, Apple HealthKit integration,
// built-in food database, and automatic macro/calorie calculation.
import { getFromStorage, saveToStorage } from "../utils/storageUtils";
import { STORAGE_KEYS as IMPORT_STORAGE_KEYS } from "./dataImportService";
import appleHealthService from "./appleHealthService";

const DAILY_NUTRITION_KEY = "daily-nutrition-log";
const NUTRITION_GOALS_KEY = "nutrition-goals";

export const DEFAULT_NUTRITION_GOALS = {
  calories: 2200,
  protein: 140,
  carbs: 220,
  fat: 73,
  water: 3.0,
};

/**
 * Curated food & meal database for quick-add logging (values per standard serving)
 */
export const FOOD_DATABASE = [
  { id: "chicken_breast", name: "Grilled Chicken Breast (150g)", protein: 46, carbs: 0, fat: 5, calories: 230 },
  { id: "salmon_fillet", name: "Atlantic Salmon Fillet (150g)", protein: 34, carbs: 0, fat: 18, calories: 308 },
  { id: "eggs_3", name: "3 Whole Eggs", protein: 18, carbs: 2, fat: 15, calories: 215 },
  { id: "greek_yogurt", name: "Greek Yogurt, 0% (200g)", protein: 20, carbs: 8, fat: 0, calories: 112 },
  { id: "whey_shake", name: "Whey Protein Shake (1 scoop)", protein: 25, carbs: 3, fat: 2, calories: 130 },
  { id: "oats_bowl", name: "Rolled Oats (80g dry)", protein: 11, carbs: 54, fat: 5, calories: 305 },
  { id: "brown_rice", name: "Cooked Brown Rice (1 cup)", protein: 5, carbs: 45, fat: 2, calories: 218 },
  { id: "sweet_potato", name: "Baked Sweet Potato (200g)", protein: 4, carbs: 41, fat: 0, calories: 180 },
  { id: "avocado_half", name: "Avocado (1/2 medium)", protein: 2, carbs: 6, fat: 11, calories: 131 },
  { id: "almonds_handful", name: "Raw Almonds (30g)", protein: 6, carbs: 6, fat: 15, calories: 175 },
  { id: "banana", name: "Medium Banana", protein: 1, carbs: 27, fat: 0, calories: 105 },
  { id: "tofu_stirfry", name: "Firm Tofu & Veggies (200g)", protein: 22, carbs: 14, fat: 10, calories: 234 },
  { id: "steak_sirloin", name: "Lean Sirloin Steak (170g)", protein: 46, carbs: 0, fat: 12, calories: 292 },
  { id: "quinoa_bowl", name: "Quinoa Power Bowl (1 bowl)", protein: 16, carbs: 52, fat: 11, calories: 371 },
  { id: "cottage_cheese", name: "Low-Fat Cottage Cheese (200g)", protein: 24, carbs: 8, fat: 4, calories: 164 },
];

/**
 * Search the built-in food database by name
 */
export const searchFoodDatabase = (query = "") => {
  const normalized = String(query || "").trim().toLowerCase();
  if (!normalized) return FOOD_DATABASE.slice(0, 6);
  return FOOD_DATABASE.filter((item) =>
    item.name.toLowerCase().includes(normalized)
  );
};

/**
 * Calculate calories from macronutrients (4 kcal/g protein, 4 kcal/g carbs, 9 kcal/g fat)
 */
export const calculateCaloriesFromMacros = ({ protein = 0, carbs = 0, fat = 0 }) => {
  const p = Number(protein) || 0;
  const c = Number(carbs) || 0;
  const f = Number(fat) || 0;
  return Math.round(p * 4 + c * 4 + f * 9);
};

export const getCurrentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
};

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function loadGoals() {
  const saved = getFromStorage(NUTRITION_GOALS_KEY, null);
  return { ...DEFAULT_NUTRITION_GOALS, ...(saved || {}) };
}

function loadDailyLog() {
  const today = getTodayKey();
  const saved = getFromStorage(DAILY_NUTRITION_KEY, null);
  if (saved && saved.date === today) {
    return saved;
  }
  return {
    date: today,
    meals: [],
    water: 0,
    lastUpdated: null,
  };
}

function buildNutritionState(dailyLog, goals, healthKitNutrition = null) {
  const meals = Array.isArray(dailyLog.meals) ? dailyLog.meals : [];
  const mealCalories = meals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0);
  const mealProtein = meals.reduce((sum, m) => sum + (Number(m.protein) || 0), 0);
  const mealCarbs = meals.reduce((sum, m) => sum + (Number(m.carbs) || 0), 0);
  const mealFat = meals.reduce((sum, m) => sum + (Number(m.fat) || 0), 0);

  const hkHasData = Boolean(healthKitNutrition && healthKitNutrition.hasData);
  const lastUpdated =
    dailyLog.lastUpdated ||
    (hkHasData && healthKitNutrition.lastUpdated
      ? new Date(healthKitNutrition.lastUpdated).toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : null);

  return {
    date: dailyLog.date,
    source: hkHasData
      ? "Apple HealthKit"
      : meals.length > 0 || dailyLog.water > 0
      ? "Local Log"
      : "none",
    calories: {
      consumed: Math.round(mealCalories + (hkHasData ? healthKitNutrition.calories || 0 : 0)),
      goal: goals.calories,
      lastUpdated,
    },
    protein: {
      consumed: Math.round(mealProtein + (hkHasData ? healthKitNutrition.protein || 0 : 0)),
      goal: goals.protein,
      lastUpdated,
    },
    carbs: {
      consumed: Math.round(mealCarbs + (hkHasData ? healthKitNutrition.carbs || 0 : 0)),
      goal: goals.carbs,
      lastUpdated,
    },
    fat: {
      consumed: Math.round(mealFat + (hkHasData ? healthKitNutrition.fat || 0 : 0)),
      goal: goals.fat,
      lastUpdated,
    },
    water: {
      consumed: Number(
        ((Number(dailyLog.water) || 0) + (hkHasData ? Number(healthKitNutrition.water) || 0 : 0)).toFixed(2)
      ),
      goal: goals.water,
      lastUpdated,
    },
    meals,
  };
}

/**
 * Fetch real nutrition data from localStorage + Apple HealthKit (when available) + imported data.
 */
export const fetchNutritionData = async (forceRefresh = false) => {
  const goals = loadGoals();
  const dailyLog = loadDailyLog();

  let healthKitNutrition = null;
  try {
    const hkResult = await appleHealthService.fetchNutrition("day", forceRefresh);
    if (hkResult && hkResult.hasData) {
      healthKitNutrition = hkResult;
    }
  } catch (error) {
    // HealthKit unavailable on web
  }

  // If no HealthKit data and no local meals yet, check imported nutrition entries for today
  if (!healthKitNutrition && dailyLog.meals.length === 0) {
    const imported = getFromStorage(IMPORT_STORAGE_KEYS.NUTRITION_DATA, []);
    if (Array.isArray(imported) && imported.length > 0) {
      const today = getTodayKey();
      const todayImported = imported.filter(
        (entry) => entry && entry.date && String(entry.date).startsWith(today)
      );
      if (todayImported.length > 0) {
        healthKitNutrition = {
          hasData: true,
          calories: todayImported.reduce((s, e) => s + (Number(e.calories) || 0), 0),
          protein: todayImported.reduce((s, e) => s + (Number(e.protein) || 0), 0),
          carbs: todayImported.reduce((s, e) => s + (Number(e.carbs) || 0), 0),
          fat: todayImported.reduce((s, e) => s + (Number(e.fat) || 0), 0),
          water: 0,
          lastUpdated: todayImported[0].date,
        };
      }
    }
  }

  return buildNutritionState(dailyLog, goals, healthKitNutrition);
};

/**
 * Log a meal, auto-calculating calories from macros if omitted, and persist to localStorage.
 */
export const addMeal = async (mealData) => {
  const goals = loadGoals();
  const dailyLog = loadDailyLog();
  const nowTime = getCurrentTime();

  const protein = Math.max(0, Number(mealData?.protein) || 0);
  const carbs = Math.max(0, Number(mealData?.carbs) || 0);
  const fat = Math.max(0, Number(mealData?.fat) || 0);
  const rawCalories = Number(mealData?.calories) || 0;
  const calories =
    rawCalories > 0 ? Math.round(rawCalories) : calculateCaloriesFromMacros({ protein, carbs, fat });

  const newMeal = {
    id: mealData?.id || `meal-${Date.now()}`,
    name: String(mealData?.name || "MEAL").trim() || "MEAL",
    time: mealData?.time || nowTime.slice(0, 5),
    calories,
    protein,
    carbs,
    fat,
  };

  const updatedLog = {
    ...dailyLog,
    meals: [...dailyLog.meals, newMeal],
    lastUpdated: nowTime,
  };

  saveToStorage(DAILY_NUTRITION_KEY, updatedLog);
  const nutritionState = buildNutritionState(updatedLog, goals);

  return {
    success: true,
    meal: newMeal,
    nutritionData: nutritionState,
  };
};

/**
 * Log water intake in liters and persist to localStorage.
 */
export const addWater = async (liters = 0.25) => {
  const goals = loadGoals();
  const dailyLog = loadDailyLog();
  const nowTime = getCurrentTime();

  const updatedLog = {
    ...dailyLog,
    water: Number(((Number(dailyLog.water) || 0) + (Number(liters) || 0)).toFixed(2)),
    lastUpdated: nowTime,
  };

  saveToStorage(DAILY_NUTRITION_KEY, updatedLog);
  return buildNutritionState(updatedLog, goals);
};

/**
 * Update daily nutrition goals and persist to localStorage.
 */
export const updateNutritionGoals = (newGoals) => {
  const merged = { ...loadGoals(), ...newGoals };
  saveToStorage(NUTRITION_GOALS_KEY, merged);
  return buildNutritionState(loadDailyLog(), merged);
};