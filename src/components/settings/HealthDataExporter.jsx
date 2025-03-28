import { AlertTriangle, Check, Download } from "lucide-react";
import React, { useState } from "react";
import {
  downloadFile,
  exportHealthDataToCSV,
  exportHealthDataToJSON,
} from "../../services/dataExportService";
import { getAllHealthData } from "../../services/dataImportService";

export default function HealthDataExporter() {
  const [exportStatus, setExportStatus] = useState(null);
  const [exportFormat, setExportFormat] = useState("csv");
  const [dataType, setDataType] = useState("all");

  // Get data counts to show which data types are available
  const healthData = getAllHealthData();
  const dataCounts = {
    heartRate: healthData.heartRate?.length || 0,
    steps: healthData.steps?.length || 0,
    weight: healthData.weight?.length || 0,
    sleep: healthData.sleep?.length || 0,
    vo2max: healthData.vo2max?.length || 0,
    workouts: healthData.workouts?.length || 0,
    all: Object.values(healthData).reduce(
      (total, arr) => total + (arr?.length || 0),
      0
    ),
  };

  const handleExport = () => {
    try {
      let result;

      if (exportFormat === "csv") {
        result = exportHealthDataToCSV(dataType);
      } else {
        result = exportHealthDataToJSON(dataType);
      }

      if (!result) {
        setExportStatus({
          success: false,
          message: "No data to export. Please import health data first.",
        });
        return;
      }

      downloadFile(result.blob, result.filename);

      setExportStatus({
        success: true,
        message: `Data exported successfully as ${result.filename}`,
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      setExportStatus({
        success: false,
        message: `Error exporting data: ${error.message}`,
      });
    }
  };

  return (
    <div className="bg-gray-950 border border-cyan-800 rounded-lg p-6">
      <h3 className="text-lg font-mono text-cyan-300 mb-4">
        EXPORT HEALTH DATA
      </h3>

      <div className="mb-6">
        <p className="text-sm text-cyan-600 font-mono mb-4">
          Export your health data for backup or analysis in external tools.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs text-cyan-600 font-mono block mb-2">
              DATA TYPE
            </label>
            <select
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
              className="w-full bg-gray-900 border border-cyan-800 rounded px-3 py-2 text-cyan-300 font-mono"
            >
              <option value="all">All Data ({dataCounts.all} records)</option>
              <option value="heartRate" disabled={dataCounts.heartRate === 0}>
                Heart Rate ({dataCounts.heartRate} records)
              </option>
              <option value="steps" disabled={dataCounts.steps === 0}>
                Steps ({dataCounts.steps} records)
              </option>
              <option value="weight" disabled={dataCounts.weight === 0}>
                Weight ({dataCounts.weight} records)
              </option>
              <option value="sleep" disabled={dataCounts.sleep === 0}>
                Sleep ({dataCounts.sleep} records)
              </option>
              <option value="vo2max" disabled={dataCounts.vo2max === 0}>
                VO2 Max ({dataCounts.vo2max} records)
              </option>
              <option value="workouts" disabled={dataCounts.workouts === 0}>
                Workouts ({dataCounts.workouts} records)
              </option>
            </select>
          </div>

          <div>
            <label className="text-xs text-cyan-600 font-mono block mb-2">
              FORMAT
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="csv"
                  checked={exportFormat === "csv"}
                  onChange={() => setExportFormat("csv")}
                  className="mr-2"
                />
                <span className="text-cyan-300 font-mono">CSV</span>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  value="json"
                  checked={exportFormat === "json"}
                  onChange={() => setExportFormat("json")}
                  className="mr-2"
                />
                <span className="text-cyan-300 font-mono">JSON</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={handleExport}
            disabled={dataCounts.all === 0}
            className={`flex items-center px-4 py-2 rounded font-mono ${
              dataCounts.all === 0
                ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                : "bg-cyan-900 text-cyan-300 border border-cyan-700 hover:bg-cyan-800 transition"
            }`}
          >
            <Download size={16} className="mr-2" />
            EXPORT DATA
          </button>
        </div>
      </div>

      {exportStatus && (
        <div
          className={`p-4 rounded-lg ${
            exportStatus.success
              ? "bg-green-900/20 border border-green-800"
              : "bg-red-900/20 border border-red-800"
          }`}
        >
          <div className="flex items-start">
            {exportStatus.success ? (
              <Check size={20} className="text-green-500 mr-3 mt-0.5" />
            ) : (
              <AlertTriangle size={20} className="text-red-500 mr-3 mt-0.5" />
            )}
            <div>
              <p
                className={`font-mono ${
                  exportStatus.success ? "text-green-400" : "text-red-400"
                }`}
              >
                {exportStatus.success ? "EXPORT SUCCESSFUL" : "EXPORT FAILED"}
              </p>
              <p className="text-sm font-mono text-gray-400 mt-1">
                {exportStatus.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {dataCounts.all === 0 && (
        <div className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-800">
          <div className="flex items-start">
            <AlertTriangle size={20} className="text-yellow-500 mr-3 mt-0.5" />
            <div>
              <p className="font-mono text-yellow-400">NO DATA AVAILABLE</p>
              <p className="text-sm font-mono text-gray-400 mt-1">
                Import health data first before exporting.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
