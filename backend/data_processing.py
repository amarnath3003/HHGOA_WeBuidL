from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import json
import math
import os
import re
import time
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen


ETH_ADDRESS_PATTERN = re.compile(r"^0x[a-fA-F0-9]{40}$")
AVERAGE_SCORE = 720
USDT_CONTRACT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
USDT_DECIMALS = 6

RPC_URL = os.getenv("ETHERSCORE_RPC_URL", "https://eth-mainnet.g.alchemy.com/v2/demo")
NFT_API_URL = os.getenv(
    "ETHERSCORE_NFT_API_URL",
    "https://eth-mainnet.g.alchemy.com/nft/v3/demo/getNFTsForOwner",
)
ENS_API_URL = os.getenv("ETHERSCORE_ENS_API_URL", "https://api.ensideas.com/ens/resolve")
ETH_PRICE_API_URL = os.getenv(
    "ETHERSCORE_ETH_PRICE_API_URL",
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
)
ETH_FALLBACK_PRICE_USD = float(os.getenv("ETHERSCORE_FALLBACK_ETH_PRICE_USD", "3000"))
NFT_FALLBACK_FLOOR_USD = float(os.getenv("ETHERSCORE_FALLBACK_NFT_FLOOR_USD", "120"))
REQUEST_TIMEOUT_SECONDS = float(os.getenv("ETHERSCORE_REQUEST_TIMEOUT_SECONDS", "12"))
PAYLOAD_CACHE_TTL_SECONDS = float(os.getenv("ETHERSCORE_CACHE_TTL_SECONDS", "120"))

_payload_cache: dict[str, tuple[float, dict[str, Any]]] = {}
_eth_price_cache: tuple[datetime, float] | None = None


class ExternalServiceError(RuntimeError):
    """Raised when an upstream blockchain/data API is unavailable."""


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
class WalletSnapshot:
    address: str
    eth_balance: float
    usdt_balance: float
    transaction_count: int
    nft_count: int
    token_diversity: int
    account_age_days: int | None
    ens_name: str | None
    collections: list[tuple[str, int]]


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

COLLECTION_TIERS = ("Blue Chip", "Growth", "Emerging")


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


def _request_json(url: str, *, method: str = "GET", payload: dict[str, Any] | None = None) -> dict[str, Any]:
    request_body = None
    headers = {"Accept": "application/json"}
    if payload is not None:
        request_body = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    request = Request(url=url, data=request_body, headers=headers, method=method)

    try:
        with urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
            content = response.read().decode("utf-8", errors="replace")
    except HTTPError as exc:
        error_text = exc.read().decode("utf-8", errors="replace")
        raise ExternalServiceError(f"{url} returned HTTP {exc.code}. {error_text[:180]}") from exc
    except URLError as exc:
        raise ExternalServiceError(f"Failed to reach {url}: {exc.reason}") from exc

    if not content.strip():
        return {}

    try:
        parsed = json.loads(content)
    except json.JSONDecodeError as exc:
        raise ExternalServiceError(f"{url} returned invalid JSON.") from exc

    if not isinstance(parsed, dict):
        raise ExternalServiceError(f"{url} returned an unexpected response format.")

    return parsed


def _to_iso_datetime(value: str) -> datetime | None:
    if not value:
        return None
    candidate = value.strip()
    if not candidate:
        return None

    try:
        if candidate.endswith("Z"):
            return datetime.fromisoformat(candidate.replace("Z", "+00:00"))
        parsed = datetime.fromisoformat(candidate)
        return parsed if parsed.tzinfo is not None else parsed.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


