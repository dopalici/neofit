/**
 * Service for managing 3D body model and its transformations
 */

import { saveToStorage, getFromStorage } from '../utils/storageUtils';

const STORAGE_KEY = 'body-model-settings';

/**
 * Update body metrics on the 3D model
 * 
 * @param {Object} model - The 3D model object from Three.js
 * @param {Object} metrics - Body metrics object
 * @returns {Object} The updated model
 */
export function updateBodyModel(model, metrics) {
  if (!model) return null;
  
  // Create a clone to avoid modifying the original model
  const modelClone = model.clone();
  
  // Find body parts to modify
  modelClone.traverse((node) => {
    if (node.isMesh) {
      // Examples of body parts to modify based on node name
      if (
        node.name.toLowerCase().includes('torso') || 
        node.name.toLowerCase().includes('body') || 
        node.name.toLowerCase().includes('chest')
      ) {
        // Apply body fat adjustments
        // Lower fat = more defined musculature
        const fatScale = 1 + ((metrics.bodyFat - 15) / 60); // 15% is baseline
        node.scale.x *= fatScale;
        node.scale.z *= fatScale;
        
        // Apply muscle mass adjustments
        // Higher muscle = larger muscles
        const muscleScale = 1 + ((metrics.muscleMass - 40) / 80); // 40% is baseline
        node.scale.x *= muscleScale;
        node.scale.y *= muscleScale;
        node.scale.z *= muscleScale;
      }
      
      // Shoulder width adjustments
      if (
        node.name.toLowerCase().includes('shoulder') || 
        node.name.toLowerCase().includes('clavicle')
      ) {
        const shoulderScale = metrics.shoulderWidth / 50; // 50 is baseline
        node.scale.x *= shoulderScale;
      }
      
      // Waist adjustments
      if (
        node.name.toLowerCase().includes('waist') || 
        node.name.toLowerCase().includes('hip')
      ) {
        const waistScale = metrics.waistSize / 34; // 34 inches is baseline
        node.scale.x *= waistScale;
        node.scale.z *= waistScale;
      }
      
      // Arm adjustments based on muscle mass
      if (
        node.name.toLowerCase().includes('arm') || 
        node.name.toLowerCase().includes('bicep') ||
        node.name.toLowerCase().includes('tricep')
      ) {
        const muscleScale = 1 + ((metrics.muscleMass - 40) / 60);
        node.scale.x *= muscleScale;
        node.scale.z *= muscleScale;
      }
      
      // Leg adjustments based on muscle mass
      if (
        node.name.toLowerCase().includes('leg') || 
        node.name.toLowerCase().includes('thigh') ||
        node.name.toLowerCase().includes('calf')
      ) {
        const muscleScale = 1 + ((metrics.muscleMass - 40) / 70);
        node.scale.x *= muscleScale;
        node.scale.z *= muscleScale;
      }
    }
  });
  
  // Apply height adjustment to entire model
  const heightScale = metrics.height / 175; // 175cm is baseline
  modelClone.scale.y = heightScale;
  
  return modelClone;
}

/**
 * Apply morph targets to the model if available
 * 
 * @param {Object} model - The 3D model object from Three.js
 * @param {Object} metrics - Body metrics object
 * @returns {Object} The updated model
 */
export function applyMorphTargets(model, metrics) {
  if (!model) return null;
  
  model.traverse((node) => {
    if (node.isMesh && node.morphTargetInfluences && node.morphTargetDictionary) {
      // Apply body fat influence if morph target exists
      if ('bodyFat' in node.morphTargetDictionary) {
        const index = node.morphTargetDictionary['bodyFat'];
        // Convert bodyFat percentage to influence value (0-1)
        // Assuming 15% is minimum and 40% is maximum
        const influence = Math.max(0, Math.min(1, (metrics.bodyFat - 15) / 25));
        node.morphTargetInfluences[index] = influence;
      }
      
      // Apply muscle mass influence if morph target exists
      if ('muscleMass' in node.morphTargetDictionary) {
        const index = node.morphTargetDictionary['muscleMass'];
        // Convert muscle mass percentage to influence value (0-1)
        // Assuming 30% is minimum and 70% is maximum
        const influence = Math.max(0, Math.min(1, (metrics.muscleMass - 30) / 40));
        node.morphTargetInfluences[index] = influence;
      }
      
      // Apply other body metrics as available in the model
      ['shoulderWidth', 'waistSize'].forEach(metric => {
        if (metric in node.morphTargetDictionary) {
          const index = node.morphTargetDictionary[metric];
          // Convert metric to normalized influence (0-1)
          // This will depend on your specific model's morph target range
          // You'll need to adjust the normalization for each metric
          const metricValue = metrics[metric];
          const minMax = {
            shoulderWidth: [30, 70],
            waistSize: [26, 44]
          };
          const [min, max] = minMax[metric];
          const influence = Math.max(0, Math.min(1, (metricValue - min) / (max - min)));
          node.morphTargetInfluences[index] = influence;
        }
      });
    }
  });
  
  return model;
}

