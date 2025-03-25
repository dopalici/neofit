import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, Text } from '@react-three/drei';
import * as THREE from 'three';

// Use a placeholder path initially, you'll replace this with your Mixamo model path
const MODEL_PATH = '/models/human_model.glb';

function VitruvianHuman({ progress, milestones, ...props }) {
  const group = useRef();
  // If the model exists, uncomment this line:
  // const { nodes, materials } = useGLTF(MODEL_PATH);
  
  // Highlighting based on milestones achieved
  useEffect(() => {
    // When you have your actual model loaded, uncomment and modify this code
    // to change material colors based on milestone progress
    
    /*
    // Reset all materials
    Object.values(materials).forEach(material => {
      material.color = new THREE.Color('#08f7fe');
      material.emissive = new THREE.Color('#000000');
    });
    
    // Highlight parts based on milestones
    if (milestones.strength > 70) {
      materials.arms.emissive = new THREE.Color('#fe53bb');
      materials.arms.emissiveIntensity = 0.5;
    }
    
    if (milestones.cardio > 80) {
      materials.heart.emissive = new THREE.Color('#fe53bb');
      materials.heart.emissiveIntensity = 0.5;
    }
    */
  }, [milestones]);
  
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
      {/* Placeholder model until your Mixamo model is ready */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 2, 32]} />
        <meshStandardMaterial color="#08f7fe" opacity={0.8} transparent />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#08f7fe" opacity={0.8} transparent />
      </mesh>
      <mesh position={[0.8, 0.3, 0]}>
        <boxGeometry args={[0.2, 1, 0.2]} />
        <meshStandardMaterial color="#fe53bb" opacity={0.8} transparent />
      </mesh>
      <mesh position={[-0.8, 0.3, 0]}>
        <boxGeometry args={[0.2, 1, 0.2]} />
        <meshStandardMaterial color="#fe53bb" opacity={0.8} transparent />
      </mesh>
      
      {/* Da Vinci style circle */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2, 0.02, 16, 100]} />
        <meshStandardMaterial color="#08f7fe" opacity={0.3} transparent />
      </mesh>
      
      {/* When you have your Mixamo model, replace the above with something like: 
      <skinnedMesh 
        geometry={nodes.Body.geometry}
        material={materials.body}
        skeleton={nodes.Body.skeleton}
      />
      */}
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

// Preload the model - uncomment when you have your model
// useGLTF.preload(MODEL_PATH);