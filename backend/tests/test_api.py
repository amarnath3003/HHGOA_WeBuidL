from __future__ import annotations

from types import SimpleNamespace

from fastapi.testclient import TestClient
import pytest

from backend import main as api


ADDRESS = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"


@pytest.fixture(autouse=True)
def _reset_rate_limiter() -> None:
    api.rate_limiter.reset()


def _base_payload() -> dict:
    return {
        "address": ADDRESS.lower(),
        "score": 701,
        "score_band": "Good",
        "trust_level": "Elevated",
        "risk_regime": "Balanced",
        "average_score": 720,
        "peer_delta": -19,
        "percentile": 73,
        "generated_at": "2026-03-25T00:00:00+00:00",
        "summary": {
            "usdt_balance_usd": 1000.0,
            "usdt_balance_display": "$1,000.00",
            "total_assets_usd": 6500.0,
            "total_assets_display": "$6,500.00",
            "ens_name": "vitalik.eth",
            "nft_count": 5,
            "transaction_count": 110,
            "account_age_days": 400,
            "account_age_display": "1y 35d",
            "network_diversity": 2,
            "volatility_index": 7.2,
            "data_quality": "complete",
            "chain_breakdown": {},
            "data_sources": {"rpc": "mainnet.infura.io", "nft_api": "n/a", "ens_api": "api.ensideas.com"},
        },
        "factors": [
            {
                "name": "Wallet Balance",
                "percentage": 30,
                "impact": "Primary driver",
                "icon": "account_balance_wallet",
                "color": "#a6e6ff",
                "glow": "rgba(166, 230, 255, 0.4)",
                "value": "$6,500.00",
                "score": 78,
                "weighted_points": 23.4,
                "trend": [70] * 12,
                "normalized_value": 0.78,
                "rationale": "Healthy signal for wallet balance relative to benchmark baselines.",
            }
        ],
        "featured_collections": [
            {
                "name": "Alpha",
                "tier": "Blue Chip",
                "estimated_value_usd": 250,
                "estimated_value_display": "$250.00",
                "accent": "#a6e6ff",
                "chain": "ethereum",
            }
        ],
    }


def _result(
    *,
    chains_requested: list[str] | None = None,
    chains_used: list[str] | None = None,
    warnings: list[str] | None = None,
    cache_hit: bool = False,
):
    return SimpleNamespace(
        payload=_base_payload(),
        cache_hit=cache_hit,
        chains_requested=chains_requested or ["ethereum"],
        chains_used=chains_used or ["ethereum"],
        warnings=warnings or [],
    )


def test_post_score_legacy_contract(monkeypatch: pytest.MonkeyPatch) -> None:
    client = TestClient(api.app)
    captured: dict[str, object] = {}

    def fake_build_score_payload(address: str, chains=None):
        captured["address"] = address
        captured["chains"] = chains
        return _result()

    monkeypatch.setattr(api, "build_score_payload", fake_build_score_payload)

    response = client.post("/api/score", json={"address": ADDRESS})

    assert response.status_code == 200
    body = response.json()
    assert body["score"] == 701
    assert body["meta"]["chains_requested"] == ["ethereum"]
    assert captured["address"] == ADDRESS
    assert captured["chains"] is None


def test_post_score_extended_chain_schema(monkeypatch: pytest.MonkeyPatch) -> None:
    client = TestClient(api.app)

    def fake_build_score_payload(address: str, chains=None):
        assert chains == ["ethereum", "polygon"]
        return _result(
            chains_requested=["ethereum", "polygon"],
            chains_used=["ethereum"],
            warnings=["polygon failed"],
        )

    monkeypatch.setattr(api, "build_score_payload", fake_build_score_payload)

    response = client.post("/api/score", json={"address": ADDRESS, "chains": ["ethereum", "polygon"]})
    body = response.json()

    assert response.status_code == 200
    assert body["meta"]["chains_requested"] == ["ethereum", "polygon"]
    assert body["meta"]["chains_used"] == ["ethereum"]
    assert body["meta"]["warnings"] == ["polygon failed"]


def test_get_score_query_chain_list(monkeypatch: pytest.MonkeyPatch) -> None:
    client = TestClient(api.app)

    def fake_build_score_payload(address: str, chains=None):
        assert chains == ["ethereum", "polygon"]
        return _result(chains_requested=chains, chains_used=chains)

    monkeypatch.setattr(api, "build_score_payload", fake_build_score_payload)

    response = client.get(f"/api/score/{ADDRESS}?chains=ethereum,polygon")
    assert response.status_code == 200
    assert response.json()["meta"]["chains_requested"] == ["ethereum", "polygon"]


def test_invalid_wallet_error_contract(monkeypatch: pytest.MonkeyPatch) -> None:
    client = TestClient(api.app)
    monkeypatch.setattr(api, "build_score_payload", lambda *args, **kwargs: (_ for _ in ()).throw(ValueError("Wallet address must be a valid 42-character hex Ethereum address.")))

    response = client.post("/api/score", json={"address": ADDRESS})
    body = response.json()

    assert response.status_code == 400
    assert body["error_code"] == "invalid_wallet_address"


def test_unknown_chain_error_contract(monkeypatch: pytest.MonkeyPatch) -> None:
    client = TestClient(api.app)
    monkeypatch.setattr(api, "build_score_payload", lambda *args, **kwargs: (_ for _ in ()).throw(ValueError("Unsupported chain 'solana'. Supported chains: ethereum.")))

    response = client.post("/api/score", json={"address": ADDRESS, "chains": ["solana"]})
    body = response.json()

    assert response.status_code == 400
    assert body["error_code"] == "unsupported_chain"


def test_upstream_unavailable_error_contract(monkeypatch: pytest.MonkeyPatch) -> None:
    client = TestClient(api.app)
    monkeypatch.setattr(api, "build_score_payload", lambda *args, **kwargs: (_ for _ in ()).throw(RuntimeError("Upstream outage")))

    response = client.post("/api/score", json={"address": ADDRESS})
    body = response.json()

    assert response.status_code == 502
    assert body["error_code"] == "upstream_unavailable"


def test_rate_limit_returns_429(monkeypatch: pytest.MonkeyPatch) -> None:
    client = TestClient(api.app)
    monkeypatch.setattr(api.rate_limiter, "check", lambda key: (False, 9))

    response = client.post("/api/score", json={"address": ADDRESS})
    body = response.json()

    assert response.status_code == 429
    assert response.headers["Retry-After"] == "9"
    assert body["error_code"] == "rate_limit_exceeded"


def test_cors_allowlist_headers_present() -> None:
    client = TestClient(api.app)
    response = client.options(
        "/api/score",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert response.status_code in {200, 204}
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
