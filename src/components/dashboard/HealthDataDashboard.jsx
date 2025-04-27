// src/components/dashboard/HealthDataDashboard.jsx
import React, { useState } from "react";
// Removed unused Calendar, Moon, Scale imports
import { format, isValid as isDateValid, parseISO, subDays } from "date-fns";
import {
  Activity,
  Download,
  Heart,
  TrendingUp,
  Upload /*Moon, Scale*/,
} from "lucide-react"; // Keep icons actually used
import { useAppleHealth } from "../../hooks/useAppleHealth"; // Added isDateValid alias
// Assuming dataImportService might have async functions
import HealthDataExporter from "../settings/HealthDataExporter";
import HealthDataImporter from "../settings/HealthDataImporter";

// Helper functions can stay outside the component if they don't need component scope/state
function formatFitnessLevel(vo2max) {
  if (typeof vo2max !== "number" || isNaN(vo2max)) return "NO DATA"; // Added check
  if (vo2max > 55) return "SUPERIOR CARDIO FITNESS";
  if (vo2max > 45) return "EXCELLENT CARDIO FITNESS";
  if (vo2max > 35) return "GOOD CARDIO FITNESS";
  if (vo2max > 25) return "AVERAGE CARDIO FITNESS";
  return "BELOW AVERAGE CARDIO FITNESS";
}

function calculateRestingHeartRate(heartRateData) {
  if (!heartRateData || heartRateData.length < 5) return null;
  // Filter for valid numeric values first
  const validHR = heartRateData.filter(
    (item) => typeof item?.value === "number" && !isNaN(item.value)
  );
  if (validHR.length < 5) return null; // Need enough valid points

  const sortedHR = [...validHR].sort((a, b) => a.value - b.value);
  const percentile5Index = Math.floor(sortedHR.length * 0.05);
  const sliceEndIndex = Math.max(1, percentile5Index + 1);
  const lowestHRs = sortedHR.slice(0, sliceEndIndex);

  if (lowestHRs.length === 0) return null;

  const sum = lowestHRs.reduce((acc, item) => acc + item.value, 0);
  const avg = sum / lowestHRs.length;
  return !isNaN(avg) ? Math.round(avg) : null; // Final check
}

function formatRecoveryLevel(score) {
  if (typeof score !== "number" || isNaN(score)) return "NO DATA"; // Added check
  if (score > 85) return "OPTIMAL RECOVERY";
  if (score > 70) return "GOOD RECOVERY";
  if (score > 50) return "MODERATE RECOVERY";
  return "RECOVERY NEEDED";
}

function calculateRecoveryScore(currentHealthData) {
  if (
    !currentHealthData ||
    !currentHealthData.heartRate ||
    !currentHealthData.sleep
  ) {
    return null;
  }
  const validHeartRate = (currentHealthData.heartRate || []).filter(
    (item) => typeof item?.value === "number" && !isNaN(item.value)
  );
  const validSleep = (currentHealthData.sleep || []).filter(
    (item) =>
      item && item.date && typeof item.value === "number" && !isNaN(item.value)
  );

  if (validHeartRate.length === 0 || validSleep.length === 0) {
    return null;
  }

  const restingHR = calculateRestingHeartRate(validHeartRate);

  if (restingHR === null) {
    return null;
  }

  const sortedSleep = [...validSleep].sort((a, b) => {
    try {
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      if (!isDateValid(dateA) || !isDateValid(dateB)) return 0;
      return dateB.getTime() - dateA.getTime();
    } catch (e) {
      return 0;
    }
  });
  const latestSleep = sortedSleep[0];

  if (!latestSleep) {
    return null;
  }

  const hrScore = Math.max(0, Math.min(100, 100 - (restingHR - 55) * 3));
  const sleepScore = Math.min(100, (latestSleep.value / 8) * 100);
  const score = Math.round(hrScore * 0.6 + sleepScore * 0.4);

  return !isNaN(score) ? score : null;
}

function getFilteredData(dataArray, range) {
  if (!Array.isArray(dataArray) || dataArray.length === 0) return [];
  const now = new Date();
  let startDate;
  switch (range) {
    case "day":
      startDate = subDays(now, 1);
      break;
    case "week":
      startDate = subDays(now, 7);
      break;
    case "month":
      startDate = subDays(now, 30);
      break;
    case "year":
      startDate = subDays(now, 365);
      break;
    default:
      startDate = subDays(now, 7);
  }
  return dataArray.filter((item) => {
    try {
      if (!item || !item.date || typeof item.date !== "string") return false;
      const itemDate = parseISO(item.date);
      return isDateValid(itemDate) && itemDate >= startDate && itemDate <= now;
    } catch (e) {
      return false;
    }
  });
}

