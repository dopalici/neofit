/**
 * Apple HealthKit Service
 * Comprehensive health data integration with fitness assessment
 */

import { Capacitor } from '@capacitor/core';

// Import the actual HealthKit plugin
let HealthKit;
if (Capacitor.isNativePlatform()) {
  // Dynamic import for native platform
  try {
    import('capacitor-plugin-healthkit').then(module => {
      HealthKit = module.HealthKit;
    }).catch(error => {
      console.warn('HealthKit plugin not available:', error);
      HealthKit = createMockHealthKit();
    });
  } catch (error) {
    console.warn('HealthKit plugin import failed:', error);
    HealthKit = createMockHealthKit();
  }
} else {
  // Mock for web development with sample data
  HealthKit = createMockHealthKit();
}

function createMockHealthKit() {
  return {
    isAvailable: () => Promise.resolve({ available: false }),
    requestAuthorization: () => Promise.resolve({ authorized: false }),
    queryHealthData: (params) => {
      // Return mock data based on data type
      const mockData = generateMockHealthData(params?.dataType, params?.period);
      return Promise.resolve({ data: mockData });
    },
    queryWorkouts: () => Promise.resolve({ 
      data: generateMockWorkouts() 
    }),
    querySleepData: () => Promise.resolve({ 
      data: generateMockSleepData() 
    })
  };
}

/**
 * Generate mock health data for web development
 */
function generateMockHealthData(dataType, period = 'week') {
  const now = new Date();
  const days = period === 'day' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : 365;
  const data = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);
    let value, unit;
    
    switch (dataType) {
      case 'steps':
        value = Math.floor(Math.random() * 5000) + 8000;
        unit = 'count';
        break;
      case 'heartRate':
        value = Math.floor(Math.random() * 30) + 60;
        unit = 'bpm';
        break;
      case 'weight':
        value = 70 + Math.random() * 20;
        unit = 'kg';
        break;
      case 'calories':
        value = Math.floor(Math.random() * 800) + 1800;
        unit = 'kcal';
        break;
      case 'distance':
        value = Math.random() * 10000 + 2000;
        unit = 'm';
        break;
      default:
        value = Math.random() * 100;
        unit = 'count';
    }
    
    data.push({
      date: date.toISOString(),
      value,
      unit
    });
  }
  
  return data;
}

function generateMockWorkouts() {
  const workoutTypes = ['Running', 'Cycling', 'Swimming', 'Strength Training', 'Yoga'];
  const workouts = [];
  
  for (let i = 0; i < 10; i++) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    workouts.push({
      type: workoutTypes[Math.floor(Math.random() * workoutTypes.length)],
      date: date.toISOString(),
      duration: Math.floor(Math.random() * 60) + 30,
      calories: Math.floor(Math.random() * 500) + 200
    });
  }
  
  return workouts;
}

function generateMockSleepData() {
  const sleepData = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    sleepData.push({
      date: date.toISOString(),
      value: Math.random() * 2 + 7, // 7-9 hours
      unit: 'hours',
      sleepEfficiency: Math.random() * 20 + 80 // 80-100%
    });
  }
  
  return sleepData;
}

/**
 * Apple Health Service Class
 * Manages all health data fetching and processing
 */
class AppleHealthService {
  constructor() {
    this.isInitialized = false;
    this.hasPermissions = false;
    this.cachedData = {};
    this.lastFetch = {};
    this.userProfile = null;
    this.isNativePlatform = Capacitor.isNativePlatform();
  }

  /**
   * Initialize the service and check availability
   */
  async initialize() {
    try {
      const { available } = await HealthKit.isAvailable();
      if (available) {
        this.isInitialized = true;
        console.log('HealthKit is available');
        return true;
      }
      if (Capacitor.isNativePlatform()) {
        console.log('HealthKit not available on this device');
      } else {
        console.log('HealthKit not available - running in web mode with mock data');
      }
      return false;
    } catch (error) {
      if (!Capacitor.isNativePlatform()) {
        console.log('Running in web mode - HealthKit functionality mocked');
        return false;
      }
      console.error('Error initializing HealthKit:', error);
      return false;
    }
  }

  /**
   * Request all necessary permissions
   */
  async requestPermissions() {
    try {
      const { authorized } = await HealthKit.requestAuthorization();
      this.hasPermissions = authorized;
      return authorized;
    } catch (error) {
      console.error('Error requesting HealthKit permissions:', error);
      return false;
    }
  }

  /**
   * Set user profile for personalized calculations
   */
  setUserProfile(profile) {
    this.userProfile = profile;
  }

  /**
   * Get comprehensive health data for fitness assessment
   */
  async getComprehensiveHealthData() {
    if (!this.isNativePlatform) {
      // Return mock data for web development
      return this.getMockComprehensiveHealthData();
    }

    if (!this.hasPermissions) {
      await this.requestPermissions();
    }

    const data = {
      timestamp: new Date().toISOString(),
      cardiovascular: await this.getCardiovascularData(),
      activity: await this.getActivityData(),
      bodyComposition: await this.getBodyCompositionData(),
      sleep: await this.getSleepAnalysis(),
      nutrition: await this.getNutritionData(),
      workouts: await this.getWorkoutSummary(),
      mentalHealth: await this.getMentalHealthData(),
      environmental: await this.getEnvironmentalData()
    };

    this.cachedData.comprehensive = data;
    this.lastFetch.comprehensive = Date.now();

    return data;
  }

