import React from 'react';
import { TreeConfig } from '../types';
import { Settings2, Sparkles, Wind } from 'lucide-react';

interface ControlsProps {
  config: TreeConfig;
  setConfig: React.Dispatch<React.SetStateAction<TreeConfig>>;
}

export const Controls: React.FC<ControlsProps> = ({ config, setConfig }) => {
  const handleChange = (key: keyof TreeConfig, value: string | number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="absolute top-4 right-4 z-10 w-80 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 p-6 text-white shadow-2xl transition-all duration-300 hover:bg-black/70">
      <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
        <Sparkles className="w-5 h-5 text-yellow-400" />
        <h2 className="text-lg font-bold bg-gradient-to-r from-yellow-200 to-amber-500 bg-clip-text text-transparent">
          Holiday Settings
        </h2>
      </div>

      <div className="space-y-5">
        {/* Colors */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Foliage Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.treeColor}
                onChange={(e) => handleChange('treeColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
              />
              <span className="text-xs font-mono text-gray-300">{config.treeColor}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Lights Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.lightColor}
                onChange={(e) => handleChange('lightColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
              />
              <span className="text-xs font-mono text-gray-300">{config.lightColor}</span>
            </div>
          </div>
        </div>

        {/* Bloom Intensity */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs font-medium text-gray-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Glow Intensity
            </label>
            <span className="text-xs text-gray-500">{config.bloomIntensity.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={config.bloomIntensity}
            onChange={(e) => handleChange('bloomIntensity', parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
          />
        </div>

        {/* Rotation Speed */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs font-medium text-gray-400 flex items-center gap-1">
              <Wind className="w-3 h-3" /> Rotation Speed
            </label>
            <span className="text-xs text-gray-500">{config.rotationSpeed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={config.rotationSpeed}
            onChange={(e) => handleChange('rotationSpeed', parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Particle Count */}
        <div>
           <div className="flex justify-between mb-2">
            <label className="text-xs font-medium text-gray-400 flex items-center gap-1">
              <Settings2 className="w-3 h-3" /> Density
            </label>
            <span className="text-xs text-gray-500">{config.particleCount} pts</span>
          </div>
          <select 
            value={config.particleCount}
            onChange={(e) => handleChange('particleCount', parseInt(e.target.value))}
            className="w-full bg-gray-800 border border-gray-700 text-white text-xs rounded-md p-2 focus:ring-1 focus:ring-yellow-400 outline-none"
          >
            <option value={2000}>Low (2,000)</option>
            <option value={5000}>Medium (5,000)</option>
            <option value={10000}>High (10,000)</option>
            <option value={20000}>Ultra (20,000)</option>
          </select>
        </div>
      </div>
      
      <div className="mt-6 text-[10px] text-center text-gray-600 border-t border-white/5 pt-4">
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
};