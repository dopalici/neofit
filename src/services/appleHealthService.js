import { HealthKit } from "capacitor-plugin-healthkit";
import { saveToStorage } from "../utils/storageUtils";
import { STORAGE_KEYS } from "./dataImportService";

/**
 * Check if HealthKit is available on the device
 * @returns {Promise<boolean>}
 */
export async function isHealthKitAvailable() {
  try {
    const { available } = await HealthKit.isAvailable();
    return available;
  } catch (error) {
    console.error("Error checking HealthKit availability:", error);
    return false;
  }
}

/**
 * Request permissions to access HealthKit data
 * @returns {Promise<boolean>}
 */
export async function requestHealthKitPermissions() {
  try {
    const { authorized } = await HealthKit.requestAuthorization();
    return authorized;
  } catch (error) {
    console.error("Error requesting HealthKit permissions:", error);
    return false;
  }
}

/**
 * Fetch health data for a specific metric
 * @param {string} dataType - The type of data to fetch (heartRate, steps, weight, vo2max)
 * @param {string} period - The time period to fetch (day, week, month)
 * @returns {Promise<Array>}
 */
export async function fetchHealthData(dataType, period = "week") {
  try {
    let result;

    if (dataType === "sleep") {
      result = await HealthKit.querySleepData({ period });
    } else {
      result = await HealthKit.queryHealthData({ dataType, period });
    }

    // Save data to storage
    const storageKey = getStorageKeyForType(dataType);
    if (storageKey) {
      saveToStorage(storageKey, result.data);
    }

    return result.data;
  } catch (error) {
    console.error(`Error fetching ${dataType} data:`, error);
    return [];
  }
}

/**
 * Start observing changes for a specific health metric
 * @param {string} dataType - The type of data to observe
 * @param {Function} callback - Callback function when data changes
 */
export function startObservingHealthData(dataType, callback) {
  HealthKit.startObservingHealthData({ dataType });

  // Add a listener for the healthKitUpdate event
  const handleUpdate = (event) => {
    if (event.dataType === dataType) {
      // When we get an update, fetch the latest data
      fetchHealthData(dataType).then((data) => {
        callback(data);
      });
    }
  };

  // Listen for the custom event from the plugin
  document.addEventListener("healthKitUpdate", handleUpdate);

  // Return a cleanup function
  return () => {
    HealthKit.stopObservingHealthData({ dataType });
    document.removeEventListener("healthKitUpdate", handleUpdate);
  };
}

/**
 * Get the storage key for a specific data type
 */
function getStorageKeyForType(dataType) {
  switch (dataType) {
    case "heartRate":
      return STORAGE_KEYS.HEART_RATE_DATA;
    case "steps":
      return STORAGE_KEYS.STEP_COUNT_DATA;
    case "weight":
      return STORAGE_KEYS.WEIGHT_DATA;
    case "sleep":
      return STORAGE_KEYS.SLEEP_DATA;
    case "vo2max":
      return STORAGE_KEYS.VO2MAX_DATA;
    default:
      return null;
  }
}
