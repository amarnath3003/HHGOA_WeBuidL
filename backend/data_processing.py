from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
import hashlib
import math
import re
from typing import Any


ETH_ADDRESS_PATTERN = re.compile(r"^0x[a-fA-F0-9]{40}$")
AVERAGE_SCORE = 720


@dataclass(frozen=True)
class FactorDefinition:
    name: str
    weight: int
    impact: str
    icon: str
    color: str
    glow: str
    formatter: str


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


ADJECTIVES = (
    "Nebula",
    "Crystal",
    "Solar",
    "Quantum",
    "Onyx",
    "Velvet",
    "Signal",
    "Atlas",
    "Vertex",
    "Prism",
)

NOUNS = (
    "Vault",
    "Ledger",
    "Archive",
    "Pass",
    "Circuit",
    "Node",
    "Passport",
    "Beacon",
    "Gallery",
    "Registry",
)

COLLECTION_TIERS = ("Blue Chip", "Growth", "Emerging")


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(value, maximum))


def _scale(raw_value: int, upper_bound: float, minimum: float = 0.0) -> float:
    return minimum + (raw_value / 65535.0) * (upper_bound - minimum)


def _format_currency(value: float) -> str:
    return f"${value:,.2f}"


def _format_days(value: int) -> str:
    years, days = divmod(value, 365)
    if years == 0:
        return f"{days} days"
    return f"{years}y {days}d"


def is_valid_wallet_address(address: str) -> bool:
    return bool(ETH_ADDRESS_PATTERN.fullmatch(address.strip()))


def _digest_address(address: str) -> bytes:
    return hashlib.sha256(address.lower().encode("utf-8")).digest()


def _derive_profile(address: str) -> dict[str, Any]:
    digest = _digest_address(address)
    pair = lambda index: int.from_bytes(digest[index : index + 2], "big")

    usdt_balance = round(_scale(pair(0), 125000.0, 250.0), 2)
    transaction_count = int(round(_scale(pair(2), 1600.0, 12.0)))
    nft_count = int(round(_scale(pair(4), 40.0, 0.0)))
    account_age_days = int(round(_scale(pair(6), 3650.0, 45.0)))
    network_diversity = int(round(_scale(pair(8), 6.0, 1.0)))
    nft_floor_value = round(_scale(pair(10), 4200.0, 180.0), 2)
    liquidity_buffer = round(_scale(pair(12), 24000.0, 500.0), 2)
    volatility_index = round(_scale(pair(14), 18.0, 2.0), 1)

    total_assets_usd = round(usdt_balance + (nft_count * nft_floor_value) + liquidity_buffer, 2)

    ens_enabled = digest[16] % 100 < 60
    ens_name = f"{address[2:6]}-{address[-4:]}.eth" if ens_enabled else None

    return {
        "address": address,
        "usdt_balance_usd": usdt_balance,
        "transaction_count": transaction_count,
        "nft_count": nft_count,
        "account_age_days": account_age_days,
        "network_diversity": network_diversity,
        "nft_floor_value_usd": nft_floor_value,
        "liquidity_buffer_usd": liquidity_buffer,
        "volatility_index": volatility_index,
        "total_assets_usd": total_assets_usd,
        "ens_name": ens_name,
    }


def _normalize_profile(profile: dict[str, Any]) -> dict[str, float]:
    return {
        "Wallet Balance": _clamp(math.log1p(profile["usdt_balance_usd"]) / math.log1p(125000.0), 0.0, 1.0),
        "Transaction History": _clamp(math.log1p(profile["transaction_count"]) / math.log1p(1600.0), 0.0, 1.0),
        "NFT Holdings": _clamp(math.log1p(profile["nft_count"]) / math.log1p(40.0), 0.0, 1.0),
        "Account Age": _clamp(profile["account_age_days"] / 3650.0, 0.0, 1.0),
        "Network Diversity": _clamp(profile["network_diversity"] / 6.0, 0.0, 1.0),
    }


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