  /**
   * CARDIOVASCULAR DATA
   */
  async getCardiovascularData() {
    const [heartRate, restingHR, hrv, vo2Max, bloodOxygen, respiratoryRate] = await Promise.all([
      this.fetchHealthData('heartRate', 'day'),
      this.fetchHealthData('restingHeartRate', 'week'),
      this.fetchHealthData('heartRateVariability', 'week'),
      this.fetchHealthData('vo2Max', 'month'),
      this.fetchHealthData('oxygenSaturation', 'day'),
      this.fetchHealthData('respiratoryRate', 'day')
    ]);

    return {
      heartRate: this.processHeartRateData(heartRate),
      heartRateVariability: this.processHRVData(hrv),
      vo2Max: this.processVO2MaxData(vo2Max),
      bloodOxygen: this.processBloodOxygenData(bloodOxygen),
      respiratoryRate: this.calculateAverage(respiratoryRate),
      bodyTemperature: await this.getLatestValue('bodyTemperature')
    };
  }

  /**
   * ACTIVITY DATA
   */
  async getActivityData() {
    const [steps, distance, calories, basalEnergy, exerciseTime, standTime] = await Promise.all([
      this.fetchHealthData('steps', 'week'),
      this.fetchHealthData('distance', 'week'),
      this.fetchHealthData('calories', 'week'),
      this.fetchHealthData('basalEnergy', 'week'),
      this.fetchHealthData('exerciseTime', 'week'),
      this.fetchHealthData('standTime', 'week')
    ]);

    const moveMetrics = await this.getMoveMetrics();

    return {
      steps: this.processStepsData(steps),
      distance: this.processDistanceData(distance),
      calories: this.processCaloriesData(calories, basalEnergy),
      exerciseTime: this.processExerciseTime(exerciseTime),
      standHours: this.processStandTime(standTime),
      moveMetrics
    };
  }

  /**
   * BODY COMPOSITION DATA
   */
  async getBodyCompositionData() {
    const [weight, height, bodyFat, leanMass, waist] = await Promise.all([
      this.fetchHealthData('weight', 'month'),
      this.getLatestValue('height'),
      this.getLatestValue('bodyFatPercentage'),
      this.getLatestValue('leanBodyMass'),
      this.getLatestValue('waistCircumference')
    ]);

    const currentWeight = this.getLatestFromArray(weight);
    const bmi = this.calculateBMI(currentWeight, height);

    return {
      weight: this.processWeightData(weight),
      height,
      bmi: this.processBMIData(bmi),
      bodyFat: this.processBodyFatData(bodyFat),
      muscleMass: leanMass ? { value: leanMass, percentage: (leanMass / currentWeight) * 100 } : null,
      waistCircumference: waist
    };
  }

  /**
   * SLEEP ANALYSIS
   */
  async getSleepAnalysis() {
    // Use the dedicated sleep query method
    let sleepData = [];
    try {
      const result = await HealthKit.querySleepData({ period: 'month' });
      sleepData = result.data || [];
    } catch (error) {
      console.error('Error fetching sleep data:', error);
      sleepData = [];
    }
    const processed = this.processSleepData(sleepData);

    return {
      lastNight: processed.lastNight,
      weeklyAverage: processed.weeklyAverage,
      monthlyAverage: processed.monthlyAverage,
      trend: this.calculateTrend(processed.weeklyTrend),
      consistency: processed.consistency,
      quality: this.assessSleepQuality(processed)
    };
  }

  /**
   * NUTRITION DATA
   */
  async getNutritionData() {
    const [energy, protein, carbs, fat, water, fiber, sugar, sodium] = await Promise.all([
      this.fetchHealthData('dietaryEnergy', 'day'),
      this.fetchHealthData('dietaryProtein', 'day'),
      this.fetchHealthData('dietaryCarbs', 'day'),
      this.fetchHealthData('dietaryFat', 'day'),
      this.fetchHealthData('dietaryWater', 'day'),
      this.fetchHealthData('dietaryFiber', 'day'),
      this.fetchHealthData('dietarySugar', 'day'),
      this.fetchHealthData('dietarySodium', 'day')
    ]);

    const micronutrients = await this.getMicronutrients();

    return {
      calories: this.processCalorieIntake(energy),
      macros: this.processMacros(protein, carbs, fat),
      hydration: this.processHydration(water),
      micronutrients
    };
  }

  /**
   * WORKOUT SUMMARY
   */
  async getWorkoutSummary() {
    const workouts = await HealthKit.queryWorkouts({ period: 'month' });
    const processed = this.processWorkoutData(workouts.data);

    return {
      recent: processed.recent.slice(0, 10),
      weeklyCount: processed.weeklyCount,
      monthlyCount: processed.monthlyCount,
      favoriteTypes: processed.favoriteTypes,
      totalDuration: processed.totalDuration,
      averageIntensity: processed.averageIntensity
    };
  }

  /**
   * MENTAL HEALTH DATA
   */
  async getMentalHealthData() {
    const mindfulSessions = await this.fetchHealthData('mindfulSession', 'week');
    
    return {
      mindfulMinutes: this.calculateTotalMinutes(mindfulSessions),
      stress: await this.estimateStressLevel(),
      mood: await this.estimateMoodLevel()
    };
  }

  /**
   * ENVIRONMENTAL DATA
   */
  async getEnvironmentalData() {
    const timeInDaylight = await this.fetchHealthData('timeInDaylight', 'day');
    
    return {
      timeInDaylight: this.calculateAverage(timeInDaylight)
    };
  }

  /**
   * FITNESS ASSESSMENT
   * Calculate comprehensive fitness score and provide recommendations
   */
  async calculateFitnessAssessment() {
    const healthData = await this.getComprehensiveHealthData();
    
    const scores = {
      cardiovascular: this.calculateCardiovascularScore(healthData.cardiovascular),
      activity: this.calculateActivityScore(healthData.activity),
      bodyComposition: this.calculateBodyCompositionScore(healthData.bodyComposition),
      recovery: this.calculateRecoveryScore(healthData.sleep),
      nutrition: this.calculateNutritionScore(healthData.nutrition)
    };

    const overallScore = this.calculateOverallFitnessScore(scores);
    const category = this.getFitnessCategory(overallScore);

    return {
      timestamp: new Date().toISOString(),
      overallScore,
      category,
      components: scores,
      strengths: this.identifyStrengths(scores),
      weaknesses: this.identifyWeaknesses(scores),
      trends: await this.analyzeTrends(),
      recommendations: this.generateRecommendations(healthData, scores),
      comparison: this.getComparison(overallScore)
    };
  }

