import { WebPlugin } from '@capacitor/core';
import type { HealthKitPlugin, ComprehensiveHealthData, FitnessAssessment } from './definitions';

export class HealthKitWeb extends WebPlugin implements HealthKitPlugin {
  async isAvailable(): Promise<{ available: boolean }> {
    console.log('HealthKit is not available on web');
    return { available: false };
  }

  async requestAuthorization(): Promise<{ authorized: boolean }> {
    console.log('HealthKit authorization not available on web');
    return { authorized: false };
  }

  async queryHealthData(): Promise<{ data: any[] }> {
    console.log('HealthKit data not available on web');
    return { data: [] };
  }

  async queryWorkouts(): Promise<{ data: any[] }> {
    console.log('HealthKit workouts not available on web');
    return { data: [] };
  }

  async querySleepData(): Promise<{ data: any[] }> {
    console.log('HealthKit sleep data not available on web');
    return { data: [] };
  }

  async startObservingHealthData(): Promise<void> {
    console.log('HealthKit observation not available on web');
  }

  async stopObservingHealthData(): Promise<void> {
    console.log('HealthKit observation not available on web');
  }

  async clearCache(): Promise<void> {
    console.log('HealthKit cache clear not available on web');
  }

  async getComprehensiveHealthData(): Promise<ComprehensiveHealthData> {
    console.log('HealthKit comprehensive data not available on web');
    return {} as ComprehensiveHealthData;
  }

  async getFitnessAssessment(): Promise<FitnessAssessment> {
    console.log('HealthKit fitness assessment not available on web');
    return {} as FitnessAssessment;
  }
}