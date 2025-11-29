
import React, { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export function EiffelTower(props: any) {
  // Use the raw URL for the GLB file
  const { scene } = useGLTF('https://raw.githubusercontent.com/edwardswan-hub/gift-for-someone/main/free__la_tour_eiffel.glb');

  useEffect(() => {
    // Traverse the model to adjust materials
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Enhance the look to simulate night lighting (golden glow)
        if (mesh.material instanceof THREE.MeshStandardMaterial) {
           mesh.material.color = new THREE.Color('#eebb77'); // Warm bronze base
           mesh.material.emissive = new THREE.Color('#4a3200'); // Deep gold glow
           mesh.material.emissiveIntensity = 0.5;
           mesh.material.envMapIntensity = 0.8;
           mesh.material.roughness = 0.3;
           mesh.material.metalness = 0.6;
        }
      }
    });
  }, [scene]);

  return <primitive object={scene} {...props} />;
}

// Preload to avoid pop-in
useGLTF.preload('https://raw.githubusercontent.com/edwardswan-hub/gift-for-someone/main/free__la_tour_eiffel.glb');
