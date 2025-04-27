import { registerPlugin } from '@capacitor/core';

export interface HealthKitPlugin {
  isAvailable(): Promise<{ available: boolean }>;
  requestAuthorization(): Promise<{ authorized: boolean }>;
  queryHealthData(options: { dataType: string; period: string }): Promise<{ data: any[] }>;
  querySleepData(options: { period: string }): Promise<{ data: any[] }>;
  startObservingHealthData(options: { dataType: string }): Promise<void>;
  stopObservingHealthData(options: { dataType: string }): Promise<void>;
}

const HealthKit = registerPlugin<HealthKitPlugin>('HealthKit');

export { HealthKit };