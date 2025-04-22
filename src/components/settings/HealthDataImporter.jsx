import { AlertTriangle, Check, FileText, Upload } from "lucide-react";
import Papa from "papaparse";
import React, { useState } from "react";
import { importHealthData } from "../../services/dataImportService";

export default function HealthDataImporter({ onDataImported }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importStats, setImportStats] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setUploadStatus(null);
    setImportStats(null);
    setProcessingProgress(0);
  };

  const processHealthData = async (file) => {
    setIsUploading(true);
    setUploadStatus({ status: "processing", message: "Processing file..." });

    try {
      // Determine file type from extension
      const fileType = file.name.split(".").pop().toLowerCase();

      if (fileType === "csv") {
        // Process CSV file
        const text = await file.text();

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
              setIsUploading(false);
              return;
            }

            // Import the parsed data
            const stats = importHealthData(results.data, fileType);
            setImportStats(stats);
            setUploadStatus({
              status: "success",
              message: "Data imported successfully!",
            });

            // Notify parent component
            if (onDataImported) onDataImported(stats);
          },
          error: (error) => {
            setUploadStatus({
              status: "error",
              message: `Error parsing CSV: ${error.message}`,
            });
            setIsUploading(false);
          },
        });
      } else if (fileType === "json") {
        // Process JSON file
        const text = await file.text();
        try {
          const data = JSON.parse(text);
          const stats = importHealthData(data, fileType);
          setImportStats(stats);
          setUploadStatus({
            status: "success",
            message: "Data imported successfully!",
          });

          // Notify parent component
          if (onDataImported) onDataImported(stats);
        } catch (error) {
          setUploadStatus({
            status: "error",
            message: `Error parsing JSON: ${error.message}`,
          });
        }
      } else if (fileType === "xml") {
        // Process XML file (Apple Health Data)
        try {
          setUploadStatus({ 
            status: "processing", 
            message: "Reading Apple Health XML file..." 
          });
          
          // Process the file in chunks instead of loading it all at once
          const reader = new FileReader();
          
          reader.onload = (event) => {
            try {
              const text = event.target.result;
              
              setUploadStatus({ 
                status: "processing", 
                message: "Parsing XML data..." 
              });
              
              // Use a more robust parsing approach
              const parser = new DOMParser();
              const xmlDoc = parser.parseFromString(text, "text/xml");
              
              // Check for parsing errors (look for parsererror nodes)
              const parseErrors = xmlDoc.getElementsByTagName('parsererror');
              if (parseErrors.length > 0) {
                throw new Error("XML parsing error: " + parseErrors[0].textContent);
              }
              
              // Create an array to store the extracted data
              const extractedData = [];
              
              setUploadStatus({ 
                status: "processing", 
                message: "Extracting health data..." 
              });
              
              // Process the healthdata more carefully
              const healthData = xmlDoc.querySelector('HealthData');
              if (!healthData) {
                throw new Error("No HealthData element found in XML");
              }
              
              // Process records in batches for better performance
              processRecordsInBatches(xmlDoc, extractedData);
              
              // Import the extracted data
              if (extractedData.length === 0) {
                throw new Error("No usable health data found in the XML file");
              }
              
              setUploadStatus({ 
                status: "processing", 
                message: `Processing ${extractedData.length} health records...` 
              });
              
              const stats = importHealthData(extractedData, 'parsed-xml');
              setImportStats(stats);
              setUploadStatus({
                status: "success",
                message: `Successfully imported ${extractedData.length} records from Apple Health data!`,
              });
              
              // Notify parent component
              if (onDataImported) onDataImported(stats);
            } catch (err) {
              console.error("XML processing error:", err);
              setUploadStatus({
                status: "error",
                message: `Error processing XML: ${err.message}`,
              });
              setIsUploading(false);
            }
          };
          
          reader.onerror = (error) => {
            setUploadStatus({
              status: "error",
              message: `Error reading file: ${error}`,
            });
            setIsUploading(false);
          };
          
          // Read the file as text
          reader.readAsText(file);
          
          // Define the function to process records in batches
          function processRecordsInBatches(xmlDoc, extractedData) {
            // Process Record elements (contains most health metrics)
            const records = xmlDoc.querySelectorAll('Record');
            console.log(`Found ${records.length} records`);
            
            // Process in smaller batches to avoid browser freezing
            const batchSize = 5000;
            const totalBatches = Math.ceil(records.length / batchSize);
            
            for (let i = 0; i < records.length; i += batchSize) {
              const currentBatch = Math.floor(i / batchSize) + 1;
              setProcessingProgress(Math.floor((currentBatch / totalBatches) * 100));
              setUploadStatus({ 
                status: "processing", 
                message: `Processing records (batch ${currentBatch}/${totalBatches})...` 
              });
              
              const batch = Array.from(records).slice(i, i + batchSize);
              
              batch.forEach(record => {
                const type = record.getAttribute('type');
                const value = record.getAttribute('value');
                const unit = record.getAttribute('unit');
                const startDate = record.getAttribute('startDate');
                
                // Only process records with values
                if (value && startDate) {
                  // Map Apple Health types to our app's types
                  let dataType = 'other';
                  
                  if (type.includes('HeartRate')) {
                    dataType = 'heartRate';
                  } else if (type.includes('StepCount')) {
                    dataType = 'steps';
                  } else if (type.includes('BodyMass')) {
                    dataType = 'weight';
                  } else if (type.includes('VO2Max')) {
                    dataType = 'vo2max';
                  } else if (type.includes('SleepAnalysis')) {
                    dataType = 'sleep';
                  }
                  
                  extractedData.push({
                    type: dataType,
                    originalType: type,
                    value: parseFloat(value),
                    unit: unit,
                    date: startDate
                  });
                }
              });
            }
            
            // Process Workout elements
            setUploadStatus({ 
              status: "processing", 
              message: "Processing workouts..." 
            });
            
            const workouts = xmlDoc.querySelectorAll('Workout');
            console.log(`Found ${workouts.length} workouts`);
            workouts.forEach(workout => {
              const type = workout.getAttribute('workoutActivityType');
              const duration = workout.getAttribute('duration');
              const startDate = workout.getAttribute('startDate');
              const calories = workout.getAttribute('totalEnergyBurned');
              
              if (duration && startDate) {
                extractedData.push({
                  type: 'workout',
                  workoutType: type,
                  value: parseFloat(duration),
                  calories: calories ? parseFloat(calories) : null,
                  unit: 'seconds',
                  date: startDate
                });
              }
            });
          }
        } catch (error) {
          console.error("XML processing error:", error);
          setUploadStatus({
            status: "error",
            message: `Error processing XML: ${error.message}`,
          });
          setIsUploading(false);
        }
      } else {
        setUploadStatus({
          status: "error",
          message: `Unsupported file type: ${fileType}. Please use CSV, JSON, or XML.`,
        });
      }
    } catch (error) {
      setUploadStatus({
        status: "error",
        message: `Error processing file: ${error.message}`,
      });
    } finally {
      
        setIsUploading(false);
      
    }
  };

  return (
    <div className="bg-gray-950 border border-cyan-800 rounded-lg p-6">
      <h3 className="text-lg font-mono text-cyan-300 mb-4">
        IMPORT HEALTH DATA
      </h3>

      <div className="mb-6">
        <p className="text-sm text-cyan-600 font-mono mb-2">
          Upload your exported health data to visualize it in NEO•VITRU.
          Supported formats: CSV, JSON, XML (Apple Health)
        </p>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            selectedFile ? "border-cyan-600 bg-cyan-900/10" : "border-gray-700"
          }`}
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
                  onClick={() => setSelectedFile(null)}
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
            <div>
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
              
              {uploadStatus.status === "processing" && processingProgress > 0 && (
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
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(importStats.counts).map(([key, value]) => (
              <div key={key} className="bg-gray-950 p-3 rounded-lg">
                <p className="text-xs text-cyan-600 font-mono">
                  {key.toUpperCase()}
                </p>
                <p className="text-lg font-bold text-cyan-300 font-mono">
                  {value}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-cyan-600 font-mono mt-4">
            Data range: {importStats.dateRange.start} to{" "}
            {importStats.dateRange.end}
          </p>
        </div>
      )}
    </div>
  );
}