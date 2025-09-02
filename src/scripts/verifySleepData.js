// Mock sleep data for testing
const mockSleepData = [
  {
    date: "2024-03-20T22:00:00Z",
    endDate: "2024-03-21T06:00:00Z",
    value: 8,
    unit: "hours",
    timeInBed: 8.5,
    sleepEfficiency: 94.1,
    stages: {
      deep: 1.5,
      core: 4.2,
      rem: 2.3,
      awake: 0.5,
    },
    source: "Apple Watch",
  },
  {
    date: "2024-03-21T22:30:00Z",
    endDate: "2024-03-22T06:30:00Z",
    value: 7.5,
    unit: "hours",
    timeInBed: 8,
    sleepEfficiency: 93.8,
    stages: {
      deep: 1.2,
      core: 3.8,
      rem: 2.5,
      awake: 0.5,
    },
    source: "Apple Watch",
  },
  {
    date: "2024-03-22T23:00:00Z",
    endDate: "2024-03-23T07:00:00Z",
    value: 8.5,
    unit: "hours",
    timeInBed: 9,
    sleepEfficiency: 94.4,
    stages: {
      deep: 1.8,
      core: 4.5,
      rem: 2.2,
      awake: 0.5,
    },
    source: "Apple Watch",
  },
];

/**
 * Validates sleep data against known patterns and ranges
 * @param {Object} sleepData - The sleep data to validate
 * @returns {Object} Validation results
 */
function validateSleepPatterns(sleepData) {
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
function analyzeSleepPatterns(sleepData) {
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
 * Main function to verify sleep data
 */
async function verifySleepData() {
  console.log("Starting sleep data verification...");

  try {
    // Use mock data for testing
    const sleepData = mockSleepData;
    console.log(`Retrieved ${sleepData.length} sleep records`);

    // Validate sleep patterns
    const validationResults = validateSleepPatterns(sleepData);
    console.log("\nValidation Results:");
    console.log("------------------");
    console.log(`Valid: ${validationResults.isValid}`);

    if (validationResults.warnings.length > 0) {
      console.log("\nWarnings:");
      validationResults.warnings.forEach((warning) =>
        console.log(`- ${warning}`)
      );
    }

    if (validationResults.errors.length > 0) {
      console.log("\nErrors:");
      validationResults.errors.forEach((error) => console.log(`- ${error}`));
    }

    // Analyze sleep patterns
    const analysis = analyzeSleepPatterns(sleepData);
    console.log("\nSleep Analysis:");
    console.log("--------------");
    console.log(
      `Average Sleep Duration: ${analysis.averageSleepDuration.toFixed(
        1
      )} hours`
    );
    console.log(
      `Average Sleep Efficiency: ${analysis.averageSleepEfficiency.toFixed(1)}%`
    );
    console.log(
      `Average Deep Sleep: ${analysis.averageDeepSleep.toFixed(1)} hours`
    );
    console.log(
      `Average REM Sleep: ${analysis.averageRemSleep.toFixed(1)} hours`
    );
    console.log(
      `Average Core Sleep: ${analysis.averageCoreSleep.toFixed(1)} hours`
    );
    console.log(
      `Sleep Consistency Score: ${analysis.consistencyScore.toFixed(1)}/100`
    );

    if (analysis.recommendations.length > 0) {
      console.log("\nRecommendations:");
      analysis.recommendations.forEach((rec) => console.log(`- ${rec}`));
    }
  } catch (error) {
    console.error("Error verifying sleep data:", error);
  }
}

// Run the verification
verifySleepData().catch(console.error);
