// src/components/dashboard/ActivityLog.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Bike,
  Clock,
  Dumbbell,
  Flame,
  Footprints,
  MapPin,
  RotateCw,
  Waves,
  Zap,
} from "lucide-react";
import { getFromStorage, STORAGE_KEYS } from "../../utils/storageUtils";
import { STORAGE_KEYS as IMPORT_STORAGE_KEYS } from "../../services/dataImportService";
import appleHealthService from "../../services/appleHealthService";
import { parseISO, isValid, formatDistanceToNowStrict } from "date-fns";

const PAGE_SIZE = 5;

const formatDuration = (value, unit = "minutes") => {
  if (value === undefined || value === null) return "--";
  const duration = parseFloat(value);
  if (Number.isNaN(duration)) return "--";

  const normalizedUnit = String(unit || "minutes").toLowerCase();
  if (normalizedUnit.includes("second")) {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.round(duration % 60);
    return `${minutes}m ${seconds}s`;
  }
  if (normalizedUnit.includes("minute") || normalizedUnit === "min") {
    return `${Math.round(duration)} min`;
  }
  return `${duration.toFixed(1)} ${unit}`;
};

const formatWorkoutType = (type) => {
  if (!type) return "Workout";
  return String(type)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

const getActivityIcon = (type) => {
  const normalized = String(type || "").toLowerCase();
  if (normalized.includes("run") || normalized.includes("walk") || normalized.includes("hik")) {
    return <Footprints size={14} className="mr-2 text-cyan-400" />;
  }
  if (normalized.includes("cycl") || normalized.includes("bike")) {
    return <Bike size={14} className="mr-2 text-green-400" />;
  }
  if (normalized.includes("strength") || normalized.includes("weight") || normalized.includes("lift")) {
    return <Dumbbell size={14} className="mr-2 text-blue-400" />;
  }
  if (normalized.includes("swim")) {
    return <Waves size={14} className="mr-2 text-sky-400" />;
  }
  if (normalized.includes("hiit") || normalized.includes("crossfit") || normalized.includes("interval")) {
    return <Zap size={14} className="mr-2 text-yellow-400" />;
  }
  return <Activity size={14} className="mr-2 text-cyan-400 opacity-80" />;
};

const formatRelativeTime = (dateStr) => {
  try {
    const parsed = parseISO(dateStr);
    if (!isValid(parsed)) return dateStr;
    return formatDistanceToNowStrict(parsed, { addSuffix: true });
  } catch (e) {
    return dateStr;
  }
};

export default function ActivityLog({ workouts: propWorkouts }) {
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const loadWorkouts = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      const manualWorkouts = getFromStorage(STORAGE_KEYS.WORKOUT_LOGS, []);
      const importedWorkouts = getFromStorage(IMPORT_STORAGE_KEYS.WORKOUT_DATA, []);

      let healthKitWorkouts = [];
      try {
        const hkResult = await appleHealthService.fetchWorkouts("month", forceRefresh);
        if (hkResult && Array.isArray(hkResult.data)) {
          healthKitWorkouts = hkResult.data;
        }
      } catch (hkErr) {
        // HealthKit unavailable on web; continue with local/imported workouts
      }

      const combined = [
        ...(Array.isArray(propWorkouts) ? propWorkouts : []),
        ...healthKitWorkouts,
        ...(Array.isArray(manualWorkouts) ? manualWorkouts : []),
        ...(Array.isArray(importedWorkouts) ? importedWorkouts : []),
      ];

      // Deduplicate by date + type
      const seen = new Set();
      const deduped = combined.filter((w) => {
        if (!w || !w.date) return false;
        const key = `${w.date}|${String(w.type || "").toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const sorted = deduped.sort((a, b) => {
        const timeA = new Date(a.date).getTime() || 0;
        const timeB = new Date(b.date).getTime() || 0;
        return timeB - timeA;
      });

      setWorkouts(sorted);
    } catch (error) {
      console.error("Error loading workout logs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [propWorkouts]);

  useEffect(() => {
    loadWorkouts(false);
  }, [loadWorkouts]);

  const visibleWorkouts = workouts.slice(0, visibleCount);
  const hasMore = visibleCount < workouts.length;

  return (
    <div className="bg-gray-900 border border-cyan-800 rounded shadow-lg shadow-cyan-900/20 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-mono text-cyan-300">ACTIVITY LOG</h2>
          <div className="flex items-center space-x-2">
            {workouts.length > 0 && (
              <span className="text-xs text-cyan-600 font-mono">
                {visibleWorkouts.length}/{workouts.length}
              </span>
            )}
            <button
              onClick={() => loadWorkouts(true)}
              className="text-cyan-500 hover:text-cyan-300"
              title="Refresh activities"
            >
              <RotateCw size={12} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-12 bg-gray-800 rounded"></div>
            <div className="h-12 bg-gray-800 rounded"></div>
            <div className="h-12 bg-gray-800 rounded"></div>
          </div>
        ) : workouts.length > 0 ? (
          <>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
              {visibleWorkouts.map((workout, index) => (
                <div
                  key={`${workout.date}-${workout.type}-${index}`}
                  className="bg-gray-950 border border-cyan-900 p-3 rounded"
                >
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-mono text-sm text-cyan-400 flex items-center">
                      {getActivityIcon(workout.type)}
                      {formatWorkoutType(workout.type)}
                    </p>
                    <p className="text-xs text-cyan-600 font-mono">
                      {formatRelativeTime(workout.date)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-cyan-600 font-mono mt-1">
                    <span className="flex items-center">
                      <Clock size={12} className="mr-1 opacity-70" />
                      {formatDuration(workout.duration, workout.unit)}
                    </span>
                    {workout.calories !== null && workout.calories !== undefined && (
                      <span className="flex items-center">
                        <Flame size={12} className="mr-1 opacity-70" />
                        {Math.round(parseFloat(workout.calories))} kcal
                      </span>
                    )}
                    {workout.distance !== null && workout.distance !== undefined && (
                      <span className="flex items-center">
                        <MapPin size={12} className="mr-1 opacity-70" />
                        {parseFloat(workout.distance).toFixed(1)} km
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {hasMore && (
              <button
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="mt-3 w-full py-2 text-xs font-mono text-cyan-400 bg-gray-950 border border-cyan-900 rounded hover:border-cyan-600 transition-colors"
              >
                LOAD MORE ({workouts.length - visibleCount} REMAINING)
              </button>
            )}
          </>
        ) : (
          <div className="text-center py-10">
            <Activity size={32} className="mx-auto text-cyan-700 mb-3" />
            <p className="text-cyan-600 font-mono text-sm">NO RECENT ACTIVITY</p>
            <p className="text-xs text-cyan-600 font-mono mt-1">
              Connect Apple Health or import workout data to populate the log.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}