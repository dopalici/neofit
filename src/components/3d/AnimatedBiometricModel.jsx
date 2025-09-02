import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

// Path to your model
const MODEL_PATH =
  "/models/ImageToStl.com_Animated_Strength_042_0421221711_texture.glb";

// Animation paths - update these based on your actual file structure
const ANIMATIONS = {
  idle: "/animations/Swagger Walk.fbx",
  pushup: "/animations/Moonwalk.fbx",
  squat: "/animations/Sprint.fbx",
  jumpingJack: "/animations/Backflip.fbx",
  plank: "/animations/Idle To Sprint.fbx",
  situp: "/animations/Sprinting Forward Roll.fbx",
};

function VitruvianHuman({
  currentAnimation = "idle",
  progress,
  milestones,
  ...props
}) {
  const group = useRef();
  const mixer = useRef(null);
  const clock = useRef(new THREE.Clock());
  const [animations, setAnimations] = useState({});
  const [activeAction, setActiveAction] = useState(null);

  // Load your model
  const {
    scene,
    nodes,
    materials,
    animations: defaultAnimations,
  } = useGLTF(MODEL_PATH);

  // Fix model orientation
  useEffect(() => {
    if (scene) {
      // Rotate the model to face forward (proper orientation)
      scene.rotation.set(0, 0, 0); // Changed from Math.PI to 0 to make model face user

      // Center the model at waist height
      scene.position.set(0, 0, 0);
    }
  }, [scene]);

  // Load animations
  useEffect(() => {
    const loadAnimations = async () => {
      try {
        // Initialize the animation mixer
        if (!mixer.current) {
          mixer.current = new THREE.AnimationMixer(scene);
        }

        // Skip loading if we already have this animation
        if (animations[currentAnimation]) {
          return;
        }

        // Load the animation file
        const fbxLoader = new FBXLoader();
        const animationPath = ANIMATIONS[currentAnimation];

        if (!animationPath) {
          console.warn(`No animation path found for ${currentAnimation}`);
          return;
        }

        const fbx = await new Promise((resolve, reject) => {
          fbxLoader.load(animationPath, resolve, undefined, reject);
        });

        // Extract animation clips from FBX
        if (fbx.animations && fbx.animations.length > 0) {
          // Clone the animation to avoid modifying the original
          const clip = fbx.animations[0].clone();

          // Fix animation orientation
          clip.tracks.forEach((track) => {
            if (track.name.endsWith(".position")) {
              // Fix animation positioning to keep model in place
              for (let i = 0; i < track.values.length; i += 3) {
                // Keep the model in a fixed location by zeroing out all directional movement
                // This prevents the model from moving away from the center during animations
                if (
                  track.name.includes("mixamorigHips") ||
                  track.name.includes("mixamorig:Hips")
                ) {
                  track.values[i] = 0; // Zero out X movement (left/right)
                  // Keep Y values for height adjustments like jumping
                  track.values[i + 2] = 0; // Zero out Z movement (forward/backward)
                }
              }
            }

            if (track.name.endsWith(".quaternion")) {
              // Fix quaternion rotation to maintain proper model orientation during animations
              if (
                track.name.includes("mixamorigHips") ||
                track.name.includes("mixamorig:Hips")
              ) {
                for (let i = 0; i < track.values.length; i += 4) {
                  // Ensure the model keeps facing the camera by adjusting the root joint rotation
                  // Quaternion components: x, y, z, w
                  // Modify quaternion to prevent model from rotating away from camera
                  // This ensures facing forward regardless of the animation

                  // Reset rotation around Y axis to prevent model turning away from camera
                  // Using quaternion normalization to maintain proper rotation
                  const qx = track.values[i];
                  const qy = 0; // Force Y rotation component to zero
                  const qz = track.values[i + 2];
                  const qw = track.values[i + 3];

                  // Normalize quaternion to maintain valid rotation
                  const magnitude = Math.sqrt(
                    qx * qx + qy * qy + qz * qz + qw * qw
                  );

                  if (magnitude > 0) {
                    track.values[i] = qx / magnitude;
                    track.values[i + 1] = qy; // Keep at 0
                    track.values[i + 2] = qz / magnitude;
                    track.values[i + 3] = qw / magnitude;
                  }
                }
              }
            }
          });

          // Create animation action
          const action = mixer.current.clipAction(clip);

          // Configure animation
          action.clampWhenFinished = false;
          action.loop = THREE.LoopRepeat;

          // Store animation
          setAnimations((prev) => ({
            ...prev,
            [currentAnimation]: action,
          }));
        }
      } catch (error) {
        console.error(`Error loading animation ${currentAnimation}:`, error);
      }
    };

    loadAnimations();
  }, [currentAnimation, scene, animations]);

  // Handle animation changes
  useEffect(() => {
    if (!mixer.current) return;

    // If we have the requested animation
    if (animations[currentAnimation]) {
      // Stop previous animation
      if (activeAction) {
        activeAction.fadeOut(0.5);
      }

      // Start new animation
      const action = animations[currentAnimation];
      action.reset();
      action.fadeIn(0.5);
      action.play();
      setActiveAction(action);
    }
  }, [currentAnimation, animations, activeAction]);

  // Apply milestones to model materials
  useEffect(() => {
    if (!materials) return;

    // Reset all materials
    Object.values(materials).forEach((material) => {
      material.color = new THREE.Color("#08f7fe");
      material.emissive = new THREE.Color("#000000");
    });

    // Highlight parts based on milestones
    if (milestones?.strength > 70) {
      // Update these material names based on your actual model's material names
      Object.values(materials).forEach((material) => {
        if (material.name && material.name.toLowerCase().includes("arm")) {
          material.emissive = new THREE.Color("#fe53bb");
          material.emissiveIntensity = 0.5;
        }
      });
    }

    if (milestones?.cardio > 80) {
      Object.values(materials).forEach((material) => {
        if (material.name && material.name.toLowerCase().includes("torso")) {
          material.emissive = new THREE.Color("#fe53bb");
          material.emissiveIntensity = 0.5;
        }
      });
    }
  }, [milestones, materials]);

  // Animation update loop - DISABLED
  // useFrame((state, delta) => {
  //   if (mixer.current) {
  //     mixer.current.update(delta);
  //   }

  //   if (group.current) {
  //     // Always ensure the model maintains a base rotation of PI (180 degrees)
  //     // which means facing directly toward the camera
  //     // Allow extremely minimal rotation for interactivity but constrain it heavily

  //     // Constrain rotation to keep model facing forward no matter what
  //     // Base rotation is 0 degrees to face camera
  //     // Only allow very small deviation from directly facing camera
  //     const targetRotationY = 0 + (state.mouse.x * Math.PI) / 80; // Reduced rotation by 50%

  //     // Even more constrained rotation range
  //     const minRotation = 0 - Math.PI / 20; // Limit leftward rotation
  //     const maxRotation = 0 + Math.PI / 20; // Limit rightward rotation

  //     // Clamp the rotation within safe limits
  //     const clampedRotation = Math.max(minRotation, Math.min(maxRotation, targetRotationY));

  //     // Apply very slow interpolation for stability and smoother movement
  //     group.current.rotation.y = THREE.MathUtils.lerp(
  //       group.current.rotation.y,
  //       clampedRotation,
  //       0.005 // Even slower interpolation (was 0.01)
  //     );

  //     // Add slight breathing animation if not in another animation
  //     if (!activeAction || currentAnimation === "idle") {
  //       group.current.position.y =
  //         Math.sin(state.clock.getElapsedTime()) * 0.05;
  //     }
  //   }
  // });

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} />

      {/* Da Vinci style circle - centered at waist height */}
      <mesh position={[0, 0, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.8, 0.02, 16, 100]} />
        <meshStandardMaterial color="#08f7fe" opacity={0.3} transparent />
      </mesh>
    </group>
  );
}

