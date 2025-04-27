import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber"; // Import both from fiber
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// Update this path to match your model's filename
const MODEL_PATH =
  "/models/ImageToStl.com_Animated_Strength_042_0421221711_texture.glb";

// Animation states
const ANIMATION_STATES = {
  IDLE: "idle",
  BREATHING: "breathing",
  PUSHUP: "pushup",
  SQUAT: "squat",
  PLANK: "plank",
};

function VitruvianHuman({
  progress,
  milestones,
  animationState = ANIMATION_STATES.IDLE,
  ...props
}) {
  const group = useRef();
  const { nodes, materials } = useGLTF(MODEL_PATH);
  const [currentAnimation, setCurrentAnimation] = useState(animationState);
  const [animationProgress, setAnimationProgress] = useState(0);

  // Animation timing
  const BREATHING_DURATION = 4; // seconds
  const EXERCISE_DURATION = 2; // seconds

  // Highlighting based on milestones achieved
  useEffect(() => {
    // Reset all materials
    Object.values(materials).forEach((material) => {
      material.color = new THREE.Color("#08f7fe");
      material.emissive = new THREE.Color("#000000");
    });

    // Highlight parts based on milestones
    if (milestones.strength > 70) {
      // Update these material names based on your actual model's material names
      if (materials.arms) {
        materials.arms.emissive = new THREE.Color("#fe53bb");
        materials.arms.emissiveIntensity = 0.5;
      }
    }

    if (milestones.cardio > 80) {
      if (materials.torso) {
        materials.torso.emissive = new THREE.Color("#fe53bb");
        materials.torso.emissiveIntensity = 0.5;
      }
    }
  }, [milestones, materials]);

  // Handle animation state changes
  useEffect(() => {
    setCurrentAnimation(animationState);
    setAnimationProgress(0);
  }, [animationState]);

  // Animation frame updates
  useFrame((state) => {
    if (!group.current) return;

    // Base rotation
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      (state.mouse.x * Math.PI) / 10,
      0.05
    );

    // Update animation progress
    setAnimationProgress((prev) => (prev + 0.016) % 1);

    // Apply animations based on current state
    switch (currentAnimation) {
      case ANIMATION_STATES.BREATHING:
        // Gentle breathing motion
        const breathingScale =
          1 + Math.sin(state.clock.getElapsedTime() * 2) * 0.02;
        group.current.scale.set(breathingScale, breathingScale, breathingScale);
        break;

      case ANIMATION_STATES.PUSHUP:
        // Pushup animation
        const pushupProgress = Math.sin(animationProgress * Math.PI * 2);
        group.current.position.y = pushupProgress * 0.2;
        group.current.rotation.x = pushupProgress * 0.2;
        break;

      case ANIMATION_STATES.SQUAT:
        // Squat animation
        const squatProgress = Math.sin(animationProgress * Math.PI * 2);
        group.current.position.y = -Math.abs(squatProgress) * 0.3;
        group.current.rotation.x = squatProgress * 0.1;
        break;

      case ANIMATION_STATES.PLANK:
        // Plank animation
        const plankProgress = Math.sin(state.clock.getElapsedTime() * 2);
        group.current.position.y = plankProgress * 0.05;
        group.current.rotation.x = 0.5; // Tilt forward
        break;

      default:
        // Idle state - subtle breathing
        const idleScale = 1 + Math.sin(state.clock.getElapsedTime()) * 0.01;
        group.current.scale.set(idleScale, idleScale, idleScale);
        break;
    }
  });

  return (
    <group ref={group} {...props} dispose={null}>
      {/* Replace this with your actual model structure */}
      {Object.keys(nodes).map((nodeName) => {
        const node = nodes[nodeName];

        // Only handle mesh nodes - skip other types like bones
        if (node.type === "SkinnedMesh" || node.type === "Mesh") {
          return (
            <skinnedMesh
              key={nodeName}
              geometry={node.geometry}
              material={node.material}
              skeleton={node.skeleton}
              name={nodeName}
            />
          );
        }
        return null;
      })}

      {/* Da Vinci style circle */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2, 0.02, 16, 100]} />
        <meshStandardMaterial color="#08f7fe" opacity={0.3} transparent />
      </mesh>
    </group>
  );
}

export default function VitruvianModelViewer({ userData, healthData }) {
  const [currentAnimation, setCurrentAnimation] = useState(
    ANIMATION_STATES.IDLE
  );

  // Auto-switch animations based on health data
  useEffect(() => {
    if (!healthData) return;

    const heartRate = healthData.heartRate?.current;
    if (heartRate > 100) {
      setCurrentAnimation(ANIMATION_STATES.PUSHUP);
    } else if (heartRate > 80) {
      setCurrentAnimation(ANIMATION_STATES.SQUAT);
    } else {
      setCurrentAnimation(ANIMATION_STATES.BREATHING);
    }
  }, [healthData]);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        <Environment preset="city" />

        <VitruvianHuman
          progress={userData?.progress}
          milestones={userData?.milestones}
          animationState={currentAnimation}
          position={[0, -1, 0]}
          scale={[0.8, 0.8, 0.8]}
        />

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>

      {/* Progress indicators overlay */}
      <div className="absolute top-4 left-4 text-xs font-mono text-cyan-600">
        SYMMETRY: {userData?.metrics?.symmetry || 96.2}%
      </div>
      <div className="absolute bottom-4 right-4 text-xs font-mono text-cyan-600">
        POTENTIAL: {userData?.metrics?.potential || 71.8}%
      </div>
    </div>
  );
}

// Preload the model
useGLTF.preload(MODEL_PATH);
