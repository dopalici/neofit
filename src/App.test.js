import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import ActivityLog from "./components/dashboard/ActivityLog";
import EnhancedNutritionPanel from "./components/dashboard/EnhancedNutritionPanel";
import EnhancementMetricsPanel from "./components/dashboard/EnhancementMetricsPanel";
import IntegrationModal from "./components/dashboard/IntegrationModal";
import {
  clearProcessorCache,
  processEnhancementMetrics,
} from "./services/healthDataProcessor";
import {
  addMeal,
  addWater,
  calculateCaloriesFromMacros,
  fetchNutritionData,
  searchFoodDatabase,
} from "./services/nutritionService";
import {
  fetchHeartRate,
  fetchNutrition,
  fetchSleep,
  fetchSteps,
  fetchWorkouts,
} from "./services/appleHealthService";

// Mock Three.js / React Three Fiber 3D components that require WebGL in jsdom
jest.mock("./components/3d/AnimatedBiometricModel", () => () => (
  <div data-testid="animated-biometric-model" />
));

jest.mock("@react-three/fiber", () => ({
  Canvas: ({ children }) => <div data-testid="r3f-canvas">{children}</div>,
}));

jest.mock("@react-three/drei", () => ({
  Environment: () => null,
  OrbitControls: () => null,
  useGLTF: () => ({
    scene: { rotation: { set: jest.fn() }, position: { set: jest.fn() } },
  }),
}));

beforeEach(() => {
  localStorage.clear();
  clearProcessorCache();
});

test("renders NeoVitru landing page", () => {
  render(<App />);
  expect(screen.getByText(/NeoVitru/i)).toBeInTheDocument();
  expect(screen.getByText(/The Future of Human Enhancement/i)).toBeInTheDocument();
});

test("Phase 2.1: HealthKit service fetch methods return clean empty structures on web", async () => {
  const [steps, hr, sleep, workouts, nutrition] = await Promise.all([
    fetchSteps("week", true),
    fetchHeartRate("day", true),
    fetchSleep("week", true),
    fetchWorkouts("month", true),
    fetchNutrition("day", true),
  ]);

  expect(steps.data).toEqual([]);
  expect(hr.data).toEqual([]);
  expect(sleep.data).toEqual([]);
  expect(workouts.data).toEqual([]);
  expect(nutrition.hasData).toBe(false);
});

test("Phase 2.2 & 2.4: processEnhancementMetrics returns NO DATA when empty and computes real scores from data", () => {
  const empty = processEnhancementMetrics({});
  expect(empty.individualMetrics.cardiacEfficiency.status).toBe("NO DATA");
  expect(empty.enhancementScores.symmetry).toBeNull();
  expect(empty.enhancementScores.potential).toBeNull();
  expect(empty.enhancementScores.efficiency).toBeNull();
  expect(empty.enhancementScores.recovery).toBeNull();

  const now = new Date().toISOString();
  const populated = processEnhancementMetrics({
    heartRate: { data: [{ date: now, value: 56 }] },
    restingHeartRate: { data: [{ date: now, value: 54 }] },
    heartRateVariability: { data: [{ date: now, value: 65 }] },
    vo2Max: { data: [{ date: now, value: 49.5 }] },
    sleep: { data: [{ date: now, value: 8.0, sleepEfficiency: 92 }] },
    steps: { data: [{ date: now, value: 10500 }] },
    workouts: {
      data: [
        { date: now, type: "Strength Training", duration: 45, calories: 320 },
        { date: now, type: "Running", duration: 35, calories: 410 },
        { date: now, type: "Yoga", duration: 30, calories: 120 },
      ],
    },
  });

  expect(populated.individualMetrics.cardiacEfficiency.current).toBe(54);
  expect(populated.individualMetrics.oxygenUtilization.current).toBe(49.5);
  expect(populated.enhancementScores.symmetry).toBeGreaterThanOrEqual(80);
  expect(populated.enhancementScores.potential).toBeGreaterThan(0);
  expect(populated.enhancementScores.efficiency).toBeGreaterThan(0);
  expect(populated.enhancementScores.recovery).toBeGreaterThan(70);
});

