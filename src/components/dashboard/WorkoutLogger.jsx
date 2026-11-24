// src/components/dashboard/WorkoutLogger.jsx
import React, { useState, useEffect } from "react";
import {
  Check,
  Clock,
  Dumbbell,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import {
  WORKOUT_TEMPLATES,
  buildExerciseEntriesFromTemplate,
  calculateWorkoutVolume,
  saveWorkoutSession,
  searchExercises,
} from "../../services/workoutService";

const MUSCLE_GROUPS = ["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Full Body"];

export default function WorkoutLogger({ onWorkoutLogged }) {
  const [workoutName, setWorkoutName] = useState("Strength Session");
  const [workoutType, setWorkoutType] = useState("strength_training");
  const [duration, setDuration] = useState(45);
  const [exercises, setExercises] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [saveMessage, setSaveMessage] = useState("");

  // Rest Timer state
  const [restSeconds, setRestSeconds] = useState(90);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    if (!timerRunning || restSeconds <= 0) {
      if (restSeconds === 0 && timerRunning) setTimerRunning(false);
      return;
    }
    const id = setInterval(() => {
      setRestSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning, restSeconds]);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleLoadTemplate = (template) => {
    setWorkoutName(template.name);
    setWorkoutType(template.type);
    setDuration(template.estimatedMinutes);
    setExercises(buildExerciseEntriesFromTemplate(template.id));
    setSaveMessage("");
  };

  const handleAddExercise = (ex) => {
    setExercises((prev) => [
      ...prev,
      {
        exerciseId: ex.id,
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        kbRef: ex.kbRef,
        sets: Array.from({ length: ex.defaultSets }, () => ({
          reps: ex.defaultReps,
          weight: ex.category === "Cardio" ? 0 : 40,
          completed: false,
        })),
      },
    ]);
  };

  const handleUpdateSet = (exIdx, setIdx, field, value) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        const updatedSets = ex.sets.map((s, j) =>
          j === setIdx ? { ...s, [field]: value } : s
        );
        return { ...ex, sets: updatedSets };
      })
    );
  };

  const handleAddSet = (exIdx) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        const last = ex.sets[ex.sets.length - 1] || { reps: 10, weight: 40 };
        return {
          ...ex,
          sets: [...ex.sets, { reps: last.reps, weight: last.weight, completed: false }],
        };
      })
    );
  };

  const handleRemoveExercise = (exIdx) => {
    setExercises((prev) => prev.filter((_, i) => i !== exIdx));
  };

  const handleSaveWorkout = () => {
    if (exercises.length === 0) return;
    const saved = saveWorkoutSession({
      name: workoutName,
      type: workoutType,
      duration,
      exercises,
    });
    setSaveMessage(
      `Saved "${saved.name}" (${saved.duration} min · ${saved.calories} kcal · ${saved.volume.toLocaleString()} kg vol)`
    );
    setExercises([]);
    if (onWorkoutLogged) {
      onWorkoutLogged(saved);
    }
  };

  const filteredExercises = searchExercises(searchQuery, selectedGroup);
  const totalVolume = calculateWorkoutVolume(exercises);

  return (
    <div className="space-y-6">
      {/* Templates & Rest Timer Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-900 border border-cyan-800 rounded-lg p-5">
          <h2 className="text-sm font-mono text-cyan-300 mb-3 flex items-center">
            <Dumbbell size={16} className="mr-2 text-cyan-500" />
            WORKOUT TEMPLATES
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {WORKOUT_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => handleLoadTemplate(tpl)}
                className="text-left p-3 bg-gray-950 border border-cyan-900 hover:border-cyan-500 rounded transition-colors"
              >
                <p className="text-xs font-mono text-cyan-300 font-bold">{tpl.name}</p>
                <p className="text-[11px] font-mono text-cyan-600 mt-0.5">
                  {tpl.exercises.length} exercises · ~{tpl.estimatedMinutes}m
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Rest Timer */}
        <div className="bg-gray-900 border border-cyan-800 rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-mono text-cyan-300 flex items-center">
              <Clock size={16} className="mr-2 text-cyan-500" />
              REST TIMER
            </h2>
            <div className="flex space-x-1">
              {[60, 90, 120, 180].map((sec) => (
                <button
                  key={sec}
                  onClick={() => {
                    setTimerRunning(false);
                    setRestSeconds(sec);
                  }}
                  className="px-1.5 py-0.5 text-[10px] font-mono bg-gray-950 border border-cyan-900 hover:border-cyan-500 rounded text-cyan-400"
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>
          <div className="text-center my-2">
            <span className="text-3xl font-bold font-mono text-cyber-cyan">
              {formatTimer(restSeconds)}
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setTimerRunning((prev) => !prev)}
              className="flex-1 py-1.5 bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-600 rounded font-mono text-xs flex items-center justify-center"
            >
              {timerRunning ? <Pause size={13} className="mr-1" /> : <Play size={13} className="mr-1" />}
              {timerRunning ? "PAUSE" : "START"}
            </button>
            <button
              onClick={() => {
                setTimerRunning(false);
                setRestSeconds(90);
              }}
              className="px-3 py-1.5 bg-gray-950 border border-cyan-900 hover:border-cyan-600 text-cyan-400 rounded font-mono text-xs"
              title="Reset Timer"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      </div>

      {saveMessage && (
        <div className="p-3 bg-green-900/30 border border-green-700 rounded text-xs font-mono text-green-300">
          {saveMessage}
        </div>
      )}

      {/* Active Session + Exercise Database */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Workout Sheet */}
        <div className="lg:col-span-2 bg-gray-900 border border-cyan-800 rounded-lg p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center space-x-3 flex-1">
              <input
                type="text"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                aria-label="Workout Name"
                className="bg-gray-950 border border-cyan-800 rounded px-3 py-1.5 text-sm font-mono text-cyan-200 flex-1"
              />
              <input
                type="number"
                min="5"
                max="240"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10) || 0)}
                aria-label="Duration in minutes"
                className="w-20 bg-gray-950 border border-cyan-800 rounded px-2 py-1.5 text-sm font-mono text-cyan-200"
              />
              <span className="text-xs font-mono text-cyan-600">MIN</span>
            </div>
            <div className="text-xs font-mono text-cyan-400">
              VOLUME: {totalVolume.toLocaleString()} kg
            </div>
          </div>

          {exercises.length === 0 ? (
            <div className="text-center py-10 bg-gray-950 border border-cyan-900/60 rounded">
              <Dumbbell size={28} className="mx-auto text-cyan-700 mb-2" />
              <p className="text-xs font-mono text-cyan-500">
                SELECT A TEMPLATE OR ADD EXERCISES FROM THE DATABASE
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {exercises.map((ex, exIdx) => (
                <div
                  key={`${ex.exerciseId}-${exIdx}`}
                  className="bg-gray-950 border border-cyan-900 rounded p-4"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="text-sm font-mono text-cyan-300 font-bold">
                        {ex.name}
                      </h3>
                      <p className="text-[11px] font-mono text-cyan-600">
                        {ex.muscleGroup} {ex.kbRef ? `· KB ${ex.kbRef}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveExercise(exIdx)}
                      className="text-gray-500 hover:text-red-400"
                      title="Remove Exercise"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-2 text-[10px] font-mono text-cyan-600 px-1">
                      <span>SET</span>
                      <span>WEIGHT (KG)</span>
                      <span>REPS</span>
                      <span className="text-right">DONE</span>
                    </div>
                    {ex.sets.map((s, setIdx) => (
                      <div key={setIdx} className="grid grid-cols-4 gap-2 items-center">
                        <span className="text-xs font-mono text-cyan-500 pl-1">
                          #{setIdx + 1}
                        </span>
                        <input
                          type="number"
                          value={s.weight}
                          onChange={(e) =>
                            handleUpdateSet(exIdx, setIdx, "weight", parseFloat(e.target.value) || 0)
                          }
                          className="bg-gray-900 border border-cyan-900 rounded px-2 py-1 text-xs font-mono text-cyan-200"
                        />
                        <input
                          type="number"
                          value={s.reps}
                          onChange={(e) =>
                            handleUpdateSet(exIdx, setIdx, "reps", parseInt(e.target.value, 10) || 0)
                          }
                          className="bg-gray-900 border border-cyan-900 rounded px-2 py-1 text-xs font-mono text-cyan-200"
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateSet(exIdx, setIdx, "completed", !s.completed)
                            }
                            aria-label={`Mark set ${setIdx + 1} complete`}
                            className={`p-1.5 rounded border ${
                              s.completed
                                ? "bg-green-900/50 border-green-500 text-green-300"
                                : "bg-gray-900 border-cyan-900 text-gray-500 hover:border-cyan-500"
                            }`}
                          >
                            <Check size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddSet(exIdx)}
                      className="text-[11px] font-mono text-cyan-500 hover:text-cyan-300 flex items-center pt-1"
                    >
                      <Plus size={12} className="mr-1" /> ADD SET
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleSaveWorkout}
                className="w-full py-2.5 bg-cyan-900 hover:bg-cyan-800 text-cyan-200 border border-cyan-500 rounded font-mono text-sm flex items-center justify-center"
              >
                <Save size={15} className="mr-2" /> SAVE WORKOUT SESSION
              </button>
            </div>
          )}
        </div>

        {/* Exercise Database Picker */}
        <div className="bg-gray-900 border border-cyan-800 rounded-lg p-5">
          <h2 className="text-sm font-mono text-cyan-300 mb-3 flex items-center">
            <Search size={15} className="mr-2 text-cyan-500" />
            EXERCISE DATABASE
          </h2>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exercises..."
            className="w-full bg-gray-950 border border-cyan-900 rounded px-3 py-1.5 text-xs font-mono text-cyan-200 mb-2"
          />
          <div className="flex flex-wrap gap-1 mb-3">
            {MUSCLE_GROUPS.map((group) => (
              <button
                key={group}
                type="button"
                onClick={() => setSelectedGroup(group)}
                className={`px-2 py-0.5 text-[10px] font-mono rounded border ${
                  selectedGroup === group
                    ? "bg-cyan-900/60 border-cyan-500 text-cyan-200"
                    : "bg-gray-950 border-cyan-900 text-cyan-600 hover:text-cyan-400"
                }`}
              >
                {group}
              </button>
            ))}
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filteredExercises.map((ex) => (
              <div
                key={ex.id}
                className="flex items-center justify-between p-2.5 bg-gray-950 border border-cyan-900/70 rounded"
              >
                <div>
                  <p className="text-xs font-mono text-cyan-300">{ex.name}</p>
                  <p className="text-[10px] font-mono text-cyan-600">
                    {ex.muscleGroup} · {ex.defaultSets}×{ex.defaultReps}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddExercise(ex)}
                  className="px-2 py-1 text-[10px] font-mono bg-cyan-900/50 hover:bg-cyan-800 text-cyan-300 border border-cyan-700 rounded flex items-center"
                >
                  <Plus size={11} className="mr-0.5" /> ADD
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
