import { useCallback, useEffect, useState } from "react";
import {
  clearHealthDataCache,
  fetchHealthData,
  isHealthKitAvailable,
  requestHealthKitPermissions,
  startObservingHealthData,
} from "../services/appleHealthService";
import { getSleepData } from "../services/sleepDataService";

// Maximum number of retries for failed requests
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Validates health data based on type
 * @param {any} data - The data to validate
 * @param {string} type - The type of health data
 * @returns {boolean} Whether the data is valid
 */
const validateHealthData = (data, type) => {
  if (!data) return false;

  // Basic structure validation
  if (Array.isArray(data)) {
    return data.every(
      (item) =>
        item &&
        typeof item.date === "string" &&
        typeof item.value === "number" &&
        typeof item.unit === "string"
    );
  }

  // Object validation for multiple types
  if (typeof data === "object") {
    return Object.entries(data).every(
      ([key, value]) => Array.isArray(value) && validateHealthData(value, key)
    );
  }

  return false;
};

/**
 * Enhanced hook to fetch and observe Apple Health data
 * @param {string|string[]} dataType - Type(s) of health data to fetch (string or array of strings)
 * @param {string} period - Time period to fetch data for (day, week, month, year)
 * @param {Object} options - Additional options
 * @param {boolean} options.observe - Whether to observe changes (default: true)
 * @param {boolean} options.autoRefresh - Whether to periodically refresh data (default: false)
 * @param {number} options.refreshInterval - Interval in ms for auto-refresh (default: 5 minutes)
 * @param {number} options.maxRetries - Maximum number of retries for failed requests (default: 3)
 * @returns {Object} Health data and status
 */
export function useAppleHealth(dataTypes = ["sleep"], period = "week") {
  const [healthData, setHealthData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [sleepAnalysis, setSleepAnalysis] = useState(null);

  // Check if HealthKit is available and authorized
  useEffect(() => {
    async function checkHealthKit() {
      try {
        const available = await isHealthKitAvailable();
        setIsAvailable(available);

        if (available) {
          const authorized = await requestHealthKitPermissions();
          setHasPermission(authorized);
        }
      } catch (err) {
        setError(err);
        console.error("HealthKit availability check failed:", err);
      }
    }

    checkHealthKit();
  }, []);

  const loadData = useCallback(
    async (forceRefresh = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const results = {};
        let hasErrors = false;

        for (const dataType of dataTypes) {
          try {
            if (dataType === "sleep") {
              const sleepResult = await getSleepData(period);
              results.sleep = sleepResult.data;
              setSleepAnalysis(sleepResult.analysis);

              if (sleepResult.hasErrors) {
                hasErrors = true;
                console.warn(
                  "Sleep data validation errors:",
                  sleepResult.validation.errors
                );
              }
              if (sleepResult.hasWarnings) {
                console.warn(
                  "Sleep data validation warnings:",
                  sleepResult.validation.warnings
                );
              }
            } else {
              results[dataType] = await fetchHealthData(
                dataType,
                period,
                forceRefresh
              );
            }
          } catch (err) {
            console.error(`Error fetching ${dataType} data:`, err);
            hasErrors = true;
            results[dataType] = null;
          }
        }

        setHealthData(results);
        setLastUpdated(new Date());
        setRetryCount(0);

        if (hasErrors && retryCount < MAX_RETRIES) {
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
            loadData(true);
          }, RETRY_DELAY * Math.pow(2, retryCount));
        }
      } catch (err) {
        setError(err);
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
            loadData(true);
          }, RETRY_DELAY * Math.pow(2, retryCount));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [dataTypes, period, retryCount]
  );

  // Refresh data function
  const refreshData = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  // Clear cache function
  const clearCache = useCallback(async () => {
    try {
      await clearHealthDataCache();
      loadData(true);
    } catch (err) {
      console.error("Error clearing health data cache:", err);
      setError(err);
    }
  }, [loadData]);

  // Initial data load
  useEffect(() => {
    if (isAvailable && hasPermission) {
      loadData();
    }
  }, [loadData, isAvailable, hasPermission]);

  // Set up observers for real-time updates
  useEffect(() => {
    if (!isAvailable || !hasPermission) return;

    const cleanupFunctions = [];

    dataTypes.forEach((type) => {
      const stopObserving = startObservingHealthData(type, (newData) => {
        if (validateHealthData(newData, type)) {
          setHealthData((prevData) => ({
            ...prevData,
            [type]: newData,
          }));
          setLastUpdated(new Date());
        } else {
          console.warn(`Invalid data received for ${type}, skipping update`);
        }
      });

      cleanupFunctions.push(stopObserving);
    });

    // Cleanup all observers
    return () => {
      cleanupFunctions.forEach((fn) => fn());
    };
  }, [dataTypes, isAvailable, hasPermission]);

  return {
    healthData,
    isLoading,
    error,
    isAvailable,
    hasPermission,
    lastUpdated,
    loadData,
    refreshData,
    clearCache,
    sleepAnalysis,
  };
}
