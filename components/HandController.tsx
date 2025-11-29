import React, { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';

declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

interface HandControllerProps {
  onUpdate: (data: {
    rotationVelocity: number;
    cameraPitch: number;
    scatterStrength: number;
  }) => void;
}

export const HandController: React.FC<HandControllerProps> = ({ onUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    
    // Check if scripts are loaded
    if (!window.Hands || !window.Camera) {
        setError("MediaPipe scripts not loaded.");
        return;
    }

    let hands: any;
    let camera: any;

    const initializeMediaPipe = async () => {
      try {
        hands = new window.Hands({
          locateFile: (file: string) => {
            // Point to the exact version to match the JS loader
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
          },
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        hands.onResults((results: any) => {
          let rotVel = 0;
          let camPitch = 0;
          let scatter = 0;

          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            
            // 1. Calculate Centroid (Palm Center approx)
            const wrist = landmarks[0];
            const middleMCP = landmarks[9];
            const centerX = (wrist.x + middleMCP.x) / 2;
            const centerY = (wrist.y + middleMCP.y) / 2;

            // 2. Map X to Rotation
            if (centerX < 0.4) rotVel = (0.4 - centerX) * 4.0;
            if (centerX > 0.6) rotVel = -(centerX - 0.6) * 4.0;

            // 3. Map Y to Camera Pitch
            if (centerY < 0.3) camPitch = 1;
            if (centerY > 0.7) camPitch = -1;

            // 4. Detect "Spread Hand" vs "Fist"
            const distToWrist = (p: any) => Math.sqrt(Math.pow(p.x - wrist.x, 2) + Math.pow(p.y - wrist.y, 2));
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            const middleTip = landmarks[12];
            const ringTip = landmarks[16];
            const pinkyTip = landmarks[20];
            
            const avgDist = (distToWrist(thumbTip) + distToWrist(indexTip) + distToWrist(middleTip) + distToWrist(ringTip) + distToWrist(pinkyTip)) / 5;
            
            if (avgDist > 0.25) {
                scatter = 1.0;
            } else {
                scatter = 0.0;
            }
          }

          onUpdate({
            rotationVelocity: rotVel,
            cameraPitch: camPitch,
            scatterStrength: scatter
          });
        });

        if (videoRef.current) {
          camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (hands && videoRef.current) {
                  await hands.send({ image: videoRef.current });
              }
            },
            width: 320,
            height: 240,
          });
          
          await camera.start();
          setIsReady(true);
        }
      } catch (err: any) {
        console.error("MediaPipe Init Error:", err);
        setError("Failed to start camera or tracking.");
      }
    };

    initializeMediaPipe();

    return () => {
      // Cleanup logic if library supports it (Camera utils doesn't explicitly)
    };
  }, [onUpdate]);

  return (
    <div className="absolute bottom-4 left-4 z-50 flex flex-col items-center pointer-events-none">
      <div className={`relative overflow-hidden rounded-lg border-2 ${isReady ? 'border-green-500/50' : 'border-red-500/50'} bg-black shadow-lg transition-all duration-300 w-32 h-24`}>
        <video 
           ref={videoRef} 
           className="w-full h-full object-cover transform -scale-x-100 opacity-60" 
           playsInline 
        />
        {!isReady && !error && (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white text-center p-2">
               Initializing...
            </div>
        )}
        {error && (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-red-400 text-center p-2 bg-black/80">
               {error}
            </div>
        )}
      </div>
      <div className="mt-2 text-[10px] text-gray-400 bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
         <span className="flex items-center gap-1"><Camera size={10}/> Hand Control</span>
      </div>
    </div>
  );
}