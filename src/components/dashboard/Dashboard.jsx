import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Compass,
  Dumbbell,
  Flame,
  HeartPulse,
  Moon,
  RefreshCw,
  Sparkles,
  Utensils,
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
  { id: "main", label: "Today", icon: Compass, mobileDock: true },
  { id: "workouts", label: "Workouts", icon: Dumbbell, mobileDock: true },
  { id: "nutrition", label: "Nutrition", icon: Utensils, mobileDock: true },
  { id: "habits", label: "Habits", icon: Flame, mobileDock: false },
  { id: "sleep", label: "Sleep", icon: Moon, mobileDock: false },
  { id: "knowledge", label: "FitLib", icon: BookOpen, mobileDock: true },
  { id: "health", label: "Health Data", icon: HeartPulse, mobileDock: true },
];

function ModuleFallback() {
  return (
    <div className="system-window rounded-2xl p-6 animate-pulse space-y-3">
      <div className="h-5 w-40 bg-slate-800/70 rounded" />
      <div className="h-28 bg-slate-800/40 rounded-xl" />
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

  const greeting = getTimeOfDayGreeting();
  const completedToday = dailyQuests.filter((q) => q.completed).length;

  return (
    <div
      className="nv-app-shell min-h-screen relative overflow-x-hidden safe-scroll-pad"
      style={{ backgroundColor: "var(--nv-bg)", color: "var(--nv-text)" }}
    >
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
        <div className="relative z-10">
          <Header
            isConnecting={isDataFetching}
            theme={visualTheme}
            onCycleTheme={handleCycleTheme}
            onOpenSettings={() => setShowIntegrationModal(true)}
            onOpenAIChatbot={() => setShowAIChatbot(true)}
          />

          {/* Clean Icon + Label Navigation Strip */}
          <nav
            aria-label="Primary Navigation"
            className="border-b backdrop-blur-md"
            style={{
              backgroundColor: "color-mix(in srgb, var(--nv-bg-elevated) 78%, transparent)",
              borderColor: "var(--nv-border)",
            }}
          >
            <div className="container mx-auto max-w-7xl px-4 sm:px-6">
              <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-1.5">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      className={`py-2 px-3 rounded-lg whitespace-nowrap text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        isActive
                          ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/35"
                          : "text-slate-400 hover:text-slate-100 border border-transparent"
                      }`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <Icon size={14} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>

          {activeTab === "main" &&
            (isDataFetching && !propsHealthData ? (
              <DashboardSkeleton />
            ) : (
              <ErrorBoundary fallbackTitle="DASHBOARD RENDER ERROR" onReset={refreshAllData}>
                <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-5 sm:py-6 space-y-5 sm:space-y-6">
                  {/* Friendly 60-Second Daily Welcome Strip */}
                  <div className="flex justify-between items-start sm:items-center flex-wrap gap-3">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
                        {greeting} — Today’s Brief
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                        {completedToday === dailyQuests.length && dailyQuests.length > 0
                          ? "All daily quests complete. Recovery and consistency locked in."
                          : `${completedToday}/${dailyQuests.length} daily quests done · Focus on your highest-leverage next step.`}
                      </p>
                    </div>
                    <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                      <span>
                        SYNC:{" "}
                        {healthData?.heartRate?.lastUpdated ||
                          healthData?.lastSynced ||
                          "LOCAL MODE"}
                      </span>
                      <button
                        type="button"
                        onClick={refreshAllData}
                        className="p-2 rounded-lg nv-surface-subtle text-cyan-400 hover:text-cyan-200 transition-colors"
                        title="Refresh All Data"
                        aria-label="Refresh health data"
                      >
                        <RefreshCw
                          size={14}
                          className={isDataFetching ? "animate-spin" : ""}
                        />
                      </button>
                    </div>
                  </div>

                  {/* PRIMARY 60-SECOND WORKSPACE */}
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

                  {/* APPLE HEALTH WORKOUT -> AEROBIC / CARDIO GOAL ENGINE */}
                  <AerobicGoalAnalyzer
                    analysis={aerobicAnalysis}
                    selectedGoalId={aerobicGoalId}
                    onSelectGoal={handleSelectAerobicGoal}
                    onOpenKnowledgeNote={handleOpenKnowledgeNote}
                    onAskCoach={handleAskCoach}
                    onOpenHealthImport={() => setActiveTab("health")}
                    onOpenWorkouts={() => setActiveTab("workouts")}
                  />

                  {/* SECONDARY DEEP TELEMETRY (LAZY + COLLAPSED BY DEFAULT FOR RAPID iPHONE BOOT) */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleToggleDeepTelemetry}
                      className="system-window w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-left hover:border-cyan-500/40 transition-colors mb-4"
                    >
                      <div className="flex items-center gap-3">
                        <Activity size={16} className="text-cyan-400 shrink-0" />
                        <div>
                          <span className="text-xs font-mono uppercase tracking-wider text-slate-200 block">
                            Deep Biometric Telemetry & 3D Avatar
                          </span>
                          <span className="text-xs text-slate-400">
                            {showDeepTelemetry
                              ? "Hide detailed metrics, nutrition, activity log & 3D avatar"
                              : "Tap to load deeper biometrics, macros & full workout log"}
                          </span>
                        </div>
                      </div>
                      {showDeepTelemetry ? (
                        <ChevronUp size={16} className="text-slate-400 shrink-0" />
                      ) : (
                        <ChevronDown size={16} className="text-slate-400 shrink-0" />
                      )}
                    </button>

                    {showDeepTelemetry && (
                      <Suspense fallback={<ModuleFallback />}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="lg:col-span-1 space-y-6">
                            <BiometricPanel userData={userData} healthData={healthData} />

                            {habitData && (
                              <div className="system-window rounded-2xl p-5">
                                <div className="flex justify-between items-center mb-3">
                                  <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-300">
                                    Daily Habit Check-In
                                  </h3>
                                  <button
                                    type="button"
                                    onClick={handleCheckIn}
                                    className="text-xs text-cyan-400 font-mono hover:text-cyan-200"
                                    disabled={
                                      habitData.checkInsData?.lastCheckIn ===
                                      new Date().toISOString().split("T")[0]
                                    }
                                  >
                                    {habitData.checkInsData?.lastCheckIn ===
                                    new Date().toISOString().split("T")[0]
                                      ? "CHECKED IN"
                                      : "CHECK IN"}
                                  </button>
                                </div>
                                <div className="flex items-center">
                                  <div className="w-14 h-14 nv-surface-subtle border-cyan-500/40 rounded-full flex items-center justify-center">
                                    <span className="text-lg font-bold text-cyan-300 font-mono">
                                      {habitData.streakData?.currentStreak || 0}
                                    </span>
                                  </div>
                                  <div className="ml-4">
                                    <p className="text-xs text-slate-300 font-mono">
                                      {habitData.streakData?.currentStreak
                                        ? `${habitData.streakData.currentStreak}-DAY STREAK`
                                        : "LOG YOUR DAILY CHECK-IN"}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => setActiveTab("habits")}
                                      className="text-xs text-cyan-400 font-mono hover:text-cyan-300 mt-1"
                                    >
                                      OPEN HABIT SYSTEM →
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
                    )}
                  </div>
                </div>
              </ErrorBoundary>
            ))}

          {activeTab === "workouts" && (
            <ErrorBoundary fallbackTitle="WORKOUT LOGGER ERROR">
              <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
                <h1 className="text-xl font-bold text-slate-100 mb-6">
                  Workout Logging & Cardio Templates
                </h1>
                <Suspense fallback={<ModuleFallback />}>
                  <WorkoutLogger onWorkoutLogged={onWorkoutLogged} />
                </Suspense>
              </div>
            </ErrorBoundary>
          )}

          {activeTab === "habits" && (
            <ErrorBoundary fallbackTitle="HABIT SYSTEM ERROR">
              <Suspense fallback={<div className="container mx-auto max-w-7xl px-4 py-6"><ModuleFallback /></div>}>
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
              <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-xl font-bold text-slate-100">
                    Nutrition Optimization
                  </h1>
                  <div className="text-xs text-slate-400 font-mono">
                    DATA LAST SYNCED: {nutritionData?.calories?.lastUpdated || "Never"}
                    <button
                      type="button"
                      onClick={syncNutritionData}
                      className="ml-2 text-cyan-400 hover:text-cyan-200"
                      title="Sync nutrition data"
                    >
                      <span
                        className={isDataFetching ? "animate-spin inline-block" : "inline-block"}
                      >
                        ⟳
                      </span>
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
              </div>
            </ErrorBoundary>
          )}

          {activeTab === "sleep" && (
            <ErrorBoundary fallbackTitle="SLEEP ANALYSIS ERROR">
              <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
                <h1 className="text-xl font-bold text-slate-100 mb-6">
                  Sleep & Recovery Analysis
                </h1>
                <Suspense fallback={<ModuleFallback />}>
                  <SleepAnalysis sleepData={healthData?.sleep} />
                </Suspense>
              </div>
            </ErrorBoundary>
          )}

          {activeTab === "knowledge" && (
            <ErrorBoundary fallbackTitle="KNOWLEDGE BASE ERROR">
              <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
                <Suspense fallback={<ModuleFallback />}>
                  <KnowledgeBaseBrowser
                    userData={{ healthData, nutritionData, habitData, userGoals }}
                    initialEntryId={selectedKbEntryId}
                    onNavigateToWorkouts={() => setActiveTab("workouts")}
                  />
                </Suspense>
              </div>
            </ErrorBoundary>
          )}

          {activeTab === "health" && (
            <ErrorBoundary fallbackTitle="HEALTH DATA ERROR">
              <Suspense fallback={<div className="container mx-auto max-w-7xl px-4 py-6"><ModuleFallback /></div>}>
                <HealthDataDashboard />
              </Suspense>
            </ErrorBoundary>
          )}

          {/* Responsive Mobile Bottom Navigation Dock (iPhone XS / 13 mini Safe-Area Aware) */}
          <nav
            aria-label="Mobile Navigation"
            className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t backdrop-blur-lg px-2 pt-1.5 safe-bottom"
            style={{
              backgroundColor: "color-mix(in srgb, var(--nv-bg-elevated) 94%, transparent)",
              borderColor: "var(--nv-border)",
            }}
          >
            <div className="grid grid-cols-5 gap-1">
              {TABS.filter((t) => t.mobileDock).map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                      isActive ? "text-cyan-300 bg-cyan-500/10" : "text-slate-400"
                    }`}
                  >
                    <Icon size={17} className="mb-0.5" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Lightweight Floating AI Coach Button (zero AIChatbot chunk loaded until tapped) */}
          {!showAIChatbot && (
            <button
              type="button"
              onClick={() => setShowAIChatbot(true)}
              title="Open System AI Coach"
              aria-label="Open System AI Coach"
              className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 bg-cyan-400 text-slate-950 rounded-full p-3.5 shadow-xl shadow-cyan-950/50 hover:bg-cyan-300 transition-colors z-40"
            >
              <Sparkles size={20} />
            </button>
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