class EthereumRpcClient:
    def __init__(self, rpc_url: str) -> None:
        self._rpc_url = rpc_url
        self._request_id = 0

    def _call(self, method: str, params: list[Any]) -> Any:
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
        )

        if "error" in response:
            error = response.get("error", {})
            code = error.get("code", "unknown")
            message = error.get("message", "unknown RPC error")
            raise ExternalServiceError(f"RPC method '{method}' failed ({code}): {message}")

        if "result" not in response:
            raise ExternalServiceError(f"RPC method '{method}' returned no result.")

        return response["result"]

    def get_eth_balance(self, address: str) -> float:
        result = self._call("eth_getBalance", [address, "latest"])
        wei_balance = _safe_int(result)
        return wei_balance / (10**18)

    def get_transaction_count(self, address: str) -> int:
        result = self._call("eth_getTransactionCount", [address, "latest"])
        return _safe_int(result)

    def get_usdt_balance(self, address: str) -> float:
        padded_address = address[2:].rjust(64, "0")
        calldata = f"0x70a08231{padded_address}"
        result = self._call(
            "eth_call",
            [{"to": USDT_CONTRACT_ADDRESS, "data": calldata}, "latest"],
        )
        balance_units = _safe_int(result)
        return balance_units / (10**USDT_DECIMALS)

    def get_token_diversity(self, address: str) -> int:
        try:
            result = self._call("alchemy_getTokenBalances", [address, "DEFAULT_TOKENS"])
        except ExternalServiceError:
            return 1

        balances = result.get("tokenBalances", []) if isinstance(result, dict) else []
        diversity_count = 0
        for entry in balances:
            if not isinstance(entry, dict):
                continue
            raw_balance = entry.get("tokenBalance", "0x0")
            if _safe_int(raw_balance) > 0:
                diversity_count += 1

        return max(diversity_count, 1)

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
            result = self._call("alchemy_getAssetTransfers", [transfer_query])
        except ExternalServiceError:
            return None

        transfers = result.get("transfers", []) if isinstance(result, dict) else []
        if not transfers:
            return None

        metadata = transfers[0].get("metadata", {}) if isinstance(transfers[0], dict) else {}
        timestamp = metadata.get("blockTimestamp")
        return _to_iso_datetime(timestamp) if isinstance(timestamp, str) else None

    def get_account_age_days(self, address: str) -> int | None:
        first_outgoing = self._first_transfer_timestamp(address, outgoing=True)
        first_incoming = self._first_transfer_timestamp(address, outgoing=False)
        candidates = [dt for dt in (first_outgoing, first_incoming) if dt is not None]

        if not candidates:
            return _fetch_first_transaction_age_days_from_etherscan(address)

        oldest = min(candidates)
        age_days = (datetime.now(timezone.utc) - oldest).days
        return max(age_days, 1)


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
    endpoint = f"https://api.etherscan.io/api?{query}"

    try:
        payload = _request_json(endpoint)
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


def _fetch_nft_snapshot(address: str) -> tuple[int, list[tuple[str, int]]]:
    query = urlencode({"owner": address, "withMetadata": "false", "pageSize": "100"})
    endpoint = f"{NFT_API_URL}?{query}"

    try:
        payload = _request_json(endpoint)
    except ExternalServiceError:
        return 0, []

    total_count = _safe_int(payload.get("totalCount"), default=0)
    owned_nfts = payload.get("ownedNfts", [])
    if not isinstance(owned_nfts, list):
        owned_nfts = []

    collection_counts: dict[str, int] = {}
    for nft in owned_nfts:
        if not isinstance(nft, dict):
            continue

        contract = nft.get("contract", {}) if isinstance(nft.get("contract"), dict) else {}
        contract_name = str(
            contract.get("name")
            or contract.get("symbol")
            or contract.get("address")
            or "Unknown Collection"
        )
        contract_name = contract_name.strip() or "Unknown Collection"

        nft_balance = _safe_int(nft.get("balance"), default=1)
        collection_counts[contract_name] = collection_counts.get(contract_name, 0) + max(nft_balance, 1)

    if total_count <= 0:
        total_count = sum(collection_counts.values())

    sorted_collections = sorted(
        collection_counts.items(),
        key=lambda item: item[1],
        reverse=True,
    )

    return total_count, sorted_collections[:3]


def _fetch_ens_name(address: str) -> str | None:
    endpoint = f"{ENS_API_URL.rstrip('/')}/{address}"
    try:
        payload = _request_json(endpoint)
    except ExternalServiceError:
        return None

    candidate_keys = ("name", "ens", "displayName")
    for key in candidate_keys:
        raw_value = payload.get(key)
        if not isinstance(raw_value, str):
            continue
        name = raw_value.strip()
        if name and name.lower() != "null":
            return name

    return None


def _get_eth_price_usd() -> float:
    global _eth_price_cache
    now = datetime.now(timezone.utc)

    if _eth_price_cache is not None:
        cached_at, cached_price = _eth_price_cache
        if now - cached_at < timedelta(minutes=15):
            return cached_price

    try:
        payload = _request_json(ETH_PRICE_API_URL)
        price = _safe_float(payload.get("ethereum", {}).get("usd"), default=ETH_FALLBACK_PRICE_USD)
        if price <= 0:
            price = ETH_FALLBACK_PRICE_USD
    except ExternalServiceError:
        price = ETH_FALLBACK_PRICE_USD

    _eth_price_cache = (now, price)
    return price


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


