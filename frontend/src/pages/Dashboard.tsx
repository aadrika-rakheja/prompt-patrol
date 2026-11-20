import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Activity,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import { fetchDashboardMetrics } from '../services/api';
import type { DashboardMetrics } from '../types';
import MetricCard from '../components/common/MetricCard';
import VerdictBadge from '../components/common/VerdictBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDashboardMetrics();
      setMetrics(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Calculating prompt security telemetry..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  if (!metrics || metrics.total_tests === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Security Telemetry Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time adversarial defense and prompt evaluation metrics.
          </p>
        </div>
        <EmptyState
          title="No Telemetry Data Recorded"
          message="Run tests in the Playground to evaluate V1, V2, and V3 prompts against adversarial attack vectors."
          action={
            <button
              onClick={() => window.location.assign('/playground')}
              className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-medium text-xs transition-colors"
            >
              Open Testing Playground
            </button>
          }
        />
      </div>
    );
  }

  // Prepare chart comparison data
  const chartData = Object.entries(metrics.version_metrics).map(([vKey, vData]) => ({
    name: vKey.toUpperCase(),
    'Attack Success Rate (%)': vData.attack_success_rate,
    'Policy Adherence (%)': vData.policy_adherence_rate,
    'Benign Pass Rate (%)': vData.benign_pass_rate,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-6 h-6 text-teal-400" />
            Security Telemetry Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Live evaluation metrics derived directly from persistent test run history.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/playground"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-medium text-sm transition-colors shadow-sm shadow-teal-500/20"
          >
            Launch Playground <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Runs"
          value={metrics.total_tests.toString()}
          subtitle={`${metrics.attack_attempts} adversarial / ${metrics.total_tests - metrics.attack_attempts} benign`}
          icon={Layers}
        />
        <MetricCard
          title="Attack Success Rate (ASR)"
          value={`${metrics.attack_success_rate}%`}
          subtitle="Target: 0% (Lower is better)"
          icon={ShieldAlert}
          trend={{
            value: metrics.attack_success_rate,
            positive: metrics.attack_success_rate <= 30,
          }}
        />
        <MetricCard
          title="Policy Adherence"
          value={`${metrics.policy_adherence_rate}%`}
          subtitle={`${metrics.attacks_blocked} attacks actively blocked`}
          icon={ShieldCheck}
        />
        <MetricCard
          title="Benign Pass Rate"
          value={`${metrics.benign_pass_rate}%`}
          subtitle="Utility preservation (anti-false positive)"
          icon={ShieldX}
        />
      </div>

      {/* Comparative Version Analysis Chart */}
      <div className="bg-[#12121a] border border-[#1e293b] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-1">
          Prompt Defense Efficacy Comparison
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Comparing Attack Success Rate (ASR) vs Policy Adherence across V1 (Baseline), V2 (Hardened), and V3 (Refined).
        </p>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0a0f',
                  borderColor: '#1e293b',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Attack Success Rate (%)" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Policy Adherence (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Benign Pass Rate (%)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-[#12121a] border border-[#1e293b] rounded-xl overflow-hidden">
        <div className="p-5 border-b border-[#1e293b] flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Recent Experiment Runs</h2>
            <p className="text-xs text-slate-400 mt-0.5">Most recent evaluations recorded in database</p>
          </div>
          <Link
            to="/results"
            className="text-xs font-medium text-teal-400 hover:text-teal-300 flex items-center gap-1"
          >
            View all results <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#0e0e15] text-xs text-slate-400 uppercase border-b border-[#1e293b]">
              <tr>
                <th className="px-5 py-3 font-medium">Test Case</th>
                <th className="px-5 py-3 font-medium">Version</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Verdict</th>
                <th className="px-5 py-3 font-medium">Secret Leak</th>
                <th className="px-5 py-3 font-medium">Latency</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {metrics.recent_results.map((res) => (
                <tr key={res.id} className="hover:bg-[#181824] transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-200">
                    <div>{res.test_name}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{res.test_id}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold uppercase bg-slate-800 text-teal-300 border border-slate-700">
                      {res.prompt_version}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">
                    {res.category.replace('_', ' ')}
                  </td>
                  <td className="px-5 py-3.5">
                    <VerdictBadge verdict={res.verdict} />
                  </td>
                  <td className="px-5 py-3.5 text-xs">
                    {res.secret_disclosed ? (
                      <span className="text-red-400 font-semibold flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" /> LEAKED
                      </span>
                    ) : (
                      <span className="text-slate-500">Secured</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-400 font-mono">
                    {res.execution_time_ms ? `${res.execution_time_ms}ms` : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      to={`/results/${res.id}`}
                      className="text-xs font-medium text-teal-400 hover:text-teal-300"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
