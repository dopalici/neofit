import { useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { updateBodyModel, applyMorphTargets } from '../services/bodyModelService';

/**
 * Custom hook for managing the 3D human body model
 * 
 * @param {Object} initialMetrics - Initial body metrics
 * @param {string} modelPath - Path to the 3D model file
 * @returns {Object} Model management functions and state
 */
export function useBodyModel(initialMetrics = {}, modelPath = '/models/ybot.glb') {
  const [model, setModel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({
    bodyFat: 20,
    muscleMass: 50,
    height: 175,
    shoulderWidth: 50,
    waistSize: 34,
    ...initialMetrics
  });
  const [hasMorphTargets, setHasMorphTargets] = useState(false);
  
  // Load the 3D model
  useEffect(() => {
    setIsLoading(true);
    
    const loader = new GLTFLoader();
    
    loader.load(
      modelPath,
      (gltf) => {
        // Check if model has morph targets
        let hasMorphs = false;
        gltf.scene.traverse((node) => {
          if (node.isMesh && node.morphTargetInfluences && node.morphTargetInfluences.length > 0) {
            hasMorphs = true;
          }
        });
        
        setHasMorphTargets(hasMorphs);
        setModel(gltf.scene);
        setIsLoading(false);
      },
      (progress) => {
        // Loading progress
        const percentComplete = Math.round((progress.loaded / progress.total) * 100);
        console.log(`Loading model: ${percentComplete}%`);
      },
      (error) => {
        console.error('Error loading model:', error);
        setError(error);
        setIsLoading(false);
      }
    );
    
    return () => {
      // Cleanup
      if (model) {
        model.traverse((node) => {
          if (node.isMesh) {
            if (node.geometry) node.geometry.dispose();
            if (node.material) {
              if (Array.isArray(node.material)) {
                node.material.forEach(material => material.dispose());
              } else {
                node.material.dispose();
              }
            }
          }
        });
      }
    };
  }, [modelPath]);
  
  // Update model when metrics change
  useEffect(() => {
    if (!model) return;
    
    try {
      let updatedModel;
      
      if (hasMorphTargets) {
        // Use morph targets if available
        updatedModel = applyMorphTargets(model.clone(), metrics);
      } else {
        // Otherwise use scaling method
        updatedModel = updateBodyModel(model.clone(), metrics);
      }
      
      setModel(updatedModel);
    } catch (err) {
      console.error('Error updating model:', err);
      setError(err);
    }
  }, [metrics, model, hasMorphTargets]);
  
  // Update metrics
  const updateMetrics = useCallback((newMetrics) => {
    setMetrics(prev => ({
      ...prev,
      ...newMetrics
    }));
  }, []);
  
  // Load animation for the model
  const loadAnimation = useCallback((animationPath) => {
    return new Promise((resolve, reject) => {
      const loader = new FBXLoader();
      
      loader.load(
        animationPath,
        (fbx) => {
          resolve(fbx.animations);
        },
        (progress) => {
          // Loading progress
          const percentComplete = Math.round((progress.loaded / progress.total) * 100);
          console.log(`Loading animation: ${percentComplete}%`);
        },
        (error) => {
          console.error('Error loading animation:', error);
          reject(error);
        }
      );
    });
  }, []);
  
  // Reset model to default pose
  const resetPose = useCallback(() => {
    if (!model) return;
    
    model.traverse((node) => {
      if (node.isSkinnedMesh && node.skeleton) {
        node.skeleton.pose();
      }
    });
  }, [model]);
  
  // Create a snapshot of the current model
  const createSnapshot = useCallback((renderer, camera) => {
    if (!model || !renderer || !camera) return null;
    
    // Render the model
    renderer.render(new THREE.Scene().add(model), camera);
    
    // Return the data URL of the canvas
    return renderer.domElement.toDataURL('image/png');
  }, [model]);
  
  return {
    model,
    isLoading,
    error,
    metrics,
    updateMetrics,
    loadAnimation,
    resetPose,
    createSnapshot,
    hasMorphTargets
  };
}

export default useBodyModel;