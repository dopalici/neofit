// src/services/dataImportService.js

import { saveToStorage, getFromStorage } from '../utils/storageUtils';
import { formatISO, parseISO, isValid } from 'date-fns';

// Storage keys - Export these so they can be used in other services
export const STORAGE_KEYS = {
  IMPORTED_HEALTH_DATA: 'imported-health-data',
  HEART_RATE_DATA: 'heart-rate-data',
  STEP_COUNT_DATA: 'step-count-data',
  WEIGHT_DATA: 'weight-data',
  SLEEP_DATA: 'sleep-data',
  VO2MAX_DATA: 'vo2max-data',
  WORKOUT_DATA: 'workout-data'
};

/**
 * Import health data from various sources
 * 
 * @param {Array|Object} data - The parsed data from the file
 * @param {string} fileType - The type of file (csv, json, etc.)
 * @returns {Object} Statistics about the imported data
 */
export function importHealthData(data, fileType) {
  // Initialize stats
  const stats = {
    counts: {
      heartRate: 0,
      steps: 0,
      weight: 0,
      sleep: 0,
      vo2max: 0,
      workouts: 0
    },
    dateRange: {
      start: null,
      end: null
    }
  };
  
  // Arrays to store different types of data
  const heartRateData = [];
  const stepData = [];
  const weightData = [];
  const sleepData = [];
  const vo2maxData = [];
  const workoutData = [];
  
  // Track dates for determining the date range
  const allDates = [];
  
  // Process data based on file type
  if (fileType === 'csv') {
    // Process CSV data (already parsed by PapaParse in the component)
    processCSVData(data, {
      heartRateData,
      stepData,
      weightData,
      sleepData,
      vo2maxData,
      workoutData,
      allDates
    });
  } else if (fileType === 'json') {
    // Process JSON data based on its structure
    processJSONData(data, {
      heartRateData,
      stepData,
      weightData,
      sleepData,
      vo2maxData,
      workoutData,
      allDates
    });
  } else if (fileType === 'parsed-xml') {
    // Process data that has already been extracted from XML
    processXMLData(data, {
      heartRateData,
      stepData,
      weightData,
      sleepData,
      vo2maxData,
      workoutData,
      allDates
    });
  }
  
  // Update stats
  stats.counts.heartRate = heartRateData.length;
  stats.counts.steps = stepData.length;
  stats.counts.weight = weightData.length;
  stats.counts.sleep = sleepData.length;
  stats.counts.vo2max = vo2maxData.length;
  stats.counts.workouts = workoutData.length;
  
  // Calculate date range
  if (allDates.length > 0) {
    const sortedDates = allDates.sort((a, b) => a - b);
    stats.dateRange.start = formatISO(sortedDates[0], { representation: 'date' });
    stats.dateRange.end = formatISO(sortedDates[sortedDates.length - 1], { representation: 'date' });
  }
  
  // Save the processed data
  saveToStorage(STORAGE_KEYS.HEART_RATE_DATA, heartRateData);
  saveToStorage(STORAGE_KEYS.STEP_COUNT_DATA, stepData);
  saveToStorage(STORAGE_KEYS.WEIGHT_DATA, weightData);
  saveToStorage(STORAGE_KEYS.SLEEP_DATA, sleepData);
  saveToStorage(STORAGE_KEYS.VO2MAX_DATA, vo2maxData);
  saveToStorage(STORAGE_KEYS.WORKOUT_DATA, workoutData);
  
  // Save the raw imported data (may be useful for debugging)
  saveToStorage(STORAGE_KEYS.IMPORTED_HEALTH_DATA, {
    // For parsed-xml, we don't store the raw data as it would be too large
    data: fileType === 'parsed-xml' ? [] : data.slice(0, 1000), 
    fileType,
    importDate: new Date().toISOString(),
    stats
  });
  
  return stats;
}

/**
 * Process XML data that has been pre-extracted from Apple Health exports
 */
