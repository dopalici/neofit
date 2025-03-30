import * as THREE from 'three';

/**
 * Maps muscle names to their standard anatomical groups
 * Used for highlighting and targeting during exercises
 */
export const MUSCLE_GROUPS = {
  // Upper body
  chest: ['pectoralis_major_L', 'pectoralis_major_R', 'pectoralis_minor_L', 'pectoralis_minor_R'],
  shoulders: ['deltoid_anterior_L', 'deltoid_anterior_R', 'deltoid_lateral_L', 'deltoid_lateral_R', 'deltoid_posterior_L', 'deltoid_posterior_R'],
  triceps: ['triceps_brachii_L', 'triceps_brachii_R'],
  biceps: ['biceps_brachii_L', 'biceps_brachii_R'],
  forearms: ['brachioradialis_L', 'brachioradialis_R', 'flexor_carpi_radialis_L', 'flexor_carpi_radialis_R'],
  lats: ['latissimus_dorsi_L', 'latissimus_dorsi_R'],
  traps: ['trapezius_upper_L', 'trapezius_upper_R', 'trapezius_middle_L', 'trapezius_middle_R', 'trapezius_lower_L', 'trapezius_lower_R'],
  
  // Core
  abs: ['rectus_abdominis', 'external_oblique_L', 'external_oblique_R'],
  obliques: ['external_oblique_L', 'external_oblique_R', 'internal_oblique_L', 'internal_oblique_R'],
  lowerBack: ['erector_spinae_L', 'erector_spinae_R'],
  
  // Lower body
  glutes: ['gluteus_maximus_L', 'gluteus_maximus_R', 'gluteus_medius_L', 'gluteus_medius_R'],
  quads: ['quadriceps_L', 'quadriceps_R', 'rectus_femoris_L', 'rectus_femoris_R'],
  hamstrings: ['biceps_femoris_L', 'biceps_femoris_R', 'semitendinosus_L', 'semitendinosus_R'],
  calves: ['gastrocnemius_L', 'gastrocnemius_R', 'soleus_L', 'soleus_R']
};

/**
 * Extract muscle meshes from the loaded model
 * @param {Object} scene - The Three.js scene containing the model
 * @returns {Object} Map of muscle name to mesh object
 */
export function useMuscleGroups(scene) {
  if (!scene) return {};
  
  const muscleGroups = {};
  
  // Traverse the scene to find all meshes that represent muscles
  scene.traverse((object) => {
    if (object.isMesh) {
      // Check if this mesh is a muscle based on its name
      for (const group in MUSCLE_GROUPS) {
        const muscles = MUSCLE_GROUPS[group];
        if (muscles.some(muscle => object.name.toLowerCase().includes(muscle.toLowerCase()))) {
          // Clone the material to avoid affecting other instances
          object.material = object.material.clone();
          muscleGroups[object.name] = object;
          break;
        }
      }
    }
  });
  
  return muscleGroups;
}

/**
 * Apply body composition changes to the 3D model
 * @param {Object} scene - The Three.js scene containing the model
 * @param {Object} bodyComposition - Body metrics like height, weight, etc.
 */
