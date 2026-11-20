import axios, { AxiosError } from 'axios';
import type {
  TestCase,
  PromptVersion,
  TestResult,
  DashboardMetrics,
  ComparisonData,
  BatchResponse,
  ComparisonResponse,
  ResultsFilter,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

function handleError(error: unknown): never {
  if (error instanceof AxiosError) {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message;
    throw new Error(message);
  }
  throw error;
}

export async function fetchHealth(): Promise<{ status: string }> {
  try {
    const { data } = await api.get('/health');
    return data;
  } catch (error) {
    return handleError(error);
  }
}

export async function fetchPromptVersions(): Promise<PromptVersion[]> {
  try {
    const { data } = await api.get('/prompts');
    return data;
  } catch (error) {
    return handleError(error);
  }
}

export async function fetchPromptVersion(id: string): Promise<PromptVersion> {
  try {
    const { data } = await api.get(`/prompts/${id}`);
    return data;
  } catch (error) {
    return handleError(error);
  }
}

export async function fetchTestCases(category?: string): Promise<TestCase[]> {
  try {
    const params = category && category !== 'all' ? { category } : {};
    const { data } = await api.get('/test-cases', { params });
    return data;
  } catch (error) {
    return handleError(error);
  }
}

export async function fetchTestCase(id: string): Promise<TestCase> {
  try {
    const { data } = await api.get(`/test-cases/${id}`);
    return data;
  } catch (error) {
    return handleError(error);
  }
}

export async function runTest(
  prompt_version: string,
  test_id: string,
  custom_input?: string
): Promise<TestResult> {
  try {
    const body: Record<string, string> = { prompt_version, test_id };
    if (custom_input !== undefined) {
      body.custom_input = custom_input;
    }
    const { data } = await api.post('/experiments/run', body);
    return data;
  } catch (error) {
    return handleError(error);
  }
}

export async function runBatch(
  prompt_version: string,
  test_ids?: string[],
  categories?: string[]
): Promise<BatchResponse> {
  try {
    const body: Record<string, unknown> = { prompt_version };
    if (test_ids) body.test_ids = test_ids;
    if (categories) body.categories = categories;
    const { data } = await api.post('/experiments/batch', body);
    return data;
  } catch (error) {
    return handleError(error);
  }
}

export async function runComparison(
  test_ids?: string[],
  categories?: string[]
): Promise<ComparisonResponse> {
  try {
    const body: Record<string, unknown> = {};
    if (test_ids) body.test_ids = test_ids;
    if (categories) body.categories = categories;
    const { data } = await api.post('/experiments/compare', body);
    return data;
  } catch (error) {
    return handleError(error);
  }
}

export async function fetchResults(
  filters?: ResultsFilter
): Promise<TestResult[]> {
  try {
    const { data } = await api.get('/results', { params: filters });
    return data;
  } catch (error) {
    return handleError(error);
  }
}

export async function fetchResult(id: string): Promise<TestResult> {
  try {
    const { data } = await api.get(`/results/${id}`);
    return data;
  } catch (error) {
    return handleError(error);
  }
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const { data } = await api.get('/metrics/dashboard');
    return data;
  } catch (error) {
    return handleError(error);
  }
}

export async function fetchComparison(): Promise<ComparisonData> {
  try {
    const { data } = await api.get('/metrics/comparison');
    return data;
  } catch (error) {
    return handleError(error);
  }
}
