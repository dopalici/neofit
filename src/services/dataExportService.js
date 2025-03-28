import Papa from "papaparse";
import { getAllHealthData } from "./dataImportService";

/**
 * Export health data to CSV format
 *
 * @param {string} dataType - Type of health data to export (all, heartRate, steps, etc.)
 * @returns {Blob} Blob containing CSV data
 */
export function exportHealthDataToCSV(dataType = "all") {
  // Get health data
  const allData = getAllHealthData();

  let dataToExport;
  let filename;

  if (dataType === "all") {
    // Combine all data types with an additional column for the type
    dataToExport = [
      ...transformDataWithType(allData.heartRate, "heartRate"),
      ...transformDataWithType(allData.steps, "steps"),
      ...transformDataWithType(allData.weight, "weight"),
      ...transformDataWithType(allData.sleep, "sleep"),
      ...transformDataWithType(allData.vo2max, "vo2max"),
      ...transformDataWithType(allData.workouts, "workout"),
    ];
    filename = "neovitru-health-data-export.csv";
  } else {
    // Export a specific data type
    dataToExport = allData[dataType] || [];
    filename = `neovitru-${dataType}-export.csv`;
  }

  // If no data to export, return null
  if (!dataToExport || dataToExport.length === 0) {
    console.error("No data to export");
    return null;
  }

  // Convert to CSV
  const csv = Papa.unparse(dataToExport);

  // Create a blob
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

  return { blob, filename };
}

/**
 * Export health data to JSON format
 *
 * @param {string} dataType - Type of health data to export (all, heartRate, steps, etc.)
 * @returns {Blob} Blob containing JSON data
 */
export function exportHealthDataToJSON(dataType = "all") {
  // Get health data
  const allData = getAllHealthData();

  let dataToExport;
  let filename;

  if (dataType === "all") {
    dataToExport = allData;
    filename = "neovitru-health-data-export.json";
  } else {
    dataToExport = allData[dataType] || [];
    filename = `neovitru-${dataType}-export.json`;
  }

  // If no data to export, return null
  if (
    !dataToExport ||
    (dataType === "all" &&
      Object.values(dataToExport).every((arr) => !arr || arr.length === 0))
  ) {
    console.error("No data to export");
    return null;
  }

  // Create a blob
  const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
    type: "application/json",
  });

  return { blob, filename };
}

/**
 * Transform data to include type information
 *
 * @param {Array} data - Array of data objects
 * @param {string} type - Type of data
 * @returns {Array} Transformed data
 */
function transformDataWithType(data, type) {
  if (!data || !Array.isArray(data) || data.length === 0) return [];

  return data.map((item) => ({
    type,
    date: item.date,
    value: item.value,
    ...item,
  }));
}

/**
 * Trigger a file download
 *
 * @param {Blob} blob - Blob containing file data
 * @param {string} filename - Name of the file to download
 */
export function downloadFile(blob, filename) {
  if (!blob) return;

  // Create a temporary anchor element
  const link = document.createElement("a");

  // Create a URL for the blob
  const url = URL.createObjectURL(blob);

  // Set link properties
  link.href = url;
  link.download = filename;

  // Append to document (required for Firefox)
  document.body.appendChild(link);

  // Trigger click
  link.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}
