'use client';

import { Activity, Clock, Gauge, MapPin, Navigation, Pause, Play, RotateCcw, Square, Train, TrendingUp, Upload, Zap } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
const CenterPane = ({ sections, stations, trainPositions }) => {
  return (
    <div className="flex-1 bg-slate-900 flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-xl font-semibold">Network Visualization</h2>
      </div>
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-4 bg-slate-800 rounded-lg border border-slate-600">
          <svg className="w-full h-full">
            {}
            {sections.map((section, index) => {
              if (!section.fromPos || !section.toPos) return null;
              const dx = section.toPos.x - section.fromPos.x;
              const dy = section.toPos.y - section.fromPos.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              const midX = (section.fromPos.x + section.toPos.x) / 2;
              const midY = (section.fromPos.y + section.toPos.y) / 2;
              return (
                <g key={index}>
                  <line 
                    x1={section.fromPos.x} 
                    y1={section.fromPos.y} 
                    x2={section.toPos.x} 
                    y2={section.toPos.y} 
                    stroke={section.bidirectional ? '#10b981' : '#64748b'} 
                    strokeWidth="3" 
                    strokeDasharray={section.bidirectional ? 'none' : '8,4'} 
                  />
                  {}
                  <text x={midX} y={midY - 10} textAnchor="middle" className="text-xs fill-slate-400">
                    {section.distance}km
                  </text>
                  {}
                  <text x={midX} y={midY + 15} textAnchor="middle" className="text-xs fill-blue-400">
                    {section.maxSpeed}km/h
                  </text>
                </g>
              );
            })}
            {}
            {stations.map((station) => (
              <g key={station.id}>
                <circle cx={station.x} cy={station.y} r="25" fill="#334155" stroke="#f8fafc" strokeWidth="3" />
                <MapPin className="w-6 h-6" x={station.x - 12} y={station.y - 12} />
                <text x={station.x} y={station.y + 40} textAnchor="middle" className="text-sm font-semibold fill-slate-200">
                  {station.name}
                </text>
              </g>
            ))}
            {}
            {trainPositions.map((train) => (
              <g key={train.id}>
                <circle 
                  cx={train.position.x} 
                  cy={train.position.y} 
                  r="12" 
                  fill={train.color} 
                  stroke="#ffffff" 
                  strokeWidth="2" 
                />
                <text x={train.position.x} y={train.position.y + 4} textAnchor="middle" className="text-xs font-bold fill-white">
                  T{train.id}
                </text>
                {}
                {train.position.moving && (
                  <text x={train.position.x} y={train.position.y - 20} textAnchor="middle" className="text-xs fill-yellow-400">
                    {train.currentSpeed}km/h
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
};
export default CenterPane;
