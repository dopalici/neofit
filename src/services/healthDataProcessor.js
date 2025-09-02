// src/services/healthDataProcessor.js
import { format, parseISO, isValid, subDays } from 'date-fns';
import { getFromStorage, saveToStorage } from '../utils/storageUtils';
import { STORAGE_KEYS } from './dataImportService';

/**
 * Core processor for Apple Health data
 * This service handles validation, normalization, and transformation of health data
 */

/**
 * Process raw health data into a standardized format
 * @param {Array} rawData Array of data points
 * @param {string} dataType Type of health data
 * @returns {Object} Processed health data
 */
export function processHealthData(rawData = [], dataType) {
  if (!Array.isArray(rawData)) {
    console.warn(`Invalid data format for ${dataType}, expected array`);
    return { data: [], stats: {} };
  }

  // Ensure all items have required fields and convert to standardized format
  const validData = rawData
    .filter(item => {
      // Basic validation
      if (!item || typeof item !== 'object') return false;
      if (item.value === undefined || item.value === null) return false;
      if (!item.date) return false;

      // Validate date
      try {
        const date = parseISO(item.date);
        if (!isValid(date)) return false;
      } catch (e) {
        return false;
      }

      // Make sure value is numeric or can be converted to numeric
      const numValue = parseFloat(item.value);
      return !isNaN(numValue);
    })
    .map(item => ({
      // Convert to standard format
      date: item.date,
      value: parseFloat(item.value),
      unit: item.unit || getDefaultUnit(dataType),
      // Include additional properties if present
      ...(item.category && { category: item.category }),
      ...(item.type && { type: item.type }),
      ...(item.source && { source: item.source })
    }));

  // Sort by date (newest first)
  const sortedData = [...validData].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  // Calculate useful statistics
  const stats = calculateStats(sortedData, dataType);

  return { 
    data: sortedData, 
    stats
  };
}

/**
 * Get default unit for a data type
 */
function getDefaultUnit(dataType) {
  switch (dataType) {
    // Core metrics
    case 'heartRate': return 'bpm';
    case 'steps': return 'count';
    case 'weight': return 'kg';
    case 'sleep': return 'hours';
    case 'vo2max': return 'ml/kg/min';
    case 'calories': return 'kcal';
    case 'distance': return 'km';
    case 'restingHeartRate': return 'bpm';
    case 'heartRateVariability': return 'ms';
    
    // Cardiovascular & Respiratory metrics
    case 'oxygenSaturation': return '%';
    case 'respiratoryRate': return 'breaths/min';
    case 'bodyTemperature': return '°C';
    
    // Energy & nutrition metrics
    case 'basalEnergy': return 'kcal';
    case 'dietaryEnergy': return 'kcal';
    case 'dietaryProtein': return 'g';
    case 'dietaryCarbs': return 'g';
    case 'dietaryFat': return 'g';
    case 'dietaryWater': return 'L';
    case 'dietaryFiber': return 'g';
    case 'dietarySugar': return 'g';
    case 'dietarySodium': return 'mg';
    case 'dietaryCholesterol': return 'mg';
    
    // Micronutrients
    case 'dietaryCalcium': return 'mg';
    case 'dietaryIron': return 'mg';
    case 'dietaryPotassium': return 'mg';
    case 'dietaryVitaminA': return 'µg';
    case 'dietaryVitaminC': return 'mg';
    case 'dietaryVitaminD': return 'µg';
    
    // Activity metrics
    case 'exerciseTime': return 'min';
    case 'standTime': return 'min';
    case 'runningSpeed': return 'm/s';
    case 'walkingSpeed': return 'm/s';
    case 'runningPower': return 'W';
    
    // Environmental data
    case 'timeInDaylight': return 'min';
    
    // Default fallback
    default: return '';
  }
}

/**
 * Calculate statistics for a dataset
 */
function calculateStats(data, dataType) {
  if (!data.length) {
    return {};
  }

  // Get recent data (last 7 days)
  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  const recentData = data.filter(item => new Date(item.date) >= sevenDaysAgo);

  // Calculate basic statistics
  const values = data.map(item => item.value);
  const recentValues = recentData.map(item => item.value);

  const stats = {
    latest: data[0],
    count: data.length,
    min: Math.min(...values),
    max: Math.max(...values),
    avg: values.reduce((sum, val) => sum + val, 0) / values.length,
    recent: {
      count: recentData.length,
      avg: recentValues.length ? recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length : 0
    }
  };

  // Calculate data-specific metrics
  switch (dataType) {
    case 'heartRate':
      stats.restingHR = calculateRestingHeartRate(data);
      stats.cardioLoad = calculateCardioLoad(data);
      stats.heartRateZones = calculateHeartRateZones(data);
      stats.recoveryRate = calculateHeartRateRecovery(data); 
      break;
      
    case 'restingHeartRate':
      stats.trend = data.length >= 7 ? calculateTrend(data.slice(0, 7)) : 0;
      stats.cardioFitness = classifyRestingHeartRate(stats.latest ? stats.latest.value : 0);
      break;
      
    case 'heartRateVariability':
      stats.trend = data.length >= 7 ? calculateTrend(data.slice(0, 7)) : 0;
      stats.stressLevel = calculateStressFromHRV(stats.latest ? stats.latest.value : 0);
      stats.readiness = calculateReadinessScore(data);
      break;

    case 'steps':
      stats.totalSteps = data.reduce((sum, item) => sum + item.value, 0);
      stats.avgSteps = stats.totalSteps / data.length;
      stats.activedays = data.filter(item => item.value >= 10000).length;
      stats.weeklyAverage = calculateWeeklyAverage(data);
      stats.consistency = calculateConsistencyScore(data);
      break;

    case 'sleep':
      stats.avgSleepDuration = stats.avg;
      // Use actual sleep stage data if available, otherwise estimate
      if (data[0] && data[0].stages) {
        stats.deepSleep = data[0].stages.deep;
        stats.remSleep = data[0].stages.rem;
        stats.coreSleep = data[0].stages.core;
        stats.awake = data[0].stages.awake;
      } else {
        stats.deepSleepEstimate = stats.latest ? stats.latest.value * 0.2 : 0;
        stats.remSleepEstimate = stats.latest ? stats.latest.value * 0.25 : 0;
      }
      stats.sleepEfficiency = data[0] && data[0].sleepEfficiency ? 
                              data[0].sleepEfficiency : 
                              calculateSleepEfficiency(data[0]);
      stats.optimalNights = data.filter(item => item.value >= 7).length;
      stats.sleepDebt = calculateSleepDebt(data);
      stats.sleepQualityScore = calculateSleepQualityScore(data);
      break;

    case 'weight':
      // Calculate BMI if height is available
      const heightData = getFromStorage(STORAGE_KEYS.HEIGHT_DATA, []);
      if (heightData.length > 0) {
        const latestHeight = heightData[0].value; // Assuming in cm
        if (latestHeight && stats.latest) {
          const heightInM = latestHeight / 100;
          stats.bmi = stats.latest.value / (heightInM * heightInM);
          stats.bmiCategory = classifyBMI(stats.bmi);
        }
      }
      // Calculate trend (positive or negative)
      if (data.length >= 2) {
        stats.trend = data[0].value - data[1].value;
      }
      if (data.length >= 30) {
        stats.monthlyChange = data[0].value - data[29].value;
        stats.monthlyChangePercent = (stats.monthlyChange / data[29].value) * 100;
      }
      break;

    case 'vo2max':
      stats.fitnessLevel = getVo2MaxFitnessLevel(stats.latest ? stats.latest.value : 0);
      stats.trend = data.length >= 5 ? calculateTrend(data.slice(0, 5)) : 0;
      stats.aerobicEfficiency = calculateAerobicEfficiency(stats.latest ? stats.latest.value : 0);
      break;
      
    case 'oxygenSaturation':
      stats.status = classifyOxygenSaturation(stats.latest ? stats.latest.value : 0);
      stats.lastMinute = data.filter(item => {
        const itemDate = new Date(item.date);
        const oneMinuteAgo = new Date(Date.now() - 60000);
        return itemDate >= oneMinuteAgo;
      }).length > 0 ? data[0].value : null;
      break;
      
    case 'respiratoryRate':
      stats.status = classifyRespiratoryRate(stats.latest ? stats.latest.value : 0);
      stats.restingRate = calculateRestingRate(data);
      break;
      
    case 'bodyTemperature':
      stats.status = classifyBodyTemperature(stats.latest ? stats.latest.value : 0);
      stats.normalizedValue = normalizeTemperature(stats.latest ? stats.latest.value : 0);
      break;
      
    case 'basalEnergy':
      stats.weeklyTotal = calculateWeeklyTotal(data);
      stats.dailyAverage = stats.weeklyTotal / 7;
      stats.restingMetabolismEstimate = estimateRestingMetabolism(data);
      break;
      
    case 'calories': // Active Energy
      stats.weeklyBurn = calculateWeeklyTotal(data);
      stats.activeCaloriesPerDay = stats.weeklyBurn / 7;
      stats.intensityDistribution = calculateIntensityDistribution(data);
      stats.calorieBalance = calculateCalorieBalance(data);
      break;
      
    // Add handling for nutrition data types
    case 'dietaryEnergy':
    case 'dietaryProtein':
    case 'dietaryCarbs':
    case 'dietaryFat':
    case 'dietaryWater':
    case 'dietaryFiber':
    case 'dietarySugar':
    case 'dietarySodium':
    case 'dietaryCholesterol':
    case 'dietaryCalcium':
    case 'dietaryIron':
    case 'dietaryPotassium':
    case 'dietaryVitaminA':
    case 'dietaryVitaminC':
    case 'dietaryVitaminD':
      stats.todayTotal = calculateDailyTotal(data);
      stats.weeklyAverage = calculateWeeklyAverage(data);
      stats.dailyGoal = calculateNutrientGoal(dataType);
      stats.percentOfGoal = stats.todayTotal / stats.dailyGoal * 100;
      stats.recommendation = generateNutrientRecommendation(dataType, stats.percentOfGoal);
      break;
      
    // Activity metrics
    case 'exerciseTime':
      stats.weeklyTotal = calculateWeeklyTotal(data);
      stats.dailyAverage = stats.weeklyTotal / 7;
      stats.activeGoalMet = stats.latest ? stats.latest.value >= 30 : false;
      break;
      
    case 'standTime':
      stats.weeklyTotal = calculateWeeklyTotal(data);
      stats.dailyAverage = stats.weeklyTotal / 7;
      stats.standGoalMet = stats.latest ? stats.latest.value >= 12 : false;
      break;
      
    case 'runningSpeed':
    case 'walkingSpeed':
      stats.maxValue = Math.max(...values);
      stats.progressTrend = calculateSpeedProgressTrend(data);
      stats.pacePerformance = assessPacePerformance(data, dataType);
      break;
      
    case 'runningPower':
      stats.maxValue = Math.max(...values);
      stats.powerZones = calculatePowerZones(data);
      stats.efficiencyScore = calculatePowerEfficiency(data);
      break;
      
    case 'timeInDaylight':
      stats.weeklyTotal = calculateWeeklyTotal(data);
      stats.dailyAverage = stats.weeklyTotal / 7;
      stats.sufficientExposure = stats.latest ? stats.latest.value >= 30 : false; // 30 min daily minimum
      break;
  }

  return stats;
}

