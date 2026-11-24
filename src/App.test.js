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

test("System v2: regex-safe searchKnowledgeBase handles special characters and ranks verified entries", () => {
  const { searchKnowledgeBase } = require("./services/obsidianParser");
  const mockKb = {
    "X9-GYMNASTICS-CALISTHENICS": {
      id: "X9-GYMNASTICS-CALISTHENICS",
      title: "X9. Gymnastics / Calisthenics",
      category: "Sports & Physical Skills",
      summary: "Progressive bodyweight skill acquisition including handstand push-ups and muscle-ups.",
      keyPoints: ["Straight-arm & bent-arm scapular conditioning"],
      content: "Handstand push-up progressions require vertical pressing strength and scapular stability.",
      citationCount: 3,
      tags: ["calisthenics", "handstand"],
    },
    "C1-CALORIC-TARGETS": {
      id: "C1-CALORIC-TARGETS",
      title: "C1. Caloric Targets",
      category: "Sports Nutrition",
      summary: "Energy intake targets for fat loss and lean muscle gain.",
      content: "Caloric deficit and surplus guidance.",
      citationCount: 2,
      tags: ["nutrition"],
    },
  };

  // Special regex chars must never throw
  const results = searchKnowledgeBase(mockKb, "handstand (push-up) + calisthenics?", 5);
  expect(results).toHaveLength(1);
  expect(results[0].id).toBe("X9-GYMNASTICS-CALISTHENICS");
});

test("System v2: Goal & Readiness Engine autoregulates quests, levels up rungs, and compresses AI telemetry", () => {
  const {
    advanceGoalRung,
    buildAITelemetryBrief,
    computeProgressionSummary,
    computeReadinessAssessment,
    createGoalFromBlueprint,
    generateDailyQuests,
    recordSubjectiveReadiness,
    toggleDailyQuest,
  } = require("./services/goalEngineService");

  const goal = createGoalFromBlueprint("strict-muscle-up", { id: "strict-muscle-up" });
  const goals = { [goal.id]: goal };

  // 1. Subjective readiness check-in gives immediate autoregulated score without Apple Health
  let state = recordSubjectiveReadiness({ sleepHours: 8, energy: 5, soreness: 1 });
  let readiness = computeReadinessAssessment({}, { protein: { consumed: 60, goal: 150 } }, state);
  expect(readiness.source).toBe("SUBJECTIVE CHECK-IN");
  expect(readiness.zone).toBe("PEAK");
  expect(readiness.bottleneck.type).toBe("protein");

  // 2. Poor Apple Health biometrics trigger RECOVER deload shield
  const lowReadiness = computeReadinessAssessment(
    {
      source: "Apple HealthKit",
      sleep: { duration: 4.5 },
      heartRateVariability: { current: 24 },
      restingHeartRate: { current: 78 },
      workouts: { data: [] },
    },
    { protein: { consumed: 140, goal: 140 } },
    state
  );
  expect(lowReadiness.zone).toBe("RECOVER");
  const recoverQuests = generateDailyQuests(goals, lowReadiness, { protein: { consumed: 140, goal: 140 } }, state);
  expect(recoverQuests[0].badge).toBe("DELOAD SHIELD");

  // 3. Completing a daily quest awards XP and raises 14-day rolling consistency
  const peakQuests = generateDailyQuests(goals, readiness, { protein: { consumed: 60, goal: 150 } }, state);
  state = toggleDailyQuest(peakQuests[0].id, peakQuests[0].xp);
  const progAfterQuest = computeProgressionSummary(state);
  expect(progAfterQuest.xp).toBeGreaterThanOrEqual(65);
  expect(progAfterQuest.consistency14d).toBeGreaterThan(0);

  // 4. Passing a skill rung advances currentRungIndex and calculates real progress
  const { updatedGoals, xpAwarded } = advanceGoalRung(goals, goal.id);
  expect(xpAwarded).toBe(120);
  expect(updatedGoals[goal.id].currentRungIndex).toBe(1);
  expect(updatedGoals[goal.id].progress).toBe(20);

  // 5. AI telemetry brief stays ultra-compact (<1200 chars)
  const brief = buildAITelemetryBrief({
    healthData: { sleep: { duration: 7.5 }, heartRateVariability: { current: 64 } },
    nutritionData: { calories: { consumed: 1800, goal: 2200 }, protein: { consumed: 120, goal: 150 } },
    goals: updatedGoals,
    readiness,
    progression: progAfterQuest,
  });
  expect(JSON.stringify(brief).length).toBeLessThan(1200);
  expect(brief.activeGoals[0].rung).toMatch(/^2\/5/);
});