function processXMLData(data, dataCollections) {
  const {
    heartRateData,
    stepData,
    weightData,
    sleepData,
    vo2maxData,
    workoutData,
    allDates
  } = dataCollections;
  
  // The data should already be categorized by type in the XML preprocessing
  data.forEach(item => {
    const type = item.type.toLowerCase();
    const dateStr = item.date;
    const value = item.value;
    
    if (!dateStr || value === undefined || value === null) return;
    
    // Parse the date
    const date = parseDate(dateStr);
    if (!date || !isValid(date)) return;
    
    // Add to all dates array for tracking date range
    allDates.push(date);
    
    // Process based on type
    switch(type) {
      case 'heartrate':
        heartRateData.push({
          date: date.toISOString(),
          value: parseFloat(value),
          unit: item.unit || 'bpm'
        });
        break;
      case 'steps':
        stepData.push({
          date: date.toISOString(),
          value: parseInt(value, 10),
          unit: item.unit || 'count'
        });
        break;
      case 'weight':
        weightData.push({
          date: date.toISOString(),
          value: parseFloat(value),
          unit: item.unit || 'kg'
        });
        break;
      case 'sleep':
        sleepData.push({
          date: date.toISOString(),
          value: parseFloat(value),
          unit: item.unit || 'hours'
        });
        break;
      case 'vo2max':
        vo2maxData.push({
          date: date.toISOString(),
          value: parseFloat(value),
          unit: item.unit || 'ml/kg/min'
        });
        break;
      case 'workout':
        workoutData.push({
          date: date.toISOString(),
          type: item.workoutType || 'unknown',
          duration: parseFloat(value),
          unit: item.unit || 'seconds',
          calories: item.calories || null,
          distance: item.distance || null
        });
        break;
      // The data may also have an 'other' type which we'll ignore
    }
  });
}

/**
 * Process CSV data and extract health metrics
 */
function processCSVData(data, dataCollections) {
  const {
    heartRateData,
    stepData,
    weightData,
    sleepData,
    vo2maxData,
    workoutData,
    allDates
  } = dataCollections;
  
  // First, detect the format of the CSV to determine how to process it
  const firstRow = data[0];
  const headers = Object.keys(firstRow);
  
  // Look for common column names to identify the data structure
  const hasType = headers.some(h => 
    h.toLowerCase().includes('type') || 
    h.toLowerCase().includes('metric') || 
    h.toLowerCase().includes('measure')
  );
  
  const hasDate = headers.some(h => 
    h.toLowerCase().includes('date') || 
    h.toLowerCase().includes('time')
  );
  
  const hasValue = headers.some(h => 
    h.toLowerCase().includes('value') || 
    h.toLowerCase().includes('amount')
  );
  
  // Process data based on detected format
  if (hasType && hasDate && hasValue) {
    // Standard health export format with type, date, and value columns
    processStandardFormat(data, dataCollections);
  } else if (headers.includes('heart_rate') || headers.includes('heartRate')) {
    // Specific heart rate export
    processHeartRateFormat(data, dataCollections);
  } else if (headers.includes('steps') || headers.includes('step_count')) {
    // Specific step count export
    processStepFormat(data, dataCollections);
  } else if (headers.includes('weight') || headers.includes('body_mass')) {
    // Specific weight export
    processWeightFormat(data, dataCollections);
  } else if (headers.includes('sleep') || headers.includes('sleep_duration')) {
    // Specific sleep export
    processSleepFormat(data, dataCollections);
  } else {
    // Generic format - try to infer data types from column names
    processGenericFormat(data, dataCollections);
  }
}

/**
 * Process JSON data based on its structure
 */
