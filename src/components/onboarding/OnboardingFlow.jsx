// src/components/onboarding/OnboardingFlow.jsx
import React, { useState } from "react";
import { Check, ChevronRight, Heart, Shield, Target } from "lucide-react";
import appleHealthService from "../../services/appleHealthService";
import { updateNutritionGoals } from "../../services/nutritionService";
import { saveToStorage } from "../../utils/storageUtils";

export const ONBOARDING_STORAGE_KEY = "onboarding-completed";

export default function OnboardingFlow({ onComplete, onUpdateGoals }) {
  const [step, setStep] = useState(0);
  const [healthStatus, setHealthStatus] = useState("idle");
  const [primaryGoal, setPrimaryGoal] = useState("strength");
  const [calorieGoal, setCalorieGoal] = useState(2200);
  const [proteinGoal, setProteinGoal] = useState(140);

  const handleRequestHealthPermissions = async () => {
    setHealthStatus("requesting");
    try {
      const available = await appleHealthService.initialize();
      if (available) {
        const granted = await appleHealthService.requestPermissions();
        setHealthStatus(granted ? "granted" : "denied");
      } else {
        setHealthStatus("web");
      }
    } catch (error) {
      setHealthStatus("web");
    }
  };

  const handleFinish = () => {
    updateNutritionGoals({
      calories: Number(calorieGoal) || 2200,
      protein: Number(proteinGoal) || 140,
    });

    const selectedGoals =
      primaryGoal === "endurance"
        ? {
            fourMinuteMile: {
              name: "AEROBIC VELOCITY PROTOCOL",
              type: "endurance",
              progress: 10,
              startDate: new Date().toISOString().slice(0, 10),
              targetDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
            },
          }
        : {
            handstandPushup: {
              name: "STRENGTH PROGRESSION PROTOCOL",
              type: "strength",
              progress: 10,
              startDate: new Date().toISOString().slice(0, 10),
              targetDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
            },
          };

    saveToStorage(ONBOARDING_STORAGE_KEY, {
      completed: true,
      completedAt: new Date().toISOString(),
      primaryGoal,
    });

    if (onUpdateGoals) onUpdateGoals(selectedGoals);
    if (onComplete) onComplete();
  };

  const handleSkip = () => {
    saveToStorage(ONBOARDING_STORAGE_KEY, {
      completed: true,
      skipped: true,
      completedAt: new Date().toISOString(),
    });
    if (onComplete) onComplete();
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8">
      <div className="max-w-xl w-full p-8 bg-gray-900 border border-cyber-cyan rounded-lg shadow-lg shadow-cyan-900/30">
        {/* Progress Dots */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-mono text-cyan-500">
            STEP {step + 1} OF 3
          </span>
          <div className="flex space-x-2">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className={`h-1.5 w-8 rounded-full ${
                  idx <= step ? "bg-cyber-cyan" : "bg-gray-800"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-mono text-cyan-600 hover:text-cyan-300"
          >
            SKIP
          </button>
        </div>

        {step === 0 && (
          <div className="text-center space-y-5">
            <h1 className="text-4xl font-bold text-cyber-cyan font-mono">
              NEO•VITRU
            </h1>
            <p className="text-sm font-mono text-cyan-300">
              HUMAN OPTIMIZATION MATRIX INITIALIZATION
            </p>
            <p className="text-xs font-mono text-cyan-500 leading-relaxed">
              Unify your Apple Health biometrics, structured workout logging,
              evidence-based FitLib protocols, and behavioral habit streaks in
              one dashboard.
            </p>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full py-3 bg-cyber-black text-cyber-cyan border border-cyber-cyan rounded font-mono hover:bg-cyber-cyan hover:text-cyber-black transition-colors flex items-center justify-center"
            >
              BEGIN SETUP <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-center space-x-3">
              <Heart size={22} className="text-red-400" />
              <div>
                <h2 className="text-lg font-mono text-cyan-300">
                  HEALTH DATA PERMISSIONS
                </h2>
                <p className="text-xs font-mono text-cyan-600">
                  Connect Apple HealthKit on iOS or import health exports later.
                </p>
              </div>
            </div>

            <div className="bg-gray-950 border border-cyan-900 rounded p-4 text-xs font-mono text-cyan-400 space-y-2">
              <p className="flex items-center">
                <Shield size={13} className="mr-2 text-cyan-500" />
                Your biometric data stays on your device in local storage.
              </p>
              <p>• Reads heart rate, HRV, VO2 max, steps, sleep, and workouts.</p>
              <p>• You can also upload Apple Health XML/CSV exports in the Health Data tab.</p>
            </div>

            <button
              type="button"
              onClick={handleRequestHealthPermissions}
              className="w-full py-2.5 bg-cyan-900/50 hover:bg-cyan-800 text-cyan-200 border border-cyan-600 rounded font-mono text-xs"
            >
              {healthStatus === "requesting"
                ? "REQUESTING PERMISSIONS..."
                : healthStatus === "granted"
                ? "HEALTHKIT CONNECTED"
                : healthStatus === "web"
                ? "WEB MODE — USE HEALTH DATA IMPORTER"
                : "CONNECT APPLE HEALTHKIT"}
            </button>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="px-4 py-2 text-xs font-mono text-cyan-500 hover:text-cyan-300"
              >
                BACK
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2 bg-cyber-black text-cyber-cyan border border-cyber-cyan rounded font-mono text-xs hover:bg-cyber-cyan hover:text-cyber-black transition-colors"
              >
                CONTINUE →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center space-x-3">
              <Target size={22} className="text-cyan-400" />
              <div>
                <h2 className="text-lg font-mono text-cyan-300">
                  SET GOALS & NUTRITION TARGETS
                </h2>
                <p className="text-xs font-mono text-cyan-600">
                  Personalize your primary training focus and daily fuel targets.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "strength", label: "STRENGTH & HYPERTROPHY" },
                { id: "endurance", label: "CARDIO & ENDURANCE" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPrimaryGoal(opt.id)}
                  className={`p-3 rounded border font-mono text-xs text-left transition-colors ${
                    primaryGoal === opt.id
                      ? "bg-cyan-900/50 border-cyber-cyan text-cyan-200"
                      : "bg-gray-950 border-cyan-900 text-cyan-500"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono text-cyan-500 block mb-1">
                  DAILY CALORIES (KCAL)
                </label>
                <input
                  type="number"
                  value={calorieGoal}
                  onChange={(e) => setCalorieGoal(e.target.value)}
                  className="w-full bg-gray-950 border border-cyan-800 rounded px-3 py-2 text-sm font-mono text-cyan-200"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-cyan-500 block mb-1">
                  DAILY PROTEIN (G)
                </label>
                <input
                  type="number"
                  value={proteinGoal}
                  onChange={(e) => setProteinGoal(e.target.value)}
                  className="w-full bg-gray-950 border border-cyan-800 rounded px-3 py-2 text-sm font-mono text-cyan-200"
                />
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-mono text-cyan-500 hover:text-cyan-300"
              >
                BACK
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="px-5 py-2 bg-cyber-cyan text-cyber-black rounded font-mono text-xs font-bold hover:opacity-90 flex items-center"
              >
                <Check size={14} className="mr-1" /> LAUNCH DASHBOARD
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
