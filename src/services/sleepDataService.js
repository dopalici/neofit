import { fetchHealthData } from "./appleHealthService";

/**
 * Validates sleep data against known patterns and ranges
 * @param {Object} sleepData - The sleep data to validate
 * @returns {Object} Validation results
 */
export function validateSleepPatterns(sleepData) {
  const results = {
    isValid: true,
    warnings: [],
    errors: [],
  };

  if (!Array.isArray(sleepData) || sleepData.length === 0) {
    results.isValid = false;
    results.errors.push("No sleep data available");
    return results;
  }

  sleepData.forEach((record, index) => {
    // Check total sleep duration
    if (record.value < 3 || record.value > 12) {
      results.warnings.push(
        `Record ${index}: Unusual total sleep duration (${record.value} hours)`
      );
    }

    // Check sleep efficiency
    if (record.sleepEfficiency < 70 || record.sleepEfficiency > 100) {
      results.warnings.push(
        `Record ${index}: Unusual sleep efficiency (${record.sleepEfficiency}%)`
      );
    }

    // Check sleep stages if available
    if (record.stages) {
      const { deep, core, rem, awake } = record.stages;
      const totalStages = deep + core + rem;
      const totalTime = totalStages + (awake || 0);

      // Check if stages add up to total sleep time
      if (Math.abs(totalStages - record.value) > 0.1) {
        results.errors.push(
          `Record ${index}: Sleep stages don't add up to total sleep time (${totalStages} vs ${record.value})`
        );
      }

      // Check if total time matches time in bed
      if (record.timeInBed && Math.abs(totalTime - record.timeInBed) > 0.1) {
        results.errors.push(
          `Record ${index}: Total time doesn't match time in bed (${totalTime} vs ${record.timeInBed})`
        );
      }

      // Check stage proportions
      const deepPercentage = (deep / record.value) * 100;
      const remPercentage = (rem / record.value) * 100;
      const corePercentage = (core / record.value) * 100;

      if (deepPercentage < 10 || deepPercentage > 30) {
        results.warnings.push(
          `Record ${index}: Unusual deep sleep percentage (${deepPercentage.toFixed(
            1
          )}%)`
        );
      }

      if (remPercentage < 15 || remPercentage > 35) {
        results.warnings.push(
          `Record ${index}: Unusual REM sleep percentage (${remPercentage.toFixed(
            1
          )}%)`
        );
      }

      if (corePercentage < 40 || corePercentage > 60) {
        results.warnings.push(
          `Record ${index}: Unusual core sleep percentage (${corePercentage.toFixed(
            1
          )}%)`
        );
      }
    }

    // Check time in bed vs sleep time
    if (record.timeInBed) {
      const timeInBedHours = record.timeInBed;
      if (timeInBedHours < record.value) {
        results.errors.push(
          `Record ${index}: Time in bed is less than sleep time`
        );
      }
      if (timeInBedHours > record.value * 1.5) {
        results.warnings.push(
          `Record ${index}: Large gap between time in bed and sleep time`
        );
      }
    }

    // Check date consistency
    const startDate = new Date(record.date);
    const endDate = new Date(record.endDate);
    const duration = (endDate - startDate) / (1000 * 60 * 60); // Convert to hours

    if (Math.abs(duration - record.value) > 0.5) {
      results.errors.push(
        `Record ${index}: Date range doesn't match sleep duration`
      );
    }
  });

  return results;
}

/**
 * Analyzes sleep patterns over time
 * @param {Array} sleepData - Array of sleep records
 * @returns {Object} Analysis results
 */
export function analyzeSleepPatterns(sleepData) {
  const analysis = {
    averageSleepDuration: 0,
    averageSleepEfficiency: 0,
    averageDeepSleep: 0,
    averageRemSleep: 0,
    averageCoreSleep: 0,
    consistencyScore: 0,
    recommendations: [],
  };

  if (!Array.isArray(sleepData) || sleepData.length === 0) {
    return analysis;
  }

  // Calculate averages
  const totals = sleepData.reduce(
    (acc, record) => {
      acc.duration += record.value;
      acc.efficiency += record.sleepEfficiency;
      if (record.stages) {
        acc.deep += record.stages.deep;
        acc.rem += record.stages.rem;
        acc.core += record.stages.core;
      }
      return acc;
    },
    { duration: 0, efficiency: 0, deep: 0, rem: 0, core: 0 }
  );

  const count = sleepData.length;
  analysis.averageSleepDuration = totals.duration / count;
  analysis.averageSleepEfficiency = totals.efficiency / count;
  analysis.averageDeepSleep = totals.deep / count;
  analysis.averageRemSleep = totals.rem / count;
  analysis.averageCoreSleep = totals.core / count;

  // Calculate consistency score (0-100)
  const durationVariance =
    sleepData.reduce((acc, record) => {
      const diff = record.value - analysis.averageSleepDuration;
      return acc + diff * diff;
    }, 0) / count;

  analysis.consistencyScore = Math.max(0, 100 - durationVariance * 10);

  // Generate recommendations
  if (analysis.averageSleepDuration < 7) {
    analysis.recommendations.push(
      "Consider increasing sleep duration to 7-9 hours"
    );
  }
  if (analysis.averageSleepEfficiency < 85) {
    analysis.recommendations.push("Work on improving sleep efficiency");
  }
  if (analysis.averageDeepSleep < 1.5) {
    analysis.recommendations.push("Consider strategies to increase deep sleep");
  }
  if (analysis.consistencyScore < 70) {
    analysis.recommendations.push(
      "Try to maintain more consistent sleep schedule"
    );
  }

  return analysis;
}

/**
 * Fetches and validates sleep data
 * @param {string} period - The time period to fetch (day, week, month, year)
 * @returns {Promise<Object>} Sleep data with validation and analysis
 */
export async function getSleepData(period = "week") {
  try {
    const sleepData = await fetchHealthData("sleep", period);
    const validationResults = validateSleepPatterns(sleepData);
    const analysis = analyzeSleepPatterns(sleepData);

    return {
      data: sleepData,
      validation: validationResults,
      analysis,
      isValid: validationResults.isValid,
      hasWarnings: validationResults.warnings.length > 0,
      hasErrors: validationResults.errors.length > 0,
    };
  } catch (error) {
    console.error("Error fetching sleep data:", error);
    return {
      data: [],
      validation: {
        isValid: false,
        warnings: [],
        errors: ["Failed to fetch sleep data"],
      },
      analysis: analyzeSleepPatterns([]),
      isValid: false,
      hasWarnings: false,
      hasErrors: true,
    };
  }
}