function processJSONData(data, dataCollections) {
  // JSON data could have various structures
  // Here we try to handle common health app export formats
  
  if (Array.isArray(data)) {
    // Array of records - try to determine what kind of data it is
    const firstItem = data[0];
    
    if (!firstItem) return; // Empty array
    
    if (firstItem.type || firstItem.dataType) {
      // Data has explicit type information
      processJSONWithTypes(data, dataCollections);
    } else {
      // Try to infer types from properties
      processJSONInferTypes(data, dataCollections);
    }
  } else {
    // Object with categorized data
    if (data.heartRate || data.heart_rate) {
      processArrayData(data.heartRate || data.heart_rate, 'heartRate', dataCollections);
    }
    
    if (data.steps || data.stepCount || data.step_count) {
      processArrayData(data.steps || data.stepCount || data.step_count, 'steps', dataCollections);
    }
    
    if (data.weight || data.bodyMass || data.body_mass) {
      processArrayData(data.weight || data.bodyMass || data.body_mass, 'weight', dataCollections);
    }
    
    if (data.sleep || data.sleepData || data.sleep_data) {
      processArrayData(data.sleep || data.sleepData || data.sleep_data, 'sleep', dataCollections);
    }
    
    if (data.vo2max || data.vo2Max || data.vo2_max) {
      processArrayData(data.vo2max || data.vo2Max || data.vo2_max, 'vo2max', dataCollections);
    }
    
    if (data.workouts || data.workout || data.exercises || data.exercise) {
      processArrayData(
        data.workouts || data.workout || data.exercises || data.exercise, 
        'workout', 
        dataCollections
      );
    }
  }
}

/**
 * Process standard format CSV with type, date, and value columns
 */
function processStandardFormat(data, dataCollections) {
  const {
    heartRateData,
    stepData,
    weightData,
    sleepData,
    vo2maxData,
    workoutData,
    allDates
  } = dataCollections;
  
  // Find the column names for type, date, and value
  const firstRow = data[0];
  const headers = Object.keys(firstRow);
  
  const typeColumn = headers.find(h => 
    h.toLowerCase().includes('type') || 
    h.toLowerCase().includes('metric') || 
    h.toLowerCase().includes('measure')
  );
  
  const dateColumn = headers.find(h => 
    h.toLowerCase().includes('date') || 
    h.toLowerCase().includes('time')
  );
  
  const valueColumn = headers.find(h => 
    h.toLowerCase().includes('value') || 
    h.toLowerCase().includes('amount')
  );
  
  if (!typeColumn || !dateColumn || !valueColumn) return;
  
  // Process each row
  data.forEach(row => {
    const type = (row[typeColumn] || '').toLowerCase();
    const dateStr = row[dateColumn];
    const value = row[valueColumn];
    
    if (!dateStr || value === undefined || value === null) return;
    
    // Parse the date
    const date = parseDate(dateStr);
    if (!date || !isValid(date)) return;
    
    // Add to all dates array for tracking date range
    allDates.push(date);
    
    // Process based on type
    if (type.includes('heart') || type.includes('pulse')) {
      heartRateData.push({
        date: date.toISOString(),
        value: parseFloat(value)
      });
    } else if (type.includes('step')) {
      stepData.push({
        date: date.toISOString(),
        value: parseInt(value, 10)
      });
    } else if (type.includes('weight') || type.includes('mass')) {
      weightData.push({
        date: date.toISOString(),
        value: parseFloat(value)
      });
    } else if (type.includes('sleep')) {
      sleepData.push({
        date: date.toISOString(),
        value: parseFloat(value),
        unit: row.unit || 'hours'
      });
    } else if (type.includes('vo2') || type.includes('oxygen')) {
      vo2maxData.push({
        date: date.toISOString(),
        value: parseFloat(value)
      });
    } else if (type.includes('workout') || type.includes('exercise')) {
      workoutData.push({
        date: date.toISOString(),
        type: row.workoutType || row.exerciseType || 'unknown',
        duration: parseFloat(value),
        unit: row.unit || 'minutes',
        calories: row.calories || null,
        distance: row.distance || null
      });
    }
  });
}

/**
 * Process heart rate specific format
 */
