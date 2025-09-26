// Right Pane Component

'use client';

import { Activity, Clock, Gauge, MapPin, Navigation, Pause, Play, RotateCcw, Square, Train, TrendingUp, Upload, Zap } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

const RightPane = ({ simulationData, trainPositions }) => {
  return (
    <div className="w-64 h-full bg-slate-800/50 border-l border-slate-700 overflow-y-auto">
      {/* Performance Metrics */}
      <div className="p-3 border-b border-slate-700">
        <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-400" />
          Performance
        </h3>
        <div className="space-y-2">
          <div className="bg-slate-700/50 rounded-lg p-2">
            <div className="text-xs text-slate-400 mb-1">Total Completion Time</div>
            <div className="text-lg font-semibold text-green-400">
              {simulationData.output.performance_metrics?.total_completion_time_minutes || 'N/A'} min
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-2">
            <div className="text-xs text-slate-400 mb-1">Average Delay</div>
            <div className="text-lg font-semibold text-orange-400">
              {simulationData.output.performance_metrics?.average_delay_minutes || 'N/A'} min
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-2">
            <div className="text-xs text-slate-400 mb-1">Success Rate</div>
            <div className="text-lg font-semibold text-blue-400">
              {simulationData.output.performance_metrics?.success_rate_percent || 'N/A'}%
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-2">
            <div className="text-xs text-slate-400 mb-1">Total Delay</div>
            <div className="text-lg font-semibold text-red-400">
              {simulationData.output.performance_metrics?.total_delay_minutes || 'N/A'} min
            </div>
          </div>
        </div>
      </div>

      {/* Active Trains */}
      <div className="p-3">
        <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          Active Trains
        </h3>
        <div className="space-y-2">
          {trainPositions
            .filter((t) => t.status === 'running')
            .map((train) => (
              <div key={train.id} className="bg-slate-700/50 rounded-lg p-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: train.color }} />
                  <span className="font-medium text-xs">Train {train.id}</span>
                  <Gauge className="w-3 h-3 text-blue-400 ml-auto" />
                </div>
                {train.position.moving ? (
                  <div className="text-xs text-slate-400 space-y-0.5">
                    <div className="truncate">From: {train.position.fromStation}</div>
                    <div className="truncate">To: {train.position.toStation}</div>
                    <div className="flex justify-between">
                      <span>Progress:</span>
                      <span className="text-green-400">{train.position.progress}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Speed:</span>
                      <span className="text-yellow-400">{train.currentSpeed}km/h</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 truncate">At: {train.position.atStation}</div>
                )}
              </div>
            ))}
          {trainPositions.filter((t) => t.status === 'running').length === 0 && (
            <div className="text-center text-slate-400 py-6">
              <Zap className="w-6 h-6 mx-auto mb-1 opacity-50" />
              <p className="text-xs">No trains currently running</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RightPane;