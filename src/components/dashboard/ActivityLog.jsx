// src/components/dashboard/ActivityLog.jsx (New or Updated Component)
import React, { useState, useEffect } from 'react';
import { Activity, Clock, Flame } from 'lucide-react'; // Removed unused Calendar import
import { getFromStorage, STORAGE_KEYS } from '../../utils/storageUtils'; // Use storage utils
import { parseISO, formatDistanceToNowStrict } from 'date-fns'; // Removed unused format import

// Function to format duration from seconds or minutes
const formatDuration = (value, unit) => {
  // ... (keep existing implementation)
  if (!value || !unit) return '--';
  const duration = parseFloat(value);
  if (isNaN(duration)) return '--';

  if (unit.toLowerCase().includes('second')) {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.round(duration % 60);
    return `${minutes}m ${seconds}s`;
  } else if (unit.toLowerCase().includes('minute')) {
    return `${Math.round(duration)} min`;
  } else {
     return `${duration.toFixed(1)} ${unit}`; // Fallback
  }
};

// Function to format workout type name
const formatWorkoutType = (type) => {
  // ... (keep existing implementation)
   if (!type) return 'Workout';
   // Simple formatting: replace underscores, capitalize
   return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function ActivityLog() {
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    try {
      const storedWorkouts = getFromStorage(STORAGE_KEYS.WORKOUT_LOGS, []);
      // Sort by date descending and take the most recent ones
      const sorted = storedWorkouts
        .filter(w => w && w.date) // Ensure entry and date exist
        .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
      setWorkouts(sorted);
    } catch (error) {
      console.error("Error loading workout logs:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="bg-gray-900 border border-cyan-800 rounded shadow-lg shadow-cyan-900/20 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
           <h2 className="text-lg font-mono text-cyan-300">ACTIVITY LOG</h2>
           {/* Optional: Add filter/view all button */}
           {/* <button className="text-cyan-600 text-xs font-mono">VIEW ALL</button> */}
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-12 bg-gray-800 rounded"></div>
            <div className="h-12 bg-gray-800 rounded"></div>
            <div className="h-12 bg-gray-800 rounded"></div>
          </div>
        ) : workouts.length > 0 ? (
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2"> {/* Added max height and scroll */}
            {workouts.slice(0, 5).map((workout, index) => ( // Display latest 5
              <div key={workout.date || index} className="bg-gray-950 border border-cyan-900 p-3 rounded"> {/* Used date as key */}
                <div className="flex justify-between items-center mb-1">
                  <p className="font-mono text-sm text-cyan-400 flex items-center">
                     <Activity size={14} className="mr-2 opacity-70" />
                     {formatWorkoutType(workout.type)}
                  </p>
                  <p className="text-xs text-cyan-600 font-mono">
                    {formatDistanceToNowStrict(parseISO(workout.date), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-cyan-600 font-mono mt-1">
                   <span className="flex items-center">
                       <Clock size={12} className="mr-1 opacity-70"/>
                       Duration: {formatDuration(workout.duration, workout.unit)}
                   </span>
                   {workout.calories && (
                      <span className="flex items-center">
                         <Flame size={12} className="mr-1 opacity-70"/>
                         {parseFloat(workout.calories).toFixed(0)} kcal {/* Ensure calories are parsed */}
                      </span>
                   )}
                    {/* Add distance if available */}
                   {workout.distance && (
                      <span className="flex items-center">
                         {/* Add an icon for distance */}
                         Distance: {parseFloat(workout.distance).toFixed(1)} km {/* Ensure distance is parsed */}
                      </span>
                   )}
                </div>
              </div>
            ))}
          </div>
        ) : (
           <div className="text-center py-10">
            <Activity size={32} className="mx-auto text-cyan-700 mb-3" />
            <p className="text-cyan-600 font-mono text-sm">NO RECENT ACTIVITY</p>
            <p className="text-xs text-cyan-600 font-mono mt-1">
              Import data or log workouts to populate the log.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}