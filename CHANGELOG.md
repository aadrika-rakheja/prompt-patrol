# Changelog

All notable changes to PromptPatrol will be documented in this file.

## [1.0.0] - 2025-02-15

### Added

- **Dashboard** with real-time metrics computed from stored test results
- **Prompt Testing Playground** for executing individual security tests
- **Test Case Library** with 18 curated test cases across 5 categories
- **Prompt Lab** for viewing and comparing V1, V2, V3 prompt versions
- **Results & Analysis** page with filtering, sorting, and version comparison charts
- **Test Detail** view with full response analysis
- **Experiment Runner** supporting single, batch, and cross-version comparisons
- **Evaluation Engine** with deterministic secret disclosure detection
- **Prompt V1** (Baseline) — minimal security constraints
- **Prompt V2** (Hardened) — explicit instruction hierarchy and refusal behavior
- **Prompt V3** (Refined) — structured responses, examples, reduced false positives
- FastAPI backend with async SQLite storage
- React/Vite/TypeScript frontend with Tailwind CSS
- Google Gemini API integration with configurable model
- Comprehensive API with health check, CRUD, and experiment endpoints
- Dark cybersecurity theme with responsive layout
- Empty states, loading states, and error handling throughout
