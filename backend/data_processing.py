from __future__ import annotations

import csv
from copy import deepcopy
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import json
import os
from pathlib import Path
import re
import time
from typing import Any, Sequence
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional at import time
    load_dotenv = None  # type: ignore[assignment]

if load_dotenv is not None:
    load_dotenv(Path(__file__).resolve().parent / ".env")


ETH_ADDRESS_PATTERN = re.compile(r"^0x[a-fA-F0-9]{40}$")
RETRYABLE_STATUS_CODES = {408, 429, 500, 502, 503, 504}

REQUEST_TIMEOUT_SECONDS = float(os.getenv("ETHERSCORE_REQUEST_TIMEOUT_SECONDS", "10"))
UPSTREAM_RETRY_COUNT = int(os.getenv("ETHERSCORE_UPSTREAM_RETRY_COUNT", "1"))
PAYLOAD_CACHE_TTL_SECONDS = float(os.getenv("ETHERSCORE_CACHE_TTL_SECONDS", "120"))
PRICE_CACHE_TTL_SECONDS = float(os.getenv("ETHERSCORE_PRICE_CACHE_TTL_SECONDS", "900"))
HTTP_USER_AGENT = os.getenv("ETHERSCORE_HTTP_USER_AGENT", "EtherScoreBackend/3.0 (+local)")

ETH_PRICE_API_URL = os.getenv(
    "ETHERSCORE_ETH_PRICE_API_URL",
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,matic-network,binancecoin&vs_currencies=usd",
)
ENS_API_URL = os.getenv("ETHERSCORE_ENS_API_URL", "https://api.ensideas.com/ens/resolve")
ETHERSCAN_API_URL = os.getenv("ETHERSCORE_ETHERSCAN_API_URL", "https://api.etherscan.io/api")
DEFAULT_ETH_INFURA_RPC = "https://mainnet.infura.io/v3/84842078b09946638c03157f83405213"
DEFAULT_ETH_ALCHEMY_RPC = "https://eth-mainnet.g.alchemy.com/v2/demo"
DEFAULT_ETH_NFT_API = "https://eth-mainnet.g.alchemy.com/nft/v3/demo/getNFTsForOwner"
DEFAULT_ETH_EXPLORER_API = "https://eth.blockscout.com/api/v2"
DEFAULT_POLYGON_EXPLORER_API = "https://polygon.blockscout.com/api/v2"

try:
    EXPLORER_MAX_PAGES = max(1, int(os.getenv("ETHERSCORE_EXPLORER_MAX_PAGES", "60")))
except ValueError:
    EXPLORER_MAX_PAGES = 60

try:
    TREND_TARGET_POINTS = max(24, int(os.getenv("ETHERSCORE_TREND_TARGET_POINTS", "120")))
except ValueError:
    TREND_TARGET_POINTS = 120

try:
    EXPLORER_MAX_SECONDS = max(5.0, float(os.getenv("ETHERSCORE_EXPLORER_MAX_SECONDS", "20")))
except ValueError:
    EXPLORER_MAX_SECONDS = 20.0

try:
    EXPLORER_REQUEST_TIMEOUT_SECONDS = max(
        2.0, float(os.getenv("ETHERSCORE_EXPLORER_REQUEST_TIMEOUT_SECONDS", str(min(REQUEST_TIMEOUT_SECONDS, 8.0))))
    )
except ValueError:
    EXPLORER_REQUEST_TIMEOUT_SECONDS = min(REQUEST_TIMEOUT_SECONDS, 8.0)


class ExternalServiceError(RuntimeError):
    """Raised when an upstream blockchain/data provider fails."""


@dataclass(frozen=True)
class FactorDefinition:
    name: str
    weight: int
    impact: str
    icon: str
    color: str
    glow: str
    formatter: str


@dataclass(frozen=True)
class ChainSpec:
    name: str
    rpc_env_var: str
    native_symbol: str
    price_key: str
    usdt_contract: str
    usdt_decimals: int = 6
    legacy_rpc_env_var: str | None = None
    default_rpc_candidates: tuple[str, ...] = ()
    nft_env_var: str | None = None
    default_nft_endpoint: str | None = None
    explorer_api_env_var: str | None = None
    default_explorer_api: str | None = None
    supports_ens: bool = False
    supports_etherscan_age: bool = False


@dataclass(frozen=True)
class ChainSnapshot:
    chain: str
    rpc_source: str
    native_symbol: str
    native_balance: float
    usdt_balance: float
    transaction_count: int
    nft_count: int
    token_diversity: int
    account_age_days: int | None
    ens_name: str | None
    collections: list[tuple[str, int]]


@dataclass(frozen=True)
class ChainHistoricalSeries:
    wallet_balance_usd_points: list[tuple[datetime, float]]
    transaction_points: list[tuple[datetime, float]]
    nft_points: list[tuple[datetime, float]]
    token_diversity_points: list[tuple[datetime, float]]
    first_activity_at: datetime | None
    source: str | None
    warnings: list[str]


@dataclass
class ScoreBuildResult:
    payload: dict[str, Any]
    cache_hit: bool
    chains_requested: list[str]
    chains_used: list[str]
    warnings: list[str]


MODEL_FEATURE_COLUMNS: tuple[str, ...] = (
    "wallet_balance_usd",
    "transaction_count",
    "nft_ownership_volume",
    "account_age_days",
    "token_diversity",
)
MODEL_TARGET_COLUMN = "credit_score"
MODEL_PRIOR_WEIGHTS: dict[str, float] = {
    "wallet_balance_usd": 0.40,
    "transaction_count": 0.20,
    "nft_ownership_volume": 0.15,
    "account_age_days": 0.15,
    "token_diversity": 0.10,
}
@dataclass(frozen=True)
class WeightedCreditModel:
    weights: dict[str, float]
    min_max_stats: dict[str, tuple[float, float]]
    scale: float
    intercept: float
    average_score: int
    reference_scores: tuple[float, ...]


FACTOR_DEFINITIONS: tuple[FactorDefinition, ...] = (
    FactorDefinition(
        name="Wallet Balance",
        weight=30,
        impact="Primary driver",
        icon="account_balance_wallet",
        color="#a6e6ff",
        glow="rgba(166, 230, 255, 0.4)",
        formatter="currency",
    ),
    FactorDefinition(
        name="Transaction History",
        weight=25,
        impact="Behavioral consistency",
        icon="history",
        color="#b1c5ff",
        glow="rgba(177, 197, 255, 0.4)",
        formatter="integer",
    ),
    FactorDefinition(
        name="NFT Holdings",
        weight=20,
        impact="Asset credibility",
        icon="token",
        color="#cdbdff",
        glow="rgba(205, 189, 255, 0.4)",
        formatter="integer",
    ),
    FactorDefinition(
        name="Account Age",
        weight=15,
        impact="Longevity signal",
        icon="hourglass_empty",
        color="#14d1ff",
        glow="rgba(20, 209, 255, 0.4)",
        formatter="days",
    ),
    FactorDefinition(
        name="Network Diversity",
        weight=10,
        impact="Cross-chain resilience",
        icon="lan",
        color="#7f72ff",
        glow="rgba(127, 114, 255, 0.4)",
        formatter="integer",
    ),
)


