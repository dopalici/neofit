module.exports = {
  appId: 'io.neovit.app',
  appName: 'NeoVitru',
  webDir: 'build',
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
    iosScheme: "https",
  },
  plugins: {
    CapacitorPluginHealthkit: {
      read: [
        "HKQuantityTypeIdentifierHeight",
        "HKQuantityTypeIdentifierBodyMass",
        "HKQuantityTypeIdentifierHeartRate",
        "HKQuantityTypeIdentifierStepCount",
        "HKQuantityTypeIdentifierVO2Max",
        "HKCategoryTypeIdentifierSleepAnalysis",
      ],
      write: [
        "HKQuantityTypeIdentifierHeight",
        "HKQuantityTypeIdentifierBodyMass",
        "HKQuantityTypeIdentifierHeartRate",
        "HKQuantityTypeIdentifierStepCount",
        "HKQuantityTypeIdentifierVO2Max",
        "HKCategoryTypeIdentifierSleepAnalysis",
      ],
    },
  },
  ios: {
    contentInset: "automatic",
    allowsLinkPreview: true,
    scrollEnabled: true,
    backgroundColor: "#ffffff",
    preferredContentMode: "mobile",
    entitlements: {
      'com.apple.developer.healthkit': true,
      'com.apple.developer.healthkit.access': ['health-records']
    }
  }
};