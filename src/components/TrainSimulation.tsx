'use client';

import { Activity, ChevronLeft, ChevronRight, Clock, Gauge, MapPin, Navigation, Pause, Play, RotateCcw, Square, Train, TrendingUp, Upload, Zap } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import CenterPane from './CenterPane';
import LeftPane from './LeftPane';
import RightPane from './RightPane';

const TrainSimulation = () => {
  const [simulationData, setSimulationData] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [leftPaneCollapsed, setLeftPaneCollapsed] = useState(false);
  const [rightPaneCollapsed, setRightPaneCollapsed] = useState(false);
  const fileInputRef = useRef(null);
  const animationRef = useRef(null);
  const lastUpdateRef = useRef(0);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          setSimulationData(data);
          setCurrentTime(0);
          setIsPlaying(false);
        } catch (error) {
          alert("Error parsing JSON file. Please ensure it's a valid JSON format.");
        }
      };
      reader.readAsText(file);
    }
  };

  const getStationPositions = () => {
    if (!simulationData?.output?.stations) return [];
    const stations = simulationData.output.stations;
    const stationIds = Object.keys(stations).sort((a, b) => parseInt(a) - parseInt(b));
    const positions = [];
    const padding = 50;
    const viewWidth = 1200 - padding * 2;
    const viewHeight = 1000 - padding * 2;
    const startX = padding;
    const startY = padding;
    const minDistance = 80;

    const areCollinear = (p1, p2, p3, tolerance = 5) => {
      const area = Math.abs(p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y));
      return area < tolerance;
    };

    const isTooClose = (newPoint, existingPoints, minDist) => {
      return existingPoints.some((point) => {
        const distance = Math.sqrt(Math.pow(newPoint.x - point.x, 2) + Math.pow(newPoint.y - point.y, 2));
        return distance < minDist;
      });
    };

    const createsCollinearity = (newPoint, existingPoints) => {
      if (existingPoints.length < 2) return false;
      for (let i = 0; i < existingPoints.length; i++) {
        for (let j = i + 1; j < existingPoints.length; j++) {
          if (areCollinear(existingPoints[i], existingPoints[j], newPoint)) {
            return true;
          }
        }
      }
      return false;
    };

    const generateRandomPosition = () => {
      return {
        x: startX + Math.random() * viewWidth,
        y: startY + Math.random() * viewHeight
      };
    };

    let seed = 12345;
    const seededRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const generateSeededPosition = () => {
      return {
        x: startX + seededRandom() * viewWidth,
        y: startY + seededRandom() * viewHeight
      };
    };

    stationIds.forEach((id, index) => {
      let attempts = 0;
      let validPosition = null;
      const maxAttempts = 1000;

      while (!validPosition && attempts < maxAttempts) {
        const candidate = generateSeededPosition();
        const tooClose = isTooClose(candidate, positions, minDistance);
        const collinear = createsCollinearity(candidate, positions);

        if (!tooClose && !collinear) {
          validPosition = candidate;
        }
        attempts++;
      }

      if (!validPosition) {
        const angle = (index * 2 * Math.PI) / stationIds.length + (seededRandom() - 0.5) * 0.5;
        const radius = viewWidth * 0.3 + seededRandom() * (viewWidth * 0.15);
        const centerX = startX + viewWidth / 2;
        const centerY = startY + viewHeight / 2;

        validPosition = {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius
        };

        validPosition.x = Math.max(startX, Math.min(startX + viewWidth, validPosition.x));
        validPosition.y = Math.max(startY, Math.min(startY + viewHeight, validPosition.y));
      }

      positions.push({
        id: parseInt(id),
        name: stations[id],
        x: validPosition.x,
        y: validPosition.y
      });
    });

    for (let i = 0; i < positions.length; i++) {
      for (let j = 0; j < positions.length; j++) {
        for (let k = 0; k < positions.length; k++) {
          if (i !== j && j !== k && i !== k) {
            if (areCollinear(positions[i], positions[j], positions[k], 10)) {
              positions[k].x += (seededRandom() - 0.5) * 20;
              positions[k].y += (seededRandom() - 0.5) * 20;
              positions[k].x = Math.max(startX, Math.min(startX + viewWidth, positions[k].x));
              positions[k].y = Math.max(startY, Math.min(startY + viewHeight, positions[k].y));
            }
          }
        }
      }
    }

    return positions;
  };

  const getSectionInfo = () => {
    if (!simulationData?.output?.sections) return [];
    const sections = simulationData.output.sections;
    const stations = getStationPositions();

    return Object.values(sections).map((section) => {
      const fromStation = stations.find((s) => s.id === section.from_station);
      const toStation = stations.find((s) => s.id === section.to_station);
      const reverseSection = Object.values(sections).find((s) => s.from_station === section.to_station && s.to_station === section.from_station);

      return {
        id: section.section_id || section.id,
        from: section.from_station,
        to: section.to_station,
        fromName: section.from_station_name,
        toName: section.to_station_name,
        distance: section.distance_km,
        maxSpeed: section.max_speed_kmh,
        fromPos: fromStation,
        toPos: toStation,
        bidirectional: !!reverseSection,
        reverseId: reverseSection?.section_id || reverseSection?.id
      };
    });
  };

  const getTrainPositions = () => {
    if (!simulationData?.output?.train_results) return [];
    const stations = getStationPositions();
    const trainResults = simulationData.output.train_results;

    return Object.values(trainResults)
      .map((train) => {
        const position = calculateTrainPosition(train, currentTime, stations);
        return {
          id: train.train_id,
          position: position,
          color: getTrainColor(train.train_id),
          status: getTrainStatus(train, currentTime),
          maxSpeed: train.max_speed_kmh,
          currentSpeed: getCurrentSpeed(train, currentTime),
          delay: train.delay_minutes || 0,
          route: `${train.start_station_name} → ${train.end_station_name}`,
          priority: train.priority_score
        };
      })
      .filter((train) => train.position);
  };

  const calculateTrainPosition = (train, time, stations) => {
    if (!train.schedule || train.schedule.length === 0) return null;

    for (let segment of train.schedule) {
      if (time >= segment.entry_time_minutes && time <= segment.exit_time_minutes) {
        const fromStation = stations.find((s) => s.id === segment.from_station);
        const toStation = stations.find((s) => s.id === segment.to_station);

        if (!fromStation || !toStation) continue;

        const progress = (time - segment.entry_time_minutes) / (segment.exit_time_minutes - segment.entry_time_minutes);

        return {
          x: fromStation.x + (toStation.x - fromStation.x) * progress,
          y: fromStation.y + (toStation.y - fromStation.y) * progress,
          moving: true,
          fromStation: segment.from_station_name,
          toStation: segment.to_station_name,
          progress: Math.round(progress * 100),
          sectionId: segment.section_id,
          currentSpeed: segment.actual_speed_kmh
        };
      }
    }

    if (time < train.schedule[0]?.entry_time_minutes) {
      const startStation = stations.find((s) => s.id === train.start_station);
      return startStation
        ? {
            x: startStation.x,
            y: startStation.y,
            moving: false,
            atStation: train.start_station_name,
            waiting: true
          }
        : null;
    }

    const lastSegment = train.schedule[train.schedule.length - 1];
    if (time > lastSegment?.exit_time_minutes) {
      const endStation = stations.find((s) => s.id === train.end_station);
      return endStation
        ? {
            x: endStation.x,
            y: endStation.y,
            moving: false,
            atStation: train.end_station_name,
            completed: true
          }
        : null;
    }

    return null;
  };

  const getCurrentSpeed = (train, time) => {
    if (!train.schedule) return 0;
    for (let segment of train.schedule) {
      if (time >= segment.entry_time_minutes && time <= segment.exit_time_minutes) {
        return segment.actual_speed_kmh || train.max_speed_kmh;
      }
    }
    return 0;
  };

  const getTrainStatus = (train, time) => {
    if (!train.schedule || train.schedule.length === 0) return 'idle';

    const firstEntry = train.schedule[0]?.entry_time_minutes || 0;
    const lastExit = train.schedule[train.schedule.length - 1]?.exit_time_minutes || 0;

    if (time < firstEntry) return 'waiting';
    if (time > lastExit) return 'completed';
    return 'running';
  };

  const getTrainColor = (trainId) => {
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    return colors[(trainId - 1) % colors.length] || '#6b7280';
  };

  const getMaxTime = () => {
    if (!simulationData?.output?.train_results) return 0;
    return Math.max(
      ...Object.values(simulationData.output.train_results).map((train) => {
        if (!train.schedule || train.schedule.length === 0) return 0;
        return Math.max(...train.schedule.map((s) => s.exit_time_minutes || 0));
      })
    );
  };

  const animate = (timestamp) => {
    if (!isPlaying) return;

    if (timestamp - lastUpdateRef.current > 100 / speed) {
      setCurrentTime((prev) => {
        const maxTime = getMaxTime();
        return prev >= maxTime ? 0 : prev + 0.1;
      });
      lastUpdateRef.current = timestamp;
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, speed]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const stop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };
  const reset = () => {
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const stations = getStationPositions();
  const sections = getSectionInfo();
  const trainPositions = getTrainPositions();

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-3xl font-bold mb-2">Advanced Train Network Simulation</h1>
        <p className="text-slate-300">Real-time train scheduling with bidirectional tracks and performance metrics</p>
      </div>

      {/* File Upload Section */}
      {!simulationData && (
        <div className="p-8 m-6 border-2 border-dashed border-slate-600 rounded-lg text-center bg-slate-800/50">
          <Upload className="mx-auto mb-4 w-16 h-16 text-slate-400" />
          <h3 className="text-xl font-semibold text-slate-200 mb-2">Upload Train Scheduling Data</h3>
          <p className="text-slate-400 mb-4">Select a JSON file with complete train scheduling input/output</p>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg">
            Choose File
          </button>
        </div>
      )}

      {/* Main Simulation Interface */}
      {simulationData && (
        <div className="flex flex-col h-screen">
          {/* Control Panel */}
          <div className="p-4 bg-slate-800 border-b border-slate-700">
            <div className="flex flex-wrap items-center gap-4">
              <button onClick={togglePlay} className={`px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-colors ${isPlaying ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}`}>
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button onClick={stop} className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 transition-colors font-medium">
                <Square className="w-5 h-5" />
                Stop
              </button>
              <button onClick={reset} className="px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-lg flex items-center gap-2 transition-colors font-medium">
                <RotateCcw className="w-5 h-5" />
                Reset
              </button>

              {/* Pane Toggle Controls */}
              <div className="flex items-center gap-2 ml-6 border-l border-slate-600 pl-6">
                <span className="text-sm font-medium text-slate-300">Panels:</span>
                <button onClick={() => setLeftPaneCollapsed(!leftPaneCollapsed)} className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors ${leftPaneCollapsed ? 'bg-slate-600 hover:bg-slate-500' : 'bg-blue-600 hover:bg-blue-700'}`} title={leftPaneCollapsed ? 'Show Left Panel' : 'Hide Left Panel'}>
                  <ChevronRight className={`w-4 h-4 transition-transform ${leftPaneCollapsed ? 'rotate-0' : 'rotate-180'}`} />
                  Left
                </button>
                <button onClick={() => setRightPaneCollapsed(!rightPaneCollapsed)} className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors ${rightPaneCollapsed ? 'bg-slate-600 hover:bg-slate-500' : 'bg-blue-600 hover:bg-blue-700'}`} title={rightPaneCollapsed ? 'Show Right Panel' : 'Hide Right Panel'}>
                  Right
                  <ChevronLeft className={`w-4 h-4 transition-transform ${rightPaneCollapsed ? 'rotate-0' : 'rotate-180'}`} />
                </button>
              </div>

              <div className="flex items-center gap-3 ml-6">
                <label className="text-sm font-medium">Speed:</label>
                <input type="range" min="0.1" max="5" step="0.1" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} className="w-32" />
                <span className="text-sm min-w-[3rem]">{speed.toFixed(1)}x</span>
              </div>
              <div className="ml-auto flex items-center gap-4">
                <span className="text-lg font-semibold">Time: {currentTime.toFixed(1)} min</span>
                <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors">
                  <Upload className="w-4 h-4" />
                  New File
                </button>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="mt-4 w-full bg-slate-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-200" style={{ width: `${Math.min((currentTime / getMaxTime()) * 100, 100)}%` }} />
            </div>
          </div>

          {/* Main Content Area with Collapsible Panes */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Pane - Made narrower */}
            {!leftPaneCollapsed && (
              <div className="w-64 flex-shrink-0 transition-all duration-300">
                <LeftPane stations={stations} sections={sections} trainPositions={trainPositions} />
              </div>
            )}

            {/* Center Pane - Better space utilization when panes are collapsed */}
            <div className={`flex-1 transition-all duration-300 ${leftPaneCollapsed && rightPaneCollapsed ? 'mx-2' : leftPaneCollapsed || rightPaneCollapsed ? 'mx-1' : ''}`}>
              {/* Debug Info - Optimized positioning */}
              <div className="absolute top-1 left-1 z-10 bg-black/60 text-white p-1.5 rounded text-xs leading-tight">
                <div>
                  Stations: {stations.length} | Sections: {sections.length}
                </div>
                <div>
                  Trains: {trainPositions.length} | Time: {currentTime.toFixed(1)}m
                </div>
              </div>

              {/* SVG Visualization - Expanded viewBox and better space utilization */}
              <div className="w-full h-full relative bg-slate-900">
                <svg width="100%" height="100%" viewBox="0 0 1000 700" className="border border-slate-700" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }} preserveAspectRatio="xMidYMid meet">
                  {/* Grid Pattern */}
                  <defs>
                    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#475569" strokeWidth="1" opacity="0.3" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Render Sections (Tracks) */}
                  {sections.map((section) => {
                    if (!section.fromPos || !section.toPos) return null;
                    return (
                      <g key={section.id}>
                        <line x1={section.fromPos.x} y1={section.fromPos.y} x2={section.toPos.x} y2={section.toPos.y} stroke="#64748b" strokeWidth="3" strokeDasharray={section.bidirectional ? 'none' : '5,5'} />
                        {/* Section Label */}
                        <text x={(section.fromPos.x + section.toPos.x) / 2} y={(section.fromPos.y + section.toPos.y) / 2 - 10} fill="#94a3b8" fontSize="10" textAnchor="middle">
                          {section.distance}km
                        </text>
                      </g>
                    );
                  })}

                  {/* Render Stations */}
                  {stations.map((station) => (
                    <g key={station.id}>
                      <circle cx={station.x} cy={station.y} r="8" fill="#3b82f6" stroke="#1e40af" strokeWidth="2" />
                      <text x={station.x} y={station.y - 15} fill="#e2e8f0" fontSize="12" fontWeight="bold" textAnchor="middle">
                        {station.name}
                      </text>
                      <text x={station.x} y={station.y + 25} fill="#94a3b8" fontSize="10" textAnchor="middle">
                        ID: {station.id}
                      </text>
                    </g>
                  ))}

                  {/* Render Trains */}
                  {trainPositions.map((train) => {
                    if (!train.position) return null;
                    return (
                      <g key={train.id}>
                        <circle cx={train.position.x} cy={train.position.y} r="6" fill={train.color} stroke="#ffffff" strokeWidth="2">
                          <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
                        </circle>
                        <text x={train.position.x + 10} y={train.position.y - 5} fill="#ffffff" fontSize="10" fontWeight="bold">
                          T{train.id}
                        </text>
                        <text x={train.position.x + 10} y={train.position.y + 10} fill="#94a3b8" fontSize="8">
                          {train.currentSpeed}km/h
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Right Pane - Made narrower */}
            {!rightPaneCollapsed && (
              <div className="w-64 flex-shrink-0 transition-all duration-300">
                <RightPane simulationData={simulationData} trainPositions={trainPositions} />
              </div>
            )}
          </div>
        </div>
      )}
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
    </div>
  );
};

export default TrainSimulation;
