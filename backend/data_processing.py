from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import hashlib
import json
import math
import os
import re
import time
from typing import Any, Sequence
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen


ETH_ADDRESS_PATTERN = re.compile(r"^0x[a-fA-F0-9]{40}$")
AVERAGE_SCORE = 720
COLLECTION_TIERS = ("Blue Chip", "Growth", "Emerging")
RETRYABLE_STATUS_CODES = {408, 429, 500, 502, 503, 504}

REQUEST_TIMEOUT_SECONDS = float(os.getenv("ETHERSCORE_REQUEST_TIMEOUT_SECONDS", "10"))
UPSTREAM_RETRY_COUNT = int(os.getenv("ETHERSCORE_UPSTREAM_RETRY_COUNT", "1"))
PAYLOAD_CACHE_TTL_SECONDS = float(os.getenv("ETHERSCORE_CACHE_TTL_SECONDS", "120"))
PRICE_CACHE_TTL_SECONDS = float(os.getenv("ETHERSCORE_PRICE_CACHE_TTL_SECONDS", "900"))
HTTP_USER_AGENT = os.getenv("ETHERSCORE_HTTP_USER_AGENT", "EtherScoreBackend/3.0 (+local)")

ETH_FALLBACK_PRICE_USD = float(os.getenv("ETHERSCORE_FALLBACK_ETH_USD", "3000"))
MATIC_FALLBACK_PRICE_USD = float(os.getenv("ETHERSCORE_FALLBACK_MATIC_USD", "0.9"))
BNB_FALLBACK_PRICE_USD = float(os.getenv("ETHERSCORE_FALLBACK_BNB_USD", "500"))
NFT_FALLBACK_FLOOR_USD = float(os.getenv("ETHERSCORE_FALLBACK_NFT_FLOOR_USD", "120"))

DEFAULT_ETH_INFURA_RPC = "https://mainnet.infura.io/v3/84842078b09946638c03157f83405213"
DEFAULT_ETH_ALCHEMY_RPC = "https://eth-mainnet.g.alchemy.com/v2/demo"
DEFAULT_ETH_NFT_API = "https://eth-mainnet.g.alchemy.com/nft/v3/demo/getNFTsForOwner"
ETH_PRICE_API_URL = os.getenv(
    "ETHERSCORE_ETH_PRICE_API_URL",
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,matic-network,binancecoin&vs_currencies=usd",
)
ENS_API_URL = os.getenv("ETHERSCORE_ENS_API_URL", "https://api.ensideas.com/ens/resolve")
ETHERSCAN_API_URL = os.getenv("ETHERSCORE_ETHERSCAN_API_URL", "https://api.etherscan.io/api")


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
    fallback_price_usd: float
    usdt_contract: str
    usdt_decimals: int = 6
    legacy_rpc_env_var: str | None = None
    default_rpc_candidates: tuple[str, ...] = ()
    nft_env_var: str | None = None
    default_nft_endpoint: str | None = None
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


@dataclass
class ScoreBuildResult:
    payload: dict[str, Any]
    cache_hit: bool
    chains_requested: list[str]
    chains_used: list[str]
    warnings: list[str]


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
        fallback_price_usd=ETH_FALLBACK_PRICE_USD,
        usdt_contract="0xdAC17F958D2ee523a2206206994597C13D831ec7",
        legacy_rpc_env_var="ETHERSCORE_RPC_URL",
        default_rpc_candidates=(DEFAULT_ETH_INFURA_RPC, DEFAULT_ETH_ALCHEMY_RPC),
        nft_env_var="ETHERSCORE_NFT_API_URL_ETHEREUM",
        default_nft_endpoint=DEFAULT_ETH_NFT_API,
        supports_ens=True,
        supports_etherscan_age=True,
    ),
    "polygon": ChainSpec(
        name="polygon",
        rpc_env_var="ETHERSCORE_RPC_URL_POLYGON",
        native_symbol="MATIC",
        price_key="matic-network",
        fallback_price_usd=MATIC_FALLBACK_PRICE_USD,
        usdt_contract="0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
        nft_env_var="ETHERSCORE_NFT_API_URL_POLYGON",
    ),
    "bsc": ChainSpec(
        name="bsc",
        rpc_env_var="ETHERSCORE_RPC_URL_BSC",
        native_symbol="BNB",
        price_key="binancecoin",
        fallback_price_usd=BNB_FALLBACK_PRICE_USD,
        usdt_contract="0x55d398326f99059fF775485246999027B3197955",
        nft_env_var="ETHERSCORE_NFT_API_URL_BSC",
    ),
    "arbitrum": ChainSpec(
        name="arbitrum",
        rpc_env_var="ETHERSCORE_RPC_URL_ARBITRUM",
        native_symbol="ETH",
        price_key="ethereum",
        fallback_price_usd=ETH_FALLBACK_PRICE_USD,
        usdt_contract="0xFd086bC7CD5C481DCC9C85ebe478A1C0b69FCbb9",
        nft_env_var="ETHERSCORE_NFT_API_URL_ARBITRUM",
    ),
}

_payload_cache: dict[str, tuple[float, ScoreBuildResult]] = {}
_price_cache: tuple[datetime, dict[str, float]] | None = None


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
    for endpoint in _nft_endpoint_candidates(spec):
        query = urlencode({"owner": address, "withMetadata": "false", "pageSize": "100"})
        url = f"{endpoint}?{query}"
        try:
            payload = _request_json(url, retries=0)
        except ExternalServiceError:
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


