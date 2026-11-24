// src/components/dashboard/GoalStudioModal.jsx
import React, { useState } from "react";
import { Check, Compass, Plus, Shield, Target, X } from "lucide-react";
import {
  createGoalFromBlueprint,
  GOAL_BLUEPRINTS,
} from "../../services/goalEngineService";

const DOMAIN_LABELS = {
  skill: "PHYSICAL SKILL",
  strength: "STRENGTH",
  endurance: "ENDURANCE",
  bodycomp: "BODY COMP",
};

export default function GoalStudioModal({ isOpen, onClose, onAddGoal }) {
  const [selectedBlueprintId, setSelectedBlueprintId] = useState(GOAL_BLUEPRINTS[0].id);
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customType, setCustomType] = useState("strength");
  const [customStepsText, setCustomStepsText] = useState(
    "Foundation form & joint prep\nBuild working capacity (3x8 clean)\nProgressive load / difficulty jump\nHit verified target benchmark"
  );

  const selectedBlueprint =
    GOAL_BLUEPRINTS.find((b) => b.id === selectedBlueprintId) || GOAL_BLUEPRINTS[0];

  const [startingRung, setStartingRung] = useState(0);
  const [woopCue, setWoopCue] = useState(selectedBlueprint.defaultWoop.cue);
  const [woopObstacle, setWoopObstacle] = useState(selectedBlueprint.defaultWoop.obstacle);
  const [woopFallback, setWoopFallback] = useState(selectedBlueprint.defaultWoop.fallbackPlan);

  if (!isOpen) return null;

  const handleSelectBlueprint = (blueprint) => {
    setCustomMode(false);
    setSelectedBlueprintId(blueprint.id);
    setStartingRung(0);
    setWoopCue(blueprint.defaultWoop.cue);
    setWoopObstacle(blueprint.defaultWoop.obstacle);
    setWoopFallback(blueprint.defaultWoop.fallbackPlan);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let newGoal;

    if (customMode) {
      const cleanName = customName.trim() || "Custom Performance Protocol";
      const parsedSteps = customStepsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 6);
      const customRungs = (parsedSteps.length > 0 ? parsedSteps : ["Establish baseline", "Hit target"]).map(
        (step, idx) => ({
          id: `custom-${Date.now().toString(36)}-${idx + 1}`,
          title: step,
          prescription: `Execute focused training toward: ${step}`,
          exitCriteria: `Demonstrate consistent mastery of "${step}" across 2 sessions`,
          limitingFactor: "Progressive load & recovery consistency",
          kbRefs: ["B1-PROGRESSIVE-OVERLOAD", "N3-SUSTAINABLE-HABITS"],
        })
      );

      newGoal = createGoalFromBlueprint("strength-foundation", {
        id: `custom-${Date.now().toString(36)}`,
        name: cleanName,
        shortName: cleanName.slice(0, 26),
        type: customType,
        domain: customType === "endurance" ? "endurance" : "skill",
        tagline: "Custom user-defined progression ladder",
        rungs: customRungs,
        completedRungs: [],
        currentRungIndex: 0,
        woop: {
          cue: woopCue.trim() || "At my scheduled training window",
          obstacle: woopObstacle.trim() || "Low energy or busy schedule",
          fallbackPlan: woopFallback.trim() || "Run 15-minute minimum effective dose",
        },
      });
    } else {
      const preCompleted = selectedBlueprint.rungs
        .slice(0, startingRung)
        .map((r) => r.id);
      newGoal = createGoalFromBlueprint(selectedBlueprint.id, {
        completedRungs: preCompleted,
        currentRungIndex: startingRung,
        woop: {
          cue: woopCue.trim() || selectedBlueprint.defaultWoop.cue,
          obstacle: woopObstacle.trim() || selectedBlueprint.defaultWoop.obstacle,
          fallbackPlan: woopFallback.trim() || selectedBlueprint.defaultWoop.fallbackPlan,
        },
      });
    }

    if (onAddGoal) onAddGoal(newGoal);
    if (onClose) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Goal & Skill Blueprint Studio"
    >
      <div className="system-window nv-modal-surface w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-[#0a141f]/95 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <Target size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Activate a Goal or Physical Skill Blueprint
              </h2>
              <p className="text-xs text-slate-400">
                Each blueprint maps objective exit benchmarks, FitLib science, and an If-Then obstacle plan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800"
            aria-label="Close Goal Studio"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Blueprint Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono tracking-wider text-slate-400 uppercase">
                1. Choose Evidence-Based Ladder
              </span>
              <button
                type="button"
                onClick={() => setCustomMode((prev) => !prev)}
                className={`text-xs font-mono px-2.5 py-1 rounded border transition-colors ${
                  customMode
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-200"
                    : "bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-500/50"
                }`}
              >
                {customMode ? "← Back to Blueprints" : "+ Build Custom Goal"}
              </button>
            </div>

            {!customMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GOAL_BLUEPRINTS.map((bp) => {
                  const isSelected = bp.id === selectedBlueprintId;
                  return (
                    <button
                      key={bp.id}
                      type="button"
                      onClick={() => handleSelectBlueprint(bp)}
                      className={`text-left p-3.5 rounded-lg border transition-all ${
                        isSelected
                          ? "bg-cyan-950/50 border-cyan-400 ring-1 ring-cyan-400/30"
                          : "bg-slate-900/70 border-slate-800 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                          {DOMAIN_LABELS[bp.domain] || "PROTOCOL"}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {bp.rungs.length} RUNGS · ~{bp.estimatedWeeks}W
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-100">{bp.name}</p>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{bp.tagline}</p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3 bg-slate-900/70 border border-slate-800 rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-mono text-slate-400 mb-1">
                      GOAL NAME
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g., 10s Front Lever, 100kg Bench Press, Half Marathon"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">
                      DOMAIN
                    </label>
                    <select
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
                    >
                      <option value="strength">Strength / Skill</option>
                      <option value="endurance">Endurance / Cardio</option>
                      <option value="mobility">Mobility / Control</option>
                      <option value="nutrition">Body Composition</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    PROGRESSION RUNGS (ONE PER LINE, EASY → TARGET)
                  </label>
                  <textarea
                    rows={4}
                    value={customStepsText}
                    onChange={(e) => setCustomStepsText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Starting Rung Selector (Proximal Challenge Zone) */}
          {!customMode && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono tracking-wider text-slate-400 uppercase flex items-center">
                  <Compass size={13} className="mr-1.5 text-cyan-400" />
                  2. Calibrate Your Starting Rung
                </span>
                <span className="text-[11px] text-slate-400">
                  Start where your current ability sits — skip rungs you already own.
                </span>
              </div>
              <div className="space-y-1.5">
                {selectedBlueprint.rungs.map((rung, idx) => {
                  const isStart = idx === startingRung;
                  const isPrePassed = idx < startingRung;
                  return (
                    <button
                      key={rung.id}
                      type="button"
                      onClick={() => setStartingRung(idx)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border flex items-center justify-between gap-3 transition-colors ${
                        isStart
                          ? "bg-cyan-950/60 border-cyan-400 text-slate-100"
                          : isPrePassed
                          ? "bg-emerald-950/25 border-emerald-800/60 text-slate-300"
                          : "bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-cyan-400">
                            RUNG {idx + 1}
                          </span>
                          <span className="text-xs font-semibold truncate">{rung.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          Exit: {rung.exitCriteria}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono shrink-0">
                        {isStart ? (
                          <span className="text-cyan-300">START HERE</span>
                        ) : isPrePassed ? (
                          <span className="text-emerald-400 flex items-center">
                            <Check size={12} className="mr-0.5" /> PASSED
                          </span>
                        ) : (
                          "LOCKED"
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* WOOP / Implementation Intention Safeguard */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono tracking-wider text-cyan-300 uppercase flex items-center">
                <Shield size={13} className="mr-1.5" />
                3. Implementation Intention (WOOP Plan)
              </span>
              <span className="text-[11px] text-slate-400">
                Research-backed If-Then plan triples follow-through
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  WHEN (DAILY CUE)
                </label>
                <input
                  type="text"
                  value={woopCue}
                  onChange={(e) => setWoopCue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  IF (MAIN OBSTACLE)
                </label>
                <input
                  type="text"
                  value={woopObstacle}
                  onChange={(e) => setWoopObstacle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  THEN (FALLBACK PROTOCOL)
                </label>
                <input
                  type="text"
                  value={woopFallback}
                  onChange={(e) => setWoopFallback(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-slate-200"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs font-mono rounded-lg transition-colors flex items-center"
            >
              <Plus size={14} className="mr-1.5" />
              ACTIVATE PROTOCOL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
