// src/components/onboarding/OnboardingFlow.jsx
import React, { useState } from "react";
import { Check, ChevronRight, Heart, Shield, Sparkles, Target } from "lucide-react";
import appleHealthService from "../../services/appleHealthService";
import { createGoalFromBlueprint } from "../../services/goalEngineService";
import { updateNutritionGoals } from "../../services/nutritionService";
import { saveToStorage } from "../../utils/storageUtils";

export const ONBOARDING_STORAGE_KEY = "onboarding-completed";

const ONBOARDING_BLUEPRINTS = [
  {
    id: "handstand-pushup",
    label: "HANDSTAND PUSH-UP (SKILL)",
    hint: "6-rung vertical pressing & balance ladder",
  },
  {
    id: "strict-muscle-up",
    label: "STRICT MUSCLE-UP (SKILL)",
    hint: "5-rung explosive pull & transition ladder",
  },
  {
    id: "aerobic-velocity",
    label: "SUB-20 5K / VO2 MAX",
    hint: "80/20 polarized cardio & speed ladder",
  },
  {
    id: "strength-foundation",
    label: "STRENGTH & HYPERTROPHY",
    hint: "Compound progressive overload foundation",
  },
];

export default function OnboardingFlow({ onComplete, onUpdateGoals }) {
  const [step, setStep] = useState(0);
  const [healthStatus, setHealthStatus] = useState("idle");
  const [primaryGoal, setPrimaryGoal] = useState("handstand-pushup");
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

    const created = createGoalFromBlueprint(primaryGoal);
    const selectedGoals = {
      [created.id]: created,
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
    <div className="flex items-center justify-center min-h-screen px-4 py-10 relative z-10">
      <div className="system-window max-w-xl w-full p-7 sm:p-8 rounded-2xl">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-7">
          <span className="text-xs font-mono text-cyan-300 tracking-wider">
            STEP {step + 1} OF 3
          </span>
          <div className="flex space-x-2">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className={`h-1.5 w-10 rounded-full transition-colors ${
                  idx <= step ? "bg-cyan-400" : "bg-slate-800"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
          >
            SKIP
          </button>
        </div>

        {step === 0 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/35 flex items-center justify-center mx-auto text-cyan-300 mb-3">
                <Sparkles size={22} />
              </div>
              <h1 className="text-3xl font-bold text-slate-100 tracking-tight">
                Welcome to NEO•VITRU
              </h1>
              <p className="text-sm text-cyan-300 font-medium">
                Your Personal Performance & Skill-Progression System
              </p>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed text-center max-w-md mx-auto">
              Spend 60 seconds a day here. We turn your Apple Health recovery signals and
              training goals into 3 clear daily steps backed by sports science.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
              {[
                { title: "1. Daily Readiness", desc: "Know when to push or deload in 5 seconds." },
                { title: "2. Skill Ladders", desc: "Objective rungs so you never guess what's next." },
                { title: "3. Eye Comfort", desc: "Switch Obsidian, Night, or Daylight anytime." },
              ].map((item) => (
                <div key={item.title} className="nv-surface-subtle rounded-xl p-3">
                  <p className="text-xs font-semibold text-slate-100">{item.title}</p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full py-3.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-sm rounded-xl transition-colors flex items-center justify-center"
            >
              BEGIN SETUP <ChevronRight size={16} className="ml-1.5" />
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                <Heart size={20} className="text-rose-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-100">
                  Connect Your Health Signals
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Sync Apple Health on iOS—or upload an export later. Even without a watch, our
                  5-second daily check-in works right away.
                </p>
              </div>
            </div>

            <div className="nv-surface-subtle rounded-xl p-4 text-xs text-slate-300 space-y-2.5 leading-relaxed">
              <p className="flex items-center text-emerald-300 font-medium">
                <Shield size={14} className="mr-2 shrink-0" />
                Private by design: your biometric data stays locally on your device.
              </p>
              <p className="text-slate-400">
                • Tracks workouts, VO2 max, heart rate, HRV, sleep, and daily steps.
              </p>
              <p className="text-slate-400">
                • On desktop/web, you can drop in an Apple Health XML/CSV file anytime in Health Data.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRequestHealthPermissions}
              className="w-full py-3 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 border border-cyan-500/40 rounded-xl font-mono text-xs transition-colors"
            >
              {healthStatus === "requesting"
                ? "REQUESTING PERMISSIONS..."
                : healthStatus === "granted"
                ? "APPLE HEALTHKIT CONNECTED"
                : healthStatus === "web"
                ? "WEB MODE — IMPORT IN HEALTH DATA TAB ANYTIME"
                : "CONNECT APPLE HEALTHKIT"}
            </button>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-slate-200"
              >
                BACK
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold rounded-xl font-mono text-xs transition-colors"
              >
                CONTINUE →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <Target size={20} className="text-cyan-300" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-100">
                  Pick Your First Goal & Fuel Targets
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  You can add more physical skills or switch targets anytime on your dashboard.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ONBOARDING_BLUEPRINTS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPrimaryGoal(opt.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    primaryGoal === opt.id
                      ? "bg-cyan-950/50 border-cyan-400 ring-1 ring-cyan-400/30"
                      : "nv-surface-subtle hover:border-slate-600"
                  }`}
                >
                  <p className="font-mono text-xs font-semibold text-slate-100">{opt.label}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{opt.hint}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  DAILY CALORIES (KCAL)
                </label>
                <input
                  type="number"
                  value={calorieGoal}
                  onChange={(e) => setCalorieGoal(e.target.value)}
                  className="w-full nv-surface-subtle rounded-lg px-3 py-2 text-sm font-mono text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  DAILY PROTEIN (G)
                </label>
                <input
                  type="number"
                  value={proteinGoal}
                  onChange={(e) => setProteinGoal(e.target.value)}
                  className="w-full nv-surface-subtle rounded-lg px-3 py-2 text-sm font-mono text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-slate-200"
              >
                BACK
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl font-mono text-xs transition-colors flex items-center"
              >
                <Check size={14} className="mr-1.5" />
                LAUNCH DASHBOARD
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