def _source_name(endpoint: str) -> str:
    parsed = urlparse(endpoint)
    return parsed.netloc or endpoint


def is_valid_wallet_address(address: str) -> bool:
    return bool(ETH_ADDRESS_PATTERN.fullmatch(address.strip()))


def _build_wallet_snapshot(address: str) -> WalletSnapshot:
    rpc = EthereumRpcClient(RPC_URL)

    try:
        eth_balance = rpc.get_eth_balance(address)
        transaction_count = rpc.get_transaction_count(address)
    except ExternalServiceError as exc:
        raise ExternalServiceError(
            "Unable to fetch core wallet metrics from the configured RPC provider."
        ) from exc

    try:
        usdt_balance = rpc.get_usdt_balance(address)
    except ExternalServiceError:
        usdt_balance = 0.0

    token_diversity = rpc.get_token_diversity(address)
    account_age_days = rpc.get_account_age_days(address)
    nft_count, collections = _fetch_nft_snapshot(address)
    ens_name = _fetch_ens_name(address)

    return WalletSnapshot(
        address=address,
        eth_balance=eth_balance,
        usdt_balance=usdt_balance,
        transaction_count=transaction_count,
        nft_count=nft_count,
        token_diversity=token_diversity,
        account_age_days=account_age_days,
        ens_name=ens_name,
        collections=collections,
    )


def _compute_normalized_factors(snapshot: WalletSnapshot, eth_price_usd: float) -> tuple[dict[str, float], dict[str, float]]:
    eth_balance_usd = snapshot.eth_balance * eth_price_usd
    wallet_balance_usd = snapshot.usdt_balance + eth_balance_usd
    account_age_for_model = snapshot.account_age_days if snapshot.account_age_days is not None else 365

    normalized = {
        "Wallet Balance": _clamp(math.log1p(wallet_balance_usd) / math.log1p(250000.0), 0.0, 1.0),
        "Transaction History": _clamp(math.log1p(snapshot.transaction_count) / math.log1p(6000.0), 0.0, 1.0),
        "NFT Holdings": _clamp(math.log1p(snapshot.nft_count) / math.log1p(250.0), 0.0, 1.0),
        "Account Age": _clamp(account_age_for_model / 3650.0, 0.0, 1.0),
        "Network Diversity": _clamp(snapshot.token_diversity / 25.0, 0.0, 1.0),
    }

    metrics = {
        "eth_balance_usd": eth_balance_usd,
        "wallet_balance_usd": wallet_balance_usd,
        "account_age_for_model": float(account_age_for_model),
    }

    return normalized, metrics


def _build_trend_series(score: int) -> list[int]:
    deltas = (-5, -4, -3, -2, -1, 0, 1, 1, 2, 2, 3, 3)
    return [int(round(_clamp(score + delta, 40, 100))) for delta in deltas]


def _factor_raw_value(name: str, snapshot: WalletSnapshot, wallet_balance_usd: float, account_age_for_model: float) -> float:
    values = {
        "Wallet Balance": wallet_balance_usd,
        "Transaction History": float(snapshot.transaction_count),
        "NFT Holdings": float(snapshot.nft_count),
        "Account Age": account_age_for_model,
        "Network Diversity": float(snapshot.token_diversity),
    }
    return values[name]


def _format_factor_value(definition: FactorDefinition, value: float) -> str:
    if definition.formatter == "currency":
        return _format_currency(value)
    if definition.formatter == "days":
        return _format_days(int(value))
    return f"{int(round(value)):,}"


def _build_collections(snapshot: WalletSnapshot) -> list[dict[str, Any]]:
    collections: list[dict[str, Any]] = []

    for index in range(3):
        if index < len(snapshot.collections):
            collection_name, nft_count = snapshot.collections[index]
            estimated_value = round(max(nft_count, 1) * NFT_FALLBACK_FLOOR_USD, 2)
            collections.append(
                {
                    "name": collection_name,
                    "tier": COLLECTION_TIERS[index % len(COLLECTION_TIERS)],
                    "estimated_value_usd": estimated_value,
                    "estimated_value_display": _format_currency(estimated_value),
                    "accent": FACTOR_DEFINITIONS[index % len(FACTOR_DEFINITIONS)].color,
                }
            )
        else:
            collections.append(
                {
                    "name": f"Collection {index + 1}",
                    "tier": COLLECTION_TIERS[index % len(COLLECTION_TIERS)],
                    "estimated_value_usd": 0.0,
                    "estimated_value_display": "$0.00",
                    "accent": FACTOR_DEFINITIONS[index % len(FACTOR_DEFINITIONS)].color,
                }
            )

    return collections