/**
 * Calculate resting heart rate from heart rate data
 */
function calculateRestingHeartRate(heartRateData) {
  if (!heartRateData || heartRateData.length < 5) {
    return null;
  }

  // Sort heart rate values low to high
  const sortedHR = [...heartRateData].sort((a, b) => a.value - b.value);
  
  // Take the lowest 5% of values (approximately resting)
  const percentile5Index = Math.floor(sortedHR.length * 0.05);
  const lowestHRs = sortedHR.slice(0, Math.max(1, percentile5Index));
  
  // Average the lowest values
  const sum = lowestHRs.reduce((total, item) => total + item.value, 0);
  return Math.round(sum / lowestHRs.length);
}

/**
 * Calculate heart rate zones based on max heart rate
 */
function calculateHeartRateZones(heartRateData) {
  if (!heartRateData || heartRateData.length < 10) {
    return null;
  }

  // Estimate max heart rate (simple method)
  // In a real app, you'd use a more sophisticated method or user input
  const maxHR = 220 - 30; // Assuming 30-year-old user
  
  // Define heart rate zones (standard 5-zone model)
  const zones = {
    zone1: { min: Math.round(maxHR * 0.5), max: Math.round(maxHR * 0.6), name: "RECOVERY", timeSpent: 0 },
    zone2: { min: Math.round(maxHR * 0.6), max: Math.round(maxHR * 0.7), name: "AEROBIC", timeSpent: 0 },
    zone3: { min: Math.round(maxHR * 0.7), max: Math.round(maxHR * 0.8), name: "ENDURANCE", timeSpent: 0 },
    zone4: { min: Math.round(maxHR * 0.8), max: Math.round(maxHR * 0.9), name: "THRESHOLD", timeSpent: 0 },
    zone5: { min: Math.round(maxHR * 0.9), max: maxHR, name: "MAX EFFORT", timeSpent: 0 }
  };
  
  // Calculate time spent in each zone
  heartRateData.forEach(item => {
    const hr = item.value;
    if (hr >= zones.zone5.min) zones.zone5.timeSpent++;
    else if (hr >= zones.zone4.min) zones.zone4.timeSpent++;
    else if (hr >= zones.zone3.min) zones.zone3.timeSpent++;
    else if (hr >= zones.zone2.min) zones.zone2.timeSpent++;
    else if (hr >= zones.zone1.min) zones.zone1.timeSpent++;
  });
  
  // Calculate percentages
  const totalSamples = heartRateData.length;
  zones.zone1.percent = Math.round((zones.zone1.timeSpent / totalSamples) * 100);
  zones.zone2.percent = Math.round((zones.zone2.timeSpent / totalSamples) * 100);
  zones.zone3.percent = Math.round((zones.zone3.timeSpent / totalSamples) * 100);
  zones.zone4.percent = Math.round((zones.zone4.timeSpent / totalSamples) * 100);
  zones.zone5.percent = Math.round((zones.zone5.timeSpent / totalSamples) * 100);
  
  return zones;
}

/**
 * Calculate heart rate recovery rate
 */
function calculateHeartRateRecovery(heartRateData) {
  if (!heartRateData || heartRateData.length < 20) {
    return null;
  }
  
  // Find periods of high heart rate followed by decreases
  // This is a simplified estimation of recovery rate
  const peakThreshold = 140; // Threshold for a "peak" heart rate
  let peakEvents = [];
  
  // Find potential exercise periods with peak heart rates
  for (let i = 0; i < heartRateData.length - 5; i++) {
    if (heartRateData[i].value >= peakThreshold) {
      // Look ahead to find if this might be the start of a recovery period
      let validRecovery = true;
      for (let j = 1; j <= 5; j++) {
        if (i + j >= heartRateData.length || heartRateData[i + j].value >= heartRateData[i].value) {
          validRecovery = false;
          break;
        }
      }
      
      if (validRecovery) {
        peakEvents.push({
          peakHR: heartRateData[i].value,
          peakIndex: i,
          recovery1Min: heartRateData[i].value - heartRateData[i + 1].value // Simplified 1-min recovery
        });
      }
    }
  }
  
  // If no valid recovery events found, return null
  if (peakEvents.length === 0) {
    return null;
  }
  
  // Calculate average recovery rate (beats dropped in first minute after peak)
  const avgRecovery = peakEvents.reduce((sum, event) => sum + event.recovery1Min, 0) / peakEvents.length;
  
  return Math.round(avgRecovery);
}

/**
 * Calculate trend from time series data
 */
function calculateTrend(data) {
  if (!data || data.length < 2) return 0;
  
  // Simple trend calculation: average of day-to-day changes
  let changes = [];
  for (let i = 0; i < data.length - 1; i++) {
    changes.push(data[i].value - data[i + 1].value);
  }
  
  const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
  return avgChange;
}

/**
 * Classify resting heart rate into fitness levels
 */
function classifyRestingHeartRate(restingHR) {
  if (!restingHR) return 'NO DATA';
  
  // General classification for adults (would be adjusted by age/sex in a real app)
  if (restingHR < 50) return 'ATHLETE';
  if (restingHR < 60) return 'EXCELLENT';
  if (restingHR < 70) return 'GOOD';
  if (restingHR < 80) return 'AVERAGE';
  if (restingHR < 90) return 'FAIR';
  return 'POOR';
}

/**
 * Calculate stress level from HRV data
 */
function calculateStressFromHRV(hrv) {
  if (!hrv) return 'NO DATA';
  
  // Higher HRV generally indicates lower stress
  if (hrv > 70) return { level: 'LOW', score: 25 };
  if (hrv > 50) return { level: 'MODERATE', score: 50 };
  if (hrv > 30) return { level: 'HIGH', score: 75 };
  return { level: 'VERY HIGH', score: 100 };
}

/**
 * Calculate readiness score based on HRV trends
 */
function calculateReadinessScore(hrvData) {
  if (!hrvData || hrvData.length < 3) return 'INSUFFICIENT DATA';
  
  // Compare recent HRV with baseline
  const latest = hrvData[0].value;
  const weekAvg = hrvData.slice(0, Math.min(7, hrvData.length)).reduce((sum, item) => sum + item.value, 0) / 
                  Math.min(7, hrvData.length);
  
  const relativeScore = (latest / weekAvg) * 100;
  
  // Score readiness based on how today's HRV compares to baseline
  if (relativeScore > 115) return { status: 'EXCELLENT', score: 90 };
  if (relativeScore > 105) return { status: 'GOOD', score: 75 };
  if (relativeScore > 95) return { status: 'NORMAL', score: 60 };
  if (relativeScore > 85) return { status: 'FAIR', score: 45 };
  return { status: 'POOR', score: 30 };
}

/**
 * Calculate weekly average from time series data
 */
function calculateWeeklyAverage(data) {
  if (!data || data.length === 0) return 0;
  
  // Get data from the last 7 days
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  
  const weekData = data.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= sevenDaysAgo;
  });
  
  if (weekData.length === 0) return 0;
  
  // Calculate average
  return weekData.reduce((sum, item) => sum + item.value, 0) / weekData.length;
}

