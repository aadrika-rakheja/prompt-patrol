import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Play,
  RotateCcw,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  FileCode2,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  fetchPromptVersions,
  fetchPromptVersion,
  fetchTestCases,
  runTest,
} from '../services/api';
import type { PromptVersion, TestCase, TestResult } from '../types';
import VerdictBadge from '../components/common/VerdictBadge';
import SeverityBadge from '../components/common/SeverityBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Playground() {
  const [searchParams] = useSearchParams();
  const preselectVersion = searchParams.get('version') || 'v1';
  const preselectTest = searchParams.get('test') || '';

  const [selectedVersionId, setSelectedVersionId] = useState<string>(preselectVersion);
  const [currentPrompt, setCurrentPrompt] = useState<PromptVersion | null>(null);

  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string>(preselectTest);
  const [currentTestCase, setCurrentTestCase] = useState<TestCase | null>(null);

  const [customInput, setCustomInput] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSystemPrompt, setShowSystemPrompt] = useState<boolean>(false);

  // Initial data load
  useEffect(() => {
    async function init() {
      try {
        const [, tests] = await Promise.all([
          fetchPromptVersions(),
          fetchTestCases(),
        ]);
        setTestCases(tests);

        const cats = Array.from(new Set(tests.map((t) => t.category))).sort();
        setCategories(cats);

        if (tests.length > 0) {
          const initialTest = preselectTest
            ? tests.find((t) => t.id === preselectTest) || tests[0]
            : tests[0];
          setSelectedTestCaseId(initialTest.id);
          setCurrentTestCase(initialTest);
          setCustomInput(initialTest.input);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to initialize playground');
      }
    }
    init();
  }, [preselectTest]);

  // Load selected prompt full content
  useEffect(() => {
    async function loadPrompt() {
      if (!selectedVersionId) return;
      try {
        const fullPrompt = await fetchPromptVersion(selectedVersionId);
        setCurrentPrompt(fullPrompt);
      } catch (err: unknown) {
        console.error('Failed to load prompt version:', err);
      }
    }
    loadPrompt();
  }, [selectedVersionId]);

  // Filter test cases by category
  const filteredTestCases =
    selectedCategory === 'all'
      ? testCases
      : testCases.filter((t) => t.category === selectedCategory);

  const handleSelectTestCase = (testId: string) => {
    setSelectedTestCaseId(testId);
    const tc = testCases.find((t) => t.id === testId);
    if (tc) {
      setCurrentTestCase(tc);
      setCustomInput(tc.input);
      setResult(null);
    }
  };

  const handleRun = async () => {
    if (!selectedTestCaseId) return;
    setIsRunning(true);
    setError(null);
    try {
      const res = await runTest(selectedVersionId, selectedTestCaseId, customInput);
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Test execution failed.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Play className="w-6 h-6 text-teal-400" />
          Prompt Testing Playground
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Execute isolated adversarial prompts against V1, V2, and V3 architectures and observe deterministic & behavioral defenses.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration & Input */}
        <div className="lg:col-span-6 space-y-5">
          {/* Controls Card */}
          <div className="bg-[#12121a] border border-[#1e293b] rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider text-xs">
              Test Execution Configuration
            </h2>

            {/* Prompt Version Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Target Prompt Version
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['v1', 'v2', 'v3'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      setSelectedVersionId(v);
                      setResult(null);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all ${
                      selectedVersionId === v
                        ? 'bg-teal-500/10 border-teal-500 text-teal-300'
                        : 'bg-[#0a0a0f] border-[#1e293b] text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {v.toUpperCase()} {v === 'v1' ? 'Baseline' : v === 'v2' ? 'Hardened' : 'Refined'}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Attack Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-[#0a0a0f] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Test Case Dropdown */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Select Test Case
                </label>
                <select
                  value={selectedTestCaseId}
                  onChange={(e) => handleSelectTestCase(e.target.value)}
                  className="w-full bg-[#0a0a0f] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  {filteredTestCases.map((tc) => (
                    <option key={tc.id} value={tc.id}>
                      [{tc.id}] {tc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Test Case Meta Preview */}
            {currentTestCase && (
              <div className="bg-[#0a0a0f] border border-[#1e293b] rounded-lg p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">{currentTestCase.name}</span>
                  <div className="flex items-center gap-1.5">
                    <SeverityBadge severity={currentTestCase.severity} />
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        currentTestCase.is_adversarial
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {currentTestCase.is_adversarial ? 'Adversarial' : 'Benign'}
                    </span>
                  </div>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  <span className="text-slate-500 font-medium">Objective: </span>
                  {currentTestCase.attack_objective}
                </p>
              </div>
            )}

            {/* Prompt Input Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Adversarial Prompt Payload
                </label>
                <button
                  type="button"
                  onClick={() => currentTestCase && setCustomInput(currentTestCase.input)}
                  className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset Payload
                </button>
              </div>
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                rows={6}
                className="w-full bg-[#0a0a0f] border border-[#1e293b] rounded-lg p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 resize-y"
                placeholder="Enter adversarial or benign prompt input..."
              />
            </div>

            {/* Action Button */}
            <button
              type="button"
              disabled={isRunning || !customInput.trim()}
              onClick={handleRun}
              className="w-full py-2.5 px-4 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-semibold text-xs tracking-wide transition-all shadow-md shadow-teal-500/10 flex items-center justify-center gap-2"
            >
              {isRunning ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Dispatching to Model & Evaluating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Execute Prompt Attack
                </>
              )}
            </button>
          </div>

          {/* Active System Prompt Accordion */}
          <div className="bg-[#12121a] border border-[#1e293b] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSystemPrompt(!showSystemPrompt)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#161622] transition-colors"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <FileCode2 className="w-4 h-4 text-teal-400" />
                Active System Prompt Template ({selectedVersionId.toUpperCase()})
              </div>
              {showSystemPrompt ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>
            {showSystemPrompt && (
              <div className="p-4 border-t border-[#1e293b] bg-[#0a0a0f]">
                <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                  {currentPrompt?.content || 'Loading system prompt template...'}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Output & Evaluation Telemetry */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-[#12121a] border border-[#1e293b] rounded-xl p-5 min-h-[460px] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b] mb-4">
              <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" /> Model Response & Security Verdict
              </h2>
              {result && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" /> {result.execution_time_ms}ms
                  </span>
                  <VerdictBadge verdict={result.verdict} />
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs mb-4">
                {error}
              </div>
            )}

            {isRunning ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16">
                <LoadingSpinner message="Testing prompt defense against Gemini..." />
              </div>
            ) : result ? (
              <div className="space-y-4 flex-1">
                {/* Secret disclosure banner if breached */}
                {result.secret_disclosed && (
                  <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold block text-rose-200">
                        CRITICAL SECURITY BREACH
                      </strong>
                      Protected synthetic tokens were leaked in the output response.
                    </div>
                  </div>
                )}

                {/* Raw Model Output */}
                <div>
                  <span className="block text-xs font-medium text-slate-400 mb-1.5">
                    LLM Raw Response:
                  </span>
                  <div className="bg-[#0a0a0f] border border-[#1e293b] rounded-lg p-3.5 text-xs text-slate-200 font-mono whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
                    {result.model_output}
                  </div>
                </div>

                {/* Evaluation Rubric Details */}
                <div className="bg-[#0d0d14] border border-[#1e293b] rounded-lg p-4 space-y-2.5">
                  <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-teal-400" />
                    Rubric Evaluation & Evidence:
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {result.evaluation_explanation}
                  </p>
                  <div className="pt-2 border-t border-[#1e293b]/60 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <div>
                      <span className="text-slate-500">Expected:</span>{' '}
                      {result.expected_behavior}
                    </div>
                    <div>
                      <span className="text-slate-500">Synthetic Secret Leaked:</span>{' '}
                      <span className={result.secret_disclosed ? 'text-red-400 font-semibold' : 'text-emerald-400'}>
                        {result.secret_disclosed ? 'YES' : 'NO'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500">
                <Play className="w-8 h-8 stroke-slate-700 mb-2" />
                <p className="text-xs">
                  Select a prompt version, payload, and click "Execute Prompt Attack" to test defenses.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