CHAIN_SPECS: dict[str, ChainSpec] = {
    "ethereum": ChainSpec(
        name="ethereum",
        rpc_env_var="ETHERSCORE_RPC_URL_ETHEREUM",
        native_symbol="ETH",
        price_key="ethereum",
        usdt_contract="0xdAC17F958D2ee523a2206206994597C13D831ec7",
        legacy_rpc_env_var="ETHERSCORE_RPC_URL",
        default_rpc_candidates=(DEFAULT_ETH_ALCHEMY_RPC, DEFAULT_ETH_INFURA_RPC),
        nft_env_var="ETHERSCORE_NFT_API_URL_ETHEREUM",
        default_nft_endpoint=DEFAULT_ETH_NFT_API,
        explorer_api_env_var="ETHERSCORE_EXPLORER_API_URL_ETHEREUM",
        default_explorer_api=DEFAULT_ETH_EXPLORER_API,
        supports_ens=True,
        supports_etherscan_age=True,
    ),
    "polygon": ChainSpec(
        name="polygon",
        rpc_env_var="ETHERSCORE_RPC_URL_POLYGON",
        native_symbol="MATIC",
        price_key="matic-network",
        usdt_contract="0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
        nft_env_var="ETHERSCORE_NFT_API_URL_POLYGON",
        explorer_api_env_var="ETHERSCORE_EXPLORER_API_URL_POLYGON",
        default_explorer_api=DEFAULT_POLYGON_EXPLORER_API,
    ),
    "bsc": ChainSpec(
        name="bsc",
        rpc_env_var="ETHERSCORE_RPC_URL_BSC",
        native_symbol="BNB",
        price_key="binancecoin",
        usdt_contract="0x55d398326f99059fF775485246999027B3197955",
        nft_env_var="ETHERSCORE_NFT_API_URL_BSC",
        explorer_api_env_var="ETHERSCORE_EXPLORER_API_URL_BSC",
    ),
    "arbitrum": ChainSpec(
        name="arbitrum",
        rpc_env_var="ETHERSCORE_RPC_URL_ARBITRUM",
        native_symbol="ETH",
        price_key="ethereum",
        usdt_contract="0xFd086bC7CD5C481DCC9C85ebe478A1C0b69FCbb9",
        nft_env_var="ETHERSCORE_NFT_API_URL_ARBITRUM",
        explorer_api_env_var="ETHERSCORE_EXPLORER_API_URL_ARBITRUM",
        default_explorer_api="https://arbitrum.blockscout.com/api/v2",
    ),
}

_payload_cache: dict[str, tuple[float, ScoreBuildResult]] = {}
_price_cache: tuple[datetime, dict[str, float]] | None = None
_credit_model: WeightedCreditModel | None = None


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(value, maximum))


def _safe_int(value: Any, default: int = 0) -> int:
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return default
        try:
            if text.startswith("0x"):
                return int(text, 16)
            if "." in text:
                return int(float(text))
            return int(text)
        except ValueError:
            return default
    return default


def _safe_float(value: Any, default: float = 0.0) -> float:
    if isinstance(value, bool):
        return float(value)
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return default
        try:
            return float(text)
        except ValueError:
            return default
    return default


def _model_dataset_path() -> Path:
    configured = os.getenv("ETHERSCORE_CREDIT_MODEL_DATASET_PATH", "").strip()
    if configured:
        candidate = Path(configured).expanduser()
        if candidate.is_absolute():
            return candidate

        # Prefer paths resolved from repository root/cwd when explicitly configured,
        # then fall back to module-relative resolution.
        cwd_candidate = (Path.cwd() / candidate).resolve()
        if cwd_candidate.exists():
            return cwd_candidate

        return (Path(__file__).resolve().parent / candidate).resolve()

    return Path(__file__).resolve().parent / "credit_scoring_dataset.csv"


def _normalize_model_feature(value: float, min_val: float, max_val: float) -> float:
    spread = max_val - min_val
    if spread <= 1e-9:
        return 0.0
    norm = (value - min_val) / spread
    return _clamp(norm, 0.0, 1.0)


def _weighted_model_index(
    wallet_features: dict[str, float],
    weights: dict[str, float],
    min_max_stats: dict[str, tuple[float, float]],
) -> float:
    return sum(
        weights[column] * _normalize_model_feature(wallet_features[column], min_max_stats[column][0], min_max_stats[column][1])
        for column in MODEL_FEATURE_COLUMNS
    )


def _feature_min_max(rows: list[dict[str, float]]) -> dict[str, tuple[float, float]]:
    stats: dict[str, tuple[float, float]] = {}
    for column in MODEL_FEATURE_COLUMNS:
        values = [row[column] for row in rows]
        stats[column] = (min(values), max(values))
    return stats


def _train_weighted_credit_model(rows: list[dict[str, float]]) -> WeightedCreditModel:
    min_max_stats = _feature_min_max(rows)
    x = [_weighted_model_index(row, MODEL_PRIOR_WEIGHTS, min_max_stats) for row in rows]
    y = [row[MODEL_TARGET_COLUMN] for row in rows]

    mean_x = sum(x) / len(x)
    mean_y = sum(y) / len(y)
    var_x = sum((value - mean_x) ** 2 for value in x)
    cov_xy = sum((x_value - mean_x) * (y_value - mean_y) for x_value, y_value in zip(x, y))

    scale = cov_xy / var_x if var_x > 1e-12 else 0.0
    intercept = mean_y - (scale * mean_x)

    return WeightedCreditModel(
        weights=dict(MODEL_PRIOR_WEIGHTS),
        min_max_stats=min_max_stats,
        scale=scale,
        intercept=intercept,
        average_score=int(round(mean_y)),
        reference_scores=tuple(sorted(y)),
    )


