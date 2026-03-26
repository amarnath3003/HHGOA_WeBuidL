from __future__ import annotations

import pytest

from backend import data_processing as dp


ADDRESS = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"


def _reset_caches() -> None:
    dp._payload_cache.clear()
    dp._price_cache = None
    dp._credit_model = None


def _snapshot(chain: str) -> dp.ChainSnapshot:
    native_symbol = "ETH" if chain in {"ethereum", "arbitrum"} else ("MATIC" if chain == "polygon" else "BNB")
    return dp.ChainSnapshot(
        chain=chain,
        rpc_source=f"https://{chain}.rpc.local",
        native_symbol=native_symbol,
        native_balance=1.25,
        usdt_balance=500.0,
        transaction_count=250,
        nft_count=12,
        token_diversity=6,
        account_age_days=420 if chain == "ethereum" else None,
        ens_name="vitalik.eth" if chain == "ethereum" else None,
        collections=[(f"{chain.title()} Alpha", 3), (f"{chain.title()} Beta", 2)],
    )


def test_invalid_wallet_address_rejected() -> None:
    _reset_caches()
    with pytest.raises(ValueError, match="Wallet address must be a valid"):
        dp.build_score_payload("0x123")


def test_score_determinism_and_factor_bounds(monkeypatch: pytest.MonkeyPatch) -> None:
    _reset_caches()

    monkeypatch.setattr(dp, "_rpc_candidates", lambda spec: [f"https://{spec.name}.rpc.local"])
    monkeypatch.setattr(dp, "_fetch_chain_snapshot", lambda address, chain: _snapshot(chain))
    monkeypatch.setattr(
        dp,
        "_get_native_prices_usd",
        lambda required_chains=None: {"ethereum": 3000.0, "polygon": 1.0, "bsc": 500.0, "arbitrum": 3000.0},
    )

    result_1 = dp.build_score_payload(ADDRESS, chains=["ethereum", "polygon"])
    result_2 = dp.build_score_payload(ADDRESS, chains=["ethereum", "polygon"])

    assert result_1.cache_hit is False
    assert result_2.cache_hit is True
    assert result_1.payload["score"] == result_2.payload["score"]
    assert result_1.chains_used == ["ethereum", "polygon"]
    assert result_1.payload["summary"]["data_quality"] == "complete"

    for factor in result_1.payload["factors"]:
        normalized = factor["normalized_value"]
        assert 0.0 <= normalized <= 1.0


def test_partial_failure_returns_partial_data(monkeypatch: pytest.MonkeyPatch) -> None:
    _reset_caches()

    monkeypatch.setattr(dp, "_rpc_candidates", lambda spec: [f"https://{spec.name}.rpc.local"])
    monkeypatch.setattr(
        dp,
        "_get_native_prices_usd",
        lambda required_chains=None: {"ethereum": 3000.0, "polygon": 1.0, "bsc": 500.0, "arbitrum": 3000.0},
    )

    def fake_fetch_snapshot(address: str, chain: str) -> dp.ChainSnapshot:
        if chain == "polygon":
            raise dp.ExternalServiceError("polygon unavailable")
        return _snapshot(chain)

    monkeypatch.setattr(dp, "_fetch_chain_snapshot", fake_fetch_snapshot)

    result = dp.build_score_payload(ADDRESS, chains=["ethereum", "polygon"])
    breakdown = result.payload["summary"]["chain_breakdown"]

    assert result.chains_used == ["ethereum"]
    assert result.payload["summary"]["data_quality"] == "partial"
    assert any("polygon" in warning.lower() for warning in result.warnings)
    assert breakdown["polygon"]["status"] == "failed"


def test_only_unconfigured_chains_fail_with_400_style_error(monkeypatch: pytest.MonkeyPatch) -> None:
    _reset_caches()
    monkeypatch.setattr(dp, "_rpc_candidates", lambda spec: [])

    with pytest.raises(ValueError, match="None of the requested chains are configured"):
        dp.build_score_payload(ADDRESS, chains=["polygon"])


def test_all_chain_fetches_failed_raise_runtime_error(monkeypatch: pytest.MonkeyPatch) -> None:
    _reset_caches()
    monkeypatch.setattr(dp, "_rpc_candidates", lambda spec: [f"https://{spec.name}.rpc.local"])
    monkeypatch.setattr(dp, "_fetch_chain_snapshot", lambda address, chain: (_ for _ in ()).throw(dp.ExternalServiceError("rpc down")))

    with pytest.raises(RuntimeError, match="Unable to fetch wallet metrics from requested chains"):
        dp.build_score_payload(ADDRESS, chains=["ethereum", "polygon"])


def test_credit_score_uses_model_prediction(monkeypatch: pytest.MonkeyPatch) -> None:
    _reset_caches()
    monkeypatch.setattr(dp, "_rpc_candidates", lambda spec: [f"https://{spec.name}.rpc.local"])
    monkeypatch.setattr(dp, "_fetch_chain_snapshot", lambda address, chain: _snapshot(chain))
    monkeypatch.setattr(
        dp,
        "_get_native_prices_usd",
        lambda required_chains=None: {"ethereum": 3000.0, "polygon": 1.0, "bsc": 500.0, "arbitrum": 3000.0},
    )

    model = dp.WeightedCreditModel(
        weights={
            "wallet_balance_usd": 0.40,
            "transaction_count": 0.20,
            "nft_ownership_volume": 0.15,
            "account_age_days": 0.15,
            "token_diversity": 0.10,
        },
        min_max_stats={
            "wallet_balance_usd": (0.0, 100000.0),
            "transaction_count": (0.0, 5000.0),
            "nft_ownership_volume": (0.0, 200.0),
            "account_age_days": (0.0, 3650.0),
            "token_diversity": (0.0, 30.0),
        },
        scale=500.0,
        intercept=350.0,
        average_score=610,
        reference_scores=(420.0, 510.0, 610.0, 710.0, 820.0),
    )
    captured_features: dict[str, float] = {}

    def fake_predict(wallet_features: dict[str, float], loaded_model: dp.WeightedCreditModel) -> int:
        captured_features.update(wallet_features)
        assert loaded_model == model
        return 612

    monkeypatch.setattr(dp, "_get_credit_model", lambda: model)
    monkeypatch.setattr(dp, "_predict_credit_score", fake_predict)

    result = dp.build_score_payload(ADDRESS, chains=["ethereum"])

    assert result.payload["score"] == 612
    assert captured_features["wallet_balance_usd"] == pytest.approx(4250.0)
    assert captured_features["transaction_count"] == pytest.approx(250.0)
    assert captured_features["nft_ownership_volume"] == pytest.approx(12.0)
    assert captured_features["account_age_days"] == pytest.approx(420.0)
    assert captured_features["token_diversity"] == pytest.approx(6.0)
