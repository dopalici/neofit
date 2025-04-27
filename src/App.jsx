// src/App.jsx
import React, { useEffect, useState } from "react";
import { fetchHealthData } from "./services/healthService"; // Assumes this fetches all needed health data
import { fetchNutritionData } from "./services/nutritionService"; // Assumes this fetches all needed nutrition data
import {
  getHabitData,
  recordCheckIn,
  STORAGE_KEYS,
} from "./utils/storageUtils";
// Removed unused recharts imports: BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend
// If charts are implemented later, re-import the necessary components.
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Dashboard from "./components/dashboard/Dashboard";
import LandingPage from "./components/landing/LandingPage";

function App() {
  const [activeTab, setActiveTab] = useState("main");
  const [showIntro, setShowIntro] = useState(true);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [isDataFetching, setIsDataFetching] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  const [habitData, setHabitData] = useState(null);

  // Mock user data for body model and metrics
  const userData = {
    metrics: {
      symmetry: 96.2,
      potential: 71.8,
      heartRate: 64,
      vo2max: 48.3,
    },
    milestones: {
      strength: 78,
      cardio: 82,
    },
    level: 12,
    xp: 2450,
    nextLevelXp: 3000,
  };

  // Mock user goals
  const userGoals = {
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

  // Connected apps status
  const [connectedApps, setConnectedApps] = useState({
    appleHealth: true,
    myFitnessPal: true,
    strava: true,
    whoop: false,
    garmin: false,
  });

  // --- Function to refresh all data ---
  const refreshAllData = async () => {
    console.log("Refreshing all data..."); // Debug log
    setIsDataFetching(true);
    try {
      const [health, nutrition] = await Promise.all([
        fetchHealthData(),
        fetchNutritionData(),
      ]);

      console.log("Refreshed Data:", { health, nutrition }); // Debug log
      setHealthData(health);
      setNutritionData(nutrition);

      // Reload habit data as well if needed after import
      loadHabitData();

      // Close the modal after successful import and refresh
      setShowIntegrationModal(false);
    } catch (error) {
      console.error("Error refreshing data:", error);
      // Consider showing an error message to the user
    } finally {
      setIsDataFetching(false);
      console.log("Data refresh complete."); // Debug log
    }
  };

  // Function to load habit data (extracted for reuse)
  const loadHabitData = () => {
    try {
      // Make sure STORAGE_KEYS is defined correctly, likely from storageUtils or dataImportService
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

  // Fetch initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsDataFetching(true);
      try {
        const [health, nutrition] = await Promise.all([
          fetchHealthData(),
          fetchNutritionData(),
        ]);

        setHealthData(health);
        setNutritionData(nutrition);
      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        setIsDataFetching(false);
      }
    };

    loadInitialData();
    loadHabitData(); // Load habit data initially too
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Added eslint disable comment for missing dependency if loadHabitData isn't memoized

  // Removed unused function syncHealthData
  // const syncHealthData = async () => { ... };

  // Function to sync Nutrition data (kept as it's used by NutritionPanel)
  const syncNutritionData = async () => {
    setIsDataFetching(true);
    try {
      const data = await fetchNutritionData();
      setNutritionData(data);
    } catch (error) {
      console.error("Error syncing nutrition data:", error);
    } finally {
      setIsDataFetching(false);
    }
  };

  // Toggle app connection status
  const toggleAppConnection = (app) => {
    setConnectedApps((prev) => ({
      ...prev,
      [app]: !prev[app],
    }));
    // Potentially trigger a data sync/refresh here if needed when toggling
    // refreshAllData(); // Uncomment if you want to refresh data on toggle
  };

  // Handle daily check-in
  const handleCheckIn = () => {
    try {
      const result = recordCheckIn(); // Assuming recordCheckIn is imported correctly
      if (!result.alreadyCompleted) {
        // Reload habit data to reflect changes
        loadHabitData();

        // Show celebration for milestones
        if (result.isMilestone) {
          // In a real app, you'd show a nice animation here
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
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
