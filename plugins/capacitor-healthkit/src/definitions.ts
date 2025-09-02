/**
 * TypeScript definitions for HealthKit plugin
 * Comprehensive health data types for fitness assessment
 */

export interface HealthKitPlugin {
  isAvailable(): Promise<{ available: boolean }>;
  requestAuthorization(): Promise<{ authorized: boolean }>;
  queryHealthData(options: QueryOptions): Promise<{ data: HealthDataPoint[] }>;
  queryWorkouts(options: { period?: TimePeriod }): Promise<{ data: WorkoutData[] }>;
  querySleepData(options: QueryOptions): Promise<{ data: SleepData[] }>;
  startObservingHealthData(options: { dataType: HealthDataType }): Promise<void>;
  stopObservingHealthData(options: { dataType: HealthDataType }): Promise<void>;
  clearCache(): Promise<void>;
  
  // Comprehensive data fetching methods
  getComprehensiveHealthData(): Promise<ComprehensiveHealthData>;
  getFitnessAssessment(): Promise<FitnessAssessment>;
}

// Time periods for queries
export type TimePeriod = 'day' | 'week' | 'month' | 'year';

// All supported health data types
export type HealthDataType = 
  // Cardiovascular
  | 'heartRate'
  | 'restingHeartRate'
  | 'heartRateVariability'
  | 'vo2Max'
  | 'oxygenSaturation'
  | 'respiratoryRate'
  | 'bodyTemperature'
  
  // Activity & Movement
  | 'steps'
  | 'distance'
  | 'calories'
  | 'basalEnergy'
  | 'exerciseTime'
  | 'standTime'
  | 'walkingSpeed'
  | 'runningSpeed'
  | 'runningPower'
  
  // Body Composition
  | 'weight'
  | 'bodyFatPercentage'
  | 'leanBodyMass'
  | 'bodyMassIndex'
  | 'waistCircumference'
  | 'height'
  
  // Nutrition
  | 'dietaryEnergy'
  | 'dietaryProtein'
  | 'dietaryCarbs'
  | 'dietaryFat'
  | 'dietaryWater'
  | 'dietaryFiber'
  | 'dietarySugar'
  | 'dietarySodium'
  | 'dietaryCholesterol'
  | 'dietaryCalcium'
  | 'dietaryIron'
  | 'dietaryPotassium'
  | 'dietaryVitaminA'
  | 'dietaryVitaminC'
  | 'dietaryVitaminD'
  
  // Environmental
  | 'timeInDaylight'
  
  // Mental Health
  | 'mindfulSession';

// Query options
export interface QueryOptions {
  dataType?: HealthDataType;
  period?: TimePeriod;
  forceRefresh?: boolean;
  startDate?: string;
  endDate?: string;
}

// Base health data point
export interface HealthDataPoint {
  date: string;
  endDate?: string;
  value: number;
  unit: string;
  source: string;
  metadata?: Record<string, any>;
}

// Cardiovascular data
export interface CardiovascularData {
  heartRate?: {
    current?: number;
    resting?: number;
    average?: number;
    max?: number;
    min?: number;
    zones?: HeartRateZones;
  };
  heartRateVariability?: {
    value: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  vo2Max?: {
    value: number;
    percentile?: number;
    category?: 'poor' | 'fair' | 'good' | 'excellent' | 'superior';
  };
  bloodOxygen?: {
    value: number;
    status: 'normal' | 'low';
  };
  respiratoryRate?: number;
  bodyTemperature?: number;
}

export interface HeartRateZones {
  rest: { min: number; max: number; minutesInZone?: number };
  warmup: { min: number; max: number; minutesInZone?: number };
  fatBurn: { min: number; max: number; minutesInZone?: number };
  cardio: { min: number; max: number; minutesInZone?: number };
  peak: { min: number; max: number; minutesInZone?: number };
}

// Activity data
export interface ActivityData {
  steps: {
    daily: number;
    weeklyAverage: number;
    monthlyAverage: number;
    goal: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  };
  distance: {
    daily: number;
    unit: 'km' | 'miles';
  };
  calories: {
    active: number;
    basal: number;
    total: number;
  };
  exerciseTime: {
    daily: number;
    weeklyTotal: number;
    goal: number;
  };
  standHours: {
    daily: number;
    goal: number;
  };
  moveMetrics?: {
    walkingSpeed?: number;
    runningSpeed?: number;
    runningPower?: number;
    stairSpeed?: {
      ascent?: number;
      descent?: number;
    };
  };
}

// Body composition data
export interface BodyCompositionData {
  weight: {
    current: number;
    unit: 'kg' | 'lbs';
    trend: 'gaining' | 'stable' | 'losing';
    weeklyChange?: number;
  };
  height?: number;
  bmi?: {
    value: number;
    category: 'underweight' | 'normal' | 'overweight' | 'obese';
  };
  bodyFat?: {
    percentage: number;
    category: 'essential' | 'athletic' | 'fit' | 'average' | 'obese';
  };
  muscleMass?: {
    value: number;
    percentage?: number;
  };
  boneMass?: number;
  waistCircumference?: number;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    thigh?: number;
    bicep?: number;
  };
}

