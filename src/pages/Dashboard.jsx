// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import BiometricModel from '../components/dashboard/BiometricModel';
import EnhancementMetricsPanel from '../components/dashboard/EnhancementMetricsPanel';
import ProgressionSection from '../components/dashboard/ProgressionSection';
import NutritionPanel from '../components/dashboard/NutritionPanel';
import ActivityLog from '../components/dashboard/ActivityLog';
import ChatInterface from '../components/chatbot/ChatInterface';
import HabitDashboard from '../components/dashboard/HabitDashboard';
import { fetchAppleHealthData } from '../services/healthApi';
import { fetchMyFitnessPalData } from '../services/nutritionApi';
import BiometricPanel from '../components/dashboard/UpdatedBiometricPanel';
import { Flame, Calendar, BarChart3, Brain } from 'lucide-react';

export default function Dashboard() {
  const [healthData, setHealthData] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('main');
  const [showChatbot, setShowChatbot] = useState(false);
  
  // User goals - in a real app, these would come from user settings
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
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [health, nutrition] = await Promise.all([
          fetchAppleHealthData(),
          fetchMyFitnessPalData()
        ]);
        
        setHealthData(health);
        setNutritionData(nutrition);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
    
    // Set up periodic refresh (every 5 minutes)
    const refreshInterval = setInterval(loadData, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);
  
  if (isLoading && !healthData) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-cyan-400 font-mono">
            INITIALIZING SYSTEMS...
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-cyan-300 font-mono">
            {activeTab === 'main' ? 'HUMAN OPTIMIZATION MATRIX' : 'HABIT OPTIMIZATION SYSTEM'}
          </h1>
          
          <div className="flex space-x-4">
            {/* Tab navigation */}
            <div className="flex border border-cyan-800 rounded-lg overflow-hidden">
              <button 
                onClick={() => setActiveTab('main')}
                className={`flex items-center px-4 py-2 text-xs font-mono ${
                  activeTab === 'main' 
                    ? 'bg-cyan-900 text-cyan-300' 
                    : 'bg-gray-900 text-cyan-600 hover:text-cyan-500'
                }`}
              >
                <BarChart3 size={14} className="mr-2" />
                MAIN DASHBOARD
              </button>
              <button 
                onClick={() => setActiveTab('habits')}
                className={`flex items-center px-4 py-2 text-xs font-mono ${
                  activeTab === 'habits' 
                    ? 'bg-cyan-900 text-cyan-300' 
                    : 'bg-gray-900 text-cyan-600 hover:text-cyan-500'
                }`}
              >
                <Flame size={14} className="mr-2" />
                HABIT SYSTEM
              </button>
            </div>
            
            {/* Only show AI Advisor in main dashboard */}
            {activeTab === 'main' && (
              <button 
                onClick={() => setShowChatbot(!showChatbot)}
                className="bg-cyan-900 text-cyan-300 border border-cyan-600 px-4 py-2 rounded font-medium hover:bg-cyan-800 transition flex items-center"
              >
                <Brain size={14} className="mr-2" />
                {showChatbot ? 'CLOSE ADVISOR' : 'AI ADVISOR'}
              </button>
            )}
          </div>
        </div>
        
        {activeTab === 'main' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column with 3D model */}
            <div className="lg:col-span-1">
              <BiometricModel 
                healthData={healthData} 
                userGoals={userGoals}
              />
            </div>
            
            {/* Right column with metrics and data */}
            <div className="lg:col-span-2 space-y-8">
              {/* Conditional rendering for chatbot */}
              {showChatbot ? (
                <div className="h-96">
                  <ChatInterface 
                    userData={{ metrics: healthData }} 
                    userGoals={userGoals} 
                  />
                </div>
              ) : (
                <>
                  <EnhancementMetricsPanel healthData={healthData} />
                  <ProgressionSection goals={userGoals} />
                </>
              )}
              
              {/* Bottom row with nutrition and activity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <NutritionPanel nutritionData={nutritionData} />
                <ActivityLog healthData={healthData} />
              </div>
            </div>
          </div>
        ) : (
          <HabitDashboard />
        )}
      </div>
    </MainLayout>
  );
}