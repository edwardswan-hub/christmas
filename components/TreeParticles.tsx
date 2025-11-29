import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TreeParticlesProps {
  count: number;
  color: string;
  lightColor: string;
  speed: number;
}

// --- Shaders ---

const particleVertexShader = `
uniform float uTime;
uniform float uProgress;
uniform float uSize;

attribute vec3 aColor;
varying vec3 vColor;

void main() {
  vColor = aColor;
  vec3 targetPos = position;
  
  // Animation Logic
  float h = (targetPos.y + 6.0) / 12.0;
  float effectiveProgress = smoothstep(0.0, 1.0, uProgress * 2.0 - h * 0.5); 
  
  float startRadius = length(targetPos.xz) * 8.0 + 5.0;
  float spiralTurns = 5.0;
  float angleOffset = (1.0 - effectiveProgress) * spiralTurns * 3.14159 * 2.0;
  
  float r = mix(startRadius, length(targetPos.xz), effectiveProgress);
  float theta = atan(targetPos.x, targetPos.z) + angleOffset;
  
  float x = sin(theta) * r;
  float z = cos(theta) * r;
  float y = mix(targetPos.y - 30.0, targetPos.y, effectiveProgress); 
  
  vec3 currentPos = vec3(x, y, z);

  vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  gl_PointSize = (uSize * 300.0) / -mvPosition.z;
}
`;

const particleFragmentShader = `
varying vec3 vColor;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  
  if (dist > 0.5) discard;
  
  float alpha = 1.0 - smoothstep(0.1, 0.5, dist);
  gl_FragColor = vec4(vColor * 1.8, alpha); 
}
`;

type ThreeShader = {
  uniforms: { [key: string]: { value: any } };
  vertexShader: string;
  fragmentShader: string;
};

