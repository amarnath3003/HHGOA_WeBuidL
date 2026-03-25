from __future__ import annotations

import argparse
from collections import defaultdict, deque
from datetime import datetime, timezone
import json
import logging
import os
import threading
import time
from typing import Any
import uuid

from fastapi import FastAPI, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field
import uvicorn

try:
    from .data_processing import build_score_payload, get_chain_readiness, get_supported_chains
except ImportError:
    from data_processing import build_score_payload, get_chain_readiness, get_supported_chains


LOG_LEVEL = os.getenv("ETHERSCORE_LOG_LEVEL", "INFO").upper()
RATE_LIMIT_PER_MINUTE = int(os.getenv("ETHERSCORE_RATE_LIMIT_PER_MINUTE", "60"))
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("ETHERSCORE_RATE_LIMIT_WINDOW_SECONDS", "60"))

logging.basicConfig(level=LOG_LEVEL, format="%(message)s")
logger = logging.getLogger("etherscore.backend")


def _log_event(event: str, **fields: Any) -> None:
    payload = {
        "event": event,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **fields,
    }
    logger.info(json.dumps(payload, default=str))


class ErrorResponse(BaseModel):
    error_code: str
    message: str
    request_id: str
    details: dict[str, Any] | None = None


class ScoreRequest(BaseModel):
    address: str = Field(..., min_length=1)
    chains: list[str] | None = None


class ScoreMeta(BaseModel):
    request_id: str
    chains_requested: list[str]
    chains_used: list[str]
    warnings: list[str]
    cache_hit: bool
    latency_ms: float


class ScoreResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    address: str
    score: int
    score_band: str
    trust_level: str
    risk_regime: str
    average_score: int
    peer_delta: int
    percentile: int
    generated_at: str
    summary: dict[str, Any]
    factors: list[dict[str, Any]]
    featured_collections: list[dict[str, Any]]
    meta: ScoreMeta


class HealthResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    service: str
    status: str
    generated_at: str


class ChainsResponse(BaseModel):
    supported: list[str]
    chains: dict[str, dict[str, Any]]


class InMemoryRateLimiter:
    def __init__(self, max_requests: int, window_seconds: int) -> None:
        self._max_requests = max_requests
        self._window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def check(self, key: str) -> tuple[bool, int]:
        now = time.time()
        with self._lock:
            bucket = self._hits[key]
            while bucket and (now - bucket[0]) > self._window_seconds:
                bucket.popleft()

            if len(bucket) >= self._max_requests:
                retry_after = int(self._window_seconds - (now - bucket[0])) + 1
                return False, max(retry_after, 1)

            bucket.append(now)
            return True, 0

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


def _load_cors_origins() -> list[str]:
    raw_origins = os.getenv(
        "ETHERSCORE_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000",
    ).strip()
    if not raw_origins:
        return []

    if raw_origins == "*":
        return ["*"]

    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


def _request_id(request: Request) -> str:
    return str(getattr(request.state, "request_id", "unknown"))


def _error_response(
    request: Request,
    *,
    status_code: int,
    error_code: str,
    message: str,
    details: dict[str, Any] | None = None,
) -> JSONResponse:
    payload = {
        "error_code": error_code,
        "message": message,
        "request_id": _request_id(request),
    }
    if details:
        payload["details"] = details
    return JSONResponse(status_code=status_code, content=payload)


def _parse_chain_query(chains: str | None) -> list[str] | None:
    if chains is None:
        return None
    parsed = [chain.strip() for chain in chains.split(",") if chain.strip()]
    return parsed or None


rate_limiter = InMemoryRateLimiter(RATE_LIMIT_PER_MINUTE, RATE_LIMIT_WINDOW_SECONDS)

app = FastAPI(
    title="EtherScore Backend API",
    version="2.0.0",
    description="Production-grade multi-chain scoring backend for EtherScore.",
)