function processHeartRateFormat(data, dataCollections) {
  const { heartRateData, allDates } = dataCollections;
  
  // Find the column names
  const firstRow = data[0];
  const headers = Object.keys(firstRow);
  
  const heartRateColumn = headers.find(h => 
    h.toLowerCase().includes('heart') || 
    h.toLowerCase().includes('pulse')
  );
  
  const dateColumn = headers.find(h => 
    h.toLowerCase().includes('date') || 
    h.toLowerCase().includes('time')
  );
  
  if (!heartRateColumn || !dateColumn) return;
  
  // Process each row
  data.forEach(row => {
    const heartRate = row[heartRateColumn];
    const dateStr = row[dateColumn];
    
    if (!dateStr || heartRate === undefined || heartRate === null) return;
    
    // Parse the date
    const date = parseDate(dateStr);
    if (!date || !isValid(date)) return;
    
    // Add to all dates array for tracking date range
    allDates.push(date);
    
    // Add heart rate data
    heartRateData.push({
      date: date.toISOString(),
      value: parseFloat(heartRate)
    });
  });
}

/**
 * Process step count specific format
 */
function processStepFormat(data, dataCollections) {
  const { stepData, allDates } = dataCollections;
  
  // Find the column names
  const firstRow = data[0];
  const headers = Object.keys(firstRow);
  
  const stepColumn = headers.find(h => 
    h.toLowerCase().includes('step')
  );
  
  const dateColumn = headers.find(h => 
    h.toLowerCase().includes('date') || 
    h.toLowerCase().includes('time')
  );
  
  if (!stepColumn || !dateColumn) return;
  
  // Process each row
  data.forEach(row => {
    const steps = row[stepColumn];
    const dateStr = row[dateColumn];
    
    if (!dateStr || steps === undefined || steps === null) return;
    
    // Parse the date
    const date = parseDate(dateStr);
    if (!date || !isValid(date)) return;
    
    // Add to all dates array for tracking date range
    allDates.push(date);
    
    // Add step data
    stepData.push({
      date: date.toISOString(),
      value: parseInt(steps, 10)
    });
  });
}

/**
 * Process weight specific format
 */
function processWeightFormat(data, dataCollections) {
  const { weightData, allDates } = dataCollections;
  
  // Find the column names
  const firstRow = data[0];
  const headers = Object.keys(firstRow);
  
  const weightColumn = headers.find(h => 
    h.toLowerCase().includes('weight') || 
    h.toLowerCase().includes('mass')
  );
  
  const dateColumn = headers.find(h => 
    h.toLowerCase().includes('date') || 
    h.toLowerCase().includes('time')
  );
  
  if (!weightColumn || !dateColumn) return;
  
  // Process each row
  data.forEach(row => {
    const weight = row[weightColumn];
    const dateStr = row[dateColumn];
    
    if (!dateStr || weight === undefined || weight === null) return;
    
    // Parse the date
    const date = parseDate(dateStr);
    if (!date || !isValid(date)) return;
    
    // Add to all dates array for tracking date range
    allDates.push(date);
    
    // Add weight data
    weightData.push({
      date: date.toISOString(),
      value: parseFloat(weight)
    });
  });
}

/**
 * Process sleep specific format
 */
function processSleepFormat(data, dataCollections) {
  const { sleepData, allDates } = dataCollections;
  
  // Find the column names
  const firstRow = data[0];
  const headers = Object.keys(firstRow);
  
  const sleepColumn = headers.find(h => 
    h.toLowerCase().includes('sleep') || 
    h.toLowerCase().includes('duration')
  );
  
  const dateColumn = headers.find(h => 
    h.toLowerCase().includes('date') || 
    h.toLowerCase().includes('time')
  );
  
  if (!sleepColumn || !dateColumn) return;
  
  // Process each row
  data.forEach(row => {
    const sleep = row[sleepColumn];
    const dateStr = row[dateColumn];
    
    if (!dateStr || sleep === undefined || sleep === null) return;
    
    // Parse the date
    const date = parseDate(dateStr);
    if (!date || !isValid(date)) return;
    
    // Add to all dates array for tracking date range
    allDates.push(date);
    
    // Add sleep data
    sleepData.push({
      date: date.toISOString(),
      value: parseFloat(sleep),
      unit: 'hours' // Assume hours as default
    });
  });
}

/**
 * Process generic format by inferring data types from column names
 */
