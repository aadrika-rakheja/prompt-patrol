import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  GitCompare,
  Layers,
} from 'lucide-react';
import { fetchPromptVersions, fetchPromptVersion } from '../services/api';
import type { PromptVersion } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorState from '../components/common/ErrorState';

export default function PromptLab() {
  const navigate = useNavigate();
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);
  const [compareVersion, setCompareVersion] = useState<PromptVersion | null>(null);
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await fetchPromptVersions();
      setVersions(list);

      if (list.length > 0) {
        const fullV1 = await fetchPromptVersion(list[0].id);
        setSelectedVersion(fullV1);
        if (list.length > 1) {
          const fullV2 = await fetchPromptVersion(list[1].id);
          setCompareVersion(fullV2);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load prompt versions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectVersion = async (id: string) => {
    try {
      const full = await fetchPromptVersion(id);
      setSelectedVersion(full);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const handleSelectCompare = async (id: string) => {
    try {
      const full = await fetchPromptVersion(id);
      setCompareVersion(full);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading prompt engineering specifications..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Code2 className="w-6 h-6 text-teal-400" />
            Prompt Engineering Lab
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Analyze, compare, and audit prompt security architectures across iterative defensive versions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCompareMode(!isCompareMode)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
              isCompareMode
                ? 'bg-teal-500/20 text-teal-300 border-teal-500'
                : 'bg-[#12121a] text-slate-300 border-[#1e293b] hover:border-slate-700'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            {isCompareMode ? 'Exit Diff Comparison' : 'Side-by-Side Diff'}
          </button>

          {selectedVersion && (
            <button
              type="button"
              onClick={() => navigate(`/playground?version=${selectedVersion.id}`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-semibold transition-colors shadow-sm shadow-teal-500/10"
            >
              Test in Playground <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Version Selection Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {versions.map((v) => {
          const isSelected = selectedVersion?.id === v.id;
          return (
            <div
              key={v.id}
              onClick={() => handleSelectVersion(v.id)}
              className={`cursor-pointer rounded-xl p-5 border transition-all ${
                isSelected
                  ? 'bg-gradient-to-b from-[#161f26] to-[#12121a] border-teal-500 shadow-md shadow-teal-500/5'
                  : 'bg-[#12121a] border-[#1e293b] hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    isSelected
                      ? 'bg-teal-500 text-slate-950'
                      : 'bg-[#0a0a0f] text-slate-400 border border-[#1e293b]'
                  }`}
                >
                  {v.id.toUpperCase()}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {v.created_at.slice(0, 10)}
                </span>
              </div>
              <h2 className="text-sm font-semibold text-slate-100">{v.name}</h2>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {v.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main Content Area */}
      {isCompareMode ? (
        /* Side-by-Side Comparison View */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column (Primary) */}
          <div className="bg-[#12121a] border border-[#1e293b] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div>
                <span className="text-xs font-mono text-teal-400 uppercase font-semibold">
                  Primary Version
                </span>
                <h3 className="text-sm font-semibold text-slate-100">{selectedVersion?.name}</h3>
              </div>
              <select
                value={selectedVersion?.id}
                onChange={(e) => handleSelectVersion(e.target.value)}
                className="bg-[#0a0a0f] border border-[#1e293b] rounded-lg px-2.5 py-1 text-xs text-slate-200"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.id.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-[#0a0a0f] border border-[#1e293b] rounded-lg p-4 max-h-[500px] overflow-y-auto">
              <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                {selectedVersion?.content}
              </pre>
            </div>
          </div>

          {/* Right Column (Compare) */}
          <div className="bg-[#12121a] border border-[#1e293b] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase font-semibold">
                  Compare Target
                </span>
                <h3 className="text-sm font-semibold text-slate-100">{compareVersion?.name}</h3>
              </div>
              <select
                value={compareVersion?.id}
                onChange={(e) => handleSelectCompare(e.target.value)}
                className="bg-[#0a0a0f] border border-[#1e293b] rounded-lg px-2.5 py-1 text-xs text-slate-200"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.id.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-[#0a0a0f] border border-[#1e293b] rounded-lg p-4 max-h-[500px] overflow-y-auto">
              <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                {compareVersion?.content}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        /* Detailed Single Version View */
        selectedVersion && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Template Display */}
            <div className="lg:col-span-8 bg-[#12121a] border border-[#1e293b] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Full System Prompt Template ({selectedVersion.file})
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {selectedVersion.content ? `${selectedVersion.content.length} chars` : ''}
                </span>
              </div>
              <div className="bg-[#0a0a0f] border border-[#1e293b] rounded-lg p-4 max-h-[550px] overflow-y-auto">
                <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selectedVersion.content}
                </pre>
              </div>
            </div>

            {/* Architecture Details Sidebar */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-[#12121a] border border-[#1e293b] rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-400" /> Defense Capabilities
                </h3>
                <ul className="space-y-2">
                  {selectedVersion.key_features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {selectedVersion.changes_from_previous && (
                <div className="bg-[#12121a] border border-[#1e293b] rounded-xl p-5 space-y-2">
                  <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-teal-400" /> Evolution & Changes
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedVersion.changes_from_previous}
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}