/**
 * Calculate weekly total from time series data
 */
function calculateWeeklyTotal(data) {
  if (!data || data.length === 0) return 0;
  
  // Get data from the last 7 days
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  
  const weekData = data.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= sevenDaysAgo;
  });
  
  if (weekData.length === 0) return 0;
  
  // Calculate total
  return weekData.reduce((sum, item) => sum + item.value, 0);
}

/**
 * Calculate daily total from time series data
 */
function calculateDailyTotal(data) {
  if (!data || data.length === 0) return 0;
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Filter to today's data
  const todayData = data.filter(item => {
    const itemDate = new Date(item.date).toISOString().split('T')[0];
    return itemDate === today;
  });
  
  if (todayData.length === 0) return 0;
  
  // Calculate total
  return todayData.reduce((sum, item) => sum + item.value, 0);
}

/**
 * Calculate consistency score for time series data
 */
function calculateConsistencyScore(data) {
  if (!data || data.length < 7) return 0;
  
  // Get data from the last 7 days
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  
  const weekData = data.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= sevenDaysAgo;
  });
  
  if (weekData.length === 0) return 0;
  
  // Group by day and calculate standard deviation
  const dayTotals = {};
  weekData.forEach(item => {
    const day = new Date(item.date).toISOString().split('T')[0];
    dayTotals[day] = (dayTotals[day] || 0) + item.value;
  });
  
  const values = Object.values(dayTotals);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  
  // Calculate standard deviation
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Calculate coefficient of variation (lower is more consistent)
  const cv = (stdDev / mean) * 100;
  
  // Convert to consistency score (100 - cv, capped)
  return Math.max(0, Math.min(100, 100 - cv));
}

/**
 * Calculate sleep debt over the last week
 */
function calculateSleepDebt(sleepData) {
  if (!sleepData || sleepData.length < 3) return 0;
  
  // Ideal sleep amount (8 hours per night)
  const idealNightly = 8; 
  const idealWeekly = idealNightly * 7;
  
  // Get data from the last 7 days
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  
  const weekData = sleepData.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= sevenDaysAgo;
  });
  
  // Calculate actual sleep for available days
  const actualSleep = weekData.reduce((sum, item) => sum + item.value, 0);
  
  // Calculate debt based on available days
  const daysWithData = weekData.length;
  const expectedSleep = idealNightly * daysWithData;
  
  return Math.max(0, expectedSleep - actualSleep); // Only return positive debt
}

/**
 * Calculate sleep quality score based on duration, efficiency, and stages
 */
function calculateSleepQualityScore(sleepData) {
  if (!sleepData || sleepData.length === 0) return 0;
  
  const latestSleep = sleepData[0];
  
  // Start with a base score
  let qualityScore = 50;
  
  // Adjust for duration (optimal range 7-9 hours)
  const duration = latestSleep.value;
  if (duration >= 7 && duration <= 9) {
    qualityScore += 25;
  } else if (duration >= 6 && duration < 7) {
    qualityScore += 15;
  } else if (duration >= 5 && duration < 6) {
    qualityScore += 5;
  } else if (duration >= 9 && duration <= 10) {
    qualityScore += 15;
  } else if (duration > 10) {
    qualityScore += 5;
  }
  
  // Adjust for efficiency if available
  if (latestSleep.sleepEfficiency) {
    if (latestSleep.sleepEfficiency >= 90) qualityScore += 25;
    else if (latestSleep.sleepEfficiency >= 80) qualityScore += 20;
    else if (latestSleep.sleepEfficiency >= 70) qualityScore += 15;
    else if (latestSleep.sleepEfficiency >= 60) qualityScore += 10;
    else qualityScore += 5;
  }
  
  // Adjust for sleep stages if available
  if (latestSleep.stages) {
    const { deep, rem } = latestSleep.stages;
    
    // Optimal ranges for deep and REM sleep
    if (deep >= 1.5) qualityScore += 15;
    else if (deep >= 1) qualityScore += 10;
    else if (deep >= 0.5) qualityScore += 5;
    
    if (rem >= 1.5) qualityScore += 15;
    else if (rem >= 1) qualityScore += 10;
    else if (rem >= 0.5) qualityScore += 5;
  }
  
  // Cap the score at 100
  return Math.min(100, qualityScore);
}

/**
 * Classify BMI into categories
 */
function classifyBMI(bmi) {
  if (!bmi) return 'NO DATA';
  
  if (bmi < 18.5) return 'UNDERWEIGHT';
  if (bmi < 25) return 'NORMAL';
  if (bmi < 30) return 'OVERWEIGHT';
  if (bmi < 35) return 'OBESE';
  return 'SEVERELY OBESE';
}

/**
 * Calculate aerobic efficiency from VO2max
 */
function calculateAerobicEfficiency(vo2max) {
  if (!vo2max) return 'NO DATA';
  
  // Simplified efficiency calculation
  const efficiency = (vo2max / 50) * 100; // Normalized to 50 as a reference point
  
  return Math.min(100, Math.round(efficiency));
}

/**
 * Calculate sleep efficiency
 */
function calculateSleepEfficiency(sleepData) {
  if (!sleepData) return 0;
  
  const sleepDuration = sleepData.value;
  
  // Apply a more sophisticated algorithm based on multiple factors
  let efficiency = 0;
  
  // Base efficiency on total sleep duration (optimal range 7-9 hours)
  if (sleepDuration >= 7 && sleepDuration <= 9) {
    efficiency = 90;
  } else if (sleepDuration >= 6 && sleepDuration < 7) {
    efficiency = 80;
  } else if (sleepDuration >= 5 && sleepDuration < 6) {
    efficiency = 70;
  } else if (sleepDuration >= 9 && sleepDuration <= 10) {
    efficiency = 85;
  } else if (sleepDuration > 10) {
    efficiency = 75;
  } else {
    efficiency = Math.max(50, sleepDuration * 10); // Below 5 hours
  }
  
  // Add random small variation to simulate other sleep quality factors
  // In a real app, you would use actual deep sleep, REM sleep data
  const sleepQualityModifier = Math.floor(Math.random() * 10) - 5; // -5 to +5
  
  return Math.min(100, Math.max(0, efficiency + sleepQualityModifier));
}

/**
 * Calculate cardiovascular load based on heart rate data
 */
function calculateCardioLoad(heartRateData) {
  if (!heartRateData || heartRateData.length < 10) {
    return null;
  }
  
  // Filter to only include elevated heart rates (likely during activity)
  const activeHR = heartRateData.filter(item => item.value > 100);
  
  if (activeHR.length === 0) {
    return 0; // No elevated heart rate detected
  }
  
  // Calculate time spent in different heart rate zones
  const timeInZones = {
    light: 0,     // 100-120 bpm
    moderate: 0,  // 120-150 bpm
    vigorous: 0,  // 150-170 bpm
    max: 0        // >170 bpm
  };
  
  activeHR.forEach(item => {
    const hr = item.value;
    if (hr > 170) timeInZones.max++;
    else if (hr > 150) timeInZones.vigorous++;
    else if (hr > 120) timeInZones.moderate++;
    else timeInZones.light++;
  });
  
  // Calculate load score (weighted by intensity)
  // Example formula, in a real app this would be more complex
  const loadScore = (
    (timeInZones.light * 1) + 
    (timeInZones.moderate * 2) + 
    (timeInZones.vigorous * 3) + 
    (timeInZones.max * 4)
  ) / activeHR.length * 100;
  
  return Math.min(100, Math.round(loadScore));
}

/**
 * Get fitness level description based on VO2 Max
 */
function getVo2MaxFitnessLevel(vo2max) {
  if (typeof vo2max !== 'number' || isNaN(vo2max)) return 'NO DATA';
  
  if (vo2max > 55) return 'SUPERIOR';
  if (vo2max > 45) return 'EXCELLENT';
  if (vo2max > 35) return 'GOOD';
  if (vo2max > 25) return 'AVERAGE';
  return 'BELOW AVERAGE';
}

/**
 * Classify oxygen saturation levels
 */
function classifyOxygenSaturation(spo2) {
  if (!spo2) return 'NO DATA';
  
  if (spo2 >= 95) return 'NORMAL';
  if (spo2 >= 90) return 'MILD HYPOXEMIA';
  if (spo2 >= 85) return 'MODERATE HYPOXEMIA';
  return 'SEVERE HYPOXEMIA';
}

/**
 * Calculate resting respiratory rate
 */
function calculateRestingRate(respiratoryData) {
  if (!respiratoryData || respiratoryData.length < 5) return null;
  
  // Sort respiratory rate values low to high
  const sortedRR = [...respiratoryData].sort((a, b) => a.value - b.value);
  
  // Take the lowest 10% of values (approximately resting)
  const percentile10Index = Math.floor(sortedRR.length * 0.1);
  const lowestRRs = sortedRR.slice(0, Math.max(1, percentile10Index));
  
  // Average the lowest values
  const sum = lowestRRs.reduce((total, item) => total + item.value, 0);
  return Math.round((sum / lowestRRs.length) * 10) / 10; // Round to 1 decimal place
}

/**
 * Classify respiratory rate
 */