export const TreeParticles: React.FC<TreeParticlesProps> = ({ count, color, lightColor, speed }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const foliageMatRef = useRef<THREE.ShaderMaterial>(null!);
  const lightsMatRef = useRef<THREE.ShaderMaterial>(null!);
  const ribbonMatRef = useRef<THREE.MeshStandardMaterial>(null!);
  const ribbonShaderRef = useRef<ThreeShader>(null!);

  const startTime = useRef(Date.now());

  // Generate Tree Foliage Particles
  const foliageData = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const baseColor = new THREE.Color(color);

    for (let i = 0; i < count; i++) {
      const yRatio = i / count;
      const height = 12;
      const y = (yRatio * height) - (height / 2);
      
      const maxRadius = 4.5;
      const radiusBias = Math.pow(Math.random(), 0.5); 
      const radius = (1 - yRatio) * maxRadius * radiusBias + (Math.random() * 0.2);
      
      const spiralLoops = 15;
      const angle = yRatio * Math.PI * 2 * spiralLoops + (Math.random() * 0.5);

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      positions[i * 3] = x + (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 1] = y + (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 2] = z + (Math.random() - 0.5) * 0.5;

      const variance = (Math.random() - 0.5) * 0.4;
      colors[i * 3] = Math.min(1, Math.max(0, baseColor.r + variance));
      colors[i * 3 + 1] = Math.min(1, Math.max(0, baseColor.g + variance));
      colors[i * 3 + 2] = Math.min(1, Math.max(0, baseColor.b + variance));
    }
    return { positions, colors };
  }, [count, color]);

  // Generate Lights
  const lightsData = useMemo(() => {
    const lightCount = Math.floor(count * 0.15);
    const positions = new Float32Array(lightCount * 3);
    const colors = new Float32Array(lightCount * 3);
    const c = new THREE.Color(lightColor);
    
    for (let i = 0; i < lightCount; i++) {
        const yRatio = Math.random();
        const height = 12;
        const y = (yRatio * height) - (height / 2);
        
        const maxRadius = 4.6;
        const radius = (1 - yRatio) * maxRadius + 0.1;
        const angle = Math.random() * Math.PI * 2;
        
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = Math.sin(angle) * radius;

        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
    }
    return { positions, colors };
  }, [count, lightColor]);

  // Generate Golden Ribbon Path
  const ribbonCurve = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 150;
    const loops = 5.5;
    const height = 12;
    const maxRadius = 4.8; 

    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const y = (t * height) - (height / 2);
        const radius = ((1 - t) * maxRadius) + 0.2;
        const angle = t * Math.PI * 2 * loops;
        points.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
    }
    return new THREE.CatmullRomCurve3(points);
  }, []);

  useFrame((state, delta) => {
    const elapsed = (Date.now() - startTime.current) / 1000;
    
    const particleProgress = Math.min(Math.max((elapsed - 0.5) / 3.0, 0), 1);
    const ribbonProgress = Math.min(Math.max((elapsed - 3.0) / 2.5, 0), 1);

    if (groupRef.current) {
      // Base rotation + manual speed factor
      groupRef.current.rotation.y -= delta * speed;
    }

    if (foliageMatRef.current) {
        foliageMatRef.current.uniforms.uTime.value = state.clock.elapsedTime;
        foliageMatRef.current.uniforms.uProgress.value = particleProgress;
    }
    if (lightsMatRef.current) {
        lightsMatRef.current.uniforms.uTime.value = state.clock.elapsedTime;
        lightsMatRef.current.uniforms.uProgress.value = particleProgress;
        
        const twinkle = 1.0 + Math.sin(state.clock.elapsedTime * 5.0) * 0.3;
        lightsMatRef.current.uniforms.uSize.value = 0.35 * twinkle;
    }

    if (ribbonShaderRef.current) {
        ribbonShaderRef.current.uniforms.uProgress.value = ribbonProgress;
    }
  });

  const onBeforeCompileRibbon = (shader: any) => {
    const s = shader as ThreeShader;
    s.uniforms.uProgress = { value: 0 };
    ribbonShaderRef.current = s;

    s.vertexShader = `
      varying vec2 vUv;
      ${s.vertexShader}
    `.replace(
      '#include <uv_vertex>', 
      '#include <uv_vertex>\n vUv = uv;'
    );

    s.fragmentShader = `
      uniform float uProgress;
      varying vec2 vUv;
      ${s.fragmentShader}
    `.replace(
      '#include <dithering_fragment>',
      `
      #include <dithering_fragment>
      if (vUv.x > uProgress) discard; 
      `
    );
  };

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={foliageData.positions.length / 3}
            array={foliageData.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-aColor"
            count={foliageData.colors.length / 3}
            array={foliageData.colors}
            itemSize={3}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={foliageMatRef}
          vertexShader={particleVertexShader}
          fragmentShader={particleFragmentShader}
          uniforms={{
            uTime: { value: 0 },
            uProgress: { value: 0 },
            uSize: { value: 0.22 }
          }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={lightsData.positions.length / 3}
            array={lightsData.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-aColor"
            count={lightsData.colors.length / 3}
            array={lightsData.colors}
            itemSize={3}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={lightsMatRef}
          vertexShader={particleVertexShader}
          fragmentShader={particleFragmentShader}
          uniforms={{
            uTime: { value: 0 },
            uProgress: { value: 0 },
            uSize: { value: 0.35 }
          }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <mesh>
        <tubeGeometry args={[ribbonCurve, 400, 0.15, 8, false]} />
        <meshStandardMaterial 
            ref={ribbonMatRef}
            color="#FFD700"
            roughness={0.2}
            metalness={0.9}
            emissive="#B8860B"
            emissiveIntensity={0.3}
            onBeforeCompile={onBeforeCompileRibbon}
            side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[0, 6.2, 0]}>
        <octahedronGeometry args={[0.4, 0]} />
        <meshBasicMaterial color="#FFD700" toneMapped={false} />
      </mesh>
       <pointLight position={[0, 6, 0]} intensity={2} color="#FFD700" distance={5} decay={2} />
    </group>
  );
};