def _compute_volatility_index(snapshot: WalletSnapshot, account_age_for_model: float) -> float:
    activity_density = snapshot.transaction_count / max(account_age_for_model, 30.0) * 30.0
    diversity_bonus = min(snapshot.token_diversity, 10) * 0.4
    volatility = 14.0 - min(activity_density / 2.0, 8.0) - diversity_bonus
    return round(_clamp(volatility, 2.0, 18.0), 1)


def _get_cached_payload(address: str) -> dict[str, Any] | None:
    cached = _payload_cache.get(address)
    if cached is None:
        return None

    cached_at, payload = cached
    if (time.time() - cached_at) > PAYLOAD_CACHE_TTL_SECONDS:
        _payload_cache.pop(address, None)
        return None

    return payload


def _set_cached_payload(address: str, payload: dict[str, Any]) -> None:
    _payload_cache[address] = (time.time(), payload)


def build_score_payload(address: str) -> dict[str, Any]:
    cleaned_address = address.strip()
    if not is_valid_wallet_address(cleaned_address):
        raise ValueError("Wallet address must be a valid 42-character hex Ethereum address.")

    normalized_address = cleaned_address.lower()
    cached_payload = _get_cached_payload(normalized_address)
    if cached_payload is not None:
        return cached_payload

    try:
        snapshot = _build_wallet_snapshot(normalized_address)
    except ExternalServiceError as exc:
        raise RuntimeError(
            "Unable to fetch wallet metrics from upstream providers. "
            "Check ETHERSCORE_RPC_URL or try again shortly."
        ) from exc

    eth_price_usd = _get_eth_price_usd()
    normalized_factors, model_metrics = _compute_normalized_factors(snapshot, eth_price_usd)

    weighted_total = sum(
        normalized_factors[definition.name] * (definition.weight / 100.0)
        for definition in FACTOR_DEFINITIONS
    )
    score = int(round(300 + weighted_total * 550))
    score = int(_clamp(score, 300, 850))

    factors: list[dict[str, Any]] = []
    for definition in FACTOR_DEFINITIONS:
        factor_score = int(round(normalized_factors[definition.name] * 100))
        weighted_points = round((definition.weight / 100.0) * factor_score, 1)
        raw_value = _factor_raw_value(
            definition.name,
            snapshot,
            model_metrics["wallet_balance_usd"],
            model_metrics["account_age_for_model"],
        )
        factors.append(
            {
                "name": definition.name,
                "percentage": definition.weight,
                "impact": definition.impact,
                "icon": definition.icon,
                "color": definition.color,
                "glow": definition.glow,
                "value": _format_factor_value(definition, raw_value),
                "score": factor_score,
                "weighted_points": weighted_points,
                "trend": _build_trend_series(factor_score),
            }
        )

    volatility_index = _compute_volatility_index(snapshot, model_metrics["account_age_for_model"])
    peer_delta = score - AVERAGE_SCORE

    summary = {
        "usdt_balance_usd": round(snapshot.usdt_balance, 2),
        "usdt_balance_display": _format_currency(snapshot.usdt_balance),
        "eth_balance": round(snapshot.eth_balance, 6),
        "eth_balance_display": f"{snapshot.eth_balance:.4f} ETH",
        "eth_price_usd": round(eth_price_usd, 2),
        "eth_balance_usd": round(model_metrics["eth_balance_usd"], 2),
        "total_assets_usd": round(model_metrics["wallet_balance_usd"], 2),
        "total_assets_display": _format_currency(model_metrics["wallet_balance_usd"]),
        "ens_name": snapshot.ens_name,
        "nft_count": snapshot.nft_count,
        "transaction_count": snapshot.transaction_count,
        "account_age_days": snapshot.account_age_days,
        "account_age_display": _format_days(snapshot.account_age_days),
        "network_diversity": snapshot.token_diversity,
        "volatility_index": volatility_index,
        "data_sources": {
            "rpc": _source_name(RPC_URL),
            "nft_api": _source_name(NFT_API_URL),
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
        "peer_delta": peer_delta,
        "percentile": _percentile(score),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": summary,
        "factors": factors,
        "featured_collections": _build_collections(snapshot),
    }

    _set_cached_payload(normalized_address, payload)
    return payload
