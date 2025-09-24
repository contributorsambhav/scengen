import { Diamond, GitMerge, Plus, Settings, X } from 'lucide-react';
import React, { useState } from 'react';

interface Station {
  id: number;
  name: string;
  x: number;
  y: number;
}

interface Section {
  id: number;
  from: number;
  to: number;
  distance: number;
  maxSpeed: number;
  bidirectional: boolean;
}

interface PresetConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  stations: Omit<Station, 'id'>[];
  sections: Omit<Section, 'id' | 'from' | 'to'>[];
  connections: Array<{ fromIndex: number; toIndex: number }>;
  width: number;
  height: number;
}

interface PresetsProps {
  onAddPreset: (preset: PresetConfig, x: number, y: number) => void;
  canvasWidth: number; // New prop for canvas width
  canvasHeight: number; // New prop for canvas height
}

const Presets: React.FC<PresetsProps> = ({ onAddPreset, canvasWidth, canvasHeight }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Predefined configurations
  const presets: PresetConfig[] = [
    {
      id: 'diamond_crossing',
      name: 'Diamond Crossing',
      description: 'Two intersecting railway lines with 4 sections and 1 central station',
      icon: <Diamond size={24} className="text-yellow-400" />,
      stations: [
        { name: 'North', x: 0, y: -60 },
        { name: 'Center', x: 0, y: 0 },
        { name: 'South', x: 0, y: 60 },
        { name: 'West', x: -60, y: 0 },
        { name: 'East', x: 60, y: 0 }
      ],
      sections: [
        { distance: 5.0, maxSpeed: 80, bidirectional: true },
        { distance: 5.0, maxSpeed: 80, bidirectional: true },
        { distance: 5.0, maxSpeed: 80, bidirectional: true },
        { distance: 5.0, maxSpeed: 80, bidirectional: true }
      ],
      connections: [
        { fromIndex: 0, toIndex: 1 }, // North to Center
        { fromIndex: 1, toIndex: 2 }, // Center to South
        { fromIndex: 3, toIndex: 1 }, // West to Center
        { fromIndex: 1, toIndex: 4 } // Center to East
      ],
      width: 120,
      height: 120
    },
    {
      id: 'double_crossover_overlapping',
      name: 'Double Crossover',
      description: 'Two parallel tracks with diagonal crossover connections - 5 stations, 6 sections',
      icon: <GitMerge size={24} className="text-green-400" />,
      stations: [
        { name: 'S1', x: 80, y: -30 },  // Top right
        { name: 'S2', x: 80, y: 30 },   // Bottom right
        { name: 'S3', x: -80, y: -30 }, // Top left
        { name: 'S4', x: -80, y: 30 },  // Bottom left
        { name: 'S5', x: 0, y: 0 }      // Center
      ],
      sections: [
        { distance: 10.0, maxSpeed: 100, bidirectional: true }, // S3-S5
        { distance: 10.0, maxSpeed: 100, bidirectional: true }, // S5-S1
        { distance: 10.0, maxSpeed: 100, bidirectional: true }, // S4-S5
        { distance: 10.0, maxSpeed: 100, bidirectional: true }, // S5-S2
        { distance: 16.0, maxSpeed: 120, bidirectional: true }, // S3-S1 (top main, effectively S3-S5-S1)
        { distance: 16.0, maxSpeed: 120, bidirectional: true }  // S4-S2 (bottom main, effectively S4-S5-S2)
      ],
      connections: [
        { fromIndex: 2, toIndex: 4 }, // S3 (top left) to S5 (center)
        { fromIndex: 4, toIndex: 0 }, // S5 (center) to S1 (top right)
        { fromIndex: 3, toIndex: 4 }, // S4 (bottom left) to S5 (center)
        { fromIndex: 4, toIndex: 1 }, // S5 (center) to S2 (bottom right)
        { fromIndex: 2, toIndex: 0 }, // S3 to S1 (for visualization of the top track)
        { fromIndex: 3, toIndex: 1 }  // S4 to S2 (for visualization of the bottom track)
      ],
      width: 160,
      height: 80
    }
  ];

  const handleAddPresetClick = (preset: PresetConfig) => {
    // Calculate center of the canvas
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    onAddPreset(preset, centerX, centerY);
  };

  const PresetCard: React.FC<{ preset: PresetConfig }> = ({ preset }) => (
    <div className={`p-4 rounded-lg border-2 transition-all cursor-pointer border-gray-600 bg-gray-800 hover:border-gray-500`}>
      <div className="flex items-center gap-3 mb-2">
        {preset.icon}
        <h3 className="font-semibold text-white">{preset.name}</h3>
      </div>
      <p className="text-sm text-gray-300 mb-3">{preset.description}</p>

      {/* Preview diagram */}
      <div className="relative bg-gray-900 rounded p-2 mb-2" style={{ height: '80px' }}>
        <svg viewBox={`-${preset.width / 2} -${preset.height / 2} ${preset.width} ${preset.height}`} className="w-full h-full">
          {/* Render connections as lines */}
          {preset.connections.map((conn, idx) => {
            const from = preset.stations[conn.fromIndex];
            const to = preset.stations[conn.toIndex];
            return <line key={idx} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#4b5563" strokeWidth="1.5" />;
          })}

          {/* Render stations as circles */}
          {preset.stations.map((station, idx) => (
            <circle key={idx} cx={station.x} cy={station.y} r="4" fill="#06b6d4" />
          ))}
        </svg>
      </div>

      {/* Stats */}
      <div className="flex justify-between text-xs text-gray-400 mb-3">
        <span>{preset.stations.length} stations</span>
        <span>{preset.sections.length} sections</span>
      </div>

      <button
        onClick={() => handleAddPresetClick(preset)}
        className="w-full p-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center justify-center gap-2 transition-all"
      >
        <Plus size={16} />
        Add to Canvas
      </button>
    </div>
  );

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-cyan-400">Network Presets</h2>
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 rounded hover:bg-gray-700 transition-colors">
            {isExpanded ? <X size={20} /> : <Settings size={20} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div className="text-sm text-gray-400 mb-4">Click "Add to Canvas" to instantly add a preset configuration to your network. These are commonly used railway junction patterns.</div>

            {presets.map((preset) => (
              <PresetCard key={preset.id} preset={preset} />
            ))}

            {/* Instructions */}
            <div className="mt-6 p-3 bg-gray-700 rounded">
              <h4 className="font-medium text-white mb-2">How to use:</h4>
              <ol className="text-sm text-gray-300 space-y-1">
                <li>1. Click "Add to Canvas" below any preset.</li>
                <li>2. The preset will be added to the center of your canvas.</li>
                <li>3. Use the select tool to modify or move individual elements.</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Presets;