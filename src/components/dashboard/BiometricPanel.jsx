import React, { Suspense, lazy, useState } from "react";
import { Activity, Box, HeartPulse, Shield } from "lucide-react";

const AnimatedBiometricModel = lazy(() => import("../3d/AnimatedBiometricModel"));

export default function BiometricPanel({ userData, healthData }) {
  const [currentAnimation, setCurrentAnimation] = useState("idle");
  const [enable3D, setEnable3D] = useState(false);

  return (
    <div className="system-window rounded-2xl overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">
            Biometric Imprint
          </h2>
          <div className="flex items-center">
            <span className="text-xs text-slate-400 font-mono mr-2">
              {healthData?.source && healthData.source !== "none"
                ? healthData.source.toUpperCase()
                : "NO SOURCE"}
            </span>
            <div
              className="h-4 w-4 bg-slate-800 rounded-full flex items-center justify-center"
              title={
                healthData?.hasData
                  ? `Connected: ${healthData.source}`
                  : "No health data synced"
              }
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  healthData?.hasData ? "bg-emerald-400" : "bg-slate-500"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Zero-GPU Rapid Telemetry Summary by default; optional on-demand WebGL 3D Avatar */}
        {enable3D ? (
          <div className="relative nv-surface-subtle rounded-xl h-72 flex items-center justify-center mb-4 overflow-hidden">
            <Suspense
              fallback={
                <div className="text-xs text-slate-400">Initializing 3D WebGL model...</div>
              }
            >
              <AnimatedBiometricModel
                userData={userData}
                currentAnimation={currentAnimation}
              />
            </Suspense>
            <div className="absolute bottom-2 right-2 bg-slate-900/80 px-2 py-1 rounded text-[11px] text-cyan-300 font-mono">
              {currentAnimation.toUpperCase()}
            </div>
            <button
              type="button"
              onClick={() => setEnable3D(false)}
              className="absolute top-2 right-2 bg-slate-900/80 px-2.5 py-1 rounded text-[11px] text-slate-300 hover:text-cyan-300 border border-slate-700"
            >
              Lightweight View
            </button>
          </div>
        ) : (
          <div className="nv-surface-subtle rounded-xl p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
                <p className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                  <Shield size={11} className="text-cyan-400" /> Symmetry
                </p>
                <p className="text-lg font-bold font-mono text-slate-100 mt-0.5">
                  {userData?.metrics?.symmetry ?? "--"}
                  {userData?.metrics?.symmetry !== null &&
                  userData?.metrics?.symmetry !== undefined
                    ? "%"
                    : ""}
                </p>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
                <p className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                  <Activity size={11} className="text-emerald-400" /> Potential
                </p>
                <p className="text-lg font-bold font-mono text-slate-100 mt-0.5">
                  {userData?.metrics?.potential ?? "--"}
                  {userData?.metrics?.potential !== null &&
                  userData?.metrics?.potential !== undefined
                    ? "%"
                    : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <HeartPulse size={13} className="text-rose-400" />
                HR:{" "}
                <strong className="text-slate-200 font-mono">
                  {userData?.metrics?.heartRate ? `${userData.metrics.heartRate} bpm` : "--"}
                </strong>
              </span>
              <span>
                VO2:{" "}
                <strong className="text-cyan-300 font-mono">
                  {userData?.metrics?.vo2max ? userData.metrics.vo2max : "--"}
                </strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setEnable3D(true)}
              className="w-full py-2 rounded-lg border border-slate-700/80 bg-slate-900/60 hover:border-cyan-400/50 text-xs text-slate-300 hover:text-cyan-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Box size={13} className="text-cyan-400" />
              Load 3D Avatar Preview (Uses GPU)
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="nv-surface-subtle p-3.5 rounded-xl">
            <p className="text-[10px] text-slate-400 uppercase mb-1">Weight Status</p>
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-slate-100 font-mono">
                {healthData?.weight?.current !== null &&
                healthData?.weight?.current !== undefined
                  ? `${Number(healthData.weight.current).toFixed(1)} kg`
                  : "--"}
              </p>
              {healthData?.weight?.trend !== null &&
                healthData?.weight?.trend !== undefined && (
                  <span className="text-xs text-emerald-400 font-mono">
                    {healthData.weight.trend > 0
                      ? `+${healthData.weight.trend}`
                      : healthData.weight.trend}
                    kg
                  </span>
                )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {healthData?.weight?.lastUpdated
                ? `Updated: ${healthData.weight.lastUpdated}`
                : "No measurements yet"}
            </p>
          </div>
          <div className="nv-surface-subtle p-3.5 rounded-xl">
            <p className="text-[10px] text-slate-400 uppercase mb-1">Recovery Index</p>
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-slate-100 font-mono">
                {userData?.metrics?.recovery !== null &&
                userData?.metrics?.recovery !== undefined
                  ? `${userData.metrics.recovery}%`
                  : "--"}
              </p>
              {userData?.metrics?.efficiency !== null &&
                userData?.metrics?.efficiency !== undefined && (
                  <span className="text-xs text-cyan-300 font-mono">
                    EFF {userData.metrics.efficiency}%
                  </span>
                )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {userData?.metrics?.recovery !== null &&
              userData?.metrics?.recovery !== undefined
                ? "HRV & sleep derived"
                : "Sync sleep or HRV"}
            </p>
          </div>
        </div>

        {enable3D && (
          <div className="mt-4 border-t border-slate-800 pt-3.5">
            <p className="text-[10px] text-slate-400 uppercase mb-2">Preview Animations</p>
            <div className="flex flex-wrap gap-1.5">
              {["idle", "pushup", "squat", "jumpingJack", "plank", "situp"].map((anim) => (
                <button
                  key={anim}
                  type="button"
                  onClick={() => setCurrentAnimation(anim)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                    currentAnimation === anim
                      ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/40"
                      : "bg-slate-900/70 text-slate-400 border border-slate-800"
                  }`}
                >
                  {anim.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}