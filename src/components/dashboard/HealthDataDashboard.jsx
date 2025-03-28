import React, { useState, useEffect } from 'react';
import { Calendar, Activity, Heart, TrendingUp, Moon, Scale, Download, Upload } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { getAllHealthData, getLatestHealthData } from '../../services/dataImportService';
import HealthDataImporter from '../settings/HealthDataImporter';
import HealthDataExporter from '../settings/HealthDataExporter';

export default function HealthDataDashboard() {
  const [healthData, setHealthData] = useState(null);
  const [timeRange, setTimeRange] = useState('week'); // 'day', 'week', 'month', 'year'
  const [showImporter, setShowImporter] = useState(false);
  const [showExporter, setShowExporter] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadHealthData();
  }, []);
  
  const loadHealthData = () => {
    setLoading(true);
    
    try {
      const data = getAllHealthData();
      setHealthData(data);
    } catch (error) {
      console.error('Error loading health data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDataImported = (stats) => {
    // Reload data after import
    loadHealthData();
    setShowImporter(false);
  };
  
  // Filter data by time range
  const getFilteredData = (dataArray, range) => {
    if (!dataArray || dataArray.length === 0) return [];
    
    const now = new Date();
    let startDate;
    
    switch (range) {
      case 'day':
        startDate = subDays(now, 1);
        break;
      case 'week':
        startDate = subDays(now, 7);
        break;
      case 'month':
        startDate = subDays(now, 30);
        break;
      case 'year':
        startDate = subDays(now, 365);
        break;
      default:
        startDate = subDays(now, 7);
    }
    
    return dataArray.filter(item => {
      const itemDate = parseISO(item.date);
      return itemDate >= startDate && itemDate <= now;
    });
  };
  
  // Calculate average for a dataset
  const calculateAverage = (dataArray, property = 'value') => {
    if (!dataArray || dataArray.length === 0) return 0;
    
    const sum = dataArray.reduce((acc, item) => acc + item[property], 0);
    return (sum / dataArray.length).toFixed(1);
  };
  
  // Calculate max for a dataset
  const calculateMax = (dataArray, property = 'value') => {
    if (!dataArray || dataArray.length === 0) return 0;
    
    return Math.max(...dataArray.map(item => item[property])).toFixed(1);
  };
  
  // Get latest for a dataset
  const getLatest = (dataArray) => {
    if (!dataArray || dataArray.length === 0) return null;
    
    const sorted = [...dataArray].sort((a, b) => new Date(b.date) - new Date(a.date));
    return sorted[0];
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-cyan-300 font-mono">HEALTH DATA ANALYSIS</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-cyan-500 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }
  
  // Filter data based on selected time range
  const filteredHeartRate = healthData ? getFilteredData(healthData.heartRate, timeRange) : [];
  const filteredSteps = healthData ? getFilteredData(healthData.steps, timeRange) : [];
  const filteredWeight = healthData ? getFilteredData(healthData.weight, timeRange) : [];
  const filteredSleep = healthData ? getFilteredData(healthData.sleep, timeRange) : [];
  const filteredVo2max = healthData ? getFilteredData(healthData.vo2max, timeRange) : [];
  
  // Get latest values
  const latestHeartRate = getLatest(healthData?.heartRate);
  const latestSteps = getLatest(healthData?.steps);
  const latestWeight = getLatest(healthData?.weight);
  const latestSleep = getLatest(healthData?.sleep);
  const latestVo2max = getLatest(healthData?.vo2max);
  
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-cyan-300 font-mono">HEALTH DATA ANALYSIS</h1>
        
        <div className="flex items-center">
          <div className="mr-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-gray-900 border border-cyan-800 rounded px-3 py-2 text-cyan-300 font-mono"
            >
              <option value="day">Last 24 Hours</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last 365 Days</option>
            </select>
          </div>
          
          <button 
            onClick={() => {
              setShowImporter(!showImporter);
              setShowExporter(false);
            }}
            className="bg-cyan-900 text-cyan-300 border border-cyan-600 px-4 py-2 rounded font-medium hover:bg-cyan-800 transition mr-2 flex items-center"
          >
            <Upload size={16} className="mr-2" />
            {showImporter ? 'HIDE IMPORTER' : 'IMPORT DATA'}
          </button>
          
          <button 
            onClick={() => {
              setShowExporter(!showExporter);
              setShowImporter(false);
            }}
            className="bg-cyan-900 text-cyan-300 border border-cyan-600 px-4 py-2 rounded font-medium hover:bg-cyan-800 transition flex items-center"
          >
            <Download size={16} className="mr-2" />
            {showExporter ? 'HIDE EXPORTER' : 'EXPORT DATA'}
          </button>
        </div>
      </div>
      
      {showImporter && (
        <div className="mb-8">
          <HealthDataImporter onDataImported={handleDataImported} />
        </div>
      )}
      
      {showExporter && (
        <div className="mb-8">
          <HealthDataExporter />
        </div>
      )}
      
      {/* Data Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Heart Rate */}
        <div className="bg-gray-900 border border-cyan-800 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center mb-2">
                <Heart size={20} className="text-red-500 mr-2" />
                <h3 className="text-lg font-mono text-cyan-300">HEART RATE</h3>
              </div>
              <p className="text-3xl font-bold text-cyan-300 font-mono">
                {latestHeartRate ? latestHeartRate.value.toFixed(0) : '--'} <span className="text-sm">BPM</span>
              </p>
              <div className="flex mt-2">
                <div className="mr-4">
                  <p className="text-xs text-cyan-600 font-mono">AVG</p>
                  <p className="text-cyan-400 font-mono">{calculateAverage(filteredHeartRate)}</p>
                </div>
                <div>
                  <p className="text-xs text-cyan-600 font-mono">MAX</p>
                  <p className="text-cyan-400 font-mono">{calculateMax(filteredHeartRate)}</p>
                </div>
              </div>
            </div>
            
            {/* Simple sparkline visualization */}
            <div className="h-16 w-24 flex items-end">
              {filteredHeartRate.slice(-15).map((item, index) => {
                const max = Math.max(...filteredHeartRate.slice(-15).map(d => d.value));
                const min = Math.min(...filteredHeartRate.slice(-15).map(d => d.value));
                const range = max - min || 1;
                const height = ((item.value - min) / range) * 100;
                
                return (
                  <div 
                    key={index} 
                    className="w-1 bg-red-500 mx-px rounded-t"
                    style={{ height: `${height}%` }}
                  ></div>
                );
              })}
            </div>
          </div>
          
          <p className="text-xs text-cyan-600 font-mono mt-4">
            {latestHeartRate ? `LAST UPDATED: ${format(parseISO(latestHeartRate.date), 'MMM d, yyyy')}` : 'NO DATA'}
          </p>
        </div>
        
        {/* Steps */}
        <div className="bg-gray-900 border border-cyan-800 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center mb-2">
                <Activity size={20} className="text-green-500 mr-2" />
                <h3 className="text-lg font-mono text-cyan-300">STEPS</h3>
              </div>
              <p className="text-3xl font-bold text-cyan-300 font-mono">
                {latestSteps ? latestSteps.value.toLocaleString() : '--'}
              </p>
              <div className="flex mt-2">
                <div className="mr-4">
                  <p className="text-xs text-cyan-600 font-mono">AVG</p>
                  <p className="text-cyan-400 font-mono">{calculateAverage(filteredSteps)}</p>
                </div>
                <div>
                  <p className="text-xs text-cyan-600 font-mono">TOTAL</p>
                  <p className="text-cyan-400 font-mono">
                    {filteredSteps.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Simple bar chart */}
            <div className="h-16 w-24 flex items-end">
              {filteredSteps.slice(-7).map((item, index) => {
                const max = Math.max(...filteredSteps.slice(-7).map(d => d.value));
                const height = (item.value / max) * 100;
                
                return (
                  <div 
                    key={index} 
                    className="w-3 bg-green-500 mx-px rounded-t"
                    style={{ height: `${height}%` }}
                  ></div>
                );
              })}
            </div>
          </div>
          
          <p className="text-xs text-cyan-600 font-mono mt-4">
            {latestSteps ? `LAST UPDATED: ${format(parseISO(latestSteps.date), 'MMM d, yyyy')}` : 'NO DATA'}
          </p>
        </div>
        
        {/* Weight */}
        <div className="bg-gray-900 border border-cyan-800 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center mb-2">
                <Scale size={20} className="text-blue-500 mr-2" />
                <h3 className="text-lg font-mono text-cyan-300">WEIGHT</h3>
              </div>
              <p className="text-3xl font-bold text-cyan-300 font-mono">
                {latestWeight ? latestWeight.value.toFixed(1) : '--'} <span className="text-sm">KG</span>
              </p>
              <div className="flex mt-2">
                <div className="mr-4">
                  <p className="text-xs text-cyan-600 font-mono">AVG</p>
                  <p className="text-cyan-400 font-mono">{calculateAverage(filteredWeight)}</p>
                </div>
                <div>
                  <p className="text-xs text-cyan-600 font-mono">CHANGE</p>
                  <p className="text-cyan-400 font-mono">
                    {filteredWeight.length > 1 
                      ? (filteredWeight[filteredWeight.length - 1].value - filteredWeight[0].value).toFixed(1) 
                      : '0.0'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Simple line chart */}
            <div className="h-16 w-24 relative">
              {filteredWeight.length > 1 && (
                <svg viewBox="0 0 100 60" className="h-full w-full">
                  <path
                    d={filteredWeight.slice(-10).map((item, i, arr) => {
                      const max = Math.max(...arr.map(d => d.value));
                      const min = Math.min(...arr.map(d => d.value));
                      const range = max - min || 1;
                      const x = (i / (arr.length - 1)) * 100;
                      const y = 60 - ((item.value - min) / range) * 50;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                  />
                </svg>
              )}
            </div>
          </div>
          
          <p className="text-xs text-cyan-600 font-mono mt-4">
            {latestWeight ? `LAST UPDATED: ${format(parseISO(latestWeight.date), 'MMM d, yyyy')}` : 'NO DATA'}
          </p>
        </div>
        
        {/* Sleep */}
        <div className="bg-gray-900 border border-cyan-800 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center mb-2">
                <Moon size={20} className="text-purple-500 mr-2" />
                <h3 className="text-lg font-mono text-cyan-300">SLEEP</h3>
              </div>
              <p className="text-3xl font-bold text-cyan-300 font-mono">
                {latestSleep ? latestSleep.value.toFixed(1) : '--'} <span className="text-sm">HRS</span>
              </p>
              <div className="flex mt-2">
                <div className="mr-4">
                  <p className="text-xs text-cyan-600 font-mono">AVG</p>
                  <p className="text-cyan-400 font-mono">{calculateAverage(filteredSleep)}</p>
                </div>
                <div>
                  <p className="text-xs text-cyan-600 font-mono">QUALITY</p>
                  <p className="text-cyan-400 font-mono">
                    {filteredSleep.length > 0 
                      ? ((filteredSleep.filter(item => item.value >= 7).length / filteredSleep.length) * 100).toFixed(0) + '%' 
                      : '--'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Sleep bars */}
            <div className="h-16 w-24 flex items-end">
              {filteredSleep.slice(-7).map((item, index) => {
                const height = (item.value / 10) * 100; // Assuming max is 10 hours
                
                return (
                  <div 
                    key={index} 
                    className="w-3 bg-purple-500 mx-px rounded-t"
                    style={{ height: `${Math.min(height, 100)}%` }}
                  ></div>
                );
              })}
            </div>
          </div>
          
          <p className="text-xs text-cyan-600 font-mono mt-4">
            {latestSleep ? `LAST UPDATED: ${format(parseISO(latestSleep.date), 'MMM d, yyyy')}` : 'NO DATA'}
          </p>
        </div>
      </div>
      
      {/* Detailed Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Heart Rate Chart */}
        <div className="bg-gray-900 border border-cyan-800 rounded-lg p-6">
          <h3 className="text-lg font-mono text-cyan-300 mb-4">HEART RATE TRENDS</h3>
          
          {filteredHeartRate.length > 0 ? (
            <div className="h-64 relative">
              {/* X-axis (time) */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-cyan-600 font-mono">
                {filteredHeartRate.length > 1 && Array.from({ length: 5 }).map((_, i) => {
                  const index = Math.floor((filteredHeartRate.length - 1) * (i / 4));
                  const item = filteredHeartRate[index];
                  return (
                    <div key={i}>
                      {format(parseISO(item.date), 'MMM d')}
                    </div>
                  );
                })}
              </div>
              
              {/* Y-axis (heart rate) */}
              <div className="absolute top-0 bottom-8 left-0 flex flex-col justify-between text-xs text-cyan-600 font-mono">
                {Array.from({ length: 5 }).map((_, i) => {
                  const max = Math.max(...filteredHeartRate.map(d => d.value));
                  const min = Math.min(...filteredHeartRate.map(d => d.value));
                  const range = max - min || 1;
                  const value = max - (range * (i / 4));
                  return (
                    <div key={i}>
                      {value.toFixed(0)}
                    </div>
                  );
                })}
              </div>
              
              {/* Chart Area */}
              <div className="absolute top-0 right-6 bottom-8 left-8">
                <svg viewBox="0 0 100 100" className="h-full w-full">
                  <path
                    d={filteredHeartRate.map((item, i, arr) => {
                      const max = Math.max(...arr.map(d => d.value));
                      const min = Math.min(...arr.map(d => d.value));
                      const range = max - min || 1;
                      const x = (i / (arr.length - 1)) * 100;
                      const y = 100 - ((item.value - min) / range) * 100;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                  />
                  
                  {/* Area fill */}
                  <path
                    d={`
                      ${filteredHeartRate.map((item, i, arr) => {
                        const max = Math.max(...arr.map(d => d.value));
                        const min = Math.min(...arr.map(d => d.value));
                        const range = max - min || 1;
                        const x = (i / (arr.length - 1)) * 100;
                        const y = 100 - ((item.value - min) / range) * 100;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')}
                      L 100 100 L 0 100 Z
                    `}
                    fill="url(#heartRateGradient)"
                    opacity="0.2"
                  />
                  
                  <defs>
                    <linearGradient id="heartRateGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8"/>
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-cyan-600 font-mono">NO HEART RATE DATA AVAILABLE</p>
            </div>
          )}
        </div>
        
        {/* Steps Chart */}
        <div className="bg-gray-900 border border-cyan-800 rounded-lg p-6">
          <h3 className="text-lg font-mono text-cyan-300 mb-4">STEP COUNT HISTORY</h3>
          
          {filteredSteps.length > 0 ? (
            <div className="h-64 relative">
              {/* X-axis (dates) */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-cyan-600 font-mono">
                {filteredSteps.length > 1 && Array.from({ length: 5 }).map((_, i) => {
                  const index = Math.floor((filteredSteps.length - 1) * (i / 4));
                  const item = filteredSteps[index];
                  return (
                    <div key={i}>
                      {format(parseISO(item.date), 'MMM d')}
                    </div>
                  );
                })}
              </div>
              
              {/* Y-axis (steps) */}
              <div className="absolute top-0 bottom-8 left-0 flex flex-col justify-between text-xs text-cyan-600 font-mono">
                {Array.from({ length: 5 }).map((_, i) => {
                  const max = Math.max(...filteredSteps.map(d => d.value));
                  const value = max * (1 - (i / 4));
                  return (
                    <div key={i}>
                      {value.toFixed(0)}
                    </div>
                  );
                })}
              </div>
              
              {/* Bar Chart */}
              <div className="absolute top-0 right-6 bottom-8 left-8 flex items-end">
                {filteredSteps.map((item, index) => {
                  const max = Math.max(...filteredSteps.map(d => d.value));
                  const height = (item.value / max) * 100;
                  
                  return (
                    <div 
                      key={index} 
                      className="flex-1 bg-green-500 mx-px rounded-t"
                      style={{ height: `${height}%` }}
                    ></div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-cyan-600 font-mono">NO STEP DATA AVAILABLE</p>
            </div>
          )}
        </div>
        
        {/* Weight Trend */}
        <div className="bg-gray-900 border border-cyan-800 rounded-lg p-6">
          <h3 className="text-lg font-mono text-cyan-300 mb-4">WEIGHT PROGRESSION</h3>
          
          {filteredWeight.length > 0 ? (
            <div className="h-64 relative">
              {/* X-axis (time) */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-cyan-600 font-mono">
                {filteredWeight.length > 1 && Array.from({ length: 5 }).map((_, i) => {
                  const index = Math.floor((filteredWeight.length - 1) * (i / 4));
                  const item = filteredWeight[index];
                  return (
                    <div key={i}>
                      {format(parseISO(item.date), 'MMM d')}
                    </div>
                  );
                })}
              </div>
              
              {/* Y-axis (weight) */}
              <div className="absolute top-0 bottom-8 left-0 flex flex-col justify-between text-xs text-cyan-600 font-mono">
                {Array.from({ length: 5 }).map((_, i) => {
                  const max = Math.max(...filteredWeight.map(d => d.value));
                  const min = Math.min(...filteredWeight.map(d => d.value));
                  const range = max - min || 1;
                  const value = max - (range * (i / 4));
                  return (
                    <div key={i}>
                      {value.toFixed(1)}
                    </div>
                  );
                })}
              </div>
              
              {/* Chart Area */}
              <div className="absolute top-0 right-6 bottom-8 left-8">
                <svg viewBox="0 0 100 100" className="h-full w-full">
                  <path
                    d={filteredWeight.map((item, i, arr) => {
                      const max = Math.max(...arr.map(d => d.value));
                      const min = Math.min(...arr.map(d => d.value));
                      const range = max - min || 1;
                      const x = (i / (arr.length - 1)) * 100;
                      const y = 100 - ((item.value - min) / range) * 100;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                  />
                  
                  {/* Points */}
                  {filteredWeight.map((item, i, arr) => {
                    const max = Math.max(...arr.map(d => d.value));
                    const min = Math.min(...arr.map(d => d.value));
                    const range = max - min || 1;
                    const x = (i / (arr.length - 1)) * 100;
                    const y = 100 - ((item.value - min) / range) * 100;
                    return (
                      <circle 
                        key={i}
                        cx={x} 
                        cy={y} 
                        r="2" 
                        fill="#3B82F6" 
                      />
                    );
                  })}
                </svg>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-cyan-600 font-mono">NO WEIGHT DATA AVAILABLE</p>
            </div>
          )}
        </div>
        
        {/* Sleep Chart */}
        <div className="bg-gray-900 border border-cyan-800 rounded-lg p-6">
          <h3 className="text-lg font-mono text-cyan-300 mb-4">SLEEP PATTERNS</h3>
          
          {filteredSleep.length > 0 ? (
            <div className="h-64 relative">
              {/* X-axis (dates) */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-cyan-600 font-mono">
                {filteredSleep.length > 1 && Array.from({ length: 5 }).map((_, i) => {
                  const index = Math.floor((filteredSleep.length - 1) * (i / 4));
                  const item = filteredSleep[index];
                  return (
                    <div key={i}>
                      {format(parseISO(item.date), 'MMM d')}
                    </div>
                  );
                })}
              </div>
              
              {/* Y-axis (hours) */}
              <div className="absolute top-0 bottom-8 left-0 flex flex-col justify-between text-xs text-cyan-600 font-mono">
                {Array.from({ length: 5 }).map((_, i) => {
                  return (
                    <div key={i}>
                      {10 - (i * 2)}h
                    </div>
                  );
                })}
              </div>
              
              {/* Bar Chart */}
              <div className="absolute top-0 right-6 bottom-8 left-8 flex items-end">
                {filteredSleep.map((item, index) => {
                  const height = (item.value / 10) * 100; // Assuming max is 10 hours
                  
                  return (
                    <div key={index} className="flex-1 mx-px rounded-t overflow-hidden flex flex-col-reverse">
                      <div 
                        className="bg-purple-500"
                        style={{ height: `${Math.min(height, 100)}%` }}
                      ></div>
                      {/* Deep sleep indicator (example - in real app you'd use actual deep sleep data) */}
                      <div 
                        className="bg-purple-800"
                        style={{ height: `${Math.min(height * 0.3, 30)}%` }}
                      ></div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-cyan-600 font-mono">NO SLEEP DATA AVAILABLE</p>
            </div>
          )}
          
          <div className="flex justify-center mt-4">
            <div className="flex items-center mr-4">
              <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
              <span className="text-xs text-cyan-600 font-mono">TOTAL SLEEP</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-800 rounded mr-2"></div>
              <span className="text-xs text-cyan-600 font-mono">DEEP SLEEP (ESTIMATED)</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional Health Metrics */}
      <div className="mt-8 bg-gray-900 border border-cyan-800 rounded-lg p-6">
        <h3 className="text-lg font-mono text-cyan-300 mb-4">ADVANCED BIOMETRICS</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* VO2 Max */}
          <div className="bg-gray-950 border border-cyan-900 p-4 rounded">
            <div className="flex items-center mb-2">
              <TrendingUp size={18} className="text-cyan-500 mr-2" />
              <h4 className="text-sm font-mono text-cyan-300">VO2 MAX</h4>
            </div>
            
            <p className="text-2xl font-bold text-cyan-300 font-mono mb-2">
              {latestVo2max ? latestVo2max.value.toFixed(1) : '--'}
            </p>
            
            {latestVo2max && (
              <div className="w-full bg-gray-800 h-2 rounded-full">
                <div 
                  className="bg-cyan-500 h-2 rounded-full"
                  style={{ width: `${Math.min((latestVo2max.value / 60) * 100, 100)}%` }}
                ></div>
              </div>
            )}
            
            <p className="text-xs text-cyan-600 font-mono mt-2">
              {latestVo2max ? formatFitnessLevel(latestVo2max.value) : 'NO DATA'}
            </p>
          </div>
          
          {/* Resting Heart Rate */}
          <div className="bg-gray-950 border border-cyan-900 p-4 rounded">
            <div className="flex items-center mb-2">
              <Heart size={18} className="text-red-500 mr-2" />
              <h4 className="text-sm font-mono text-cyan-300">RESTING HEART RATE</h4>
            </div>
            
            <p className="text-2xl font-bold text-cyan-300 font-mono mb-2">
              {calculateRestingHeartRate(healthData?.heartRate) || '--'} <span className="text-sm">BPM</span>
            </p>
            
            {healthData?.heartRate?.length > 0 && (
              <div className="w-full bg-gray-800 h-2 rounded-full">
                <div 
                  className="bg-red-500 h-2 rounded-full"
                  style={{ 
                    width: `${Math.min(100 - ((calculateRestingHeartRate(healthData.heartRate) - 40) / 60) * 100, 100)}%` 
                  }}
                ></div>
              </div>
            )}
            
            <p className="text-xs text-cyan-600 font-mono mt-2">
              {healthData?.heartRate?.length > 0 ? 'OPTIMAL RANGE: 40-60 BPM' : 'NO DATA'}
            </p>
          </div>
          
          {/* Heart Rate Variability (Estimated) */}
          <div className="bg-gray-950 border border-cyan-900 p-4 rounded">
            <div className="flex items-center mb-2">
              <Activity size={18} className="text-yellow-500 mr-2" />
              <h4 className="text-sm font-mono text-cyan-300">RECOVERY SCORE</h4>
            </div>
            
            <p className="text-2xl font-bold text-cyan-300 font-mono mb-2">
              {calculateRecoveryScore(healthData) || '--'}%
            </p>
            
            {calculateRecoveryScore(healthData) && (
              <div className="w-full bg-gray-800 h-2 rounded-full">
                <div 
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${calculateRecoveryScore(healthData)}%` }}
                ></div>
              </div>
            )}
            
            <p className="text-xs text-cyan-600 font-mono mt-2">
              {calculateRecoveryScore(healthData) ? formatRecoveryLevel(calculateRecoveryScore(healthData)) : 'NO DATA'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function formatFitnessLevel(vo2max) {
  if (vo2max > 55) return 'SUPERIOR CARDIO FITNESS';
  if (vo2max > 45) return 'EXCELLENT CARDIO FITNESS';
  if (vo2max > 35) return 'GOOD CARDIO FITNESS';
  if (vo2max > 25) return 'AVERAGE CARDIO FITNESS';
  return 'BELOW AVERAGE CARDIO FITNESS';
}

function calculateRestingHeartRate(heartRateData) {
  if (!heartRateData || heartRateData.length === 0) return null;
  
  // Get the lowest 5th percentile of heart rate readings
  const sortedHR = [...heartRateData].sort((a, b) => a.value - b.value);
  const percentile5Index = Math.floor(sortedHR.length * 0.05);
  const lowestHRs = sortedHR.slice(0, percentile5Index + 1);
  
  // Calculate average of the lowest heart rates
  return Math.round(lowestHRs.reduce((sum, item) => sum + item.value, 0) / lowestHRs.length);
}

function calculateRecoveryScore(healthData) {
  if (!healthData || !healthData.heartRate || !healthData.sleep) return null;
  
  // This is a simplified algorithm - in real life you'd use HRV, sleep quality, and other factors
  const restingHR = calculateRestingHeartRate(healthData.heartRate);
  
  if (!restingHR) return null;
  
  // Get latest sleep duration
  const latestSleep = healthData.sleep.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  if (!latestSleep) return null;
  
  // Calculate recovery score based on resting HR and sleep duration
  // Lower resting HR and more sleep = better recovery
  const hrScore = Math.max(0, 100 - ((restingHR - 40) * 2));
  const sleepScore = Math.min(100, (latestSleep.value / 8) * 100);
  
  return Math.round((hrScore * 0.6) + (sleepScore * 0.4));
}

function formatRecoveryLevel(score) {
  if (score > 85) return 'OPTIMAL RECOVERY';
  if (score > 70) return 'GOOD RECOVERY';
  if (score > 50) return 'MODERATE RECOVERY';
  return 'RECOVERY NEEDED';
}