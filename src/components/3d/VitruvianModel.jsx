import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber'; // Import both from fiber
import { useGLTF, Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Update this path to match your model's filename
const MODEL_PATH = '/models/ImageToStl.com_Animated_Strength_042_0421221711_texture.glb';

function VitruvianHuman({ progress, milestones, ...props }) {
  const group = useRef();
  // Load your model
  const { nodes, materials } = useGLTF(MODEL_PATH);
  
  // Highlighting based on milestones achieved
  useEffect(() => {
    // Reset all materials
    Object.values(materials).forEach(material => {
      material.color = new THREE.Color('#08f7fe');
      material.emissive = new THREE.Color('#000000');
    });
    
    // Highlight parts based on milestones
    if (milestones.strength > 70) {
      // Update these material names based on your actual model's material names
      if (materials.arms) {
        materials.arms.emissive = new THREE.Color('#fe53bb');
        materials.arms.emissiveIntensity = 0.5;
      }
    }
    
    if (milestones.cardio > 80) {
      if (materials.torso) {
        materials.torso.emissive = new THREE.Color('#fe53bb');
        materials.torso.emissiveIntensity = 0.5;
      }
    }
  }, [milestones, materials]);
  
  // Subtle animation
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.lerp(
        group.current.rotation.y,
        (state.mouse.x * Math.PI) / 10,
        0.05
      );
      
      // Add slight breathing animation
      group.current.position.y = Math.sin(state.clock.getElapsedTime()) * 0.05;
    }
  });

  return (
    <group ref={group} {...props} dispose={null}>
      {/* Replace this with your actual model structure */}
      {Object.keys(nodes).map((nodeName) => {
        const node = nodes[nodeName];
        
        // Only handle mesh nodes - skip other types like bones
        if (node.type === 'SkinnedMesh' || node.type === 'Mesh') {
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

export default function VitruvianModelViewer({ userData, progress }) {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        <Environment preset="city" />
        
        <VitruvianHuman 
          progress={progress} 
          milestones={userData?.milestones || {}} 
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