function processGenericFormat(data, dataCollections) {
  const {
    heartRateData,
    stepData,
    weightData,
    sleepData,
    vo2maxData,
    workoutData,
    allDates
  } = dataCollections;
  
  // Find the date column
  const firstRow = data[0];
  const headers = Object.keys(firstRow);
  
  const dateColumn = headers.find(h => 
    h.toLowerCase().includes('date') || 
    h.toLowerCase().includes('time')
  );
  
  if (!dateColumn) return;
  
  // Look for columns matching each data type
  const heartRateColumn = headers.find(h => 
    h.toLowerCase().includes('heart') || 
    h.toLowerCase().includes('pulse')
  );
  
  const stepColumn = headers.find(h => 
    h.toLowerCase().includes('step')
  );
  
  const weightColumn = headers.find(h => 
    h.toLowerCase().includes('weight') || 
    h.toLowerCase().includes('mass')
  );
  
  const sleepColumn = headers.find(h => 
    h.toLowerCase().includes('sleep') || 
    h.toLowerCase().includes('duration')
  );
  
  const vo2maxColumn = headers.find(h => 
    h.toLowerCase().includes('vo2') || 
    h.toLowerCase().includes('oxygen')
  );
  
  // Process each row for all detected data types
  data.forEach(row => {
    const dateStr = row[dateColumn];
    if (!dateStr) return;
    
    // Parse the date
    const date = parseDate(dateStr);
    if (!date || !isValid(date)) return;
    
    // Add to all dates array for tracking date range
    allDates.push(date);
    
    // Process heart rate if column exists
    if (heartRateColumn && row[heartRateColumn] !== undefined && row[heartRateColumn] !== null) {
      heartRateData.push({
        date: date.toISOString(),
        value: parseFloat(row[heartRateColumn])
      });
    }
    
    // Process steps if column exists
    if (stepColumn && row[stepColumn] !== undefined && row[stepColumn] !== null) {
      stepData.push({
        date: date.toISOString(),
        value: parseInt(row[stepColumn], 10)
      });
    }
    
    // Process weight if column exists
    if (weightColumn && row[weightColumn] !== undefined && row[weightColumn] !== null) {
      weightData.push({
        date: date.toISOString(),
        value: parseFloat(row[weightColumn])
      });
    }
    
    // Process sleep if column exists
    if (sleepColumn && row[sleepColumn] !== undefined && row[sleepColumn] !== null) {
      sleepData.push({
        date: date.toISOString(),
        value: parseFloat(row[sleepColumn]),
        unit: 'hours' // Assume hours as default
      });
    }
    
    // Process VO2max if column exists
    if (vo2maxColumn && row[vo2maxColumn] !== undefined && row[vo2maxColumn] !== null) {
      vo2maxData.push({
        date: date.toISOString(),
        value: parseFloat(row[vo2maxColumn])
      });
    }
  });
}

/**
 * Process JSON data with explicit type information
 */
function processJSONWithTypes(data, dataCollections) {
  const {
    heartRateData,
    stepData,
    weightData,
    sleepData,
    vo2maxData,
    workoutData,
    allDates
  } = dataCollections;
  
  data.forEach(item => {
    const type = (item.type || item.dataType || '').toLowerCase();
    const dateStr = item.date || item.timestamp || item.startDate || item.time;
    const value = item.value || item.amount || item.count;
    
    if (!dateStr || value === undefined || value === null) return;
    
    // Parse the date
    const date = parseDate(dateStr);
    if (!date || !isValid(date)) return;
    
    // Add to all dates array for tracking date range
    allDates.push(date);
    
    // Process based on type
    if (type.includes('heart') || type.includes('pulse')) {
      heartRateData.push({
        date: date.toISOString(),
        value: parseFloat(value)
      });
    } else if (type.includes('step')) {
      stepData.push({
        date: date.toISOString(),
        value: parseInt(value, 10)
      });
    } else if (type.includes('weight') || type.includes('mass')) {
      weightData.push({
        date: date.toISOString(),
        value: parseFloat(value)
      });
    } else if (type.includes('sleep')) {
      sleepData.push({
        date: date.toISOString(),
        value: parseFloat(value),
        unit: item.unit || 'hours'
      });
    } else if (type.includes('vo2') || type.includes('oxygen')) {
      vo2maxData.push({
        date: date.toISOString(),
        value: parseFloat(value)
      });
    } else if (type.includes('workout') || type.includes('exercise')) {
      workoutData.push({
        date: date.toISOString(),
        type: item.workoutType || item.exerciseType || 'unknown',
        duration: parseFloat(value),
        unit: item.unit || 'minutes',
        calories: item.calories || null,
        distance: item.distance || null
      });
    }
  });
}

