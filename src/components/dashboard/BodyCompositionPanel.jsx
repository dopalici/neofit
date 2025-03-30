import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUp, ArrowDown, Plus, User, Save, X } from 'lucide-react';
import { saveToStorage, getFromStorage } from '../../utils/storageUtils';

const STORAGE_KEY = 'body-composition-history';

/**
 * Component to track body composition metrics over time
 * Integrates with the 3D model visualization
 */
export default function BodyCompositionPanel({ onUpdateUserData }) {
  const [metrics, setMetrics] = useState({
    weight: 78,
    bodyFat: 20,
    muscleMass: 50,
    height: 175,
    shoulderWidth: 50,
    waistSize: 34
  });
  
  const [history, setHistory] = useState([]);
  const [isAddingMeasurement, setIsAddingMeasurement] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('bodyFat');
  
  // Load history from storage
  useEffect(() => {
    const savedHistory = getFromStorage(STORAGE_KEY, []);
    if (savedHistory && savedHistory.length > 0) {
      setHistory(savedHistory);
      
      // Initialize form with latest values
      const latestEntry = savedHistory[savedHistory.length - 1];
      setMetrics({
        weight: latestEntry.weight || 78,
        bodyFat: latestEntry.bodyFat || 20,
        muscleMass: latestEntry.muscleMass || 50,
        height: latestEntry.height || 175,
        shoulderWidth: latestEntry.shoulderWidth || 50,
        waistSize: latestEntry.waistSize || 34
      });
    }
  }, []);
  
  // Calculate progress since last measurement
  const calculateProgress = (metric) => {
    if (history.length < 2) return null;
    
    const latest = history[history.length - 1][metric];
    const previous = history[history.length - 2][metric];
    
    if (latest === undefined || previous === undefined) return null;
    
    return {
      value: latest - previous,
      percentage: previous ? ((latest - previous) / previous) * 100 : 0
    };
  };
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setMetrics(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };
  
  // Save new measurement
  const handleSave = () => {
    const newEntry = {
      ...metrics,
      date: new Date().toISOString()
    };
    
    const updatedHistory = [...history, newEntry];
    setHistory(updatedHistory);
    saveToStorage(STORAGE_KEY, updatedHistory);
    
    setIsAddingMeasurement(false);
    setSuccessMessage('New measurements saved successfully!');
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
    
    // Update parent component with new data for 3D model
    if (onUpdateUserData) {
      onUpdateUserData({
        bodyMetrics: newEntry
      });
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  // Get visual indicator for progress
  const getProgressIndicator = (progress) => {
    if (!progress) return null;
    
    // For weight and body fat, negative is good; for muscle mass, positive is good
    const isPositive = 
      (selectedMetric === 'muscleMass' && progress.value > 0) ||
      ((selectedMetric === 'weight' || selectedMetric === 'bodyFat') && progress.value < 0);
    
    const color = isPositive ? 'text-green-500' : 'text-red-500';
    const Icon = isPositive ? ArrowUp : ArrowDown;
    
    return (
      <div className={`flex items-center ${color}`}>
        <Icon size={14} className="mr-1" />
        <span>{Math.abs(progress.value).toFixed(1)} ({Math.abs(progress.percentage).toFixed(1)}%)</span>
      </div>
    );
  };
  
  return (
    <div className="bg-gray-900 border border-cyan-800 rounded-lg shadow-lg shadow-cyan-900/20 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-mono text-cyan-300">BODY COMPOSITION TRACKER</h2>
          <button 
            onClick={() => setIsAddingMeasurement(true)}
            className="bg-cyan-900 text-cyan-300 border border-cyan-600 px-3 py-1 rounded text-xs font-mono hover:bg-cyan-800 transition flex items-center"
          >
            <Plus size={14} className="mr-1" />
            NEW MEASUREMENT
          </button>
        </div>
        
        {/* Success message */}
        {successMessage && (
          <div className="mb-4 bg-green-900/20 border border-green-700 rounded-lg p-3">
            <p className="text-green-400 font-mono text-sm">{successMessage}</p>
          </div>
        )}
        
        {/* Form for adding new measurement */}
        {isAddingMeasurement && (
          <div className="mb-6 bg-gray-950 border border-cyan-900 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-mono text-cyan-300">NEW MEASUREMENT</h3>
              <button 
                onClick={() => setIsAddingMeasurement(false)}
                className="text-cyan-600 hover:text-cyan-400"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs text-cyan-600 font-mono block mb-1">WEIGHT (KG)</label>
                <input
                  type="number"
                  name="weight"
                  value={metrics.weight}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-cyan-800 rounded px-3 py-2 text-cyan-300 font-mono"
                  step="0.1"
                />
              </div>
              
              <div>
                <label className="text-xs text-cyan-600 font-mono block mb-1">BODY FAT (%)</label>
                <input
                  type="number"
                  name="bodyFat"
                  value={metrics.bodyFat}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-cyan-800 rounded px-3 py-2 text-cyan-300 font-mono"
                  step="0.1"
                  min="5"
                  max="40"
                />
              </div>
              
              <div>
                <label className="text-xs text-cyan-600 font-mono block mb-1">MUSCLE MASS (%)</label>
                <input
                  type="number"
                  name="muscleMass"
                  value={metrics.muscleMass}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-cyan-800 rounded px-3 py-2 text-cyan-300 font-mono"
                  step="0.1"
                  min="30"
                  max="70"
                />
              </div>
              
              <div>
                <label className="text-xs text-cyan-600 font-mono block mb-1">HEIGHT (CM)</label>
                <input
                  type="number"
                  name="height"
                  value={metrics.height}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-cyan-800 rounded px-3 py-2 text-cyan-300 font-mono"
                  step="0.1"
                />
              </div>
              
              <div>
                <label className="text-xs text-cyan-600 font-mono block mb-1">SHOULDER WIDTH</label>
                <input
                  type="number"
                  name="shoulderWidth"
                  value={metrics.shoulderWidth}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-cyan-800 rounded px-3 py-2 text-cyan-300 font-mono"
                  step="0.1"
                  min="30"
                  max="70"
                />
              </div>
              
              <div>
                <label className="text-xs text-cyan-600 font-mono block mb-1">WAIST SIZE (IN)</label>
                <input
                  type="number"
                  name="waistSize"
                  value={metrics.waistSize}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-cyan-800 rounded px-3 py-2 text-cyan-300 font-mono"
                  step="0.1"
                  min="24"
                  max="50"
                />
              </div>
            </div>
            
            <div className="text-right">
              <button 
                onClick={handleSave}
                className="bg-cyan-900 text-cyan-300 border border-cyan-600 px-4 py-2 rounded text-sm font-mono hover:bg-cyan-800 transition flex items-center ml-auto"
              >
                <Save size={14} className="mr-2" />
                SAVE MEASUREMENTS
              </button>
            </div>
          </div>
        )}
        
        {/* Display latest measurements and progress */}
        {history.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-950 border border-cyan-900 p-3 rounded">
              <div className="text-xs text-cyan-600 font-mono mb-1">BODY FAT</div>
              <div className="flex justify-between items-center">
                <div className="text-xl font-bold text-cyan-300 font-mono">{history[history.length - 1].bodyFat.toFixed(1)}%</div>
                {getProgressIndicator(calculateProgress('bodyFat'))}
              </div>
            </div>
            
            <div className="bg-gray-950 border border-cyan-900 p-3 rounded">
              <div className="text-xs text-cyan-600 font-mono mb-1">MUSCLE MASS</div>
              <div className="flex justify-between items-center">
                <div className="text-xl font-bold text-cyan-300 font-mono">{history[history.length - 1].muscleMass.toFixed(1)}%</div>
                {getProgressIndicator(calculateProgress('muscleMass'))}
              </div>
            </div>
            
            <div className="bg-gray-950 border border-cyan-900 p-3 rounded">
              <div className="text-xs text-cyan-600 font-mono mb-1">WEIGHT</div>
              <div className="flex justify-between items-center">
                <div className="text-xl font-bold text-cyan-300 font-mono">{history[history.length - 1].weight.toFixed(1)} kg</div>
                {getProgressIndicator(calculateProgress('weight'))}
              </div>
            </div>
          </div>
        )}
        
        {/* Chart section */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-cyan-600 font-mono">PROGRESS CHART</div>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="bg-gray-900 border border-cyan-800 rounded px-2 py-1 text-xs text-cyan-400 font-mono"
            >
              <option value="bodyFat">Body Fat %</option>
              <option value="muscleMass">Muscle Mass %</option>
              <option value="weight">Weight (kg)</option>
              <option value="shoulderWidth">Shoulder Width</option>
              <option value="waistSize">Waist Size (in)</option>
            </select>
          </div>
          
          {history.length > 1 ? (
            <div className="h-64 bg-gray-950 border border-cyan-900 rounded p-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={history.map(entry => ({
                    ...entry,
                    date: formatDate(entry.date)
                  }))}
                  margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#67e8f9', fontSize: 10, fontFamily: 'monospace' }} 
                  />
                  <YAxis 
                    tick={{ fill: '#67e8f9', fontSize: 10, fontFamily: 'monospace' }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      border: '1px solid #155e75',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      color: '#67e8f9'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={selectedMetric} 
                    stroke="#06b6d4" 
                    strokeWidth={2}
                    dot={{ fill: '#06b6d4', r: 4 }}
                    activeDot={{ fill: '#22d3ee', r: 6, stroke: '#0891b2', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 bg-gray-950 border border-cyan-900 rounded flex items-center justify-center">
              <div className="text-center">
                <User size={32} className="mx-auto text-cyan-700 mb-3" />
                <p className="text-cyan-600 font-mono text-sm">
                  {history.length === 0 
                    ? 'NO MEASUREMENTS RECORDED YET' 
                    : 'ADD MORE MEASUREMENTS TO SEE PROGRESS'
                  }
                </p>
                <button 
                  onClick={() => setIsAddingMeasurement(true)}
                  className="mt-4 bg-cyan-900 text-cyan-300 border border-cyan-700 px-3 py-2 rounded text-xs font-mono hover:bg-cyan-800 transition"
                >
                  RECORD MEASUREMENTS
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}