function getLatest(dataArray) {
  if (!Array.isArray(dataArray) || dataArray.length === 0) return null;
  try {
    const sorted = [...dataArray]
      .filter((item) => {
        try {
          return item && item.date && isDateValid(parseISO(item.date));
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        try {
          const dateA = parseISO(a.date);
          const dateB = parseISO(b.date);
          if (!isDateValid(dateA) || !isDateValid(dateB)) return 0;
          return dateB.getTime() - dateA.getTime();
        } catch (e) {
          return 0;
        }
      });
    return sorted[0] || null;
  } catch (e) {
    console.error("Error sorting data to get latest:", e);
    return null;
  }
}

function calculateAverage(dataArray, property = "value") {
  if (!Array.isArray(dataArray) || dataArray.length === 0) return "0.0";
  const validItems = dataArray.filter(
    (item) => typeof item?.[property] === "number" && !isNaN(item[property])
  );
  if (validItems.length === 0) return "0.0";
  const sum = validItems.reduce((acc, item) => acc + item[property], 0);
  const avg = sum / validItems.length;
  return !isNaN(avg) ? avg.toFixed(1) : "0.0";
}

function calculateMax(dataArray, property = "value") {
  if (!Array.isArray(dataArray) || dataArray.length === 0) return "0.0";
  const validItems = dataArray.filter(
    (item) => typeof item?.[property] === "number" && !isNaN(item[property])
  );
  if (validItems.length === 0) return "0.0";
  const values = validItems.map((item) => item[property]);
  const maxVal = Math.max(...values);
  return !isNaN(maxVal) && isFinite(maxVal) ? maxVal.toFixed(1) : "0.0";
}

export default function HealthDataDashboard() {
  const [timeRange, setTimeRange] = useState("week");
  const [showImporter, setShowImporter] = useState(false);
  const [showExporter, setShowExporter] = useState(false);

  // Use the Apple Health hook for each data type
  const { data: heartRateData, isLoading: heartRateLoading } = useAppleHealth(
    "heartRate",
    timeRange
  );

  const { data: stepsData, isLoading: stepsLoading } = useAppleHealth(
    "steps",
    timeRange
  );
  const { data: weightData, isLoading: weightLoading } = useAppleHealth(
    "weight",
    timeRange
  );
  const { data: sleepData, isLoading: sleepLoading } = useAppleHealth(
    "sleep",
    timeRange
  );
  const { data: vo2maxData, isLoading: vo2maxLoading } = useAppleHealth(
    "vo2max",
    timeRange
  );

  // Determine overall loading state
  const isLoading =
    heartRateLoading ||
    stepsLoading ||
    weightLoading ||
    sleepLoading ||
    vo2maxLoading;

  // Create a health data object for components that need it
  const healthData = {
    heartRate: heartRateData || [],
    steps: stepsData || [],
    weight: weightData || [],
    sleep: sleepData || [],
    vo2max: vo2maxData || [],
  };

  // Filtered data
  const filteredHeartRate = getFilteredData(healthData.heartRate, timeRange);
  const filteredSteps = getFilteredData(healthData.steps, timeRange);
  const filteredWeight = getFilteredData(healthData.weight, timeRange);
  const filteredSleep = getFilteredData(healthData.sleep, timeRange);

  // Latest values
  const latestHeartRate = getLatest(healthData.heartRate);
  const latestSteps = getLatest(healthData.steps);
  const latestWeight = getLatest(healthData.weight);
  const latestSleep = getLatest(healthData.sleep);
  const latestVo2max = getLatest(healthData.vo2max);

  // Calculated values
  const currentRecoveryScore = calculateRecoveryScore(healthData);

  const handleDataImported = async (stats) => {
    console.log("Data import finished, stats:", stats);
    setShowImporter(false);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-cyan-300 font-mono">
            HEALTH DATA ANALYSIS
          </h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-cyan-500 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }

  // Helper to safely format a value with toFixed
  const safeToFixed = (value, digits = 0) => {
    const num = parseFloat(value);
    return typeof num === "number" && !isNaN(num) ? num.toFixed(digits) : "--";
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header and Importer/Exporter toggles */}
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-cyan-300 font-mono">
          HEALTH DATA ANALYSIS
        </h1>
        <div className="flex items-center flex-wrap gap-2">
          {/* Time Range Select */}
          <div className="mr-4">
            <label htmlFor="timeRangeSelect" className="sr-only">
              Select Time Range
            </label>
            <select
              id="timeRangeSelect"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-gray-900 border border-cyan-800 rounded px-3 py-2 text-cyan-300 font-mono"
            >
              <option value="day">Last 24 Hours</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last 365 Days</option>
            </select>
          </div>
          {/* Import/Export Buttons */}
          <button
            onClick={() => {
              setShowImporter(!showImporter);
              setShowExporter(false);
            }}
            className="bg-cyan-900 text-cyan-300 border border-cyan-600 px-4 py-2 rounded font-medium hover:bg-cyan-800 transition flex items-center"
            aria-expanded={showImporter}
          >
            <Upload size={16} className="mr-2" />{" "}
            {showImporter ? "HIDE IMPORTER" : "IMPORT DATA"}
          </button>
          <button
            onClick={() => {
              setShowExporter(!showExporter);
              setShowImporter(false);
            }}
            className="bg-cyan-900 text-cyan-300 border border-cyan-600 px-4 py-2 rounded font-medium hover:bg-cyan-800 transition flex items-center"
            aria-expanded={showExporter}
          >
            <Download size={16} className="mr-2" />{" "}
            {showExporter ? "HIDE EXPORTER" : "EXPORT DATA"}
          </button>
        </div>
      </div>
      {showImporter && (
        <div className="mb-8 p-4 bg-gray-800 border border-cyan-700 rounded-lg">
          <h2 className="text-xl font-mono text-cyan-300 mb-4">
            Import Health Data
          </h2>
          <HealthDataImporter onDataImported={handleDataImported} />
        </div>
      )}
      {showExporter && (
        <div className="mb-8 p-4 bg-gray-800 border border-cyan-700 rounded-lg">
          <h2 className="text-xl font-mono text-cyan-300 mb-4">
            Export Health Data
          </h2>
          <HealthDataExporter healthData={healthData} />
        </div>
      )}

      {/* Data Metrics Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Heart Rate Card */}
        <div className="bg-gray-900 border border-cyan-800 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center mb-2">
                <Heart size={20} className="text-red-500 mr-2" />
                <h3 className="text-lg font-mono text-cyan-300">HEART RATE</h3>
              </div>
              <p className="text-3xl font-bold text-cyan-300 font-mono">
                {/* --- FIX: Use safeToFixed --- */}
                {safeToFixed(latestHeartRate?.value, 0)}{" "}
                <span className="text-sm">BPM</span>
              </p>
              <div className="flex mt-2">
                <div className="mr-4">
                  <p className="text-xs text-cyan-600 font-mono">AVG</p>
                  <p className="text-cyan-400 font-mono">
                    {calculateAverage(filteredHeartRate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-cyan-600 font-mono">MAX</p>
                  <p className="text-cyan-400 font-mono">
                    {calculateMax(filteredHeartRate)}
                  </p>
                </div>
              </div>
            </div>
            {/* Sparkline */}
            <div className="h-16 w-24 flex items-end">
              {/* ... (Keep sparkline logic, ensure value used in title is safe) ... */}
              {filteredHeartRate.length > 0 &&
                filteredHeartRate.slice(-15).map((item, index, arr) => {
                  const numericValues = arr
                    .map((d) => d.value)
                    .filter((v) => typeof v === "number" && !isNaN(v));
                  if (numericValues.length === 0) return null;
                  const max = Math.max(...numericValues);
                  const min = Math.min(...numericValues);
                  const range = max - min || 1;
                  const value =
                    typeof item.value === "number" && !isNaN(item.value)
                      ? item.value
                      : min;
                  const height =
                    range === 0 ? 50 : ((value - min) / range) * 100;
                  const displayValue = safeToFixed(value, 0); // Use safe value for title
                  return (
                    <div
                      key={item.date || index}
                      className="w-1 bg-red-500 mx-px rounded-t"
                      style={{
                        height: `${Math.max(0, Math.min(100, height))}%`,
                      }}
                      title={
                        item.date
                          ? `${format(
                              parseISO(item.date),
                              "MMM d"
                            )}: ${displayValue} BPM`
                          : `${displayValue} BPM`
                      }
                    ></div>
                  );
                })}
            </div>
          </div>
          <p className="text-xs text-cyan-600 font-mono mt-4">
            {latestHeartRate?.date
              ? `LAST UPDATED: ${format(
                  parseISO(latestHeartRate.date),
                  "MMM d, p"
                )}`
              : "NO DATA"}
          </p>
        </div>

        {/* Steps Card */}
        <div className="bg-gray-900 border border-cyan-800 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center mb-2">
                <Activity size={20} className="text-green-500 mr-2" />
                <h3 className="text-lg font-mono text-cyan-300">STEPS</h3>
              </div>
              <p className="text-3xl font-bold text-cyan-300 font-mono">
                {latestSteps?.value?.toLocaleString() ?? "--"}
              </p>
              <div className="flex mt-2">
                <div className="mr-4">
                  <p className="text-xs text-cyan-600 font-mono">AVG</p>
                  <p className="text-cyan-400 font-mono">
                    {calculateAverage(filteredSteps)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-cyan-600 font-mono">TOTAL</p>
                  <p className="text-cyan-400 font-mono">
                    {filteredSteps
                      .reduce((sum, item) => sum + (item.value || 0), 0)
                      .toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            {/* Steps bars */}
            <div className="h-16 w-24 flex items-end">
              {filteredSteps.length > 0 &&
                filteredSteps.slice(-7).map((item, index, arr) => {
                  const numericValues = arr
                    .map((d) => d.value)
                    .filter((v) => typeof v === "number" && !isNaN(v));
                  if (numericValues.length === 0) return null;
                  const max =
                    numericValues.length > 0 ? Math.max(...numericValues) : 0;
                  if (max === 0)
                    return (
                      <div
                        key={item.date || index}
                        className="w-3 bg-gray-700 mx-px rounded-t"
                        style={{ height: "2%" }}
                      ></div>
                    ); // Show minimal bar if max is 0
                  const value =
                    typeof item.value === "number" && !isNaN(item.value)
                      ? item.value
                      : 0;
                  const height = (value / max) * 100;
                  return (
                    <div
                      key={item.date || index}
                      className="w-3 bg-green-500 mx-px rounded-t"
                      style={{
                        height: `${Math.max(0, Math.min(100, height))}%`,
                      }}
                      title={
                        item.date
                          ? `${format(
                              parseISO(item.date),
                              "MMM d"
                            )}: ${value.toLocaleString()} steps`
                          : `${value.toLocaleString()} steps`
                      }
                    ></div>
                  );
                })}
            </div>
          </div>
          <p className="text-xs text-cyan-600 font-mono mt-4">
            {latestSteps?.date
              ? `LAST UPDATED: ${format(
                  parseISO(latestSteps.date),
                  "MMM d, p"
                )}`
              : "NO DATA"}
          </p>
        </div>

        {/* Weight Card */}
        <div className="bg-gray-900 border border-cyan-800 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center mb-2">
                {/* Assuming Scale icon was removed, using Activity as placeholder */}
                <Activity size={20} className="text-blue-500 mr-2" />
                <h3 className="text-lg font-mono text-cyan-300">WEIGHT</h3>
              </div>
              <p className="text-3xl font-bold text-cyan-300 font-mono">
                {/* --- FIX: Use safeToFixed --- */}
                {safeToFixed(latestWeight?.value, 1)}{" "}
                <span className="text-sm">KG</span>
              </p>
              <div className="flex mt-2">
                <div className="mr-4">
                  <p className="text-xs text-cyan-600 font-mono">AVG</p>
                  <p className="text-cyan-400 font-mono">
                    {calculateAverage(filteredWeight)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-cyan-600 font-mono">CHANGE</p>
                  <p className="text-cyan-400 font-mono">
                    {/* --- FIX: Add check before toFixed --- */}
                    {filteredWeight.length > 1 &&
                    typeof filteredWeight[filteredWeight.length - 1]?.value ===
                      "number" &&
                    typeof filteredWeight[0]?.value === "number"
                      ? safeToFixed(
                          filteredWeight[filteredWeight.length - 1].value -
                            filteredWeight[0].value,
                          1
                        )
                      : "0.0"}{" "}
                    kg
                  </p>
                </div>
              </div>
            </div>
            {/* Weight line chart */}
            <div className="h-16 w-24 relative">
              {/* ... (Keep SVG logic, ensure coordinates are numeric) ... */}
              {filteredWeight.length > 1 && (
                <svg viewBox="0 0 100 60" className="h-full w-full">
                  <path
                    d={filteredWeight
                      .slice(-10)
                      .map((item, i, arr) => {
                        const numericValues = arr
                          .map((d) => d.value)
                          .filter((v) => typeof v === "number" && !isNaN(v));
                        if (numericValues.length === 0) return "";
                        const max = Math.max(...numericValues);
                        const min = Math.min(...numericValues);
                        const range = max - min || 1;
                        const value =
                          typeof item.value === "number" && !isNaN(item.value)
                            ? item.value
                            : min;
                        const x =
                          arr.length > 1 ? (i / (arr.length - 1)) * 100 : 50; // Handle single point case
                        const y = 60 - ((value - min) / range) * 50;
                        // Ensure coordinates are valid numbers
                        if (
                          isNaN(x) ||
                          !isFinite(x) ||
                          isNaN(y) ||
                          !isFinite(y)
                        )
                          return "";
                        return `${i === 0 ? "M" : "L"} ${x.toFixed(
                          1
                        )} ${y.toFixed(1)}`;
                      })
                      .join(" ")}
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                  />
                </svg>
              )}
            </div>
          </div>
          <p className="text-xs text-cyan-600 font-mono mt-4">
            {latestWeight?.date
              ? `LAST UPDATED: ${format(
                  parseISO(latestWeight.date),
                  "MMM d, p"
                )}`
              : "NO DATA"}
          </p>
        </div>

        {/* Sleep Card */}
        <div className="bg-gray-900 border border-cyan-800 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center mb-2">
                {/* Assuming Moon icon was removed, using Activity as placeholder */}
                <Activity size={20} className="text-purple-500 mr-2" />
                <h3 className="text-lg font-mono text-cyan-300">SLEEP</h3>
              </div>
              <p className="text-3xl font-bold text-cyan-300 font-mono">
                {/* --- FIX: Use safeToFixed --- */}
                {safeToFixed(latestSleep?.value, 1)}{" "}
                <span className="text-sm">HRS</span>
              </p>
              <div className="flex mt-2">
                <div className="mr-4">
                  <p className="text-xs text-cyan-600 font-mono">AVG</p>
                  <p className="text-cyan-400 font-mono">
                    {calculateAverage(filteredSleep)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-cyan-600 font-mono">QUALITY</p>
                  <p className="text-cyan-400 font-mono">
                    {/* --- FIX: Add checks before calculation/toFixed --- */}
                    {filteredSleep.length > 0 &&
                    filteredSleep.some(
                      (item) =>
                        typeof item?.value === "number" && !isNaN(item.value)
                    )
                      ? safeToFixed(
                          (filteredSleep.filter(
                            (item) => (item.value || 0) >= 7
                          ).length /
                            filteredSleep.length) *
                            100,
                          0
                        ) + "%"
                      : "--"}
                  </p>
                </div>
              </div>
            </div>
            {/* Sleep bars */}
            <div className="h-16 w-24 flex items-end">
              {/* ... (Keep sleep bar logic, ensure value used in title is safe) ... */}
              {filteredSleep.length > 0 &&
                filteredSleep.slice(-7).map((item, index) => {
                  const value =
                    typeof item.value === "number" && !isNaN(item.value)
                      ? item.value
                      : 0;
                  const height = (value / 10) * 100; // Assuming max is 10 hours
                  const displayValue = safeToFixed(value, 1);
                  return (
                    <div
                      key={item.date || index}
                      className="w-3 bg-purple-500 mx-px rounded-t"
                      style={{
                        height: `${Math.max(0, Math.min(height, 100))}%`,
                      }}
                      title={
                        item.date
                          ? `${format(
                              parseISO(item.date),
                              "MMM d"
                            )}: ${displayValue} hrs`
                          : `${displayValue} hrs`
                      }
                    ></div>
                  );
                })}
            </div>
          </div>
          <p className="text-xs text-cyan-600 font-mono mt-4">
            {latestSleep?.date
              ? `LAST UPDATED: ${format(
                  parseISO(latestSleep.date),
                  "MMM d, p"
                )}`
              : "NO DATA"}
          </p>
        </div>
      </div>
      {/* End Summary Grid */}

      {/* Detailed Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Heart Rate Chart */}
        <div className="bg-gray-900 border border-cyan-800 rounded-lg p-6">
          <h3 className="text-lg font-mono text-cyan-300 mb-4">
            HEART RATE TRENDS
          </h3>
          {filteredHeartRate.length > 1 ? (
            <div className="h-64 relative">
              {(() => {
                const validData = filteredHeartRate.filter(
                  (item) =>
                    typeof item?.value === "number" &&
                    !isNaN(item.value) &&
                    item?.date &&
                    isDateValid(parseISO(item.date))
                );
                if (validData.length < 2)
                  return (
                    <p className="text-cyan-600 font-mono text-center pt-10">
                      NOT ENOUGH DATA TO PLOT TREND
                    </p>
                  );

                const values = validData.map((d) => d.value);
                const max = Math.max(...values);
                const min = Math.min(...values);
                const range = max - min || 1;
                // --- FIX: Check axis label values before toFixed ---
                const axisLabels = Array.from({ length: 5 }).map((_, i) => {
                  const val = max - range * (i / 4);
                  return !isNaN(val) ? val.toFixed(0) : "--";
                });
                const pathData = validData
                  .map((item, i, arr) => {
                    const x =
                      arr.length > 1 ? (i / (arr.length - 1)) * 100 : 50;
                    const y = 100 - ((item.value - min) / range) * 100;
                    if (isNaN(x) || !isFinite(x) || isNaN(y) || !isFinite(y))
                      return "";
                    return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(
                      2
                    )}`;
                  })
                  .join(" ");
                const areaPathData = `${pathData} L 100 100 L 0 100 Z`;

                return (
                  <>
                    {/* X-axis */}
                    <div className="absolute bottom-0 left-8 right-6 flex justify-between text-xs text-cyan-600 font-mono">
                      {Array.from({
                        length: Math.min(5, validData.length),
                      }).map((_, i) => {
                        const index = Math.floor(
                          (validData.length - 1) *
                            (i / (Math.min(5, validData.length) - 1 || 1))
                        );
                        const item = validData[index];
                        return (
                          <div key={item.date || i}>
                            {format(parseISO(item.date), "MMM d")}
                          </div>
                        );
                      })}
                    </div>
                    {/* Y-axis */}
                    <div className="absolute top-0 bottom-8 left-0 flex flex-col justify-between text-xs text-cyan-600 font-mono pr-2">
                      {axisLabels.map((label, i) => (
                        <div key={i} className="text-right w-full">
                          {label}
                        </div>
                      ))}
                    </div>
                    {/* Chart Area */}
                    <div className="absolute top-0 right-6 bottom-8 left-8">
                      <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        className="h-full w-full"
                      >
                        <path
                          d={areaPathData}
                          fill="url(#heartRateGradient)"
                          opacity="0.2"
                        />
                        <path
                          d={pathData}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="1.5"
                        />
                        <defs>
                          <linearGradient
                            id="heartRateGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#ef4444"
                              stopOpacity="0.8"
                            />
                            <stop
                              offset="100%"
                              stopColor="#ef4444"
                              stopOpacity="0"
                            />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-cyan-600 font-mono">
                {filteredHeartRate.length === 1
                  ? "NEED MORE DATA FOR TREND"
                  : "NO HEART RATE DATA AVAILABLE"}
              </p>
            </div>
          )}
        </div>

        {/* Apply similar robust checks within the other detailed charts (Steps, Weight, Sleep) */}
        {/* Steps Chart */}
        <div className="bg-gray-900 border border-cyan-800 rounded-lg p-6">
          <h3 className="text-lg font-mono text-cyan-300 mb-4">
            STEP COUNT HISTORY
          </h3>
          {/* ... (Add similar checks for valid data, max calculation, axis labels, bar heights) ... */}
          {filteredSteps.length > 0 ? (
            <div className="h-64 relative">
              {(() => {
                const validData = filteredSteps.filter(
                  (item) =>
                    typeof item?.value === "number" &&
                    !isNaN(item.value) &&
                    item?.date &&
                    isDateValid(parseISO(item.date))
                );
                if (validData.length === 0)
                  return (
                    <p className="text-cyan-600 font-mono text-center pt-10">
                      NO VALID STEP DATA
                    </p>
                  );

                const values = validData.map((d) => d.value);
                const max = Math.max(...values);
                const axisLabels = Array.from({ length: 5 }).map((_, i) => {
                  const val = max * (1 - i / 4);
                  return !isNaN(val) ? val.toFixed(0) : "--";
                });

                return (
                  <>
                    {/* X-axis */}
                    <div className="absolute bottom-0 left-8 right-6 flex justify-between text-xs text-cyan-600 font-mono">
                      {/* ... X-axis label generation ... */}
                      {Array.from({
                        length: Math.min(5, validData.length),
                      }).map((_, i) => {
                        const index = Math.floor(
                          (validData.length - 1) *
                            (i / (Math.min(5, validData.length) - 1 || 1))
                        );
                        const item = validData[index];
                        return (
                          <div key={item.date || i}>
                            {format(parseISO(item.date), "MMM d")}
                          </div>
                        );
                      })}
                    </div>
                    {/* Y-axis */}
                    <div className="absolute top-0 bottom-8 left-0 flex flex-col justify-between text-xs text-cyan-600 font-mono pr-2">
                      {axisLabels.map((label, i) => (
                        <div key={i} className="text-right w-full">
                          {label}
                        </div>
                      ))}
                    </div>
                    {/* Bar Chart */}
                    <div className="absolute top-0 right-6 bottom-8 left-8 flex items-end">
                      {validData.map((item, index) => {
                        const height = max > 0 ? (item.value / max) * 100 : 0;
                        return (
                          <div
                            key={index}
                            className="flex-1 bg-green-500 mx-px rounded-t"
                            style={{
                              height: `${Math.max(0, Math.min(100, height))}%`,
                            }}
                          ></div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-cyan-600 font-mono">NO STEP DATA AVAILABLE</p>
            </div>
          )}
        </div>

        {/* Weight Trend */}
        <div className="bg-gray-900 border border-cyan-800 rounded-lg p-6">
          <h3 className="text-lg font-mono text-cyan-300 mb-4">
            WEIGHT PROGRESSION
          </h3>
          {/* ... (Add similar checks for valid data, min/max, axis labels, path/point coordinates) ... */}
          {filteredWeight.length > 1 ? (
            <div className="h-64 relative">
              {/* ... (Chart structure similar to Heart Rate, using #3B82F6 stroke) ... */}
              {(() => {
                const validData = filteredWeight.filter(
                  (item) =>
                    typeof item?.value === "number" &&
                    !isNaN(item.value) &&
                    item?.date &&
                    isDateValid(parseISO(item.date))
                );
                if (validData.length < 2)
                  return (
                    <p className="text-cyan-600 font-mono text-center pt-10">
                      NOT ENOUGH DATA TO PLOT TREND
                    </p>
                  );
                // ... (calculations for min, max, range, axis, path, points) ...
                const values = validData.map((d) => d.value);
                const max = Math.max(...values);
                const min = Math.min(...values);
                const range = max - min || 1;
                const axisLabels = Array.from({ length: 5 }).map((_, i) => {
                  const val = max - range * (i / 4);
                  return !isNaN(val) ? val.toFixed(1) : "--";
                });
                const pathData = validData
                  .map((item, i, arr) => {
                    const x =
                      arr.length > 1 ? (i / (arr.length - 1)) * 100 : 50;
                    const y = 100 - ((item.value - min) / range) * 100;
                    if (isNaN(x) || !isFinite(x) || isNaN(y) || !isFinite(y))
                      return "";
                    return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(
                      2
                    )}`;
                  })
                  .join(" ");

                return (
                  <>
                    {/* Axes */}
                    <div className="absolute bottom-0 left-8 right-6 flex justify-between text-xs text-cyan-600 font-mono">
                      {/* X Labels */}
                    </div>
                    <div className="absolute top-0 bottom-8 left-0 flex flex-col justify-between text-xs text-cyan-600 font-mono pr-2">
                      {axisLabels.map((label, i) => (
                        <div key={i} className="text-right w-full">
                          {label}
                        </div>
                      ))}
                    </div>
                    {/* Chart Area */}
                    <div className="absolute top-0 right-6 bottom-8 left-8">
                      <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        className="h-full w-full"
                      >
                        <path
                          d={pathData}
                          fill="none"
                          stroke="#3B82F6"
                          strokeWidth="2"
                        />
                        {/* Points */}
                        {validData.map((item, i, arr) => {
                          const x =
                            arr.length > 1 ? (i / (arr.length - 1)) * 100 : 50;
                          const y = 100 - ((item.value - min) / range) * 100;
                          if (
                            isNaN(x) ||
                            !isFinite(x) ||
                            isNaN(y) ||
                            !isFinite(y)
                          )
                            return null;
                          return (
                            <circle
                              key={i}
                              cx={x}
                              cy={y}
                              r="2"
                              fill="#3B82F6"
                            />
                          );
                        })}
                      </svg>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-cyan-600 font-mono">
                {filteredWeight.length === 1
                  ? "NEED MORE DATA FOR TREND"
                  : "NO WEIGHT DATA AVAILABLE"}
              </p>
            </div>
          )}
        </div>

        {/* Sleep Chart */}
        <div className="bg-gray-900 border border-cyan-800 rounded-lg p-6">
          <h3 className="text-lg font-mono text-cyan-300 mb-4">
            SLEEP PATTERNS
          </h3>
          {/* ... (Add similar checks for valid data, axis labels, bar heights) ... */}
          {filteredSleep.length > 0 ? (
            <div className="h-64 relative">
              {(() => {
                const validData = filteredSleep.filter(
                  (item) =>
                    typeof item?.value === "number" &&
                    !isNaN(item.value) &&
                    item?.date &&
                    isDateValid(parseISO(item.date))
                );
                if (validData.length === 0)
                  return (
                    <p className="text-cyan-600 font-mono text-center pt-10">
                      NO VALID SLEEP DATA
                    </p>
                  );
                // ... (calculations for axis, bars) ...
                const axisLabels = Array.from({ length: 5 }).map(
                  (_, i) => `${10 - i * 2}h`
                );

                return (
                  <>
                    {/* Axes */}
                    <div className="absolute bottom-0 left-8 right-6 flex justify-between text-xs text-cyan-600 font-mono">
                      {/* X Labels */}
                    </div>
                    <div className="absolute top-0 bottom-8 left-0 flex flex-col justify-between text-xs text-cyan-600 font-mono pr-2">
                      {axisLabels.map((label, i) => (
                        <div key={i} className="text-right w-full">
                          {label}
                        </div>
                      ))}
                    </div>
                    {/* Bar Chart */}
                    <div className="absolute top-0 right-6 bottom-8 left-8 flex items-end">
                      {validData.map((item, index) => {
                        const height = (item.value / 10) * 100; // Assuming max 10h
                        const deepHeight = Math.min(height * 0.3, 30); // Example deep sleep
                        return (
                          <div
                            key={index}
                            className="flex-1 mx-px rounded-t overflow-hidden flex flex-col-reverse"
                          >
                            <div
                              className="bg-purple-500"
                              style={{
                                height: `${Math.max(
                                  0,
                                  Math.min(height, 100)
                                )}%`,
                              }}
                            ></div>
                            <div
                              className="bg-purple-800"
                              style={{ height: `${Math.max(0, deepHeight)}%` }}
                            ></div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-cyan-600 font-mono">NO SLEEP DATA AVAILABLE</p>
            </div>
          )}
          {/* Legend */}
          <div className="flex justify-center mt-4">
            <div className="flex items-center mr-4">
              <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
              <span className="text-xs text-cyan-600 font-mono">
                TOTAL SLEEP
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-800 rounded mr-2"></div>
              <span className="text-xs text-cyan-600 font-mono">
                DEEP SLEEP (EST)
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* End Detailed Charts Grid */}

      {/* Additional Health Metrics */}
      <div className="mt-8 bg-gray-900 border border-cyan-800 rounded-lg p-6">
        {/* ... (Keep existing Advanced Biometrics section, ensure safeToFixed is used if needed) ... */}
        <h3 className="text-lg font-mono text-cyan-300 mb-4">
          ADVANCED BIOMETRICS
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* VO2 Max */}
          <div className="bg-gray-950 border border-cyan-900 p-4 rounded">
            <div className="flex items-center mb-2">
              <TrendingUp size={18} className="text-cyan-500 mr-2" />
              <h4 className="text-sm font-mono text-cyan-300">VO2 MAX</h4>
            </div>
            <p className="text-2xl font-bold text-cyan-300 font-mono mb-2">
              {safeToFixed(latestVo2max?.value, 1)}
            </p>
            {typeof latestVo2max?.value === "number" &&
            !isNaN(latestVo2max.value) ? (
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min((latestVo2max.value / 70) * 100, 100)
                    )}%`,
                  }}
                ></div>
              </div>
            ) : (
              <div className="h-2"></div>
            )}
            <p className="text-xs text-cyan-600 font-mono mt-2">
              {formatFitnessLevel(latestVo2max?.value)}
            </p>
          </div>
          {/* Resting Heart Rate */}
          <div className="bg-gray-950 border border-cyan-900 p-4 rounded">
            <div className="flex items-center mb-2">
              <Heart size={18} className="text-red-500 mr-2" />
              <h4 className="text-sm font-mono text-cyan-300">
                RESTING HEART RATE
              </h4>
            </div>
            {(() => {
              const rhr = calculateRestingHeartRate(healthData?.heartRate);
              return (
                <>
                  <p className="text-2xl font-bold text-cyan-300 font-mono mb-2">
                    {rhr !== null ? rhr : "--"}{" "}
                    <span className="text-sm">BPM</span>
                  </p>
                  {rhr !== null ? (
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(100 - ((rhr - 40) / 40) * 100, 100)
                          )}%`,
                        }}
                      ></div>
                    </div>
                  ) : (
                    <div className="h-2"></div>
                  )}
                  <p className="text-xs text-cyan-600 font-mono mt-2">
                    {rhr !== null ? "OPTIMAL RANGE: 40-60 BPM" : "NO DATA"}
                  </p>
                </>
              );
            })()}
          </div>
          {/* Recovery Score */}
          <div className="bg-gray-950 border border-cyan-900 p-4 rounded">
            <div className="flex items-center mb-2">
              <Activity size={18} className="text-yellow-500 mr-2" />
              <h4 className="text-sm font-mono text-cyan-300">
                RECOVERY SCORE
              </h4>
            </div>
            <p className="text-2xl font-bold text-cyan-300 font-mono mb-2">
              {currentRecoveryScore !== null
                ? `${currentRecoveryScore}%`
                : "--"}
            </p>
            {currentRecoveryScore !== null ? (
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(currentRecoveryScore, 100)
                    )}%`,
                  }}
                ></div>
              </div>
            ) : (
              <div className="h-2"></div>
            )}
            <p className="text-xs text-cyan-600 font-mono mt-2">
              {formatRecoveryLevel(currentRecoveryScore)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
