// src/services/workoutService.js
// Exercise database, workout templates, volume/calorie calculations, and session persistence.
import { getFromStorage, saveToStorage, STORAGE_KEYS } from "../utils/storageUtils";

export const EXERCISE_DATABASE = [
  // Chest / Push
  { id: "barbell_bench_press", name: "Barbell Bench Press", category: "Strength", muscleGroup: "Chest", defaultSets: 4, defaultReps: 8, kbRef: "EXL-02" },
  { id: "incline_db_press", name: "Incline Dumbbell Press", category: "Strength", muscleGroup: "Chest", defaultSets: 3, defaultReps: 10, kbRef: "EXL-22" },
  { id: "overhead_press", name: "Overhead Barbell Press", category: "Strength", muscleGroup: "Shoulders", defaultSets: 4, defaultReps: 6, kbRef: "EXL-04" },
  { id: "cable_triceps_pushdown", name: "Cable Triceps Pushdown", category: "Strength", muscleGroup: "Arms", defaultSets: 3, defaultReps: 12, kbRef: "EXL-67" },
  { id: "lateral_raise", name: "Dumbbell Lateral Raise", category: "Strength", muscleGroup: "Shoulders", defaultSets: 3, defaultReps: 15, kbRef: "EXL-24" },
  { id: "dips", name: "Parallel Bar Dips", category: "Strength", muscleGroup: "Chest", defaultSets: 3, defaultReps: 10, kbRef: "EXL-82" },

  // Back / Pull
  { id: "barbell_deadlift", name: "Barbell Deadlift", category: "Strength", muscleGroup: "Back", defaultSets: 3, defaultReps: 5, kbRef: "EXL-03" },
  { id: "pull_ups", name: "Pull-Up / Chin-Up", category: "Strength", muscleGroup: "Back", defaultSets: 4, defaultReps: 8, kbRef: "EXL-81" },
  { id: "barbell_row", name: "Barbell Bent-Over Row", category: "Strength", muscleGroup: "Back", defaultSets: 4, defaultReps: 8, kbRef: "EXL-05" },
  { id: "cable_face_pull", name: "Cable Face Pull", category: "Strength", muscleGroup: "Shoulders", defaultSets: 3, defaultReps: 15, kbRef: "EXL-73" },
  { id: "db_incline_curl", name: "Dumbbell Incline Curl", category: "Strength", muscleGroup: "Arms", defaultSets: 3, defaultReps: 12, kbRef: "EXL-33" },

  // Legs
  { id: "barbell_back_squat", name: "Barbell Back Squat", category: "Strength", muscleGroup: "Legs", defaultSets: 4, defaultReps: 6, kbRef: "EXL-01" },
  { id: "barbell_front_squat", name: "Barbell Front Squat", category: "Strength", muscleGroup: "Legs", defaultSets: 3, defaultReps: 8, kbRef: "EXL-08" },
  { id: "romanian_deadlift", name: "Dumbbell Romanian Deadlift", category: "Strength", muscleGroup: "Legs", defaultSets: 3, defaultReps: 10, kbRef: "EXL-37" },
  { id: "db_split_squat", name: "Dumbbell Split Squat", category: "Strength", muscleGroup: "Legs", defaultSets: 3, defaultReps: 10, kbRef: "EXL-38" },
  { id: "calf_raise", name: "Standing Calf Raise", category: "Strength", muscleGroup: "Legs", defaultSets: 4, defaultReps: 15, kbRef: "EXL-61" },

  // Core & Mobility
  { id: "plank", name: "Plank Hold", category: "Mobility", muscleGroup: "Core", defaultSets: 3, defaultReps: 60, kbRef: "EXL-84" },
  { id: "hanging_leg_raise", name: "Hanging Leg Raise", category: "Strength", muscleGroup: "Core", defaultSets: 3, defaultReps: 12, kbRef: "EXL-88" },

  // Cardio / Conditioning
  { id: "running_intervals", name: "400m Running Intervals", category: "Cardio", muscleGroup: "Full Body", defaultSets: 6, defaultReps: 1, kbRef: "E11" },
  { id: "rowing_ergometer", name: "Rowing Ergometer (500m)", category: "Cardio", muscleGroup: "Full Body", defaultSets: 4, defaultReps: 1, kbRef: "EXL-96" },
  { id: "assault_bike", name: "Assault / Air Bike Sprints", category: "Cardio", muscleGroup: "Full Body", defaultSets: 8, defaultReps: 1, kbRef: "EXL-100" },
];