test("Phase 2.3: ActivityLog renders empty state and paginated chronological workouts", async () => {
  const { rerender } = render(<ActivityLog />);
  await waitFor(() => {
    expect(screen.getByText(/NO RECENT ACTIVITY/i)).toBeInTheDocument();
  });

  const sampleWorkouts = Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - i * 3600 * 1000).toISOString(),
    type: i % 2 === 0 ? "running" : "strength_training",
    duration: 30 + i * 5,
    unit: "minutes",
    calories: 250 + i * 20,
  }));

  rerender(<ActivityLog workouts={sampleWorkouts} />);

  await waitFor(() => {
    expect(screen.getByText(/5\/7/)).toBeInTheDocument();
  });
  expect(screen.getByText(/LOAD MORE \(2 REMAINING\)/i)).toBeInTheDocument();

  fireEvent.click(screen.getByText(/LOAD MORE/i));
  expect(screen.getByText(/7\/7/)).toBeInTheDocument();
});

test("Phase 2.4: EnhancementMetricsPanel displays NO DATA when empty and real metrics when populated", () => {
  const { rerender } = render(<EnhancementMetricsPanel healthData={{}} />);
  expect(screen.getAllByText("NO DATA").length).toBeGreaterThan(0);

  const now = new Date().toISOString();
  rerender(
    <EnhancementMetricsPanel
      healthData={{
        heartRate: { data: [{ date: now, value: 58 }] },
        restingHeartRate: { data: [{ date: now, value: 55 }] },
        vo2Max: { data: [{ date: now, value: 50 }] },
      }}
    />
  );

  expect(screen.getByText("55 bpm")).toBeInTheDocument();
  expect(screen.getByText("50.0")).toBeInTheDocument();
});

test("Phase 2.5: nutritionService persists meals, auto-calculates calories, logs water, and searches food DB", async () => {
  expect(calculateCaloriesFromMacros({ protein: 30, carbs: 40, fat: 10 })).toBe(370);
  expect(searchFoodDatabase("chicken").length).toBeGreaterThan(0);

  const initial = await fetchNutritionData();
  expect(initial.calories.consumed).toBe(0);

  // Add meal with omitted calories -> should auto-calculate 30*4 + 40*4 + 10*9 = 370
  const added = await addMeal({ name: "Post-Workout Bowl", protein: 30, carbs: 40, fat: 10 });
  expect(added.success).toBe(true);
  expect(added.meal.calories).toBe(370);
  expect(added.nutritionData.calories.consumed).toBe(370);

  const afterWater = await addWater(0.5);
  expect(afterWater.water.consumed).toBe(0.5);

  const reloaded = await fetchNutritionData();
  expect(reloaded.meals).toHaveLength(1);
  expect(reloaded.calories.consumed).toBe(370);
  expect(reloaded.water.consumed).toBe(0.5);
});

test("IntegrationModal toggles appleHealth and displays Knowledge Base tab", () => {
  const onToggle = jest.fn();
  render(
    <IntegrationModal
      isOpen={true}
      onClose={jest.fn()}
      connectedApps={{ appleHealth: true, myFitnessPal: false, strava: false }}
      onToggleConnection={onToggle}
    />
  );

  fireEvent.click(screen.getByText("Connected"));
  expect(onToggle).toHaveBeenCalledWith("appleHealth");

  fireEvent.click(screen.getByText("KNOWLEDGE BASE"));
  expect(screen.getByText(/IMPORT FITNESS KNOWLEDGE BASE/i)).toBeInTheDocument();
});

test("EnhancedNutritionPanel quick-adds from food database and submits meal", () => {
  const onAddMeal = jest.fn();
  render(
    <EnhancedNutritionPanel
      nutritionData={{
        source: "Local Log",
        calories: { consumed: 0, goal: 2200, lastUpdated: "08:00:00" },
        protein: { consumed: 0, goal: 140 },
        carbs: { consumed: 0, goal: 220 },
        fat: { consumed: 0, goal: 73 },
        water: { consumed: 0, goal: 3 },
        meals: [],
      }}
      onSyncNutrition={jest.fn()}
      isSyncing={false}
      onAddMeal={onAddMeal}
    />
  );

  fireEvent.click(screen.getByText("ADD MEAL"));
  fireEvent.change(screen.getByPlaceholderText(/Search foods/i), {
    target: { value: "chicken" },
  });
  fireEvent.click(screen.getByText(/Grilled Chicken Breast/i));
  fireEvent.click(screen.getByText("LOG MEAL"));

  expect(onAddMeal).toHaveBeenCalledWith({
    name: "Grilled Chicken Breast (150g)",
    calories: 230,
    protein: 46,
    carbs: 0,
    fat: 5,
  });
});

