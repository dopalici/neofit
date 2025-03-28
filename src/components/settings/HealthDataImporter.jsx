import { AlertTriangle, Check, FileText, Upload } from "lucide-react";
import Papa from "papaparse";
import React, { useState } from "react";
import { importHealthData } from "../../services/dataImportService";

export default function HealthDataImporter({ onDataImported }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importStats, setImportStats] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setUploadStatus(null);
    setImportStats(null);
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
        // For XML files (common for Apple Health exports)
        setUploadStatus({
          status: "error",
          message:
            "XML parsing requires additional libraries. Please convert to CSV or JSON format.",
        });
      } else {
        setUploadStatus({
          status: "error",
          message: `Unsupported file type: ${fileType}. Please use CSV or JSON.`,
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
          Supported formats: CSV, JSON
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
