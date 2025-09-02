// src/components/dashboard/EnhancementMetricsPanel.jsx
import React, { useEffect, useState } from 'react';
import { Heart, Zap, Shield, Droplet, Activity, Moon, Utensils, Brain } from 'lucide-react';
import { processEnhancementMetrics } from '../../services/healthDataProcessor';

export default function EnhancementMetricsPanel({ healthData }) {
  const [metrics, setMetrics] = useState({
    individualMetrics: {
      cardiacEfficiency: {
        current: 62,
        status: 'OPTIMAL',
        score: 75
      },
      oxygenUtilization: {
        current: 42.5,
        status: 'ADVANCED',
        score: 68
      },
      forceOutput: {
        current: 78,
        status: 'ADVANCED',
        score: 78
      },
      enduranceMatrix: {
        current: 82,
        status: 'SUPERIOR',
        score: 82
      }
    },
    cardiovascular: {
      restingHeartRate: 55,
      heartRateVariability: 48,
      oxygenSaturation: 98,
      recoveryRate: 32,
      vo2Max: 42,
      cardioLoad: 68,
      overallScore: 85,
      status: 'EXCELLENT'
    },
    sleep: {
      efficiency: 92,
      deepPercent: 22,
      remPercent: 25,
      awakeTime: 0.4,
      totalTime: 7.8,
      recoveryContribution: 88,
      overallScore: 85,
      status: 'OPTIMAL'
    },
    activity: {
      dailySteps: 9240,
      activeMinutes: 45,
      standHours: 12,
      totalCalories: 2450,
      activeCalories: 650,
      basalCalories: 1800,
      overallScore: 72,
      status: 'ACTIVE'
    },
    nutrition: {
      totalCalories: 2200,
      macroRatio: {
        protein: 30,
        carbs: 45,
        fat: 25
      },
      hydration: 2.8,
      overallScore: 80,
      status: 'OPTIMAL'
    },
    trainingStatus: {
      currentLoad: 55,
      loadRatio: 1.1,
      overtraining: false,
      detraining: false,
      optimal: true,
      recommendation: 'MAINTAIN CURRENT LOAD',
      overallScore: 85,
      status: 'OPTIMAL ADAPTATION'
    }
  });

  // Process health data to calculate enhancement metrics
  useEffect(() => {
    if (!healthData) return;
    
    const processedMetrics = processEnhancementMetrics(healthData);
    setMetrics(processedMetrics);
  }, [healthData]);

  // Get status class for color coding
  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case 'SUPERIOR': return 'text-green-500';
      case 'EXCELLENT': return 'text-green-400';
      case 'OPTIMAL': return 'text-cyan-400';
      case 'OPTIMAL ADAPTATION': return 'text-cyan-400';
      case 'PROGRESSIVE LOADING': return 'text-cyan-500';
      case 'ADVANCED': return 'text-yellow-500';
      case 'GOOD': return 'text-yellow-400';
      case 'ACTIVE': return 'text-yellow-400';
      case 'AVERAGE': return 'text-orange-400';
      case 'ADEQUATE': return 'text-orange-400';
      case 'MODERATELY ACTIVE': return 'text-orange-400';
      case 'FAIR': return 'text-orange-300';
      case 'MAINTENANCE': return 'text-orange-300';
      case 'NEEDS IMPROVEMENT': return 'text-red-400';
      case 'POOR': return 'text-red-400';
      case 'DETRAINING': return 'text-red-500';
      case 'OVERREACHING': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  // Format metric score to percentage or raw value based on metric type
  const formatMetricValue = (metric, value) => {
    if (!value && value !== 0) return 'N/A';
    
    if (metric === 'cardiacEfficiency') {
      return `${value} bpm`;
    }
    if (metric === 'oxygenUtilization') {
      return value.toFixed(1);
    }
    return `${value}/100`;
  };
  
  // Format specific health metrics
  const formatHealthValue = (type, value) => {
    if (!value && value !== 0) return 'N/A';
    
    switch (type) {
      case 'restingHeartRate': return `${value} bpm`;
      case 'heartRateVariability': return `${value} ms`;
      case 'oxygenSaturation': return `${value}%`;
      case 'recoveryRate': return `${value} bpm`;
      case 'vo2Max': return `${value.toFixed(1)}`;
      case 'cardioLoad': return `${value}/100`;
      case 'efficiency': return `${value}%`;
      case 'deepPercent': return `${value.toFixed(1)}%`;
      case 'remPercent': return `${value.toFixed(1)}%`;
      case 'awakeTime': return `${value.toFixed(1)}h`;
      case 'totalTime': return `${value.toFixed(1)}h`;
      case 'dailySteps': return value.toLocaleString();
      case 'activeMinutes': return `${value} min`;
      case 'totalCalories': return value.toLocaleString();
      case 'hydration': return `${value.toFixed(1)}L`;
      case 'currentLoad': return `${value}/100`;
      case 'loadRatio': return value.toFixed(2);
      default: return value;
    }
  };

  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="bg-gray-900 border border-cyan-800 rounded shadow-lg shadow-cyan-900/20 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-mono text-cyan-300">BIOMETRIC ENHANCEMENT MATRIX</h2>
          <div className="flex space-x-3">
            <button 
              className={`text-xs font-mono ${activeTab === 'overview' ? 'text-cyan-400' : 'text-cyan-600 hover:text-cyan-400'}`}
              onClick={() => setActiveTab('overview')}
            >
              OVERVIEW
            </button>
            <button 
              className={`text-xs font-mono ${activeTab === 'detailed' ? 'text-cyan-400' : 'text-cyan-600 hover:text-cyan-400'}`}
              onClick={() => setActiveTab('detailed')}
            >
              DETAILED
            </button>
            <button 
              className={`text-xs font-mono ${activeTab === 'analysis' ? 'text-cyan-400' : 'text-cyan-600 hover:text-cyan-400'}`}
              onClick={() => setActiveTab('analysis')}
            >
              ANALYSIS
            </button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Cardiac Efficiency Metric */}
            <div className="bg-gray-950 border border-cyan-900 p-4 rounded relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/0 to-cyan-900/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center mb-1">
                <Heart size={16} className="text-red-500 mr-1" />
                <p className="text-xs text-cyan-600 font-mono">CARDIAC EFFICIENCY</p>
              </div>
              <p className="text-xl font-bold text-cyan-300 font-mono">
                {formatMetricValue('cardiacEfficiency', metrics.individualMetrics.cardiacEfficiency.current)}
              </p>
              <div className="flex items-center justify-between mt-1">
                <div className="h-1 w-16 bg-gray-800 rounded-full">
                  <div 
                    className="h-1 bg-cyan-500 rounded-full"
                    style={{ width: `${Math.min(100, (metrics.individualMetrics.cardiacEfficiency.score / 100) * 100)}%` }}
                  ></div>
                </div>
                <p className={`text-xs ${getStatusClass(metrics.individualMetrics.cardiacEfficiency.status)} ml-2 font-mono`}>
                  {metrics.individualMetrics.cardiacEfficiency.status}
                </p>
              </div>
            </div>
            
            {/* Oxygen Utilization Metric */}
            <div className="bg-gray-950 border border-cyan-900 p-4 rounded relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/0 to-cyan-900/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center mb-1">
                <Zap size={16} className="text-yellow-500 mr-1" />
                <p className="text-xs text-cyan-600 font-mono">OXYGEN UTILIZATION</p>
              </div>
              <p className="text-xl font-bold text-cyan-300 font-mono">
                {formatMetricValue('oxygenUtilization', metrics.individualMetrics.oxygenUtilization.current)}
              </p>
              <div className="flex items-center justify-between mt-1">
                <div className="h-1 w-16 bg-gray-800 rounded-full">
                  <div 
                    className="h-1 bg-green-500 rounded-full"
                    style={{ width: `${Math.min(100, (metrics.individualMetrics.oxygenUtilization.score / 100) * 100)}%` }}
                  ></div>
                </div>
                <p className={`text-xs ${getStatusClass(metrics.individualMetrics.oxygenUtilization.status)} ml-2 font-mono`}>
                  {metrics.individualMetrics.oxygenUtilization.status}
                </p>
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
                {formatMetricValue('forceOutput', metrics.individualMetrics.forceOutput.current)}
              </p>
              <div className="flex items-center justify-between mt-1">
                <div className="h-1 w-16 bg-gray-800 rounded-full">
                  <div 
                    className="h-1 bg-yellow-500 rounded-full"
                    style={{ width: `${Math.min(100, (metrics.individualMetrics.forceOutput.score / 100) * 100)}%` }}
                  ></div>
                </div>
                <p className={`text-xs ${getStatusClass(metrics.individualMetrics.forceOutput.status)} ml-2 font-mono`}>
                  {metrics.individualMetrics.forceOutput.status}
                </p>
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
                {formatMetricValue('enduranceMatrix', metrics.individualMetrics.enduranceMatrix.current)}
              </p>
              <div className="flex items-center justify-between mt-1">
                <div className="h-1 w-16 bg-gray-800 rounded-full">
                  <div 
                    className="h-1 bg-green-500 rounded-full"
                    style={{ width: `${Math.min(100, (metrics.individualMetrics.enduranceMatrix.score / 100) * 100)}%` }}
                  ></div>
                </div>
                <p className={`text-xs ${getStatusClass(metrics.individualMetrics.enduranceMatrix.status)} ml-2 font-mono`}>
                  {metrics.individualMetrics.enduranceMatrix.status}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'detailed' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cardiovascular System */}
            <div className="bg-gray-950 border border-cyan-900 p-4 rounded relative overflow-hidden">
              <div className="flex items-center mb-3">
                <Heart size={18} className="text-red-500 mr-2" />
                <div>
                  <h3 className="text-sm font-mono text-cyan-400">CARDIOVASCULAR</h3>
                  <div className="flex items-center mt-1">
                    <div className="h-1.5 w-20 bg-gray-800 rounded-full mr-2">
                      <div 
                        className="h-1.5 bg-gradient-to-r from-cyan-600 to-green-500 rounded-full"
                        style={{ width: `${Math.min(100, metrics.cardiovascular.overallScore)}%` }}
                      ></div>
                    </div>
                    <p className={`text-xs ${getStatusClass(metrics.cardiovascular.status)} font-mono`}>
                      {metrics.cardiovascular.status || 'NO DATA'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-cyan-600 font-mono">RESTING HR</span>
                  <span className="text-cyan-300 font-mono">{formatHealthValue('restingHeartRate', metrics.cardiovascular.restingHeartRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-600 font-mono">HRV</span>
                  <span className="text-cyan-300 font-mono">{formatHealthValue('heartRateVariability', metrics.cardiovascular.heartRateVariability)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-600 font-mono">SpO2</span>
                  <span className="text-cyan-300 font-mono">{formatHealthValue('oxygenSaturation', metrics.cardiovascular.oxygenSaturation)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-600 font-mono">VO2 MAX</span>
                  <span className="text-cyan-300 font-mono">{formatHealthValue('vo2Max', metrics.cardiovascular.vo2Max)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-600 font-mono">RECOVERY RATE</span>
                  <span className="text-cyan-300 font-mono">{formatHealthValue('recoveryRate', metrics.cardiovascular.recoveryRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-600 font-mono">CARDIO LOAD</span>
                  <span className="text-cyan-300 font-mono">{formatHealthValue('cardioLoad', metrics.cardiovascular.cardioLoad)}</span>
                </div>
              </div>
            </div>

            {/* Sleep Metrics */}
            <div className="bg-gray-950 border border-cyan-900 p-4 rounded relative overflow-hidden">
              <div className="flex items-center mb-3">
                <Moon size={18} className="text-indigo-400 mr-2" />
                <div>
                  <h3 className="text-sm font-mono text-cyan-400">SLEEP QUALITY</h3>
                  <div className="flex items-center mt-1">
                    <div className="h-1.5 w-20 bg-gray-800 rounded-full mr-2">
                      <div 
                        className="h-1.5 bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-full"
                        style={{ width: `${Math.min(100, metrics.sleep.overallScore)}%` }}
                      ></div>
                    </div>
                    <p className={`text-xs ${getStatusClass(metrics.sleep.status)} font-mono`}>
                      {metrics.sleep.status || 'NO DATA'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-cyan-600 font-mono">TOTAL SLEEP</span>
                  <span className="text-cyan-300 font-mono">{formatHealthValue('totalTime', metrics.sleep.totalTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-600 font-mono">EFFICIENCY</span>
                  <span className="text-cyan-300 font-mono">{formatHealthValue('efficiency', metrics.sleep.efficiency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-600 font-mono">DEEP SLEEP</span>
                  <span className="text-cyan-300 font-mono">{formatHealthValue('deepPercent', metrics.sleep.deepPercent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-600 font-mono">REM SLEEP</span>
                  <span className="text-cyan-300 font-mono">{formatHealthValue('remPercent', metrics.sleep.remPercent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-600 font-mono">AWAKE TIME</span>
                  <span className="text-cyan-300 font-mono">{formatHealthValue('awakeTime', metrics.sleep.awakeTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-600 font-mono">RECOVERY SCORE</span>
                  <span className="text-cyan-300 font-mono">{metrics.sleep.recoveryContribution}/100</span>
                </div>
              </div>
            </div>

            {/* Activity Metrics */}
            <div className="bg-gray-950 border border-cyan-900 p-4 rounded relative overflow-hidden">
              <div className="flex items-center mb-3">
                <Activity size={18} className="text-yellow-500 mr-2" />
                <div>
                  <h3 className="text-sm font-mono text-cyan-400">ACTIVITY METRICS</h3>
                  <div className="flex items-center mt-1">
                    <div className="h-1.5 w-20 bg-gray-800 rounded-full mr-2">
                      <div 
                        className="h-1.5 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full"
                        style={{ width: `${Math.min(100, metrics.activity.overallScore)}%` }}
                      ></div>
                    </div>
                    <p className={`text-xs ${getStatusClass(metrics.activity.status)} font-mono`}>
                      {metrics.activity.status || 'NO DATA'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-cyan-600 font-mono">DAILY STEPS</span>
                  <span className="text-cyan-300 font-mono">{formatHealthValue('dailySteps', metrics.activity.dailySteps)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-600 font-mono">ACTIVE MINUTES</span>
                  <span className="text-cyan-300 font-mono">{formatHealthValue('activeMinutes', metrics.activity.activeMinutes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-600 font-mono">TOTAL CALORIES</span>
                  <span className="text-cyan-300 font-mono">{formatHealthValue('totalCalories', metrics.activity.totalCalories)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-600 font-mono">ACTIVE CALORIES</span>
                  <span className="text-cyan-300 font-mono">{formatHealthValue('totalCalories', metrics.activity.activeCalories)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-600 font-mono">BASAL CALORIES</span>
                  <span className="text-cyan-300 font-mono">{formatHealthValue('totalCalories', metrics.activity.basalCalories)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-600 font-mono">STAND HOURS</span>
                  <span className="text-cyan-300 font-mono">{metrics.activity.standHours || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Nutrition Metrics */}
            <div className="bg-gray-950 border border-cyan-900 p-4 rounded relative overflow-hidden">
              <div className="flex items-center mb-3">
                <Utensils size={18} className="text-green-500 mr-2" />
                <div>
                  <h3 className="text-sm font-mono text-cyan-400">NUTRITION</h3>
                  <div className="flex items-center mt-1">
                    <div className="h-1.5 w-20 bg-gray-800 rounded-full mr-2">
                      <div 
                        className="h-1.5 bg-gradient-to-r from-green-600 to-cyan-500 rounded-full"
                        style={{ width: `${Math.min(100, metrics.nutrition.overallScore)}%` }}
                      ></div>
                    </div>
                    <p className={`text-xs ${getStatusClass(metrics.nutrition.status)} font-mono`}>
                      {metrics.nutrition.status || 'NO DATA'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-cyan-600 font-mono">TOTAL CALORIES</span>
                  <span className="text-cyan-300 font-mono">{formatHealthValue('totalCalories', metrics.nutrition.totalCalories)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-600 font-mono">HYDRATION</span>
                  <span className="text-cyan-300 font-mono">{formatHealthValue('hydration', metrics.nutrition.hydration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-600 font-mono">PROTEIN</span>
                  <span className="text-cyan-300 font-mono">{metrics.nutrition.macroRatio.protein || 'N/A'}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-600 font-mono">CARBS</span>
                  <span className="text-cyan-300 font-mono">{metrics.nutrition.macroRatio.carbs || 'N/A'}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-600 font-mono">FAT</span>
                  <span className="text-cyan-300 font-mono">{metrics.nutrition.macroRatio.fat || 'N/A'}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-600 font-mono">BALANCE SCORE</span>
                  <span className="text-cyan-300 font-mono">{metrics.nutrition.overallScore || 'N/A'}/100</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-4">
            {/* Training Status */}
            <div className="bg-gray-950 border border-cyan-900 p-4 rounded">
              <div className="flex items-center mb-3">
                <Brain size={18} className="text-purple-500 mr-2" />
                <div>
                  <h3 className="text-sm font-mono text-cyan-400">TRAINING STATUS</h3>
                  <div className="flex items-center mt-1">
                    <div className="h-1.5 w-20 bg-gray-800 rounded-full mr-2">
                      <div 
                        className="h-1.5 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full"
                        style={{ width: `${Math.min(100, metrics.trainingStatus.overallScore)}%` }}
                      ></div>
                    </div>
                    <p className={`text-xs ${getStatusClass(metrics.trainingStatus.status)} font-mono`}>
                      {metrics.trainingStatus.status || 'NO DATA'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-4">
                <div className="flex justify-between">
                  <span className="text-cyan-600 font-mono">CURRENT LOAD</span>
                  <span className="text-cyan-300 font-mono">{formatHealthValue('currentLoad', metrics.trainingStatus.currentLoad)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-600 font-mono">LOAD RATIO</span>
                  <span className="text-cyan-300 font-mono">{formatHealthValue('loadRatio', metrics.trainingStatus.loadRatio)}</span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span className="text-cyan-600 font-mono">RECOMMENDATION</span>
                  <span className={`${getStatusClass(metrics.trainingStatus.status)} font-mono`}>
                    {metrics.trainingStatus.recommendation}
                  </span>
                </div>
              </div>
              
              <div className="p-3 border border-cyan-900/50 bg-black/20 rounded text-xs text-cyan-400 font-mono">
                {metrics.trainingStatus.overtraining && (
                  <p>WARNING: Your current training load exceeds optimal levels. Decrease intensity for 3-5 days to prevent overtraining syndrome.</p>
                )}
                {metrics.trainingStatus.detraining && (
                  <p>ALERT: Your training volume has decreased below maintenance levels. Consider increasing workout frequency to prevent detraining.</p>
                )}
                {metrics.trainingStatus.optimal && (
                  <p>OPTIMAL: Your current training load is effectively balanced for adaptations. Continue with your current program to maintain progress.</p>
                )}
                {!metrics.trainingStatus.optimal && !metrics.trainingStatus.overtraining && !metrics.trainingStatus.detraining && (
                  <p>ANALYSIS PENDING: Insufficient data to determine optimal training load. Continue recording workouts for enhanced analysis.</p>
                )}
              </div>
            </div>
            
            {/* Comprehensive Analysis */}
            <div className="mt-6 bg-gray-950 border border-cyan-900 p-4 rounded">
              <h3 className="text-sm font-mono text-cyan-300 mb-3">COMPREHENSIVE ANALYSIS</h3>
              
              <div className="space-y-3 text-xs text-cyan-600 font-mono">
                <div className="flex items-start">
                  <div className="w-3 h-3 rounded-full bg-cyan-800 mt-0.5 mr-2 flex-shrink-0"></div>
                  <p>
                    {metrics.individualMetrics.cardiacEfficiency.score > 80 
                      ? 'CARDIAC EFFICIENCY IS OPTIMAL. MAINTAIN CURRENT CARDIOVASCULAR TRAINING.'
                      : metrics.individualMetrics.cardiacEfficiency.score > 60
                      ? 'CARDIAC EFFICIENCY ADVANCING. CONTINUE REGULAR CARDIO SESSIONS.'
                      : 'CARDIAC EFFICIENCY DEVELOPING. INCREASE AEROBIC ZONE 2 TRAINING.'}
                  </p>
                </div>
                
                <div className="flex items-start">
                  <div className="w-3 h-3 rounded-full bg-cyan-800 mt-0.5 mr-2 flex-shrink-0"></div>
                  <p>
                    {metrics.sleep.overallScore > 80 
                      ? 'SLEEP QUALITY EXCELLENT. OPTIMAL RECOVERY AND COGNITIVE ENHANCEMENT.'
                      : metrics.sleep.overallScore > 60
                      ? 'SLEEP QUALITY GOOD. CONSIDER IMPROVING SLEEP ENVIRONMENT FOR ENHANCED RECOVERY.'
                      : 'SLEEP QUALITY NEEDS ATTENTION. FOCUS ON CONSISTENT SLEEP SCHEDULE AND EVENING ROUTINE.'}
                  </p>
                </div>
                
                <div className="flex items-start">
                  <div className="w-3 h-3 rounded-full bg-cyan-800 mt-0.5 mr-2 flex-shrink-0"></div>
                  <p>
                    {metrics.individualMetrics.forceOutput.score > 80 
                      ? 'FORCE OUTPUT EXCEPTIONAL. FOCUS ON MAINTAINING CURRENT STRENGTH LEVELS.'
                      : metrics.individualMetrics.forceOutput.score > 60
                      ? 'FORCE OUTPUT ADVANCING. CONTINUE PROGRESSIVE RESISTANCE TRAINING.'
                      : 'FORCE OUTPUT DEVELOPING. INCREASE WEIGHT TRAINING FREQUENCY.'}
                  </p>
                </div>
                
                <div className="flex items-start">
                  <div className="w-3 h-3 rounded-full bg-cyan-800 mt-0.5 mr-2 flex-shrink-0"></div>
                  <p>
                    {metrics.nutrition.overallScore > 80 
                      ? 'NUTRITION PROTOCOL OPTIMAL. CURRENT MACRO DISTRIBUTION SUPPORTS PERFORMANCE GOALS.'
                      : metrics.nutrition.overallScore > 60
                      ? 'NUTRITION ADEQUATE. CONSIDER INCREASING PROTEIN INTAKE FOR ENHANCED RECOVERY.'
                      : 'NUTRITION NEEDS IMPROVEMENT. FOCUS ON BALANCED MACRONUTRIENTS AND HYDRATION.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}