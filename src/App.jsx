// src/App.jsx
import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import ScanlineEffect from './components/layout/ScanlineEffect';
import BiometricPanel from './components/dashboard/BiometricPanel';
import EnhancementMetrics from './components/dashboard/EnhancementMetrics';
import GoalsPanel from './components/dashboard/GoalsPanel';
import NutritionPanel from './components/dashboard/NutritionPanel';
import AdvisorChatbot from './components/chatbot/AdvisorChatbot';
import { fetchHealthData } from './services/healthService'; // Assumes this fetches all needed health data
import { fetchNutritionData } from './services/nutritionService'; // Assumes this fetches all needed nutrition data
import HabitDashboard from './components/dashboard/HabitDashboard';
import HealthDataDashboard from './components/dashboard/HealthDataDashboard';
import HealthDataImporter from './components/settings/HealthDataImporter'; // Import HealthDataImporter
import { getHabitData, recordCheckIn, STORAGE_KEYS } from './utils/storageUtils';
// Removed unused recharts imports: BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend
// If charts are implemented later, re-import the necessary components.
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts'; // Keep imports needed for the example charts

function App() {
  const [activeTab, setActiveTab] = useState('main');
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
      vo2max: 48.3
    },
    milestones: {
      strength: 78,
      cardio: 82
    },
    level: 12,
    xp: 2450,
    nextLevelXp: 3000
  };

  // Mock user goals
  const userGoals = {
    handstandPushup: {
      name: "VERTICAL INVERSION PROTOCOL",
      type: "strength",
      progress: 65.2,
      startDate: "2025-03-28",
      targetDate: "2025-05-17"
    },
    fourMinuteMile: {
      name: "SUB-4 VELOCITY THRESHOLD",
      type: "endurance",
      progress: 38.7,
      startDate: "2025-02-14",
      targetDate: "2025-08-27"
    }
  };

  // Connected apps status
  const [connectedApps, setConnectedApps] = useState({
    appleHealth: true,
    myFitnessPal: true,
    strava: true,
    whoop: false,
    garmin: false
  });

  // --- Function to refresh all data ---
  const refreshAllData = async () => {
    console.log("Refreshing all data..."); // Debug log
    setIsDataFetching(true);
    try {
      const [health, nutrition] = await Promise.all([
        fetchHealthData(),
        fetchNutritionData()
      ]);

      console.log("Refreshed Data:", { health, nutrition }); // Debug log
      setHealthData(health);
      setNutritionData(nutrition);

      // Reload habit data as well if needed after import
      loadHabitData();

      // Close the modal after successful import and refresh
      setShowIntegrationModal(false);

    } catch (error) {
      console.error('Error refreshing data:', error);
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
        rewardsData
      });
    } catch (error) {
      console.error('Error loading habit data:', error);
    }
  };

  // Fetch initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsDataFetching(true);
      try {
        const [health, nutrition] = await Promise.all([
          fetchHealthData(),
          fetchNutritionData()
        ]);

        setHealthData(health);
        setNutritionData(nutrition);
      } catch (error) {
        console.error('Error loading initial data:', error);
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
      console.error('Error syncing nutrition data:', error);
    } finally {
      setIsDataFetching(false);
    }
  };

  // Toggle app connection status
  const toggleAppConnection = (app) => {
    setConnectedApps(prev => ({
      ...prev,
      [app]: !prev[app]
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
          alert(`Congratulations! You've reached a ${result.newStreak}-day streak!`);
        }
      } else {
        alert("Already checked in today!");
      }
    } catch (error) {
      console.error('Error recording check-in:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-cyan-400 relative overflow-hidden">
      <ScanlineEffect />

      {showIntro ? (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-2xl p-8 bg-gray-900 border border-cyber-cyan rounded-lg shadow-lg shadow-cyan-900/30">
            {/* --- Intro Screen Content --- */}
             <h1 className="text-5xl font-bold text-cyber-cyan mb-8">NEO•VITRU</h1>
            <div className="mb-8 relative">
              {/* SVG Model */}
              <svg viewBox="0 0 100 160" className="w-48 h-64 mx-auto text-cyber-cyan opacity-80">
                {/* ... (SVG paths and elements) ... */}
                 <g stroke="currentColor" fill="none" strokeWidth="0.8">
                  {/* Body outline */}
                  <path d="M50,30 C55,30 60,35 60,40 C60,45 55,50 50,55 C45,50 40,45 40,40 C40,35 45,30 50,30 Z" /> {/* Head */}
                  <line x1="50" y1="55" x2="50" y2="100" /> {/* Spine */}
                  <line x1="50" y1="65" x2="30" y2="85" /> {/* Left arm upper */}
                  <line x1="30" y1="85" x2="25" y2="105" /> {/* Left arm lower */}
                  <line x1="50" y1="65" x2="70" y2="85" /> {/* Right arm upper */}
                  <line x1="70" y1="85" x2="75" y2="105" /> {/* Right arm lower */}
                  <line x1="50" y1="100" x2="35" y2="130" /> {/* Left leg */}
                  <line x1="50" y1="100" x2="65" y2="130" /> {/* Right leg */}

                  {/* Da Vinci circle */}
                  <circle cx="50" cy="80" r="45" strokeDasharray="1,1" />

                  {/* Measurement lines */}
                  <line x1="20" y1="40" x2="40" y2="40" strokeWidth="0.2" strokeDasharray="1,1" />
                  <line x1="60" y1="40" x2="80" y2="40" strokeWidth="0.2" strokeDasharray="1,1" />
                  <line x1="35" y1="130" x2="65" y2="130" strokeWidth="0.2" strokeDasharray="1,1" />
                </g>

                {/* Data points */}
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
              <div className="absolute top-4 left-0 text-xs font-mono text-cyber-cyan">SYMMETRY: {userData?.metrics?.symmetry || '96.2'}%</div>
              <div className="absolute bottom-4 right-0 text-xs font-mono text-cyber-cyan">POTENTIAL: {userData?.metrics?.potential || '71.8'}%</div>
            </div>
            <p className="text-cyber-pink mb-6 font-mono">TRANSHUMANIST FITNESS JOURNEY INITIALIZING</p>
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
          />

          {/* Navigation tabs */}
          <div className="mb-6 border-b border-cyan-800">
            <div className="container mx-auto px-6">
               <div className="flex space-x-6 overflow-x-auto">
                 <button
                  className={`py-3 px-4 whitespace-nowrap ${activeTab === 'main' ? 'text-cyan-300 border-b-2 border-cyan-500' : 'text-cyan-600'}`}
                  onClick={() => setActiveTab('main')}
                >
                  DASHBOARD
                </button>
                <button
                  className={`py-3 px-4 whitespace-nowrap ${activeTab === 'habits' ? 'text-cyan-300 border-b-2 border-cyan-500' : 'text-cyan-600'}`}
                  onClick={() => setActiveTab('habits')}
                >
                  HABIT SYSTEM
                </button>
                <button
                  className={`py-3 px-4 whitespace-nowrap ${activeTab === 'nutrition' ? 'text-cyan-300 border-b-2 border-cyan-500' : 'text-cyan-600'}`}
                  onClick={() => setActiveTab('nutrition')}
                >
                  NUTRITION
                </button>
                <button
                  className={`py-3 px-4 whitespace-nowrap ${activeTab === 'health' ? 'text-cyan-300 border-b-2 border-cyan-500' : 'text-cyan-600'}`}
                  onClick={() => setActiveTab('health')}
                >
                  HEALTH DATA
                </button>
                {/* Add more tabs as needed */}
              </div>
            </div>
          </div>

          {/* --- Main Content Area based on activeTab --- */}

          {/* Main dashboard */}
          {activeTab === 'main' && (
             <div className="container mx-auto px-6 py-8">
              <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <h1 className="text-2xl font-bold text-cyber-cyan font-mono">HUMAN OPTIMIZATION MATRIX</h1>
                <div className="relative flex items-center">
                  <div className="text-xs text-cyan-600 font-mono mr-4">
                    DATA LAST SYNCED: {healthData?.heartRate?.lastUpdated || 'Never'}
                    <button
                      onClick={refreshAllData} // Use refreshAllData here for manual full refresh
                      className="ml-2 text-cyan-500 hover:text-cyan-300"
                      title="Refresh All Data">
                      <span className={isDataFetching ? 'animate-spin inline-block' : 'inline-block'}>⟳</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left column */}
                <div className="lg:col-span-1 space-y-6">
                  <BiometricPanel userData={userData} healthData={healthData} />

                  {/* Mini habit streak display */}
                  {habitData && (
                    <div className="bg-gray-900 border border-cyan-800 rounded p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-mono text-cyan-300">CONSISTENCY STREAK</h3>
                        <button
                          onClick={handleCheckIn}
                          className="text-xs text-cyan-600 font-mono hover:text-cyan-400"
                          disabled={habitData.checkInsData?.lastCheckIn === new Date().toISOString().split('T')[0]} // Disable if already checked in today
                        >
                           {habitData.checkInsData?.lastCheckIn === new Date().toISOString().split('T')[0] ? 'CHECKED IN' : 'CHECK IN'}
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
                              : 'START YOUR STREAK TODAY'}
                          </p>
                           <button
                            onClick={() => setActiveTab('habits')}
                            className="text-xs text-cyan-500 font-mono hover:text-cyan-400 mt-1"
                          >
                            VIEW FULL SYSTEM →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right column */}
                <div className="lg:col-span-2 space-y-8">
                  <EnhancementMetrics healthData={healthData} />
                  <GoalsPanel goals={userGoals} />

                  {/* Nutrition & Activity */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <NutritionPanel
                      nutritionData={nutritionData}
                      onSyncNutrition={syncNutritionData} // Keep specific sync if needed
                      isSyncing={isDataFetching}
                    />
                    {/* --- Activity Log Placeholder (replace with actual component later) --- */}
                    <div className="bg-gray-900 border border-cyan-800 rounded shadow-lg p-6">
                      <h2 className="text-lg font-mono text-cyan-300 mb-4">ACTIVITY LOG</h2>
                      <div className="space-y-3">
                        <div className="bg-gray-950 border border-cyan-900 p-3 rounded">
                          <p className="text-cyan-600 font-mono text-sm">Activity log content goes here</p>
                        </div>
                         <div className="bg-gray-950 border border-cyan-900 p-3 rounded">
                           <p className="text-cyan-600 font-mono text-sm">More activity...</p>
                         </div>
                      </div>
                    </div>
                  </div>

                   {/* Prompt to explore the habit system */}
                  <div className="mt-8 text-center">
                    <p className="text-cyan-400 mb-3 font-mono">ENHANCE YOUR FITNESS ROUTINES WITH SCIENCE-BASED HABIT FORMATION</p>
                    <button
                      onClick={() => setActiveTab('habits')}
                      className="bg-cyan-900 text-cyan-300 border border-cyan-600 px-6 py-3 rounded-lg font-medium hover:bg-cyan-800 transition"
                    >
                      EXPLORE HABIT SYSTEM
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Habit dashboard */}
          {activeTab === 'habits' && (
             // Ensure habitData is passed down if HabitDashboard needs it directly
             <HabitDashboard
               userData={userData}
               habitData={habitData}
               onCheckIn={handleCheckIn} // Pass check-in handler
             />
          )}

          {/* --- Nutrition dashboard --- */}
          {activeTab === 'nutrition' && (
            <div className="container mx-auto px-6 py-8">
              <div className="flex justify-between items-center mb-8">
                 <h1 className="text-2xl font-bold text-cyber-cyan font-mono">NUTRITION OPTIMIZATION</h1>
                 <div className="relative flex items-center">
                   <div className="text-xs text-cyan-600 font-mono mr-4">
                     DATA LAST SYNCED: {nutritionData?.calories?.lastUpdated || 'Never'}
                     <button
                       onClick={syncNutritionData}
                       className="ml-2 text-cyan-500 hover:text-cyan-300"
                       title="Sync with MyFitnessPal">
                       <span className={isDataFetching ? 'animate-spin inline-block' : 'inline-block'}>⟳</span>
                     </button>
                   </div>
                 </div>
               </div>

              {/* Enhanced nutrition panel */}
              <NutritionPanel
                nutritionData={nutritionData}
                onSyncNutrition={syncNutritionData}
                isSyncing={isDataFetching} 
                fullWidth={true} // Assuming NutritionPanel accepts this prop
              />

              {/* Nutrition Charts Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                {/* Macro Distribution Chart */}
                <div className="bg-gray-900 border border-cyan-800 rounded shadow-lg p-6">
                  <h2 className="text-lg font-mono text-cyan-300 mb-4">MACRO DISTRIBUTION (TODAY)</h2>
                  <div className="h-64 bg-gray-950 p-4 border border-cyan-900 rounded">
                     {nutritionData ? (
                       <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie
                             data={[
                               { name: 'Protein', value: nutritionData.protein?.consumed || 0 },
                               { name: 'Carbs', value: nutritionData.carbs?.consumed || 0 },
                               { name: 'Fat', value: nutritionData.fat?.consumed || 0 },
                             ]}
                             cx="50%"
                             cy="50%"
                             labelLine={false}
                             outerRadius={80}
                             fill="#8884d8"
                             dataKey="value"
                             label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                           >
                              <Cell key={`cell-0`} fill="#06b6d4" /> {/* Protein - Cyan */}
                              <Cell key={`cell-1`} fill="#facc15" /> {/* Carbs - Yellow */}
                              <Cell key={`cell-2`} fill="#ec4899" /> {/* Fat - Pink */}
                           </Pie>
                           <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #155e75', borderRadius: '4px', fontFamily: 'monospace', color: '#67e8f9' }}/>
                           <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '12px', color: '#9ca3af' }} />
                         </PieChart>
                       </ResponsiveContainer>
                     ) : (
                       <div className="flex items-center justify-center h-full">
                         <p className="text-cyan-600 font-mono">Nutrition data needed for chart</p>
                       </div>
                     )}
                  </div>
                </div>

                {/* Nutrition Trends Chart (Example: Calorie Intake Trend) */}
                <div className="bg-gray-900 border border-cyan-800 rounded shadow-lg p-6">
                  <h2 className="text-lg font-mono text-cyan-300 mb-4">CALORIE TREND (LAST 7 DAYS)</h2>
                  <div className="h-64 bg-gray-950 p-4 border border-cyan-900 rounded">
                     {/* Placeholder: You'd need historical nutrition data for this */}
                     {nutritionData ? ( // Replace with actual historical data check
                       <ResponsiveContainer width="100%" height="100%">
                          {/* Example using BarChart - Needs historical data structure */}
                          <BarChart data={[{date: 'Apr 16', calories: 2100}, {date: 'Apr 17', calories: 2300}, {date: 'Apr 18', calories: 2050}, {date: 'Apr 19', calories: 2250}, {date: 'Apr 20', calories: 2150}, {date: 'Apr 21', calories: 1842}]} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                             <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                             <XAxis dataKey="date" tick={{ fill: '#67e8f9', fontSize: 10, fontFamily: 'monospace' }} />
                             <YAxis tick={{ fill: '#67e8f9', fontSize: 10, fontFamily: 'monospace' }}/>
                             <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #155e75', borderRadius: '4px', fontFamily: 'monospace', color: '#67e8f9' }}/>
                             <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '12px', color: '#9ca3af' }} />
                             <Bar dataKey="calories" fill="#0ea5e9" name="Calories Consumed" />
                          </BarChart>
                       </ResponsiveContainer>
                     ) : (
                       <div className="flex items-center justify-center h-full">
                         <p className="text-cyan-600 font-mono">Historical nutrition data needed for trends</p>
                       </div>
                     )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* --- End Nutrition Tab --- */}


          {/* Health Data Dashboard */}
          {activeTab === 'health' && (
             // Pass refresh function if HealthDataDashboard needs to trigger a full refresh
             <HealthDataDashboard />
          )}

          {/* Chatbot */}
          <AdvisorChatbot userData={userData} userGoals={userGoals} />
        </>
      )}

      {/* --- Integration modal --- */}
      {showIntegrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm"> {/* Added backdrop blur */}
          <div className="bg-gray-900 border border-cyan-800 rounded-lg shadow-lg shadow-cyan-900/30 w-full max-w-lg p-6 relative"> {/* Increased max-w */}
            <button
              onClick={() => setShowIntegrationModal(false)}
              className="absolute top-4 right-4 text-cyan-600 hover:text-cyan-400">
              &times;
            </button>
            <h2 className="text-xl font-mono text-cyan-300 mb-6">DATA INTEGRATIONS & IMPORT</h2>

            {/* --- Data Import Section --- */}
            <div className="mb-6 border-b border-cyan-900 pb-6">
               <h3 className="text-lg font-mono text-cyan-400 mb-4">Import Health Data File</h3>
               {/* Pass refreshAllData to HealthDataImporter */}
               <HealthDataImporter onDataImported={refreshAllData} />
            </div>

            {/* --- App Connection Toggles --- */}
             <h3 className="text-lg font-mono text-cyan-400 mb-4">Connected Apps</h3>
            <div className="space-y-4">
              {/* Apple Health */}
              <div className="bg-gray-950 border border-cyan-900 p-4 rounded flex justify-between items-center">
                {/* ... (Apple Health Icon and Text) ... */}
                 <div className="flex items-center">
                  <div className="w-10 h-10 mr-3 flex items-center justify-center">
                     {/* SVG Icon */}
                     <svg className="w-6 h-6 text-cyan-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                       <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z" fill="currentColor" />
                     </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-cyan-300 font-mono">APPLE HEALTH</p>
                    <p className="text-xs text-cyan-600 font-mono">Heart Rate, Steps, Sleep, Weight</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div
                    className={`w-12 h-6 ${connectedApps.appleHealth ? 'bg-cyan-900' : 'bg-gray-800'} rounded-full relative cursor-pointer`}
                    onClick={() => toggleAppConnection('appleHealth')}
                  >
                    <div
                      className={`w-4 h-4 rounded-full absolute top-1 transition-all duration-300 ${connectedApps.appleHealth ? 'bg-cyan-400 right-1' : 'bg-gray-600 left-1'}`}>
                    </div>
                  </div>
                </div>
              </div>

              {/* MyFitnessPal */}
              <div className="bg-gray-950 border border-cyan-900 p-4 rounded flex justify-between items-center">
                 {/* ... (MyFitnessPal Icon and Text) ... */}
                 <div className="flex items-center">
                   <div className="w-10 h-10 mr-3 flex items-center justify-center">
                      {/* SVG Icon */}
                     <svg className="w-6 h-6 text-cyan-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                       <path d="M12 9H16C17.1 9 18 9.9 18 11V19C18 20.1 17.1 21 16 21H8C6.9 21 6 20.1 6 19V11C6 9.9 6.9 9 8 9H12ZM12 3V7H8C5.79 7 4 8.79 4 11V19C4 21.21 5.79 23 8 23H16C18.21 23 20 21.21 20 19V11C20 8.79 18.21 7 16 7H12V3ZM10 3H14V5H10V3Z" fill="currentColor" />
                     </svg>
                   </div>
                   <div>
                     <p className="text-sm font-medium text-cyan-300 font-mono">MYFITNESSPAL</p>
                     <p className="text-xs text-cyan-600 font-mono">Calories, Macros, Meal Tracking</p>
                   </div>
                 </div>
                <div className="flex items-center">
                  <div
                    className={`w-12 h-6 ${connectedApps.myFitnessPal ? 'bg-cyan-900' : 'bg-gray-800'} rounded-full relative cursor-pointer`}
                    onClick={() => toggleAppConnection('myFitnessPal')}
                  >
                     <div
                       className={`w-4 h-4 rounded-full absolute top-1 transition-all duration-300 ${connectedApps.myFitnessPal ? 'bg-cyan-400 right-1' : 'bg-gray-600 left-1'}`}>
                     </div>
                  </div>
                </div>
              </div>

              {/* Strava */}
              <div className="bg-gray-950 border border-cyan-900 p-4 rounded flex justify-between items-center">
                {/* ... (Strava Icon and Text) ... */}
                 <div className="flex items-center">
                   <div className="w-10 h-10 mr-3 flex items-center justify-center">
                     {/* SVG Icon */}
                     <svg className="w-6 h-6 text-cyan-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                       <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="currentColor" />
                     </svg>
                   </div>
                   <div>
                     <p className="text-sm font-medium text-cyan-300 font-mono">STRAVA</p>
                     <p className="text-xs text-cyan-600 font-mono">Workouts, Running, Cycling</p>
                   </div>
                 </div>
                <div className="flex items-center">
                   <div
                     className={`w-12 h-6 ${connectedApps.strava ? 'bg-cyan-900' : 'bg-gray-800'} rounded-full relative cursor-pointer`}
                     onClick={() => toggleAppConnection('strava')}
                   >
                      <div
                        className={`w-4 h-4 rounded-full absolute top-1 transition-all duration-300 ${connectedApps.strava ? 'bg-cyan-400 right-1' : 'bg-gray-600 left-1'}`}>
                      </div>
                   </div>
                 </div>
              </div>
              {/* Add more integrations (Whoop, Garmin) similarly */}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowIntegrationModal(false)}
                className="bg-cyan-900 text-cyan-300 border border-cyan-600 px-4 py-2 rounded font-mono hover:bg-cyan-800 transition">
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;