/**
 * Process JSON data by inferring types from properties
 */
function processJSONInferTypes(data, dataCollections) {
  const {
    heartRateData,
    stepData,
    weightData,
    sleepData,
    vo2maxData,
    workoutData,
    allDates
  } = dataCollections;
  
  data.forEach(item => {
    const dateStr = item.date || item.timestamp || item.startDate || item.time;
    if (!dateStr) return;
    
    // Parse the date
    const date = parseDate(dateStr);
    if (!date || !isValid(date)) return;
    
    // Add to all dates array for tracking date range
    allDates.push(date);
    
    // Check for different data types based on property names
    if (item.heartRate !== undefined || item.heart_rate !== undefined || item.pulse !== undefined) {
      heartRateData.push({
        date: date.toISOString(),
        value: parseFloat(item.heartRate || item.heart_rate || item.pulse)
      });
    }
    
    if (item.steps !== undefined || item.stepCount !== undefined || item.step_count !== undefined) {
      stepData.push({
        date: date.toISOString(),
        value: parseInt(item.steps || item.stepCount || item.step_count, 10)
      });
    }
    
    if (item.weight !== undefined || item.bodyMass !== undefined || item.body_mass !== undefined) {
      weightData.push({
        date: date.toISOString(),
        value: parseFloat(item.weight || item.bodyMass || item.body_mass)
      });
    }
    
    if (item.sleep !== undefined || item.sleepDuration !== undefined || item.sleep_duration !== undefined) {
      sleepData.push({
        date: date.toISOString(),
        value: parseFloat(item.sleep || item.sleepDuration || item.sleep_duration),
        unit: item.unit || 'hours'
      });
    }
    
    if (item.vo2max !== undefined || item.vo2Max !== undefined || item.vo2_max !== undefined) {
      vo2maxData.push({
        date: date.toISOString(),
        value: parseFloat(item.vo2max || item.vo2Max || item.vo2_max)
      });
    }
    
    if (item.workout || item.exercise || (item.type && 
        (item.type.toLowerCase().includes('workout') || 
         item.type.toLowerCase().includes('exercise')))) {
      workoutData.push({
        date: date.toISOString(),
        type: item.workoutType || item.exerciseType || item.type || 'unknown',
        duration: parseFloat(item.duration || 0),
        unit: item.unit || 'minutes',
        calories: item.calories || null,
        distance: item.distance || null
      });
    }
  });
}

/**
 * Process array data of a specific type
 */
function processArrayData(data, dataType, dataCollections) {
  if (!Array.isArray(data)) return;
  
  const {
    heartRateData,
    stepData,
    weightData,
    sleepData,
    vo2maxData,
    workoutData,
    allDates
  } = dataCollections;
  
  data.forEach(item => {
    // If item is not an object, skip
    if (typeof item !== 'object' || item === null) return;
    
    const dateStr = item.date || item.timestamp || item.startDate || item.time;
    if (!dateStr) return;
    
    // Parse the date
    const date = parseDate(dateStr);
    if (!date || !isValid(date)) return;
    
    // Add to all dates array for tracking date range
    allDates.push(date);
    
    // Process based on data type
    switch (dataType.toLowerCase()) {
      case 'heartrate':
        heartRateData.push({
          date: date.toISOString(),
          value: parseFloat(item.value || item.heartRate || item.heart_rate || item.rate || 0)
        });
        break;
      case 'steps':
        stepData.push({
          date: date.toISOString(),
          value: parseInt(item.value || item.steps || item.count || 0, 10)
        });
        break;
      case 'weight':
        weightData.push({
          date: date.toISOString(),
          value: parseFloat(item.value || item.weight || item.mass || 0)
        });
        break;
      case 'sleep':
        sleepData.push({
          date: date.toISOString(),
          value: parseFloat(item.value || item.duration || item.hours || 0),
          unit: item.unit || 'hours'
        });
        break;
      case 'vo2max':
        vo2maxData.push({
          date: date.toISOString(),
          value: parseFloat(item.value || item.vo2max || item.score || 0)
        });
        break;
      case 'workout':
        workoutData.push({
          date: date.toISOString(),
          type: item.type || item.workoutType || item.exercise || 'unknown',
          duration: parseFloat(item.duration || item.minutes || 0),
          unit: item.unit || 'minutes',
          calories: item.calories || item.energy || null,
          distance: item.distance || null
        });
        break;
    }
  });
}

