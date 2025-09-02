import { registerPlugin } from '@capacitor/core';
const HealthKit = registerPlugin('HealthKit', {
    web: () => import('./web').then(m => new m.HealthKitWeb()),
});
export * from './definitions';
export { HealthKit };
//# sourceMappingURL=index.js.map