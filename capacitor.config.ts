import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "io.neovit.app",
  appName: "NeoVitru",
  webDir: "build",
  server: {
    androidScheme: "https",
    iosScheme: "https",
  },
  ios: {
    contentInset: "automatic",
    allowsLinkPreview: true,
    scrollEnabled: true,
    backgroundColor: "#ffffff",
    preferredContentMode: "mobile",
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
};

export default config;