/**
 * Save user model preferences
 * 
 * @param {Object} settings - User preferences for the model
 */
export function saveModelSettings(settings) {
  saveToStorage(STORAGE_KEY, settings);
}

/**
 * Get user model preferences
 * 
 * @returns {Object} User preferences for the model
 */
export function getModelSettings() {
  return getFromStorage(STORAGE_KEY, {
    rotationSpeed: 0.01,
    enableMorphing: true,
    showMuscles: true,
    defaultView: 'front'
  });
}

/**
 * Generate mesh data for muscles based on body metrics
 * 
 * @param {Object} metrics - Body metrics object
 * @returns {Object} Muscle mesh data
 */
export function generateMuscleMeshes(metrics) {
  // This is a simplified implementation
  // In a real app, this would generate detailed muscle meshes
  
  const muscleMeshes = [];
  
  // Muscle definition based on body fat and muscle mass
  const definition = Math.max(0, Math.min(1, (70 - metrics.bodyFat + metrics.muscleMass) / 100));
  
  // Major muscle groups with sizes based on metrics
  const muscleGroups = [
    { name: 'chest', size: 1 + (metrics.muscleMass - 40) / 80 },
    { name: 'biceps', size: 1 + (metrics.muscleMass - 40) / 70 },
    { name: 'triceps', size: 1 + (metrics.muscleMass - 40) / 75 },
    { name: 'shoulders', size: 1 + (metrics.muscleMass - 40) / 65 },
    { name: 'back', size: 1 + (metrics.muscleMass - 40) / 80 },
    { name: 'abs', size: 1 + (metrics.muscleMass - 40) / 90 },
    { name: 'quads', size: 1 + (metrics.muscleMass - 40) / 60 },
    { name: 'hamstrings', size: 1 + (metrics.muscleMass - 40) / 70 },
    { name: 'calves', size: 1 + (metrics.muscleMass - 40) / 65 }
  ];
  
  // Return muscle data
  return {
    definition,
    muscleGroups
  };
}

/**
 * Calculate ideal body metrics based on user's height, age, and gender
 * 
 * @param {number} height - Height in cm
 * @param {number} age - Age in years
 * @param {string} gender - Gender ('male' or 'female')
 * @returns {Object} Ideal body metrics
 */
export function calculateIdealMetrics(height, age, gender) {
  let idealMetrics = {
    bodyFat: 0,
    muscleMass: 0,
    weight: 0,
    shoulderWidth: 0,
    waistSize: 0
  };
  
  if (gender === 'male') {
    // Male ideal metrics calculations
    idealMetrics.bodyFat = age < 30 ? 12 : age < 50 ? 15 : 18;
    idealMetrics.muscleMass = age < 30 ? 55 : age < 50 ? 50 : 45;
    idealMetrics.weight = (height - 100) - ((height - 150) / 4);
    idealMetrics.shoulderWidth = height * 0.259; // Approximate shoulder width
    idealMetrics.waistSize = height * 0.45 / 2.54; // Convert cm to inches
  } else {
    // Female ideal metrics calculations
    idealMetrics.bodyFat = age < 30 ? 20 : age < 50 ? 23 : 26;
    idealMetrics.muscleMass = age < 30 ? 45 : age < 50 ? 42 : 38;
    idealMetrics.weight = (height - 110) - ((height - 150) / 4);
    idealMetrics.shoulderWidth = height * 0.228; // Approximate shoulder width
    idealMetrics.waistSize = height * 0.38 / 2.54; // Convert cm to inches
  }
  
  return idealMetrics;
}