/**
 * Try to parse a date string in various formats
 */
function parseDate(dateStr) {
  // First try native Date parsing
  const date = new Date(dateStr);
  if (isValid(date)) return date;
  
  // If that fails, try date-fns parsing for ISO format
  try {
    const isoDate = parseISO(dateStr);
    if (isValid(isoDate)) return isoDate;
  } catch (e) {
    // Continue to other formats
  }
  
  // Try common date formats
  // Format: YYYY-MM-DD or YYYY/MM/DD
  const isoRegex = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/;
  const isoMatch = dateStr.match(isoRegex);
  if (isoMatch) {
    const [_, year, month, day] = isoMatch;
    return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  }
  
  // Format: MM/DD/YYYY or MM-DD-YYYY
  const usRegex = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/;
  const usMatch = dateStr.match(usRegex);
  if (usMatch) {
    const [_, month, day, year] = usMatch;
    return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  }
  
  // Format: DD/MM/YYYY or DD-MM-YYYY
  const euRegex = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/;
  const euMatch = dateStr.match(euRegex);
  if (euMatch) {
    const [_, day, month, year] = euMatch;
    return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  }
  
  // If all else fails, return null
  return null;
}

/**
 * Get all health data from storage
 */
export function getAllHealthData() {
  return {
    heartRate: getFromStorage(STORAGE_KEYS.HEART_RATE_DATA, []),
    steps: getFromStorage(STORAGE_KEYS.STEP_COUNT_DATA, []),
    weight: getFromStorage(STORAGE_KEYS.WEIGHT_DATA, []),
    sleep: getFromStorage(STORAGE_KEYS.SLEEP_DATA, []),
    vo2max: getFromStorage(STORAGE_KEYS.VO2MAX_DATA, []),
    workouts: getFromStorage(STORAGE_KEYS.WORKOUT_DATA, [])
  };
}

/**
 * Get specific health data type
 */
export function getHealthData(dataType) {
  switch (dataType.toLowerCase()) {
    case 'heartrate':
      return getFromStorage(STORAGE_KEYS.HEART_RATE_DATA, []);
    case 'steps':
      return getFromStorage(STORAGE_KEYS.STEP_COUNT_DATA, []);
    case 'weight':
      return getFromStorage(STORAGE_KEYS.WEIGHT_DATA, []);
    case 'sleep':
      return getFromStorage(STORAGE_KEYS.SLEEP_DATA, []);
    case 'vo2max':
      return getFromStorage(STORAGE_KEYS.VO2MAX_DATA, []);
    case 'workouts':
      return getFromStorage(STORAGE_KEYS.WORKOUT_DATA, []);
    default:
      return [];
  }
}

/**
 * Get the most recent value for a specific health data type
 */
export function getLatestHealthData(dataType) {
  const data = getHealthData(dataType);
  if (!data || data.length === 0) return null;
  
  // Sort by date in descending order (newest first)
  const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
  return sorted[0];
}

/**
 * Clear all imported health data
 */
export function clearHealthData() {
  Object.values(STORAGE_KEYS).forEach(key => {
    saveToStorage(key, null);
  });
}