  /**
   * SCORING ALGORITHMS
   */
  
  calculateCardiovascularScore(data) {
    const scores = {
      vo2Max: this.normalizeVO2Max(data.vo2Max?.value) * 0.40,
      restingHR: this.normalizeRestingHR(data.heartRate?.resting) * 0.25,
      hrv: this.normalizeHRV(data.heartRateVariability?.value) * 0.20,
      bloodOxygen: this.normalizeBloodOxygen(data.bloodOxygen?.value) * 0.15
    };

    const totalScore = Object.values(scores).reduce((sum, score) => sum + (score || 0), 0);
    
    return {
      score: Math.round(totalScore),
      category: this.getFitnessCategory(totalScore),
      subScores: scores
    };
  }

  calculateActivityScore(data) {
    const scores = {
      steps: this.normalizeSteps(data.steps?.daily) * 0.30,
      exerciseTime: this.normalizeExerciseTime(data.exerciseTime?.daily) * 0.35,
      activeCalories: this.normalizeActiveCalories(data.calories?.active) * 0.20,
      consistency: this.calculateConsistency(data) * 0.15
    };

    const totalScore = Object.values(scores).reduce((sum, score) => sum + (score || 0), 0);
    
    return {
      score: Math.round(totalScore),
      category: this.getFitnessCategory(totalScore),
      subScores: scores
    };
  }

  calculateBodyCompositionScore(data) {
    const scores = {
      bmi: this.normalizeBMI(data.bmi?.value) * 0.30,
      bodyFat: this.normalizeBodyFat(data.bodyFat?.percentage) * 0.40,
      muscleMass: this.normalizeMuscleMass(data.muscleMass?.percentage) * 0.30
    };

    const totalScore = Object.values(scores).reduce((sum, score) => sum + (score || 0), 0);
    
    return {
      score: Math.round(totalScore),
      category: this.getFitnessCategory(totalScore),
      subScores: scores
    };
  }

  calculateRecoveryScore(data) {
    const scores = {
      sleepDuration: this.normalizeSleepDuration(data.weeklyAverage) * 0.40,
      sleepQuality: this.normalizeSleepQuality(data.quality) * 0.30,
      consistency: this.normalizeSleepConsistency(data.consistency) * 0.30
    };

    const totalScore = Object.values(scores).reduce((sum, score) => sum + (score || 0), 0);
    
    return {
      score: Math.round(totalScore),
      category: this.getFitnessCategory(totalScore),
      subScores: scores
    };
  }

  calculateNutritionScore(data) {
    const weight = this.userProfile?.weight || 70; // Default 70kg
    
    const scores = {
      proteinIntake: this.normalizeProtein(data.macros?.protein?.value, weight) * 0.35,
      hydration: this.normalizeHydration(data.hydration?.water, weight) * 0.25,
      macroBalance: this.calculateMacroBalance(data.macros) * 0.25,
      calorieBalance: this.normalizeCalorieBalance(data.calories) * 0.15
    };

    const totalScore = Object.values(scores).reduce((sum, score) => sum + (score || 0), 0);
    
    return {
      score: Math.round(totalScore),
      category: this.getFitnessCategory(totalScore),
      subScores: scores
    };
  }

  calculateOverallFitnessScore(componentScores) {
    const weights = {
      cardiovascular: 0.35,
      activity: 0.25,
      bodyComposition: 0.15,
      recovery: 0.15,
      nutrition: 0.10
    };

    let totalScore = 0;
    for (const [component, weight] of Object.entries(weights)) {
      totalScore += (componentScores[component]?.score || 0) * weight;
    }

    return Math.round(totalScore);
  }

  /**
   * NORMALIZATION FUNCTIONS
   */
  
  normalizeVO2Max(value) {
    if (!value) return 0;
    const age = this.userProfile?.age || 30;
    const gender = this.userProfile?.gender || 'male';
    
    // Age and gender adjusted standards
    const standards = this.getVO2MaxStandards(age, gender);
    
    if (value >= standards.superior) return 100;
    if (value >= standards.excellent) return 85;
    if (value >= standards.good) return 70;
    if (value >= standards.fair) return 50;
    if (value >= standards.poor) return 30;
    return 15;
  }

  normalizeRestingHR(value) {
    if (!value) return 0;
    if (value < 50) return 100;
    if (value < 60) return 85;
    if (value < 70) return 70;
    if (value < 80) return 50;
    return Math.max(0, 100 - (value - 50) * 2);
  }

  normalizeHRV(value) {
    if (!value) return 0;
    const age = this.userProfile?.age || 30;
    const ageMultiplier = Math.max(0.5, 1 - (age - 20) * 0.01);
    const adjustedHRV = value / ageMultiplier;
    
    if (adjustedHRV > 60) return 100;
    if (adjustedHRV > 45) return 80;
    if (adjustedHRV > 30) return 60;
    if (adjustedHRV > 20) return 40;
    return adjustedHRV * 2;
  }

  normalizeBloodOxygen(value) {
    if (!value) return 0;
    if (value >= 98) return 100;
    if (value >= 95) return 85;
    if (value >= 92) return 60;
    if (value >= 90) return 40;
    return 20;
  }