export function applyBodyComposition(scene, bodyComposition) {
  if (!scene || !bodyComposition) return;
  
  const {
    height = 1.78,
    weight = 75,
    muscleMass = 42,
    bodyFat = 18
  } = bodyComposition;
  
  // Base scale adjustments for height
  const baseHeight = 1.78; // Average height in meters
  const heightScale = height / baseHeight;
  scene.scale.set(heightScale, heightScale, heightScale);
  
  // Find body parts to modify based on weight and muscle mass
  scene.traverse((object) => {
    if (object.isMesh) {
      // Apply body fat changes (affects overall volume)
      if (object.name.toLowerCase().includes('body') || 
          object.name.toLowerCase().includes('torso') || 
          object.name.toLowerCase().includes('leg') || 
          object.name.toLowerCase().includes('arm')) {
        
        // Calculate fat scale factor (higher fat means larger volume)
        const baseFat = 18; // baseline body fat percentage
        const fatDifference = bodyFat - baseFat;
        const fatScale = 1 + (fatDifference * 0.005); // 0.5% change per 1% body fat difference
        
        // Don't scale height again, only width and depth for fat
        const currentScale = object.scale.x;
        object.scale.set(
          currentScale * fatScale,
          currentScale,
          currentScale * fatScale
        );
      }
      
      // Apply muscle mass changes (affects muscle definition and size)
      for (const group in MUSCLE_GROUPS) {
        const muscles = MUSCLE_GROUPS[group];
        if (muscles.some(muscle => object.name.toLowerCase().includes(muscle.toLowerCase()))) {
          // Calculate muscle scale factor
          const baseMuscle = 40; // baseline muscle mass percentage
          const muscleDifference = muscleMass - baseMuscle;
          const muscleScale = 1 + (muscleDifference * 0.008); // 0.8% change per 1% muscle difference
          
          // Scale the muscle in all dimensions
          const currentScale = object.scale.x;
          object.scale.set(
            currentScale * muscleScale,
            currentScale * muscleScale,
            currentScale * muscleScale
          );
          
          // Adjust material properties for more defined look with higher muscle mass
          if (object.material) {
            // Higher muscle mass means more defined muscles (less roughness, more reflection)
            object.material.roughness = Math.max(0.3, 0.7 - (muscleDifference * 0.01));
            object.material.metalness = Math.min(0.3, 0.1 + (muscleDifference * 0.005));
          }
          
          break;
        }
      }
    }
  });
}

/**
 * Get the muscles targeted by a specific exercise
 * @param {string} exerciseName - The name of the exercise
 * @returns {Array} Array of targeted muscle groups
 */
export function getTargetedMuscles(exerciseName) {
  if (!exerciseName) return [];
  
  // Mapping of exercises to primary and secondary muscle groups
  const exerciseTargets = {
    // Upper body exercises
    'bench_press': ['chest', 'triceps', 'shoulders'],
    'push_up': ['chest', 'triceps', 'shoulders'],
    'overhead_press': ['shoulders', 'triceps'],
    'lateral_raise': ['shoulders'],
    'bicep_curl': ['biceps', 'forearms'],
    'tricep_extension': ['triceps'],
    'pull_up': ['lats', 'biceps', 'forearms'],
    'lat_pulldown': ['lats', 'biceps'],
    'row': ['lats', 'biceps', 'traps'],
    
    // Lower body exercises
    'squat': ['quads', 'glutes', 'hamstrings'],
    'deadlift': ['hamstrings', 'glutes', 'lowerBack', 'traps'],
    'lunge': ['quads', 'glutes', 'hamstrings'],
    'leg_press': ['quads', 'glutes', 'hamstrings'],
    'leg_extension': ['quads'],
    'leg_curl': ['hamstrings'],
    'calf_raise': ['calves'],
    
    // Core exercises
    'crunch': ['abs'],
    'plank': ['abs', 'lowerBack'],
    'russian_twist': ['abs', 'obliques'],
    'leg_raise': ['abs', 'hip_flexors'],
    
    // Compound movements
    'burpee': ['quads', 'chest', 'shoulders', 'triceps', 'abs'],
    'clean_and_jerk': ['quads', 'glutes', 'shoulders', 'triceps', 'traps'],
    'handstand_pushup': ['shoulders', 'triceps', 'traps'],
    
    // Cardio and full body
    'run': ['quads', 'hamstrings', 'calves'],
    'jump_rope': ['calves', 'shoulders']
  };
  
  // Convert exercise name to snake_case for lookup
  const normalizedName = exerciseName.toLowerCase().replace(/\s+/g, '_');
  
  // Return targeted muscles or empty array if not found
  return exerciseTargets[normalizedName] || [];
}

/**
 * Generate exercise animations based on a selected exercise
 * @param {Object} mixer - Three.js animation mixer
 * @param {string} exerciseName - The name of the exercise
 * @returns {Object} Animation action that can be played
 */