function classifyRespiratoryRate(respiratoryRate) {
  if (!respiratoryRate) return 'NO DATA';
  
  if (respiratoryRate < 12) return 'BELOW NORMAL';
  if (respiratoryRate <= 20) return 'NORMAL';
  if (respiratoryRate <= 30) return 'ELEVATED';
  return 'HIGH';
}

/**
 * Classify body temperature
 */
function classifyBodyTemperature(temperature) {
  if (!temperature) return 'NO DATA';
  
  if (temperature < 36) return 'HYPOTHERMIA';
  if (temperature <= 37.3) return 'NORMAL';
  if (temperature <= 38) return 'MILD FEVER';
  if (temperature <= 39) return 'MODERATE FEVER';
  return 'HIGH FEVER';
}

/**
 * Normalize temperature to standard format
 */
function normalizeTemperature(temperature) {
  if (!temperature) return null;
  
  // Round to 1 decimal place
  return Math.round(temperature * 10) / 10;
}

/**
 * Estimate resting metabolism from basal energy data
 */
function estimateRestingMetabolism(basalEnergyData) {
  if (!basalEnergyData || basalEnergyData.length === 0) return null;
  
  // Calculate average daily basal energy
  const dailyBasal = calculateDailyTotal(basalEnergyData);
  
  // If no data for today, use the most recent day
  return dailyBasal > 0 ? dailyBasal : basalEnergyData[0].value;
}

/**
 * Calculate intensity distribution from calorie burn data
 */
function calculateIntensityDistribution(calorieData) {
  if (!calorieData || calorieData.length === 0) return null;
  
  // Group calories by day
  const calsByDay = {};
  calorieData.forEach(item => {
    const day = new Date(item.date).toISOString().split('T')[0];
    calsByDay[day] = (calsByDay[day] || 0) + item.value;
  });
  
  // Sort days by calorie burn (high to low)
  const sortedDays = Object.entries(calsByDay)
    .sort((a, b) => b[1] - a[1])
    .map(([day, cals]) => ({ day, cals }));
  
  // Categorize days into intensity levels
  const totalDays = sortedDays.length;
  const highIntensity = sortedDays.slice(0, Math.ceil(totalDays * 0.2)); // Top 20%
  const moderateIntensity = sortedDays.slice(Math.ceil(totalDays * 0.2), Math.ceil(totalDays * 0.6)); // Middle 40%
  const lowIntensity = sortedDays.slice(Math.ceil(totalDays * 0.6)); // Bottom 40%
  
  return {
    high: {
      days: highIntensity.length,
      avgCalories: highIntensity.reduce((sum, item) => sum + item.cals, 0) / Math.max(1, highIntensity.length)
    },
    moderate: {
      days: moderateIntensity.length,
      avgCalories: moderateIntensity.reduce((sum, item) => sum + item.cals, 0) / Math.max(1, moderateIntensity.length)
    },
    low: {
      days: lowIntensity.length,
      avgCalories: lowIntensity.reduce((sum, item) => sum + item.cals, 0) / Math.max(1, lowIntensity.length)
    }
  };
}

/**
 * Calculate calorie balance (active calories vs dietary intake)
 */
function calculateCalorieBalance(activeCalorieData) {
  if (!activeCalorieData || activeCalorieData.length === 0) return null;
  
  // Get today's active calories
  const todayActiveCalories = calculateDailyTotal(activeCalorieData);
  
  // Get estimated BMR (simulated)
  const estimatedBMR = 1800; // Would be calculated based on user profile in a real app
  
  // Get today's dietary calories (simulated)
  // In a real app, this would come from dietary tracking
  const simulatedDietaryCalories = 2200;
  
  // Calculate balance
  const totalOut = todayActiveCalories + estimatedBMR;
  const balance = simulatedDietaryCalories - totalOut;
  
  return {
    in: simulatedDietaryCalories,
    out: {
      active: todayActiveCalories,
      basal: estimatedBMR,
      total: totalOut
    },
    balance,
    status: balance > 500 ? 'SURPLUS' : balance < -500 ? 'DEFICIT' : 'MAINTENANCE'
  };
}

/**
 * Calculate nutrient goal based on data type
 */
function calculateNutrientGoal(dataType) {
  // These would be personalized in a real app
  switch (dataType) {
    case 'dietaryEnergy': return 2200; // kcal
    case 'dietaryProtein': return 140; // g
    case 'dietaryCarbs': return 250; // g
    case 'dietaryFat': return 73; // g
    case 'dietaryWater': return 3; // L
    case 'dietaryFiber': return 30; // g
    case 'dietarySugar': return 50; // g
    case 'dietarySodium': return 2300; // mg
    case 'dietaryCholesterol': return 300; // mg
    case 'dietaryCalcium': return 1000; // mg
    case 'dietaryIron': return 18; // mg
    case 'dietaryPotassium': return 3500; // mg
    case 'dietaryVitaminA': return 900; // µg
    case 'dietaryVitaminC': return 90; // mg
    case 'dietaryVitaminD': return 15; // µg
    default: return 0;
  }
}

/**
 * Generate nutrient recommendation based on daily goal progress
 */
function generateNutrientRecommendation(dataType, percentOfGoal) {
  if (percentOfGoal >= 90 && percentOfGoal <= 110) {
    return `${dataType.replace('dietary', '').toUpperCase()} INTAKE OPTIMAL`;
  } 
  
  if (percentOfGoal < 50) {
    return `${dataType.replace('dietary', '').toUpperCase()} INTAKE VERY LOW`;
  }
  
  if (percentOfGoal < 90) {
    return `INCREASE ${dataType.replace('dietary', '').toUpperCase()} INTAKE`;
  }
  
  if (percentOfGoal > 150) {
    return `${dataType.replace('dietary', '').toUpperCase()} INTAKE EXCESSIVE`;
  }
  
  if (percentOfGoal > 110) {
    return `MODERATE ${dataType.replace('dietary', '').toUpperCase()} INTAKE`;
  }
  
  return `${dataType.replace('dietary', '').toUpperCase()} INTAKE WITHIN RANGE`;
}

/**
 * Calculate progress trend for running/walking speed
 */
function calculateSpeedProgressTrend(speedData) {
  if (!speedData || speedData.length < 5) return 0;
  
  // Group by day to get daily averages
  const speedByDay = {};
  speedData.forEach(item => {
    const day = new Date(item.date).toISOString().split('T')[0];
    if (!speedByDay[day]) {
      speedByDay[day] = { sum: 0, count: 0 };
    }
    speedByDay[day].sum += item.value;
    speedByDay[day].count++;
  });
  
  // Calculate daily averages
  const dailyAverages = Object.entries(speedByDay).map(([day, data]) => ({
    day,
    avgSpeed: data.sum / data.count
  })).sort((a, b) => new Date(b.day) - new Date(a.day)); // Sort newest to oldest
  
  // If we have at least 2 days, calculate trend
  if (dailyAverages.length >= 2) {
    const recentAvg = dailyAverages.slice(0, Math.min(3, dailyAverages.length))
      .reduce((sum, item) => sum + item.avgSpeed, 0) / Math.min(3, dailyAverages.length);
    
    const olderAvg = dailyAverages.slice(Math.min(3, dailyAverages.length))
      .reduce((sum, item) => sum + item.avgSpeed, 0) / Math.max(1, dailyAverages.length - Math.min(3, dailyAverages.length));
    
    return ((recentAvg - olderAvg) / olderAvg) * 100; // Percent change
  }
  
  return 0;
}

/**
 * Assess pace performance relative to baseline
 */
function assessPacePerformance(speedData, dataType) {
  if (!speedData || speedData.length < 3) return 'INSUFFICIENT DATA';
  
  // Calculate average of recent speeds
  const recentAvg = speedData.slice(0, 3)
    .reduce((sum, item) => sum + item.value, 0) / 3;
  
  // Define performance thresholds based on data type
  const thresholds = dataType === 'runningSpeed' ? 
    { excellent: 4, good: 3, average: 2, fair: 1.5 } : // Running (m/s)
    { excellent: 1.8, good: 1.5, average: 1.2, fair: 1 }; // Walking (m/s)
  
  // Assess performance
  if (recentAvg >= thresholds.excellent) return 'EXCELLENT';
  if (recentAvg >= thresholds.good) return 'GOOD';
  if (recentAvg >= thresholds.average) return 'AVERAGE';
  if (recentAvg >= thresholds.fair) return 'FAIR';
  return 'NEEDS IMPROVEMENT';
}

/**
 * Calculate power zones based on running power data
 */