  normalizeSteps(value) {
    if (!value) return 0;
    if (value >= 12000) return 100;
    if (value >= 10000) return 85;
    if (value >= 8000) return 70;
    if (value >= 6000) return 55;
    if (value >= 4000) return 40;
    return (value / 10000) * 100;
  }

  normalizeExerciseTime(value) {
    if (!value) return 0;
    if (value >= 60) return 100;
    if (value >= 45) return 85;
    if (value >= 30) return 70;
    if (value >= 20) return 55;
    if (value >= 10) return 40;
    return (value / 60) * 100;
  }

  normalizeActiveCalories(value) {
    if (!value) return 0;
    if (value >= 600) return 100;
    if (value >= 500) return 85;
    if (value >= 400) return 70;
    if (value >= 300) return 55;
    if (value >= 200) return 40;
    return (value / 600) * 100;
  }

  normalizeBMI(value) {
    if (!value) return 0;
    if (value >= 18.5 && value <= 24.9) return 100;
    if (value >= 25 && value <= 29.9) return 70;
    if (value >= 17 && value < 18.5) return 70;
    if (value >= 30 && value <= 34.9) return 40;
    return 20;
  }

  normalizeBodyFat(value) {
    if (!value) return 0;
    const gender = this.userProfile?.gender || 'male';
    
    if (gender === 'male') {
      if (value <= 8) return 100;
      if (value <= 15) return 85;
      if (value <= 20) return 70;
      if (value <= 25) return 50;
      return 30;
    } else {
      if (value <= 15) return 100;
      if (value <= 22) return 85;
      if (value <= 28) return 70;
      if (value <= 33) return 50;
      return 30;
    }
  }

  normalizeMuscleMass(value) {
    if (!value) return 0;
    const gender = this.userProfile?.gender || 'male';
    
    if (gender === 'male') {
      if (value >= 40) return 100;
      if (value >= 35) return 80;
      if (value >= 30) return 60;
      return 40;
    } else {
      if (value >= 35) return 100;
      if (value >= 30) return 80;
      if (value >= 25) return 60;
      return 40;
    }
  }

  normalizeSleepDuration(value) {
    if (!value) return 0;
    if (value >= 7 && value <= 9) return 100;
    if (value >= 6 && value < 7) return 75;
    if (value > 9 && value <= 10) return 75;
    if (value >= 5 && value < 6) return 50;
    return 30;
  }

  normalizeSleepQuality(quality) {
    const qualityScores = {
      'excellent': 100,
      'good': 75,
      'fair': 50,
      'poor': 25
    };
    return qualityScores[quality] || 0;
  }

  normalizeSleepConsistency(value) {
    if (!value) return 0;
    return Math.min(100, value);
  }

  normalizeProtein(value, weight) {
    if (!value || !weight) return 0;
    const gramsPerKg = value / weight;
    
    if (gramsPerKg >= 1.6 && gramsPerKg <= 2.2) return 100;
    if (gramsPerKg >= 1.2 && gramsPerKg < 1.6) return 75;
    if (gramsPerKg >= 0.8 && gramsPerKg < 1.2) return 50;
    return 30;
  }

  normalizeHydration(value, weight) {
    if (!value || !weight) return 0;
    const mlPerKg = value / weight;
    
    if (mlPerKg >= 35) return 100;
    if (mlPerKg >= 30) return 75;
    if (mlPerKg >= 25) return 50;
    return 30;
  }

  calculateMacroBalance(macros) {
    if (!macros) return 0;
    
    const idealRatios = {
      protein: 0.30,
      carbs: 0.40,
      fat: 0.30
    };
    
    let totalDeviation = 0;
    for (const [macro, ideal] of Object.entries(idealRatios)) {
      const actual = macros[macro]?.percentage / 100 || 0;
      totalDeviation += Math.abs(actual - ideal);
    }
    
    return Math.max(0, 100 - (totalDeviation * 100));
  }

  normalizeCalorieBalance(calories) {
    if (!calories) return 0;
    
    const deficit = calories.deficit || 0;
    const surplus = calories.surplus || 0;
    
    if (Math.abs(deficit) <= 500 || Math.abs(surplus) <= 500) return 100;
    if (Math.abs(deficit) <= 750 || Math.abs(surplus) <= 750) return 75;
    if (Math.abs(deficit) <= 1000 || Math.abs(surplus) <= 1000) return 50;
    return 30;
  }

  /**
   * HELPER FUNCTIONS
   */
  
  async fetchHealthData(dataType, period = 'day') {
    try {
      // Check if HealthKit is available
      if (!HealthKit || !HealthKit.queryHealthData) {
        console.warn('HealthKit not available');
        return [];
      }
      
      const result = await HealthKit.queryHealthData({ dataType, period });
      return result.data || [];
    } catch (error) {
      // Don't log errors for unsupported data types
      if (error.message && !error.message.includes('Unsupported data type')) {
        console.error(`Error fetching ${dataType}:`, error);
      }
      return [];
    }
  }

  async getLatestValue(dataType) {
    try {
      const data = await this.fetchHealthData(dataType, 'month');
      return this.getLatestFromArray(data);
    } catch (error) {
      // Return null for unsupported data types
      return null;
    }
  }

  getLatestFromArray(dataArray) {
    if (!dataArray || dataArray.length === 0) return null;
    return dataArray[0].value;
  }

  calculateAverage(dataArray) {
    if (!dataArray || dataArray.length === 0) return 0;
    const sum = dataArray.reduce((acc, item) => acc + item.value, 0);
    return sum / dataArray.length;
  }

  calculateTrend(values) {
    if (!values || values.length < 2) return 'stable';
    
    const recentAvg = values.slice(0, Math.floor(values.length / 2)).reduce((a, b) => a + b, 0) / (values.length / 2);
    const olderAvg = values.slice(Math.floor(values.length / 2)).reduce((a, b) => a + b, 0) / (values.length / 2);
    
    const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (changePercent > 5) return 'improving';
    if (changePercent < -5) return 'declining';
    return 'stable';
  }