export function getExerciseAnimation(mixer, exerciseName) {
  if (!mixer || !exerciseName) return null;
  
  // In a real implementation, you would load animation clips for specific exercises
  // For now, we'll return a placeholder that will be filled in when animations are loaded
  return {
    name: exerciseName,
    action: null // Would be filled with actual animation
  };
}

/**
 * Create measurement annotations for the 3D model
 * @param {Object} scene - The Three.js scene
 * @param {Object} bodyComposition - Body metrics
 * @returns {Array} Array of measurement line objects
 */
export function createMeasurementAnnotations(scene, bodyComposition) {
  const annotations = [];
  
  // Create height measurement line
  const heightLine = new THREE.Group();
  
  // Create vertical line
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.LineBasicMaterial({ color: 0x08f7fe, transparent: true, opacity: 0.7 });
  
  // Create points for height line (from floor to top of head)
  const points = [
    new THREE.Vector3(-0.5, -1, 0),  // Floor level
    new THREE.Vector3(-0.5, bodyComposition.height - 1, 0)  // Head level
  ];
  
  geometry.setFromPoints(points);
  const line = new THREE.Line(geometry, material);
  heightLine.add(line);
  
  // Add small horizontal ticks every 10cm
  const tickMaterial = new THREE.LineBasicMaterial({ color: 0x08f7fe, transparent: true, opacity: 0.5 });
  
  for (let h = 0; h <= bodyComposition.height; h += 0.1) {
    const tickGeometry = new THREE.BufferGeometry();
    const tickLength = h % 0.5 === 0 ? 0.05 : 0.03; // Longer ticks every 50cm
    
    const tickPoints = [
      new THREE.Vector3(-0.5, h - 1, 0),
      new THREE.Vector3(-0.5 - tickLength, h - 1, 0)
    ];
    
    tickGeometry.setFromPoints(tickPoints);
    const tick = new THREE.Line(tickGeometry, tickMaterial);
    heightLine.add(tick);
  }
  
  annotations.push(heightLine);
  
  return annotations;
}

/**
 * Returns the list of available exercise animations in your app
 * This would be populated based on the animations you've acquired from Mixamo
 */
export function getAvailableExercises() {
  return [
    {
      id: 'push_up',
      name: 'Push-Up',
      animationName: 'pushup',
      targetMuscles: ['chest', 'triceps', 'shoulders'],
      instructions: 'Keep your core tight and elbows at a 45-degree angle.',
      difficulty: 'beginner',
      repetitions: 12,
      sets: 3
    },
    {
      id: 'squat',
      name: 'Squat',
      animationName: 'squat',
      targetMuscles: ['quads', 'glutes', 'hamstrings'],
      instructions: 'Keep your back straight and go as low as comfortable.',
      difficulty: 'beginner',
      repetitions: 15,
      sets: 3
    },
    {
      id: 'handstand_pushup',
      name: 'Handstand Push-Up',
      animationName: 'handstand_pushup',
      targetMuscles: ['shoulders', 'triceps', 'traps'],
      instructions: 'Position against a wall for stability and lower yourself slowly.',
      difficulty: 'advanced',
      repetitions: 5,
      sets: 3
    },
    {
      id: 'burpee',
      name: 'Burpee',
      animationName: 'burpee',
      targetMuscles: ['quads', 'chest', 'shoulders', 'triceps', 'abs'],
      instructions: 'Explosive movement from standing to push-up and back to standing with a jump.',
      difficulty: 'intermediate',
      repetitions: 10,
      sets: 3
    },
    {
      id: 'deadlift',
      name: 'Deadlift',
      animationName: 'deadlift',
      targetMuscles: ['hamstrings', 'glutes', 'lowerBack', 'traps'],
      instructions: 'Keep your back straight and lift with your legs, not your back.',
      difficulty: 'intermediate',
      repetitions: 8,
      sets: 4
    }
  ];
}