import React, { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";

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

export default function LandingModelCanvas() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 5], fov: 50 }}
      gl={{ antialias: true, powerPreference: "low-power" }}
    >
      <ambientLight intensity={0.7} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={0.9} />
      <pointLight position={[-10, -10, -10]} />
      <Environment preset="city" />
      <LandingModel />
    </Canvas>
  );
}
