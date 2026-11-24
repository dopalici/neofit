// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Dashboard from "./components/dashboard/Dashboard";
import LandingPage from "./components/landing/LandingPage";
import HealthDataTest from "./components/HealthDataTest";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import { fetchHealthData } from "./services/healthService";
import {
  addMeal as logMealToService,
  addWater as logWaterToService,
  fetchNutritionData,
} from "./services/nutritionService";
import { processEnhancementMetrics } from "./services/healthDataProcessor";
import {
  getFromStorage,
  getHabitData,
  recordCheckIn,
  saveToStorage,
  STORAGE_KEYS,
} from "./utils/storageUtils";

const USER_GOALS_KEY = "user-goals";

const DEFAULT_USER_GOALS = {
  handstandPushup: {
    name: "VERTICAL INVERSION PROTOCOL",
    type: "strength",
    progress: 65.2,
    startDate: "2025-03-28",
    targetDate: "2025-05-17",
  },
  fourMinuteMile: {
    name: "SUB-4 VELOCITY THRESHOLD",
    type: "endurance",
    progress: 38.7,
    startDate: "2025-02-14",
    targetDate: "2025-08-27",
  },
};

function App() {
  const [isDataFetching, setIsDataFetching] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  const [habitData, setHabitData] = useState(null);
  const [userGoals, setUserGoals] = useState(() =>
    getFromStorage(USER_GOALS_KEY, DEFAULT_USER_GOALS)
  );

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

        if (result.isMilestone) {
          alert(
            `Congratulations! You've reached a ${result.newStreak}-day streak!`
          );
        }
      } else {
        alert("Already checked in today!");
      }
    } catch (error) {
      console.error("Error recording check-in:", error);
    }
  };

  return (
    <ErrorBoundary fallbackTitle="APPLICATION ERROR">
      <Router>
        <Routes>
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/health-test" element={<HealthDataTest />} />
          <Route
            path="/dashboard"
            element={
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
            }
          />
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
