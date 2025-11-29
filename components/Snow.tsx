
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Snow: React.FC = () => {
  const count = 1500;
  const mesh = useRef<THREE.Points>(null!);
  
  // Initialize particles with position and "randomness" data
  const particles = useMemo(() => {
    const temp = new Float32Array(count * 3); // Position
    const randomData = new Float32Array(count * 3); // x: speed, y: sway offset, z: sway speed
    
    for (let i = 0; i < count; i++) {
      temp[i * 3] = (Math.random() - 0.5) * 35;     // x
      temp[i * 3 + 1] = (Math.random() - 0.5) * 35; // y
      temp[i * 3 + 2] = (Math.random() - 0.5) * 35; // z

      randomData[i * 3] = 0.05 + Math.random() * 0.1; // Falling speed
      randomData[i * 3 + 1] = Math.random() * Math.PI * 2; // Sway offset phase
      randomData[i * 3 + 2] = 0.5 + Math.random() * 1.5; // Sway frequency
    }
    return { positions: temp, data: randomData };
  }, []);

  useFrame(({ clock }, delta) => {
    if (!mesh.current) return;
    
    const positions = mesh.current.geometry.attributes.position.array as Float32Array;
    const data = mesh.current.geometry.attributes.aData.array as Float32Array;
    const time = clock.elapsedTime;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const speed = data[i3];
      const swayPhase = data[i3 + 1];
      const swayFreq = data[i3 + 2];

      // Natural Falling:
      // 1. Gravity (y -= speed)
      positions[i3 + 1] -= speed * (delta * 60);

      // 2. Wind/Drift (Sway x and z based on time)
      // We use sin/cos to create a gentle spiral/waving motion
      positions[i3] += Math.sin(time * swayFreq + swayPhase) * 0.02;
      positions[i3 + 2] += Math.cos(time * swayFreq * 0.8 + swayPhase) * 0.02;

      // Reset if below floor
      if (positions[i3 + 1] < -10) {
        positions[i3 + 1] = 15; // Reset to top
        positions[i3] = (Math.random() - 0.5) * 35; // Randomize x
        positions[i3 + 2] = (Math.random() - 0.5) * 35; // Randomize z
      }
    }
    
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aData"
          count={particles.data.length / 3}
          array={particles.data}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        color="#ffffff"
        transparent
        opacity={0.7}
        sizeAttenuation={true}
        depthWrite={false}
        map={getSnowTexture()} // Use a soft texture generator
        alphaTest={0.01}
      />
    </points>
  );
};

// Helper to create a soft blurry circle texture for snow
function getSnowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if(ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
  }
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