test("Phase 3.1 & 3.2: chatbotService configures AI, trims tokens, and persists conversation history", async () => {
  const {
    configureAI,
    getAIConfig,
    trimToTokenBudget,
    getConversationHistory,
    clearConversationHistory,
    generateFitnessAdvice,
  } = require("./services/chatbotService");

  clearConversationHistory();
  configureAI({ provider: "local", apiKey: "" });
  expect(getAIConfig().provider).toBe("local");

  const longText = "a".repeat(500);
  expect(trimToTokenBudget(longText, 25).length).toBeLessThanOrEqual(103);

  const reply = await generateFitnessAdvice("How should I improve my running VO2 max?", {}, {});
  expect(reply.role).toBe("assistant");
  expect(reply.content.length).toBeGreaterThan(20);
  expect(getConversationHistory().length).toBeGreaterThanOrEqual(2);
});

test("Phase 3.3: WorkoutLogger loads template, tracks sets/volume, and saves workout session", () => {
  const WorkoutLogger = require("./components/dashboard/WorkoutLogger").default;
  const { getWorkoutHistory } = require("./services/workoutService");
  const onWorkoutLogged = jest.fn();

  render(<WorkoutLogger onWorkoutLogged={onWorkoutLogged} />);
  fireEvent.click(screen.getByText("Push Hypertrophy"));
  expect(screen.getAllByText("Barbell Bench Press").length).toBeGreaterThanOrEqual(2);

  const firstSetDoneBtn = screen.getAllByLabelText(/Mark set 1 complete/i)[0];
  fireEvent.click(firstSetDoneBtn);

  fireEvent.click(screen.getByText(/SAVE WORKOUT SESSION/i));
  expect(onWorkoutLogged).toHaveBeenCalledTimes(1);
  expect(getWorkoutHistory()).toHaveLength(1);
  expect(getWorkoutHistory()[0].name).toBe("Push Hypertrophy");
});

test("Phase 3.5: ErrorBoundary catches render error and displays retry button", () => {
  const ErrorBoundary = require("./components/ui/ErrorBoundary").default;
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});

  function BrokenComponent() {
    throw new Error("Simulated crash");
  }

  render(
    <ErrorBoundary fallbackTitle="TEST CRASH">
      <BrokenComponent />
    </ErrorBoundary>
  );

  expect(screen.getByText("TEST CRASH")).toBeInTheDocument();
  expect(screen.getByText("Simulated crash")).toBeInTheDocument();
  expect(screen.getByText(/RETRY MODULE/i)).toBeInTheDocument();

  spy.mockRestore();
});

test("Phase 3.6: OnboardingFlow completes 3-step wizard and saves goals", () => {
  const OnboardingFlow = require("./components/onboarding/OnboardingFlow").default;
  const onComplete = jest.fn();
  const onUpdateGoals = jest.fn();

  render(<OnboardingFlow onComplete={onComplete} onUpdateGoals={onUpdateGoals} />);

  expect(screen.getByText(/STEP 1 OF 3/i)).toBeInTheDocument();
  fireEvent.click(screen.getByText(/BEGIN SETUP/i));

  expect(screen.getByText(/STEP 2 OF 3/i)).toBeInTheDocument();
  fireEvent.click(screen.getByText(/CONTINUE/i));

  expect(screen.getByText(/STEP 3 OF 3/i)).toBeInTheDocument();
  fireEvent.click(screen.getByText(/LAUNCH DASHBOARD/i));

  expect(onUpdateGoals).toHaveBeenCalledTimes(1);
  expect(onComplete).toHaveBeenCalledTimes(1);
});
