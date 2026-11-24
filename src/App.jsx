// src/App.jsx
import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import LandingPage from "./components/landing/LandingPage";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import { DashboardSkeleton } from "./components/ui/LoadingSkeleton";
import { fetchHealthData } from "./services/healthService";
import {
  addMeal as logMealToService,
  addWater as logWaterToService,
  fetchNutritionData,
} from "./services/nutritionService";
import { processEnhancementMetrics } from "./services/healthDataProcessor";
import {
  createGoalFromBlueprint,
  normalizeUserGoals,
} from "./services/goalEngineService";
import {
  getFromStorage,
  getHabitData,
  recordCheckIn,
  saveToStorage,
  STORAGE_KEYS,
} from "./utils/storageUtils";

const Dashboard = lazy(() => import("./components/dashboard/Dashboard"));
const HealthDataTest = lazy(() => import("./components/HealthDataTest"));

const USER_GOALS_KEY = "user-goals";

function buildDefaultGoals() {
  const hspu = createGoalFromBlueprint("handstand-pushup", { id: "handstand-pushup" });
  const velocity = createGoalFromBlueprint("aerobic-velocity", { id: "aerobic-velocity" });
  return {
    [hspu.id]: hspu,
    [velocity.id]: velocity,
  };
}

function App() {
  const isNativeMobile = Capacitor.isNativePlatform();
  const [isDataFetching, setIsDataFetching] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  const [habitData, setHabitData] = useState(null);
  const [userGoals, setUserGoals] = useState(() => {
    const stored = getFromStorage(USER_GOALS_KEY, null);
    return stored && Object.keys(stored).length > 0
      ? normalizeUserGoals(stored)
      : buildDefaultGoals();
  });

  // Derive biometric summary metrics dynamically from real health data
  const userData = useMemo(() => {
    const processed = processEnhancementMetrics(healthData);
    return {
      metrics: {
        symmetry: processed.enhancementScores?.symmetry ?? null,
        potential: processed.enhancementScores?.potential ?? null,
        efficiency: processed.enhancementScores?.efficiency ?? null,
        recovery: processed.enhancementScores?.recovery ?? null,
        heartRate: healthData?.heartRate?.current ?? null,
        vo2max: healthData?.vo2Max?.current ?? null,
      },
      milestones: {
        strength: processed.individualMetrics?.forceOutput?.score || 0,
        cardio: processed.individualMetrics?.enduranceMatrix?.score || 0,
      },
    };
  }, [healthData]);

  // Connected apps status
  const [connectedApps, setConnectedApps] = useState({
    appleHealth: false,
    myFitnessPal: false,
    strava: false,
  });

  // Update and persist user goals
  const handleUpdateGoals = (nextGoals) => {
    setUserGoals(nextGoals);
    saveToStorage(USER_GOALS_KEY, nextGoals);
  };

  // Load habit data from localStorage
  const loadHabitData = () => {
    try {
      const streakData = getHabitData(STORAGE_KEYS.STREAK_DATA);
      const checkInsData = getHabitData(STORAGE_KEYS.CHECK_INS);
      const rewardsData = getHabitData(STORAGE_KEYS.CLAIMED_REWARDS);

      setHabitData({
        streakData,
        checkInsData,
        rewardsData,
      });
    } catch (error) {
      console.error("Error loading habit data:", error);
    }
  };

  // Refresh all health, nutrition, and habit data
  const refreshAllData = async () => {
    setIsDataFetching(true);
    try {
      const [health, nutrition] = await Promise.all([
        fetchHealthData(true),
        fetchNutritionData(true),
      ]);

      setHealthData(health);
      setNutritionData(nutrition);
      if (health?.source === "Apple HealthKit") {
        setConnectedApps((prev) => ({ ...prev, appleHealth: true }));
      }
      loadHabitData();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsDataFetching(false);
    }
  };

  // Fetch initial data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      setIsDataFetching(true);
      try {
        const [health, nutrition] = await Promise.all([
          fetchHealthData(false),
          fetchNutritionData(false),
        ]);

        setHealthData(health);
        setNutritionData(nutrition);
        if (health?.source === "Apple HealthKit") {
          setConnectedApps((prev) => ({ ...prev, appleHealth: true }));
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        setIsDataFetching(false);
      }
    };

    loadInitialData();
    loadHabitData();
  }, []);

  // Sync nutrition data
  const syncNutritionData = async () => {
    setIsDataFetching(true);
    try {
      const data = await fetchNutritionData(true);
      setNutritionData(data);
    } catch (error) {
      console.error("Error syncing nutrition data:", error);
    } finally {
      setIsDataFetching(false);
    }
  };

  // Log a meal and persist via nutritionService
  const handleAddMeal = async (meal) => {
    try {
      const result = await logMealToService(meal);
      if (result?.nutritionData) {
        setNutritionData(result.nutritionData);
      }
    } catch (error) {
      console.error("Error logging meal:", error);
    }
  };

  // Log water intake and persist via nutritionService
  const handleAddWater = async (liters = 0.25) => {
    try {
      const updated = await logWaterToService(liters);
      setNutritionData(updated);
    } catch (error) {
      console.error("Error logging water:", error);
    }
  };

  // Toggle app connection status
  const toggleAppConnection = (app) => {
    setConnectedApps((prev) => ({
      ...prev,
      [app]: !prev[app],
    }));
  };

  // Handle daily check-in
  const handleCheckIn = () => {
    try {
      const result = recordCheckIn();
      if (!result.alreadyCompleted) {
        loadHabitData();
      }
    } catch (error) {
      console.error("Error recording check-in:", error);
    }
  };

  const dashboardElement = (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard
        userData={userData}
        healthData={healthData}
        nutritionData={nutritionData}
        habitData={habitData}
        userGoals={userGoals}
        connectedApps={connectedApps}
        isDataFetching={isDataFetching}
        onCheckIn={handleCheckIn}
        onToggleConnection={toggleAppConnection}
        onRefreshData={refreshAllData}
        onSyncNutrition={syncNutritionData}
        onAddMeal={handleAddMeal}
        onAddWater={handleAddWater}
        onUpdateGoals={handleUpdateGoals}
        onWorkoutLogged={refreshAllData}
      />
    </Suspense>
  );

  return (
    <ErrorBoundary fallbackTitle="APPLICATION ERROR">
      <Router>
        <Routes>
          <Route path="/landing" element={<LandingPage />} />
          <Route
            path="/health-test"
            element={
              <Suspense fallback={<DashboardSkeleton />}>
                <HealthDataTest />
              </Suspense>
            }
          />
          <Route path="/dashboard" element={dashboardElement} />
          <Route
            path="/"
            element={isNativeMobile ? dashboardElement : <LandingPage />}
          />
          <Route
            path="*"
            element={isNativeMobile ? dashboardElement : <LandingPage />}
          />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
