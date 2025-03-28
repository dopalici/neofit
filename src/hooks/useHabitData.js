import { useState, useEffect } from 'react';
import { saveHabitData, loadHabitData } from '../services/habitService';

export function useHabitData(key, defaultValue) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load data on mount
  useEffect(() => {
    try {
      const loadedData = loadHabitData(key, defaultValue);
      setData(loadedData);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  }, [key, defaultValue]);
  
  // Function to update data
  const updateData = (newData) => {
    try {
      // If newData is a function, call it with the current data
      const updatedData = typeof newData === 'function' 
        ? newData(data) 
        : newData;
        
      // Save to localStorage
      saveHabitData(key, updatedData);
      
      // Update state
      setData(updatedData);
      return true;
    } catch (err) {
      setError(err);
      return false;
    }
  };
  
  return { data, loading, error, updateData };
}