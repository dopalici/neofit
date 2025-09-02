import React, { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Import your model
const MODEL_PATH = "/models/ImageToStl.com_Animated_Strength_042_0421221711_texture.glb";

function LandingModel() {
  const { scene } = useGLTF(MODEL_PATH);
  const modelRef = useRef();

  useEffect(() => {
    if (scene) {
      scene.rotation.set(0, 0, 0);
      scene.position.set(0, -1, 0);
    }
  }, [scene]);

  return (
    <primitive 
      ref={modelRef} 
      object={scene} 
      scale={[0.8, 0.8, 0.8]}
    />
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const audioRef = useRef(null);

  useEffect(() => {
    // Preload the audio
    audioRef.current = new Audio('/audio/transhuman.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  const handleStart = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
    navigate('/dashboard');
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/20 to-black/80" />
      
      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        <div
          // initial={{ opacity: 0, y: 20 }}
          // animate={{ opacity: 1, y: 0 }}
          // transition={{ duration: 1 }}
          className="text-center mb-12"
        >
          <h1 className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            NeoVitru
          </h1>
          <p className="text-xl text-cyan-300 mb-8">
            The Future of Human Enhancement
          </p>
        </div>

        {/* 3D Model Section */}
        <div className="h-[60vh] mb-16">
          <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
            <ambientLight intensity={0.6} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={0.8} />
            <pointLight position={[-10, -10, -10]} />
            <Environment preset="city" />
            <LandingModel />
            {/* <OrbitControls enableZoom={false} /> */}
          </Canvas>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div
            // initial={{ opacity: 0, x: -20 }}
            // animate={{ opacity: 1, x: 0 }}
            // transition={{ duration: 0.5, delay: 0.2 }}
            className="p-6 bg-cyan-900/30 rounded-lg backdrop-blur-sm border border-cyan-500/20"
          >
            <h3 className="text-2xl font-bold text-cyan-400 mb-4">Biometric Tracking</h3>
            <p className="text-cyan-200">
              Real-time monitoring of your vital signs, movement patterns, and physical performance.
            </p>
          </div>

          <div
            // initial={{ opacity: 0, y: 20 }}
            // animate={{ opacity: 1, y: 0 }}
            // transition={{ duration: 0.5, delay: 0.4 }}
            className="p-6 bg-cyan-900/30 rounded-lg backdrop-blur-sm border border-cyan-500/20"
          >
            <h3 className="text-2xl font-bold text-cyan-400 mb-4">AI-Powered Analysis</h3>
            <p className="text-cyan-200">
              Advanced algorithms analyze your data to provide personalized insights and recommendations.
            </p>
          </div>

          <div
            // initial={{ opacity: 0, x: 20 }}
            // animate={{ opacity: 1, x: 0 }}
            // transition={{ duration: 0.5, delay: 0.6 }}
            className="p-6 bg-cyan-900/30 rounded-lg backdrop-blur-sm border border-cyan-500/20"
          >
            <h3 className="text-2xl font-bold text-cyan-400 mb-4">Health Integration</h3>
            <p className="text-cyan-200">
              Seamless integration with Apple HealthKit for comprehensive health monitoring.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div
          // initial={{ opacity: 0, y: 20 }}
          // animate={{ opacity: 1, y: 0 }}
          // transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center"
        >
          <button
            onClick={handleStart}
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white font-bold text-xl"
          >
            Begin Your Evolution
          </button>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
    </div>
  );
} 