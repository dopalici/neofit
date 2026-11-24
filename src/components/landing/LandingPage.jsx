import React, { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import ScanlineEffect from "../ui/ScanlineEffect";

const MODEL_PATH =
  "/models/ImageToStl.com_Animated_Strength_042_0421221711_texture.glb";

function LandingModel() {
  const { scene } = useGLTF(MODEL_PATH);
  const modelRef = useRef();

  useEffect(() => {
    if (scene) {
      scene.rotation.set(0, 0, 0);
      scene.position.set(0, -1, 0);
    }
  }, [scene]);

  return <primitive ref={modelRef} object={scene} scale={[0.85, 0.85, 0.85]} />;
}

const PREVIEW_QUESTS = [
  { label: "Skill Quest · Elevated Pike Push-Ups (Rung 2/6)", xp: "+50 XP", done: true },
  { label: "Aerobic Base · 35 min Zone 2 Run (<145 bpm)", xp: "+40 XP", done: false },
  { label: "Recovery Anchor · 140g Protein + 7.5h Sleep", xp: "+35 XP", done: false },
];

export default function LandingPage() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate("/dashboard");
  };

  return (
    <div className="nv-app-shell relative min-h-screen overflow-hidden" style={{ backgroundColor: "var(--nv-bg)", color: "var(--nv-text)" }}>
      <ScanlineEffect />

      {/* Top minimal navigation */}
      <nav className="relative z-10 border-b border-slate-800/70 backdrop-blur-md">
        <div className="container mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-lg font-mono font-bold tracking-wider text-cyan-300">
              NEO•VITRU
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              SYSTEM v2
            </span>
          </div>
          <button
            type="button"
            onClick={handleStart}
            className="px-4 py-2 rounded-lg text-xs font-mono font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-colors flex items-center"
          >
            OPEN SYSTEM <ArrowRight size={14} className="ml-1.5" />
          </button>
        </div>
      </nav>

      {/* Above-the-Fold Split Hero */}
      <main className="relative z-10 container mx-auto max-w-6xl px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-16">
          {/* Left: Clear Human Value Proposition + Primary CTA */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-700/80 bg-slate-900/70 text-xs text-slate-300">
              <Sparkles size={13} className="text-emerald-400" />
              <span>Evidence-based training · 60 seconds a day</span>
            </div>

            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-100 leading-[1.08]">
                NeoVitru
              </h1>
              <p className="text-lg sm:text-xl font-medium text-cyan-300 mt-2">
                The Future of Human Enhancement
              </p>
            </div>

            <p className="text-base text-slate-300 leading-relaxed max-w-xl">
              Turn your Apple Health workouts and recovery signals into clear daily quests,
              step-by-step physical skill ladders, and science-backed coaching—designed for
              calm, glare-free daily check-ins.
            </p>

            {/* Primary CTA */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleStart}
                className="px-7 py-3.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-sm rounded-xl transition-colors flex items-center shadow-lg shadow-cyan-950/40"
              >
                Begin Your Evolution
                <ArrowRight size={16} className="ml-2" />
              </button>
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5 px-2">
                <ShieldCheck size={14} className="text-emerald-400" />
                Private local-first health data · 576 FitLib guides
              </span>
            </div>

            {/* Live Solo-Leveling System Preview Window */}
            <div className="system-window rounded-xl p-4 max-w-xl mt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/40">
                    C-RANK · LV 6
                  </span>
                  <span className="text-xs font-mono text-emerald-300">
                    READINESS 84 · PEAK
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  DAILY QUEST PREVIEW
                </span>
              </div>
              <div className="space-y-2">
                {PREVIEW_QUESTS.map((q) => (
                  <div
                    key={q.label}
                    className="nv-surface-subtle rounded-lg px-3 py-2 flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="flex items-center gap-2 text-slate-200">
                      <CheckCircle2
                        size={14}
                        className={q.done ? "text-emerald-400" : "text-slate-600"}
                      />
                      <span className={q.done ? "line-through text-slate-400" : ""}>
                        {q.label}
                      </span>
                    </span>
                    <span className="font-mono text-emerald-400 shrink-0">{q.xp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: 3D Biometric Model in Clean System Frame */}
          <div className="lg:col-span-5">
            <div className="system-window rounded-2xl p-4">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2 px-1">
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <Activity size={13} />
                  BIOMETRIC AVATAR
                </span>
                <span>APPLE HEALTH READY</span>
              </div>
              <div className="h-[360px] sm:h-[420px] rounded-xl overflow-hidden nv-surface-subtle">
                <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                  <ambientLight intensity={0.7} />
                  <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={0.9} />
                  <pointLight position={[-10, -10, -10]} />
                  <Environment preset="city" />
                  <LandingModel />
                </Canvas>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Clear Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="system-window rounded-xl p-6 space-y-2.5">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <Target size={20} />
            </div>
            <h3 className="text-base font-semibold text-slate-100">
              Clear Skill & Cardio Ladders
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Break ambitious goals like Handstand Push-Ups, Strict Muscle-Ups, or a Sub-20 5K
              into objective, step-by-step rungs with exact pass criteria.
            </p>
          </div>

          <div className="system-window rounded-xl p-6 space-y-2.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
              <HeartPulse size={20} />
            </div>
            <h3 className="text-base font-semibold text-slate-100">
              Apple Health Autoregulation
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Analyzes your workouts, VO2 max, HRV, and sleep to scale daily volume automatically—
              so you push on green days and protect recovery on red days.
            </p>
          </div>

          <div className="system-window rounded-xl p-6 space-y-2.5">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
              <BookOpen size={20} />
            </div>
            <h3 className="text-base font-semibold text-slate-100">
              FitLib-Grounded AI Coach
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every recommendation connects to 576 structured sports-science guides and an
              optional ultra-low-cost Gemini coach tailored to your exact telemetry.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}