cors_origins = _load_cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True if cors_origins and cors_origins != ["*"] else False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_context_middleware(request: Request, call_next):
    request.state.request_id = uuid.uuid4().hex
    started_at = time.perf_counter()

    if request.url.path.startswith("/api/score") and request.method != "OPTIONS":
        client_ip = request.client.host if request.client else "unknown"
        allowed, retry_after = rate_limiter.check(client_ip)
        if not allowed:
            response = _error_response(
                request,
                status_code=429,
                error_code="rate_limit_exceeded",
                message="Rate limit exceeded. Please retry later.",
                details={"retry_after_seconds": retry_after},
            )
            response.headers["Retry-After"] = str(retry_after)
            response.headers["X-Request-ID"] = _request_id(request)
            return response

    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - started_at) * 1000
    response.headers["X-Request-ID"] = _request_id(request)
    response.headers["X-Process-Time-Ms"] = f"{elapsed_ms:.2f}"
    return response


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(request: Request, exc: RequestValidationError):
    return _error_response(
        request,
        status_code=400,
        error_code="invalid_request_body",
        message="Request body validation failed.",
        details={"errors": exc.errors()},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    _log_event(
        "unhandled_exception",
        request_id=_request_id(request),
        path=request.url.path,
        message=str(exc),
    )
    return _error_response(
        request,
        status_code=500,
        error_code="internal_server_error",
        message="Unexpected server error.",
    )


@app.get("/", include_in_schema=False)
@app.get("/api", include_in_schema=False)
def root() -> dict[str, Any]:
    return {
        "service": "EtherScore backend",
        "status": "ok",
        "version": "2.0.0",
        "docs": "/docs",
        "endpoints": {
            "health": "GET /api/health",
            "chains": "GET /api/chains",
            "score_post": "POST /api/score",
            "score_get": "GET /api/score/{wallet_address}",
        },
    }


@app.get(
    "/api/health",
    response_model=HealthResponse,
    responses={500: {"model": ErrorResponse}},
)
def health(
    request: Request,
    deep: bool = Query(default=False, description="When true, checks upstream chain RPC health."),
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "service": "EtherScore backend",
        "status": "ok",
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }

    if deep:
        chains = get_chain_readiness(deep=True)
        payload["chains"] = chains

        configured = [chain for chain, info in chains.items() if info.get("configured")]
        available = [chain for chain, info in chains.items() if info.get("available")]

        if not configured or len(available) < len(configured):
            payload["status"] = "degraded"

    return payload


@app.get(
    "/api/chains",
    response_model=ChainsResponse,
    responses={500: {"model": ErrorResponse}},
)
def chains(
    request: Request,
    deep: bool = Query(default=False, description="When true, validates upstream RPC reachability."),
) -> dict[str, Any]:
    return {
        "supported": get_supported_chains(),
        "chains": get_chain_readiness(deep=deep),
    }


def _score_response(
    request: Request,
    *,
    address: str,
    chains: list[str] | None,
    route: str,
    method: str,
) -> JSONResponse | dict[str, Any]:
    started_at = time.perf_counter()

    try:
        result = build_score_payload(address, chains=chains)
    except ValueError as exc:
        message = str(exc)
        if "Unsupported chain" in message:
            error_code = "unsupported_chain"
        elif "None of the requested chains are configured" in message:
            error_code = "chain_not_configured"
        elif "Wallet address" in message:
            error_code = "invalid_wallet_address"
        else:
            error_code = "invalid_request"
        return _error_response(
            request,
            status_code=400,
            error_code=error_code,
            message=message,
        )
    except RuntimeError as exc:
        return _error_response(
            request,
            status_code=502,
            error_code="upstream_unavailable",
            message=str(exc),
        )

    latency_ms = round((time.perf_counter() - started_at) * 1000, 2)
    payload = dict(result.payload)
    payload["meta"] = {
        "request_id": _request_id(request),
        "chains_requested": result.chains_requested,
        "chains_used": result.chains_used,
        "warnings": result.warnings,
        "cache_hit": result.cache_hit,
        "latency_ms": latency_ms,
    }

    _log_event(
        "score_request",
        request_id=_request_id(request),
        route=route,
        method=method,
        address=address.lower(),
        chains_requested=result.chains_requested,
        chains_used=result.chains_used,
        cache_hit=result.cache_hit,
        latency_ms=latency_ms,
        warnings=result.warnings,
    )
    return payload


@app.post(
    "/api/score",
    response_model=ScoreResponse,
    responses={
        400: {"model": ErrorResponse},
        429: {"model": ErrorResponse},
        502: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
def score_post(request: Request, payload: ScoreRequest):
    return _score_response(
        request,
        address=payload.address,
        chains=payload.chains,
        route="/api/score",
        method="POST",
    )


@app.get(
    "/api/score/{wallet_address}",
    response_model=ScoreResponse,
    responses={
        400: {"model": ErrorResponse},
        429: {"model": ErrorResponse},
        502: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
def score_get(
    request: Request,
    wallet_address: str,
    chains: str | None = Query(default=None, description="Comma-separated chains, e.g. ethereum,polygon"),
):
    return _score_response(
        request,
        address=wallet_address,
        chains=_parse_chain_query(chains),
        route="/api/score/{wallet_address}",
        method="GET",
    )


def run_server(host: str, port: int) -> None:
    _log_event("server_starting", host=host, port=port)
    uvicorn.run(app, host=host, port=port, log_level=LOG_LEVEL.lower())


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the EtherScore FastAPI backend.")
    parser.add_argument("--host", default=os.getenv("ETHERSCORE_HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=int(os.getenv("ETHERSCORE_PORT", "8000")))
    return parser.parse_args()


if __name__ == "__main__":
    arguments = parse_args()
    run_server(arguments.host, arguments.port)