function calculatePowerZones(powerData) {
  if (!powerData || powerData.length < 10) return null;
  
  // Calculate functional threshold power (FTP)
  // In a real app, this would be determined through testing
  // Here we'll estimate it as 95% of the 20-minute maximum
  
  // Sort power values from high to low
  const sortedPower = [...powerData].sort((a, b) => b.value - a.value);
  
  // Use the top 20 values as a proxy for a 20-minute test
  const top20 = sortedPower.slice(0, Math.min(20, sortedPower.length));
  const top20Avg = top20.reduce((sum, item) => sum + item.value, 0) / top20.length;
  
  // Estimate FTP
  const estimatedFTP = top20Avg * 0.95;
  
  // Define power zones
  const zones = {
    zone1: { min: 0, max: Math.round(estimatedFTP * 0.55), name: "RECOVERY", description: "Active recovery" },
    zone2: { min: Math.round(estimatedFTP * 0.56), max: Math.round(estimatedFTP * 0.75), name: "ENDURANCE", description: "Aerobic endurance" },
    zone3: { min: Math.round(estimatedFTP * 0.76), max: Math.round(estimatedFTP * 0.9), name: "TEMPO", description: "Tempo/SubThreshold" },
    zone4: { min: Math.round(estimatedFTP * 0.91), max: Math.round(estimatedFTP * 1.05), name: "THRESHOLD", description: "Lactate threshold" },
    zone5: { min: Math.round(estimatedFTP * 1.06), max: Math.round(estimatedFTP * 1.2), name: "VO2MAX", description: "VO2 Max" },
    zone6: { min: Math.round(estimatedFTP * 1.21), max: Math.round(estimatedFTP * 1.5), name: "ANAEROBIC", description: "Anaerobic capacity" },
    zone7: { min: Math.round(estimatedFTP * 1.51), max: 9999, name: "NEUROMUSCULAR", description: "Neuromuscular power" }
  };
  
  return {
    ftp: Math.round(estimatedFTP),
    zones
  };
}

/**
 * Calculate power efficiency score
 */
function calculatePowerEfficiency(powerData) {
  if (!powerData || powerData.length < 10) return null;
  
  // This would be a complex calculation in a real app
  // For this demo, we'll return a simulated score
  return Math.floor(Math.random() * 20) + 70; // Random score between 70-90
}

/**
 * Process nutrition data from Apple Health
 * @param {Object} healthData - Object containing Apple Health nutrition data, with keys for different nutrition types
 * @returns {Object} Processed nutrition data
 */
export function processNutritionData(healthData = {}) {
  // Default return structure if no data is available
  const defaultNutrition = {
    calories: { consumed: 0, goal: 2200, lastUpdated: getCurrentTime() },
    protein: { consumed: 0, goal: 140, lastUpdated: getCurrentTime() },
    carbs: { consumed: 0, goal: 220, lastUpdated: getCurrentTime() },
    fat: { consumed: 0, goal: 73, lastUpdated: getCurrentTime() },
    water: { consumed: 0, goal: 3, lastUpdated: getCurrentTime() },
    fiber: { consumed: 0, goal: 25, lastUpdated: getCurrentTime() },
    sugar: { consumed: 0, goal: 50, lastUpdated: getCurrentTime() },
    meals: []
  };

  // Check if health data is available
  if (!healthData || Object.keys(healthData).length === 0) {
    return defaultNutrition;
  }

  // Extract the nutrition data arrays
  const energyData = healthData.dietaryEnergy || [];
  const proteinData = healthData.dietaryProtein || [];
  const carbsData = healthData.dietaryCarbs || [];
  const fatData = healthData.dietaryFat || [];
  const waterData = healthData.dietaryWater || [];
  const fiberData = healthData.dietaryFiber || [];
  const sugarData = healthData.dietarySugar || [];

  // Filter only today's data for each nutrient
  const today = new Date().toISOString().split('T')[0];
  
  const todayEnergyData = energyData.filter(item => {
    const itemDate = new Date(item.date).toISOString().split('T')[0];
    return itemDate === today;
  });
  
  const todayProteinData = proteinData.filter(item => {
    const itemDate = new Date(item.date).toISOString().split('T')[0];
    return itemDate === today;
  });
  
  const todayCarbsData = carbsData.filter(item => {
    const itemDate = new Date(item.date).toISOString().split('T')[0];
    return itemDate === today;
  });
  
  const todayFatData = fatData.filter(item => {
    const itemDate = new Date(item.date).toISOString().split('T')[0];
    return itemDate === today;
  });
  
  const todayWaterData = waterData.filter(item => {
    const itemDate = new Date(item.date).toISOString().split('T')[0];
    return itemDate === today;
  });
  
  const todayFiberData = fiberData.filter(item => {
    const itemDate = new Date(item.date).toISOString().split('T')[0];
    return itemDate === today;
  });
  
  const todaySugarData = sugarData.filter(item => {
    const itemDate = new Date(item.date).toISOString().split('T')[0];
    return itemDate === today;
  });

  // Calculate totals
  const totalCalories = todayEnergyData.reduce((sum, item) => sum + item.value, 0);
  const totalProtein = todayProteinData.reduce((sum, item) => sum + item.value, 0);
  const totalCarbs = todayCarbsData.reduce((sum, item) => sum + item.value, 0);
  const totalFat = todayFatData.reduce((sum, item) => sum + item.value, 0);
  const totalWater = todayWaterData.reduce((sum, item) => sum + item.value, 0);
  const totalFiber = todayFiberData.reduce((sum, item) => sum + item.value, 0);
  const totalSugar = todaySugarData.reduce((sum, item) => sum + item.value, 0);

  // Group nutrition entries into meals based on timestamps
  const allNutrientEntries = [
    ...todayEnergyData.map(item => ({ ...item, nutrient: 'calories' })),
    ...todayProteinData.map(item => ({ ...item, nutrient: 'protein' })),
    ...todayCarbsData.map(item => ({ ...item, nutrient: 'carbs' })),
    ...todayFatData.map(item => ({ ...item, nutrient: 'fat' }))
  ];

  // Sort entries by timestamp
  allNutrientEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Group entries into meals (items recorded within 10 minutes of each other)
  const mealGroups = [];
  let currentGroup = [];
  let lastTimestamp = null;

  allNutrientEntries.forEach(entry => {
    const entryTime = new Date(entry.date);
    
    if (lastTimestamp && 
        (entryTime - lastTimestamp) > 10 * 60 * 1000) { // 10 minutes threshold
      // Start a new meal group
      if (currentGroup.length > 0) {
        mealGroups.push([...currentGroup]);
        currentGroup = [];
      }
    }
    
    currentGroup.push(entry);
    lastTimestamp = entryTime;
  });
  
  // Add the last group if it exists
  if (currentGroup.length > 0) {
    mealGroups.push(currentGroup);
  }

  // Create meals from the groups
  const meals = mealGroups.map((group, index) => {
    // Use the most frequent source as the meal name, or a default
    const sources = group.map(entry => entry.source || '').filter(Boolean);
    const sourceCount = {};
    let mostFrequentSource = 'MEAL ' + (index + 1);
    
    sources.forEach(source => {
      sourceCount[source] = (sourceCount[source] || 0) + 1;
      if (sourceCount[source] > (sourceCount[mostFrequentSource] || 0)) {
        mostFrequentSource = source;
      }
    });
    
    // Calculate meal nutrients
    const mealCalories = group
      .filter(entry => entry.nutrient === 'calories')
      .reduce((sum, entry) => sum + entry.value, 0);
      
    const mealProtein = group
      .filter(entry => entry.nutrient === 'protein')
      .reduce((sum, entry) => sum + entry.value, 0);
      
    const mealCarbs = group
      .filter(entry => entry.nutrient === 'carbs')
      .reduce((sum, entry) => sum + entry.value, 0);
      
    const mealFat = group
      .filter(entry => entry.nutrient === 'fat')
      .reduce((sum, entry) => sum + entry.value, 0);
    
    // Use timestamp from first entry in group
    const timestamp = group[0].date;
    
    return {
      id: `meal-${index}-${Date.now()}`,
      name: mostFrequentSource.toUpperCase(),
      time: format(new Date(timestamp), 'HH:mm'),
      timestamp: timestamp,
      calories: Math.round(mealCalories),
      protein: Math.round(mealProtein),
      carbs: Math.round(mealCarbs),
      fat: Math.round(mealFat)
    };
  });

  // Calculate goals based on user profile (simplified example)
  // In a real app, you would calculate this based on user's profile
  const calorieGoal = 2200;
  const proteinGoal = 140;
  const carbsGoal = 220;
  const fatGoal = 73;
  const waterGoal = 3; // liters
  const fiberGoal = 25; // grams
  const sugarGoal = 50; // grams

  return {
    calories: {
      consumed: Math.round(totalCalories),
      goal: calorieGoal,
      lastUpdated: getCurrentTime()
    },
    protein: {
      consumed: Math.round(totalProtein),
      goal: proteinGoal,
      lastUpdated: getCurrentTime()
    },
    carbs: {
      consumed: Math.round(totalCarbs),
      goal: carbsGoal,
      lastUpdated: getCurrentTime()
    },
    fat: {
      consumed: Math.round(totalFat),
      goal: fatGoal,
      lastUpdated: getCurrentTime()
    },
    water: {
      consumed: Math.round(totalWater * 10) / 10, // Round to 1 decimal place
      goal: waterGoal,
      lastUpdated: getCurrentTime()
    },
    fiber: {
      consumed: Math.round(totalFiber),
      goal: fiberGoal,
      lastUpdated: getCurrentTime()
    },
    sugar: {
      consumed: Math.round(totalSugar),
      goal: sugarGoal,
      lastUpdated: getCurrentTime()
    },
    meals
  };
}

/**
 * Process enhancement metrics
 * Calculate more advanced health and fitness metrics and
 * combine them into comprehensive health scores
 */
