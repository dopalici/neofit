import { WebPlugin } from '@capacitor/core';
import type { HealthKitPlugin, ComprehensiveHealthData, FitnessAssessment } from './definitions';
export declare class HealthKitWeb extends WebPlugin implements HealthKitPlugin {
    isAvailable(): Promise<{
        available: boolean;
    }>;
    requestAuthorization(): Promise<{
        authorized: boolean;
    }>;
    queryHealthData(): Promise<{
        data: any[];
    }>;
    queryWorkouts(): Promise<{
        data: any[];
    }>;
    querySleepData(): Promise<{
        data: any[];
    }>;
    startObservingHealthData(): Promise<void>;
    stopObservingHealthData(): Promise<void>;
    clearCache(): Promise<void>;
    getComprehensiveHealthData(): Promise<ComprehensiveHealthData>;
    getFitnessAssessment(): Promise<FitnessAssessment>;
}
