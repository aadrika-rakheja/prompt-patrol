import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Filter,
  ShieldAlert,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { fetchResults } from '../services/api';
import type { TestResult } from '../types';
import VerdictBadge from '../components/common/VerdictBadge';
import SeverityBadge from '../components/common/SeverityBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';

export default function Results() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [versionFilter, setVersionFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [verdictFilter, setVerdictFilter] = useState<string>('all');

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: Record<string, string> = {};
      if (versionFilter !== 'all') filters.prompt_version = versionFilter;
      if (categoryFilter !== 'all') filters.category = categoryFilter;
      if (verdictFilter !== 'all') filters.verdict = verdictFilter;

      const data = await fetchResults(filters);
      setResults(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch test results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, [versionFilter, categoryFilter, verdictFilter]);

  if (loading) {
    return <LoadingSpinner message="Querying test run evaluations..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadResults} />;
  }

  // Quick summary counts calculated directly from current loaded results
  const total = results.length;
  const blocked = results.filter((r) => r.verdict === 'blocked').length;
  const succeeded = results.filter((r) => r.verdict === 'succeeded').length;
  const benignPass = results.filter((r) => r.verdict === 'benign_pass').length;
  const falsePositive = results.filter((r) => r.verdict === 'false_positive').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-teal-400" />
            Experiment Evaluation Results
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Historical log of all executed prompt injection and defense trials with deterministic rubric outputs.
          </p>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-[#12121a] border border-[#1e293b] rounded-xl p-3 text-center">
          <span className="text-[11px] text-slate-400 uppercase font-medium">Total Runs</span>
          <div className="text-xl font-bold text-slate-100 mt-0.5">{total}</div>
        </div>
        <div className="bg-[#12121a] border border-[#1e293b] rounded-xl p-3 text-center">
          <span className="text-[11px] text-emerald-400 uppercase font-medium">Blocked</span>
          <div className="text-xl font-bold text-emerald-400 mt-0.5">{blocked}</div>
        </div>
        <div className="bg-[#12121a] border border-[#1e293b] rounded-xl p-3 text-center">
          <span className="text-[11px] text-rose-400 uppercase font-medium">Breached</span>
          <div className="text-xl font-bold text-rose-400 mt-0.5">{succeeded}</div>
        </div>
        <div className="bg-[#12121a] border border-[#1e293b] rounded-xl p-3 text-center">
          <span className="text-[11px] text-sky-400 uppercase font-medium">Benign Passed</span>
          <div className="text-xl font-bold text-sky-400 mt-0.5">{benignPass}</div>
        </div>
        <div className="bg-[#12121a] border border-[#1e293b] rounded-xl p-3 text-center">
          <span className="text-[11px] text-amber-400 uppercase font-medium">False Refusals</span>
          <div className="text-xl font-bold text-amber-400 mt-0.5">{falsePositive}</div>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-[#12121a] border border-[#1e293b] p-3.5 rounded-xl text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-semibold mr-2">
          <Filter className="w-3.5 h-3.5 text-teal-400" /> Filters:
        </div>

        {/* Version Filter */}
        <select
          value={versionFilter}
          onChange={(e) => setVersionFilter(e.target.value)}
          className="bg-[#0a0a0f] border border-[#1e293b] rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-teal-500"
        >
          <option value="all">All Versions</option>
          <option value="v1">V1 (Baseline)</option>
          <option value="v2">V2 (Hardened)</option>
          <option value="v3">V3 (Refined)</option>
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-[#0a0a0f] border border-[#1e293b] rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-teal-500"
        >
          <option value="all">All Categories</option>
          <option value="direct_injection">Direct Injection</option>
          <option value="jailbreak">Jailbreak</option>
          <option value="instruction_conflict">Instruction Conflict</option>
          <option value="indirect_injection">Indirect Injection</option>
          <option value="benign">Benign Tests</option>
        </select>

        {/* Verdict Filter */}
        <select
          value={verdictFilter}
          onChange={(e) => setVerdictFilter(e.target.value)}
          className="bg-[#0a0a0f] border border-[#1e293b] rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-teal-500"
        >
          <option value="all">All Verdicts</option>
          <option value="blocked">Blocked</option>
          <option value="succeeded">Succeeded (Leaked)</option>
          <option value="benign_pass">Benign Pass</option>
          <option value="false_positive">False Positive</option>
          <option value="inconclusive">Inconclusive</option>
          <option value="error">Error</option>
        </select>

        {(versionFilter !== 'all' || categoryFilter !== 'all' || verdictFilter !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setVersionFilter('all');
              setCategoryFilter('all');
              setVerdictFilter('all');
            }}
            className="text-xs text-teal-400 hover:text-teal-300 ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Results Table */}
      {results.length === 0 ? (
        <EmptyState
          title="No Results Matching Criteria"
          message="No experiment logs match the active filter criteria. Try adjusting your filters or execute new runs in Playground."
          action={
            <button
              onClick={() => window.location.assign('/playground')}
              className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-medium text-xs transition-colors"
            >
              Go to Playground
            </button>
          }
        />
      ) : (
        <div className="bg-[#12121a] border border-[#1e293b] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0e0e15] text-[11px] text-slate-400 uppercase border-b border-[#1e293b]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Test Case</th>
                  <th className="px-4 py-3 font-semibold">Version</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Severity</th>
                  <th className="px-4 py-3 font-semibold">Verdict</th>
                  <th className="px-4 py-3 font-semibold">Secret Breach</th>
                  <th className="px-4 py-3 font-semibold">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Latency
                    </span>
                  </th>
                  <th className="px-4 py-3 font-semibold">Timestamp</th>
                  <th className="px-5 py-3 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {results.map((r) => (
                  <tr key={r.id} className="hover:bg-[#161622] transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-200 max-w-xs truncate">
                      <div className="font-semibold">{r.test_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{r.test_id}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-slate-800 text-teal-300 border border-slate-700">
                        {r.prompt_version}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 capitalize">
                      {r.category.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3.5">
                      <SeverityBadge severity={r.severity} />
                    </td>
                    <td className="px-4 py-3.5">
                      <VerdictBadge verdict={r.verdict} />
                    </td>
                    <td className="px-4 py-3.5">
                      {r.secret_disclosed ? (
                        <span className="text-red-400 font-bold flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" /> LEAKED
                        </span>
                      ) : (
                        <span className="text-slate-500">Secured</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-400">
                      {r.execution_time_ms ? `${r.execution_time_ms}ms` : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                      {r.created_at.slice(0, 16).replace('T', ' ')}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/results/${r.id}`}
                        className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300 font-medium"
                      >
                        Audit <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
