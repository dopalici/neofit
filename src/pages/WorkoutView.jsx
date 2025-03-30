import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Clock, RotateCw } from 'lucide-react';
import HumanBodyModelViewer from './HumanBodyModel';
import { getTargetedMuscles, getAvailableExercises } from '../utils/modelUtils';

export default function WorkoutView({ userData, workoutId, onComplete }) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exercises, setExercises] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSet, setCurrentSet] = useState(1);
  const [timer, setTimer] = useState(0);
  const [timerMode, setTimerMode] = useState('exercise'); // 'exercise', 'rest', 'complete'
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  
  // Load workout exercises
  useEffect(() => {
    // In a real app, you would fetch this data from an API or local storage
    // using the workoutId parameter
    
    // For demo purposes, we'll use our sample exercises
    const availableExercises = getAvailableExercises();
    
    // Simulate a workout routine with 3 exercises
    setExercises([
      availableExercises[0], // Push-up
      availableExercises[1], // Squat
      availableExercises[4]  // Deadlift
    ]);
  }, [workoutId]);
  
  // Get current exercise
  const currentExercise = exercises[currentExerciseIndex];
  
  // Get targeted muscles for the current exercise
  const targetedMuscles = currentExercise 
    ? currentExercise.targetMuscles
    : [];
  
  // Timer functionality
  useEffect(() => {
    if (isPlaying && currentExercise) {
      timerRef.current = setInterval(() => {
        setTimer(prevTimer => {
          const newTime = prevTimer + 1;
          
          // Calculate progress for the exercise animation
          if (timerMode === 'exercise') {
            // Assuming each rep takes about 4 seconds
            const repDuration = 4;
            const totalDuration = currentExercise.repetitions * repDuration;
            const newProgress = (newTime % totalDuration) / totalDuration;
            setProgress(newProgress);
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    
    return () => clearInterval(timerRef.current);
  }, [isPlaying, currentExercise, timerMode]);
  
  // Reset timer when exercise or set changes
  useEffect(() => {
    setTimer(0);
    setProgress(0);
  }, [currentExerciseIndex, currentSet]);
  
  // Handle exercise completion
  useEffect(() => {
    if (!currentExercise) return;
    
    const totalExerciseTime = currentExercise.repetitions * 4; // 4 seconds per rep
    
    if (timerMode === 'exercise' && timer >= totalExerciseTime) {
      // Exercise set completed
      if (currentSet < currentExercise.sets) {
        // Move to rest period before next set
        setTimerMode('rest');
        setTimer(0);
      } else {
        // All sets completed, move to next exercise
        setTimerMode('complete');
        setTimer(0);
      }
    } else if (timerMode === 'rest' && timer >= 60) { // 60 seconds rest
      // Rest period completed, start next set
      setCurrentSet(prevSet => prevSet + 1);
      setTimerMode('exercise');
      setTimer(0);
    } else if (timerMode === 'complete' && timer >= 5) { // 5 seconds before advancing
      // Advance to next exercise
      if (currentExerciseIndex < exercises.length - 1) {
        setCurrentExerciseIndex(prevIndex => prevIndex + 1);
        setCurrentSet(1);
        setTimerMode('exercise');
        setTimer(0);
      } else {
        // Workout complete
        setIsPlaying(false);
        if (onComplete) onComplete();
      }
    }
  }, [timer, timerMode, currentExercise, currentSet, currentExerciseIndex, exercises.length, onComplete]);
  
  // Format time as MM:SS
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Navigation functions
  const nextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prevIndex => prevIndex + 1);
      setCurrentSet(1);
      setTimerMode('exercise');
      setTimer(0);
    }
  };
  
  const prevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prevIndex => prevIndex - 1);
      setCurrentSet(1);
      setTimerMode('exercise');
      setTimer(0);
    }
  };
  
  // Create body composition object for the model
  const bodyComposition = {
    height: userData?.height || 1.78,
    weight: userData?.weight || 75,
    muscleMass: userData?.muscleMass || 42,
    bodyFat: userData?.bodyFat || 18,
    showMeasurements: false
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-cyan-300 font-mono">EXERCISE ENHANCEMENT MODULE</h1>
        <div className="text-xs text-cyan-600 font-mono">
          {exercises.length > 0 && `EXERCISE ${currentExerciseIndex + 1}/${exercises.length}`}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - 3D model */}
        <div className="lg:col-span-2 h-96 lg:h-auto min-h-[500px]">
          <HumanBodyModelViewer 
            userData={userData}
            currentExercise={currentExercise}
            bodyComposition={bodyComposition}
            highlightedMuscles={targetedMuscles}
            exerciseProgress={progress}
          />
        </div>
        
        {/* Right column - Exercise info and controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Exercise details card */}
          {currentExercise && (
            <div className="bg-gray-900 border border-cyan-800 rounded-lg shadow-lg shadow-cyan-900/20 overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-mono text-cyan-300 mb-2">{currentExercise.name}</h2>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-xs text-cyan-600 font-mono">DIFFICULTY</span>
                    <span className="text-xs text-cyan-400 font-mono uppercase">{currentExercise.difficulty}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-xs text-cyan-600 font-mono">SET</span>
                    <span className="text-xs text-cyan-400 font-mono">{currentSet}/{currentExercise.sets}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-xs text-cyan-600 font-mono">REPS</span>
                    <span className="text-xs text-cyan-400 font-mono">{currentExercise.repetitions}</span>
                  </div>
                  
                  <div className="border-t border-cyan-900 pt-4 mt-4">
                    <div className="text-xs text-cyan-600 font-mono mb-2">TARGET MUSCLES</div>
                    <div className="flex flex-wrap gap-2">
                      {targetedMuscles.map(muscle => (
                        <span 
                          key={muscle} 
                          className="px-2 py-1 bg-cyan-900/50 border border-cyan-700 rounded text-xs text-cyan-400 font-mono"
                        >
                          {muscle.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-t border-cyan-900 pt-4 mt-4">
                    <div className="text-xs text-cyan-600 font-mono mb-2">INSTRUCTIONS</div>
                    <p className="text-sm text-cyan-400 font-mono">{currentExercise.instructions}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Timer and progress */}
          <div className="bg-gray-900 border border-cyan-800 rounded-lg shadow-lg shadow-cyan-900/20 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-mono text-cyan-300">
                  {timerMode === 'exercise' && 'EXERCISE TIMER'}
                  {timerMode === 'rest' && 'REST PERIOD'}
                  {timerMode === 'complete' && 'SET COMPLETE'}
                </h3>
                <div className="flex items-center">
                  <Clock size={16} className="text-cyan-500 mr-2" />
                  <span className="text-xl font-bold text-cyan-300 font-mono">{formatTime(timer)}</span>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-800 h-2 rounded-full mb-4">
                <div 
                  className={`h-2 rounded-full ${
                    timerMode === 'exercise' ? 'bg-cyan-500' : 
                    timerMode === 'rest' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ 
                    width: `${
                      timerMode === 'exercise' 
                        ? (timer / (currentExercise?.repetitions * 4) * 100) 
                        : timerMode === 'rest' 
                        ? (timer / 60 * 100)
                        : (timer / 5 * 100)
                    }%` 
                  }}
                ></div>
              </div>
              
              {/* Playback controls */}
              <div className="flex justify-center space-x-4">
                <button 
                  onClick={prevExercise}
                  disabled={currentExerciseIndex === 0}
                  className={`p-2 rounded-full ${
                    currentExerciseIndex === 0 
                      ? 'bg-gray-800 text-gray-600' 
                      : 'bg-cyan-900 text-cyan-400 hover:bg-cyan-800'
                  }`}
                >
                  <SkipBack size={20} />
                </button>
                
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-4 rounded-full bg-cyan-900 text-cyan-300 hover:bg-cyan-800"
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                
                <button 
                  onClick={nextExercise}
                  disabled={currentExerciseIndex === exercises.length - 1}
                  className={`p-2 rounded-full ${
                    currentExerciseIndex === exercises.length - 1 
                      ? 'bg-gray-800 text-gray-600' 
                      : 'bg-cyan-900 text-cyan-400 hover:bg-cyan-800'
                  }`}
                >
                  <SkipForward size={20} />
                </button>
              </div>
              
              {/* Phase indicator */}
              <div className="mt-4 text-center text-xs font-mono text-cyan-600">
                {timerMode === 'exercise' && 'PERFORM EXERCISE WITH PROPER FORM'}
                {timerMode === 'rest' && 'REST PERIOD - PREPARE FOR NEXT SET'}
                {timerMode === 'complete' && 'SET COMPLETE - ADVANCING TO NEXT EXERCISE'}
              </div>
            </div>
          </div>
          
          {/* Workout progress */}
          <div className="bg-gray-900 border border-cyan-800 rounded-lg shadow-lg shadow-cyan-900/20 overflow-hidden">
            <div className="p-6">
              <h3 className="text-sm font-mono text-cyan-300 mb-4">WORKOUT PROGRESS</h3>
              
              <div className="space-y-3">
                {exercises.map((exercise, index) => (
                  <div 
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      index === currentExerciseIndex 
                        ? 'bg-cyan-900/30 border border-cyan-700' 
                        : 'bg-gray-950'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                        index < currentExerciseIndex 
                          ? 'bg-green-900/50 text-green-400' 
                          : index === currentExerciseIndex 
                          ? 'bg-cyan-900/50 text-cyan-400 animate-pulse' 
                          : 'bg-gray-800 text-gray-600'
                      }`}>
                        {index < currentExerciseIndex ? '✓' : index + 1}
                      </div>
                      <span className={`font-mono ${
                        index < currentExerciseIndex 
                          ? 'text-green-400' 
                          : index === currentExerciseIndex 
                          ? 'text-cyan-300' 
                          : 'text-gray-500'
                      }`}>
                        {exercise.name}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-cyan-600">
                      {exercise.sets} × {exercise.repetitions}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Overall progress */}
              <div className="mt-4">
                <div className="flex justify-between items-center text-xs font-mono mb-2">
                  <span className="text-cyan-600">OVERALL PROGRESS</span>
                  <span className="text-cyan-400">
                    {Math.round((currentExerciseIndex / exercises.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full">
                  <div 
                    className="bg-cyan-500 h-2 rounded-full"
                    style={{ width: `${(currentExerciseIndex / exercises.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>