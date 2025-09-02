#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Define the plugin using the CAP_PLUGIN macro
CAP_PLUGIN(HealthKitPlugin, "HealthKit",
           CAP_PLUGIN_METHOD(isAvailable, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(requestAuthorization, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(queryHealthData, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(querySleepData, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(queryWorkouts, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(startObservingHealthData, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(stopObservingHealthData, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(clearCache, CAPPluginReturnPromise);
)