// src/components/dashboard/SleepAnalysis.jsx
import React, { useState, useEffect } from 'react';
import { format, parseISO, isValid, subDays } from 'date-fns';
import { Moon, TrendingUp, Clock, ArrowUp, ArrowDown, Brain, Zap, Activity, BarChart } from 'lucide-react';

export default function SleepAnalysis({ sleepData }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [processedData, setProcessedData] = useState({
    lastNight: '0h 0m',
    deepSleep: '0h 0m',
    rem: '0h 0m',
    lightSleep: '0h 0m',
    awake: '0h 0m',
    efficiency: 0,
    recentData: [],
    trend: 0,
    average: 0,
    sleepDebt: 0,
    cognitiveImpact: 0,
    recoveryStatus: 'unknown',
    qualityScore: 0,
    sleepStagesPercentage: {
      deep: 0,
      rem: 0,
      light: 0,
      awake: 0
    },
    monthlySleepTrend: []
  });

  // Process raw sleep data whenever it changes
  useEffect(() => {
    if (!sleepData || !Array.isArray(sleepData.data)) {
      // Use fallback if no real data
      setProcessedData({
        lastNight: sleepData?.lastNight || '0h 0m',
        deepSleep: sleepData?.deepSleep || '0h 0m',
        rem: sleepData?.rem || '0h 0m',
        lightSleep: sleepData?.lightSleep || '0h 0m',
        awake: sleepData?.awake || '0h 0m',
        efficiency: sleepData?.efficiency || 0,
        recentData: [],
        trend: 0,
        average: 0,
        sleepDebt: 0,
        cognitiveImpact: 0,
        recoveryStatus: 'unknown',
        qualityScore: 0,
        sleepStagesPercentage: {
          deep: 0,
          rem: 0,
          light: 0,
          awake: 0
        },
        monthlySleepTrend: []
      });
      return;
    }

    // Create a safe copy of the data
    const rawData = [...sleepData.data];
    
    // Validate and process each entry
    const validatedData = rawData.filter(entry => {
      // Check for required fields
      if (!entry || !entry.date || entry.value === undefined || entry.value === null) {
        return false;
      }
      
      // Validate date
      try {
        const date = parseISO(entry.date);
        if (!isValid(date)) return false;
      } catch (e) {
        return false;
      }
      
      // Validate value is a number
      const value = parseFloat(entry.value);
      return !isNaN(value);
    });
    
    // Sort by date (newest first)
    const sortedData = validatedData.sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
    
    // Take recent entries for trend analysis (last 7 days)
    const recentEntries = sortedData.slice(0, 7);
    
    // Take entries for monthly trend (last 30 days)
    const monthlyEntries = sortedData.slice(0, 30);
    
    // Generate the last 30 days if we don't have enough data
    const monthlyTrend = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), i);
      const matchingEntry = sortedData.find(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getDate() === date.getDate() && 
               entryDate.getMonth() === date.getMonth();
      });
      
      return {
        date: format(date, 'yyyy-MM-dd'),
        value: matchingEntry ? parseFloat(matchingEntry.value) : null
      };
    }).reverse();
    
    // Calculate average sleep time
    const totalSleep = recentEntries.reduce((sum, entry) => {
      return sum + parseFloat(entry.value);
    }, 0);
    
    const avgSleep = recentEntries.length > 0 ? totalSleep / recentEntries.length : 0;
    
    // Calculate trend (positive or negative vs previous week)
    let trend = 0;
    if (recentEntries.length >= 2) {
      // Compare most recent average (last 3 entries) to previous period (next 3 entries)
      const recentAvg = recentEntries.slice(0, 3).reduce((sum, entry) => sum + parseFloat(entry.value), 0) / 3;
      const prevAvg = recentEntries.slice(3, 6).reduce((sum, entry) => sum + parseFloat(entry.value), 0) / 3;
      
      trend = recentAvg - prevAvg;
    }
    
    // Format duration in hours and minutes
    const formatDuration = (hours) => {
      if (hours === undefined || hours === null || isNaN(hours)) return '0h 0m';
      
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      
      return `${h}h ${m}m`;
    };
    
    // Process sleep stages
    const lastSleep = sortedData[0] || { value: 0 };
    const totalSleepHours = parseFloat(lastSleep.value);
    
    // Estimate all sleep stages if not provided
    let deepSleepHours = 0;
    let remSleepHours = 0;
    let lightSleepHours = 0;
    let awakeSleepHours = 0;
    
    // Try to find sleep stage data
    const sleepStages = sortedData.filter(entry => entry.category);
    
    if (sleepStages.length > 0) {
      // Extract sleep stages if available
      const deepSleepEntries = sleepStages.filter(entry => 
        entry.category && entry.category.toLowerCase().includes('deep'));
        
      const remSleepEntries = sleepStages.filter(entry => 
        entry.category && entry.category.toLowerCase().includes('rem'));
      
      const lightSleepEntries = sleepStages.filter(entry => 
        entry.category && entry.category.toLowerCase().includes('light'));
      
      const awakeSleepEntries = sleepStages.filter(entry => 
        entry.category && entry.category.toLowerCase().includes('awake'));
      
      if (deepSleepEntries.length > 0) {
        deepSleepHours = deepSleepEntries.reduce((sum, entry) => sum + parseFloat(entry.value), 0) / deepSleepEntries.length;
      } else {
        // Estimate deep sleep as 20% of total sleep
        deepSleepHours = totalSleepHours * 0.2;
      }
      
      if (remSleepEntries.length > 0) {
        remSleepHours = remSleepEntries.reduce((sum, entry) => sum + parseFloat(entry.value), 0) / remSleepEntries.length;
      } else {
        // Estimate REM sleep as 25% of total sleep
        remSleepHours = totalSleepHours * 0.25;
      }
      
      if (lightSleepEntries.length > 0) {
        lightSleepHours = lightSleepEntries.reduce((sum, entry) => sum + parseFloat(entry.value), 0) / lightSleepEntries.length;
      } else {
        // Estimate light sleep as 50% of total sleep
        lightSleepHours = totalSleepHours * 0.5;
      }
      
      if (awakeSleepEntries.length > 0) {
        awakeSleepHours = awakeSleepEntries.reduce((sum, entry) => sum + parseFloat(entry.value), 0) / awakeSleepEntries.length;
      } else {
        // Estimate awake time as 5% of total sleep
        awakeSleepHours = totalSleepHours * 0.05;
      }
    } else {
      // No detailed sleep stage data, use estimates
      deepSleepHours = totalSleepHours * 0.2;
      remSleepHours = totalSleepHours * 0.25;
      lightSleepHours = totalSleepHours * 0.5;
      awakeSleepHours = totalSleepHours * 0.05;
    }
    
    // Calculate percentages for visualization
    const totalTrackedSleep = deepSleepHours + remSleepHours + lightSleepHours + awakeSleepHours;
    
    const sleepStagesPercentage = {
      deep: Math.round((deepSleepHours / totalTrackedSleep) * 100) || 0,
      rem: Math.round((remSleepHours / totalTrackedSleep) * 100) || 0,
      light: Math.round((lightSleepHours / totalTrackedSleep) * 100) || 0,
      awake: Math.round((awakeSleepHours / totalTrackedSleep) * 100) || 0
    };
    
    // Calculate sleep efficiency
    const efficiency = Math.min(100, Math.round(
      (totalSleepHours >= 7 ? 90 : 70) + 
      (deepSleepHours / totalSleepHours * 100)
    ));
    
    // Calculate sleep debt (relative to 8 hours optimal)
    const sleepDebt = Math.max(0, (8 * 7) - recentEntries.reduce((sum, entry) => 
      sum + parseFloat(entry.value), 0));
    
    // Calculate cognitive impact score (0-100)
    // Formula: 
    // - Base on average sleep (lower than 7 hours reduces score)
    // - Adjust by sleep efficiency
    // - Adjust by deep sleep percentage (higher is better)
    // - Adjust by REM sleep percentage (higher is better)
    const cognitiveBaseScore = Math.min(100, (avgSleep / 8) * 100);
    const efficiencyFactor = efficiency / 100;
    const deepSleepFactor = sleepStagesPercentage.deep >= 20 ? 1.1 : 0.9;
    const remSleepFactor = sleepStagesPercentage.rem >= 20 ? 1.1 : 0.9;
    
    const cognitiveImpact = Math.min(100, Math.round(
      cognitiveBaseScore * efficiencyFactor * deepSleepFactor * remSleepFactor
    ));
    
    // Calculate overall quality score (0-100)
    const qualityScore = Math.round((
      (efficiency * 0.3) + 
      (cognitiveImpact * 0.4) + 
      (Math.min(100, (avgSleep / 8) * 100) * 0.3)
    ));
    
    // Determine recovery status
    let recoveryStatus = 'unknown';
    if (qualityScore >= 80) recoveryStatus = 'optimal';
    else if (qualityScore >= 60) recoveryStatus = 'adequate';
    else if (qualityScore >= 40) recoveryStatus = 'compromised';
    else recoveryStatus = 'critical';
    
    // Update processed data
    setProcessedData({
      lastNight: formatDuration(totalSleepHours),
      deepSleep: formatDuration(deepSleepHours),
      rem: formatDuration(remSleepHours),
      lightSleep: formatDuration(lightSleepHours),
      awake: formatDuration(awakeSleepHours),
      efficiency: efficiency,
      recentData: recentEntries,
      trend: trend,
      average: avgSleep,
      sleepDebt: sleepDebt,
      cognitiveImpact: cognitiveImpact,
      recoveryStatus: recoveryStatus,
      qualityScore: qualityScore,
      sleepStagesPercentage,
      monthlySleepTrend: monthlyTrend
    });
  }, [sleepData]);

  // Function to determine sleep quality message
  const getSleepQualityMessage = () => {
    const hours = parseFloat(processedData.lastNight.split('h')[0]);
    
    if (hours < 5) return "INSUFFICIENT SLEEP - RECOVERY COMPROMISED";
    if (hours < 6) return "SUBOPTIMAL SLEEP - CONSIDER EXTENDING";
    if (hours < 7) return "ADEQUATE SLEEP - ROOM FOR IMPROVEMENT";
    if (hours < 8) return "OPTIMAL SLEEP DURATION - GOOD RECOVERY";
    return "EXCELLENT SLEEP DURATION - PEAK RECOVERY";
  };
  
  // Function to render performance impact message
  const getPerformanceImpact = () => {
    const score = processedData.cognitiveImpact;
    
    if (score < 40) return "SEVERELY IMPAIRED - HIGH RISK FOR ERRORS";
    if (score < 60) return "SIGNIFICANTLY IMPAIRED - REDUCED PROCESSING SPEED";
    if (score < 75) return "MODERATELY IMPAIRED - DECREASED ATTENTION SPAN";
    if (score < 90) return "SLIGHTLY IMPAIRED - SUBTLE COGNITIVE EFFECTS";
    return "OPTIMAL FUNCTION - PEAK COGNITIVE PERFORMANCE";
  };

  return (
    <div className="bg-gray-900 border border-cyan-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-mono text-cyan-300 flex items-center">
          <Moon size={20} className="text-indigo-400 mr-2" />
          SLEEP ANALYSIS
        </h3>
        <div className="text-xs text-cyan-600 font-mono flex items-center">
          <Clock size={14} className="mr-1" />
          RECOVERY METRIC
        </div>
      </div>
      
      {/* Tabs navigation */}
      <div className="flex mb-4 border-b border-cyan-900">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 font-mono text-xs ${
            activeTab === 'summary' 
              ? 'text-cyan-300 border-b-2 border-cyan-500' 
              : 'text-cyan-600 hover:text-cyan-400'
          }`}
        >
          OVERVIEW
        </button>
        <button
          onClick={() => setActiveTab('stages')}
          className={`px-4 py-2 font-mono text-xs ${
            activeTab === 'stages' 
              ? 'text-cyan-300 border-b-2 border-cyan-500' 
              : 'text-cyan-600 hover:text-cyan-400'
          }`}
        >
          SLEEP STAGES
        </button>
        <button
          onClick={() => setActiveTab('cognitive')}
          className={`px-4 py-2 font-mono text-xs ${
            activeTab === 'cognitive' 
              ? 'text-cyan-300 border-b-2 border-cyan-500' 
              : 'text-cyan-600 hover:text-cyan-400'
          }`}
        >
          COGNITIVE IMPACT
        </button>
        <button
          onClick={() => setActiveTab('trends')}
          className={`px-4 py-2 font-mono text-xs ${
            activeTab === 'trends' 
              ? 'text-cyan-300 border-b-2 border-cyan-500' 
              : 'text-cyan-600 hover:text-cyan-400'
          }`}
        >
          MONTHLY TRENDS
        </button>
      </div>
      
      {/* Summary/Overview Tab */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left side - Sleep summary */}
          <div>
            <div className="bg-gray-950 border border-cyan-900 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-cyan-400 font-mono">LAST SLEEP SESSION</div>
                <div className="text-xs text-cyan-600 font-mono">
                  {processedData.recentData[0]?.date ? 
                    format(parseISO(processedData.recentData[0].date), 'MMM d') : 
                    'NO DATA'}
                </div>
              </div>
              
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-indigo-900/30 border border-indigo-700 rounded-full flex items-center justify-center mr-4">
                  <p className="text-xl font-bold text-cyan-300 font-mono">{processedData.lastNight}</p>
                </div>
                <div>
                  <div className="text-cyan-300 font-mono font-medium">{getSleepQualityMessage()}</div>
                  <div className="flex items-center mt-1">
                    {processedData.trend > 0 ? (
                      <ArrowUp size={14} className="text-green-500 mr-1" />
                    ) : processedData.trend < 0 ? (
                      <ArrowDown size={14} className="text-red-500 mr-1" />
                    ) : (
                      <TrendingUp size={14} className="text-cyan-500 mr-1" />
                    )}
                    <span className="text-xs text-cyan-600 font-mono">
                      {Math.abs(processedData.trend).toFixed(1)}H {processedData.trend > 0 ? 'INCREASE' : processedData.trend < 0 ? 'DECREASE' : 'STABLE'} VS PREVIOUS WEEK
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xs text-cyan-600 font-mono">EFFICIENCY</div>
                  <div className="text-lg font-bold text-cyan-300 font-mono">{processedData.efficiency}%</div>
                </div>
                <div>
                  <div className="text-xs text-cyan-600 font-mono">DEEP SLEEP</div>
                  <div className="text-lg font-bold text-cyan-300 font-mono">{processedData.deepSleep}</div>
                </div>
                <div>
                  <div className="text-xs text-cyan-600 font-mono">REM SLEEP</div>
                  <div className="text-lg font-bold text-cyan-300 font-mono">{processedData.rem}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-950 border border-cyan-900 rounded-lg p-4">
              <div className="text-sm text-cyan-400 font-mono mb-2">RECOVERY STATUS</div>
              <div className="flex items-center mb-3">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  processedData.recoveryStatus === 'optimal' ? 'bg-green-500' :
                  processedData.recoveryStatus === 'adequate' ? 'bg-cyan-500' :
                  processedData.recoveryStatus === 'compromised' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}></div>
                <div className="text-md font-bold text-cyan-300 font-mono uppercase">
                  {processedData.recoveryStatus === 'optimal' ? 'OPTIMAL RECOVERY' :
                   processedData.recoveryStatus === 'adequate' ? 'ADEQUATE RECOVERY' :
                   processedData.recoveryStatus === 'compromised' ? 'RECOVERY COMPROMISED' :
                   'CRITICAL RECOVERY DEFICIT'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-900/50 border border-cyan-900/50 rounded p-2">
                  <div className="text-xs text-cyan-600 font-mono">QUALITY SCORE</div>
                  <div className="text-lg font-bold text-cyan-300 font-mono">{processedData.qualityScore}/100</div>
                </div>
                <div className="bg-gray-900/50 border border-cyan-900/50 rounded p-2">
                  <div className="text-xs text-cyan-600 font-mono">SLEEP DEBT</div>
                  <div className="text-lg font-bold text-cyan-300 font-mono">{processedData.sleepDebt.toFixed(1)}h</div>
                </div>
              </div>
              
              <div className="text-sm text-cyan-400 font-mono mb-2">SLEEP OPTIMIZATION</div>
              <ul className="space-y-2 text-xs text-cyan-600 font-mono">
                <li className="flex items-start">
                  <div className="w-4 h-4 rounded-full bg-gray-800 flex items-center justify-center mt-0.5 mr-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                  </div>
                  Aim for 7-9 hours of sleep daily for optimal recovery
                </li>
                <li className="flex items-start">
                  <div className="w-4 h-4 rounded-full bg-gray-800 flex items-center justify-center mt-0.5 mr-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                  </div>
                  Maintain consistent sleep and wake times
                </li>
                <li className="flex items-start">
                  <div className="w-4 h-4 rounded-full bg-gray-800 flex items-center justify-center mt-0.5 mr-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                  </div>
                  Deep sleep (20-25% of total) is critical for physical recovery
                </li>
                <li className="flex items-start">
                  <div className="w-4 h-4 rounded-full bg-gray-800 flex items-center justify-center mt-0.5 mr-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                  </div>
                  REM sleep (20-25% of total) supports cognitive function and learning
                </li>
              </ul>
            </div>
          </div>
          
          {/* Right side - Sleep history/chart */}
          <div className="bg-gray-950 border border-cyan-900 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-cyan-400 font-mono">SLEEP HISTORY</div>
              <div className="text-xs text-cyan-600 font-mono">7-DAY TREND</div>
            </div>
            
            {processedData.recentData.length > 0 ? (
              <div className="h-52 relative">
                {/* X-axis labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-cyan-600 font-mono h-6">
                  {processedData.recentData.slice().reverse().map((entry, index) => (
                    <div key={index} className="text-center">
                      {format(parseISO(entry.date), 'EEE')}
                    </div>
                  ))}
                </div>
                
                {/* Y-axis labels */}
                <div className="absolute top-0 bottom-6 left-0 w-6 flex flex-col justify-between text-xs text-cyan-600 font-mono">
                  <div>10h</div>
                  <div>8h</div>
                  <div>6h</div>
                  <div>4h</div>
                  <div>2h</div>
                  <div>0h</div>
                </div>
                
                {/* Chart bars */}
                <div className="absolute left-6 right-0 top-0 bottom-6 flex items-end justify-between">
                  {processedData.recentData.slice().reverse().map((entry, index) => {
                    const sleepValue = parseFloat(entry.value);
                    const heightPercentage = Math.min(100, (sleepValue / 10) * 100);
                    
                    // Color based on sleep quality
                    let barColor;
                    if (sleepValue >= 7) barColor = "bg-green-500";
                    else if (sleepValue >= 6) barColor = "bg-yellow-500";
                    else if (sleepValue >= 5) barColor = "bg-orange-500";
                    else barColor = "bg-red-500";
                    
                    return (
                      <div 
                        key={index} 
                        className="flex-1 flex flex-col justify-end mx-1 group relative"
                      >
                        <div 
                          className={`${barColor} rounded-t-sm w-full relative`}
                          style={{ height: `${heightPercentage}%` }}
                        >
                          {/* Bar label on hover */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-900 px-2 py-1 rounded text-xs text-cyan-400 whitespace-nowrap">
                            {entry.value}h - {format(parseISO(entry.date), 'MMM d')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Optimal range indicator */}
                <div className="absolute left-6 right-0 top-1/4 border-t border-dashed border-green-500/30">
                  <div className="absolute -top-3 right-0 text-xs text-green-500/70 font-mono">
                    OPTIMAL
                  </div>
                </div>
                <div className="absolute left-6 right-0 top-2/5 border-t border-dashed border-yellow-500/30">
                  <div className="absolute -top-3 right-0 text-xs text-yellow-500/70 font-mono">
                    ADEQUATE
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-52 flex items-center justify-center">
                <p className="text-cyan-600 font-mono">NO SLEEP DATA AVAILABLE</p>
                <p className="text-xs text-cyan-600 font-mono mt-2">
                  Sync with Apple Health or add manual sleep entries
                </p>
              </div>
            )}
            
            {/* Average stats */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-gray-900 border border-cyan-900 rounded p-3">
                <div className="text-xs text-cyan-600 font-mono">7-DAY AVERAGE</div>
                <div className="text-lg font-bold text-cyan-300 font-mono">
                  {processedData.average.toFixed(1)}h
                </div>
              </div>
              <div className="bg-gray-900 border border-cyan-900 rounded p-3">
                <div className="text-xs text-cyan-600 font-mono">OPTIMAL NIGHTS</div>
                <div className="text-lg font-bold text-cyan-300 font-mono">
                  {processedData.recentData.filter(entry => parseFloat(entry.value) >= 7).length}/{processedData.recentData.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Sleep Stages Tab */}
      {activeTab === 'stages' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left side - Sleep stage breakdown */}
          <div className="bg-gray-950 border border-cyan-900 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-cyan-400 font-mono">SLEEP STAGE ANALYSIS</div>
              <div className="text-xs text-cyan-600 font-mono">
                {processedData.recentData[0]?.date ? 
                  format(parseISO(processedData.recentData[0].date), 'MMM d') : 
                  'NO DATA'}
              </div>
            </div>
            
            {/* Sleep stage percentages visualization */}
            <div className="mb-4">
              <div className="w-full h-8 flex rounded-md overflow-hidden mb-2">
                <div 
                  className="bg-indigo-700" 
                  style={{ width: `${processedData.sleepStagesPercentage.deep}%` }}
                  title={`Deep Sleep: ${processedData.sleepStagesPercentage.deep}%`}
                ></div>
                <div 
                  className="bg-purple-600" 
                  style={{ width: `${processedData.sleepStagesPercentage.rem}%` }}
                  title={`REM Sleep: ${processedData.sleepStagesPercentage.rem}%`}
                ></div>
                <div 
                  className="bg-cyan-600" 
                  style={{ width: `${processedData.sleepStagesPercentage.light}%` }}
                  title={`Light Sleep: ${processedData.sleepStagesPercentage.light}%`}
                ></div>
                <div 
                  className="bg-gray-600" 
                  style={{ width: `${processedData.sleepStagesPercentage.awake}%` }}
                  title={`Awake: ${processedData.sleepStagesPercentage.awake}%`}
                ></div>
              </div>
              
              {/* Legend */}
              <div className="grid grid-cols-2 gap-y-2 text-xs text-cyan-600 font-mono">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-indigo-700 mr-2"></div>
                  <span>DEEP: {processedData.sleepStagesPercentage.deep}% ({processedData.deepSleep})</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-600 mr-2"></div>
                  <span>REM: {processedData.sleepStagesPercentage.rem}% ({processedData.rem})</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-cyan-600 mr-2"></div>
                  <span>LIGHT: {processedData.sleepStagesPercentage.light}% ({processedData.lightSleep})</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-600 mr-2"></div>
                  <span>AWAKE: {processedData.sleepStagesPercentage.awake}% ({processedData.awake})</span>
                </div>
              </div>
            </div>
            
            {/* Stage-specific metrics and details */}
            <div className="space-y-4 mt-6">
              <div className="bg-gray-900/50 border border-indigo-900/60 rounded-lg p-3">
                <div className="text-sm text-indigo-400 font-mono flex items-center mb-1">
                  <div className="w-3 h-3 bg-indigo-700 mr-2 rounded-full"></div>
                  DEEP SLEEP
                </div>
                <p className="text-xs text-cyan-600 font-mono">
                  Deep sleep is vital for physical recovery, hormone regulation, and immune function. 
                  <span className={`ml-1 ${processedData.sleepStagesPercentage.deep >= 20 ? 'text-green-500' : 'text-yellow-500'}`}>
                    {processedData.sleepStagesPercentage.deep >= 20 ? 'Your deep sleep percentage is optimal.' : 'Your deep sleep percentage could be improved.'}
                  </span>
                </p>
              </div>
              
              <div className="bg-gray-900/50 border border-purple-900/60 rounded-lg p-3">
                <div className="text-sm text-purple-400 font-mono flex items-center mb-1">
                  <div className="w-3 h-3 bg-purple-600 mr-2 rounded-full"></div>
                  REM SLEEP
                </div>
                <p className="text-xs text-cyan-600 font-mono">
                  REM sleep is essential for cognitive function, memory consolidation, and emotional regulation.
                  <span className={`ml-1 ${processedData.sleepStagesPercentage.rem >= 20 ? 'text-green-500' : 'text-yellow-500'}`}>
                    {processedData.sleepStagesPercentage.rem >= 20 ? 'Your REM sleep percentage is optimal.' : 'Your REM sleep percentage could be improved.'}
                  </span>
                </p>
              </div>
              
              <div className="bg-gray-900/50 border border-cyan-900/60 rounded-lg p-3">
                <div className="text-sm text-cyan-400 font-mono flex items-center mb-1">
                  <div className="w-3 h-3 bg-cyan-600 mr-2 rounded-full"></div>
                  LIGHT SLEEP
                </div>
                <p className="text-xs text-cyan-600 font-mono">
                  Light sleep serves as a transition between sleep stages and helps maintain overall sleep architecture.
                  <span className={`ml-1 ${
                    processedData.sleepStagesPercentage.light >= 45 && processedData.sleepStagesPercentage.light <= 60 
                      ? 'text-green-500' : 'text-yellow-500'
                  }`}>
                    {processedData.sleepStagesPercentage.light >= 45 && processedData.sleepStagesPercentage.light <= 60 
                      ? 'Your light sleep percentage is balanced.' 
                      : 'Your light sleep percentage is outside of the optimal range.'}
                  </span>
                </p>
              </div>
            </div>
          </div>
          
          {/* Right side - Sleep cycle visualization and analysis */}
          <div className="bg-gray-950 border border-cyan-900 rounded-lg p-4">
            <div className="text-sm text-cyan-400 font-mono mb-4">SLEEP QUALITY INSIGHTS</div>
            
            <div className="flex mb-4">
              <div className="w-20 h-20 bg-gray-900 rounded-full flex flex-col items-center justify-center mr-4 border-4 
                border-indigo-500 
                ${processedData.efficiency >= 85 ? 'border-green-500' : 
                  processedData.efficiency >= 70 ? 'border-yellow-500' : 
                  'border-red-500'}"
              >
                <span className="text-xl font-bold text-cyan-300 font-mono">{processedData.efficiency}%</span>
                <span className="text-xs text-cyan-600 font-mono">EFFICIENCY</span>
              </div>
              
              <div>
                <h4 className="text-cyan-300 font-mono font-medium mb-1">SLEEP EFFICIENCY</h4>
                <p className="text-xs text-cyan-600 font-mono mb-2">
                  Sleep efficiency measures the percentage of time in bed actually spent sleeping. 
                  {processedData.efficiency >= 85 ? 
                    ' Your efficiency is excellent.' : 
                    processedData.efficiency >= 70 ? 
                    ' Your efficiency is adequate but could be improved.' : 
                    ' Your efficiency is low, indicating disrupted sleep.'}
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="text-sm text-cyan-400 font-mono mb-2">RECOMMENDED IMPROVEMENTS</h4>
              <ul className="space-y-2 text-xs text-cyan-600 font-mono">
                {processedData.sleepStagesPercentage.deep < 20 && (
                  <li className="flex items-start">
                    <div className="w-4 h-4 rounded-full bg-gray-800 flex items-center justify-center mt-0.5 mr-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    </div>
                    Increase deep sleep with regular exercise, especially earlier in the day
                  </li>
                )}
                {processedData.sleepStagesPercentage.rem < 20 && (
                  <li className="flex items-start">
                    <div className="w-4 h-4 rounded-full bg-gray-800 flex items-center justify-center mt-0.5 mr-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    </div>
                    Improve REM sleep by maintaining a consistent sleep schedule and managing stress
                  </li>
                )}
                {processedData.sleepStagesPercentage.awake > 10 && (
                  <li className="flex items-start">
                    <div className="w-4 h-4 rounded-full bg-gray-800 flex items-center justify-center mt-0.5 mr-2">
                      <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                    </div>
                    Reduce awake time by optimizing your sleep environment and avoiding caffeine after noon
                  </li>
                )}
                {processedData.average < 7 && (
                  <li className="flex items-start">
                    <div className="w-4 h-4 rounded-full bg-gray-800 flex items-center justify-center mt-0.5 mr-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                    </div>
                    Prioritize sleep duration by establishing an earlier bedtime
                  </li>
                )}
                <li className="flex items-start">
                  <div className="w-4 h-4 rounded-full bg-gray-800 flex items-center justify-center mt-0.5 mr-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                  Enhance overall sleep quality with a cool, dark, quiet sleeping environment
                </li>
              </ul>
            </div>
            
            <div className="bg-gray-900/40 border border-cyan-900/50 rounded-lg p-3">
              <h4 className="text-sm text-cyan-400 font-mono mb-2">SLEEP STAGE SCIENCE</h4>
              <p className="text-xs text-cyan-600 font-mono leading-relaxed">
                A healthy sleep cycle repeats every 90-110 minutes, cycling through light sleep, deep sleep, and REM sleep.
                Deep sleep is dominant in the first half of your night, while REM increases in the later cycles.
                For optimal physical and cognitive recovery, aim for 4-5 complete sleep cycles each night.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Cognitive Impact Tab */}
      {activeTab === 'cognitive' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left side - Cognitive impact assessment */}
          <div className="bg-gray-950 border border-cyan-900 rounded-lg p-4">
            <div className="text-sm text-cyan-400 font-mono mb-4">COGNITIVE PERFORMANCE ASSESSMENT</div>
            
            <div className="flex mb-4">
              <div className={`w-24 h-24 rounded-full flex flex-col items-center justify-center mr-4 border-4 
                ${processedData.cognitiveImpact >= 80 ? 'border-green-500 bg-green-900/20' : 
                  processedData.cognitiveImpact >= 60 ? 'border-yellow-500 bg-yellow-900/20' : 
                  processedData.cognitiveImpact >= 40 ? 'border-orange-500 bg-orange-900/20' :
                  'border-red-500 bg-red-900/20'}`}
              >
                <span className="text-2xl font-bold text-cyan-300 font-mono">{processedData.cognitiveImpact}</span>
                <span className="text-xs text-cyan-600 font-mono">SCORE</span>
              </div>
              
              <div>
                <h4 className="text-cyan-300 font-mono font-medium mb-1">COGNITIVE IMPACT</h4>
                <p className="text-xs text-cyan-600 font-mono mb-2">
                  Based on your sleep patterns, your cognitive function is currently:
                </p>
                <p className={`text-sm font-mono font-medium mb-1
                  ${processedData.cognitiveImpact >= 80 ? 'text-green-500' : 
                    processedData.cognitiveImpact >= 60 ? 'text-yellow-500' : 
                    processedData.cognitiveImpact >= 40 ? 'text-orange-500' :
                    'text-red-500'}`}
                >
                  {getPerformanceImpact()}
                </p>
              </div>
            </div>
            
            <div className="space-y-3 mt-6">
              <div className="bg-gray-900/50 border border-cyan-900/60 rounded-lg p-3">
                <div className="text-sm text-cyan-400 font-mono flex items-center mb-1">
                  <Brain size={16} className="mr-2 text-purple-400" />
                  AFFECTED COGNITIVE DOMAINS
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className={`text-xs font-mono p-2 rounded border ${
                    processedData.cognitiveImpact < 80 ? 'border-red-500/50 bg-red-900/10 text-red-400' : 
                    'border-green-500/50 bg-green-900/10 text-green-400'
                  }`}>
                    Attention & Focus
                  </div>
                  <div className={`text-xs font-mono p-2 rounded border ${
                    processedData.cognitiveImpact < 70 ? 'border-red-500/50 bg-red-900/10 text-red-400' : 
                    'border-green-500/50 bg-green-900/10 text-green-400'
                  }`}>
                    Decision Making
                  </div>
                  <div className={`text-xs font-mono p-2 rounded border ${
                    processedData.cognitiveImpact < 60 ? 'border-red-500/50 bg-red-900/10 text-red-400' : 
                    'border-green-500/50 bg-green-900/10 text-green-400'
                  }`}>
                    Memory Consolidation
                  </div>
                  <div className={`text-xs font-mono p-2 rounded border ${
                    processedData.cognitiveImpact < 50 ? 'border-red-500/50 bg-red-900/10 text-red-400' : 
                    'border-green-500/50 bg-green-900/10 text-green-400'
                  }`}>
                    Reaction Time
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-900/50 border border-cyan-900/60 rounded-lg p-3">
                <div className="text-sm text-cyan-400 font-mono flex items-center mb-1">
                  <Zap size={16} className="mr-2 text-yellow-400" />
                  PERFORMANCE IMPLICATIONS
                </div>
                <p className="text-xs text-cyan-600 font-mono">
                  {processedData.cognitiveImpact >= 80 ? 
                    'Your sleep quality supports optimal cognitive performance. Expect high levels of focus, effective learning, and good decision-making capabilities.' : 
                    processedData.cognitiveImpact >= 60 ? 
                    'Your cognitive function may be slightly impaired. You might experience occasional lapses in concentration and slightly slower information processing.' : 
                    processedData.cognitiveImpact >= 40 ? 
                    'Your cognitive function is moderately impaired. Expect reduced attention span, impaired memory formation, and diminished problem-solving abilities.' :
                    'Your cognitive function is severely impaired. Decision-making, attention, and reaction time will be significantly compromised. Consider adjusting critical activities.'
                  }
                </p>
              </div>
            </div>
          </div>
          
          {/* Right side - Recommendations and timeline */}
          <div className="bg-gray-950 border border-cyan-900 rounded-lg p-4">
            <div className="text-sm text-cyan-400 font-mono mb-4">COGNITIVE ENHANCEMENT PLAN</div>
            
            {/* Recovery timeline */}
            <div className="mb-6">
              <h4 className="text-xs text-cyan-600 font-mono mb-3">COGNITIVE RECOVERY TIMELINE</h4>
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute left-2.5 top-0 h-full w-0.5 bg-gray-800"></div>
                  <div className="flex items-start mb-1">
                    <div className="w-5 h-5 rounded-full bg-cyan-900 flex items-center justify-center z-10 mr-3">
                      <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                    </div>
                    <div>
                      <p className="text-xs text-cyan-400 font-mono">IMMEDIATE TERM (24 HOURS)</p>
                      <p className="text-2xs text-cyan-600 font-mono">
                        {processedData.cognitiveImpact < 60 ? 
                          "Prioritize an early bedtime tonight to begin repaying sleep debt and rebalancing cognitive function." : 
                          "Maintain current sleep pattern and quality to sustain cognitive performance."}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute left-2.5 top-0 h-full w-0.5 bg-gray-800"></div>
                  <div className="flex items-start mb-1">
                    <div className="w-5 h-5 rounded-full bg-cyan-900 flex items-center justify-center z-10 mr-3">
                      <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                    </div>
                    <div>
                      <p className="text-xs text-cyan-400 font-mono">SHORT TERM (3-7 DAYS)</p>
                      <p className="text-2xs text-cyan-600 font-mono">
                        {processedData.sleepDebt > 5 ? 
                          "Focus on consistent 8-hour sleep sessions to address accumulated sleep debt of " + processedData.sleepDebt.toFixed(1) + " hours." : 
                          "Optimize sleep schedule consistency and environment to improve sleep quality metrics."}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-cyan-900 flex items-center justify-center z-10 mr-3">
                      <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                    </div>
                    <div>
                      <p className="text-xs text-cyan-400 font-mono">LONG TERM (30+ DAYS)</p>
                      <p className="text-2xs text-cyan-600 font-mono">
                        Establish consistent sleep hygiene practices to maintain optimal cognitive function. 
                        Target 85+ efficiency scores and balanced sleep architecture (20%+ deep sleep, 20%+ REM).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recommendations for cognitive enhancement */}
            <div className="bg-gray-900/40 border border-cyan-900/50 rounded-lg p-3">
              <h4 className="text-sm text-cyan-400 font-mono mb-2">COGNITIVE OPTIMIZATION STRATEGIES</h4>
              <ul className="space-y-2 text-xs text-cyan-600 font-mono">
                <li className="flex items-start">
                  <div className="w-4 h-4 rounded-full bg-gray-800 flex items-center justify-center mt-0.5 mr-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  </div>
                  Increase REM sleep by maintaining consistent wake times and reducing alcohol consumption
                </li>
                <li className="flex items-start">
                  <div className="w-4 h-4 rounded-full bg-gray-800 flex items-center justify-center mt-0.5 mr-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  </div>
                  Practice meditation before bed to improve sleep onset and overall sleep quality
                </li>
                <li className="flex items-start">
                  <div className="w-4 h-4 rounded-full bg-gray-800 flex items-center justify-center mt-0.5 mr-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                  Limit blue light exposure 2 hours before bedtime to support natural melatonin production
                </li>
                <li className="flex items-start">
                  <div className="w-4 h-4 rounded-full bg-gray-800 flex items-center justify-center mt-0.5 mr-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  </div>
                  Schedule complex cognitive tasks during your peak alertness hours based on sleep history
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Monthly Trends Tab */}
      {activeTab === 'trends' && (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-gray-950 border border-cyan-900 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-cyan-400 font-mono">30-DAY SLEEP TRENDS</div>
              <div className="text-xs text-cyan-600 font-mono">
                <Activity size={14} className="inline mr-1" />
                PATTERN ANALYSIS
              </div>
            </div>
            
            {/* Monthly trend visualization */}
            <div className="h-64 relative mb-6">
              {/* Y-axis labels */}
              <div className="absolute top-0 bottom-0 left-0 w-6 flex flex-col justify-between text-xs text-cyan-600 font-mono">
                <div>10h</div>
                <div>8h</div>
                <div>6h</div>
                <div>4h</div>
                <div>2h</div>
                <div>0h</div>
              </div>
              
              {/* Chart area */}
              <div className="absolute left-8 right-0 top-0 bottom-0">
                {/* Chart grid */}
                <div className="w-full h-full grid grid-rows-5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-full border-t border-gray-800"></div>
                  ))}
                </div>
                
                {/* Data lines */}
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                  <polyline
                    points={processedData.monthlySleepTrend.map((entry, index) => {
                      const x = (index / (processedData.monthlySleepTrend.length - 1)) * 100;
                      const y = entry.value === null ? null : 100 - Math.min(100, (entry.value / 10) * 100);
                      return entry.value === null ? '' : `${x},${y}`;
                    }).filter(point => point !== '').join(' ')}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="0"
                  />
                </svg>
                
                {/* Data points */}
                <div className="absolute inset-0">
                  {processedData.monthlySleepTrend.map((entry, index) => {
                    if (entry.value === null) return null;
                    
                    const left = `${(index / (processedData.monthlySleepTrend.length - 1)) * 100}%`;
                    const top = `${100 - Math.min(100, (entry.value / 10) * 100)}%`;
                    
                    // Color based on sleep quality
                    let pointColor;
                    if (entry.value >= 7) pointColor = "bg-green-500";
                    else if (entry.value >= 6) pointColor = "bg-yellow-500";
                    else if (entry.value >= 5) pointColor = "bg-orange-500";
                    else pointColor = "bg-red-500";
                    
                    return (
                      <div
                        key={index}
                        className={`absolute w-2 h-2 ${pointColor} rounded-full transform -translate-x-1 -translate-y-1 group`}
                        style={{ left, top }}
                      >
                        <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-gray-900 px-2 py-0.5 rounded text-xs text-cyan-400 whitespace-nowrap z-10">
                          {entry.value}h - {format(parseISO(entry.date), 'MMM d')}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Optimal line */}
                <div className="absolute left-0 right-0" style={{ top: '20%', height: '1px' }}>
                  <div className="w-full border-t border-dashed border-green-500/30"></div>
                  <div className="absolute -top-3 right-0 text-xs text-green-500/70 font-mono">
                    OPTIMAL (8h)
                  </div>
                </div>
                
                {/* Minimum recommended line */}
                <div className="absolute left-0 right-0" style={{ top: '40%', height: '1px' }}>
                  <div className="w-full border-t border-dashed border-yellow-500/30"></div>
                  <div className="absolute -top-3 right-0 text-xs text-yellow-500/70 font-mono">
                    MINIMUM (6h)
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pattern analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900/40 border border-cyan-900/50 rounded-lg p-3">
                <h4 className="text-sm text-cyan-400 font-mono mb-2">SLEEP PATTERN ANALYSIS</h4>
                <p className="text-xs text-cyan-600 font-mono leading-relaxed">
                  {(() => {
                    // Analyze pattern consistency
                    const sleepValues = processedData.monthlySleepTrend
                      .filter(entry => entry.value !== null)
                      .map(entry => entry.value);
                    
                    if (sleepValues.length < 7) {
                      return "Insufficient data for comprehensive pattern analysis. Continue tracking sleep to receive personalized insights.";
                    }
                    
                    // Calculate standard deviation as measure of consistency
                    const avg = sleepValues.reduce((sum, val) => sum + val, 0) / sleepValues.length;
                    const variance = sleepValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / sleepValues.length;
                    const stdDev = Math.sqrt(variance);
                    
                    // Check for weekday/weekend patterns
                    const weekdaySleep = processedData.monthlySleepTrend
                      .filter(entry => {
                        if (entry.value === null) return false;
                        const date = parseISO(entry.date);
                        const day = date.getDay();
                        return day >= 1 && day <= 5; // Monday-Friday
                      })
                      .map(entry => entry.value);
                    
                    const weekendSleep = processedData.monthlySleepTrend
                      .filter(entry => {
                        if (entry.value === null) return false;
                        const date = parseISO(entry.date);
                        const day = date.getDay();
                        return day === 0 || day === 6; // Sunday or Saturday
                      })
                      .map(entry => entry.value);
                    
                    const weekdayAvg = weekdaySleep.length ? 
                      weekdaySleep.reduce((sum, val) => sum + val, 0) / weekdaySleep.length : 0;
                    
                    const weekendAvg = weekendSleep.length ? 
                      weekendSleep.reduce((sum, val) => sum + val, 0) / weekendSleep.length : 0;
                    
                    const weekdayWeekendDiff = Math.abs(weekendAvg - weekdayAvg);
                    
                    // Analyze and return findings
                    let analysis = "";
                    
                    if (stdDev < 0.5) {
                      analysis += "Your sleep duration is highly consistent, which is excellent for your circadian rhythm and sleep quality. ";
                    } else if (stdDev < 1) {
                      analysis += "Your sleep pattern shows moderate consistency. Some variation is normal, but aim to maintain more regular sleep times. ";
                    } else {
                      analysis += "Your sleep pattern shows significant inconsistency, which can disrupt your circadian rhythm and reduce sleep quality. ";
                    }
                    
                    if (weekdayWeekendDiff > 1.5) {
                      analysis += `You show a distinct weekend sleep pattern, sleeping ${(weekendAvg > weekdayAvg ? 'more' : 'less')} on weekends by ${weekdayWeekendDiff.toFixed(1)} hours. This 'social jet lag' can disrupt your biological rhythms.`;
                    } else {
                      analysis += "You maintain relatively consistent sleep patterns throughout the week, which is beneficial for your overall sleep health.";
                    }
                    
                    return analysis;
                  })()}
                </p>
              </div>
              
              <div className="bg-gray-900/40 border border-cyan-900/50 rounded-lg p-3">
                <h4 className="text-sm text-cyan-400 font-mono mb-2">MONTHLY SLEEP METRICS</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-xs text-cyan-600 font-mono">
                    <div className="font-medium text-cyan-400">MONTHLY AVERAGE</div>
                    <div className="text-lg text-cyan-300">
                      {(() => {
                        const values = processedData.monthlySleepTrend
                          .filter(entry => entry.value !== null)
                          .map(entry => entry.value);
                        return values.length 
                          ? (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(1) 
                          : "N/A";
                      })()}h
                    </div>
                  </div>
                  
                  <div className="text-xs text-cyan-600 font-mono">
                    <div className="font-medium text-cyan-400">SLEEP DEBT</div>
                    <div className="text-lg text-cyan-300">{processedData.sleepDebt.toFixed(1)}h</div>
                  </div>
                  
                  <div className="text-xs text-cyan-600 font-mono">
                    <div className="font-medium text-cyan-400">OPTIMAL NIGHTS (≥7h)</div>
                    <div className="text-lg text-cyan-300">
                      {(() => {
                        const totalNights = processedData.monthlySleepTrend
                          .filter(entry => entry.value !== null).length;
                        const optimalNights = processedData.monthlySleepTrend
                          .filter(entry => entry.value !== null && entry.value >= 7).length;
                        return `${optimalNights}/${totalNights} (${totalNights ? Math.round((optimalNights/totalNights)*100) : 0}%)`;
                      })()}
                    </div>
                  </div>
                  
                  <div className="text-xs text-cyan-600 font-mono">
                    <div className="font-medium text-cyan-400">CONSISTENCY SCORE</div>
                    <div className="text-lg text-cyan-300">
                      {(() => {
                        // Calculate consistency score (0-100)
                        const sleepValues = processedData.monthlySleepTrend
                          .filter(entry => entry.value !== null)
                          .map(entry => entry.value);
                        
                        if (sleepValues.length < 7) return "N/A";
                        
                        const avg = sleepValues.reduce((sum, val) => sum + val, 0) / sleepValues.length;
                        const variance = sleepValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / sleepValues.length;
                        const stdDev = Math.sqrt(variance);
                        
                        // Convert stdDev to a score where lower stdDev = higher score
                        // 0.5 stdDev or less = 100, 2.0 stdDev or more = 0
                        const consistencyScore = Math.max(0, Math.min(100, 100 - ((stdDev - 0.5) / 1.5) * 100));
                        return Math.round(consistencyScore);
                      })()}/100
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}