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
        // Basic metrics
        "HKQuantityTypeIdentifierHeight",
        "HKQuantityTypeIdentifierBodyMass",
        "HKQuantityTypeIdentifierBodyFatPercentage",
        "HKQuantityTypeIdentifierLeanBodyMass",
        
        // Cardiovascular data
        "HKQuantityTypeIdentifierHeartRate",
        "HKQuantityTypeIdentifierRestingHeartRate",
        "HKQuantityTypeIdentifierHeartRateVariabilitySDNN",
        "HKQuantityTypeIdentifierOxygenSaturation",
        "HKQuantityTypeIdentifierRespiratoryRate",
        "HKQuantityTypeIdentifierBloodPressureSystolic",
        "HKQuantityTypeIdentifierBloodPressureDiastolic",
        
        // Activity data
        "HKQuantityTypeIdentifierStepCount",
        "HKQuantityTypeIdentifierDistanceWalkingRunning",
        "HKQuantityTypeIdentifierActiveEnergyBurned",
        "HKQuantityTypeIdentifierBasalEnergyBurned",
        "HKQuantityTypeIdentifierFlightsClimbed",
        "HKQuantityTypeIdentifierAppleExerciseTime",
        "HKQuantityTypeIdentifierAppleStandTime",
        
        // Workouts
        "HKWorkoutTypeIdentifier",
        "HKQuantityTypeIdentifierVO2Max",
        "HKQuantityTypeIdentifierRunningPower",
        "HKQuantityTypeIdentifierRunningSpeed",
        
        // Sleep
        "HKCategoryTypeIdentifierSleepAnalysis",
        
        // Nutrition
        "HKQuantityTypeIdentifierDietaryEnergyConsumed",
        "HKQuantityTypeIdentifierDietaryProtein",
        "HKQuantityTypeIdentifierDietaryFat",
        "HKQuantityTypeIdentifierDietaryCarbohydrates",
        "HKQuantityTypeIdentifierDietarySugar",
        "HKQuantityTypeIdentifierDietaryFiber",
        "HKQuantityTypeIdentifierDietaryWater",
        "HKQuantityTypeIdentifierDietaryCaffeine",
        
        // Micronutrients
        "HKQuantityTypeIdentifierDietaryCalcium",
        "HKQuantityTypeIdentifierDietaryIron",
        "HKQuantityTypeIdentifierDietaryPotassium",
        "HKQuantityTypeIdentifierDietarySodium",
        "HKQuantityTypeIdentifierDietaryVitaminA",
        "HKQuantityTypeIdentifierDietaryVitaminC",
        "HKQuantityTypeIdentifierDietaryVitaminD",
        
        // Environmental
        "HKQuantityTypeIdentifierEnvironmentalAudioExposure",
        "HKCategoryTypeIdentifierEnvironmentalAudioExposureEvent",
        "HKQuantityTypeIdentifierUVExposure"
      ],
      write: [
        // Basic metrics
        "HKQuantityTypeIdentifierHeight",
        "HKQuantityTypeIdentifierBodyMass",
        "HKQuantityTypeIdentifierBodyFatPercentage",
        "HKQuantityTypeIdentifierLeanBodyMass",
        
        // Activity data
        "HKQuantityTypeIdentifierStepCount",
        "HKQuantityTypeIdentifierDistanceWalkingRunning",
        "HKQuantityTypeIdentifierActiveEnergyBurned",
        "HKWorkoutTypeIdentifier",
        
        // Sleep
        "HKCategoryTypeIdentifierSleepAnalysis",
        
        // Nutrition
        "HKQuantityTypeIdentifierDietaryEnergyConsumed",
        "HKQuantityTypeIdentifierDietaryProtein",
        "HKQuantityTypeIdentifierDietaryFat",
        "HKQuantityTypeIdentifierDietaryCarbohydrates",
        "HKQuantityTypeIdentifierDietaryWater",
      ],
    },
  },
};

export default config;
