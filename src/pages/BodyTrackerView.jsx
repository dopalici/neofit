import React, { useState, useEffect } from 'react';
import { Calendar, RotateCw, Save, Camera } from 'lucide-react';
import HumanBodyModelViewer from '../components/3d/HumanBodyModelViewer';
import BodyCompositionPanel from '../components/dashboard/BodyCompositionPanel';
import { getFromStorage } from '../utils/storageUtils';

const BODY_HISTORY_KEY = 'body-composition-history';

export default function BodyTrackerView() {
  const [userData, setUserData] = useState({
    bodyMetrics: {
      bodyFat: 20,
      muscleMass: 50,
      height: 175,
      shoulderWidth: 50,
      waistSize: 34
    }
  });
  
  const [viewMode, setViewMode] = useState('front'); // front, side, back
  const [rotationView, setRotationView] = useState(false);
  const [showingHistory, setShowingHistory] = useState(false);
  const [historyDate, setHistoryDate] = useState(null);
  const [bodyHistory, setBodyHistory] = useState([]);
  
  // Load body composition history
  useEffect(() => {
    const history = getFromStorage(BODY_HISTORY_KEY, []);
    if (history && history.length > 0) {
      setBodyHistory(history);
      
      // Set latest measurements as current
      const latestEntry = history[history.length - 1];
      setUserData({
        bodyMetrics: {
          bodyFat: latestEntry.bodyFat || 20,
          muscleMass: latestEntry.muscleMass || 50,
          height: latestEntry.height || 175,
          shoulderWidth: latestEntry.shoulderWidth || 50,
          waistSize: latestEntry.waistSize || 34,
          weight: latestEntry.weight || 78
        }
      });
    }
  }, []);
  
  // Handler for updating user data from the body composition panel
  const handleUpdateUserData = (newData) => {
    setUserData(prev => ({
      ...prev,
      ...newData
    }));
  };
  
  // Handle history date change
  const handleHistoryDateChange = (e) => {
    const selectedDate = e.target.value;
    setHistoryDate(selectedDate);
    
    if (selectedDate) {
      // Find closest date in history
      const targetDate = new Date(selectedDate);
      let closestEntry = null;
      let minDiff = Infinity;
      
      bodyHistory.forEach(entry => {
        const entryDate = new Date(entry.date);
        const diff = Math.abs(entryDate - targetDate);
        
        if (diff < minDiff) {
          minDiff = diff;
          closestEntry = entry;
        }
      });
      
      if (closestEntry) {
        setUserData({
          bodyMetrics: {
            bodyFat: closestEntry.bodyFat || 20,
            muscleMass: closestEntry.muscleMass || 50,
            height: closestEntry.height || 175,
            shoulderWidth: closestEntry.shoulderWidth || 50,
            waistSize: closestEntry.waistSize || 34,
            weight: closestEntry.weight || 78
          }
        });
      }
    } else {
      // Reset to latest entry
      const latestEntry = bodyHistory[bodyHistory.length - 1];
      setUserData({
        bodyMetrics: {
          bodyFat: latestEntry.bodyFat || 20,
          muscleMass: latestEntry.muscleMass || 50,
          height: latestEntry.height || 175,
          shoulderWidth: latestEntry.shoulderWidth || 50,
          waistSize: latestEntry.waistSize || 34,
          weight: latestEntry.weight || 78
        }
      });
    }
  };
  
  // Get date range for history selection
  const getDateRange = () => {
    if (bodyHistory.length === 0) return { min: "", max: "" };
    
    const dates = bodyHistory.map(entry => new Date(entry.date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    return {
      min: minDate.toISOString().split('T')[0],
      max: maxDate.toISOString().split('T')[0]
    };
  };
  
  // Calculate camera position based on view mode
  const getCameraPosition = () => {
    switch(viewMode) {
      case 'front': return [0, 1, 3];
      case 'side': return [3, 1, 0];
      case 'back': return [0, 1, -3];
      default: return [0, 1, 3];
    }
  };
  
  const dateRange = getDateRange();
  
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-cyan-300 font-mono">BODY COMPOSITION ANALYZER</h1>
        <div className="flex items-center">
          {bodyHistory.length > 1 && (
            <div className="mr-4 flex items-center">
              <button
                onClick={() => setShowingHistory(!showingHistory)}
                className={`mr-2 px-3 py-1 rounded text-xs font-mono ${
                  showingHistory 
                    ? 'bg-cyan-900 text-cyan-300 border border-cyan-700' 
                    : 'text-cyan-600 hover:text-cyan-400'
                }`}
              >
                <Calendar size={14} className="inline mr-1" />
                HISTORY VIEW
              </button>
              
              {showingHistory && (
                <input
                  type="date"
                  value={historyDate || ''}
                  onChange={handleHistoryDateChange}
                  min={dateRange.min}
                  max={dateRange.max}
                  className="bg-gray-900 border border-cyan-800 rounded px-2 py-1 text-xs text-cyan-300 font-mono"
                />
              )}
            </div>
          )}
          
          <button 
            onClick={() => setRotationView(!rotationView)}
            className={`px-3 py-1 rounded text-xs font-mono ${
              rotationView 
                ? 'bg-cyan-900 text-cyan-300 border border-cyan-700' 
                : 'text-cyan-600 hover:text-cyan-400'
            }`}
            title="Toggle camera rotation"
          >
            <RotateCw size={14} className="inline mr-1" />
            ROTATE VIEW
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - 3D Model */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900 border border-cyan-800 rounded-lg shadow-lg shadow-cyan-900/20 overflow-hidden">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-mono text-cyan-300">BIOMETRIC MODEL</h2>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewMode('front')}
                    className={`px-3 py-1 rounded-full text-xs font-mono ${
                      viewMode === 'front' 
                        ? 'bg-cyan-900 text-cyan-300' 
                        : 'bg-gray-800 text-cyan-600 hover:bg-gray-700'
                    }`}
                  >
                    FRONT
                  </button>
                  <button
                    onClick={() => setViewMode('side')}
                    className={`px-3 py-1 rounded-full text-xs font-mono ${
                      viewMode === 'side' 
                        ? 'bg-cyan-900 text-cyan-300' 
                        : 'bg-gray-800 text-cyan-600 hover:bg-gray-700'
                    }`}
                  >
                    SIDE
                  </button>
                  <button
                    onClick={() => setViewMode('back')}
                    className={`px-3 py-1 rounded-full text-xs font-mono ${
                      viewMode === 'back' 
                        ? 'bg-cyan-900 text-cyan-300' 
                        : 'bg-gray-800 text-cyan-600 hover:bg-gray-700'
                    }`}
                  >
                    BACK
                  </button>
                </div>
              </div>
              
              {/* 3D Model Viewer */}
              <div className="relative h-[500px]">
                <HumanBodyModelViewer 
                  userData={userData}
                  currentExercise="idle"
                  showControls={!rotationView}
                  cameraPosition={getCameraPosition()}
                />
                
                {rotationView && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="text-cyan-300 font-mono text-center">
                      <RotateCw size={32} className="mx-auto mb-2 animate-spin" />
                      ANALYZING BODY COMPOSITION
                    </div>
                  </div>
                )}
                
                {showingHistory && historyDate && (
                  <div className="absolute top-4 left-4 bg-gray-900/80 border border-cyan-800 p-2 rounded text-xs text-cyan-300 font-mono">
                    VIEWING HISTORICAL DATA: {new Date(historyDate).toLocaleDateString()}
                  </div>
                )}
              </div>
              
              {/* Body metrics display */}
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="bg-gray-950 border border-cyan-900 p-3 rounded">
                  <div className="text-xs text-cyan-600 font-mono mb-1">BODY FAT</div>
                  <div className="text-xl font-bold text-cyan-300 font-mono">
                    {userData.bodyMetrics.bodyFat}%
                  </div>
                </div>
                
                <div className="bg-gray-950 border border-cyan-900 p-3 rounded">
                  <div className="text-xs text-cyan-600 font-mono mb-1">MUSCLE MASS</div>
                  <div className="text-xl font-bold text-cyan-300 font-mono">
                    {userData.bodyMetrics.muscleMass}%
                  </div>
                </div>
                
                <div className="bg-gray-950 border border-cyan-900 p-3 rounded">
                  <div className="text-xs text-cyan-600 font-mono mb-1">WEIGHT</div>
                  <div className="text-xl font-bold text-cyan-300 font-mono">
                    {userData.bodyMetrics.weight} kg
                  </div>
                </div>
              </div>
              
              {/* Capture button */}
              <div className="mt-6 text-center">
                <button className="bg-cyan-900 text-cyan-300 border border-cyan-700 px-4 py-2 rounded font-mono hover:bg-cyan-800 transition inline-flex items-center">
                  <Camera size={16} className="mr-2" />
                  CAPTURE CURRENT VIEW
                </button>
                <p className="mt-2 text-xs text-cyan-600 font-mono">
                  Save this view to your progress gallery
                </p>
              </div>
            </div>
          </div>
          
          {/* Additional model info */}
          <div className="mt-6 bg-gray-900 border border-cyan-800 rounded-lg p-4">
            <div className="text-sm font-mono text-cyan-300 mb-3">BODY METRICS ANALYSIS</div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-950 border border-cyan-900 p-3 rounded">
                <div className="text-xs text-cyan-600 font-mono mb-1">BODY MASS INDEX (BMI)</div>
                <div className="text-xl font-bold text-cyan-300 font-mono">
                  {(userData.bodyMetrics.weight / Math.pow(userData.bodyMetrics.height/100, 2)).toFixed(1)}
                </div>
                <div className="text-xs text-cyan-600 font-mono mt-1">
                  {getBMICategory((userData.bodyMetrics.weight / Math.pow(userData.bodyMetrics.height/100, 2)))}
                </div>
              </div>
              
              <div className="bg-gray-950 border border-cyan-900 p-3 rounded">
                <div className="text-xs text-cyan-600 font-mono mb-1">BODY COMPOSITION SCORE</div>
                <div className="text-xl font-bold text-cyan-300 font-mono">
                  {calculateBodyScore(userData.bodyMetrics)}
                </div>
                <div className="text-xs text-cyan-600 font-mono mt-1">
                  ABOVE AVERAGE COMPOSITION
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right column - Body Composition Panel */}
        <div>
          <BodyCompositionPanel onUpdateUserData={handleUpdateUserData} />
        </div>
      </div>
    </div>
  );
}

