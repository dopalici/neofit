// src/components/dashboard/EnhancementMetrics.jsx
import React, { useEffect, useState } from 'react';
import { Heart, Zap, Shield, Droplet } from 'lucide-react';

export default function EnhancementMetrics({ healthData }) {
  const [metrics, setMetrics] = useState({
    cardioEfficiency: { value: 62, level: "OPTIMAL", max: 100 },
    oxygenUtilization: { value: 48.3, level: "GOOD", max: 60 },
    forceOutput: { score: 78, level: "ADVANCED", max: 100 },
    enduranceMatrix: { score: 82, level: "SUPERIOR", max: 100 }
  });

  useEffect(() => {
    // Update metrics whenever health data changes
    if (healthData && healthData.enhancementMetrics) {
      // Use the metrics directly from the processed health data
      setMetrics(healthData.enhancementMetrics);
    } else if (healthData) {
      // Calculate metrics from raw health data
      calculateMetrics(healthData);
    }
  }, [healthData]);
  
  // Calculate metrics from raw health data if not pre-calculated
  const calculateMetrics = (data) => {
    const newMetrics = {
      cardioEfficiency: calculateCardioEfficiency(data),
      oxygenUtilization: calculateOxygenUtilization(data),
      forceOutput: calculateForceOutput(data),
      enduranceMatrix: calculateEnduranceMatrix(data)
    };
    
    setMetrics(newMetrics);
  };
  
  // Calculate cardio efficiency (based on heart rate metrics)
  const calculateCardioEfficiency = (data) => {
    if (!data || !data.heartRate) {
      return { value: 62, level: "OPTIMAL", max: 100 };
    }
    
    // Use resting heart rate as the primary indicator of cardiac efficiency
    const restingHR = data.heartRate.resting || data.heartRate.min || data.heartRate.current;
    
    // Low resting heart rate indicates better cardio efficiency
    // Elite athletes: 40-60 bpm
    // Good fitness: 60-70 bpm
    // Average: 70-80 bpm
    // Below average: 80+ bpm
    
    let level = "OPTIMAL";
    if (restingHR <= 60) {
      level = "OPTIMAL";
    } else if (restingHR <= 70) {
      level = "GOOD";
    } else if (restingHR <= 80) {
      level = "MODERATE";
    } else {
      level = "SUBOPTIMAL";
    }
    
    return {
      value: restingHR,
      level,
      max: 100
    };
  };
  
  // Calculate oxygen utilization (based on VO2Max)
  const calculateOxygenUtilization = (data) => {
    if (!data || !data.vo2Max) {
      return { value: 48.3, level: "GOOD", max: 60 };
    }
    
    const vo2Max = data.vo2Max.current;
    
    // VO2Max level interpretation
    // (simplified - would ideally adjust by age and gender)
    // Superior: 50+
    // Excellent: 45-49.9
    // Good: 40-44.9
    // Fair: 35-39.9
    // Poor: <35
    
    let level = "GOOD";
    if (vo2Max >= 50) {
      level = "SUPERIOR";
    } else if (vo2Max >= 45) {
      level = "EXCELLENT";
    } else if (vo2Max >= 40) {
      level = "GOOD";
    } else if (vo2Max >= 35) {
      level = "FAIR";
    } else {
      level = "DEVELOPING";
    }
    
    return {
      value: vo2Max,
      level,
      max: 60 // Professional athletes can reach 70-80+ but 60 is excellent
    };
  };
  
  // Calculate force output (using workout data and weight metrics)
  const calculateForceOutput = (data) => {
    if (!data || !data.workouts) {
      return { score: 78, level: "ADVANCED", max: 100 };
    }
    
    // This should come from detailed strength metrics, but we'll use a placeholder
    // In a real app, this would use strength-to-weight ratios from tracked workouts
    const score = 78;
    
    let level = "ADVANCED";
    if (score >= 85) {
      level = "SUPERIOR";
    } else if (score >= 70) {
      level = "ADVANCED";
    } else if (score >= 50) {
      level = "INTERMEDIATE";
    } else if (score >= 30) {
      level = "BEGINNER";
    } else {
      level = "NOVICE";
    }
    
    return {
      score,
      level,
      max: 100
    };
  };
  
  // Calculate endurance matrix (cardio capacity)
  const calculateEnduranceMatrix = (data) => {
    if (!data || (!data.workouts && !data.vo2Max)) {
      return { score: 82, level: "SUPERIOR", max: 100 };
    }
    
    // This should use workout history, VO2Max, and recovery patterns
    // In a real app, this would analyze cardio workout endurance and recovery
    const score = 82;
    
    let level = "SUPERIOR";
    if (score >= 85) {
      level = "SUPERIOR";
    } else if (score >= 70) {
      level = "EXCELLENT";
    } else if (score >= 55) {
      level = "GOOD";
    } else if (score >= 40) {
      level = "FAIR";
    } else {
      level = "DEVELOPING";
    }
    
    return {
      score,
      level,
      max: 100
    };
  };
  
  // Function to generate progress bar width percentage
  const calculateProgress = (metric) => {
    if (metric.value && metric.max) {
      // For metrics with value/max
      return (metric.value / metric.max) * 100;
    } else if (metric.score && metric.max) {
      // For metrics with score/max
      return (metric.score / metric.max) * 100;
    }
    return 50; // Default fallback
  };
  
  // Function to determine color based on level
  const getLevelColor = (level) => {
    switch(level) {
      case "SUPERIOR":
      case "OPTIMAL":
        return "bg-cyan-500";
      case "EXCELLENT":
      case "ADVANCED":
      case "GOOD":
        return "bg-green-500";
      case "INTERMEDIATE":
      case "FAIR":
      case "MODERATE":
        return "bg-yellow-500";
      case "SUBOPTIMAL":
      case "BEGINNER":
      case "DEVELOPING":
        return "bg-orange-500";
      case "NOVICE":
      case "POOR":
        return "bg-red-500";
      default:
        return "bg-cyan-500";
    }
  };
  
  // Function to generate metric description tooltip
  const getMetricDescription = (metricName) => {
    switch(metricName) {
      case 'cardioEfficiency':
        return "CARDIAC EFFICIENCY measures how effectively your heart pumps blood. Lower resting heart rate indicates greater efficiency. Elite athletes typically have resting heart rates of 40-60 BPM.";
      case 'oxygenUtilization':
        return "OXYGEN UTILIZATION (VO2MAX) represents the maximum amount of oxygen your body can utilize during intense exercise. It's a key indicator of aerobic fitness and endurance capacity.";
      case 'forceOutput':
        return "FORCE OUTPUT quantifies your muscle strength relative to body weight. It incorporates factors like strength training frequency, volume, and intensity to measure muscle power generation.";
      case 'enduranceMatrix':
        return "ENDURANCE MATRIX evaluates your sustainable exercise capacity. It combines cardiorespiratory fitness, workout duration, and recovery metrics to determine aerobic stamina.";
      default:
        return "";
    }
  };

  return (
    <div className="bg-gray-900 border border-cyan-800 rounded shadow-lg shadow-cyan-900/20 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-mono text-cyan-300">ENHANCEMENT METRICS</h2>
          <button className="text-cyan-600 text-xs font-mono hover:text-cyan-400">TEMPORAL ANALYSIS</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Cardiac Efficiency Metric */}
          <div className="bg-gray-950 border border-cyan-900 p-4 rounded relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/0 to-cyan-900/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center mb-1">
              <Heart size={16} className="text-red-500 mr-1" />
              <p className="text-xs text-cyan-600 font-mono">CARDIAC EFFICIENCY</p>
            </div>
            <p className="text-xl font-bold text-cyan-300 font-mono">{metrics.cardioEfficiency.value} bpm</p>
            <div className="flex items-center justify-between mt-1">
              <div className="h-1 w-16 bg-gray-800 rounded-full">
                <div 
                  className={`h-1 rounded-full ${getLevelColor(metrics.cardioEfficiency.level)}`}
                  style={{ width: `${calculateProgress(metrics.cardioEfficiency)}%` }}
                ></div>
              </div>
              <p className="text-xs text-cyan-600 ml-2 font-mono">{metrics.cardioEfficiency.level}</p>
            </div>
            {/* Tooltip */}
            <div className="absolute inset-0 bg-gray-950/95 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity p-4 text-xs text-cyan-400 font-mono text-center">
              {getMetricDescription('cardioEfficiency')}
            </div>
          </div>
          
          {/* Oxygen Utilization Metric */}
          <div className="bg-gray-950 border border-cyan-900 p-4 rounded relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/0 to-cyan-900/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center mb-1">
              <Zap size={16} className="text-yellow-500 mr-1" />
              <p className="text-xs text-cyan-600 font-mono">OXYGEN UTILIZATION</p>
            </div>
            <p className="text-xl font-bold text-cyan-300 font-mono">{metrics.oxygenUtilization.value}</p>
            <div className="flex items-center justify-between mt-1">
              <div className="h-1 w-16 bg-gray-800 rounded-full">
                <div 
                  className={`h-1 rounded-full ${getLevelColor(metrics.oxygenUtilization.level)}`}
                  style={{ width: `${calculateProgress(metrics.oxygenUtilization)}%` }}
                ></div>
              </div>
              <p className="text-xs text-green-500 ml-2 font-mono">{metrics.oxygenUtilization.level}</p>
            </div>
            {/* Tooltip */}
            <div className="absolute inset-0 bg-gray-950/95 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity p-4 text-xs text-cyan-400 font-mono text-center">
              {getMetricDescription('oxygenUtilization')}
            </div>
          </div>
          
          {/* Force Output Metric */}
          <div className="bg-gray-950 border border-cyan-900 p-4 rounded relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/0 to-cyan-900/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center mb-1">
              <Shield size={16} className="text-blue-500 mr-1" />
              <p className="text-xs text-cyan-600 font-mono">FORCE OUTPUT</p>
            </div>
            <p className="text-xl font-bold text-cyan-300 font-mono">
              {metrics.forceOutput.score}<span className="text-xs">/100</span>
            </p>
            <div className="flex items-center justify-between mt-1">
              <div className="h-1 w-16 bg-gray-800 rounded-full">
                <div 
                  className={`h-1 rounded-full ${getLevelColor(metrics.forceOutput.level)}`}
                  style={{ width: `${calculateProgress(metrics.forceOutput)}%` }}
                ></div>
              </div>
              <p className="text-xs text-yellow-500 ml-2 font-mono">{metrics.forceOutput.level}</p>
            </div>
            {/* Tooltip */}
            <div className="absolute inset-0 bg-gray-950/95 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity p-4 text-xs text-cyan-400 font-mono text-center">
              {getMetricDescription('forceOutput')}
            </div>
          </div>
          
          {/* Endurance Matrix Metric */}
          <div className="bg-gray-950 border border-cyan-900 p-4 rounded relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/0 to-cyan-900/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center mb-1">
              <Droplet size={16} className="text-blue-500 mr-1" />
              <p className="text-xs text-cyan-600 font-mono">ENDURANCE MATRIX</p>
            </div>
            <p className="text-xl font-bold text-cyan-300 font-mono">
              {metrics.enduranceMatrix.score}<span className="text-xs">/100</span>
            </p>
            <div className="flex items-center justify-between mt-1">
              <div className="h-1 w-16 bg-gray-800 rounded-full">
                <div 
                  className={`h-1 rounded-full ${getLevelColor(metrics.enduranceMatrix.level)}`}
                  style={{ width: `${calculateProgress(metrics.enduranceMatrix)}%` }}
                ></div>
              </div>
              <p className="text-xs text-green-500 ml-2 font-mono">{metrics.enduranceMatrix.level}</p>
            </div>
            {/* Tooltip */}
            <div className="absolute inset-0 bg-gray-950/95 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity p-4 text-xs text-cyan-400 font-mono text-center">
              {getMetricDescription('enduranceMatrix')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}