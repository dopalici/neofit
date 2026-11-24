import React, { useEffect, useState } from "react";
import ScanlineEffect from "../ui/ScanlineEffect";
import ErrorBoundary from "../ui/ErrorBoundary";
import { DashboardSkeleton, OfflineBanner } from "../ui/LoadingSkeleton";
import OnboardingFlow, { ONBOARDING_STORAGE_KEY } from "../onboarding/OnboardingFlow";
import AIChatbot from "./AIChatbot";
import ActivityLog from "./ActivityLog";
import BiometricPanel from "./BiometricPanel";
import EnhancedNutritionPanel from "./EnhancedNutritionPanel";
import EnhancementMetricsPanel from "./EnhancementMetricsPanel";
import EnhancementProtocolsPanel from "./EnhancementProtocolsPanel";
import HabitDashboard from "./HabitDashboard";
import Header from "./Header";
import HealthDataDashboard from "./HealthDataDashboard";
import IntegrationModal from "./IntegrationModal";
import KnowledgeBaseBrowser from "./KnowledgeBaseBrowser";
import SleepAnalysis from "./SleepAnalysis";
import WorkoutLogger from "./WorkoutLogger";
import { manageChallenge } from "../../services/habitService";
import { getFromStorage } from "../../utils/storageUtils";

const TABS = [
  { id: "main", label: "DASHBOARD" },
  { id: "workouts", label: "WORKOUTS" },
  { id: "habits", label: "HABIT SYSTEM" },
  { id: "nutrition", label: "NUTRITION" },
  { id: "sleep", label: "SLEEP" },
  { id: "knowledge", label: "KNOWLEDGE" },
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
  const [showAIChatbot, setShowAIChatbot] = useState(false);
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

  // Use props data or clean empty structures (no hardcoded mock metrics)
  const userData = propsUserData || {
    metrics: {
      symmetry: null,
      potential: null,
      efficiency: null,
      recovery: null,
    },
  };

  const healthData = propsHealthData || {
    hasData: false,
    source: "none",
    heartRate: { data: [], lastUpdated: null },
    steps: { data: [], today: null, lastUpdated: null },
    sleep: { data: [], lastUpdated: null },
    workouts: { data: [], recent: [] },
  };

  const nutritionData = propsNutritionData || {
    source: "none",
    calories: { consumed: 0, goal: 2200, lastUpdated: null },
    protein: { consumed: 0, goal: 140 },
    carbs: { consumed: 0, goal: 220 },
    fat: { consumed: 0, goal: 73 },
    water: { consumed: 0, goal: 3 },
    meals: [],
  };

  const habitData = propsHabitData || {
    checkInsData: { lastCheckIn: null },
    streakData: { currentStreak: 0 },
  };

  const userGoals = propsUserGoals || {};

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

  const handleStartProtocolChallenge = (goalId, challenge) => {
    if (challenge?.id) {
      manageChallenge(challenge.id, "start", userGoals[goalId]?.type || "strength");
    }
    setActiveTab("habits");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-cyan-400 relative overflow-hidden">
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

          <div className="mb-6 border-b border-cyan-800">
            <div className="container mx-auto px-6">
              <div className="flex space-x-6 overflow-x-auto">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    className={`py-3 px-4 whitespace-nowrap font-mono text-sm ${
                      activeTab === tab.id
                        ? "text-cyan-300 border-b-2 border-cyan-500"
                        : "text-cyan-600 hover:text-cyan-400"
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
                <div className="container mx-auto px-6 py-8">
                  <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                    <h1 className="text-2xl font-bold text-cyber-cyan font-mono">
                      HUMAN OPTIMIZATION MATRIX
                    </h1>
                    <div className="relative flex items-center">
                      <div className="text-xs text-cyan-600 font-mono mr-4">
                        DATA LAST SYNCED:{" "}
                        {healthData?.heartRate?.lastUpdated || healthData?.lastSynced || "Never"}
                        <button
                          onClick={refreshAllData}
                          className="ml-2 text-cyan-500 hover:text-cyan-300"
                          title="Refresh All Data"
                        >
                          <span
                            className={
                              isDataFetching
                                ? "animate-spin inline-block"
                                : "inline-block"
                            }
                          >
                            ⟳
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                      <BiometricPanel userData={userData} healthData={healthData} />

                      {habitData && (
                        <div className="bg-gray-900 border border-cyan-800 rounded p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-mono text-cyan-300">
                              CONSISTENCY STREAK
                            </h3>
                            <button
                              onClick={handleCheckIn}
                              className="text-xs text-cyan-600 font-mono hover:text-cyan-400"
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
                          <div className="flex items-center justify-center">
                            <div className="relative w-16 h-16 bg-gray-950 border-2 border-cyan-700 rounded-full flex items-center justify-center">
                              <span className="text-xl font-bold text-cyan-300 font-mono">
                                {habitData.streakData?.currentStreak || 0}
                              </span>
                            </div>
                            <div className="ml-4">
                              <p className="text-xs text-cyan-600 font-mono">
                                {habitData.streakData?.currentStreak
                                  ? `${habitData.streakData.currentStreak}-DAY STREAK`
                                  : "START YOUR STREAK TODAY"}
                              </p>
                              <button
                                onClick={() => setActiveTab("habits")}
                                className="text-xs text-cyan-500 font-mono hover:text-cyan-400 mt-1"
                              >
                                VIEW FULL SYSTEM →
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-2 space-y-8">
                      <EnhancementMetricsPanel healthData={healthData} />
                      <EnhancementProtocolsPanel
                        goals={userGoals}
                        habitData={habitData}
                        onStartChallenge={handleStartProtocolChallenge}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                </div>
              </ErrorBoundary>
            ))}

          {activeTab === "workouts" && (
            <ErrorBoundary fallbackTitle="WORKOUT LOGGER ERROR">
              <div className="container mx-auto px-6 py-8">
                <h1 className="text-2xl font-bold text-cyber-cyan font-mono mb-6">
                  WORKOUT LOGGING & TEMPLATES
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
                <div className="flex justify-between items-center mb-8">
                  <h1 className="text-2xl font-bold text-cyber-cyan font-mono">
                    NUTRITION OPTIMIZATION
                  </h1>
                  <div className="relative flex items-center">
                    <div className="text-xs text-cyan-600 font-mono mr-4">
                      DATA LAST SYNCED:{" "}
                      {nutritionData?.calories?.lastUpdated || "Never"}
                      <button
                        onClick={syncNutritionData}
                        className="ml-2 text-cyan-500 hover:text-cyan-300"
                        title="Sync nutrition data"
                      >
                        <span
                          className={
                            isDataFetching
                              ? "animate-spin inline-block"
                              : "inline-block"
                          }
                        >
                          ⟳
                        </span>
                      </button>
                    </div>
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
                <h1 className="text-2xl font-bold text-cyber-cyan font-mono mb-8">
                  SLEEP & RECOVERY ANALYSIS
                </h1>
                <SleepAnalysis sleepData={healthData?.sleep} />
              </div>
            </ErrorBoundary>
          )}

          {activeTab === "knowledge" && (
            <ErrorBoundary fallbackTitle="KNOWLEDGE BASE ERROR">
              <div className="container mx-auto px-6 py-8">
                <KnowledgeBaseBrowser
                  userData={{ healthData, nutritionData, habitData }}
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

          <AIChatbot
            isOpen={showAIChatbot}
            onClose={() => setShowAIChatbot(false)}
          />
        </>
      )}
    </div>
  );
}