export default function AnimatedBiometricModel({
  userData,
  currentAnimation = "idle",
  progress = 0,
}) {
  const [showDebug, setShowDebug] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 }); // Initial rotation - facing user
  const [position, setPosition] = useState({ x: 0, y: -1, z: 0 });
  const [showSettings, setShowSettings] = useState(false); // For displaying additional animation settings

  // Camera position adjustment to view from front, centered at waist height
  const cameraPosition = [0, 0, 3.5]; // Increased distance for better view

  return (
    <div className="w-full h-full rounded-lg overflow-hidden">
      <Canvas camera={{ position: cameraPosition, fov: 50 }}>
        <ambientLight intensity={0.6} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          intensity={0.8}
        />
        <pointLight position={[-10, -10, -10]} />
        <Environment preset="city" />

        <VitruvianHuman
          currentAnimation={currentAnimation}
          progress={progress}
          milestones={userData?.milestones || {}}
          position={[position.x, position.y, position.z]}
          rotation={[rotation.x, 0, rotation.z]}
          scale={[0.8, 0.8, 0.8]}
        />

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minPolarAngle={Math.PI / 4} // Restrict to avoid top-down view
          maxPolarAngle={Math.PI / 1.5} // Restrict to avoid bottom-up view
          minAzimuthAngle={-Math.PI / 8} // Even more restricted horizontal rotation (was Math.PI/4)
          maxAzimuthAngle={Math.PI / 8} // Even more restricted horizontal rotation (was Math.PI/4)
          target={[0, 0, 0]} // Center of rotation at waist height
          minDistance={2.5} // Prevent zooming in too close
          maxDistance={4.5} // Prevent zooming out too far (was 5)
        />
      </Canvas>

      {/* Progress indicators overlay */}
      <div className="absolute top-4 left-4 text-xs font-mono text-cyan-600">
        SYMMETRY: {userData?.metrics?.symmetry || 96.2}%
      </div>
      <div className="absolute bottom-4 right-4 text-xs font-mono text-cyan-600">
        POTENTIAL: {userData?.metrics?.potential || 71.8}%
      </div>

      {/* Debug panel toggle button */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="absolute bottom-4 left-4 bg-gray-900 text-cyan-300 px-2 py-1 text-xs rounded border border-cyan-800"
      >
        {showDebug ? "HIDE DEBUG" : "SHOW DEBUG"}
      </button>

      {/* Debug panel for adjusting model orientation */}
      {showDebug && (
        <div className="absolute top-0 left-0 bg-gray-900/90 p-4 text-cyan-300 font-mono text-xs max-w-xs border border-cyan-800 rounded m-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold">DEBUG PANEL</h3>
            <button
              onClick={() => setShowDebug(false)}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowSettings(false)}
              className={`px-2 py-1 rounded ${
                !showSettings
                  ? "bg-cyan-800 text-white"
                  : "bg-gray-800 text-cyan-400"
              }`}
            >
              MODEL
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className={`px-2 py-1 rounded ${
                showSettings
                  ? "bg-cyan-800 text-white"
                  : "bg-gray-800 text-cyan-400"
              }`}
            >
              ANIMATION
            </button>
          </div>

          {!showSettings ? (
            <>
              {/* Model orientation panel */}
              <h4 className="mb-2 border-b border-cyan-700 pb-1">
                MODEL ORIENTATION
              </h4>

              <div className="mb-4">
                <label className="block mb-1">Rotation X</label>
                <input
                  type="range"
                  min="-3.14"
                  max="3.14"
                  step="0.01"
                  value={rotation.x}
                  onChange={(e) =>
                    setRotation({ ...rotation, x: parseFloat(e.target.value) })
                  }
                  className="w-full"
                />
                <span>{rotation.x.toFixed(2)}</span>
              </div>

              <div className="mb-4">
                <label className="block mb-1">Rotation Y</label>
                <input
                  type="range"
                  min="-3.14"
                  max="3.14"
                  step="0.01"
                  value={rotation.y}
                  onChange={(e) =>
                    setRotation({ ...rotation, y: parseFloat(e.target.value) })
                  }
                  className="w-full"
                />
                <span>{rotation.y.toFixed(2)}</span>
              </div>

              <div className="mb-4">
                <label className="block mb-1">Rotation Z</label>
                <input
                  type="range"
                  min="-3.14"
                  max="3.14"
                  step="0.01"
                  value={rotation.z}
                  onChange={(e) =>
                    setRotation({ ...rotation, z: parseFloat(e.target.value) })
                  }
                  className="w-full"
                />
                <span>{rotation.z.toFixed(2)}</span>
              </div>

              <div className="mb-4">
                <label className="block mb-1">Position Y</label>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="0.1"
                  value={position.y}
                  onChange={(e) =>
                    setPosition({ ...position, y: parseFloat(e.target.value) })
                  }
                  className="w-full"
                />
                <span>{position.y.toFixed(2)}</span>
              </div>
            </>
          ) : (
            <>
              {/* Animation settings panel */}
              <h4 className="mb-2 border-b border-cyan-700 pb-1">
                ANIMATION SETTINGS
              </h4>

              <div className="mb-4">
                <label className="block mb-1">Current Animation</label>
                <div className="bg-gray-800 px-2 py-1 rounded">
                  {currentAnimation}
                </div>
              </div>

              <div className="mb-4">
                <label className="block mb-1">Animation List</label>
                <div className="text-xs bg-gray-800 p-2 rounded max-h-32 overflow-y-auto">
                  {Object.keys(ANIMATIONS).map((anim) => (
                    <div key={anim} className="mb-1">
                      {anim}: {ANIMATIONS[anim]}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block mb-1">Progress Value</label>
                <div className="flex items-center gap-2">
                  <div className="bg-gray-800 px-2 py-1 rounded flex-grow">
                    {progress}
                  </div>
                  <div
                    className="w-4 h-4 bg-cyan-600"
                    style={{ opacity: progress / 100 }}
                  ></div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block mb-1">Model Data</label>
                <div className="text-xs bg-gray-800 p-2 rounded max-h-32 overflow-y-auto">
                  <pre>
                    {JSON.stringify(userData?.milestones || {}, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-between mt-4">
            <button
              onClick={() => {
                setRotation({ x: 0, y: 0, z: 0 }); // Reset to original position
                setPosition({ x: 0, y: -1, z: 0 });
              }}
              className="bg-cyan-900 text-cyan-300 px-2 py-1 rounded border border-cyan-700"
            >
              RESET
            </button>

            <button
              onClick={() => {
                // Log settings to console so you can copy them
                console.log("Current settings:", {
                  rotation,
                  position,
                  animation: currentAnimation,
                  progress,
                  userData,
                });
              }}
              className="bg-cyan-900 text-cyan-300 px-2 py-1 rounded border border-cyan-700"
            >
              SAVE TO CONSOLE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Preload the model
useGLTF.preload(MODEL_PATH);