export function processEnhancementMetrics(healthData = {}) {
  // Default metrics if no data is available
  const defaultMetrics = {
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
  };

  // Initialize comprehensive metrics structure
  let comprehensiveMetrics = {
    individualMetrics: { ...defaultMetrics },
    cardiovascular: {
      restingHeartRate: null,
      heartRateVariability: null,
      oxygenSaturation: null,
      recoveryRate: null,
      vo2Max: null,
      cardioLoad: null,
      overallScore: 0,
      status: 'NO DATA'
    },
    sleep: {
      efficiency: 0,
      deepPercent: 0,
      remPercent: 0,
      awakeTime: 0,
      totalTime: 0,
      recoveryContribution: 0,
      overallScore: 0,
      status: 'NO DATA'
    },
    activity: {
      dailySteps: 0,
      activeMinutes: 0,
      standHours: 0,
      totalCalories: 0,
      activeCalories: 0,
      basalCalories: 0,
      overallScore: 0,
      status: 'NO DATA'
    },
    nutrition: {
      totalCalories: 0,
      macroRatio: {
        protein: 0,
        carbs: 0,
        fat: 0
      },
      hydration: 0,
      overallScore: 0,
      status: 'NO DATA'
    },
    trainingStatus: {
      currentLoad: 0,
      loadRatio: 0,
      overtraining: false,
      detraining: false,
      optimal: false,
      recommendation: 'INSUFFICIENT DATA',
      overallScore: 0,
      status: 'NO DATA'
    }
  };

  // Process health data if available
  if (!healthData) {
    return {
      individualMetrics: defaultMetrics,
      ...comprehensiveMetrics
    };
  }

  // Extract available health data
  const heartRateData = healthData.heartRate?.data || [];
  const restingHRData = healthData.restingHeartRate?.data || [];
  const hrvData = healthData.heartRateVariability?.data || [];
  const sleepData = healthData.sleep?.data || [];
  const vo2MaxData = healthData.vo2max?.data || [];
  const workoutData = healthData.workouts?.data || [];
  const stepData = healthData.steps?.data || [];
  const caloriesData = healthData.calories?.data || [];
  const basalEnergyData = healthData.basalEnergy?.data || [];
  const oxygenSaturationData = healthData.oxygenSaturation?.data || [];
  const dietaryData = {
    energy: healthData.dietaryEnergy?.data || [],
    protein: healthData.dietaryProtein?.data || [],
    carbs: healthData.dietaryCarbs?.data || [],
    fat: healthData.dietaryFat?.data || [],
    water: healthData.dietaryWater?.data || []
  };

  // Initialize individual metrics
  const metrics = { ...defaultMetrics };

  // ---- Calculate Individual Metrics ----

  // Calculate Cardiac Efficiency
  if (heartRateData.length > 0) {
    const restingHR = restingHRData.length > 0 ? 
                      restingHRData[0].value : 
                      healthData.heartRate?.stats?.restingHR || 
                      calculateRestingHeartRate(heartRateData);
    
    // Calculate heart rate recovery metric
    // Lower resting HR and better recovery = better cardiac efficiency
    let cardiacScore = 0;
    
    if (restingHR) {
      // Lower resting heart rate = better score (optimal range 40-60)
      const hrScore = restingHR < 40 ? 100 : restingHR > 100 ? 0 : 100 - (restingHR - 40);
      cardiacScore = hrScore;
      
      // Adjust based on heart rate variability (if available)
      if (hrvData.length > 0) {
        const latestHRV = hrvData[0].value;
        const hrvFactor = latestHRV > 50 ? 1.1 : latestHRV > 30 ? 1 : 0.9;
        cardiacScore = cardiacScore * hrvFactor;
      }
    }
    
    // Sleep affects cardiac efficiency
    if (sleepData.length > 0) {
      const recentSleep = sleepData[0];
      const sleepFactor = recentSleep.value >= 7 ? 1.1 : recentSleep.value >= 6 ? 1 : 0.9;
      cardiacScore = cardiacScore * sleepFactor;
    }
    
    // Assign status based on score
    let status = 'AVERAGE';
    if (cardiacScore >= 90) status = 'SUPERIOR';
    else if (cardiacScore >= 80) status = 'EXCELLENT';
    else if (cardiacScore >= 70) status = 'OPTIMAL';
    else if (cardiacScore >= 60) status = 'GOOD';
    
    // Update cardiac efficiency metrics
    metrics.cardiacEfficiency = {
      current: restingHR || 60,
      status,
      score: Math.round(cardiacScore)
    };
    
    // Update comprehensive cardiovascular metrics
    comprehensiveMetrics.cardiovascular.restingHeartRate = restingHR;
  }

  // Calculate Oxygen Utilization (VO2max based)
  if (vo2MaxData.length > 0) {
    const latestVo2Max = vo2MaxData[0].value;
    
    // Calculate score based on VO2max value
    let vo2maxScore = 0;
    let status = 'AVERAGE';
    
    if (latestVo2Max >= 55) {
      vo2maxScore = 90 + (latestVo2Max - 55) * 0.5; // Superior
      status = 'SUPERIOR';
    } else if (latestVo2Max >= 45) {
      vo2maxScore = 80 + (latestVo2Max - 45); // Excellent
      status = 'EXCELLENT';
    } else if (latestVo2Max >= 35) {
      vo2maxScore = 70 + (latestVo2Max - 35); // Optimal
      status = 'OPTIMAL';
    } else if (latestVo2Max >= 25) {
      vo2maxScore = 50 + (latestVo2Max - 25) * 2; // Average to Good
      status = 'ADVANCED';
    } else {
      vo2maxScore = Math.max(30, latestVo2Max * 2); // Below average
      status = 'DEVELOPING';
    }
    
    metrics.oxygenUtilization = {
      current: latestVo2Max,
      status,
      score: Math.round(vo2maxScore)
    };
    
    // Update comprehensive cardiovascular metrics
    comprehensiveMetrics.cardiovascular.vo2Max = latestVo2Max;
  }

  // Calculate Force Output (based on workout data)
  if (workoutData.length > 0) {
    // Identify strength workouts
    const strengthWorkouts = workoutData.filter(w => 
      (w.type && w.type.toLowerCase().includes('strength')) || 
      (w.type && w.type.toLowerCase().includes('weight'))
    );
    
    const forceScore = strengthWorkouts.length > 5 ? 85 : 
                       strengthWorkouts.length > 3 ? 75 :
                       strengthWorkouts.length > 1 ? 65 : 55;
    
    let status = 'AVERAGE';
    if (forceScore >= 85) status = 'SUPERIOR';
    else if (forceScore >= 75) status = 'EXCELLENT';
    else if (forceScore >= 65) status = 'ADVANCED';
    
    metrics.forceOutput = {
      current: forceScore,
      status,
      score: forceScore
    };
  }

  // Calculate Endurance Matrix
  if (workoutData.length > 0 || vo2MaxData.length > 0) {
    // Combine VO2max with workout data if available
    const vo2maxFactor = metrics.oxygenUtilization.score / 100;
    
    // Look for endurance workouts
    const enduranceWorkouts = workoutData.filter(w => 
      (w.type && w.type.toLowerCase().includes('run')) || 
      (w.type && w.type.toLowerCase().includes('cycl')) ||
      (w.type && w.type.toLowerCase().includes('swim'))
    );
    
    // Calculate base score from workouts
    const workoutFrequencyScore = enduranceWorkouts.length > 5 ? 85 : 
                                  enduranceWorkouts.length > 3 ? 75 :
                                  enduranceWorkouts.length > 1 ? 65 : 55;
    
    // Apply VO2max factor
    const enduranceScore = Math.round(workoutFrequencyScore * (vo2maxFactor || 1));
    
    let status = 'AVERAGE';
    if (enduranceScore >= 85) status = 'SUPERIOR';
    else if (enduranceScore >= 75) status = 'EXCELLENT';
    else if (enduranceScore >= 65) status = 'ADVANCED';
    
    metrics.enduranceMatrix = {
      current: enduranceScore,
      status,
      score: enduranceScore
    };
  }

  // ---- Calculate Comprehensive Metrics ----

  // 1. Complete cardiovascular metrics
  if (heartRateData.length > 0 || restingHRData.length > 0 || hrvData.length > 0) {
    // Get heart rate variability if available
    if (hrvData.length > 0) {
      comprehensiveMetrics.cardiovascular.heartRateVariability = hrvData[0].value;
    }
    
    // Get oxygen saturation if available
    if (oxygenSaturationData.length > 0) {
      comprehensiveMetrics.cardiovascular.oxygenSaturation = oxygenSaturationData[0].value;
    }
    
    // Calculate recovery rate if possible
    if (heartRateData.length > 20) {
      comprehensiveMetrics.cardiovascular.recoveryRate = calculateHeartRateRecovery(heartRateData);
    }
    
    // Calculate cardio load if possible
    if (heartRateData.length > 10) {
      comprehensiveMetrics.cardiovascular.cardioLoad = calculateCardioLoad(heartRateData);
    }
    
    // Calculate overall cardiovascular score
    let cardioScore = 0;
    let scoreComponents = 0;
    
    if (comprehensiveMetrics.cardiovascular.restingHeartRate) {
      // Lower resting HR is better (within limits)
      const rhr = comprehensiveMetrics.cardiovascular.restingHeartRate;
      const rhrScore = rhr < 40 ? 90 : rhr < 50 ? 100 : rhr < 60 ? 90 : rhr < 70 ? 80 : 
                       rhr < 80 ? 60 : rhr < 90 ? 40 : 20;
      cardioScore += rhrScore;
      scoreComponents++;
    }
    
    if (comprehensiveMetrics.cardiovascular.heartRateVariability) {
      // Higher HRV is better
      const hrv = comprehensiveMetrics.cardiovascular.heartRateVariability;
      const hrvScore = hrv > 70 ? 100 : hrv > 50 ? 85 : hrv > 35 ? 70 : hrv > 20 ? 50 : 30;
      cardioScore += hrvScore;
      scoreComponents++;
    }
    
    if (comprehensiveMetrics.cardiovascular.oxygenSaturation) {
      // Higher SpO2 is better
      const spo2 = comprehensiveMetrics.cardiovascular.oxygenSaturation;
      const spo2Score = spo2 >= 98 ? 100 : spo2 >= 95 ? 90 : spo2 >= 92 ? 70 : spo2 >= 88 ? 50 : 30;
      cardioScore += spo2Score;
      scoreComponents++;
    }
    
    if (comprehensiveMetrics.cardiovascular.vo2Max) {
      // Higher VO2max is better
      const vo2max = comprehensiveMetrics.cardiovascular.vo2Max;
      const vo2maxScore = vo2max > 55 ? 100 : vo2max > 45 ? 85 : vo2max > 35 ? 70 : vo2max > 25 ? 50 : 30;
      cardioScore += vo2maxScore;
      scoreComponents++;
    }
    
    if (comprehensiveMetrics.cardiovascular.recoveryRate) {
      // Higher recovery rate is better
      const recoveryRate = comprehensiveMetrics.cardiovascular.recoveryRate;
      const recoveryScore = recoveryRate > 40 ? 100 : recoveryRate > 30 ? 85 : 
                           recoveryRate > 20 ? 70 : recoveryRate > 10 ? 50 : 30;
      cardioScore += recoveryScore;
      scoreComponents++;
    }
    
    // Calculate average score
    if (scoreComponents > 0) {
      const avgScore = Math.round(cardioScore / scoreComponents);
      comprehensiveMetrics.cardiovascular.overallScore = avgScore;
      
      // Determine status
      if (avgScore >= 90) comprehensiveMetrics.cardiovascular.status = 'SUPERIOR';
      else if (avgScore >= 80) comprehensiveMetrics.cardiovascular.status = 'EXCELLENT';
      else if (avgScore >= 70) comprehensiveMetrics.cardiovascular.status = 'GOOD';
      else if (avgScore >= 60) comprehensiveMetrics.cardiovascular.status = 'AVERAGE';
      else if (avgScore >= 40) comprehensiveMetrics.cardiovascular.status = 'FAIR';
      else comprehensiveMetrics.cardiovascular.status = 'NEEDS IMPROVEMENT';
    }
  }
  
  // 2. Complete sleep metrics
  if (sleepData.length > 0) {
    const latestSleep = sleepData[0];
    
    comprehensiveMetrics.sleep.totalTime = latestSleep.value;
    comprehensiveMetrics.sleep.efficiency = latestSleep.sleepEfficiency || calculateSleepEfficiency(latestSleep);
    
    // Calculate sleep stages if available
    if (latestSleep.stages) {
      const { deep, rem, core, awake } = latestSleep.stages;
      const totalSleepTime = deep + rem + core;
      
      comprehensiveMetrics.sleep.deepPercent = totalSleepTime > 0 ? (deep / totalSleepTime) * 100 : 0;
      comprehensiveMetrics.sleep.remPercent = totalSleepTime > 0 ? (rem / totalSleepTime) * 100 : 0;
      comprehensiveMetrics.sleep.awakeTime = awake;
    } else {
      // Estimate if not available
      comprehensiveMetrics.sleep.deepPercent = 20; // Typical is 15-25%
      comprehensiveMetrics.sleep.remPercent = 25; // Typical is 20-25%
      comprehensiveMetrics.sleep.awakeTime = latestSleep.value * 0.05; // Estimate 5% awake time
    }
    
    // Calculate recovery contribution
    const sleepDuration = latestSleep.value;
    const sleepEfficiency = comprehensiveMetrics.sleep.efficiency;
    const deepSleepPercent = comprehensiveMetrics.sleep.deepPercent;
    
    // Calculate recovery score based on these factors
    let recoveryScore = 0;
    
    // Duration factor (optimal 7-9 hours)
    if (sleepDuration >= 7 && sleepDuration <= 9) recoveryScore += 40;
    else if (sleepDuration >= 6 && sleepDuration < 7) recoveryScore += 30;
    else if (sleepDuration >= 5 && sleepDuration < 6) recoveryScore += 20;
    else if (sleepDuration > 9) recoveryScore += 30; // Too much sleep isn't optimal
    else recoveryScore += 10; // Less than 5 hours
    
    // Efficiency factor
    if (sleepEfficiency >= 90) recoveryScore += 40;
    else if (sleepEfficiency >= 80) recoveryScore += 30;
    else if (sleepEfficiency >= 70) recoveryScore += 20;
    else recoveryScore += 10;
    
    // Deep sleep factor
    if (deepSleepPercent >= 25) recoveryScore += 20;
    else if (deepSleepPercent >= 20) recoveryScore += 15;
    else if (deepSleepPercent >= 15) recoveryScore += 10;
    else recoveryScore += 5;
    
    comprehensiveMetrics.sleep.recoveryContribution = recoveryScore;
    comprehensiveMetrics.sleep.overallScore = recoveryScore;
    
    // Determine status
    if (recoveryScore >= 90) comprehensiveMetrics.sleep.status = 'OPTIMAL';
    else if (recoveryScore >= 75) comprehensiveMetrics.sleep.status = 'GOOD';
    else if (recoveryScore >= 60) comprehensiveMetrics.sleep.status = 'ADEQUATE';
    else if (recoveryScore >= 40) comprehensiveMetrics.sleep.status = 'FAIR';
    else comprehensiveMetrics.sleep.status = 'POOR';
  }
  
  // 3. Complete activity metrics
  if (stepData.length > 0 || caloriesData.length > 0 || workoutData.length > 0) {
    // Daily steps
    if (stepData.length > 0) {
      comprehensiveMetrics.activity.dailySteps = calculateDailyTotal(stepData);
    }
    
    // Active calories
    if (caloriesData.length > 0) {
      comprehensiveMetrics.activity.activeCalories = calculateDailyTotal(caloriesData);
    }
    
    // Basal calories
    if (basalEnergyData.length > 0) {
      comprehensiveMetrics.activity.basalCalories = calculateDailyTotal(basalEnergyData);
    }
    
    // Total calories
    comprehensiveMetrics.activity.totalCalories = 
      comprehensiveMetrics.activity.activeCalories + comprehensiveMetrics.activity.basalCalories;
    
    // Active minutes (from workouts)
    if (workoutData.length > 0) {
      const todayWorkouts = workoutData.filter(w => {
        const today = new Date().toISOString().split('T')[0];
        return new Date(w.date).toISOString().split('T')[0] === today;
      });
      
      comprehensiveMetrics.activity.activeMinutes = todayWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    }
    
    // Calculate overall activity score
    let activityScore = 0;
    
    // Steps factor (10,000 steps goal)
    const steps = comprehensiveMetrics.activity.dailySteps;
    if (steps >= 10000) activityScore += 40;
    else if (steps >= 7500) activityScore += 30;
    else if (steps >= 5000) activityScore += 20;
    else if (steps >= 2500) activityScore += 10;
    
    // Active minutes factor (150 minutes per week = ~22 per day)
    const activeMinutes = comprehensiveMetrics.activity.activeMinutes;
    if (activeMinutes >= 30) activityScore += 30;
    else if (activeMinutes >= 20) activityScore += 20;
    else if (activeMinutes >= 10) activityScore += 10;
    
    // Calorie burn factor
    const activeCalories = comprehensiveMetrics.activity.activeCalories;
    if (activeCalories >= 500) activityScore += 30;
    else if (activeCalories >= 300) activityScore += 20;
    else if (activeCalories >= 100) activityScore += 10;
    
    comprehensiveMetrics.activity.overallScore = activityScore;
    
    // Determine status
    if (activityScore >= 80) comprehensiveMetrics.activity.status = 'VERY ACTIVE';
    else if (activityScore >= 60) comprehensiveMetrics.activity.status = 'ACTIVE';
    else if (activityScore >= 40) comprehensiveMetrics.activity.status = 'MODERATELY ACTIVE';
    else if (activityScore >= 20) comprehensiveMetrics.activity.status = 'LIGHTLY ACTIVE';
    else comprehensiveMetrics.activity.status = 'SEDENTARY';
  }
  
  // 4. Complete nutrition metrics
  if (dietaryData.energy.length > 0 || dietaryData.protein.length > 0 || 
      dietaryData.carbs.length > 0 || dietaryData.fat.length > 0) {
    
    // Calculate total calories
    if (dietaryData.energy.length > 0) {
      comprehensiveMetrics.nutrition.totalCalories = calculateDailyTotal(dietaryData.energy);
    }
    
    // Calculate macro distribution
    const totalProtein = dietaryData.protein.length > 0 ? calculateDailyTotal(dietaryData.protein) : 0;
    const totalCarbs = dietaryData.carbs.length > 0 ? calculateDailyTotal(dietaryData.carbs) : 0;
    const totalFat = dietaryData.fat.length > 0 ? calculateDailyTotal(dietaryData.fat) : 0;
    
    // Calculate macro percentages if we have all macros
    if (totalProtein > 0 && totalCarbs > 0 && totalFat > 0) {
      const totalMacroCalories = (totalProtein * 4) + (totalCarbs * 4) + (totalFat * 9);
      
      if (totalMacroCalories > 0) {
        comprehensiveMetrics.nutrition.macroRatio = {
          protein: Math.round((totalProtein * 4 / totalMacroCalories) * 100),
          carbs: Math.round((totalCarbs * 4 / totalMacroCalories) * 100),
          fat: Math.round((totalFat * 9 / totalMacroCalories) * 100)
        };
      }
    }
    
    // Hydration
    if (dietaryData.water.length > 0) {
      comprehensiveMetrics.nutrition.hydration = calculateDailyTotal(dietaryData.water);
    }
    
    // Calculate overall nutrition score
    let nutritionScore = 0;
    let scoreComponents = 0;
    
    // Calorie factor
    if (comprehensiveMetrics.nutrition.totalCalories > 0) {
      // This would be personalized in a real app
      const targetCalories = 2200;
      const calorieRatio = comprehensiveMetrics.nutrition.totalCalories / targetCalories;
      
      // Score highest when between 90-110% of target
      if (calorieRatio >= 0.9 && calorieRatio <= 1.1) nutritionScore += 40;
      else if (calorieRatio >= 0.8 && calorieRatio < 0.9) nutritionScore += 30;
      else if (calorieRatio > 1.1 && calorieRatio <= 1.2) nutritionScore += 30;
      else if (calorieRatio >= 0.7 && calorieRatio < 0.8) nutritionScore += 20;
      else if (calorieRatio > 1.2 && calorieRatio <= 1.3) nutritionScore += 20;
      else nutritionScore += 10;
      
      scoreComponents++;
    }
    
    // Macro balance factor
    if (comprehensiveMetrics.nutrition.macroRatio.protein > 0) {
      const { protein, carbs, fat } = comprehensiveMetrics.nutrition.macroRatio;
      
      // Ideal macro ratio (this would be personalized in a real app)
      // Checking if protein is adequate and macros are relatively balanced
      if (protein >= 25 && protein <= 35 && carbs >= 40 && carbs <= 60 && fat >= 20 && fat <= 35) {
        nutritionScore += 40;
      } else if (protein >= 20 && carbs <= 65 && fat <= 40) {
        nutritionScore += 30;
      } else if (protein >= 15) {
        nutritionScore += 20;
      } else {
        nutritionScore += 10;
      }
      
      scoreComponents++;
    }
    
    // Hydration factor
    if (comprehensiveMetrics.nutrition.hydration > 0) {
      const hydration = comprehensiveMetrics.nutrition.hydration;
      
      if (hydration >= 2.5) nutritionScore += 20;
      else if (hydration >= 2) nutritionScore += 15;
      else if (hydration >= 1.5) nutritionScore += 10;
      else nutritionScore += 5;
      
      scoreComponents++;
    }
    
    // Calculate average score
    if (scoreComponents > 0) {
      comprehensiveMetrics.nutrition.overallScore = 
        Math.round(nutritionScore / scoreComponents * (100 / 40)); // Normalize to 0-100
      
      // Determine status
      const score = comprehensiveMetrics.nutrition.overallScore;
      if (score >= 80) comprehensiveMetrics.nutrition.status = 'OPTIMAL';
      else if (score >= 60) comprehensiveMetrics.nutrition.status = 'GOOD';
      else if (score >= 40) comprehensiveMetrics.nutrition.status = 'ADEQUATE';
      else comprehensiveMetrics.nutrition.status = 'NEEDS IMPROVEMENT';
    }
  }
  
  // 5. Calculate training status
  if (heartRateData.length > 0 || workoutData.length > 0) {
    // This would use complex algorithms in a real app
    // Here we'll simulate based on available data
    
    // Calculate current training load
    let currentLoad = 0;
    
    if (workoutData.length > 0) {
      // Look at recent workouts (last 7 days)
      const recentWorkouts = workoutData.filter(w => {
        const now = new Date();
        const workoutDate = new Date(w.date);
        const diffDays = Math.floor((now - workoutDate) / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      });
      
      // Calculate load based on duration, intensity, and frequency
      const workoutLoad = recentWorkouts.reduce((load, workout) => {
        const duration = workout.duration || 0;
        
        // Estimate intensity based on workout type
        let intensityFactor = 1;
        if (workout.type) {
          const type = workout.type.toLowerCase();
          if (type.includes('hiit') || type.includes('interval')) intensityFactor = 1.5;
          else if (type.includes('strength')) intensityFactor = 1.3;
          else if (type.includes('run')) intensityFactor = 1.2;
        }
        
        return load + (duration * intensityFactor);
      }, 0);
      
      currentLoad = workoutLoad / 60; // Convert to load units
    } else if (heartRateData.length > 0) {
      // Fallback to heart rate data if no workouts
      const cardioLoad = calculateCardioLoad(heartRateData) || 0;
      currentLoad = cardioLoad * 0.5; // Scale factor
    }
    
    // Calculate load ratio (current vs optimal)
    // This would normally compare to a baseline over time
    const optimalLoad = 50; // Example optimal load
    const loadRatio = currentLoad / optimalLoad;
    
    comprehensiveMetrics.trainingStatus.currentLoad = currentLoad;
    comprehensiveMetrics.trainingStatus.loadRatio = loadRatio;
    
    // Determine training status
    if (loadRatio > 1.5) {
      comprehensiveMetrics.trainingStatus.overtraining = true;
      comprehensiveMetrics.trainingStatus.recommendation = 'REDUCE TRAINING LOAD';
      comprehensiveMetrics.trainingStatus.overallScore = 60;
      comprehensiveMetrics.trainingStatus.status = 'OVERREACHING';
    } else if (loadRatio > 1.2) {
      comprehensiveMetrics.trainingStatus.overtraining = false;
      comprehensiveMetrics.trainingStatus.optimal = true;
      comprehensiveMetrics.trainingStatus.recommendation = 'MAINTAIN CURRENT LOAD';
      comprehensiveMetrics.trainingStatus.overallScore = 90;
      comprehensiveMetrics.trainingStatus.status = 'OPTIMAL ADAPTATION';
    } else if (loadRatio > 0.8) {
      comprehensiveMetrics.trainingStatus.overtraining = false;
      comprehensiveMetrics.trainingStatus.optimal = true;
      comprehensiveMetrics.trainingStatus.recommendation = 'MAINTAIN OR SLIGHTLY INCREASE LOAD';
      comprehensiveMetrics.trainingStatus.overallScore = 80;
      comprehensiveMetrics.trainingStatus.status = 'PROGRESSIVE LOADING';
    } else if (loadRatio > 0.5) {
      comprehensiveMetrics.trainingStatus.detraining = false;
      comprehensiveMetrics.trainingStatus.optimal = false;
      comprehensiveMetrics.trainingStatus.recommendation = 'INCREASE TRAINING INTENSITY';
      comprehensiveMetrics.trainingStatus.overallScore = 60;
      comprehensiveMetrics.trainingStatus.status = 'MAINTENANCE';
    } else {
      comprehensiveMetrics.trainingStatus.detraining = true;
      comprehensiveMetrics.trainingStatus.optimal = false;
      comprehensiveMetrics.trainingStatus.recommendation = 'INCREASE TRAINING VOLUME AND FREQUENCY';
      comprehensiveMetrics.trainingStatus.overallScore = 40;
      comprehensiveMetrics.trainingStatus.status = 'DETRAINING';
    }
  }

  return {
    individualMetrics: metrics,
    ...comprehensiveMetrics
  };
}

/**
 * Process user goals and connect with habit system
 */
export function processUserGoals(goalsData, habitData) {
  // Default goals if none are provided
  const defaultGoals = {
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

  if (!goalsData) {
    return defaultGoals;
  }

  // Process goals with habit integration if available
  const processedGoals = { ...goalsData };

  // If habit data is available, update progress based on habit consistency
  if (habitData && habitData.streakData) {
    const streak = habitData.streakData.currentStreak || 0;
    
    // Apply streak bonus to progress (small boost for consistent habits)
    Object.keys(processedGoals).forEach(goalKey => {
      const streakBonus = Math.min(5, streak * 0.5); // Max 5% bonus
      
      if (processedGoals[goalKey].progress) {
        const currentProgress = processedGoals[goalKey].progress;
        processedGoals[goalKey].progress = Math.min(100, currentProgress + streakBonus);
      }
    });
  }

  return processedGoals;
}

/**
 * Get current time formatted as HH:MM:SS
 */
function getCurrentTime() {
  const now = new Date();
  return now.toTimeString().split(' ')[0];
}