# EtherScore

> **On-chain credit intelligence dashboard** for EVM wallets.  
> FastAPI backend + React frontend + explainable score diagnostics.

![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-20232A?logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)

## Why EtherScore

Traditional credit rails miss users who are active on-chain. EtherScore transforms wallet behavior into a transparent credit-style score and a rich diagnostic view.

## What’s Live Now

- **FastAPI backend (`v2`)** with OpenAPI docs and structured error responses.
- **Multi-chain-ready scoring engine** (`ethereum`, `polygon`, `bsc`, `arbitrum`) with partial-failure handling.
- **Model-based score generation** using `credit_scoring_dataset.csv` and weighted feature calibration.
- **Rate limiting + request tracing** (`X-Request-ID`, `X-Process-Time-Ms`) for production-style observability.
- **Modern UI diagnostics** (speedometer, factor matrix, peer delta, percentile, risk regime, volatility).

## Scoring Inputs

The score is normalized into the **300–850** range using these weighted factors:

| Factor | Weight | Core Signal |
| --- | ---: | --- |
| Wallet Balance | 30% | Native + USDT value (USD) |
| Transaction History | 25% | Behavioral activity volume |
| NFT Holdings | 20% | NFT ownership depth |
| Account Age | 15% | Wallet longevity |
| Network Diversity | 10% | Cross-chain/token diversity |

Returned payloads also include `score_band`, `trust_level`, `risk_regime`, `average_score`, `peer_delta`, `percentile`, `summary`, `factors`, `featured_collections`, and `meta` telemetry.

## Architecture

```text
frontend (React + Vite)
	 │  POST /api/score
	 ▼
backend/main.py (FastAPI)
	 │  delegates scoring
	 ▼
backend/data_processing.py
	 ├─ RPC + explorer/NFT/price aggregation
	 ├─ credit model inference
	 └─ explainable factor payload assembly
```

## Project Structure

```text
backend/
	main.py                     # FastAPI app, middleware, endpoints, rate limit
	data_processing.py          # Multi-chain ingestion + model scoring
	credit_scoring_dataset.csv  # Training/reference dataset
	tests/
		test_api.py
		test_data_processing.py

frontend/
	src/
		App.jsx
		CreditScoreSpeedometer.jsx
		ScoreBreakdown.jsx
		ScoreAnalysis.jsx
		WalletSummary.jsx
```

## Quick Start

### 1) Prerequisites

- Python **3.10+**
- Node.js **18+**
- npm
- MetaMask (or compatible injected wallet)

### 2) Backend

From repo root:

```bash
pip install -r backend/requirements.txt
python backend/main.py --host 127.0.0.1 --port 8000
```

Health checks:

```bash
curl http://127.0.0.1:8000/api/health
curl "http://127.0.0.1:8000/api/chains?deep=true"
```

Interactive API docs:

```text
http://127.0.0.1:8000/docs
```

### 3) Frontend

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## API Snapshot

Base URL: `http://127.0.0.1:8000`

- `GET /api/health`
- `GET /api/health?deep=true`
- `GET /api/chains`
- `GET /api/chains?deep=true`
- `POST /api/score`
- `GET /api/score/{wallet_address}`

### Legacy-compatible request

```json
{
	"address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
}
```

### Extended multi-chain request

```json
{
	"address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
	"chains": ["ethereum", "polygon", "bsc", "arbitrum"]
}
```

## Environment Variables

### Backend essentials

| Variable | Purpose |
| --- | --- |
| `ETHERSCORE_HOST` | API bind host (default `127.0.0.1`) |
| `ETHERSCORE_PORT` | API bind port (default `8000`) |
| `ETHERSCORE_CORS_ORIGINS` | Allowed CORS origins (comma-separated or `*`) |
| `ETHERSCORE_RATE_LIMIT_PER_MINUTE` | Rate limit quota (default `60`) |
| `ETHERSCORE_RATE_LIMIT_WINDOW_SECONDS` | Rate limit window (default `60`) |

### Chain RPC configuration

Set at least one RPC endpoint:

- `ETHERSCORE_RPC_URL_ETHEREUM`
- `ETHERSCORE_RPC_URL_POLYGON`
- `ETHERSCORE_RPC_URL_BSC`
- `ETHERSCORE_RPC_URL_ARBITRUM`

Optional model/data tuning:

- `ETHERSCORE_CREDIT_MODEL_DATASET_PATH`
- `ETHERSCORE_CACHE_TTL_SECONDS`
- `ETHERSCORE_REQUEST_TIMEOUT_SECONDS`
- `ETHERSCORE_UPSTREAM_RETRY_COUNT`

### Frontend

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Backend API base URL | `http://127.0.0.1:8000` |

## Development & Tests

Backend tests:

```bash
pytest backend/tests -q
```

Frontend scripts:

```bash
cd frontend
npm run dev
npm run build
npm run preview
```

## License

MIT — see [LICENSE](LICENSE).