test("System v2: chatbotService supports Gemini Flash/Flash-Lite auto-routing and Production Proxy", async () => {
  const {
    configureAI,
    getAIConfig,
    resolveGeminiModel,
    generateFitnessAdvice,
    clearConversationHistory,
  } = require("./services/chatbotService");

  expect(resolveGeminiModel("auto", "Quick check-in: how much water?")).toBe("gemini-2.5-flash-lite");
  expect(resolveGeminiModel("auto", "Build me a 4-week handstand skill progression plan")).toBe("gemini-2.5-flash");

  clearConversationHistory();
  configureAI({ provider: "gemini", apiKey: "test-gemini-key", model: "auto" });
  expect(getAIConfig().provider).toBe("gemini");

  const originalFetch = global.fetch;
  global.fetch = jest.fn(async (url) => {
    if (String(url).includes("generativelanguage.googleapis.com")) {
      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: "Verdict: Push Rung 2 elevated pike push-ups today [X9-GYMNASTICS-CALISTHENICS]." }],
              },
            },
          ],
        }),
      };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  });

  const reply = await generateFitnessAdvice(
    "Give me a progression plan for my handstand skill",
    {},
    {}
  );
  expect(reply.provider).toBe("gemini");
  expect(reply.model).toBe("gemini-2.5-flash");
  expect(reply.content).toMatch(/Rung 2/i);

  // Verify Proxy mode calls /api/coach without needing a client API key
  configureAI({ provider: "proxy", apiKey: "", endpoint: "/api/coach", model: "auto" });
  global.fetch = jest.fn(async (url) => {
    if (String(url) === "/api/coach") {
      return {
        ok: true,
        json: async () => ({
          content: "Proxy verdict: Hit 35g protein post-session.",
          model: "gemini-2.5-flash-lite",
        }),
      };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  });

  const proxyReply = await generateFitnessAdvice("Protein target?", {}, {});
  expect(proxyReply.provider).toBe("proxy");
  expect(proxyReply.content).toMatch(/35g protein/i);

  global.fetch = originalFetch;
});

