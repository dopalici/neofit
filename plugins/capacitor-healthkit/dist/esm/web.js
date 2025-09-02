import { WebPlugin } from '@capacitor/core';
export class HealthKitWeb extends WebPlugin {
    async isAvailable() {
        console.log('HealthKit is not available on web');
        return { available: false };
    }
    async requestAuthorization() {
        console.log('HealthKit authorization not available on web');
        return { authorized: false };
    }
    async queryHealthData() {
        console.log('HealthKit data not available on web');
        return { data: [] };
    }
    async queryWorkouts() {
        console.log('HealthKit workouts not available on web');
        return { data: [] };
    }
    async querySleepData() {
        console.log('HealthKit sleep data not available on web');
        return { data: [] };
    }
    async startObservingHealthData() {
        console.log('HealthKit observation not available on web');
    }
    async stopObservingHealthData() {
        console.log('HealthKit observation not available on web');
    }
    async clearCache() {
        console.log('HealthKit cache clear not available on web');
    }
    async getComprehensiveHealthData() {
        console.log('HealthKit comprehensive data not available on web');
        return {};
    }
    async getFitnessAssessment() {
        console.log('HealthKit fitness assessment not available on web');
        return {};
    }
}
//# sourceMappingURL=web.js.map