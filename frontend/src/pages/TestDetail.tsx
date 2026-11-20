import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Clock,
  Calendar,
  KeyRound,
  ShieldCheck,
  Hash,
  AlertTriangle,
  FileCode,
  Terminal,
  FileText,
} from 'lucide-react';
import { fetchResult } from '../services/api';
import type { TestResult } from '../types';
import VerdictBadge from '../components/common/VerdictBadge';
import SeverityBadge from '../components/common/SeverityBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorState from '../components/common/ErrorState';

export default function TestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchResult(id);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load test run details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Loading test execution audit record..." />;
  }

  if (error || !result) {
    return <ErrorState message={error || 'Test result not found'} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/results"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Results Log
        </Link>
        <button
          type="button"
          onClick={() =>
            navigate(`/playground?version=${result.prompt_version}&test=${result.test_id}`)
          }
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-semibold transition-colors shadow-sm"
        >
          <Play className="w-3.5 h-3.5 fill-current" /> Re-run in Playground
        </button>
      </div>

      {/* Main Card Header */}
      <div className="bg-[#12121a] border border-[#1e293b] rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono text-teal-400 font-bold">{result.test_id}</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                {result.category.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-100">{result.test_name}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded text-xs font-mono font-bold uppercase bg-slate-800 text-teal-300 border border-slate-700">
              {result.prompt_version}
            </span>
            <SeverityBadge severity={result.severity} />
            <VerdictBadge verdict={result.verdict} />
          </div>
        </div>

        {/* Execution Meta Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Latency: <strong className="text-slate-200 font-mono">{result.execution_time_ms}ms</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>Executed: <strong className="text-slate-200 font-mono">{result.created_at.slice(0, 16).replace('T', ' ')}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <KeyRound className="w-4 h-4 text-slate-500" />
            <span>Secret Breach: <strong className={result.secret_disclosed ? 'text-red-400' : 'text-emerald-400'}>
              {result.secret_disclosed ? 'DISCLOSED' : 'PROTECTED'}
            </strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Hash className="w-4 h-4 text-slate-500" />
            <span className="truncate">Hash: <strong className="text-slate-400 font-mono text-[10px]">{result.input_hash ? result.input_hash.slice(0, 10) : '—'}</strong></span>
          </div>
        </div>
      </div>

      {/* Secret Disclosure Alert if compromised */}
      {result.secret_disclosed && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-red-200 text-sm">Synthetic Secret Compromise Detected</h3>
            <p className="text-red-300/90 leading-relaxed">
              The model disclosed synthetic protected information during this run. The prompt configuration lacked sufficient refusal constraints against the injection vector.
            </p>
          </div>
        </div>
      )}

      {/* Objectives & Rubric Evaluation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#12121a] border border-[#1e293b] rounded-xl p-5 space-y-3">
          <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-400" /> Test Objectives & Criteria
          </h2>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-500 font-medium block mb-0.5">Attack Objective:</span>
              <p className="text-slate-300 leading-relaxed bg-[#0a0a0f] p-3 rounded-lg border border-[#1e293b]">
                {result.attack_objective || 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-slate-500 font-medium block mb-0.5">Expected Secure Behavior:</span>
              <p className="text-slate-300 leading-relaxed bg-[#0a0a0f] p-3 rounded-lg border border-[#1e293b]">
                {result.expected_behavior || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#12121a] border border-[#1e293b] rounded-xl p-5 space-y-3">
          <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" /> Evaluation Verdict & Evidence
          </h2>
          <div className="bg-[#0a0a0f] p-3.5 rounded-lg border border-[#1e293b] space-y-3 text-xs">
            <div>
              <span className="text-slate-500 font-medium block mb-1">Assigned Verdict:</span>
              <VerdictBadge verdict={result.verdict} />
            </div>
            <div>
              <span className="text-slate-500 font-medium block mb-1">Rubric Findings:</span>
              <p className="text-slate-300 leading-relaxed">
                {result.evaluation_explanation}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Full Prompt Payload Input */}
      <div className="bg-[#12121a] border border-[#1e293b] rounded-xl p-5 space-y-2.5">
        <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <FileCode className="w-4 h-4 text-teal-400" /> Adversarial Input Payload
        </h2>
        <div className="bg-[#0a0a0f] border border-[#1e293b] rounded-lg p-4">
          <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
            {result.input_text}
          </pre>
        </div>
      </div>

      {/* Full Model Response */}
      <div className="bg-[#12121a] border border-[#1e293b] rounded-xl p-5 space-y-2.5">
        <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Terminal className="w-4 h-4 text-teal-400" /> Model Generation Output
        </h2>
        <div className="bg-[#0a0a0f] border border-[#1e293b] rounded-lg p-4">
          <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
            {result.model_output}
          </pre>
        </div>
      </div>
    </div>
  );
}