def _load_model_rows(dataset_path: Path) -> list[dict[str, float]]:
    if not dataset_path.exists():
        return []

    rows: list[dict[str, float]] = []
    with dataset_path.open("r", newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for csv_row in reader:
            if not csv_row:
                continue

            parsed_row = {
                "wallet_balance_usd": _safe_float(csv_row.get("wallet_balance_usd"), default=0.0),
                "transaction_count": _safe_float(csv_row.get("transaction_count"), default=0.0),
                "nft_ownership_volume": _safe_float(csv_row.get("nft_ownership_volume"), default=0.0),
                "account_age_days": _safe_float(csv_row.get("account_age_days"), default=0.0),
                "token_diversity": _safe_float(csv_row.get("token_diversity"), default=0.0),
                "credit_score": _safe_float(csv_row.get("credit_score"), default=0.0),
            }

            if any(parsed_row[column] < 0 for column in MODEL_FEATURE_COLUMNS):
                continue
            if parsed_row[MODEL_TARGET_COLUMN] <= 0:
                continue

            rows.append(parsed_row)

    return rows


def _get_credit_model() -> WeightedCreditModel:
    global _credit_model
    if _credit_model is not None:
        return _credit_model

    dataset_path = _model_dataset_path()
    rows = _load_model_rows(dataset_path)
    if not rows:
        raise ExternalServiceError(
            f"Credit model dataset is missing or invalid at '{dataset_path}'. "
            "Set ETHERSCORE_CREDIT_MODEL_DATASET_PATH to a valid CSV."
        )
    _credit_model = _train_weighted_credit_model(rows)
    return _credit_model


def _predict_credit_score(wallet_features: dict[str, float], model: WeightedCreditModel) -> int:
    weighted_index = _weighted_model_index(wallet_features, model.weights, model.min_max_stats)
    raw_score = model.intercept + (model.scale * weighted_index)
    return int(round(_clamp(raw_score, 300.0, 850.0)))


def _source_name(endpoint: str) -> str:
    if not endpoint:
        return "not configured"
    parsed = urlparse(endpoint)
    return parsed.netloc or endpoint


def _request_json(
    url: str,
    *,
    method: str = "GET",
    payload: dict[str, Any] | None = None,
    retries: int | None = None,
    timeout_seconds: float | None = None,
) -> dict[str, Any]:
    retry_count = UPSTREAM_RETRY_COUNT if retries is None else max(retries, 0)
    timeout = REQUEST_TIMEOUT_SECONDS if timeout_seconds is None else timeout_seconds
    request_body = None
    headers = {"Accept": "application/json", "User-Agent": HTTP_USER_AGENT}

    if payload is not None:
        request_body = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    request = Request(url=url, data=request_body, headers=headers, method=method)

    for attempt in range(retry_count + 1):
        try:
            with urlopen(request, timeout=timeout) as response:
                raw_content = response.read().decode("utf-8", errors="replace")
            if not raw_content.strip():
                return {}
            parsed = json.loads(raw_content)
            if not isinstance(parsed, dict):
                raise ExternalServiceError(f"{url} returned an unexpected payload type.")
            return parsed
        except HTTPError as exc:
            error_text = exc.read().decode("utf-8", errors="replace")
            if attempt < retry_count and exc.code in RETRYABLE_STATUS_CODES:
                time.sleep(0.25 * (attempt + 1))
                continue
            raise ExternalServiceError(
                f"{url} returned HTTP {exc.code}. {error_text[:180]}"
            ) from exc
        except URLError as exc:
            if attempt < retry_count:
                time.sleep(0.25 * (attempt + 1))
                continue
            raise ExternalServiceError(f"Failed to reach {url}: {exc.reason}") from exc
        except json.JSONDecodeError as exc:
            raise ExternalServiceError(f"{url} returned invalid JSON.") from exc

    raise ExternalServiceError(f"Failed to call {url}.")


def _to_iso_datetime(value: str) -> datetime | None:
    if not value:
        return None

    text = value.strip()
    if not text:
        return None

    try:
        if text.endswith("Z"):
            return datetime.fromisoformat(text.replace("Z", "+00:00"))
        parsed = datetime.fromisoformat(text)
        return parsed if parsed.tzinfo is not None else parsed.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


class EthereumRpcClient:
    def __init__(self, rpc_url: str) -> None:
        self._rpc_url = rpc_url
        self._request_id = 0

    def _call(self, method: str, params: list[Any], retries: int | None = None) -> Any:
        self._request_id += 1
        response = _request_json(
            self._rpc_url,
            method="POST",
            payload={
                "jsonrpc": "2.0",
                "id": self._request_id,
                "method": method,
                "params": params,
            },
            retries=retries,
        )

        if "error" in response:
            error = response.get("error", {})
            code = error.get("code", "unknown")
            message = error.get("message", "unknown RPC error")
            raise ExternalServiceError(f"RPC method '{method}' failed ({code}): {message}")

        if "result" not in response:
            raise ExternalServiceError(f"RPC method '{method}' returned no result.")

        return response["result"]

    def get_block_number(self) -> int:
        result = self._call("eth_blockNumber", [], retries=0)
        return _safe_int(result)

    def get_native_balance(self, address: str) -> float:
        result = self._call("eth_getBalance", [address, "latest"])
        return _safe_int(result) / (10**18)

    def get_transaction_count(self, address: str) -> int:
        result = self._call("eth_getTransactionCount", [address, "latest"])
        return _safe_int(result)

    def get_erc20_balance(self, token_contract: str, address: str, decimals: int) -> float:
        padded_address = address[2:].rjust(64, "0")
        calldata = f"0x70a08231{padded_address}"
        result = self._call(
            "eth_call",
            [{"to": token_contract, "data": calldata}, "latest"],
        )
        return _safe_int(result) / (10**decimals)

    def get_token_diversity(self, address: str, *, has_activity: bool) -> int:
        try:
            result = self._call("alchemy_getTokenBalances", [address, "DEFAULT_TOKENS"], retries=0)
        except ExternalServiceError:
            return 1 if has_activity else 0

        balances = result.get("tokenBalances", []) if isinstance(result, dict) else []
        diversity_count = 0
        for entry in balances:
            if not isinstance(entry, dict):
                continue
            if _safe_int(entry.get("tokenBalance", "0x0")) > 0:
                diversity_count += 1

        if diversity_count <= 0 and has_activity:
            return 1
        return diversity_count

    def _first_transfer_timestamp(self, address: str, *, outgoing: bool) -> datetime | None:
        transfer_query: dict[str, Any] = {
            "fromBlock": "0x0",
            "toBlock": "latest",
            "category": ["external", "erc20", "erc721", "erc1155"],
            "order": "asc",
            "withMetadata": True,
            "maxCount": "0x1",
        }
        transfer_query["fromAddress" if outgoing else "toAddress"] = address

        try:
            result = self._call("alchemy_getAssetTransfers", [transfer_query], retries=0)
        except ExternalServiceError:
            return None

        transfers = result.get("transfers", []) if isinstance(result, dict) else []
        if not transfers:
            return None

        transfer = transfers[0] if isinstance(transfers[0], dict) else {}
        metadata = transfer.get("metadata", {}) if isinstance(transfer.get("metadata"), dict) else {}
        timestamp = metadata.get("blockTimestamp")
        return _to_iso_datetime(timestamp) if isinstance(timestamp, str) else None

    def get_account_age_days(self, address: str) -> int | None:
        first_outgoing = self._first_transfer_timestamp(address, outgoing=True)
        first_incoming = self._first_transfer_timestamp(address, outgoing=False)
        candidates = [value for value in (first_outgoing, first_incoming) if value is not None]

        if not candidates:
            return None

        oldest = min(candidates)
        age_days = (datetime.now(timezone.utc) - oldest).days
        return max(age_days, 1)

def _rpc_candidates(spec: ChainSpec) -> list[str]:
    candidates: list[str] = []

    configured = os.getenv(spec.rpc_env_var, "").strip()
    if configured:
        candidates.append(configured)

    if spec.legacy_rpc_env_var:
        legacy_value = os.getenv(spec.legacy_rpc_env_var, "").strip()
        if legacy_value:
            candidates.append(legacy_value)

    for default_candidate in spec.default_rpc_candidates:
        if default_candidate:
            candidates.append(default_candidate)

    unique_candidates: list[str] = []
    for candidate in candidates:
        if candidate not in unique_candidates:
            unique_candidates.append(candidate)

    return unique_candidates


def _nft_endpoint_candidates(spec: ChainSpec) -> list[str]:
    candidates: list[str] = []

    if spec.nft_env_var:
        endpoint = os.getenv(spec.nft_env_var, "").strip()
        if endpoint:
            candidates.append(endpoint)

    if spec.name == "ethereum":
        legacy = os.getenv("ETHERSCORE_NFT_API_URL", "").strip()
        if legacy:
            candidates.append(legacy)
        if spec.default_nft_endpoint:
            candidates.append(spec.default_nft_endpoint)

    unique_candidates: list[str] = []
    for candidate in candidates:
        if candidate and candidate not in unique_candidates:
            unique_candidates.append(candidate)

    return unique_candidates


def _explorer_endpoint_candidates(spec: ChainSpec) -> list[str]:
    candidates: list[str] = []

    if spec.explorer_api_env_var:
        endpoint = os.getenv(spec.explorer_api_env_var, "").strip()
        if endpoint:
            candidates.append(endpoint)

    if spec.name == "ethereum":
        legacy = os.getenv("ETHERSCORE_EXPLORER_API_URL", "").strip()
        if legacy:
            candidates.append(legacy)

    if spec.default_explorer_api:
        candidates.append(spec.default_explorer_api)

    unique_candidates: list[str] = []
    for candidate in candidates:
        normalized = candidate.rstrip("/")
        if normalized and normalized not in unique_candidates:
            unique_candidates.append(normalized)

    return unique_candidates


def _extract_timestamp_from_item(item: dict[str, Any]) -> datetime | None:
    for key in ("block_timestamp", "timestamp", "inserted_at", "created_at", "updated_at"):
        value = item.get(key)
        if isinstance(value, str):
            parsed = _to_iso_datetime(value)
            if parsed is not None:
                return parsed
    return None


def _address_hash(value: Any) -> str | None:
    if isinstance(value, str):
        candidate = value.strip().lower()
        if candidate.startswith("0x") and len(candidate) == 42:
            return candidate
        return None

    if isinstance(value, dict):
        candidate = value.get("hash")
        if isinstance(candidate, str):
            normalized = candidate.strip().lower()
            if normalized.startswith("0x") and len(normalized) == 42:
                return normalized
    return None


def _coalesce_points(points: list[tuple[datetime, float]]) -> list[tuple[datetime, float]]:
    if not points:
        return []

    ordered = sorted(points, key=lambda entry: entry[0])
    compacted: list[tuple[datetime, float]] = []
    for timestamp, value in ordered:
        if compacted and compacted[-1][0] == timestamp:
            compacted[-1] = (timestamp, value)
            continue
        compacted.append((timestamp, value))
    return compacted


def _resample_points(points: list[tuple[datetime, float]], target_points: int = TREND_TARGET_POINTS) -> list[tuple[datetime, float]]:
    if not points:
        return []

    compacted = _coalesce_points(points)
    if len(compacted) <= target_points:
        return compacted

    if target_points <= 2:
        return [compacted[0], compacted[-1]]

    step = (len(compacted) - 1) / (target_points - 1)
    indices = [min(len(compacted) - 1, int(round(idx * step))) for idx in range(target_points)]
    sampled: list[tuple[datetime, float]] = []
    seen: set[int] = set()
    for index in indices:
        if index in seen:
            continue
        seen.add(index)
        sampled.append(compacted[index])

    if sampled[-1][0] != compacted[-1][0]:
        sampled.append(compacted[-1])

    return sampled


def _normalize_series_to_percent(
    points: list[tuple[datetime, float]],
    *,
    fallback_percent: float,
) -> list[float]:
    if not points:
        return []

    sampled = _resample_points(points)
    values = [float(value) for _, value in sampled]
    lower = min(values)
    upper = max(values)

    if abs(upper - lower) < 1e-9:
        fixed = _clamp(fallback_percent, 0.0, 100.0)
        return [round(fixed, 4) for _ in values]

    return [round(_clamp(((value - lower) / (upper - lower)) * 100.0, 0.0, 100.0), 4) for value in values]


def _build_explorer_url(base_endpoint: str, path: str, query: dict[str, Any] | None = None) -> str:
    root = base_endpoint.rstrip("/")
    suffix = path.lstrip("/")
    if not query:
        return f"{root}/{suffix}"

    filtered_query = {key: value for key, value in query.items() if value not in (None, "")}
    if not filtered_query:
        return f"{root}/{suffix}"

    return f"{root}/{suffix}?{urlencode(filtered_query)}"


def _fetch_explorer_paginated_items(
    base_endpoint: str,
    path: str,
    *,
    query: dict[str, Any] | None = None,
) -> tuple[list[dict[str, Any]], bool]:
    items: list[dict[str, Any]] = []
    next_page_params: dict[str, Any] | None = None
    reached_limit = False
    started_at = time.monotonic()

    for _ in range(EXPLORER_MAX_PAGES):
        if (time.monotonic() - started_at) > EXPLORER_MAX_SECONDS:
            reached_limit = True
            break

        merged_query: dict[str, Any] = {}
        if query:
            merged_query.update(query)
        if next_page_params:
            merged_query.update(next_page_params)

        url = _build_explorer_url(base_endpoint, path, merged_query)
        payload = _request_json(
            url,
            retries=0,
            timeout_seconds=EXPLORER_REQUEST_TIMEOUT_SECONDS,
        )
        page_items = payload.get("items", [])
        if not isinstance(page_items, list) or not page_items:
            break

        for entry in page_items:
            if isinstance(entry, dict):
                items.append(entry)

        candidate = payload.get("next_page_params")
        if not isinstance(candidate, dict) or not candidate:
            break
        next_page_params = candidate
    else:
        reached_limit = True

    return items, reached_limit


def _build_cumulative_series_from_timestamps(
    timestamps: list[datetime],
) -> list[tuple[datetime, float]]:
    if not timestamps:
        return []

    buckets: dict[datetime, int] = {}
    for timestamp in timestamps:
        buckets[timestamp] = buckets.get(timestamp, 0) + 1

    running_total = 0.0
    points: list[tuple[datetime, float]] = []
    for timestamp in sorted(buckets.keys()):
        running_total += buckets[timestamp]
        points.append((timestamp, running_total))
    return points


def _align_series_final_value(
    points: list[tuple[datetime, float]],
    *,
    target_value: float,
    now: datetime,
) -> list[tuple[datetime, float]]:
    if not points:
        if target_value > 0:
            return [(now, target_value)]
        return []

    adjustment = target_value - points[-1][1]
    if abs(adjustment) < 1e-9:
        return points

    adjusted = [(timestamp, max(0.0, value + adjustment)) for timestamp, value in points]
    return adjusted


def _quantity_from_transfer(item: dict[str, Any], token_type: str) -> float:
    normalized_type = token_type.upper()
    if normalized_type == "ERC-721":
        return 1.0

    total = item.get("total")
    if isinstance(total, dict):
        decimals = max(_safe_int(total.get("decimals"), default=0), 0)
        raw_value = _safe_int(total.get("value"), default=0)
        if raw_value > 0:
            divisor = 10**decimals if decimals > 0 else 1
            return max(raw_value / divisor, 1.0)

    return 1.0

def _fetch_first_transaction_age_days_from_etherscan(address: str) -> int | None:
    api_key = os.getenv("ETHERSCORE_ETHERSCAN_API_KEY", "").strip()
    if not api_key:
        return None

    query = urlencode(
        {
            "module": "account",
            "action": "txlist",
            "address": address,
            "startblock": 0,
            "endblock": 99999999,
            "page": 1,
            "offset": 1,
            "sort": "asc",
            "apikey": api_key,
        }
    )

    try:
        payload = _request_json(f"{ETHERSCAN_API_URL}?{query}", retries=0)
    except ExternalServiceError:
        return None

    results = payload.get("result")
    if not isinstance(results, list) or not results:
        return None

    first_tx = results[0] if isinstance(results[0], dict) else {}
    timestamp = _safe_int(first_tx.get("timeStamp"))
    if timestamp <= 0:
        return None

    first_tx_datetime = datetime.fromtimestamp(timestamp, tz=timezone.utc)
    age_days = (datetime.now(timezone.utc) - first_tx_datetime).days
    return max(age_days, 1)


def _fetch_nft_snapshot(address: str, spec: ChainSpec) -> tuple[int, list[tuple[str, int]]]:
    endpoints = _nft_endpoint_candidates(spec)
    if not endpoints:
        return 0, []

    last_error: ExternalServiceError | None = None
    for endpoint in endpoints:
        query = urlencode({"owner": address, "withMetadata": "false", "pageSize": "100"})
        url = f"{endpoint}?{query}"
        try:
            payload = _request_json(url, retries=0)
        except ExternalServiceError as exc:
            last_error = exc
            continue

        total_count = _safe_int(payload.get("totalCount"), default=0)
        owned_nfts = payload.get("ownedNfts", [])
        if not isinstance(owned_nfts, list):
            owned_nfts = []

        collection_counts: dict[str, int] = {}
        for nft in owned_nfts:
            if not isinstance(nft, dict):
                continue
            contract = nft.get("contract", {}) if isinstance(nft.get("contract"), dict) else {}
            collection_name = str(
                contract.get("name")
                or contract.get("symbol")
                or contract.get("address")
                or "Unknown Collection"
            ).strip()
            if not collection_name:
                collection_name = "Unknown Collection"
            nft_balance = _safe_int(nft.get("balance"), default=1)
            collection_counts[collection_name] = collection_counts.get(collection_name, 0) + max(nft_balance, 1)

        if total_count <= 0:
            total_count = sum(collection_counts.values())

        ranked = sorted(collection_counts.items(), key=lambda item: item[1], reverse=True)
        return total_count, ranked[:3]

    return 0, []


def _fetch_ens_name(address: str) -> str | None:
    if not ENS_API_URL.strip():
        return None

    endpoint = f"{ENS_API_URL.rstrip('/')}/{address}"
    try:
        payload = _request_json(endpoint, retries=0)
    except ExternalServiceError:
        return None

    for key in ("name", "ens", "displayName"):
        value = payload.get(key)
        if isinstance(value, str):
            candidate = value.strip()
            if candidate and candidate.lower() != "null":
                return candidate

    return None


def _get_native_prices_usd(required_chains: Sequence[str] | None = None) -> dict[str, float]:
    global _price_cache
    now = datetime.now(timezone.utc)
    required = list(required_chains) if required_chains else list(CHAIN_SPECS.keys())

    if _price_cache is not None:
        cached_at, cached_prices = _price_cache
        if (now - cached_at).total_seconds() < PRICE_CACHE_TTL_SECONDS and all(
            _safe_float(cached_prices.get(chain), default=0.0) > 0.0 for chain in required
        ):
            return dict(cached_prices)

    prices: dict[str, float] = {}
    try:
        payload = _request_json(ETH_PRICE_API_URL, retries=0)
        for chain_name, spec in CHAIN_SPECS.items():
            raw_price = payload.get(spec.price_key, {}).get("usd") if isinstance(payload.get(spec.price_key), dict) else None
            parsed_price = _safe_float(raw_price, default=0.0)
            if parsed_price > 0:
                prices[chain_name] = parsed_price

        missing = [chain for chain in required if _safe_float(prices.get(chain), default=0.0) <= 0.0]
        if missing:
            raise ExternalServiceError(
                "Price feed missing/invalid USD values for chains: "
                + ", ".join(missing)
                + f" from {ETH_PRICE_API_URL}."
            )
    except ExternalServiceError:
        raise
    except Exception as exc:
        raise ExternalServiceError(f"Failed to fetch USD prices from {ETH_PRICE_API_URL}.") from exc

    _price_cache = (now, dict(prices))
    return prices


def _format_currency(value: float) -> str:
    return f"${value:,.2f}"


def _format_days(days: int | None) -> str:
    if days is None:
        return "Unknown"
    years, rem_days = divmod(days, 365)
    if years == 0:
        return f"{rem_days} days"
    return f"{years}y {rem_days}d"


def _score_band(score: int) -> str:
    if score >= 800:
        return "Exceptional"
    if score >= 740:
        return "Very Good"
    if score >= 670:
        return "Good"
    if score >= 580:
        return "Fair"
    return "Needs Work"


def _trust_level(score: int) -> str:
    if score >= 770:
        return "High"
    if score >= 680:
        return "Elevated"
    if score >= 600:
        return "Moderate"
    return "Low"


def _risk_regime(score: int, volatility_index: float) -> str:
    if score >= 720 and volatility_index <= 8.0:
        return "Stable"
    if score >= 620 and volatility_index <= 12.0:
        return "Balanced"
    return "Watchlist"


def _percentile_from_reference(score: int, reference_scores: Sequence[float]) -> int:
    if not reference_scores:
        return int(round(_clamp((score - 300) / 550.0, 0.01, 0.99) * 100))

    below_or_equal = sum(1 for reference in reference_scores if reference <= score)
    percentile = (below_or_equal / len(reference_scores)) * 100.0
    return int(round(_clamp(percentile, 1.0, 99.0)))


def _factor_rationale(factor_name: str, normalized_value: float) -> str:
    if normalized_value >= 0.85:
        level = "Strong"
    elif normalized_value >= 0.65:
        level = "Healthy"
    elif normalized_value >= 0.4:
        level = "Developing"
    else:
        level = "Weak"
    return f"{level} signal for {factor_name.lower()} relative to benchmark baselines."


def _format_factor_value(definition: FactorDefinition, raw_value: float, unknown_age: bool) -> str:
    if definition.name == "Account Age" and unknown_age:
        return "Unknown"
    if definition.formatter == "currency":
        return _format_currency(raw_value)
    if definition.formatter == "days":
        return _format_days(int(raw_value))
    return f"{int(round(raw_value)):,}"


def _resolve_requested_chains(chains: Sequence[str] | None) -> list[str]:
    if not chains:
        return ["ethereum"]

    normalized: list[str] = []
    for chain in chains:
        name = chain.strip().lower()
        if not name:
            continue
        if name not in CHAIN_SPECS:
            supported = ", ".join(CHAIN_SPECS.keys())
            raise ValueError(f"Unsupported chain '{name}'. Supported chains: {supported}.")
        if name not in normalized:
            normalized.append(name)

    if not normalized:
        return ["ethereum"]

    return normalized


def is_valid_wallet_address(address: str) -> bool:
    return bool(ETH_ADDRESS_PATTERN.fullmatch(address.strip()))


def _fetch_chain_snapshot(address: str, chain: str) -> ChainSnapshot:
    spec = CHAIN_SPECS[chain]
    candidates = _rpc_candidates(spec)
    if not candidates:
        raise ExternalServiceError(f"Chain '{chain}' has no configured RPC endpoint.")

    rpc_source = ""
    rpc_client: EthereumRpcClient | None = None
    native_balance = 0.0
    transaction_count = 0
    last_error: ExternalServiceError | None = None

    for endpoint in candidates:
        client = EthereumRpcClient(endpoint)
        try:
            native_balance = client.get_native_balance(address)
            transaction_count = client.get_transaction_count(address)
            rpc_client = client
            rpc_source = endpoint
            break
        except ExternalServiceError as exc:
            last_error = exc

    if rpc_client is None:
        raise ExternalServiceError(
            f"Chain '{chain}' RPC call failed for all configured providers."
        ) from last_error

    try:
        usdt_balance = rpc_client.get_erc20_balance(spec.usdt_contract, address, spec.usdt_decimals)
    except ExternalServiceError:
        usdt_balance = 0.0

    has_activity = bool(native_balance > 0 or usdt_balance > 0 or transaction_count > 0)
    token_diversity = rpc_client.get_token_diversity(address, has_activity=has_activity)

    account_age_days = rpc_client.get_account_age_days(address)
    if account_age_days is None and spec.supports_etherscan_age:
        account_age_days = _fetch_first_transaction_age_days_from_etherscan(address)

    nft_count, collections = _fetch_nft_snapshot(address, spec)
    ens_name = _fetch_ens_name(address) if spec.supports_ens else None

    return ChainSnapshot(
        chain=chain,
        rpc_source=rpc_source,
        native_symbol=spec.native_symbol,
        native_balance=native_balance,
        usdt_balance=usdt_balance,
        transaction_count=transaction_count,
        nft_count=nft_count,
        token_diversity=token_diversity,
        account_age_days=account_age_days,
        ens_name=ens_name,
        collections=collections,
    )


def _build_chain_historical_series(
    *,
    address: str,
    snapshot: ChainSnapshot,
    native_price_usd: float,
) -> ChainHistoricalSeries:
    spec = CHAIN_SPECS[snapshot.chain]
    endpoints = _explorer_endpoint_candidates(spec)
    if not endpoints:
        return ChainHistoricalSeries(
            wallet_balance_usd_points=[],
            transaction_points=[],
            nft_points=[],
            token_diversity_points=[],
            first_activity_at=None,
            source=None,
            warnings=[],
        )

    normalized_address = address.lower()
    now = datetime.now(timezone.utc)
    chain_warnings: list[str] = []
    source_used: str | None = None

    for endpoint in endpoints:
        endpoint_warnings: list[str] = []
        successful_calls = 0

        def _safe_fetch(
            path: str,
            *,
            query: dict[str, Any] | None = None,
            label: str,
        ) -> list[dict[str, Any]]:
            nonlocal successful_calls
            try:
                items, reached_limit = _fetch_explorer_paginated_items(endpoint, path, query=query)
                successful_calls += 1
                if reached_limit:
                    endpoint_warnings.append(
                        f"Explorer history limit reached for chain '{snapshot.chain}' while fetching {label}. "
                        f"Increase ETHERSCORE_EXPLORER_MAX_PAGES for deeper history."
                    )
                return items
            except ExternalServiceError as exc:
                endpoint_warnings.append(
                    f"Chain '{snapshot.chain}' explorer {label} fetch failed from {_source_name(endpoint)}: {exc}"
                )
                return []

        balance_items = _safe_fetch(
            f"addresses/{address}/coin-balance-history",
            label="coin-balance-history",
        )
        transaction_items = _safe_fetch(
            f"addresses/{address}/transactions",
            label="transactions",
        )
        nft_transfer_items = _safe_fetch(
            f"addresses/{address}/token-transfers",
            query={"type": "ERC-721,ERC-1155"},
            label="nft-transfers",
        )
        erc20_transfer_items = _safe_fetch(
            f"addresses/{address}/token-transfers",
            query={"type": "ERC-20"},
            label="erc20-transfers",
        )

        if successful_calls == 0:
            chain_warnings.extend(endpoint_warnings)
            continue

        source_used = _source_name(endpoint)

        wallet_balance_points: list[tuple[datetime, float]] = []
        for item in balance_items:
            timestamp = _extract_timestamp_from_item(item)
            if timestamp is None:
                continue
            native_balance = _safe_int(item.get("value"), default=0) / (10**18)
            wallet_balance_usd = max((native_balance * native_price_usd) + snapshot.usdt_balance, 0.0)
            wallet_balance_points.append((timestamp, wallet_balance_usd))
        wallet_balance_points = _coalesce_points(wallet_balance_points)

        transaction_timestamps: list[datetime] = []
        for item in transaction_items:
            timestamp = _extract_timestamp_from_item(item)
            if timestamp is not None:
                transaction_timestamps.append(timestamp)
        transaction_points = _build_cumulative_series_from_timestamps(transaction_timestamps)
        transaction_points = _align_series_final_value(
            transaction_points,
            target_value=float(snapshot.transaction_count),
            now=now,
        )

        nft_events: list[tuple[datetime, float]] = []
        for item in nft_transfer_items:
            timestamp = _extract_timestamp_from_item(item)
            if timestamp is None:
                continue

            token_type_raw = item.get("token_type")
            if not isinstance(token_type_raw, str):
                token = item.get("token")
                if isinstance(token, dict):
                    token_type_raw = token.get("type")
            token_type = str(token_type_raw or "").upper()
            if token_type not in {"ERC-721", "ERC-1155"}:
                continue

            from_hash = _address_hash(item.get("from"))
            to_hash = _address_hash(item.get("to"))
            quantity = _quantity_from_transfer(item, token_type)

            delta = 0.0
            if to_hash == normalized_address and from_hash != normalized_address:
                delta += quantity
            if from_hash == normalized_address and to_hash != normalized_address:
                delta -= quantity
            if abs(delta) > 0.0:
                nft_events.append((timestamp, delta))

        nft_points: list[tuple[datetime, float]] = []
        nft_running = 0.0
        for timestamp, delta in sorted(nft_events, key=lambda item: item[0]):
            nft_running = max(0.0, nft_running + delta)
            nft_points.append((timestamp, nft_running))
        nft_points = _align_series_final_value(
            _coalesce_points(nft_points),
            target_value=float(snapshot.nft_count),
            now=now,
        )

        token_events: list[tuple[datetime, str]] = []
        for item in erc20_transfer_items:
            timestamp = _extract_timestamp_from_item(item)
            if timestamp is None:
                continue

            token = item.get("token")
            if not isinstance(token, dict):
                continue
            address_hash = token.get("address_hash")
            if not isinstance(address_hash, str):
                continue

            normalized_token = address_hash.strip().lower()
            if not normalized_token.startswith("0x") or len(normalized_token) != 42:
                continue
            token_events.append((timestamp, normalized_token))

        token_diversity_points: list[tuple[datetime, float]] = []
        seen_tokens: set[str] = set()
        for timestamp, token_address in sorted(token_events, key=lambda item: item[0]):
            if token_address in seen_tokens:
                continue
            seen_tokens.add(token_address)
            token_diversity_points.append((timestamp, float(len(seen_tokens))))
        token_diversity_points = _align_series_final_value(
            _coalesce_points(token_diversity_points),
            target_value=float(snapshot.token_diversity),
            now=now,
        )

        first_activity_candidates: list[datetime] = []
        for series in (wallet_balance_points, transaction_points, nft_points, token_diversity_points):
            if series:
                first_activity_candidates.append(series[0][0])
        if snapshot.account_age_days is not None and snapshot.account_age_days > 0:
            first_activity_candidates.append(now - timedelta(days=snapshot.account_age_days))
        first_activity_at = min(first_activity_candidates) if first_activity_candidates else None

        chain_warnings.extend(endpoint_warnings)
        return ChainHistoricalSeries(
            wallet_balance_usd_points=wallet_balance_points,
            transaction_points=transaction_points,
            nft_points=nft_points,
            token_diversity_points=token_diversity_points,
            first_activity_at=first_activity_at,
            source=source_used,
            warnings=chain_warnings,
        )

    return ChainHistoricalSeries(
        wallet_balance_usd_points=[],
        transaction_points=[],
        nft_points=[],
        token_diversity_points=[],
        first_activity_at=None,
        source=source_used,
        warnings=chain_warnings,
    )


def _merge_chain_value_series(
    series_by_chain: dict[str, list[tuple[datetime, float]]],
    *,
    target_total: float,
    now: datetime,
) -> list[tuple[datetime, float]]:
    if not series_by_chain:
        return [(now, target_total)] if target_total > 0 else []

    current_by_chain = {chain_name: 0.0 for chain_name in series_by_chain}
    events: list[tuple[datetime, str, float]] = []
    for chain_name, series in series_by_chain.items():
        for timestamp, value in series:
            events.append((timestamp, chain_name, max(0.0, value)))

    if not events:
        return [(now, target_total)] if target_total > 0 else []

    events.sort(key=lambda entry: entry[0])
    merged: list[tuple[datetime, float]] = []
    for timestamp, chain_name, value in events:
        current_by_chain[chain_name] = value
        total = sum(current_by_chain.values())
        if merged and merged[-1][0] == timestamp:
            merged[-1] = (timestamp, total)
        else:
            merged.append((timestamp, total))

    merged = _align_series_final_value(_coalesce_points(merged), target_value=target_total, now=now)
    return merged


def _build_account_age_series(
    *,
    account_age_days: int,
    first_activity_at: datetime | None,
    now: datetime,
) -> list[tuple[datetime, float]]:
    if account_age_days <= 0:
        return []

    start = first_activity_at
    if start is None:
        start = now - timedelta(days=account_age_days)
    if start > now:
        start = now

    span_seconds = max((now - start).total_seconds(), 0.0)
    if span_seconds <= 0:
        return [(now, float(account_age_days))]

    point_count = min(TREND_TARGET_POINTS, max(24, int(account_age_days // 30) + 2))
    points: list[tuple[datetime, float]] = []
    for index in range(point_count):
        ratio = index / (point_count - 1) if point_count > 1 else 1.0
        timestamp = start + timedelta(seconds=span_seconds * ratio)
        points.append((timestamp, float(account_age_days) * ratio))

    points[-1] = (points[-1][0], float(account_age_days))
    return _coalesce_points(points)


def _compute_volatility_index(
    *,
    total_transactions: int,
    account_age_for_model: float,
    active_chain_count: int,
    token_diversity_total: int,
) -> float:
    activity_density = total_transactions / max(account_age_for_model, 30.0) * 30.0
    diversification_bonus = (active_chain_count * 1.2) + min(token_diversity_total, 20) * 0.1
    raw_index = 15.0 - min(activity_density / 3.0, 7.0) - diversification_bonus
    return round(_clamp(raw_index, 2.0, 18.0), 1)


def _build_featured_collections(snapshots: list[ChainSnapshot]) -> list[dict[str, Any]]:
    ranked_collections: list[tuple[str, str, int]] = []
    for snapshot in snapshots:
        for name, quantity in snapshot.collections:
            ranked_collections.append((snapshot.chain, name, quantity))

    ranked_collections.sort(key=lambda item: item[2], reverse=True)
    featured: list[dict[str, Any]] = []

    for chain_name, collection_name, quantity in ranked_collections[:10]:
        featured.append(
            {
                "name": collection_name,
                "chain": chain_name,
                "quantity": max(quantity, 1),
            }
        )

    return featured


def _get_cached_result(cache_key: str) -> ScoreBuildResult | None:
    cached = _payload_cache.get(cache_key)
    if cached is None:
        return None

    created_at, cached_result = cached
    if (time.time() - created_at) > PAYLOAD_CACHE_TTL_SECONDS:
        _payload_cache.pop(cache_key, None)
        return None

    cloned = deepcopy(cached_result)
    cloned.cache_hit = True
    return cloned


def _set_cached_result(cache_key: str, result: ScoreBuildResult) -> None:
    result_for_cache = deepcopy(result)
    result_for_cache.cache_hit = False
    _payload_cache[cache_key] = (time.time(), result_for_cache)


def _chain_breakdown_error(status: str, error_message: str) -> dict[str, Any]:
    return {
        "status": status,
        "error": error_message,
        "native_symbol": None,
        "native_balance": 0.0,
        "native_balance_display": None,
        "native_balance_usd": 0.0,
        "usdt_balance_usd": 0.0,
        "transaction_count": 0,
        "nft_count": 0,
        "token_diversity": 0,
        "account_age_days": None,
        "rpc_source": "not configured" if status == "unavailable" else "unreachable",
    }


def get_supported_chains() -> list[str]:
    return list(CHAIN_SPECS.keys())


def get_chain_readiness(*, deep: bool = False) -> dict[str, dict[str, Any]]:
    readiness: dict[str, dict[str, Any]] = {}
    for chain_name, spec in CHAIN_SPECS.items():
        candidates = _rpc_candidates(spec)
        chain_info: dict[str, Any] = {
            "configured": bool(candidates),
            "rpc_sources": [_source_name(candidate) for candidate in candidates],
        }

        if deep:
            if not candidates:
                chain_info["available"] = False
                chain_info["status"] = "unconfigured"
            else:
                last_error: str | None = None
                for candidate in candidates:
                    try:
                        block_number = EthereumRpcClient(candidate).get_block_number()
                        chain_info["available"] = True
                        chain_info["status"] = "ok"
                        chain_info["rpc_source"] = _source_name(candidate)
                        chain_info["latest_block"] = block_number
                        break
                    except ExternalServiceError as exc:
                        last_error = str(exc)
                        continue
                if "available" not in chain_info:
                    chain_info["available"] = False
                    chain_info["status"] = "failed"
                    chain_info["error"] = last_error

        readiness[chain_name] = chain_info

    return readiness


def build_score_payload(address: str, chains: Sequence[str] | None = None) -> ScoreBuildResult:
    cleaned_address = address.strip()
    if not is_valid_wallet_address(cleaned_address):
        raise ValueError("Wallet address must be a valid 42-character hex Ethereum address.")

    requested_chains = _resolve_requested_chains(chains)
    normalized_address = cleaned_address.lower()
    cache_key = f"{normalized_address}|{','.join(requested_chains)}"

    cached_result = _get_cached_result(cache_key)
    if cached_result is not None:
        return cached_result

    available_chains = [chain for chain in requested_chains if _rpc_candidates(CHAIN_SPECS[chain])]
    if not available_chains:
        missing = ", ".join(CHAIN_SPECS[chain].rpc_env_var for chain in requested_chains)
        raise ValueError(
            "None of the requested chains are configured. "
            f"Set at least one RPC endpoint via: {missing}."
        )

    warnings: list[str] = []
    snapshots: list[ChainSnapshot] = []
    chain_breakdown: dict[str, dict[str, Any]] = {}

    for chain in requested_chains:
        spec = CHAIN_SPECS[chain]
        if not _rpc_candidates(spec):
            warning = (
                f"Chain '{chain}' skipped because {spec.rpc_env_var} is not configured."
            )
            warnings.append(warning)
            chain_breakdown[chain] = _chain_breakdown_error("unavailable", warning)
            continue

        try:
            snapshot = _fetch_chain_snapshot(normalized_address, chain)
            snapshots.append(snapshot)
        except ExternalServiceError as exc:
            warning = f"Chain '{chain}' failed: {exc}"
            warnings.append(warning)
            chain_breakdown[chain] = _chain_breakdown_error("failed", warning)

    if not snapshots:
        raise RuntimeError(
            "Unable to fetch wallet metrics from requested chains. "
            "Check RPC configuration or upstream provider health."
        )

    price_map = _get_native_prices_usd(requested_chains)
    total_native_usd = 0.0
    total_usdt = 0.0
    total_transactions = 0
    total_nfts = 0
    total_token_diversity = 0
    account_age_candidates: list[int] = []
    ens_name: str | None = None

    for snapshot in snapshots:
        native_price = price_map.get(snapshot.chain)
        if native_price is None or native_price <= 0:
            raise RuntimeError(f"Missing native USD price for chain '{snapshot.chain}'.")
        native_usd = snapshot.native_balance * native_price

        chain_breakdown[snapshot.chain] = {
            "status": "ok",
            "error": None,
            "native_symbol": snapshot.native_symbol,
            "native_balance": round(snapshot.native_balance, 8),
            "native_balance_display": f"{snapshot.native_balance:.4f} {snapshot.native_symbol}",
            "native_balance_usd": round(native_usd, 2),
            "usdt_balance_usd": round(snapshot.usdt_balance, 2),
            "transaction_count": snapshot.transaction_count,
            "nft_count": snapshot.nft_count,
            "token_diversity": snapshot.token_diversity,
            "account_age_days": snapshot.account_age_days,
            "rpc_source": _source_name(snapshot.rpc_source),
        }

        total_native_usd += native_usd
        total_usdt += snapshot.usdt_balance
        total_transactions += snapshot.transaction_count
        total_nfts += snapshot.nft_count
        total_token_diversity += snapshot.token_diversity

        if snapshot.account_age_days is not None:
            account_age_candidates.append(snapshot.account_age_days)
        if ens_name is None and snapshot.ens_name:
            ens_name = snapshot.ens_name

    chains_used = [snapshot.chain for snapshot in snapshots]
    active_chain_count = len(
        [
            snapshot
            for snapshot in snapshots
            if snapshot.native_balance > 0
            or snapshot.usdt_balance > 0
            or snapshot.transaction_count > 0
            or snapshot.nft_count > 0
        ]
    )
    if active_chain_count == 0:
        active_chain_count = len(chains_used)

    now = datetime.now(timezone.utc)
    history_sources: set[str] = set()
    first_activity_candidates: list[datetime] = []
    wallet_history_by_chain: dict[str, list[tuple[datetime, float]]] = {}
    transaction_history_by_chain: dict[str, list[tuple[datetime, float]]] = {}
    nft_history_by_chain: dict[str, list[tuple[datetime, float]]] = {}
    token_diversity_history_by_chain: dict[str, list[tuple[datetime, float]]] = {}

    for snapshot in snapshots:
        native_price = _safe_float(price_map.get(snapshot.chain), default=0.0)
        if native_price <= 0.0:
            continue

        historical_series = _build_chain_historical_series(
            address=normalized_address,
            snapshot=snapshot,
            native_price_usd=native_price,
        )
        warnings.extend(historical_series.warnings)

        if historical_series.source:
            history_sources.add(historical_series.source)
        if historical_series.first_activity_at is not None:
            first_activity_candidates.append(historical_series.first_activity_at)
        if historical_series.wallet_balance_usd_points:
            wallet_history_by_chain[snapshot.chain] = historical_series.wallet_balance_usd_points
        if historical_series.transaction_points:
            transaction_history_by_chain[snapshot.chain] = historical_series.transaction_points
        if historical_series.nft_points:
            nft_history_by_chain[snapshot.chain] = historical_series.nft_points
        if historical_series.token_diversity_points:
            token_diversity_history_by_chain[snapshot.chain] = historical_series.token_diversity_points

    account_age_days = max(account_age_candidates) if account_age_candidates else None
    if first_activity_candidates:
        oldest_activity = min(first_activity_candidates)
        historical_age_days = max((now - oldest_activity).days, 1)
        if account_age_days is None or historical_age_days > account_age_days:
            account_age_days = historical_age_days
    if account_age_days is None:
        if total_transactions > 0:
            warnings.append(
                "Unable to derive account age from on-chain history providers. "
                "Using 0 days until full historical data is available."
            )
        account_age_days = 0

    account_age_for_model = float(account_age_days)
    total_assets_usd = total_native_usd + total_usdt
    model_features = {
        "wallet_balance_usd": float(total_assets_usd),
        "transaction_count": float(total_transactions),
        "nft_ownership_volume": float(total_nfts),
        "account_age_days": float(account_age_for_model),
        "token_diversity": float(total_token_diversity),
    }
    model = _get_credit_model()
    score = _predict_credit_score(model_features, model)

    normalized_factors = {
        "Wallet Balance": _normalize_model_feature(
            model_features["wallet_balance_usd"],
            model.min_max_stats["wallet_balance_usd"][0],
            model.min_max_stats["wallet_balance_usd"][1],
        ),
        "Transaction History": _normalize_model_feature(
            model_features["transaction_count"],
            model.min_max_stats["transaction_count"][0],
            model.min_max_stats["transaction_count"][1],
        ),
        "NFT Holdings": _normalize_model_feature(
            model_features["nft_ownership_volume"],
            model.min_max_stats["nft_ownership_volume"][0],
            model.min_max_stats["nft_ownership_volume"][1],
        ),
        "Account Age": _normalize_model_feature(
            model_features["account_age_days"],
            model.min_max_stats["account_age_days"][0],
            model.min_max_stats["account_age_days"][1],
        ),
        "Network Diversity": _normalize_model_feature(
            model_features["token_diversity"],
            model.min_max_stats["token_diversity"][0],
            model.min_max_stats["token_diversity"][1],
        ),
    }

    factor_raw_values = {
        "Wallet Balance": total_assets_usd,
        "Transaction History": float(total_transactions),
        "NFT Holdings": float(total_nfts),
        "Account Age": account_age_for_model,
        "Network Diversity": float(total_token_diversity),
    }

    overall_first_activity = min(first_activity_candidates) if first_activity_candidates else None
    wallet_history_points = _merge_chain_value_series(
        wallet_history_by_chain,
        target_total=float(total_assets_usd),
        now=now,
    )
    transaction_history_points = _merge_chain_value_series(
        transaction_history_by_chain,
        target_total=float(total_transactions),
        now=now,
    )
    nft_history_points = _merge_chain_value_series(
        nft_history_by_chain,
        target_total=float(total_nfts),
        now=now,
    )
    token_diversity_history_points = _merge_chain_value_series(
        token_diversity_history_by_chain,
        target_total=float(total_token_diversity),
        now=now,
    )
    account_age_history_points = _build_account_age_series(
        account_age_days=account_age_days,
        first_activity_at=overall_first_activity,
        now=now,
    )

    factor_trends = {
        "Wallet Balance": _normalize_series_to_percent(
            wallet_history_points,
            fallback_percent=normalized_factors["Wallet Balance"] * 100.0,
        ),
        "Transaction History": _normalize_series_to_percent(
            transaction_history_points,
            fallback_percent=normalized_factors["Transaction History"] * 100.0,
        ),
        "NFT Holdings": _normalize_series_to_percent(
            nft_history_points,
            fallback_percent=normalized_factors["NFT Holdings"] * 100.0,
        ),
        "Account Age": _normalize_series_to_percent(
            account_age_history_points,
            fallback_percent=normalized_factors["Account Age"] * 100.0,
        ),
        "Network Diversity": _normalize_series_to_percent(
            token_diversity_history_points,
            fallback_percent=normalized_factors["Network Diversity"] * 100.0,
        ),
    }

    factors: list[dict[str, Any]] = []
    for factor in FACTOR_DEFINITIONS:
        normalized_value = normalized_factors[factor.name]
        factor_score = int(round(normalized_value * 100))
        weighted_points = round((factor.weight / 100.0) * factor_score, 1)
        unknown_age = factor.name == "Account Age" and account_age_days <= 0 and total_transactions > 0

        factors.append(
            {
                "name": factor.name,
                "percentage": factor.weight,
                "impact": factor.impact,
                "icon": factor.icon,
                "color": factor.color,
                "glow": factor.glow,
                "value": _format_factor_value(factor, factor_raw_values[factor.name], unknown_age),
                "score": factor_score,
                "weighted_points": weighted_points,
                "trend": factor_trends.get(factor.name, []),
                "normalized_value": round(normalized_value, 4),
                "rationale": _factor_rationale(factor.name, normalized_value),
            }
        )

    volatility_index = _compute_volatility_index(
        total_transactions=total_transactions,
        account_age_for_model=account_age_for_model,
        active_chain_count=active_chain_count,
        token_diversity_total=total_token_diversity,
    )
    data_quality = "complete" if len(chains_used) == len(requested_chains) else "partial"
    nft_sources = sorted(
        {
            _source_name(endpoint)
            for chain in requested_chains
            for endpoint in _nft_endpoint_candidates(CHAIN_SPECS[chain])
        }
    )

    summary = {
        "usdt_balance_usd": round(total_usdt, 2),
        "usdt_balance_display": _format_currency(total_usdt),
        "total_assets_usd": round(total_assets_usd, 2),
        "total_assets_display": _format_currency(total_assets_usd),
        "ens_name": ens_name,
        "nft_count": total_nfts,
        "transaction_count": total_transactions,
        "account_age_days": account_age_days,
        "account_age_display": _format_days(account_age_days),
        "network_diversity": active_chain_count,
        "volatility_index": volatility_index,
        "chain_breakdown": chain_breakdown,
        "data_quality": data_quality,
        "data_sources": {
            "rpc": ", ".join(sorted({_source_name(snapshot.rpc_source) for snapshot in snapshots})),
            "nft_api": ", ".join(nft_sources) if nft_sources else "not configured",
            "ens_api": _source_name(ENS_API_URL),
            "explorer_api": ", ".join(sorted(history_sources)) if history_sources else "not configured",
        },
    }

    payload = {
        "address": normalized_address,
        "score": score,
        "score_band": _score_band(score),
        "trust_level": _trust_level(score),
        "risk_regime": _risk_regime(score, volatility_index),
        "average_score": model.average_score,
        "peer_delta": score - model.average_score,
        "percentile": _percentile_from_reference(score, model.reference_scores),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": summary,
        "factors": factors,
        "featured_collections": _build_featured_collections(snapshots),
    }

    result = ScoreBuildResult(
        payload=payload,
        cache_hit=False,
        chains_requested=requested_chains,
        chains_used=chains_used,
        warnings=warnings,
    )
    _set_cached_result(cache_key, result)
    return result
