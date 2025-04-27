import { useState, useEffect } from 'react';
import { isHealthKitAvailable, requestHealthKitPermissions, fetchHealthData, startObservingHealthData } from '../services/appleHealthService';

/**
 * Hook to fetch and observe Apple Health data
 * @param {string} dataType - Type of health data to fetch
 * @param {string} period - Time period to fetch data for
 * @returns {Object} Health data and status
 */
export function useAppleHealth(dataType, period = 'week') {
  const [data, setData] = useState([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check if HealthKit is available and authorized
  useEffect(() => {
    async function checkHealthKit() {
      try {
        const available = await isHealthKitAvailable();
        setIsAvailable(available);
        
        if (available) {
          const authorized = await requestHealthKitPermissions();
          setIsAuthorized(authorized);
        }
      } catch (err) {
        setError(err);
      }
    }
    
    checkHealthKit();
  }, []);
  
  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      if (isAvailable && isAuthorized) {
        setIsLoading(true);
        try {
          const result = await fetchHealthData(dataType, period);
          setData(result);
        } catch (err) {
          setError(err);
        } finally {
          setIsLoading(false);
        }
      }
    }
    
    if (isAvailable && isAuthorized) {
      loadData();
    }
  }, [dataType, period, isAvailable, isAuthorized]);
  
  // Set up observers for real-time updates
  useEffect(() => {
    if (isAvailable && isAuthorized) {
      // Start observing changes
      const stopObserving = startObservingHealthData(dataType, (newData) => {
        setData(newData);
      });
      
      // Cleanup
      return stopObserving;
    }
  }, [dataType, isAvailable, isAuthorized]);
  
  return {
    data,
    isAvailable,
    isAuthorized,
    isLoading,
    error
  };
}