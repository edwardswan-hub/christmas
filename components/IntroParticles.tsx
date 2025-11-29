
import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface IntroParticlesProps {
  onComplete: () => void;
}

const vertexShader = `
uniform float uTime;
uniform float uStage; // 0: Scatter->Merry, 1: Merry->Christmas, 2: Christmas->Explode
attribute vec3 aMerryPos;
attribute vec3 aChristmasPos;
attribute vec3 aRandomPos;
varying vec3 vColor;

// Easing function
float easeOutCubic(float x) {
  return 1.0 - pow(1.0 - x, 3.0);
}

float easeInOutCubic(float x) {
  return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0;
}

void main() {
  vec3 pos = vec3(0.0);
  float p = 0.0;
  
  // Color Morphing: Gold to Red/Green mix
  vec3 gold = vec3(1.0, 0.84, 0.0);
  vec3 red = vec3(1.0, 0.2, 0.2);
  
  if (uStage < 1.0) {
    // Stage 0: Random -> Merry
    p = smoothstep(0.0, 1.0, uStage);
    p = easeOutCubic(p);
    pos = mix(aRandomPos, aMerryPos, p);
    vColor = gold;
  } else if (uStage < 2.0) {
    // Stage 1: Merry -> Christmas
    p = smoothstep(1.0, 2.0, uStage);
    p = easeInOutCubic(p);
    pos = mix(aMerryPos, aChristmasPos, p);
    vColor = mix(gold, red, p);
  } else {
    // Stage 2: Christmas -> Explode
    p = smoothstep(2.0, 3.0, uStage); // 2.0 to 3.0 is the explosion phase
    p = easeOutCubic(p);
    
    // Explode outwards from center
    vec3 dir = normalize(aChristmasPos);
    pos = aChristmasPos + dir * (p * 50.0);
    
    // Add some random scatter during explosion
    pos += aRandomPos * (p * 2.0);
    
    vColor = mix(red, vec3(0.0), p); // Fade out
  }

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  // Size attenuation
  float size = (uStage > 2.0) ? (1.0 - p) * 100.0 : 100.0;
  gl_PointSize = (0.15 * size) / -mvPosition.z;
}
`;

const fragmentShader = `
varying vec3 vColor;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;
  
  float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
  gl_FragColor = vec4(vColor, alpha);
}
`;

// Helper to sample points from text using a Canvas
const getPointsFromText = (text: string, count: number, scale: number) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return new Float32Array(count * 3);

  const width = 1024;
  const height = 512;
  canvas.width = width;
  canvas.height = height;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 120px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const validPoints: number[] = [];

  // Scan pixels
  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < width; x += 4) {
      const i = (y * width + x) * 4;
      if (data[i] > 128) { // If pixel is bright
        // Normalize to -1..1 range
        const nx = (x / width - 0.5) * 20 * scale; 
        const ny = -(y / height - 0.5) * 10 * scale; // Flip Y
        validPoints.push(nx, ny, 0);
      }
    }
  }

  // Fill up the buffer to exactly 'count' points
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const srcIndex = (i % (validPoints.length / 3)) * 3;
    positions[i * 3] = validPoints[srcIndex];
    positions[i * 3 + 1] = validPoints[srcIndex + 1];
    positions[i * 3 + 2] = validPoints[srcIndex + 2];
  }

  return positions;
};

export const IntroParticles: React.FC<IntroParticlesProps> = ({ onComplete }) => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null!);
  const count = 6000;
  const startTime = useRef(Date.now());
  const [finished, setFinished] = useState(false);

  // Generate attributes
  const { merryPos, christmasPos, randomPos } = useMemo(() => {
    const merry = getPointsFromText('MERRY', count, 1.2);
    const christmas = getPointsFromText('CHRISTMAS', count, 0.9);
    
    const random = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      random[i] = (Math.random() - 0.5) * 50;
    }

    return { merryPos: merry, christmasPos: christmas, randomPos: random };
  }, []);

  useFrame(() => {
    if (finished) return;

    const elapsed = (Date.now() - startTime.current) / 1000;
    let stage = 0;

    // Timeline configuration
    const T_MERRY_START = 0;
    const T_MERRY_END = 2.0;
    const T_MORPH_START = 3.5;
    const T_MORPH_END = 5.0;
    const T_EXPLODE_START = 6.5;
    const T_END = 7.5;

    if (elapsed < T_MERRY_END) {
       // 0 -> 1 (Scatter to Merry)
       stage = Math.min(elapsed / 1.5, 1.0); 
    } else if (elapsed < T_MORPH_START) {
       // Hold Merry
       stage = 1.0;
    } else if (elapsed < T_MORPH_END) {
       // 1 -> 2 (Morph to Christmas)
       stage = 1.0 + Math.min((elapsed - T_MORPH_START) / 1.5, 1.0);
    } else if (elapsed < T_EXPLODE_START) {
       // Hold Christmas
       stage = 2.0;
    } else if (elapsed < T_END) {
       // 2 -> 3 (Explode)
       stage = 2.0 + Math.min((elapsed - T_EXPLODE_START) / 1.0, 1.0);
    } else {
       // Finish
       setFinished(true);
       onComplete();
       stage = 3.0;
    }

    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = elapsed;
      shaderRef.current.uniforms.uStage.value = stage;
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position" // Used for bounding box mainly
          count={randomPos.length / 3}
          array={randomPos}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aMerryPos"
          count={merryPos.length / 3}
          array={merryPos}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aChristmasPos"
          count={christmasPos.length / 3}
          array={christmasPos}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandomPos"
          count={randomPos.length / 3}
          array={randomPos}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uStage: { value: 0 },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