// Helper function to determine BMI category
function getBMICategory(bmi) {
  if (bmi < 18.5) return "UNDERWEIGHT";
  if (bmi < 25) return "NORMAL WEIGHT";
  if (bmi < 30) return "OVERWEIGHT";
  return "OBESE";
}

// Helper function to calculate body score
function calculateBodyScore(metrics) {
  // This is a simplified score calculation
  // In a real app, this would be more sophisticated
  
  let score = 0;
  
  // Body fat score (lower is better)
  // Ideal ranges: Male 10-20%, Female 18-28%
  const idealBodyFat = 15; // Using male range as default
  const bodyFatDiff = Math.abs(metrics.bodyFat - idealBodyFat);
  score += Math.max(0, 40 - bodyFatDiff * 2);
  
  // Muscle mass score (higher is better)
  // Ideal ranges vary, but generally higher is better within reason
  score += metrics.muscleMass * 0.6;
  
  // BMI component
  const bmi = metrics.weight / Math.pow(metrics.height/100, 2);
  const idealBMI = 22; // Middle of "normal" range
  const bmiDiff = Math.abs(bmi - idealBMI);
  score += Math.max(0, 20 - bmiDiff * 4);
  
  // Return final score (capped at 100)
  return Math.min(100, Math.round(score));
}