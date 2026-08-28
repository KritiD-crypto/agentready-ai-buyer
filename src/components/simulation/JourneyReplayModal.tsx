import React, { useState, useEffect } from 'react';
import { SimulationReport } from '../../types/index';
import { JourneyStepCard } from './JourneyStepCard';
import { X, Play, Pause, RotateCcw, ChevronRight, ChevronLeft, Bot, ShieldCheck, AlertOctagon } from 'lucide-react';

interface JourneyReplayModalProps {
  report: SimulationReport | null;
  onClose: () => void;
}

export function JourneyReplayModal({ report, onClose }: JourneyReplayModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1500); // ms per step

  if (!report) return null;

  const totalSteps = report.journeySteps.length;
  const currentStep = report.journeySteps[currentStepIndex] || report.journeySteps[0];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setTimeout(() => {
        if (currentStepIndex < totalSteps - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, playbackSpeed);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, totalSteps, playbackSpeed]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">AI Buyer Journey Replay</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-full">
                  {report.persona.name}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Evaluating: {report.evaluatedProducts[0]?.title || 'Store Catalog'}
              </p>
            </div>
          </div>

          <button
            id="btn-close-replay-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar & Stage Indicator */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-1.5">
            {report.journeySteps.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentStepIndex(idx)}
                title={`Stage ${idx + 1}: ${s.title}`}
                className={`h-2 flex-1 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? 'bg-indigo-500 ring-2 ring-indigo-400/40'
                    : idx < currentStepIndex
                    ? s.status === 'pass'
                      ? 'bg-emerald-500/80'
                      : 'bg-rose-500/80'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-mono text-slate-400 whitespace-nowrap">
            Step {currentStepIndex + 1} of {totalSteps}
          </span>
        </div>

        {/* Main Step Viewer */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          <JourneyStepCard step={currentStep} />
        </div>

        {/* Playback Controls Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              id="btn-replay-prev-step"
              onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentStepIndex === 0}
              className="p-2 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              id="btn-replay-toggle-play"
              onClick={() => {
                if (currentStepIndex === totalSteps - 1) {
                  setCurrentStepIndex(0);
                }
                setIsPlaying(!isPlaying);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-all shadow-md shadow-indigo-500/20"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Pause' : currentStepIndex === totalSteps - 1 ? 'Replay' : 'Auto Play'}</span>
            </button>

            <button
              id="btn-replay-next-step"
              onClick={() => setCurrentStepIndex((prev) => Math.min(totalSteps - 1, prev + 1))}
              disabled={currentStepIndex === totalSteps - 1}
              className="p-2 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Speed:</span>
            {[
              { label: '1x', val: 1500 },
              { label: '2x', val: 800 },
              { label: '0.5x', val: 2500 },
            ].map((s) => (
              <button
                key={s.label}
                onClick={() => setPlaybackSpeed(s.val)}
                className={`px-2 py-1 rounded text-[11px] font-semibold border ${
                  playbackSpeed === s.val
                    ? 'bg-slate-800 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
