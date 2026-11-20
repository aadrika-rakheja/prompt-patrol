import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Play,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { fetchTestCases } from '../services/api';
import type { TestCase } from '../types';
import SeverityBadge from '../components/common/SeverityBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorState from '../components/common/ErrorState';

export default function TestLibrary() {
  const navigate = useNavigate();
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadTests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTestCases();
      setTestCases(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load test case library.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, []);

  const categories = [
    { id: 'all', label: 'All Cases' },
    { id: 'direct_injection', label: 'Direct Injection' },
    { id: 'jailbreak', label: 'Jailbreak' },
    { id: 'instruction_conflict', label: 'Instruction Conflict' },
    { id: 'indirect_injection', label: 'Indirect Injection' },
    { id: 'benign', label: 'Benign Tests' },
  ];

  const filtered = testCases.filter((tc) => {
    const matchesCategory =
      activeCategory === 'all' || tc.category.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch =
      tc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.input.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.attack_objective.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return <LoadingSpinner message="Loading test case library..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadTests} />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-teal-400" />
            Adversarial Test Library
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Organized repository of 18 prompt injection, persona override, context hijacking, and benign utility benchmarks.
          </p>
        </div>
        <div className="text-xs text-slate-400 font-mono bg-[#12121a] border border-[#1e293b] px-3 py-1.5 rounded-lg">
          Total Cases: <span className="text-teal-400 font-semibold">{testCases.length}</span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#12121a] border border-[#1e293b] p-4 rounded-xl">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeCategory === c.id
                  ? 'bg-teal-500 text-slate-950 font-semibold shadow-sm'
                  : 'bg-[#0a0a0f] text-slate-400 hover:text-slate-200 border border-[#1e293b]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search test cases or payloads..."
            className="w-full bg-[#0a0a0f] border border-[#1e293b] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Test Case Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((tc) => {
          const isExpanded = expandedId === tc.id;
          return (
            <div
              key={tc.id}
              className="bg-[#12121a] border border-[#1e293b] hover:border-slate-700 rounded-xl p-5 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[11px] font-mono text-teal-400 block mb-0.5 font-semibold">
                      {tc.id}
                    </span>
                    <h2 className="text-sm font-semibold text-slate-100">{tc.name}</h2>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <SeverityBadge severity={tc.severity} />
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase flex items-center gap-1 ${
                        tc.is_adversarial
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {tc.is_adversarial ? (
                        <>
                          <ShieldAlert className="w-3 h-3" /> Adversarial
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3 h-3" /> Benign
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-400 space-y-1 mb-3">
                  <p>
                    <span className="text-slate-500 font-medium">Objective: </span>
                    {tc.attack_objective}
                  </p>
                  <p>
                    <span className="text-slate-500 font-medium">Expected Behavior: </span>
                    {tc.expected_behavior}
                  </p>
                </div>

                {/* Collapsible Payload Preview */}
                <div className="bg-[#0a0a0f] border border-[#1e293b] rounded-lg p-3 text-xs font-mono text-slate-300">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">
                    Payload:
                  </div>
                  <div className={`${isExpanded ? '' : 'line-clamp-3'} whitespace-pre-wrap leading-relaxed`}>
                    {tc.input}
                  </div>
                  {tc.input.length > 120 && (
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : tc.id)}
                      className="text-[10px] text-teal-400 hover:text-teal-300 mt-1 block"
                    >
                      {isExpanded ? 'Show less' : 'Read full payload...'}
                    </button>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 mt-4 border-t border-[#1e293b] flex items-center justify-between">
                <span className="text-[11px] text-slate-500 uppercase font-medium">
                  {tc.category.replace('_', ' ')}
                </span>
                <button
                  type="button"
                  onClick={() => navigate(`/playground?test=${tc.id}`)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-medium transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  Test in Playground <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-[#12121a] border border-[#1e293b] rounded-xl text-slate-400 text-xs">
          No test cases matched your filter criteria.
        </div>
      )}
    </div>
  );
}
