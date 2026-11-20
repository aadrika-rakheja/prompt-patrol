"""
Async SQLite database layer using aiosqlite.
Provides initialization, insert, and query helpers for test results.
"""

from __future__ import annotations

import logging
from typing import Any, Optional

import aiosqlite

from app.config import settings

logger = logging.getLogger(__name__)

# Derive the database file path from the DATABASE_URL config value.
_DB_PATH: str = settings.DATABASE_URL.replace("sqlite:///", "")

# Module-level connection (set during init, closed on shutdown).
_connection: Optional[aiosqlite.Connection] = None


async def init_db() -> None:
    """Create the database file and the test_results table if they don't exist."""
    global _connection
    _connection = await aiosqlite.connect(_DB_PATH)
    _connection.row_factory = aiosqlite.Row
    await _connection.execute(
        """
        CREATE TABLE IF NOT EXISTS test_results (
            id                     TEXT PRIMARY KEY,
            test_id                TEXT NOT NULL,
            test_name              TEXT NOT NULL,
            category               TEXT NOT NULL,
            prompt_version         TEXT NOT NULL,
            input_text             TEXT NOT NULL,
            attack_objective       TEXT,
            expected_behavior      TEXT,
            model_output           TEXT,
            verdict                TEXT NOT NULL,
            evaluation_explanation TEXT,
            secret_disclosed       BOOLEAN DEFAULT FALSE,
            is_adversarial         BOOLEAN DEFAULT TRUE,
            severity               TEXT,
            execution_time_ms      INTEGER,
            created_at             TEXT NOT NULL,
            input_hash             TEXT
        )
        """
    )
    await _connection.commit()
    logger.info("Database initialized at %s", _DB_PATH)


async def close_db() -> None:
    """Close the database connection."""
    global _connection
    if _connection:
        await _connection.close()
        _connection = None
        logger.info("Database connection closed")


def _get_conn() -> aiosqlite.Connection:
    """Return the active connection; raise if not initialised."""
    if _connection is None:
        raise RuntimeError("Database not initialised — call init_db() first")
    return _connection


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def insert_result(result: dict[str, Any]) -> None:
    """Insert a single test result row."""
    conn = _get_conn()
    columns = ", ".join(result.keys())
    placeholders = ", ".join(["?"] * len(result))
    await conn.execute(
        f"INSERT INTO test_results ({columns}) VALUES ({placeholders})",
        list(result.values()),
    )
    await conn.commit()


async def get_results(
    *,
    prompt_version: Optional[str] = None,
    category: Optional[str] = None,
    verdict: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> list[dict[str, Any]]:
    """Query test results with optional filters, pagination."""
    conn = _get_conn()
    clauses: list[str] = []
    params: list[Any] = []

    if prompt_version:
        clauses.append("prompt_version = ?")
        params.append(prompt_version)
    if category:
        clauses.append("category = ?")
        params.append(category)
    if verdict:
        clauses.append("verdict = ?")
        params.append(verdict)

    where = ""
    if clauses:
        where = "WHERE " + " AND ".join(clauses)

    query = f"SELECT * FROM test_results {where} ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cursor = await conn.execute(query, params)
    rows = await cursor.fetchall()
    return [dict(row) for row in rows]


async def get_result_by_id(result_id: str) -> Optional[dict[str, Any]]:
    """Get a single result by its UUID."""
    conn = _get_conn()
    cursor = await conn.execute(
        "SELECT * FROM test_results WHERE id = ?", [result_id]
    )
    row = await cursor.fetchone()
    return dict(row) if row else None


async def get_all_results() -> list[dict[str, Any]]:
    """Return every result in the database (used by metrics)."""
    conn = _get_conn()
    cursor = await conn.execute(
        "SELECT * FROM test_results ORDER BY created_at DESC"
    )
    rows = await cursor.fetchall()
    return [dict(row) for row in rows]
