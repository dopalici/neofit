import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import ScanlineEffect from "../ui/ScanlineEffect";
import ErrorBoundary from "../ui/ErrorBoundary";
import { DashboardSkeleton, OfflineBanner } from "../ui/LoadingSkeleton";
import OnboardingFlow, { ONBOARDING_STORAGE_KEY } from "../onboarding/OnboardingFlow";
import AIChatbot from "./AIChatbot";
import ActivityLog from "./ActivityLog";
import BiometricPanel from "./BiometricPanel";
import EnhancedNutritionPanel from "./EnhancedNutritionPanel";
import EnhancementMetricsPanel from "./EnhancementMetricsPanel";
import GoalStudioModal from "./GoalStudioModal";
import HabitDashboard from "./HabitDashboard";
import Header from "./Header";
import HealthDataDashboard from "./HealthDataDashboard";
import IntegrationModal from "./IntegrationModal";
import KnowledgeBaseBrowser from "./KnowledgeBaseBrowser";
import SleepAnalysis from "./SleepAnalysis";
import SystemCommandCenter from "./SystemCommandCenter";
import WorkoutLogger from "./WorkoutLogger";
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
import { getFromStorage } from "../../utils/storageUtils";

const TABS = [
  { id: "main", label: "COMMAND CENTER" },
  { id: "workouts", label: "WORKOUTS" },
  { id: "habits", label: "HABIT SYSTEM" },
  { id: "nutrition", label: "NUTRITION" },
  { id: "sleep", label: "SLEEP" },
  { id: "knowledge", label: "FITLIB VAULT" },
  { id: "health", label: "HEALTH DATA" },
];

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
  const [showDeepTelemetry, setShowDeepTelemetry] = useState(true);
  const [systemState, setSystemState] = useState(() => getSystemState());
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );

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

  // Use props data or clean empty structures (no fabricated mock metrics)
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

  // Derived real-time Solo-Leveling System & Physiology intelligence
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

  return (
    <div className="min-h-screen bg-[#060d14] text-slate-100 relative overflow-hidden">
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
        <>
          <Header
            isConnecting={isDataFetching}
            onOpenSettings={() => setShowIntegrationModal(true)}
            onOpenAIChatbot={() => setShowAIChatbot(true)}
          />

          <div className="border-b border-slate-800/90 bg-[#08111a]/80 backdrop-blur">
            <div className="container mx-auto px-6">
              <div className="flex space-x-5 overflow-x-auto">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    className={`py-3 px-2 whitespace-nowrap font-mono text-xs tracking-wider transition-colors ${
                      activeTab === tab.id
                        ? "text-cyan-300 border-b-2 border-cyan-400"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {activeTab === "main" &&
            (isDataFetching && !propsHealthData ? (
              <DashboardSkeleton />
            ) : (
              <ErrorBoundary fallbackTitle="DASHBOARD RENDER ERROR" onReset={refreshAllData}>
                <div className="container mx-auto px-6 py-6 space-y-6">
                  {/* Top Bar: Sync status & subtle title */}
                  <div className="flex justify-between items-center flex-wrap gap-3">
                    <div>
                      <h1 className="text-xl font-semibold text-slate-100 tracking-tight">
                        Daily Performance System
                      </h1>
                      <p className="text-xs text-slate-400">
                        Autoregulated goals, physical skill progressions & literal physiological insights.
                      </p>
                    </div>
                    <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                      <span>
                        SYNCED:{" "}
                        {healthData?.heartRate?.lastUpdated || healthData?.lastSynced || "LOCAL MODE"}
                      </span>
                      <button
                        onClick={refreshAllData}
                        className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-400 hover:text-cyan-200 hover:border-cyan-500/50"
                        title="Refresh All Data"
                      >
                        <span
                          className={
                            isDataFetching ? "animate-spin inline-block" : "inline-block"
                          }
                        >
                          ⟳
                        </span>
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

                  {/* SECONDARY DEEP TELEMETRY (COLLAPSIBLE SO DAILY VIEW STAYS FOCUSED) */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowDeepTelemetry((prev) => !prev)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-[#0b1520] border border-slate-800 rounded-xl text-xs font-mono text-slate-300 hover:border-slate-700 transition-colors mb-4"
                    >
                      <span>DEEP BIOMETRIC TELEMETRY, NUTRITION & ACTIVITY LOG</span>
                      {showDeepTelemetry ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>

                    {showDeepTelemetry && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 space-y-6">
                          <BiometricPanel userData={userData} healthData={healthData} />

                          {habitData && (
                            <div className="bg-[#0b1520] border border-slate-800 rounded-xl p-4">
                              <div className="flex justify-between items-center mb-2">
                                <h3 className="text-xs font-mono text-cyan-300">
                                  DAILY HABIT CHECK-IN
                                </h3>
                                <button
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
                                <div className="w-14 h-14 bg-slate-950 border border-cyan-700 rounded-full flex items-center justify-center">
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
                    )}
                  </div>
                </div>
              </ErrorBoundary>
            ))}

          {activeTab === "workouts" && (
            <ErrorBoundary fallbackTitle="WORKOUT LOGGER ERROR">
              <div className="container mx-auto px-6 py-8">
                <h1 className="text-xl font-semibold text-slate-100 mb-6">
                  Workout Logging & Templates
                </h1>
                <WorkoutLogger onWorkoutLogged={onWorkoutLogged} />
              </div>
            </ErrorBoundary>
          )}

          {activeTab === "habits" && (
            <ErrorBoundary fallbackTitle="HABIT SYSTEM ERROR">
              <HabitDashboard
                userData={userData}
                habitData={habitData}
                onCheckIn={handleCheckIn}
              />
            </ErrorBoundary>
          )}

          {activeTab === "nutrition" && (
            <ErrorBoundary fallbackTitle="NUTRITION MODULE ERROR">
              <div className="container mx-auto px-6 py-8">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-xl font-semibold text-slate-100">
                    Nutrition Optimization
                  </h1>
                  <div className="text-xs text-slate-400 font-mono">
                    DATA LAST SYNCED: {nutritionData?.calories?.lastUpdated || "Never"}
                    <button
                      onClick={syncNutritionData}
                      className="ml-2 text-cyan-400 hover:text-cyan-200"
                      title="Sync nutrition data"
                    >
                      <span className={isDataFetching ? "animate-spin inline-block" : "inline-block"}>
                        ⟳
                      </span>
                    </button>
                  </div>
                </div>

                <EnhancedNutritionPanel
                  nutritionData={nutritionData}
                  onSyncNutrition={syncNutritionData}
                  isSyncing={isDataFetching}
                  onAddMeal={onAddMeal}
                  onAddWater={onAddWater}
                />
              </div>
            </ErrorBoundary>
          )}

          {activeTab === "sleep" && (
            <ErrorBoundary fallbackTitle="SLEEP ANALYSIS ERROR">
              <div className="container mx-auto px-6 py-8">
                <h1 className="text-xl font-semibold text-slate-100 mb-6">
                  Sleep & Recovery Analysis
                </h1>
                <SleepAnalysis sleepData={healthData?.sleep} />
              </div>
            </ErrorBoundary>
          )}

          {activeTab === "knowledge" && (
            <ErrorBoundary fallbackTitle="KNOWLEDGE BASE ERROR">
              <div className="container mx-auto px-6 py-8">
                <KnowledgeBaseBrowser
                  userData={{ healthData, nutritionData, habitData, userGoals }}
                  initialEntryId={selectedKbEntryId}
                  onNavigateToWorkouts={() => setActiveTab("workouts")}
                />
              </div>
            </ErrorBoundary>
          )}

          {activeTab === "health" && (
            <ErrorBoundary fallbackTitle="HEALTH DATA ERROR">
              <HealthDataDashboard />
            </ErrorBoundary>
          )}

          <IntegrationModal
            isOpen={showIntegrationModal}
            onClose={() => setShowIntegrationModal(false)}
            connectedApps={connectedApps}
            onToggleConnection={toggleAppConnection}
          />

          <GoalStudioModal
            isOpen={showGoalStudio}
            onClose={() => setShowGoalStudio(false)}
            onAddGoal={handleAddGoal}
          />

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
            pendingPrompt={pendingCoachPrompt}
            onConsumePendingPrompt={() => setPendingCoachPrompt(null)}
          />
        </>
      )}
    </div>
  );
}
