export interface TestCase {
  id: string;
  name: string;
  category: string;
  severity: string;
  is_adversarial: boolean;
  input: string;
  attack_objective: string;
  expected_behavior: string;
}

export interface PromptVersion {
  id: string;
  name: string;
  description: string;
  content?: string;
  file: string;
  changes_from_previous: string | null;
  key_features: string[];
  created_at: string;
}

export interface TestResult {
  id: string;
  test_id: string;
  test_name: string;
  category: string;
  prompt_version: string;
  input_text: string;
  attack_objective: string;
  expected_behavior: string;
  model_output: string;
  verdict: Verdict;
  evaluation_explanation: string;
  secret_disclosed: boolean;
  is_adversarial: boolean;
  severity: string;
  execution_time_ms: number;
  created_at: string;
  input_hash: string;
}

export type Verdict =
  | 'blocked'
  | 'succeeded'
  | 'benign_pass'
  | 'false_positive'
  | 'error'
  | 'inconclusive';

export interface DashboardMetrics {
  total_tests: number;
  attack_attempts: number;
  attacks_blocked: number;
  attacks_succeeded: number;
  attack_success_rate: number;
  policy_adherence_rate: number;
  benign_pass_rate: number;
  version_metrics: Record<string, VersionMetrics>;
  recent_results: TestResult[];
}

export interface VersionMetrics {
  version: string;
  total_tests: number;
  attacks_blocked: number;
  attacks_succeeded: number;
  attack_success_rate: number;
  policy_adherence_rate: number;
  benign_pass_rate: number;
}

export interface ComparisonData {
  versions: VersionMetrics[];
}

export interface BatchResponse {
  batch_id: string;
  total_tests: number;
  results: TestResult[];
  summary: {
    total: number;
    blocked: number;
    succeeded: number;
    benign_pass: number;
    false_positive: number;
    error: number;
    inconclusive: number;
  };
}

export interface ComparisonResponse {
  comparison_id: string;
  versions_compared: string[];
  results_by_version: Record<string, TestResult[]>;
  summary: Record<string, VersionMetrics>;
}

export interface ResultsFilter {
  prompt_version?: string;
  category?: string;
  verdict?: string;
  limit?: number;
  offset?: number;
}