def _format_factor_value(definition: FactorDefinition, raw_value: float) -> str:
    if definition.formatter == "currency":
        return _format_currency(raw_value)
    if definition.formatter == "days":
        return _format_days(int(raw_value))
    return f"{int(raw_value):,}"


def _factor_raw_value(name: str, profile: dict[str, Any]) -> float:
    return {
        "Wallet Balance": profile["usdt_balance_usd"],
        "Transaction History": profile["transaction_count"],
        "NFT Holdings": profile["nft_count"],
        "Account Age": profile["account_age_days"],
        "Network Diversity": profile["network_diversity"],
    }[name]


def _build_trend_series(address: str, factor_index: int, factor_score: int) -> list[int]:
    digest = _digest_address(f"{address}:{factor_index}")
    series: list[int] = []
    baseline = 55 + (factor_score * 0.42)

    for month_index in range(12):
        offset = (digest[month_index] - 128) / 10.0
        value = int(round(_clamp(baseline + offset, 40.0, 100.0)))
        series.append(value)

    return series


def _build_collections(address: str, profile: dict[str, Any]) -> list[dict[str, Any]]:
    digest = _digest_address(f"{address}:collections")
    collections: list[dict[str, Any]] = []

    for index in range(3):
        adjective = ADJECTIVES[digest[index] % len(ADJECTIVES)]
        noun = NOUNS[digest[index + 3] % len(NOUNS)]
        tier = COLLECTION_TIERS[index % len(COLLECTION_TIERS)]
        notional_value = round(profile["nft_floor_value_usd"] * (1.0 + (digest[index + 6] / 255.0)), 2)
        collections.append(
            {
                "name": f"{adjective} {noun}",
                "tier": tier,
                "estimated_value_usd": notional_value,
                "estimated_value_display": _format_currency(notional_value),
                "accent": FACTOR_DEFINITIONS[index].color,
            }
        )

    return collections


def build_score_payload(address: str) -> dict[str, Any]:
    cleaned_address = address.strip()
    if not is_valid_wallet_address(cleaned_address):
        raise ValueError("Wallet address must be a valid 42-character hex Ethereum address.")

    profile = _derive_profile(cleaned_address)
    normalized = _normalize_profile(profile)

    weighted_total = sum(
        normalized[definition.name] * (definition.weight / 100.0)
        for definition in FACTOR_DEFINITIONS
    )
    score = int(round(300 + (weighted_total * 550)))
    score = int(_clamp(score, 300, 850))

    factors: list[dict[str, Any]] = []
    for index, definition in enumerate(FACTOR_DEFINITIONS):
        factor_score = int(round(normalized[definition.name] * 100))
        weighted_points = round((definition.weight / 100.0) * factor_score, 1)
        raw_value = _factor_raw_value(definition.name, profile)
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
                "trend": _build_trend_series(cleaned_address, index, factor_score),
            }
        )

    peer_delta = score - AVERAGE_SCORE
    generated_at = datetime.now(timezone.utc).isoformat()

    summary = {
        "usdt_balance_usd": profile["usdt_balance_usd"],
        "usdt_balance_display": _format_currency(profile["usdt_balance_usd"]),
        "total_assets_usd": profile["total_assets_usd"],
        "total_assets_display": _format_currency(profile["total_assets_usd"]),
        "ens_name": profile["ens_name"],
        "nft_count": profile["nft_count"],
        "transaction_count": profile["transaction_count"],
        "account_age_days": profile["account_age_days"],
        "account_age_display": _format_days(profile["account_age_days"]),
        "network_diversity": profile["network_diversity"],
        "volatility_index": profile["volatility_index"],
    }

    return {
        "address": cleaned_address,
        "score": score,
        "score_band": _score_band(score),
        "trust_level": _trust_level(score),
        "risk_regime": _risk_regime(score, profile["volatility_index"]),
        "average_score": AVERAGE_SCORE,
        "peer_delta": peer_delta,
        "percentile": _percentile(score),
        "generated_at": generated_at,
        "summary": summary,
        "factors": factors,
        "featured_collections": _build_collections(cleaned_address, profile),
    }