export const WORKOUT_TEMPLATES = [
  {
    id: "push_hypertrophy",
    name: "Push Hypertrophy",
    type: "strength_training",
    estimatedMinutes: 50,
    exercises: ["barbell_bench_press", "incline_db_press", "overhead_press", "lateral_raise", "cable_triceps_pushdown"],
  },
  {
    id: "pull_strength",
    name: "Pull Strength",
    type: "strength_training",
    estimatedMinutes: 50,
    exercises: ["barbell_deadlift", "pull_ups", "barbell_row", "cable_face_pull", "db_incline_curl"],
  },
  {
    id: "lower_power",
    name: "Lower Body Power",
    type: "strength_training",
    estimatedMinutes: 55,
    exercises: ["barbell_back_squat", "romanian_deadlift", "db_split_squat", "calf_raise", "hanging_leg_raise"],
  },
  {
    id: "full_body",
    name: "Full Body Foundation",
    type: "strength_training",
    estimatedMinutes: 45,
    exercises: ["barbell_back_squat", "barbell_bench_press", "barbell_row", "overhead_press", "plank"],
  },
  {
    id: "hiit_conditioning",
    name: "VO2 Max Conditioning",
    type: "hiit",
    estimatedMinutes: 35,
    exercises: ["running_intervals", "rowing_ergometer", "assault_bike"],
  },
];

export function searchExercises(query = "", muscleGroup = "All") {
  const q = String(query || "").trim().toLowerCase();
  return EXERCISE_DATABASE.filter((ex) => {
    const matchesGroup = muscleGroup === "All" || ex.muscleGroup === muscleGroup;
    const matchesQuery =
      !q ||
      ex.name.toLowerCase().includes(q) ||
      ex.muscleGroup.toLowerCase().includes(q) ||
      ex.category.toLowerCase().includes(q);
    return matchesGroup && matchesQuery;
  });
}

export function buildExerciseEntriesFromTemplate(templateId) {
  const template = WORKOUT_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return [];

  return template.exercises
    .map((exId) => EXERCISE_DATABASE.find((e) => e.id === exId))
    .filter(Boolean)
    .map((ex) => ({
      exerciseId: ex.id,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      kbRef: ex.kbRef,
      sets: Array.from({ length: ex.defaultSets }, () => ({
        reps: ex.defaultReps,
        weight: ex.category === "Cardio" ? 0 : 40,
        completed: false,
      })),
    }));
}

export function calculateWorkoutVolume(exercises = []) {
  return exercises.reduce((total, ex) => {
    const exVolume = (ex.sets || []).reduce((sum, s) => {
      if (!s.completed) return sum;
      return sum + (Number(s.reps) || 0) * Math.max(1, Number(s.weight) || 0);
    }, 0);
    return total + exVolume;
  }, 0);
}

/**
 * Persist a completed workout session to localStorage (STORAGE_KEYS.WORKOUT_LOGS)
 */
export function saveWorkoutSession({
  name = "Strength Session",
  type = "strength_training",
  duration = 45,
  exercises = [],
  notes = "",
}) {
  const totalCompletedSets = exercises.reduce(
    (sum, ex) => sum + (ex.sets || []).filter((s) => s.completed).length,
    0
  );
  const volume = calculateWorkoutVolume(exercises);
  const durationMin = Math.max(1, Number(duration) || 30);
  // Estimate kcal (~6.5 kcal/min for resistance training, ~10 kcal/min for HIIT/cardio)
  const kcalPerMin = type === "hiit" || type === "running" ? 10 : 6.5;
  const estimatedCalories = Math.round(durationMin * kcalPerMin);

  const session = {
    id: `workout-${Date.now()}`,
    date: new Date().toISOString(),
    name,
    type,
    duration: durationMin,
    unit: "minutes",
    calories: estimatedCalories,
    volume,
    completedSets: totalCompletedSets,
    exercises,
    notes,
    source: "Workout Logger",
  };

  const existing = getFromStorage(STORAGE_KEYS.WORKOUT_LOGS, []);
  const updated = [session, ...(Array.isArray(existing) ? existing : [])];
  saveToStorage(STORAGE_KEYS.WORKOUT_LOGS, updated);

  return session;
}

export function getWorkoutHistory() {
  const logs = getFromStorage(STORAGE_KEYS.WORKOUT_LOGS, []);
  return Array.isArray(logs) ? logs : [];
}
