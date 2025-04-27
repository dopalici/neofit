import {
  AlertTriangle,
  Calendar,
  Check,
  Download,
  FileText,
  Upload,
} from "lucide-react";
import Papa from "papaparse";
import React, { useRef, useState } from "react";
import { saveToStorage } from "../../utils/storageUtils";

// Storage keys for health data
const STORAGE_KEYS = {
  HEART_RATE_DATA: "heart-rate-data",
  STEP_COUNT_DATA: "step-count-data",
  WEIGHT_DATA: "weight-data",
  SLEEP_DATA: "sleep-data",
  VO2MAX_DATA: "vo2max-data",
  WORKOUT_DATA: "workout-data",
  NUTRITION_DATA: "nutrition-data",
  IMPORT_HISTORY: "health-import-history",
};

export default function EnhancedHealthDataImporter({ onDataImported }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importStats, setImportStats] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Track worker to make sure we can terminate it if needed
  const workerRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setUploadStatus(null);
    setImportStats(null);
    setProcessingProgress(0);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setUploadStatus(null);
      setImportStats(null);
      setProcessingProgress(0);
    }
  };

  const processHealthData = async (file) => {
    if (isUploading) return;

    setIsUploading(true);
    setUploadStatus({
      status: "processing",
      message: "Preparing to process file...",
    });

    try {
      // Determine file type from extension
      const fileType = file.name.split(".").pop().toLowerCase();

      if (fileType === "csv") {
        // Process CSV file
        await processCSVFile(file);
      } else if (fileType === "json") {
        // Process JSON file
        await processJSONFile(file);
      } else if (fileType === "xml") {
        // Process XML file (Apple Health Data)
        await processXMLFile(file);
      } else {
        setUploadStatus({
          status: "error",
          message: `Unsupported file type: ${fileType}. Please use CSV, JSON, or XML (Apple Health).`,
        });
      }
    } catch (error) {
      console.error("Error processing file:", error);
      setUploadStatus({
        status: "error",
        message: `Error processing file: ${error.message}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const processCSVFile = async (file) => {
    setUploadStatus({ status: "processing", message: "Reading CSV file..." });

    try {
      const text = await readFileAsText(file);

      setUploadStatus({ status: "processing", message: "Parsing CSV data..." });

      Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setUploadStatus({
              status: "error",
              message: `Error parsing CSV: ${results.errors[0].message}`,
            });
            return;
          }

          // Import the parsed data
          importProcessedData(results.data, "csv");
        },
        error: (error) => {
          setUploadStatus({
            status: "error",
            message: `Error parsing CSV: ${error.message}`,
          });
        },
      });
    } catch (error) {
      setUploadStatus({
        status: "error",
        message: `Error reading CSV file: ${error.message}`,
      });
    }
  };

  const processJSONFile = async (file) => {
    setUploadStatus({ status: "processing", message: "Reading JSON file..." });

    try {
      const text = await readFileAsText(file);

      setUploadStatus({
        status: "processing",
        message: "Parsing JSON data...",
      });

      try {
        const data = JSON.parse(text);
        importProcessedData(data, "json");
      } catch (error) {
        setUploadStatus({
          status: "error",
          message: `Error parsing JSON: ${error.message}`,
        });
      }
    } catch (error) {
      setUploadStatus({
        status: "error",
        message: `Error reading JSON file: ${error.message}`,
      });
    }
  };

  const processXMLFile = async (file) => {
    setUploadStatus({
      status: "processing",
      message: "Preparing to process Apple Health XML file...",
    });

    try {
      // Create a web worker for better performance with large XML files
      const workerCode = `
        // Apple Health XML Parser Worker
        let totalRecords = 0;
        let processedRecords = 0;
        
        onmessage = function(e) {
          const file = e.data;
          const reader = new FileReader();
          
          reader.onload = function(evt) {
            try {
              postMessage({ type: 'status', message: 'Parsing XML data...' });
              
              const parser = new DOMParser();
              const xmlDoc = parser.parseFromString(evt.target.result, "text/xml");
              
              // Check for parsing errors
              const parseErrors = xmlDoc.getElementsByTagName('parsererror');
              if (parseErrors.length > 0) {
                throw new Error("XML parsing error: " + parseErrors[0].textContent);
              }
              
              // Create data containers
              const extractedData = {
                heartRate: [],
                steps: [],
                weight: [],
                sleep: [],
                vo2max: [],
                workouts: [],
                nutrition: []
              };
              
              postMessage({ type: 'status', message: 'Counting total records...' });
              
              // Count total records first to track progress
              const records = xmlDoc.querySelectorAll('Record, Workout, FoodItem');
              totalRecords = records.length;
              postMessage({ type: 'total', count: totalRecords });
              
              // Process in batches
              postMessage({ type: 'status', message: 'Processing health records...' });
              processRecords(xmlDoc, extractedData);
              
              postMessage({ type: 'status', message: 'Processing workout records...' });
              processWorkouts(xmlDoc, extractedData);
              
              postMessage({ type: 'status', message: 'Processing nutrition records...' });
              processNutrition(xmlDoc, extractedData);
              
              // Send the final data
              postMessage({ 
                type: 'complete', 
                data: extractedData,
                stats: {
                  heartRate: extractedData.heartRate.length,
                  steps: extractedData.steps.length,
                  weight: extractedData.weight.length,
                  sleep: extractedData.sleep.length,
                  vo2max: extractedData.vo2max.length,
                  workouts: extractedData.workouts.length,
                  nutrition: extractedData.nutrition.length
                }
              });
            } catch (error) {
              postMessage({ type: 'error', message: error.message });
            }
          };
          
          reader.onerror = function(error) {
            postMessage({ type: 'error', message: "Error reading file" });
          };
          
          reader.readAsText(file);
        };
        
        function updateProgress() {
          processedRecords++;
          if (processedRecords % 1000 === 0 || processedRecords === totalRecords) {
            const percentComplete = Math.round((processedRecords / totalRecords) * 100);
            postMessage({ type: 'progress', percent: percentComplete });
          }
        }
        
        function processRecords(xmlDoc, data) {
          const records = xmlDoc.querySelectorAll('Record');
          
          for (let i = 0; i < records.length; i++) {
            const record = records[i];
            const type = record.getAttribute('type');
            const value = record.getAttribute('value');
            const unit = record.getAttribute('unit');
            const startDate = record.getAttribute('startDate');
            const endDate = record.getAttribute('endDate');
            
            try {
              if (value && startDate) {
                // Process different health metrics based on type
                if (type && type.includes('HeartRate')) {
                  data.heartRate.push({
                    date: startDate,
                    value: parseFloat(value),
                    unit: unit || 'bpm'
                  });
                } else if (type && type.includes('StepCount')) {
                  data.steps.push({
                    date: startDate,
                    value: parseInt(value, 10),
                    unit: unit || 'count'
                  });
                } else if (type && type.includes('BodyMass')) {
                  data.weight.push({
                    date: startDate,
                    value: parseFloat(value),
                    unit: unit || 'kg'
                  });
                } else if (type && type.includes('VO2Max')) {
                  data.vo2max.push({
                    date: startDate,
                    value: parseFloat(value),
                    unit: unit || 'ml/kg/min'
                  });
                } else if (type && type.includes('SleepAnalysis')) {
                  // For sleep, we need to calculate duration
                  if (endDate) {
                    const startTime = new Date(startDate);
                    const endTime = new Date(endDate);
                    
                    // Check if dates are valid
                    if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
                      const durationHours = (endTime - startTime) / (1000 * 60 * 60);
                      
                      if (durationHours > 0) {
                        data.sleep.push({
                          date: startDate, 
                          value: durationHours,
                          unit: 'hours',
                          category: record.getAttribute('value') || 'unknown'
                        });
                      }
                    }
                  }
                }
              }
            } catch(err) {
              // Skip this record if there's an error processing it
              console.warn("Error processing record:", err);
            }
            
            updateProgress();
          }
        }
        
        function processWorkouts(xmlDoc, data) {
          const workouts = xmlDoc.querySelectorAll('Workout');
          
          for (let i = 0; i < workouts.length; i++) {
            try {
              const workout = workouts[i];
              const type = workout.getAttribute('workoutActivityType');
              const duration = workout.getAttribute('duration');
              const startDate = workout.getAttribute('startDate');
              const calories = workout.getAttribute('totalEnergyBurned');
              const distance = workout.getAttribute('totalDistance');
              
              if (duration && startDate) {
                // Make sure we have a valid date and numeric duration
                const durationNum = parseFloat(duration);
                const date = new Date(startDate);
                
                if (!isNaN(durationNum) && !isNaN(date.getTime())) {
                  data.workouts.push({
                    date: startDate,
                    type: type || 'unknown',
                    duration: durationNum,
                    unit: 'seconds',
                    calories: calories ? parseFloat(calories) : null,
                    distance: distance ? parseFloat(distance) : null
                  });
                }
              }
            } catch(err) {
              console.warn("Error processing workout:", err);
            }
            
            updateProgress();
          }
        }
        
        function processNutrition(xmlDoc, data) {
          // Apple Health includes some nutrition data as well
          const nutritionItems = xmlDoc.querySelectorAll('FoodItem');
          
          for (let i = 0; i < nutritionItems.length; i++) {
            try {
              const item = nutritionItems[i];
              const date = item.getAttribute('creationDate') || item.getAttribute('startDate');
              const name = item.getAttribute('description') || item.getAttribute('name') || 'Unknown Food';
              
              // Make sure we have a valid date
              if (date && new Date(date).toString() !== 'Invalid Date') {
                // Get nutrients
                const nutrients = {};
                const nutrientElements = item.querySelectorAll('Nutrient');
                
                for (let j = 0; j < nutrientElements.length; j++) {
                  try {
                    const nutrient = nutrientElements[j];
                    const nutrientType = nutrient.getAttribute('description') || 
                                        nutrient.getAttribute('type') || 
                                        nutrient.getAttribute('name');
                    const value = nutrient.getAttribute('value');
                    
                    if (nutrientType && value) {
                      nutrients[nutrientType.toLowerCase()] = parseFloat(value);
                    }
                  } catch(err) {
                    // Skip this nutrient if there's an error
                    console.warn("Error processing nutrient:", err);
                  }
                }
                
                data.nutrition.push({
                  date: date,
                  name: name,
                  calories: nutrients.calories || nutrients.energy || nutrients.kcal || 0,
                  protein: nutrients.protein || 0,
                  carbs: nutrients.carbohydrate || nutrients.carbohydrates || nutrients.carbs || 0,
                  fat: nutrients.fat || nutrients['total fat'] || 0
                });
              }
            } catch(err) {
              console.warn("Error processing nutrition item:", err);
            }
            
            updateProgress();
          }
        }
      `;

      const workerBlob = new Blob([workerCode], {
        type: "application/javascript",
      });
      const workerUrl = URL.createObjectURL(workerBlob);
      const worker = new Worker(workerUrl);

      // Store worker in ref for cleanup
      workerRef.current = worker;

      worker.onmessage = (event) => {
        const message = event.data;

        switch (message.type) {
          case "status":
            setUploadStatus({
              status: "processing",
              message: message.message,
            });
            break;

          case "total":
            console.log(`Processing ${message.count} total records...`);
            break;

          case "progress":
            setProcessingProgress(message.percent);
            break;

          case "error":
            setUploadStatus({
              status: "error",
              message: `Error processing XML: ${message.message}`,
            });
            break;

          case "complete":
            importProcessedAppleHealthData(message.data, message.stats);

            // Clean up worker
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            workerRef.current = null;
            break;
          default:
            // Optionally handle unknown message types
            break;
        }
      };

      worker.onerror = (error) => {
        setUploadStatus({
          status: "error",
          message: `Worker error: ${error.message}`,
        });

        // Clean up worker
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
        workerRef.current = null;
      };

      // Start the worker
      worker.postMessage(file);
    } catch (error) {
      setUploadStatus({
        status: "error",
        message: `Error setting up XML processing: ${error.message}`,
      });
    }
  };

  const importProcessedAppleHealthData = (data, stats) => {
    try {
      // Save each data type to storage
      saveToStorage(STORAGE_KEYS.HEART_RATE_DATA, data.heartRate);
      saveToStorage(STORAGE_KEYS.STEP_COUNT_DATA, data.steps);
      saveToStorage(STORAGE_KEYS.WEIGHT_DATA, data.weight);
      saveToStorage(STORAGE_KEYS.SLEEP_DATA, data.sleep);
      saveToStorage(STORAGE_KEYS.VO2MAX_DATA, data.vo2max);
      saveToStorage(STORAGE_KEYS.WORKOUT_DATA, data.workouts);

      // Also save nutrition data if available
      if (data.nutrition && data.nutrition.length > 0) {
        saveToStorage(STORAGE_KEYS.NUTRITION_DATA, data.nutrition);
      }

      // Calculate date range - include nutrition data in date range calculation
      const allDates = [
        ...data.heartRate.map((item) => new Date(item.date)),
        ...data.steps.map((item) => new Date(item.date)),
        ...data.weight.map((item) => new Date(item.date)),
        ...data.sleep.map((item) => new Date(item.date)),
        ...data.vo2max.map((item) => new Date(item.date)),
        ...data.workouts.map((item) => new Date(item.date)),
        ...(data.nutrition || []).map((item) => new Date(item.date)),
      ].filter((date) => !isNaN(date.getTime()));

      let dateRange = { start: null, end: null };

      if (allDates.length > 0) {
        const sortedDates = allDates.sort((a, b) => a - b);
        dateRange = {
          start: sortedDates[0].toISOString().split("T")[0],
          end: sortedDates[sortedDates.length - 1].toISOString().split("T")[0],
        };
      }

      // Include nutrition in stats if available
      if (data.nutrition && data.nutrition.length > 0) {
        stats.nutrition = data.nutrition.length;
      }

      // Record import history
      const importHistory = {
        date: new Date().toISOString(),
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: "xml",
        counts: stats,
        dateRange,
      };

      const prevHistory = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.IMPORT_HISTORY) || "[]"
      );
      saveToStorage(STORAGE_KEYS.IMPORT_HISTORY, [
        ...prevHistory,
        importHistory,
      ]);

      // Update UI
      setImportStats({
        counts: stats,
        dateRange,
      });

      setUploadStatus({
        status: "success",
        message: `Successfully imported health data from Apple Health!`,
      });

      // Notify parent component
      if (onDataImported) {
        onDataImported({
          counts: stats,
          dateRange,
        });
      }
    } catch (error) {
      console.error("Error saving processed data:", error);
      setUploadStatus({
        status: "error",
        message: `Error saving processed data: ${error.message}`,
      });
    }
  };

  const importProcessedData = (data, fileType) => {
    try {
      setUploadStatus({
        status: "processing",
        message: "Analyzing and importing health data...",
      });

      // Process data based on structure
      const extractedData = extractHealthData(data, fileType);

      // Save to storage
      if (extractedData.heartRate.length > 0) {
        saveToStorage(STORAGE_KEYS.HEART_RATE_DATA, extractedData.heartRate);
      }

      if (extractedData.steps.length > 0) {
        saveToStorage(STORAGE_KEYS.STEP_COUNT_DATA, extractedData.steps);
      }

      if (extractedData.weight.length > 0) {
        saveToStorage(STORAGE_KEYS.WEIGHT_DATA, extractedData.weight);
      }

      if (extractedData.sleep.length > 0) {
        saveToStorage(STORAGE_KEYS.SLEEP_DATA, extractedData.sleep);
      }

      if (extractedData.vo2max.length > 0) {
        saveToStorage(STORAGE_KEYS.VO2MAX_DATA, extractedData.vo2max);
      }

      if (extractedData.workouts.length > 0) {
        saveToStorage(STORAGE_KEYS.WORKOUT_DATA, extractedData.workouts);
      }

      if (extractedData.nutrition.length > 0) {
        saveToStorage(STORAGE_KEYS.NUTRITION_DATA, extractedData.nutrition);
      }

      // Calculate stats for UI
      const stats = {
        heartRate: extractedData.heartRate.length,
        steps: extractedData.steps.length,
        weight: extractedData.weight.length,
        sleep: extractedData.sleep.length,
        vo2max: extractedData.vo2max.length,
        workouts: extractedData.workouts.length,
        nutrition: extractedData.nutrition.length,
      };

      // Calculate date range - include nutrition data in date range calculation
      const allDates = [
        ...extractedData.heartRate.map((item) => new Date(item.date)),
        ...extractedData.steps.map((item) => new Date(item.date)),
        ...extractedData.weight.map((item) => new Date(item.date)),
        ...extractedData.sleep.map((item) => new Date(item.date)),
        ...extractedData.vo2max.map((item) => new Date(item.date)),
        ...extractedData.workouts.map((item) => new Date(item.date)),
        ...extractedData.nutrition.map((item) => new Date(item.date)),
      ].filter((date) => !isNaN(date.getTime()));

      let dateRange = { start: null, end: null };

      if (allDates.length > 0) {
        const sortedDates = allDates.sort((a, b) => a - b);
        dateRange = {
          start: sortedDates[0].toISOString().split("T")[0],
          end: sortedDates[sortedDates.length - 1].toISOString().split("T")[0],
        };
      }

      // Record import history
      const importHistory = {
        date: new Date().toISOString(),
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: fileType,
        counts: stats,
        dateRange,
      };

      const prevHistory = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.IMPORT_HISTORY) || "[]"
      );
      saveToStorage(STORAGE_KEYS.IMPORT_HISTORY, [
        ...prevHistory,
        importHistory,
      ]);

      // Update UI
      setImportStats({
        counts: stats,
        dateRange,
      });

      setUploadStatus({
        status: "success",
        message: `Successfully imported health data from ${fileType.toUpperCase()} file!`,
      });

      // Notify parent component
      if (onDataImported) {
        onDataImported({
          counts: stats,
          dateRange,
        });
      }
    } catch (error) {
      console.error("Error importing data:", error);
      setUploadStatus({
        status: "error",
        message: `Error importing data: ${error.message}`,
      });
    }
  };

  // Helper function to read file as text
  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error("Error reading file"));
      reader.readAsText(file);
    });
  };

  // Helper function to extract health data from various formats
  const extractHealthData = (data, fileType) => {
    const extractedData = {
      heartRate: [],
      steps: [],
      weight: [],
      sleep: [],
      vo2max: [],
      workouts: [],
      nutrition: [],
    };

    if (fileType === "csv") {
      // CSV format could be many different layouts, try to infer
      processCsvData(data, extractedData);
    } else if (fileType === "json") {
      // JSON could be various formats, try to handle common ones
      processJsonData(data, extractedData);
    }

    return extractedData;
  };

  const processCsvData = (data, extractedData) => {
    if (!Array.isArray(data) || data.length === 0) return;

    // Get column names from first row
    const columns = Object.keys(data[0]);

    // Try to identify data types from column names
    const dateColumn = columns.find(
      (col) =>
        col.toLowerCase().includes("date") ||
        col.toLowerCase().includes("time") ||
        col.toLowerCase().includes("timestamp")
    );

    if (!dateColumn) {
      throw new Error("Couldn't find a date column in CSV");
    }

    // Look for health metrics by column name
    const typeColumn = columns.find(
      (col) =>
        col.toLowerCase().includes("type") ||
        col.toLowerCase().includes("metric") ||
        col.toLowerCase().includes("activity")
    );

    const valueColumn = columns.find(
      (col) =>
        col.toLowerCase().includes("value") ||
        col.toLowerCase().includes("amount") ||
        col.toLowerCase().includes("reading")
    );

    const heartRateColumn = columns.find(
      (col) =>
        col.toLowerCase().includes("heart") ||
        col.toLowerCase().includes("pulse") ||
        col.toLowerCase().includes("hr")
    );

    const stepsColumn = columns.find(
      (col) =>
        col.toLowerCase().includes("step") ||
        col.toLowerCase().includes("count")
    );

    const weightColumn = columns.find(
      (col) =>
        col.toLowerCase().includes("weight") ||
        col.toLowerCase().includes("mass") ||
        col.toLowerCase().includes("kg") ||
        col.toLowerCase().includes("lb")
    );

    const sleepColumn = columns.find(
      (col) =>
        col.toLowerCase().includes("sleep") ||
        col.toLowerCase().includes("slept") ||
        col.toLowerCase().includes("bedtime")
    );

    const vo2maxColumn = columns.find(
      (col) =>
        col.toLowerCase().includes("vo2") ||
        col.toLowerCase().includes("oxygen") ||
        col.toLowerCase().includes("aerobic")
    );

    // Workout-related columns
    const workoutNameColumn = columns.find(
      (col) =>
        col.toLowerCase().includes("workout") ||
        col.toLowerCase().includes("exercise") ||
        col.toLowerCase().includes("activity")
    );

    const durationColumn = columns.find(
      (col) =>
        col.toLowerCase().includes("duration") ||
        col.toLowerCase().includes("length") ||
        col.toLowerCase().includes("time")
    );

    const caloriesColumn = columns.find(
      (col) =>
        col.toLowerCase().includes("calorie") ||
        col.toLowerCase().includes("energy") ||
        col.toLowerCase().includes("kcal")
    );

    const distanceColumn = columns.find(
      (col) =>
        col.toLowerCase().includes("distance") ||
        col.toLowerCase().includes("length") ||
        col.toLowerCase().includes("km") ||
        col.toLowerCase().includes("mile")
    );

    // Nutrition-related columns
    const foodColumn = columns.find(
      (col) =>
        col.toLowerCase().includes("food") ||
        col.toLowerCase().includes("meal") ||
        col.toLowerCase().includes("nutrition")
    );

    // Process each row
    data.forEach((row) => {
      const dateStr = row[dateColumn];
      if (!dateStr) return;

      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return; // Skip if date is invalid

        const dateIso = date.toISOString();

        // Check if this is a type-value format
        if (typeColumn && valueColumn) {
          const type = String(row[typeColumn] || "").toLowerCase();
          const value = row[valueColumn];

          if (value === undefined || value === null) return;

          if (type.includes("heart") || type.includes("pulse")) {
            extractedData.heartRate.push({
              date: dateIso,
              value: parseFloat(value),
              unit: row.unit || "bpm",
            });
          } else if (type.includes("step")) {
            extractedData.steps.push({
              date: dateIso,
              value: parseInt(value, 10),
              unit: row.unit || "count",
            });
          } else if (type.includes("weight") || type.includes("mass")) {
            extractedData.weight.push({
              date: dateIso,
              value: parseFloat(value),
              unit: row.unit || "kg",
            });
          } else if (type.includes("sleep")) {
            extractedData.sleep.push({
              date: dateIso,
              value: parseFloat(value),
              unit: row.unit || "hours",
            });
          } else if (type.includes("vo2") || type.includes("oxygen")) {
            extractedData.vo2max.push({
              date: dateIso,
              value: parseFloat(value),
              unit: row.unit || "ml/kg/min",
            });
          } else if (type.includes("workout") || type.includes("exercise")) {
            extractedData.workouts.push({
              date: dateIso,
              type: type,
              duration: parseFloat(value),
              unit: row.unit || "minutes",
              calories: row.calories ? parseFloat(row.calories) : null,
              distance: row.distance ? parseFloat(row.distance) : null,
            });
          }
        } else {
          // Check each specific metric based on column existence
          if (
            heartRateColumn &&
            row[heartRateColumn] !== undefined &&
            row[heartRateColumn] !== null
          ) {
            extractedData.heartRate.push({
              date: dateIso,
              value: parseFloat(row[heartRateColumn]),
              unit: "bpm",
            });
          }

          if (
            stepsColumn &&
            row[stepsColumn] !== undefined &&
            row[stepsColumn] !== null
          ) {
            extractedData.steps.push({
              date: dateIso,
              value: parseInt(row[stepsColumn], 10),
              unit: "count",
            });
          }

          if (
            weightColumn &&
            row[weightColumn] !== undefined &&
            row[weightColumn] !== null
          ) {
            extractedData.weight.push({
              date: dateIso,
              value: parseFloat(row[weightColumn]),
              unit: "kg", // Assuming kg, could be converted based on column name
            });
          }

          if (
            sleepColumn &&
            row[sleepColumn] !== undefined &&
            row[sleepColumn] !== null
          ) {
            extractedData.sleep.push({
              date: dateIso,
              value: parseFloat(row[sleepColumn]),
              unit: "hours",
            });
          }

          if (
            vo2maxColumn &&
            row[vo2maxColumn] !== undefined &&
            row[vo2maxColumn] !== null
          ) {
            extractedData.vo2max.push({
              date: dateIso,
              value: parseFloat(row[vo2maxColumn]),
              unit: "ml/kg/min",
            });
          }

          // Check for workout data
          if (
            workoutNameColumn &&
            durationColumn &&
            row[workoutNameColumn] !== undefined &&
            row[workoutNameColumn] !== null &&
            row[durationColumn] !== undefined &&
            row[durationColumn] !== null
          ) {
            extractedData.workouts.push({
              date: dateIso,
              type: row[workoutNameColumn],
              duration: parseFloat(row[durationColumn]),
              unit: "minutes",
              calories:
                caloriesColumn && row[caloriesColumn]
                  ? parseFloat(row[caloriesColumn])
                  : null,
              distance:
                distanceColumn && row[distanceColumn]
                  ? parseFloat(row[distanceColumn])
                  : null,
            });
          }

          // Check for nutrition data
          if (
            foodColumn &&
            caloriesColumn &&
            row[foodColumn] !== undefined &&
            row[foodColumn] !== null &&
            row[caloriesColumn] !== undefined &&
            row[caloriesColumn] !== null
          ) {
            // Find protein, carbs, and fat columns if they exist
            const proteinColumn = columns.find((col) =>
              col.toLowerCase().includes("protein")
            );
            const carbsColumn = columns.find(
              (col) =>
                col.toLowerCase().includes("carb") ||
                col.toLowerCase().includes("carbohydrate")
            );
            const fatColumn = columns.find((col) =>
              col.toLowerCase().includes("fat")
            );

            extractedData.nutrition.push({
              date: dateIso,
              name: row[foodColumn],
              calories: parseFloat(row[caloriesColumn]),
              protein:
                proteinColumn && row[proteinColumn]
                  ? parseFloat(row[proteinColumn])
                  : 0,
              carbs:
                carbsColumn && row[carbsColumn]
                  ? parseFloat(row[carbsColumn])
                  : 0,
              fat: fatColumn && row[fatColumn] ? parseFloat(row[fatColumn]) : 0,
            });
          }
        }
      } catch (error) {
        console.warn("Error processing row:", error);
        // Continue with next row
      }
    });
  };

  const processJsonData = (data, extractedData) => {
    // JSON could be in various formats
    if (Array.isArray(data)) {
      // Array of health records
      processJsonArray(data, extractedData);
    } else if (typeof data === "object") {
      // Object with categorized health data
      processJsonObject(data, extractedData);
    }
  };

  const processJsonArray = (data, extractedData) => {
    data.forEach((item) => {
      try {
        // Skip if not an object
        if (!item || typeof item !== "object") return;

        // Try to find a date field
        const dateField = findDateField(item);
        if (!dateField) return;

        const date = new Date(item[dateField]);
        if (isNaN(date.getTime())) return; // Skip if date is invalid

        const dateIso = date.toISOString();

        // Check for a type field
        const typeField = findField(item, [
          "type",
          "metric",
          "category",
          "measurement",
        ]);

        if (typeField) {
          // Type-based processing
          const type = String(item[typeField] || "").toLowerCase();
          const valueField = findField(item, [
            "value",
            "amount",
            "reading",
            "measurement",
          ]);

          if (!valueField) return;

          const value = item[valueField];
          if (value === undefined || value === null) return;

          if (type.includes("heart") || type.includes("pulse")) {
            extractedData.heartRate.push({
              date: dateIso,
              value: parseFloat(value),
              unit: item.unit || "bpm",
            });
          } else if (type.includes("step")) {
            extractedData.steps.push({
              date: dateIso,
              value: parseInt(value, 10),
              unit: item.unit || "count",
            });
          } else if (type.includes("weight") || type.includes("mass")) {
            extractedData.weight.push({
              date: dateIso,
              value: parseFloat(value),
              unit: item.unit || "kg",
            });
          } else if (type.includes("sleep")) {
            extractedData.sleep.push({
              date: dateIso,
              value: parseFloat(value),
              unit: item.unit || "hours",
            });
          } else if (type.includes("vo2") || type.includes("oxygen")) {
            extractedData.vo2max.push({
              date: dateIso,
              value: parseFloat(value),
              unit: item.unit || "ml/kg/min",
            });
          } else if (type.includes("workout") || type.includes("exercise")) {
            extractedData.workouts.push({
              date: dateIso,
              type: type,
              duration: parseFloat(value),
              unit: item.unit || "minutes",
              calories: item.calories ? parseFloat(item.calories) : null,
              distance: item.distance ? parseFloat(item.distance) : null,
            });
          } else if (
            type.includes("food") ||
            type.includes("meal") ||
            type.includes("nutrition")
          ) {
            extractedData.nutrition.push({
              date: dateIso,
              name: item.name || item.food || "Unknown",
              calories: item.calories ? parseFloat(item.calories) : 0,
              protein: item.protein ? parseFloat(item.protein) : 0,
              carbs:
                item.carbs || item.carbohydrates
                  ? parseFloat(item.carbs || item.carbohydrates)
                  : 0,
              fat: item.fat ? parseFloat(item.fat) : 0,
            });
          }
        } else {
          // Property-based detection

          // Heart rate
          const heartRateField = findField(item, [
            "heartRate",
            "heart_rate",
            "pulse",
            "hr",
          ]);
          if (
            heartRateField &&
            item[heartRateField] !== undefined &&
            item[heartRateField] !== null
          ) {
            extractedData.heartRate.push({
              date: dateIso,
              value: parseFloat(item[heartRateField]),
              unit: "bpm",
            });
          }

          // Steps
          const stepsField = findField(item, [
            "steps",
            "step_count",
            "stepCount",
          ]);
          if (
            stepsField &&
            item[stepsField] !== undefined &&
            item[stepsField] !== null
          ) {
            extractedData.steps.push({
              date: dateIso,
              value: parseInt(item[stepsField], 10),
              unit: "count",
            });
          }

          // Weight
          const weightField = findField(item, [
            "weight",
            "body_mass",
            "bodyMass",
          ]);
          if (
            weightField &&
            item[weightField] !== undefined &&
            item[weightField] !== null
          ) {
            extractedData.weight.push({
              date: dateIso,
              value: parseFloat(item[weightField]),
              unit: "kg",
            });
          }

          // Sleep
          const sleepField = findField(item, [
            "sleep",
            "sleep_duration",
            "sleepTime",
            "slept",
          ]);
          if (
            sleepField &&
            item[sleepField] !== undefined &&
            item[sleepField] !== null
          ) {
            extractedData.sleep.push({
              date: dateIso,
              value: parseFloat(item[sleepField]),
              unit: "hours",
            });
          }

          // VO2max
          const vo2maxField = findField(item, [
            "vo2max",
            "vo2_max",
            "vo2Max",
            "oxygenConsumption",
          ]);
          if (
            vo2maxField &&
            item[vo2maxField] !== undefined &&
            item[vo2maxField] !== null
          ) {
            extractedData.vo2max.push({
              date: dateIso,
              value: parseFloat(item[vo2maxField]),
              unit: "ml/kg/min",
            });
          }

          // Workout
          const workoutField = findField(item, [
            "workout",
            "exercise",
            "activity",
          ]);
          const durationField = findField(item, ["duration", "length", "time"]);
          if (
            workoutField &&
            durationField &&
            item[workoutField] !== undefined &&
            item[workoutField] !== null &&
            item[durationField] !== undefined &&
            item[durationField] !== null
          ) {
            const caloriesField = findField(item, [
              "calories",
              "energy",
              "kcal",
            ]);
            const distanceField = findField(item, [
              "distance",
              "length",
              "kilometers",
              "miles",
            ]);

            extractedData.workouts.push({
              date: dateIso,
              type: item[workoutField],
              duration: parseFloat(item[durationField]),
              unit: "minutes",
              calories:
                caloriesField && item[caloriesField]
                  ? parseFloat(item[caloriesField])
                  : null,
              distance:
                distanceField && item[distanceField]
                  ? parseFloat(item[distanceField])
                  : null,
            });
          }

          // Nutrition
          const foodField = findField(item, [
            "food",
            "meal",
            "foodItem",
            "dish",
          ]);
          const caloriesField = findField(item, ["calories", "energy", "kcal"]);
          if (
            foodField &&
            caloriesField &&
            item[foodField] !== undefined &&
            item[foodField] !== null &&
            item[caloriesField] !== undefined &&
            item[caloriesField] !== null
          ) {
            const proteinField = findField(item, ["protein"]);
            const carbsField = findField(item, ["carbs", "carbohydrates"]);
            const fatField = findField(item, ["fat", "fats"]);

            extractedData.nutrition.push({
              date: dateIso,
              name: item[foodField],
              calories: parseFloat(item[caloriesField]),
              protein:
                proteinField && item[proteinField]
                  ? parseFloat(item[proteinField])
                  : 0,
              carbs:
                carbsField && item[carbsField]
                  ? parseFloat(item[carbsField])
                  : 0,
              fat: fatField && item[fatField] ? parseFloat(item[fatField]) : 0,
            });
          }
        }
      } catch (error) {
        console.warn("Error processing JSON item:", error);
        // Continue with next item
      }
    });
  };

  const processJsonObject = (data, extractedData) => {
    // Process object with categorized data
    if (data.heartRate || data.heart_rate) {
      processJsonArray(data.heartRate || data.heart_rate, {
        ...extractedData,
        steps: [],
        weight: [],
        sleep: [],
        vo2max: [],
        workouts: [],
        nutrition: [],
      });
    }

    if (data.steps || data.stepCount || data.step_count) {
      processJsonArray(data.steps || data.stepCount || data.step_count, {
        ...extractedData,
        heartRate: [],
        weight: [],
        sleep: [],
        vo2max: [],
        workouts: [],
        nutrition: [],
      });
    }

    if (data.weight || data.bodyMass || data.body_mass) {
      processJsonArray(data.weight || data.bodyMass || data.body_mass, {
        ...extractedData,
        heartRate: [],
        steps: [],
        sleep: [],
        vo2max: [],
        workouts: [],
        nutrition: [],
      });
    }

    if (data.sleep || data.sleepData || data.sleep_data) {
      processJsonArray(data.sleep || data.sleepData || data.sleep_data, {
        ...extractedData,
        heartRate: [],
        steps: [],
        weight: [],
        vo2max: [],
        workouts: [],
        nutrition: [],
      });
    }

    if (data.vo2max || data.vo2Max || data.vo2_max) {
      processJsonArray(data.vo2max || data.vo2Max || data.vo2_max, {
        ...extractedData,
        heartRate: [],
        steps: [],
        weight: [],
        sleep: [],
        workouts: [],
        nutrition: [],
      });
    }

    if (data.workouts || data.workout || data.exercises || data.exercise) {
      processJsonArray(
        data.workouts || data.workout || data.exercises || data.exercise,
        {
          ...extractedData,
          heartRate: [],
          steps: [],
          weight: [],
          sleep: [],
          vo2max: [],
          nutrition: [],
        }
      );
    }

    if (data.nutrition || data.meals || data.food) {
      processJsonArray(data.nutrition || data.meals || data.food, {
        ...extractedData,
        heartRate: [],
        steps: [],
        weight: [],
        sleep: [],
        vo2max: [],
        workouts: [],
      });
    }
  };

  // Helper function to find a field in an object based on possible names
  const findField = (obj, possibleNames) => {
    return possibleNames.find((name) => name in obj);
  };

  // Helper function specifically for finding date field
  const findDateField = (obj) => {
    return findField(obj, [
      "date",
      "dateTime",
      "datetime",
      "timestamp",
      "time",
      "startDate",
      "start_date",
      "endDate",
      "end_date",
      "createdAt",
      "created_at",
      "updatedAt",
      "updated_at",
    ]);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setUploadStatus(null);
    setImportStats(null);
    setProcessingProgress(0);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // If worker is running, terminate it
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  };

  // Clean up worker on unmount
  React.useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="bg-gray-950 border border-cyan-800 rounded-lg p-6">
      <h3 className="text-lg font-mono text-cyan-300 mb-4">
        IMPORT HEALTH DATA
      </h3>

      <div className="mb-6">
        <p className="text-sm text-cyan-600 font-mono mb-4">
          Upload your health data to visualize it in NEO•VITRU. Supported
          formats:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900 p-3 rounded border border-cyan-900">
            <div className="flex justify-center mb-2">
              <Calendar size={24} className="text-cyan-500" />
            </div>
            <h4 className="text-center text-cyan-400 font-mono text-sm mb-1">
              Apple Health XML
            </h4>
            <p className="text-xs text-center text-cyan-600">
              Export from Apple Health app
            </p>
          </div>

          <div className="bg-gray-900 p-3 rounded border border-cyan-900">
            <div className="flex justify-center mb-2">
              <FileText size={24} className="text-cyan-500" />
            </div>
            <h4 className="text-center text-cyan-400 font-mono text-sm mb-1">
              CSV Files
            </h4>
            <p className="text-xs text-center text-cyan-600">
              From fitness apps and wearables
            </p>
          </div>

          <div className="bg-gray-900 p-3 rounded border border-cyan-900">
            <div className="flex justify-center mb-2">
              <Download size={24} className="text-cyan-500" />
            </div>
            <h4 className="text-center text-cyan-400 font-mono text-sm mb-1">
              JSON Format
            </h4>
            <p className="text-xs text-center text-cyan-600">
              Common fitness API export format
            </p>
          </div>
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            selectedFile ? "border-cyan-600 bg-cyan-900/10" : "border-gray-700"
          }`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {!selectedFile ? (
            <>
              <Upload size={36} className="mx-auto text-cyan-600 mb-3" />
              <p className="text-cyan-500 font-mono mb-4">
                DRAG AND DROP FILE OR CLICK TO BROWSE
              </p>
              <input
                type="file"
                accept=".csv,.json,.xml"
                onChange={handleFileSelect}
                className="hidden"
                id="health-data-upload"
                ref={fileInputRef}
              />
              <label
                htmlFor="health-data-upload"
                className="bg-cyan-900 text-cyan-300 border border-cyan-700 px-4 py-2 rounded font-mono cursor-pointer hover:bg-cyan-800 transition"
              >
                SELECT FILE
              </label>
            </>
          ) : (
            <>
              <FileText size={36} className="mx-auto text-cyan-500 mb-3" />
              <p className="text-cyan-300 font-mono mb-1">
                {selectedFile.name}
              </p>
              <p className="text-cyan-600 font-mono mb-4">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>

              <div className="flex justify-center space-x-3">
                <button
                  onClick={clearSelectedFile}
                  className="bg-gray-800 text-gray-300 border border-gray-700 px-4 py-2 rounded font-mono hover:bg-gray-700 transition"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => processHealthData(selectedFile)}
                  disabled={isUploading}
                  className="bg-cyan-900 text-cyan-300 border border-cyan-700 px-4 py-2 rounded font-mono hover:bg-cyan-800 transition flex items-center"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-cyan-500 border-t-transparent rounded-full"></div>
                      PROCESSING
                    </>
                  ) : (
                    "IMPORT DATA"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {uploadStatus && (
        <div
          className={`p-4 rounded-lg ${
            uploadStatus.status === "success"
              ? "bg-green-900/20 border border-green-800"
              : uploadStatus.status === "error"
              ? "bg-red-900/20 border border-red-800"
              : "bg-cyan-900/20 border border-cyan-800"
          }`}
        >
          <div className="flex items-start">
            {uploadStatus.status === "success" ? (
              <Check size={20} className="text-green-500 mr-3 mt-0.5" />
            ) : uploadStatus.status === "error" ? (
              <AlertTriangle size={20} className="text-red-500 mr-3 mt-0.5" />
            ) : (
              <div className="animate-spin mr-3 h-5 w-5 border-2 border-cyan-500 border-t-transparent rounded-full mt-0.5"></div>
            )}
            <div className="flex-1">
              <p
                className={`font-mono ${
                  uploadStatus.status === "success"
                    ? "text-green-400"
                    : uploadStatus.status === "error"
                    ? "text-red-400"
                    : "text-cyan-400"
                }`}
              >
                {uploadStatus.status === "success"
                  ? "IMPORT SUCCESSFUL"
                  : uploadStatus.status === "error"
                  ? "IMPORT FAILED"
                  : "PROCESSING"}
              </p>
              <p className="text-sm font-mono text-gray-400 mt-1">
                {uploadStatus.message}
              </p>

              {uploadStatus.status === "processing" &&
                processingProgress > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-800 h-1.5 rounded-full">
                      <div
                        className="bg-cyan-500 h-1.5 rounded-full"
                        style={{ width: `${processingProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-cyan-600 font-mono mt-1 text-right">
                      {processingProgress}%
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {importStats && (
        <div className="mt-6 bg-gray-900 border border-cyan-800 rounded-lg p-4">
          <h4 className="text-sm font-mono text-cyan-300 mb-3">
            IMPORT SUMMARY
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(importStats.counts)
              .filter(([_, value]) => value > 0) // Only show non-zero counts
              .map(([key, value]) => (
                <div key={key} className="bg-gray-950 p-3 rounded-lg">
                  <p className="text-xs text-cyan-600 font-mono">
                    {key.toUpperCase()}
                  </p>
                  <p className="text-lg font-bold text-cyan-300 font-mono">
                    {value.toLocaleString()}
                  </p>
                </div>
              ))}
          </div>
          {importStats.dateRange.start && (
            <p className="text-xs text-cyan-600 font-mono mt-4">
              Data range: {importStats.dateRange.start} to{" "}
              {importStats.dateRange.end}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