def _get_native_prices_usd() -> dict[str, float]:
    global _price_cache
    now = datetime.now(timezone.utc)

    if _price_cache is not None:
        cached_at, cached_prices = _price_cache
        if (now - cached_at).total_seconds() < PRICE_CACHE_TTL_SECONDS:
            return dict(cached_prices)

    fallbacks = {
        "ethereum": ETH_FALLBACK_PRICE_USD,
        "polygon": MATIC_FALLBACK_PRICE_USD,
        "bsc": BNB_FALLBACK_PRICE_USD,
        "arbitrum": ETH_FALLBACK_PRICE_USD,
    }

    prices = dict(fallbacks)
    try:
        payload = _request_json(ETH_PRICE_API_URL, retries=0)
        for chain_name, spec in CHAIN_SPECS.items():
            raw_price = payload.get(spec.price_key, {}).get("usd") if isinstance(payload.get(spec.price_key), dict) else None
            parsed_price = _safe_float(raw_price, default=fallbacks[chain_name])
            prices[chain_name] = parsed_price if parsed_price > 0 else fallbacks[chain_name]
    except ExternalServiceError:
        prices = fallbacks

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


def _percentile(score: int) -> int:
    return int(round(_clamp((score - 300) / 550.0, 0.01, 0.99) * 100))


def _build_trend_series(seed: str, factor_score: int) -> list[int]:
    digest = hashlib.sha256(seed.encode("utf-8")).digest()
    baseline = 56 + (factor_score * 0.4)
    series: list[int] = []

    for month in range(12):
        offset = (digest[month] - 128) / 12.0
        value = int(round(_clamp(baseline + offset, 40.0, 100.0)))
        series.append(value)

    return series


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

    account_age_days: int | None = None
    if spec.supports_etherscan_age:
        account_age_days = rpc_client.get_account_age_days(address)
        if account_age_days is None:
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

    for index in range(3):
        if index < len(ranked_collections):
            chain_name, collection_name, quantity = ranked_collections[index]
            estimated_value = round(max(quantity, 1) * NFT_FALLBACK_FLOOR_USD, 2)
            featured.append(
                {
                    "name": collection_name,
                    "tier": COLLECTION_TIERS[index % len(COLLECTION_TIERS)],
                    "estimated_value_usd": estimated_value,
                    "estimated_value_display": _format_currency(estimated_value),
                    "accent": FACTOR_DEFINITIONS[index % len(FACTOR_DEFINITIONS)].color,
                    "chain": chain_name,
                }
            )
        else:
            featured.append(
                {
                    "name": f"Collection {index + 1}",
                    "tier": COLLECTION_TIERS[index % len(COLLECTION_TIERS)],
                    "estimated_value_usd": 0.0,
                    "estimated_value_display": "$0.00",
                    "accent": FACTOR_DEFINITIONS[index % len(FACTOR_DEFINITIONS)].color,
                    "chain": "n/a",
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

    price_map = _get_native_prices_usd()
    total_native_usd = 0.0
    total_usdt = 0.0
    total_transactions = 0
    total_nfts = 0
    total_token_diversity = 0
    account_age_candidates: list[int] = []
    ens_name: str | None = None

    for snapshot in snapshots:
        native_price = price_map.get(snapshot.chain, CHAIN_SPECS[snapshot.chain].fallback_price_usd)
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

    account_age_days = min(account_age_candidates) if account_age_candidates else None
    account_age_for_model = float(account_age_days if account_age_days is not None else 365)
    total_assets_usd = total_native_usd + total_usdt
    network_signal = active_chain_count + math.log1p(max(total_token_diversity, 0))

    normalized_factors = {
        "Wallet Balance": _clamp(math.log1p(total_assets_usd) / math.log1p(750000.0), 0.0, 1.0),
        "Transaction History": _clamp(math.log1p(total_transactions) / math.log1p(50000.0), 0.0, 1.0),
        "NFT Holdings": _clamp(math.log1p(total_nfts) / math.log1p(1500.0), 0.0, 1.0),
        "Account Age": _clamp(account_age_for_model / 3650.0, 0.0, 1.0),
        "Network Diversity": _clamp(network_signal / 6.0, 0.0, 1.0),
    }

    weighted_total = sum(
        normalized_factors[factor.name] * (factor.weight / 100.0)
        for factor in FACTOR_DEFINITIONS
    )
    score = int(round(300 + weighted_total * 550))
    score = int(_clamp(score, 300, 850))

    factor_raw_values = {
        "Wallet Balance": total_assets_usd,
        "Transaction History": float(total_transactions),
        "NFT Holdings": float(total_nfts),
        "Account Age": account_age_for_model,
        "Network Diversity": float(active_chain_count),
    }

    factors: list[dict[str, Any]] = []
    for factor in FACTOR_DEFINITIONS:
        normalized_value = normalized_factors[factor.name]
        factor_score = int(round(normalized_value * 100))
        weighted_points = round((factor.weight / 100.0) * factor_score, 1)
        unknown_age = factor.name == "Account Age" and account_age_days is None

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
                "trend": _build_trend_series(f"{normalized_address}:{factor.name}", factor_score),
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
            "nft_api": _source_name(os.getenv("ETHERSCORE_NFT_API_URL", "")),
            "ens_api": _source_name(ENS_API_URL),
        },
    }

    payload = {
        "address": normalized_address,
        "score": score,
        "score_band": _score_band(score),
        "trust_level": _trust_level(score),
        "risk_regime": _risk_regime(score, volatility_index),
        "average_score": AVERAGE_SCORE,
        "peer_delta": score - AVERAGE_SCORE,
        "percentile": _percentile(score),
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
