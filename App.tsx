
import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars, Environment, ScrollControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { TreeParticles } from './components/TreeParticles';
import { IntroParticles } from './components/IntroParticles';
import { Snow } from './components/Snow';
import { StoryTelling } from './components/StoryTelling';
import { TreeConfig } from './types';

type ScenePhase = 'INTRO' | 'TREE';

function App() {
  const [phase, setPhase] = useState<ScenePhase>('INTRO');
  // Fixed config for the story mode
  const config: TreeConfig = {
    treeColor: '#42f5aa',
    lightColor: '#ff2a2a',
    particleCount: 15000,
    rotationSpeed: 0.2, // Slower rotation for the story mode
    bloomIntensity: 1.5,
  };

  const handleIntroComplete = () => {
    setPhase('TREE');
  };

  return (
    <div className="relative w-full h-screen bg-black">
      
      {/* 3D Scene */}
      <Canvas
        camera={{ position: [0, 4, 18], fov: 55 }}
        gl={{ antialias: false, alpha: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#050510']} />
        
        {/* Environment */}
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        <Environment preset="city" />
        
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <spotLight position={[0, 20, 0]} angle={0.5} penumbra={1} intensity={2} castShadow />
        
        {/* Main Content */}
        <Suspense fallback={null}>
          <group position={[0, 0, 0]}>
             
             {phase === 'INTRO' && (
               <IntroParticles onComplete={handleIntroComplete} />
             )}

             {phase === 'TREE' && (
               // Increased pages to 8 for a longer, smoother scroll track
               // Increased damping to 0.4 for a "heavy/silky" friction feel
               <ScrollControls pages={8} damping={0.4}>
                 <group position={[0, -4, 0]}>
                   <group position={[0, 2, 0]}>
                     <TreeParticles 
                       count={config.particleCount} 
                       color={config.treeColor} 
                       lightColor={config.lightColor}
                       speed={config.rotationSpeed}
                     />
                   </group>
                   <Snow />
                   <StoryTelling />
                 </group>
               </ScrollControls>
             )}
             
          </group>
        </Suspense>

        {/* Post Processing */}
        <EffectComposer enableNormalPass={false} multisampling={0}>
          <Bloom 
            luminanceThreshold={0.2} 
            mipmapBlur 
            intensity={config.bloomIntensity} 
            radius={0.6}
          />
        </EffectComposer>
      </Canvas>
      
      {/* Scroll Hint */}
      {phase === 'TREE' && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 text-xs animate-bounce pointer-events-none z-20">
          Scroll Down
        </div>
      )}

      {/* Title */}
      <div className={`absolute top-6 left-0 right-0 text-center pointer-events-none z-10 transition-opacity duration-1000 ${phase === 'TREE' ? 'opacity-80' : 'opacity-0'}`}>
        <h1 className="text-3xl font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] font-serif tracking-widest">
          CHRISTMAS TALES
        </h1>
      </div>
    </div>
  );
}

export default App;