test("System v2: SystemCommandCenter & GoalStudioModal complete quests, pass rungs, and activate new skills", () => {
  const SystemCommandCenter = require("./components/dashboard/SystemCommandCenter").default;
  const GoalStudioModal = require("./components/dashboard/GoalStudioModal").default;
  const {
    computeProgressionSummary,
    computeReadinessAssessment,
    createGoalFromBlueprint,
    generateDailyQuests,
    generateLiteralInsights,
    getSystemState,
  } = require("./services/goalEngineService");

  const goal = createGoalFromBlueprint("handstand-pushup", { id: "handstand-pushup" });
  const goals = { [goal.id]: goal };
  const state = getSystemState();
  const readiness = computeReadinessAssessment({}, {}, state);
  const progression = computeProgressionSummary(state);
  const quests = generateDailyQuests(goals, readiness, {}, state);
  const insights = generateLiteralInsights(goals, readiness, {}, progression);

  const onToggleQuest = jest.fn();
  const onAdvanceRung = jest.fn();
  const onOpenGoalStudio = jest.fn();

  render(
    <SystemCommandCenter
      goals={goals}
      readiness={readiness}
      progression={progression}
      dailyQuests={quests}
      literalInsights={insights}
      onToggleQuest={onToggleQuest}
      onAdvanceRung={onAdvanceRung}
      onOpenGoalStudio={onOpenGoalStudio}
    />
  );

  expect(screen.getByText(/TODAY’S SYSTEM QUESTS/i)).toBeInTheDocument();
  expect(screen.getByText(/GOAL & PHYSICAL SKILL LADDER/i)).toBeInTheDocument();

  fireEvent.click(screen.getByText(/PASS BENCHMARK & LEVEL UP/i));
  expect(onAdvanceRung).toHaveBeenCalledWith("handstand-pushup");

  fireEvent.click(screen.getByText(/NEW GOAL \/ SKILL/i));
  expect(onOpenGoalStudio).toHaveBeenCalledTimes(1);

  // Test GoalStudioModal blueprint activation
  const onAddGoal = jest.fn();
  render(<GoalStudioModal isOpen={true} onClose={jest.fn()} onAddGoal={onAddGoal} />);
  fireEvent.click(screen.getByText(/Strict Bar \/ Ring Muscle-Up/i));
  fireEvent.click(screen.getByText(/ACTIVATE PROTOCOL/i));
  expect(onAddGoal).toHaveBeenCalledTimes(1);
  expect(onAddGoal.mock.calls[0][0].blueprintId).toBe("strict-muscle-up");
});

test("Aerobic Goal Engine: analyzes Apple Health cardio workouts, HR zones, pace/VO2 gaps, and FitLib prescriptions", () => {
  const {
    analyzeAerobicGoalProgress,
    buildAerobicCoachBrief,
    formatPace,
  } = require("./services/aerobicGoalService");

  const now = Date.now();
  const day = 86400000;

  // Simulated real Apple Health payload with HKWorkoutActivityTypeRunning + separate HR samples + VO2 max
  const runStart = new Date(now - 2 * day).toISOString();
  const runMid = new Date(now - 2 * day + 12 * 60000).toISOString();
  const mockHealth = {
    source: "Apple HealthKit",
    vo2Max: { current: 45.0, previous: 43.8 },
    restingHeartRate: { current: 54 },
    heartRate: {
      max: 192,
      min: 54,
      data: [{ date: runMid, value: 158 }], // Should cross-correlate into the run without direct avgHR
    },
    workouts: {
      data: [
        // Moderate "grey zone" 5 km run in 24:00 (4:48/km)
        {
          date: runStart,
          type: "HKWorkoutActivityTypeRunning",
          duration: 24,
          unit: "minutes",
          distance: 5.0,
          distanceUnit: "km",
          calories: 320,
        },
        // Another moderate 40 min run (8 km)
        {
          date: new Date(now - 4 * day).toISOString(),
          type: "HKWorkoutActivityTypeRunning",
          duration: 40,
          unit: "minutes",
          distance: 8.0,
          distanceUnit: "km",
          averageHeartRate: 156,
        },
        // Non-cardio strength workout should be ignored by aerobic analyzer
        {
          date: new Date(now - 3 * day).toISOString(),
          type: "HKWorkoutActivityTypeTraditionalStrengthTraining",
          duration: 50,
          unit: "minutes",
          calories: 280,
        },
      ],
    },
  };

  const analysis = analyzeAerobicGoalProgress(mockHealth, "sub20-5k", { nowMs: now });

  expect(analysis.hasCardioData).toBe(true);
  expect(analysis.totalCardioWorkouts28d).toBe(2);
  // Cross-correlated HR from heartRate.data into first workout
  expect(analysis.recentCardioWorkouts[0].avgHR).toBe(158);
  // VO2 gap: 50.0 - 45.0 = 5.0 ml/kg/min
  expect(analysis.vo2.gap).toBe(5.0);
  expect(analysis.vo2.trend).toBe(1.2);
  // Pace derived directly from measured 5 km in 24 min = 4:48/km vs 4:00/km target
  expect(analysis.pace.source).toBe("measured");
  expect(formatPace(analysis.pace.currentMinPerKm)).toBe("4:48 /km");
  expect(analysis.pace.projectedTimeFormatted).toBe("24:00");
  // Grey-zone threshold trap detected (both runs ~82% HRmax -> moderate)
  expect(analysis.intensity.moderatePct).toBe(100);
  expect(analysis.recommendations.some((r) => r.kbRef === "E13-HR-ZONE-TRAINING")).toBe(true);
  expect(analysis.recommendations.some((r) => r.kbRef === "E2-LISS")).toBe(true);

  const brief = buildAerobicCoachBrief(analysis);
  expect(brief.cardioGoal).toBe("Sub-20 Minute 5K");
  expect(brief.vo2Max).toContain("45 / 50");
});