  getFitnessCategory(score) {
    if (score >= 90) return 'elite';
    if (score >= 80) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 50) return 'below_average';
    if (score >= 40) return 'poor';
    return 'very_poor';
  }

  getVO2MaxStandards(age, gender) {
    const standards = {
      male: {
        '20-29': { poor: 35, fair: 40, good: 45, excellent: 52, superior: 60 },
        '30-39': { poor: 34, fair: 38, good: 43, excellent: 48, superior: 56 },
        '40-49': { poor: 32, fair: 35, good: 40, excellent: 45, superior: 52 },
        '50-59': { poor: 30, fair: 33, good: 37, excellent: 42, superior: 48 },
        '60+': { poor: 26, fair: 30, good: 33, excellent: 38, superior: 44 }
      },
      female: {
        '20-29': { poor: 28, fair: 33, good: 37, excellent: 42, superior: 49 },
        '30-39': { poor: 27, fair: 31, good: 35, excellent: 40, superior: 45 },
        '40-49': { poor: 25, fair: 29, good: 32, excellent: 37, superior: 42 },
        '50-59': { poor: 23, fair: 27, good: 30, excellent: 34, superior: 39 },
        '60+': { poor: 22, fair: 25, good: 27, excellent: 31, superior: 36 }
      }
    };
    
    let ageGroup = '20-29';
    if (age >= 60) ageGroup = '60+';
    else if (age >= 50) ageGroup = '50-59';
    else if (age >= 40) ageGroup = '40-49';
    else if (age >= 30) ageGroup = '30-39';
    
    return standards[gender]?.[ageGroup] || standards.male['30-39'];
  }

  identifyStrengths(scores) {
    const strengths = [];
    for (const [component, data] of Object.entries(scores)) {
      if (data.score >= 70) {
        strengths.push(component.charAt(0).toUpperCase() + component.slice(1));
      }
    }
    return strengths;
  }

  identifyWeaknesses(scores) {
    const weaknesses = [];
    for (const [component, data] of Object.entries(scores)) {
      if (data.score < 50) {
        weaknesses.push(component.charAt(0).toUpperCase() + component.slice(1));
      }
    }
    return weaknesses;
  }

  async analyzeTrends() {
    // This would analyze historical data to identify trends
    // For now, returning placeholder data
    return {
      improving: ['Heart Rate Variability', 'Daily Steps'],
      declining: [],
      stable: ['Weight', 'Sleep Duration']
    };
  }

  generateRecommendations(healthData, scores) {
    const recommendations = [];
    
    // Cardiovascular recommendations
    if (scores.cardiovascular.score < 70) {
      recommendations.push({
        category: 'exercise',
        priority: 'high',
        title: 'Improve Cardiovascular Fitness',
        description: 'Your cardiovascular fitness could be improved',
        expectedImpact: '15-20% improvement in 8 weeks',
        timeframe: '8 weeks',
        actions: [
          'Add 3x 30-minute cardio sessions per week',
          'Include interval training once per week',
          'Monitor heart rate during exercise'
        ]
      });
    }
    
    // Activity recommendations
    if (scores.activity.score < 70) {
      recommendations.push({
        category: 'lifestyle',
        priority: 'medium',
        title: 'Increase Daily Activity',
        description: 'Your daily activity levels are below optimal',
        expectedImpact: '10-15% improvement in 4 weeks',
        timeframe: '4 weeks',
        actions: [
          'Aim for 10,000 steps daily',
          'Take walking breaks every hour',
          'Use stairs instead of elevators'
        ]
      });
    }
    
    // Sleep recommendations
    if (scores.recovery.score < 70) {
      recommendations.push({
        category: 'recovery',
        priority: 'high',
        title: 'Optimize Sleep Quality',
        description: 'Your recovery metrics indicate suboptimal sleep',
        expectedImpact: '20-30% improvement in 2 weeks',
        timeframe: '2 weeks',
        actions: [
          'Maintain consistent sleep schedule',
          'Create a bedtime routine',
          'Limit screen time before bed',
          'Keep bedroom cool and dark'
        ]
      });
    }
    
    // Nutrition recommendations
    if (scores.nutrition.score < 70) {
      recommendations.push({
        category: 'nutrition',
        priority: 'medium',
        title: 'Improve Nutritional Balance',
        description: 'Your nutrition could be optimized',
        expectedImpact: '10-20% improvement in 4 weeks',
        timeframe: '4 weeks',
        actions: [
          'Track macronutrients daily',
          'Increase protein intake to 1.6g/kg body weight',
          'Drink 35ml water per kg body weight',
          'Add more whole foods to diet'
        ]
      });
    }
    
    return recommendations;
  }

  getComparison(score) {
    // This would compare against population data
    // For now, returning estimated percentiles
    return {
      ageGroup: {
        percentile: Math.min(99, Math.max(1, score + 10)),
        category: this.getFitnessCategory(score)
      },
      gender: {
        percentile: Math.min(99, Math.max(1, score + 5)),
        category: this.getFitnessCategory(score)
      },
      global: {
        percentile: Math.min(99, Math.max(1, score)),
        category: this.getFitnessCategory(score)
      }
    };
  }

  /**
   * PROCESSING FUNCTIONS
   */
  
  processHeartRateData(data) {
    if (!data || data.length === 0) return {};
    
    const values = data.map(d => d.value);
    const zones = this.calculateHeartRateZones(values);
    
    return {
      current: values[0],
      average: this.calculateAverage(data),
      max: Math.max(...values),
      min: Math.min(...values),
      zones
    };
  }

  calculateHeartRateZones(heartRates) {
    const maxHR = 220 - (this.userProfile?.age || 30);
    
    return {
      rest: { min: 0, max: maxHR * 0.5 },
      warmup: { min: maxHR * 0.5, max: maxHR * 0.6 },
      fatBurn: { min: maxHR * 0.6, max: maxHR * 0.7 },
      cardio: { min: maxHR * 0.7, max: maxHR * 0.85 },
      peak: { min: maxHR * 0.85, max: maxHR }
    };
  }

  processHRVData(data) {
    if (!data || data.length === 0) return {};
    
    const values = data.map(d => d.value);
    const average = this.calculateAverage(data);
    const trend = this.calculateTrend(values);
    
    return {
      value: average,
      trend
    };
  }

  processVO2MaxData(data) {
    if (!data || data.length === 0) return {};
    
    const value = this.getLatestFromArray(data);
    const category = this.getVO2MaxCategory(value);
    
    return {
      value,
      category,
      percentile: this.getVO2MaxPercentile(value)
    };
  }

  getVO2MaxCategory(value) {
    const age = this.userProfile?.age || 30;
    const gender = this.userProfile?.gender || 'male';
    const standards = this.getVO2MaxStandards(age, gender);
    
    if (value >= standards.superior) return 'superior';
    if (value >= standards.excellent) return 'excellent';
    if (value >= standards.good) return 'good';
    if (value >= standards.fair) return 'fair';
    return 'poor';
  }

  getVO2MaxPercentile(value) {
    // Simplified percentile calculation
    const normalized = this.normalizeVO2Max(value);
    return Math.min(99, Math.max(1, normalized));
  }

  processBloodOxygenData(data) {
    if (!data || data.length === 0) return {};
    
    const value = this.calculateAverage(data);
    
    return {
      value,
      status: value >= 95 ? 'normal' : 'low'
    };
  }

  processStepsData(data) {
    if (!data || data.length === 0) return {};
    
    const values = data.map(d => d.value);
    const daily = values[0] || 0;
    const weeklyAverage = this.calculateAverage(data);
    
    return {
      daily,
      weeklyAverage,
      monthlyAverage: weeklyAverage, // Simplified for now
      goal: 10000,
      trend: this.calculateTrend(values)
    };
  }

  processDistanceData(data) {
    if (!data || data.length === 0) return {};
    
    const daily = this.getLatestFromArray(data) || 0;
    
    return {
      daily: daily / 1000, // Convert to km
      unit: 'km'
    };
  }

  processCaloriesData(activeData, basalData) {
    const active = this.calculateAverage(activeData) || 0;
    const basal = this.calculateAverage(basalData) || 0;
    
    return {
      active,
      basal,
      total: active + basal
    };
  }

  processExerciseTime(data) {
    const daily = this.getLatestFromArray(data) || 0;
    const weeklyTotal = data.slice(0, 7).reduce((sum, d) => sum + (d.value || 0), 0);
    
    return {
      daily,
      weeklyTotal,
      goal: 30
    };
  }

  processStandTime(data) {
    const daily = this.getLatestFromArray(data) || 0;
    
    return {
      daily,
      goal: 12
    };
  }

  async getMoveMetrics() {
    const [walkingSpeed, runningSpeed, runningPower] = await Promise.all([
      this.getLatestValue('walkingSpeed'),
      this.getLatestValue('runningSpeed'),
      this.getLatestValue('runningPower')
    ]);
    
    return {
      walkingSpeed,
      runningSpeed,
      runningPower
    };
  }

  processWeightData(data) {
    if (!data || data.length === 0) return {};
    
    const current = this.getLatestFromArray(data) || 0;
    const weekAgo = data.find(d => {
      const date = new Date(d.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date <= weekAgo;
    });
    
    const weeklyChange = weekAgo ? current - weekAgo.value : 0;
    
    return {
      current,
      unit: 'kg',
      trend: weeklyChange > 0.5 ? 'gaining' : weeklyChange < -0.5 ? 'losing' : 'stable',
      weeklyChange
    };
  }

  calculateBMI(weight, height) {
    if (!weight || !height) return null;
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  }

  processBMIData(bmi) {
    if (!bmi) return {};
    
    let category = 'normal';
    if (bmi < 18.5) category = 'underweight';
    else if (bmi >= 25 && bmi < 30) category = 'overweight';
    else if (bmi >= 30) category = 'obese';
    
    return {
      value: bmi,
      category
    };
  }

  processBodyFatData(percentage) {
    if (!percentage) return {};
    
    const gender = this.userProfile?.gender || 'male';
    let category = 'average';
    
    if (gender === 'male') {
      if (percentage < 6) category = 'essential';
      else if (percentage < 14) category = 'athletic';
      else if (percentage < 18) category = 'fit';
      else if (percentage < 25) category = 'average';
      else category = 'obese';
    } else {
      if (percentage < 14) category = 'essential';
      else if (percentage < 21) category = 'athletic';
      else if (percentage < 25) category = 'fit';
      else if (percentage < 32) category = 'average';
      else category = 'obese';
    }
    
    return {
      percentage,
      category
    };
  }

  processSleepData(data) {
    if (!data || data.length === 0) return {};
    
    const lastNight = data[0] || {};
    const weekData = data.slice(0, 7);
    const monthData = data.slice(0, 30);
    
    const weeklyAverage = weekData.reduce((sum, d) => sum + (d.value || 0), 0) / weekData.length;
    const monthlyAverage = monthData.reduce((sum, d) => sum + (d.value || 0), 0) / monthData.length;
    
    const weeklyTrend = weekData.map(d => d.value || 0);
    
    // Calculate consistency (standard deviation)
    const mean = weeklyAverage;
    const variance = weekData.reduce((sum, d) => sum + Math.pow((d.value || 0) - mean, 2), 0) / weekData.length;
    const stdDev = Math.sqrt(variance);
    const consistency = Math.max(0, 100 - (stdDev * 20)); // Lower std dev = higher consistency
    
    return {
      lastNight,
      weeklyAverage,
      monthlyAverage,
      weeklyTrend,
      consistency
    };
  }

  assessSleepQuality(data) {
    const duration = data.weeklyAverage || 0;
    const efficiency = data.lastNight?.sleepEfficiency || 0;
    const consistency = data.consistency || 0;
    
    const score = (duration / 8) * 0.4 + (efficiency / 100) * 0.3 + (consistency / 100) * 0.3;
    
    if (score >= 0.85) return 'excellent';
    if (score >= 0.70) return 'good';
    if (score >= 0.50) return 'fair';
    return 'poor';
  }

  processCalorieIntake(data) {
    const consumed = this.calculateAverage(data) || 0;
    const goal = this.calculateCalorieGoal();
    
    return {
      consumed,
      goal,
      deficit: consumed < goal ? goal - consumed : 0,
      surplus: consumed > goal ? consumed - goal : 0
    };
  }

  calculateCalorieGoal() {
    const weight = this.userProfile?.weight || 70;
    const age = this.userProfile?.age || 30;
    const gender = this.userProfile?.gender || 'male';
    const activityLevel = this.userProfile?.activityLevel || 'moderately_active';
    
    // Mifflin-St Jeor Equation
    let bmr;
    if (gender === 'male') {
      bmr = (10 * weight) + (6.25 * 175) - (5 * age) + 5; // Assuming 175cm height
    } else {
      bmr = (10 * weight) + (6.25 * 162) - (5 * age) - 161; // Assuming 162cm height
    }
    
    const activityMultipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extremely_active: 1.9
    };
    
    return Math.round(bmr * activityMultipliers[activityLevel]);
  }

  processMacros(protein, carbs, fat) {
    const proteinGrams = this.calculateAverage(protein) || 0;
    const carbsGrams = this.calculateAverage(carbs) || 0;
    const fatGrams = this.calculateAverage(fat) || 0;
    
    const totalCalories = (proteinGrams * 4) + (carbsGrams * 4) + (fatGrams * 9);
    
    return {
      protein: {
        value: proteinGrams,
        goal: (this.userProfile?.weight || 70) * 1.6,
        percentage: totalCalories > 0 ? ((proteinGrams * 4) / totalCalories) * 100 : 0
      },
      carbs: {
        value: carbsGrams,
        goal: 250,
        percentage: totalCalories > 0 ? ((carbsGrams * 4) / totalCalories) * 100 : 0
      },
      fat: {
        value: fatGrams,
        goal: 70,
        percentage: totalCalories > 0 ? ((fatGrams * 9) / totalCalories) * 100 : 0
      }
    };
  }

  processHydration(data) {
    const water = this.calculateAverage(data) || 0;
    const weight = this.userProfile?.weight || 70;
    
    return {
      water: water / 1000, // Convert to liters
      goal: weight * 0.035, // 35ml per kg
      unit: 'L'
    };
  }

  async getMicronutrients() {
    const [fiber, sugar, sodium, cholesterol] = await Promise.all([
      this.getLatestValue('dietaryFiber'),
      this.getLatestValue('dietarySugar'),
      this.getLatestValue('dietarySodium'),
      this.getLatestValue('dietaryCholesterol')
    ]);
    
    const vitamins = {
      a: await this.getLatestValue('dietaryVitaminA'),
      c: await this.getLatestValue('dietaryVitaminC'),
      d: await this.getLatestValue('dietaryVitaminD')
    };
    
    const minerals = {
      calcium: await this.getLatestValue('dietaryCalcium'),
      iron: await this.getLatestValue('dietaryIron'),
      potassium: await this.getLatestValue('dietaryPotassium')
    };
    
    return {
      fiber,
      sugar,
      sodium,
      cholesterol,
      vitamins,
      minerals
    };
  }

  processWorkoutData(workouts) {
    if (!workouts || workouts.length === 0) {
      return {
        recent: [],
        weeklyCount: 0,
        monthlyCount: 0,
        favoriteTypes: [],
        totalDuration: 0,
        averageIntensity: 'moderate'
      };
    }
    
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    
    const weeklyWorkouts = workouts.filter(w => new Date(w.date) >= weekAgo);
    const monthlyWorkouts = workouts.filter(w => new Date(w.date) >= monthAgo);
    
    // Count workout types
    const typeCounts = {};
    monthlyWorkouts.forEach(w => {
      typeCounts[w.type] = (typeCounts[w.type] || 0) + 1;
    });
    
    const favoriteTypes = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);
    
    const totalDuration = monthlyWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const avgDuration = totalDuration / (monthlyWorkouts.length || 1);
    
    let averageIntensity = 'moderate';
    if (avgDuration > 60) averageIntensity = 'high';
    else if (avgDuration < 30) averageIntensity = 'low';
    
    return {
      recent: workouts.slice(0, 10),
      weeklyCount: weeklyWorkouts.length,
      monthlyCount: monthlyWorkouts.length,
      favoriteTypes,
      totalDuration,
      averageIntensity
    };
  }

  calculateTotalMinutes(sessions) {
    if (!sessions || sessions.length === 0) return 0;
    return sessions.reduce((sum, s) => sum + (s.value || 0), 0);
  }

  async estimateStressLevel() {
    // Based on HRV and resting heart rate
    const hrv = await this.getLatestValue('heartRateVariability');
    const restingHR = await this.getLatestValue('restingHeartRate');
    
    if (!hrv && !restingHR) return 'moderate';
    
    const hrvScore = this.normalizeHRV(hrv);
    const hrScore = this.normalizeRestingHR(restingHR);
    const stressScore = (hrvScore + hrScore) / 2;
    
    if (stressScore >= 70) return 'low';
    if (stressScore >= 40) return 'moderate';
    return 'high';
  }

  async estimateMoodLevel() {
    // Based on activity, sleep, and mindfulness
    const steps = await this.getLatestValue('steps');
    // Sleep data needs special handling
    let sleep = null;
    try {
      const sleepResult = await HealthKit?.querySleepData?.({ period: 'week' });
      if (sleepResult?.data?.length > 0) {
        sleep = sleepResult.data[0].value;
      }
    } catch (error) {
      // Sleep data not available
    }
    const mindful = await this.getLatestValue('mindfulSession');
    
    const activityScore = this.normalizeSteps(steps);
    const sleepScore = this.normalizeSleepDuration(sleep);
    const mindfulScore = mindful ? 80 : 40;
    
    const moodScore = (activityScore + sleepScore + mindfulScore) / 3;
    
    if (moodScore >= 70) return 'excellent';
    if (moodScore >= 50) return 'good';
    if (moodScore >= 30) return 'fair';
    return 'poor';
  }

  calculateConsistency(activityData) {
    // Calculate workout consistency based on frequency
    const exerciseMinutes = activityData.exerciseTime?.weeklyTotal || 0;
    const targetMinutes = 150; // WHO recommendation
    
    return Math.min(100, (exerciseMinutes / targetMinutes) * 100);
  }

  /**
   * Get mock comprehensive health data for web development
   */
  getMockComprehensiveHealthData() {
    return {
      timestamp: new Date().toISOString(),
      cardiovascular: {
        heartRate: {
          current: 72,
          average: 75,
          max: 95,
          min: 58,
          resting: 68
        },
        heartRateVariability: { value: 42, trend: 'stable' },
        vo2Max: { value: 45, category: 'good', percentile: 75 },
        bloodOxygen: { value: 98, status: 'normal' },
        respiratoryRate: 16
      },
      activity: {
        steps: {
          daily: 9500,
          weeklyAverage: 8800,
          monthlyAverage: 8900,
          goal: 10000,
          trend: 'improving'
        },
        distance: { daily: 6.5, unit: 'km' },
        calories: { active: 450, basal: 1650, total: 2100 },
        exerciseTime: { daily: 35, weeklyTotal: 180, goal: 30 },
        standHours: { daily: 10, goal: 12 }
      },
      bodyComposition: {
        weight: { current: 75, unit: 'kg', trend: 'stable', weeklyChange: 0 },
        height: 175,
        bmi: { value: 24.5, category: 'normal' },
        bodyFat: { percentage: 15, category: 'fit' },
        muscleMass: { value: 32, percentage: 42.7 }
      },
      sleep: {
        lastNight: { value: 7.5, sleepEfficiency: 88 },
        weeklyAverage: 7.2,
        monthlyAverage: 7.3,
        trend: 'stable',
        consistency: 85,
        quality: 'good'
      },
      nutrition: {
        calories: { consumed: 2150, goal: 2200, deficit: 50, surplus: 0 },
        macros: {
          protein: { value: 120, goal: 112, percentage: 22 },
          carbs: { value: 280, goal: 250, percentage: 52 },
          fat: { value: 62, goal: 70, percentage: 26 }
        },
        hydration: { water: 2.8, goal: 2.6, unit: 'L' }
      },
      workouts: {
        recent: generateMockWorkouts().slice(0, 5),
        weeklyCount: 4,
        monthlyCount: 16,
        favoriteTypes: ['Running', 'Strength Training', 'Cycling'],
        totalDuration: 480,
        averageIntensity: 'moderate'
      },
      mentalHealth: {
        mindfulMinutes: 15,
        stress: 'low',
        mood: 'good'
      },
      environmental: {
        timeInDaylight: 120
      }
    };
  }

  /**
   * Context preparation for AI chatbot
   */
  async prepareHealthContextForAI() {
    const assessment = await this.calculateFitnessAssessment();
    const healthData = await this.getComprehensiveHealthData();
    
    return {
      fitnessLevel: {
        overall: assessment.overallScore,
        category: assessment.category,
        components: assessment.components
      },
      
      strengths: assessment.strengths,
      weaknesses: assessment.weaknesses,
      
      trends: assessment.trends,
      
      recommendations: assessment.recommendations,
      
      keyMetrics: {
        vo2Max: healthData.cardiovascular.vo2Max?.value,
        restingHR: healthData.cardiovascular.heartRate?.resting,
        hrv: healthData.cardiovascular.heartRateVariability?.value,
        avgSteps: healthData.activity.steps?.daily,
        sleepHours: healthData.sleep.weeklyAverage,
        workoutsPerWeek: healthData.workouts.weeklyCount,
        weight: healthData.bodyComposition.weight?.current,
        bodyFat: healthData.bodyComposition.bodyFat?.percentage
      },
      
      comparison: assessment.comparison,
      
      timestamp: assessment.timestamp
    };
  }
}

// Export singleton instance
const appleHealthService = new AppleHealthService();

// Export individual functions for backward compatibility
export const isHealthKitAvailable = () => appleHealthService.initialize();
export const requestHealthKitPermissions = () => appleHealthService.requestPermissions();
export const fetchHealthData = (dataType, period) => appleHealthService.fetchHealthData(dataType, period);
export const clearHealthDataCache = () => HealthKit?.clearCache ? HealthKit.clearCache() : Promise.resolve();
export const startObservingHealthData = (dataType) => HealthKit?.startObservingHealthData ? HealthKit.startObservingHealthData({ dataType }) : Promise.resolve();

export default appleHealthService;