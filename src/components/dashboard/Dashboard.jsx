import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Compass,
  Dumbbell,
  Eye,
  Flame,
  HeartPulse,
  LayoutGrid,
  Moon,
  RefreshCw,
  Settings,
  Sparkles,
  Sun,
  Utensils,
  X,
} from "lucide-react";
import ScanlineEffect from "../ui/ScanlineEffect";
import ErrorBoundary from "../ui/ErrorBoundary";
import { DashboardSkeleton, OfflineBanner } from "../ui/LoadingSkeleton";
import OnboardingFlow, { ONBOARDING_STORAGE_KEY } from "../onboarding/OnboardingFlow";
import AerobicGoalAnalyzer from "./AerobicGoalAnalyzer";
import Header from "./Header";
import SystemCommandCenter from "./SystemCommandCenter";
import {
  analyzeAerobicGoalProgress,
  getSavedAerobicGoalId,
  saveAerobicGoalId,
} from "../../services/aerobicGoalService";
import {
  advanceGoalRung,
  computeProgressionSummary,
  computeReadinessAssessment,
  generateDailyQuests,
  generateLiteralInsights,
  getSystemState,
  normalizeUserGoals,
  recordSubjectiveReadiness,
  toggleDailyQuest,
} from "../../services/goalEngineService";
import { getFromStorage, saveToStorage } from "../../utils/storageUtils";
import {
  applyVisualTheme,
  cycleVisualTheme,
  getSavedTheme,
} from "../../utils/themeUtils";

// Lazy-load secondary tabs, heavy charts, 3D avatar, modals & AI Coach
// so iPhone XS through iPhone 13 mini cold-start instantaneously
const AIChatbot = lazy(() => import("./AIChatbot"));
const ActivityLog = lazy(() => import("./ActivityLog"));
const BiometricPanel = lazy(() => import("./BiometricPanel"));
const EnhancedNutritionPanel = lazy(() => import("./EnhancedNutritionPanel"));
const EnhancementMetricsPanel = lazy(() => import("./EnhancementMetricsPanel"));
const GoalStudioModal = lazy(() => import("./GoalStudioModal"));
const HabitDashboard = lazy(() => import("./HabitDashboard"));
const HealthDataDashboard = lazy(() => import("./HealthDataDashboard"));
const IntegrationModal = lazy(() => import("./IntegrationModal"));
const KnowledgeBaseBrowser = lazy(() => import("./KnowledgeBaseBrowser"));
const SleepAnalysis = lazy(() => import("./SleepAnalysis"));
const WorkoutLogger = lazy(() => import("./WorkoutLogger"));

const DEEP_TELEMETRY_PREF_KEY = "dashboard-deep-telemetry-open";

const TABS = [
  { id: "main", label: "Today", icon: Compass, mobilePrimary: true },
  { id: "workouts", label: "Workouts", icon: Dumbbell, mobilePrimary: true },
  { id: "nutrition", label: "Fuel", icon: Utensils, mobilePrimary: true },
  { id: "knowledge", label: "FitLib", icon: BookOpen, mobilePrimary: true },
  { id: "health", label: "Health Data", icon: HeartPulse, mobilePrimary: false },
  { id: "sleep", label: "Sleep", icon: Moon, mobilePrimary: false },
  { id: "habits", label: "Habits", icon: Flame, mobilePrimary: false },
];

const THEME_LABELS = {
  obsidian: { label: "Obsidian", icon: Eye },
  "matrix-night": { label: "Matrix Night", icon: Moon },
  daylight: { label: "Daylight", icon: Sun },
};

function ModuleFallback() {
  return (
    <div className="system-window rounded-xl p-6 animate-pulse space-y-3">
      <div className="h-5 w-40 rounded" style={{ backgroundColor: "var(--nv-surface-2)" }} />
      <div className="h-28 rounded-lg" style={{ backgroundColor: "var(--nv-surface-subtle)" }} />
    </div>
  );
}

function getTimeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard({
  userData: propsUserData,
  healthData: propsHealthData,
  nutritionData: propsNutritionData,
  habitData: propsHabitData,
  userGoals: propsUserGoals,
  connectedApps: propsConnectedApps,
  isDataFetching: propsIsDataFetching,
  onCheckIn,
  onToggleConnection,
  onRefreshData,
  onSyncNutrition,
  onAddMeal,
  onAddWater,
  onUpdateGoals,
  onWorkoutLogged,
}) {
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const saved = getFromStorage(ONBOARDING_STORAGE_KEY, null);
    return !(saved && saved.completed);
  });
  const [activeTab, setActiveTab] = useState("main");
  const [todayLens, setTodayLens] = useState("all");
  const [showMobileMore, setShowMobileMore] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [showGoalStudio, setShowGoalStudio] = useState(false);
  const [showAIChatbot, setShowAIChatbot] = useState(false);
  const [pendingCoachPrompt, setPendingCoachPrompt] = useState(null);
  const [selectedKbEntryId, setSelectedKbEntryId] = useState(null);
  const [visualTheme, setVisualTheme] = useState(() => getSavedTheme());
  const [showDeepTelemetry, setShowDeepTelemetry] = useState(() =>
    Boolean(getFromStorage(DEEP_TELEMETRY_PREF_KEY, false))
  );
  const [systemState, setSystemState] = useState(() => getSystemState());
  const [aerobicGoalId, setAerobicGoalId] = useState(() => getSavedAerobicGoalId());
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );

  useEffect(() => {
    applyVisualTheme(visualTheme);
  }, [visualTheme]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const userData = propsUserData || {
    metrics: {
      symmetry: null,
      potential: null,
      efficiency: null,
      recovery: null,
    },
  };

  const healthData = useMemo(
    () =>
      propsHealthData || {
        hasData: false,
        source: "none",
        heartRate: { data: [], lastUpdated: null },
        steps: { data: [], today: null, lastUpdated: null },
        sleep: { data: [], lastUpdated: null },
        workouts: { data: [], recent: [] },
      },
    [propsHealthData]
  );

  const nutritionData = useMemo(
    () =>
      propsNutritionData || {
        source: "none",
        calories: { consumed: 0, goal: 2200, lastUpdated: null },
        protein: { consumed: 0, goal: 140 },
        carbs: { consumed: 0, goal: 220 },
        fat: { consumed: 0, goal: 73 },
        water: { consumed: 0, goal: 3 },
        meals: [],
      },
    [propsNutritionData]
  );

  const habitData = propsHabitData || {
    checkInsData: { lastCheckIn: null },
    streakData: { currentStreak: 0 },
  };

  const userGoals = useMemo(
    () => normalizeUserGoals(propsUserGoals || {}),
    [propsUserGoals]
  );

  const connectedApps = propsConnectedApps || {
    appleHealth: false,
    myFitnessPal: false,
    strava: false,
  };

  const isDataFetching = propsIsDataFetching || false;

  const handleCheckIn = onCheckIn || (() => {});
  const toggleAppConnection = onToggleConnection || (() => {});
  const refreshAllData = onRefreshData || (() => {});
  const syncNutritionData = onSyncNutrition || (() => {});

  const progression = useMemo(
    () => computeProgressionSummary(systemState),
    [systemState]
  );

  const readiness = useMemo(
    () => computeReadinessAssessment(healthData, nutritionData, systemState),
    [healthData, nutritionData, systemState]
  );

  const dailyQuests = useMemo(
    () => generateDailyQuests(userGoals, readiness, nutritionData, systemState),
    [userGoals, readiness, nutritionData, systemState]
  );

  const literalInsights = useMemo(
    () => generateLiteralInsights(userGoals, readiness, nutritionData, progression),
    [userGoals, readiness, nutritionData, progression]
  );

  const aerobicAnalysis = useMemo(
    () => analyzeAerobicGoalProgress(healthData, aerobicGoalId),
    [healthData, aerobicGoalId]
  );

  const handleSelectAerobicGoal = (nextId) => {
    const saved = saveAerobicGoalId(nextId);
    setAerobicGoalId(saved);
  };

  const handleCycleTheme = () => {
    const next = cycleVisualTheme(visualTheme);
    setVisualTheme(next);
  };

  const handleSelectTheme = (nextTheme) => {
    const applied = applyVisualTheme(nextTheme);
    setVisualTheme(applied);
  };

  const handleToggleDeepTelemetry = () => {
    setShowDeepTelemetry((prev) => {
      const next = !prev;
      saveToStorage(DEEP_TELEMETRY_PREF_KEY, next);
      return next;
    });
  };

  const handleToggleQuest = (questId, xpReward) => {
    const next = toggleDailyQuest(questId, xpReward);
    setSystemState(next);
  };

  const handleRecordReadiness = (payload) => {
    const next = recordSubjectiveReadiness(payload);
    setSystemState(next);
  };

  const handleAdvanceRung = (goalId) => {
    const { updatedGoals, systemState: nextSys } = advanceGoalRung(userGoals, goalId);
    setSystemState(nextSys);
    if (onUpdateGoals) onUpdateGoals(updatedGoals);
  };

  const handleAddGoal = (newGoal) => {
    const nextGoals = {
      ...userGoals,
      [newGoal.id]: newGoal,
    };
    if (onUpdateGoals) onUpdateGoals(nextGoals);
  };

  const handleRemoveGoal = (goalId) => {
    const nextGoals = { ...userGoals };
    delete nextGoals[goalId];
    if (onUpdateGoals) onUpdateGoals(nextGoals);
  };

  const handleAskCoach = (prompt) => {
    setPendingCoachPrompt(prompt);
    setShowAIChatbot(true);
  };

  const handleOpenKnowledgeNote = (entryId) => {
    setSelectedKbEntryId(entryId);
    setActiveTab("knowledge");
  };

  const navigateTab = (tabId) => {
    setActiveTab(tabId);
    setShowMobileMore(false);
  };

  const greeting = getTimeOfDayGreeting();
  const completedToday = dailyQuests.filter((q) => q.completed).length;
  const themeMeta = THEME_LABELS[visualTheme] || THEME_LABELS.obsidian;
  const ThemeIcon = themeMeta.icon;
  const isOverflowTabActive = ["health", "sleep", "habits"].includes(activeTab);

  return (
    <div className="nv-app-shell nv-shell min-h-screen relative safe-scroll-pad">
      <ScanlineEffect />
      {isOffline && <OfflineBanner />}

      {showOnboarding ? (
        <OnboardingFlow
          onComplete={() => {
            setShowOnboarding(false);
            refreshAllData();
          }}
          onUpdateGoals={onUpdateGoals}
        />
      ) : (
        <div className="relative z-10 lg:flex min-h-screen">
          {/* Desktop Persistent Left Command Rail (eliminates double-stacked top headers) */}
          <aside
            aria-label="Primary Navigation"
            className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0 sticky top-0 h-screen border-r justify-between px-4 py-5"
            style={{
              backgroundColor: "var(--nv-bg-elevated)",
              borderColor: "var(--nv-rule)",
            }}
          >
            <div className="space-y-6">
              {/* Wordmark */}
              <div className="px-2.5 flex items-center justify-between">
                <span
                  className="text-base font-bold tracking-wider"
                  style={{ color: "var(--nv-text)" }}
                >
                  NEO<span style={{ color: "var(--nv-accent)" }}>•</span>VITRU
                </span>
                {isDataFetching && (
                  <RefreshCw
                    size={13}
                    className="animate-spin"
                    style={{ color: "var(--nv-accent)" }}
                    aria-label="Syncing"
                  />
                )}
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => navigateTab(tab.id)}
                      className="w-full relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left"
                      style={{
                        backgroundColor: isActive ? "var(--nv-surface)" : "transparent",
                        color: isActive ? "var(--nv-text)" : "var(--nv-text-secondary)",
                      }}
                    >
                      {isActive && (
                        <span
                          className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                          style={{ backgroundColor: "var(--nv-accent)" }}
                          aria-hidden="true"
                        />
                      )}
                      <Icon
                        size={16}
                        style={{
                          color: isActive ? "var(--nv-accent)" : "var(--nv-text-muted)",
                        }}
                        aria-hidden="true"
                      />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Operator Utility Footer */}
            <div className="space-y-2.5 pt-4 nv-rule-top">
              <div className="px-2.5 py-2 flex items-center justify-between text-xs">
                <span className="font-semibold" style={{ color: "var(--nv-text)" }}>
                  {progression?.rank || "E"}-Rank · Lv {progression?.level || 1}
                </span>
                <span className="tabular-nums" style={{ color: "var(--nv-text-muted)" }}>
                  {progression?.consistency14d ?? 0}% · 14d
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowAIChatbot(true)}
                className="w-full h-10 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                style={{
                  backgroundColor: "var(--nv-accent-soft)",
                  border: "1px solid var(--nv-border-strong)",
                  color: "var(--nv-accent)",
                }}
              >
                <Sparkles size={14} aria-hidden="true" />
                <span>AI Coach</span>
              </button>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={handleCycleTheme}
                  aria-label={`Switch visual theme (current: ${themeMeta.label})`}
                  className="h-9 px-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  style={{
                    backgroundColor: "var(--nv-surface)",
                    borderColor: "var(--nv-rule)",
                    color: "var(--nv-text-secondary)",
                  }}
                >
                  <ThemeIcon size={13} style={{ color: "var(--nv-accent)" }} aria-hidden="true" />
                  <span className="truncate">{themeMeta.label.split(" ")[0]}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowIntegrationModal(true)}
                  aria-label="Open Settings and Integrations"
                  className="h-9 px-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  style={{
                    backgroundColor: "var(--nv-surface)",
                    borderColor: "var(--nv-rule)",
                    color: "var(--nv-text-secondary)",
                  }}
                >
                  <Settings size={13} aria-hidden="true" />
                  <span>Settings</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Workspace Column */}
          <div className="flex-1 min-w-0">
            {/* Mobile & Tablet Slim Header (hidden on desktop where rail takes over) */}
            <Header
              className="lg:hidden"
              isConnecting={isDataFetching}
              theme={visualTheme}
              onCycleTheme={handleCycleTheme}
              onOpenSettings={() => setShowIntegrationModal(true)}
              onOpenAIChatbot={() => setShowAIChatbot(true)}
            />

            {activeTab === "main" &&
              (isDataFetching && !propsHealthData ? (
                <DashboardSkeleton />
              ) : (
                <ErrorBoundary fallbackTitle="DASHBOARD RENDER ERROR" onReset={refreshAllData}>
                  <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
                    {/* Calm Daily Header + Segmented Focus Lens */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 nv-rule-bottom">
                      <div>
                        <h1
                          className="text-2xl sm:text-3xl font-semibold tracking-tight"
                          style={{ color: "var(--nv-text)" }}
                        >
                          {greeting}.
                        </h1>
                        <p className="text-sm mt-1" style={{ color: "var(--nv-text-secondary)" }}>
                          {completedToday === dailyQuests.length && dailyQuests.length > 0
                            ? "All daily quests cleared. Recovery and consistency locked in."
                            : `${completedToday} of ${dailyQuests.length} daily quests cleared · Focus on your highest-leverage next step.`}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        {/* Segmented lens prevents scroll fatigue on Today view */}
                        <div
                          className="inline-flex rounded-lg p-0.5 border"
                          style={{
                            backgroundColor: "var(--nv-surface-subtle)",
                            borderColor: "var(--nv-rule)",
                          }}
                          role="tablist"
                          aria-label="Today briefing focus"
                        >
                          {[
                            { id: "all", label: "Full Brief" },
                            { id: "quests", label: "Quests" },
                            { id: "cardio", label: "Cardio" },
                          ].map((lens) => {
                            const active = todayLens === lens.id;
                            return (
                              <button
                                key={lens.id}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => setTodayLens(lens.id)}
                                className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                                style={{
                                  backgroundColor: active ? "var(--nv-surface-2)" : "transparent",
                                  color: active ? "var(--nv-text)" : "var(--nv-text-muted)",
                                }}
                              >
                                {lens.label}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={refreshAllData}
                          className="h-9 px-3 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                          style={{
                            backgroundColor: "var(--nv-surface)",
                            borderColor: "var(--nv-rule)",
                            color: "var(--nv-text-secondary)",
                          }}
                          title="Refresh Apple Health & local telemetry"
                          aria-label="Refresh health data"
                        >
                          <RefreshCw
                            size={13}
                            className={isDataFetching ? "animate-spin" : ""}
                            style={{ color: "var(--nv-accent)" }}
                            aria-hidden="true"
                          />
                          <span className="tabular-nums">
                            {healthData?.heartRate?.lastUpdated ||
                              healthData?.lastSynced ||
                              "Sync"}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* PRIMARY 60-SECOND WORKSPACE */}
                    {(todayLens === "all" || todayLens === "quests") && (
                      <SystemCommandCenter
                        goals={userGoals}
                        readiness={readiness}
                        progression={progression}
                        dailyQuests={dailyQuests}
                        literalInsights={literalInsights}
                        onToggleQuest={handleToggleQuest}
                        onRecordReadiness={handleRecordReadiness}
                        onAdvanceRung={handleAdvanceRung}
                        onRemoveGoal={handleRemoveGoal}
                        onOpenGoalStudio={() => setShowGoalStudio(true)}
                        onAskCoach={handleAskCoach}
                        onOpenKnowledgeNote={handleOpenKnowledgeNote}
                      />
                    )}

                    {/* APPLE HEALTH WORKOUT -> AEROBIC / CARDIO GOAL ENGINE */}
                    {(todayLens === "all" || todayLens === "cardio") && (
                      <AerobicGoalAnalyzer
                        analysis={aerobicAnalysis}
                        selectedGoalId={aerobicGoalId}
                        onSelectGoal={handleSelectAerobicGoal}
                        onOpenKnowledgeNote={handleOpenKnowledgeNote}
                        onAskCoach={handleAskCoach}
                        onOpenHealthImport={() => navigateTab("health")}
                        onOpenWorkouts={() => navigateTab("workouts")}
                      />
                    )}

                    {/* SECONDARY DEEP TELEMETRY (LAZY + COLLAPSED BY DEFAULT FOR RAPID iPHONE BOOT) */}
                    {todayLens === "all" && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleToggleDeepTelemetry}
                          className="w-full flex items-center justify-between px-5 py-4 rounded-xl border text-left transition-colors"
                          style={{
                            backgroundColor: "var(--nv-surface)",
                            borderColor: "var(--nv-rule)",
                          }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Activity
                              size={16}
                              style={{ color: "var(--nv-accent)" }}
                              className="shrink-0"
                              aria-hidden="true"
                            />
                            <div className="min-w-0">
                              <span
                                className="text-sm font-semibold block"
                                style={{ color: "var(--nv-text)" }}
                              >
                                Deep Biometric Telemetry & 3D Anatomy
                              </span>
                              <span
                                className="text-xs block truncate"
                                style={{ color: "var(--nv-text-muted)" }}
                              >
                                {showDeepTelemetry
                                  ? "Hide detailed metrics, macros, workout history, and 3D viewer"
                                  : "Expand detailed metrics, macros, activity log, and optional 3D viewer"}
                              </span>
                            </div>
                          </div>
                          {showDeepTelemetry ? (
                            <ChevronUp size={16} style={{ color: "var(--nv-text-muted)" }} />
                          ) : (
                            <ChevronDown size={16} style={{ color: "var(--nv-text-muted)" }} />
                          )}
                        </button>

                        {showDeepTelemetry && (
                          <div className="mt-5">
                            <Suspense fallback={<ModuleFallback />}>
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-1 space-y-6">
                                  <BiometricPanel userData={userData} healthData={healthData} />

                                  {habitData && (
                                    <div className="system-window rounded-xl p-5">
                                      <div className="flex justify-between items-center mb-3">
                                        <h3
                                          className="text-xs font-semibold uppercase tracking-wide"
                                          style={{ color: "var(--nv-accent)" }}
                                        >
                                          Daily Habit Check-In
                                        </h3>
                                        <button
                                          type="button"
                                          onClick={handleCheckIn}
                                          className="text-xs font-medium"
                                          style={{ color: "var(--nv-accent)" }}
                                          disabled={
                                            habitData.checkInsData?.lastCheckIn ===
                                            new Date().toISOString().split("T")[0]
                                          }
                                        >
                                          {habitData.checkInsData?.lastCheckIn ===
                                          new Date().toISOString().split("T")[0]
                                            ? "Checked in"
                                            : "Check in"}
                                        </button>
                                      </div>
                                      <div className="flex items-center">
                                        <div
                                          className="w-12 h-12 rounded-full flex items-center justify-center border"
                                          style={{
                                            backgroundColor: "var(--nv-surface-subtle)",
                                            borderColor: "var(--nv-border-strong)",
                                          }}
                                        >
                                          <span
                                            className="text-lg font-bold tabular-nums"
                                            style={{ color: "var(--nv-accent)" }}
                                          >
                                            {habitData.streakData?.currentStreak || 0}
                                          </span>
                                        </div>
                                        <div className="ml-4">
                                          <p
                                            className="text-xs font-medium"
                                            style={{ color: "var(--nv-text)" }}
                                          >
                                            {habitData.streakData?.currentStreak
                                              ? `${habitData.streakData.currentStreak}-day streak`
                                              : "Log your daily check-in"}
                                          </p>
                                          <button
                                            type="button"
                                            onClick={() => navigateTab("habits")}
                                            className="text-xs mt-1"
                                            style={{ color: "var(--nv-accent)" }}
                                          >
                                            Open habit system →
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="lg:col-span-2 space-y-6">
                                  <EnhancementMetricsPanel healthData={healthData} />

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <EnhancedNutritionPanel
                                      nutritionData={nutritionData}
                                      onSyncNutrition={syncNutritionData}
                                      isSyncing={isDataFetching}
                                      onAddMeal={onAddMeal}
                                      onAddWater={onAddWater}
                                    />
                                    <ActivityLog workouts={healthData?.workouts?.data} />
                                  </div>
                                </div>
                              </div>
                            </Suspense>
                          </div>
                        )}
                      </div>
                    )}
                  </main>
                </ErrorBoundary>
              ))}

            {activeTab === "workouts" && (
              <ErrorBoundary fallbackTitle="WORKOUT LOGGER ERROR">
                <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                  <h1 className="text-2xl font-semibold mb-6" style={{ color: "var(--nv-text)" }}>
                    Workouts & Cardio Templates
                  </h1>
                  <Suspense fallback={<ModuleFallback />}>
                    <WorkoutLogger onWorkoutLogged={onWorkoutLogged} />
                  </Suspense>
                </main>
              </ErrorBoundary>
            )}

            {activeTab === "habits" && (
              <ErrorBoundary fallbackTitle="HABIT SYSTEM ERROR">
                <Suspense
                  fallback={
                    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
                      <ModuleFallback />
                    </div>
                  }
                >
                  <HabitDashboard
                    userData={userData}
                    habitData={habitData}
                    onCheckIn={handleCheckIn}
                  />
                </Suspense>
              </ErrorBoundary>
            )}

            {activeTab === "nutrition" && (
              <ErrorBoundary fallbackTitle="NUTRITION MODULE ERROR">
                <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                  <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                    <h1 className="text-2xl font-semibold" style={{ color: "var(--nv-text)" }}>
                      Fuel & Macros
                    </h1>
                    <div
                      className="text-xs font-mono flex items-center gap-2"
                      style={{ color: "var(--nv-text-muted)" }}
                    >
                      <span>Synced: {nutritionData?.calories?.lastUpdated || "Local"}</span>
                      <button
                        type="button"
                        onClick={syncNutritionData}
                        className="p-1.5 rounded-lg border"
                        style={{
                          borderColor: "var(--nv-rule)",
                          color: "var(--nv-accent)",
                        }}
                        title="Sync nutrition data"
                        aria-label="Sync nutrition data"
                      >
                        <RefreshCw
                          size={13}
                          className={isDataFetching ? "animate-spin" : ""}
                        />
                      </button>
                    </div>
                  </div>

                  <Suspense fallback={<ModuleFallback />}>
                    <EnhancedNutritionPanel
                      nutritionData={nutritionData}
                      onSyncNutrition={syncNutritionData}
                      isSyncing={isDataFetching}
                      onAddMeal={onAddMeal}
                      onAddWater={onAddWater}
                    />
                  </Suspense>
                </main>
              </ErrorBoundary>
            )}

            {activeTab === "sleep" && (
              <ErrorBoundary fallbackTitle="SLEEP ANALYSIS ERROR">
                <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                  <h1 className="text-2xl font-semibold mb-6" style={{ color: "var(--nv-text)" }}>
                    Sleep & Recovery
                  </h1>
                  <Suspense fallback={<ModuleFallback />}>
                    <SleepAnalysis sleepData={healthData?.sleep} />
                  </Suspense>
                </main>
              </ErrorBoundary>
            )}

            {activeTab === "knowledge" && (
              <ErrorBoundary fallbackTitle="KNOWLEDGE BASE ERROR">
                <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                  <Suspense fallback={<ModuleFallback />}>
                    <KnowledgeBaseBrowser
                      userData={{ healthData, nutritionData, habitData, userGoals }}
                      initialEntryId={selectedKbEntryId}
                      onNavigateToWorkouts={() => navigateTab("workouts")}
                    />
                  </Suspense>
                </main>
              </ErrorBoundary>
            )}

            {activeTab === "health" && (
              <ErrorBoundary fallbackTitle="HEALTH DATA ERROR">
                <Suspense
                  fallback={
                    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
                      <ModuleFallback />
                    </div>
                  }
                >
                  <HealthDataDashboard />
                </Suspense>
              </ErrorBoundary>
            )}
          </div>

          {/* Mobile & Tablet Safe-Area Bottom Dock (Every module reachable via 4 primary + More sheet) */}
          <nav
            aria-label="Mobile Navigation"
            className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t backdrop-blur-lg px-2 pt-1.5 safe-bottom"
            style={{
              backgroundColor: "color-mix(in oklab, var(--nv-bg-elevated) 94%, transparent)",
              borderColor: "var(--nv-rule)",
            }}
          >
            <div className="grid grid-cols-5 gap-1">
              {TABS.filter((t) => t.mobilePrimary).map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => navigateTab(tab.id)}
                    className="flex flex-col items-center justify-center py-2 rounded-lg text-[11px] font-medium transition-colors"
                    style={{
                      color: isActive ? "var(--nv-accent)" : "var(--nv-text-muted)",
                      backgroundColor: isActive ? "var(--nv-accent-soft)" : "transparent",
                    }}
                  >
                    <Icon size={18} className="mb-0.5" aria-hidden="true" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setShowMobileMore((prev) => !prev)}
                aria-expanded={showMobileMore}
                className="flex flex-col items-center justify-center py-2 rounded-lg text-[11px] font-medium transition-colors"
                style={{
                  color:
                    showMobileMore || isOverflowTabActive
                      ? "var(--nv-accent)"
                      : "var(--nv-text-muted)",
                  backgroundColor:
                    showMobileMore || isOverflowTabActive
                      ? "var(--nv-accent-soft)"
                      : "transparent",
                }}
              >
                <LayoutGrid size={18} className="mb-0.5" aria-hidden="true" />
                <span>More</span>
              </button>
            </div>
          </nav>

          {/* Mobile Overflow Drawer (Health Data, Sleep, Habits — zero hidden modules on iPhone 13 mini) */}
          {showMobileMore && (
            <div
              className="lg:hidden fixed inset-0 z-40 flex items-end"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.55)" }}
              onClick={() => setShowMobileMore(false)}
            >
              <div
                className="w-full rounded-t-2xl border-t p-5 safe-bottom space-y-3"
                style={{
                  backgroundColor: "var(--nv-surface)",
                  borderColor: "var(--nv-rule)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-2 nv-rule-bottom">
                  <span className="text-sm font-semibold" style={{ color: "var(--nv-text)" }}>
                    More Modules
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowMobileMore(false)}
                    aria-label="Close menu"
                    className="p-1.5 rounded-lg"
                    style={{ color: "var(--nv-text-muted)" }}
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  {TABS.filter((t) => !t.mobilePrimary).map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => navigateTab(tab.id)}
                        className="flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl border text-xs font-medium transition-colors"
                        style={{
                          backgroundColor: active
                            ? "var(--nv-accent-soft)"
                            : "var(--nv-surface-subtle)",
                          borderColor: active ? "var(--nv-border-strong)" : "var(--nv-rule)",
                          color: active ? "var(--nv-accent)" : "var(--nv-text)",
                        }}
                      >
                        <Icon size={20} aria-hidden="true" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Lazy-Mounted Modals & AI Coach */}
          {showIntegrationModal && (
            <Suspense fallback={null}>
              <IntegrationModal
                isOpen={showIntegrationModal}
                onClose={() => setShowIntegrationModal(false)}
                connectedApps={connectedApps}
                onToggleConnection={toggleAppConnection}
                theme={visualTheme}
                onSelectTheme={handleSelectTheme}
              />
            </Suspense>
          )}

          {showGoalStudio && (
            <Suspense fallback={null}>
              <GoalStudioModal
                isOpen={showGoalStudio}
                onClose={() => setShowGoalStudio(false)}
                onAddGoal={handleAddGoal}
              />
            </Suspense>
          )}

          {showAIChatbot && (
            <Suspense fallback={null}>
              <AIChatbot
                isOpen={showAIChatbot}
                onClose={() => setShowAIChatbot(false)}
                healthData={healthData}
                nutritionData={nutritionData}
                habitData={habitData}
                userGoals={userGoals}
                readiness={readiness}
                progression={progression}
                systemState={systemState}
                aerobicAnalysis={aerobicAnalysis}
                pendingPrompt={pendingCoachPrompt}
                onConsumePendingPrompt={() => setPendingCoachPrompt(null)}
              />
            </Suspense>
          )}
        </div>
      )}
    </div>
  );
}