// Sleep data
export interface SleepData {
  date: string;
  endDate: string;
  value: number; // Total sleep in hours
  unit: string;
  timeInBed: number;
  sleepEfficiency: number;
  source: string;
  stages?: {
    deep: number;
    core: number;
    rem: number;
    awake: number;
  };
  quality?: 'poor' | 'fair' | 'good' | 'excellent';
  consistency?: number; // Sleep schedule consistency score
}

// Nutrition data
export interface NutritionData {
  calories: {
    consumed: number;
    goal: number;
    deficit?: number;
    surplus?: number;
  };
  macros: {
    protein: { value: number; goal: number; percentage: number };
    carbs: { value: number; goal: number; percentage: number };
    fat: { value: number; goal: number; percentage: number };
  };
  hydration: {
    water: number;
    goal: number;
    unit: 'ml' | 'oz';
  };
  micronutrients?: {
    fiber?: number;
    sugar?: number;
    sodium?: number;
    cholesterol?: number;
    vitamins?: {
      a?: number;
      c?: number;
      d?: number;
      e?: number;
      k?: number;
      b12?: number;
    };
    minerals?: {
      calcium?: number;
      iron?: number;
      potassium?: number;
      magnesium?: number;
      zinc?: number;
    };
  };
}

// Workout data
export interface WorkoutData {
  date: string;
  endDate: string;
  duration: number; // in minutes
  type: WorkoutType;
  calories?: number;
  distance?: number;
  source: string;
  heartRate?: {
    average?: number;
    max?: number;
    zones?: HeartRateZones;
  };
  intensity?: 'low' | 'moderate' | 'high' | 'maximal';
  notes?: string;
}

export type WorkoutType = 
  | 'running'
  | 'cycling'
  | 'walking'
  | 'swimming'
  | 'strength'
  | 'hiit'
  | 'yoga'
  | 'pilates'
  | 'crossfit'
  | 'martial_arts'
  | 'dance'
  | 'sports'
  | 'other';

// Comprehensive health data (all categories combined)
export interface ComprehensiveHealthData {
  userId?: string;
  timestamp: string;
  cardiovascular: CardiovascularData;
  activity: ActivityData;
  bodyComposition: BodyCompositionData;
  sleep: {
    lastNight: SleepData;
    weeklyAverage: number;
    monthlyAverage: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  nutrition: NutritionData;
  workouts: {
    recent: WorkoutData[];
    weeklyCount: number;
    monthlyCount: number;
    favoriteTypes: WorkoutType[];
  };
  mentalHealth?: {
    mindfulMinutes?: number;
    stress?: 'low' | 'moderate' | 'high';
    mood?: 'poor' | 'fair' | 'good' | 'excellent';
  };
  environmental?: {
    timeInDaylight?: number;
    screenTime?: number;
  };
}

// Fitness assessment result
export interface FitnessAssessment {
  timestamp: string;
  overallScore: number; // 0-100
  category: FitnessCategory;
  
  components: {
    cardiovascular: ComponentScore;
    activity: ComponentScore;
    bodyComposition: ComponentScore;
    recovery: ComponentScore;
    nutrition: ComponentScore;
  };
  
  strengths: string[];
  weaknesses: string[];
  
  trends: {
    improving: string[];
    declining: string[];
    stable: string[];
  };
  
  recommendations: Recommendation[];
  
  comparison?: {
    ageGroup: { percentile: number; category: string };
    gender: { percentile: number; category: string };
    global: { percentile: number; category: string };
  };
}

export interface ComponentScore {
  score: number; // 0-100
  category: FitnessCategory;
  subScores?: Record<string, number>;
  description?: string;
}

export type FitnessCategory = 
  | 'elite'
  | 'excellent'
  | 'good'
  | 'fair'
  | 'below_average'
  | 'poor'
  | 'very_poor';

export interface Recommendation {
  category: 'exercise' | 'nutrition' | 'recovery' | 'lifestyle';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: string;
  timeframe: string;
  actions: string[];
}

// User profile for personalized calculations
export interface UserProfile {
  age: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  goals?: string[];
  injuries?: string[];
  preferences?: {
    workoutTypes?: WorkoutType[];
    dietaryRestrictions?: string[];
  };
}

// Trend analysis
export interface TrendAnalysis {
  metric: string;
  period: TimePeriod;
  direction: 'improving' | 'stable' | 'declining';
  changePercentage: number;
  significance: 'significant' | 'moderate' | 'minimal';
  projection?: {
    nextWeek?: number;
    nextMonth?: number;
  };
}

// Export all types
export * from './definitions';