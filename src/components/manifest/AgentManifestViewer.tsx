import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AgentManifest } from '../../types/index';
import { api } from '../../lib/api';
import { FileCode2, Copy, Check, Download, ShieldCheck, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';

export function AgentManifestViewer() {
  const { merchant, store } = useAuth();
  const [manifest, setManifest] = useState<AgentManifest | null>(null);
  const [validation, setValidation] = useState<{ isValid: boolean; score: number; errors: string[]; warnings: string[] } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchManifest = async () => {
    setIsLoading(true);
    try {
      const data = await api.getManifest(merchant?.id);
      setManifest(data);
      const valResult = await api.validateManifest(data);
      setValidation(valResult);
    } catch (err) {
      console.error('Error fetching manifest:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchManifest();
  }, [merchant]);

  const handleCopy = () => {
    if (!manifest) return;
    navigator.clipboard.writeText(JSON.stringify(manifest, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!manifest) return;
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agent-commerce.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCode2 className="w-6 h-6 text-violet-400" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Agent Commerce Manifest (.json)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Universal Commerce Protocol (UCP-1.0) machine-readable contract served at{' '}
            <code className="text-violet-400 font-mono">/.well-known/agent-commerce.json</code>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-refresh-manifest"
            onClick={fetchManifest}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-white bg-[#080809] border border-slate-800/60 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            id="btn-copy-manifest-json"
            onClick={handleCopy}
            className="px-3 py-2 text-xs font-medium bg-[#080809] hover:bg-slate-800 text-slate-200 border border-slate-700/60 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied JSON' : 'Copy JSON'}</span>
          </button>
          <button
            id="btn-download-manifest"
            onClick={handleDownload}
            className="px-3.5 py-2 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-violet-900/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .json</span>
          </button>
        </div>
      </div>

      {/* Validation Status Card */}
      {validation && (
        <div className="p-4 md:p-5 bg-[#0D0D0E] border border-slate-800/50 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              validation.isValid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
            }`}>
              {validation.isValid ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  Manifest Status: {validation.isValid ? 'VALID UCP-1.0' : 'REQUIRES ATTENTION'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                  Score: {validation.score}/100
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {validation.errors.length === 0
                  ? 'All autonomous shopping agent endpoints, schema declarations, and token capabilities verified.'
                  : `${validation.errors.length} validation errors detected.`}
              </p>
            </div>
          </div>

          <a
            href="/.well-known/agent-commerce.json"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-mono shrink-0"
          >
            <span>Live HTTP Endpoint</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* JSON Viewer */}
      <div className="bg-[#080809] border border-slate-800/50 rounded-2xl overflow-hidden">
        <div className="px-4 py-2.5 bg-[#0D0D0E] border-b border-slate-800/50 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">/.well-known/agent-commerce.json</span>
          <span className="text-[10px] text-violet-400 font-mono">UCP Specification Version 1.0.0</span>
        </div>
        <pre className="p-4 md:p-6 text-xs font-mono text-violet-300/90 overflow-x-auto leading-relaxed max-h-[500px]">
          {manifest ? JSON.stringify(manifest, null, 2) : '// Loading manifest...'}
        </pre>
      </div>
    </div>
  );
}
