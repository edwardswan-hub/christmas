
import React, { useRef, useMemo, useState } from 'react';
import { useScroll, Html, Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface StoryItemProps {
  offset: number; 
  position: THREE.Vector3;
  title: string;
  text: string;
  img: string;
}

const StoryItem: React.FC<StoryItemProps> = ({ offset, position, title, text, img }) => {
  const scroll = useScroll();
  const [opacity, setOpacity] = useState(0);
  const [scale, setScale] = useState(0);
  
  // Image error handling state
  const [imgSrc, setImgSrc] = useState(img);

  useFrame(() => {
    if (!scroll) return;
    
    const current = scroll.offset;
    // Calculate distance from this card's "ideal" scroll point
    const dist = Math.abs(current - offset);
    
    // Define visibility window
    const visibleRange = 0.12; 
    
    // Smooth opacity calculation
    let targetOpacity = 0;
    if (dist < visibleRange) {
        // Linear fade in/out
        targetOpacity = 1.0 - (dist / visibleRange);
        // Ease it slightly
        targetOpacity = Math.pow(targetOpacity, 0.5); 
    }

    // Direct update for responsiveness (no lerp lag)
    if (Math.abs(opacity - targetOpacity) > 0.01) {
        setOpacity(targetOpacity);
        setScale(targetOpacity); // Scale with opacity for pop effect
    }
  });

  // If invisible, don't render HTML to save performance/prevent interaction
  if (opacity < 0.05) return null;

  return (
    <Billboard
      position={position}
      follow={true}
      lockX={false}
      lockY={false}
      lockZ={false}
    >
      <Html
        transform
        center
        distanceFactor={12} // Adjust scale relative to 3D world
        occlude={false} // CRITICAL: Prevents tree/particles from blocking the card
        style={{
            opacity: opacity,
            transform: `scale(${0.5 + scale * 0.5})`, // Pop effect from 0.5 to 1.0
            transition: 'opacity 0.1s ease-out, transform 0.1s ease-out',
            pointerEvents: 'none' // Pass clicks through
        }}
        zIndexRange={[100, 0]} // Force on top
      >
        <div className="w-[300px] bg-black/80 backdrop-blur-md rounded-2xl border border-white/20 p-5 shadow-[0_0_50px_rgba(0,0,0,0.8)] text-center flex flex-col items-center">
            {/* Image Frame */}
            <div className="w-full h-48 mb-4 rounded-xl overflow-hidden border border-white/10 bg-gray-900 relative">
                 <img 
                    src={imgSrc} 
                    alt={title}
                    className="w-full h-full object-cover"
                    onError={() => setImgSrc("https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=600&q=80")} // Fallback
                 />
                 {/* Shine overlay */}
                 <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
            </div>

            {/* Text */}
            <h2 className="text-2xl font-serif text-yellow-300 mb-2 drop-shadow-md">
                {title}
            </h2>
            <p className="text-sm text-gray-200 font-light leading-relaxed">
                {text}
            </p>
        </div>
      </Html>
    </Billboard>
  );
};

export const StoryTelling: React.FC = () => {
  // Camera Path Configuration
  const CAM_START_R = 22;
  const CAM_END_R = 10;
  const CAM_START_Y = -2;
  const CAM_END_Y = 16;
  const TOTAL_ROTATION = Math.PI * 4; // 2 Full Spins

  // Hook into frame to move camera
  useFrame((state) => {
    // Get scroll offset from global ScrollControls
    // We access the scroll offset directly from the controls in the scene if available
    // But since we are inside ScrollControls, we need to access the store or just use standard time if simpler
    // However, Drei's ScrollControls puts the offset in `state.events` or we can grab it from a ref if we passed it.
    // Actually, useScroll() gives us the data.
  });
  
  // Separate component for camera logic to safely use useScroll
  return (
    <>
      <CameraHandler 
         startR={CAM_START_R} endR={CAM_END_R} 
         startY={CAM_START_Y} endY={CAM_END_Y} 
         rot={TOTAL_ROTATION} 
      />
      <StoryContent 
         startR={CAM_START_R} endR={CAM_END_R} 
         startY={CAM_START_Y} endY={CAM_END_Y} 
         rot={TOTAL_ROTATION} 
      />
    </>
  );
};

// Component to handle Camera Movement
const CameraHandler = ({ startR, endR, startY, endY, rot }: any) => {
    const scroll = useScroll();
    useFrame((state) => {
        const p = scroll.offset;
        
        // Interpolate position
        const y = THREE.MathUtils.lerp(startY, endY, p);
        const r = THREE.MathUtils.lerp(startR, endR, p);
        const theta = p * rot;
        
        state.camera.position.x = Math.sin(theta) * r;
        state.camera.position.z = Math.cos(theta) * r;
        state.camera.position.y = y;
        
        // Look at center (Tree)
        state.camera.lookAt(0, y + 2, 0);
    });
    return null;
}

// Component to Render Cards
const StoryContent = ({ startR, endR, startY, endY, rot }: any) => {
    const TARGET_IMG = "https://raw.githubusercontent.com/edwardswan-hub/gift-for-someone/main/images.jpg";

    const stories = useMemo(() => {
        const data = [
          { title: "First Snow", text: "The silence of winter brings peace to the soul.", img: TARGET_IMG },
          { title: "The Journey", text: "Walking through the whispering pines.", img: TARGET_IMG },
          { title: "Glowing Lights", text: "A beacon of hope in the dark night.", img: TARGET_IMG },
          { title: "Celebration", text: "Gathering together with warmth and joy.", img: TARGET_IMG },
          { title: "Memories", text: "Moments that sparkle like stars.", img: TARGET_IMG },
          { title: "Wishes", text: "Dreaming of a bright tomorrow.", img: TARGET_IMG },
          { title: "The Magic", text: "Believing is seeing.", img: TARGET_IMG },
          { title: "Merry Christmas", text: "Love and joy to you and yours.", img: TARGET_IMG },
        ];

        return data.map((item, i) => {
            const count = data.length;
            // Distribute evenly
            const p = 0.1 + (i / (count - 1)) * 0.8;
            
            // Calculate Camera Pos at this moment
            const y = THREE.MathUtils.lerp(startY, endY, p);
            const r = THREE.MathUtils.lerp(startR, endR, p);
            const theta = p * rot;

            // Place Card:
            // Put it at 70% of the radius (Between camera and tree)
            // This ensures it is visibly "floating" in front
            const cardR = r * 0.7;
            
            const x = Math.sin(theta) * cardR;
            const z = Math.cos(theta) * cardR;
            
            return {
                ...item,
                offset: p,
                position: new THREE.Vector3(x, y, z)
            };
        });
    }, [startR, endR, startY, endY, rot]);

    return (
        <group>
            {stories.map((s, i) => (
                <StoryItem key={i} {...s} />
            ))}
        </group>
    );
}
