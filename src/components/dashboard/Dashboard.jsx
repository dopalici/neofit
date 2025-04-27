import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ScanlineEffect from "../ui/ScanlineEffect";
import AIChatbot from "./AIChatbot";
import BiometricPanel from "./BiometricPanel";
import EnhancementMetrics from "./EnhancementMetrics";
import GoalsPanel from "./GoalsPanel";
import HabitDashboard from "./HabitDashboard";
import Header from "./Header";
import HealthDataDashboard from "./HealthDataDashboard";
import IntegrationModal from "./IntegrationModal";
import NutritionPanel from "./NutritionPanel";

export default function Dashboard() {
  const [showIntro, setShowIntro] = useState(true);
  const [activeTab, setActiveTab] = useState("main");
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [showAIChatbot, setShowAIChatbot] = useState(false);
  const [isDataFetching, setIsDataFetching] = useState(false);
  const [connectedApps, setConnectedApps] = useState({
    appleHealth: false,
    myFitnessPal: false,
    strava: false,
  });

  const navigate = useNavigate();

  // Mock data for demonstration
  const userData = {
    metrics: {
      symmetry: "96.2",
      potential: "71.8",
    },
  };

  const healthData = {
    heartRate: {
      lastUpdated: new Date().toLocaleString(),
    },
    steps: {
      value: 8500,
      lastUpdated: new Date().toLocaleString(),
    },
    sleep: {
      quality: "good",
      duration: "7.5",
      lastUpdated: new Date().toLocaleString(),
    },
  };

  const nutritionData = {
    calories: {
      lastUpdated: new Date().toLocaleString(),
    },
    protein: { consumed: 120 },
    carbs: { consumed: 200 },
    fat: { consumed: 80 },
  };

  const habitData = {
    checkInsData: {
      lastCheckIn: new Date().toISOString().split("T")[0],
    },
    streakData: {
      currentStreak: 5,
    },
  };

  const userGoals = [
    { id: 1, title: "Increase VO2 Max", progress: 65 },
    { id: 2, title: "Improve Sleep Quality", progress: 80 },
  ];

  const handleCheckIn = () => {
    // Mock check-in functionality
    console.log("Check-in recorded");
  };

  const toggleAppConnection = (app) => {
    setConnectedApps((prev) => ({
      ...prev,
      [app]: !prev[app],
    }));
  };

  const refreshAllData = () => {
    setIsDataFetching(true);
    // Mock data refresh
    setTimeout(() => {
      setIsDataFetching(false);
    }, 1000);
  };

  const syncNutritionData = () => {
    setIsDataFetching(true);
    // Mock nutrition sync
    setTimeout(() => {
      setIsDataFetching(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-cyan-400 relative overflow-hidden">
      <ScanlineEffect />

      {showIntro ? (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-2xl p-8 bg-gray-900 border border-cyber-cyan rounded-lg shadow-lg shadow-cyan-900/30">
            <h1 className="text-5xl font-bold text-cyber-cyan mb-8">
              NEO•VITRU
            </h1>
            <div className="mb-8 relative">
              <svg
                viewBox="0 0 100 160"
                className="w-48 h-64 mx-auto text-cyber-cyan opacity-80"
              >
                <g stroke="currentColor" fill="none" strokeWidth="0.8">
                  <path d="M50,30 C55,30 60,35 60,40 C60,45 55,50 50,55 C45,50 40,45 40,40 C40,35 45,30 50,30 Z" />
                  <line x1="50" y1="55" x2="50" y2="100" />
                  <line x1="50" y1="65" x2="30" y2="85" />
                  <line x1="30" y1="85" x2="25" y2="105" />
                  <line x1="50" y1="65" x2="70" y2="85" />
                  <line x1="70" y1="85" x2="75" y2="105" />
                  <line x1="50" y1="100" x2="35" y2="130" />
                  <line x1="50" y1="100" x2="65" y2="130" />
                  <circle cx="50" cy="80" r="45" strokeDasharray="1,1" />
                  <line
                    x1="20"
                    y1="40"
                    x2="40"
                    y2="40"
                    strokeWidth="0.2"
                    strokeDasharray="1,1"
                  />
                  <line
                    x1="60"
                    y1="40"
                    x2="80"
                    y2="40"
                    strokeWidth="0.2"
                    strokeDasharray="1,1"
                  />
                  <line
                    x1="35"
                    y1="130"
                    x2="65"
                    y2="130"
                    strokeWidth="0.2"
                    strokeDasharray="1,1"
                  />
                </g>
                <g fill="rgba(0,255,255,0.8)">
                  <circle cx="50" cy="40" r="0.8" />
                  <circle cx="50" cy="65" r="0.8" />
                  <circle cx="30" cy="85" r="0.8" />
                  <circle cx="70" cy="85" r="0.8" />
                  <circle cx="50" cy="100" r="0.8" />
                  <circle cx="25" cy="105" r="0.8" />
                  <circle cx="75" cy="105" r="0.8" />
                  <circle cx="35" cy="130" r="0.8" />
                  <circle cx="65" cy="130" r="0.8" />
                </g>
              </svg>
              <div className="absolute top-4 left-0 text-xs font-mono text-cyber-cyan">
                SYMMETRY: {userData?.metrics?.symmetry || "96.2"}%
              </div>
              <div className="absolute bottom-4 right-0 text-xs font-mono text-cyber-cyan">
                POTENTIAL: {userData?.metrics?.potential || "71.8"}%
              </div>
            </div>
            <p className="text-cyber-pink mb-6 font-mono">
              TRANSHUMANIST FITNESS JOURNEY INITIALIZING
            </p>
            <button
              onClick={() => setShowIntro(false)}
              className="bg-cyber-black text-cyber-cyan border border-cyber-cyan px-6 py-3 rounded font-mono hover:bg-cyber-cyan hover:text-cyber-black transition-colors duration-300"
            >
              INITIALIZE SYSTEM
            </button>
          </div>
        </div>
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
                <button
                  className={`py-3 px-4 whitespace-nowrap ${
                    activeTab === "main"
                      ? "text-cyan-300 border-b-2 border-cyan-500"
                      : "text-cyan-600"
                  }`}
                  onClick={() => setActiveTab("main")}
                >
                  DASHBOARD
                </button>
                <button
                  className={`py-3 px-4 whitespace-nowrap ${
                    activeTab === "habits"
                      ? "text-cyan-300 border-b-2 border-cyan-500"
                      : "text-cyan-600"
                  }`}
                  onClick={() => setActiveTab("habits")}
                >
                  HABIT SYSTEM
                </button>
                <button
                  className={`py-3 px-4 whitespace-nowrap ${
                    activeTab === "nutrition"
                      ? "text-cyan-300 border-b-2 border-cyan-500"
                      : "text-cyan-600"
                  }`}
                  onClick={() => setActiveTab("nutrition")}
                >
                  NUTRITION
                </button>
                <button
                  className={`py-3 px-4 whitespace-nowrap ${
                    activeTab === "health"
                      ? "text-cyan-300 border-b-2 border-cyan-500"
                      : "text-cyan-600"
                  }`}
                  onClick={() => setActiveTab("health")}
                >
                  HEALTH DATA
                </button>
              </div>
            </div>
          </div>

          {activeTab === "main" && (
            <div className="container mx-auto px-6 py-8">
              <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <h1 className="text-2xl font-bold text-cyber-cyan font-mono">
                  HUMAN OPTIMIZATION MATRIX
                </h1>
                <div className="relative flex items-center">
                  <div className="text-xs text-cyan-600 font-mono mr-4">
                    DATA LAST SYNCED:{" "}
                    {healthData?.heartRate?.lastUpdated || "Never"}
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
                  <EnhancementMetrics healthData={healthData} />
                  <GoalsPanel goals={userGoals} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <NutritionPanel
                      nutritionData={nutritionData}
                      onSyncNutrition={syncNutritionData}
                      isSyncing={isDataFetching}
                    />
                    <div className="bg-gray-900 border border-cyan-800 rounded shadow-lg p-6">
                      <h2 className="text-lg font-mono text-cyan-300 mb-4">
                        ACTIVITY LOG
                      </h2>
                      <div className="space-y-3">
                        <div className="bg-gray-950 border border-cyan-900 p-3 rounded">
                          <p className="text-cyan-600 font-mono text-sm">
                            Activity log content goes here
                          </p>
                        </div>
                        <div className="bg-gray-950 border border-cyan-900 p-3 rounded">
                          <p className="text-cyan-600 font-mono text-sm">
                            More activity...
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 text-center">
                    <p className="text-cyan-400 mb-3 font-mono">
                      ENHANCE YOUR FITNESS ROUTINES WITH SCIENCE-BASED HABIT
                      FORMATION
                    </p>
                    <button
                      onClick={() => setActiveTab("habits")}
                      className="bg-cyan-900 text-cyan-300 border border-cyan-600 px-6 py-3 rounded-lg font-medium hover:bg-cyan-800 transition"
                    >
                      EXPLORE HABIT SYSTEM
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "habits" && (
            <HabitDashboard
              userData={userData}
              habitData={habitData}
              onCheckIn={handleCheckIn}
            />
          )}

          {activeTab === "nutrition" && (
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
                      title="Sync with MyFitnessPal"
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

              <NutritionPanel
                nutritionData={nutritionData}
                onSyncNutrition={syncNutritionData}
                isSyncing={isDataFetching}
                fullWidth={true}
              />
            </div>
          )}

          {activeTab === "health" && <HealthDataDashboard />}

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