test("AerobicGoalAnalyzer renders goal gap metrics, FitLib links, and switches presets", () => {
  const AerobicGoalAnalyzer = require("./components/dashboard/AerobicGoalAnalyzer").default;
  const { analyzeAerobicGoalProgress } = require("./services/aerobicGoalService");

  const analysis = analyzeAerobicGoalProgress(
    {
      source: "Apple HealthKit",
      vo2Max: { current: 46.5, previous: 45.5 },
      workouts: {
        data: [
          {
            date: new Date().toISOString(),
            type: "running",
            duration: 30,
            unit: "minutes",
            distance: 6.0,
            distanceUnit: "km",
            averageHeartRate: 138,
          },
        ],
      },
    },
    "sub20-5k"
  );

  const onSelectGoal = jest.fn();
  const onOpenKnowledgeNote = jest.fn();

  render(
    <AerobicGoalAnalyzer
      analysis={analysis}
      selectedGoalId="sub20-5k"
      onSelectGoal={onSelectGoal}
      onOpenKnowledgeNote={onOpenKnowledgeNote}
    />
  );

  expect(screen.getByText(/APPLE HEALTH AEROBIC & CARDIO GOAL ENGINE/i)).toBeInTheDocument();
  expect(screen.getByText(/Sub-20 Minute 5K/i)).toBeInTheDocument();
  expect(screen.getByText(/46.5/)).toBeInTheDocument();

  fireEvent.click(screen.getByText("VO2 Max 55+"));
  expect(onSelectGoal).toHaveBeenCalledWith("vo2-elite");
});

test("Visual Comfort Theme Engine: cycles Obsidian, Matrix Night, and Daylight modes cleanly", () => {
  const {
    applyVisualTheme,
    cycleVisualTheme,
    getSavedTheme,
  } = require("./utils/themeUtils");
  const Header = require("./components/dashboard/Header").default;

  expect(getSavedTheme()).toBe("obsidian");
  const night = cycleVisualTheme("obsidian");
  expect(night).toBe("matrix-night");
  expect(document.documentElement.getAttribute("data-theme")).toBe("matrix-night");
  expect(getSavedTheme()).toBe("matrix-night");

  const day = cycleVisualTheme("matrix-night");
  expect(day).toBe("daylight");
  expect(document.documentElement.getAttribute("data-theme")).toBe("daylight");

  const reset = applyVisualTheme("obsidian");
  expect(reset).toBe("obsidian");

  const onCycleTheme = jest.fn();
  render(
    <Header
      isConnecting={false}
      theme="obsidian"
      onCycleTheme={onCycleTheme}
      onOpenSettings={jest.fn()}
      onOpenAIChatbot={jest.fn()}
    />
  );

  fireEvent.click(screen.getByLabelText(/Switch visual theme/i));
  expect(onCycleTheme).toHaveBeenCalledTimes(1);
});



