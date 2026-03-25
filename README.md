# EtherScore

On-chain wallet credit scoring dashboard with a React frontend and a Python backend API.

EtherScore computes a wallet score from live Ethereum data (ETH + USDT balances, NFT holdings, transaction history, account age, and token diversity), then visualizes diagnostics in a modern UI.

## Table of Contents

- [Overview](#overview)
- [How Scoring Works](#how-scoring-works)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [License](#license)

## Overview

Traditional credit systems miss users who are financially active on-chain but invisible in legacy credit rails.

EtherScore addresses this by:

- Pulling wallet signals from public blockchain APIs.
- Computing a weighted score in the `300–850` range.
- Returning transparent factor-by-factor breakdowns.
- Displaying risk and trust diagnostics in a browser dashboard.

## How Scoring Works

Backend scoring currently uses five weighted factors:

| Factor | Weight | Signal |
| --- | ---: | --- |
| Wallet Balance | 30% | ETH + USDT value in USD |
| Transaction History | 25% | Transaction count |
| NFT Holdings | 20% | NFT ownership volume |
| Account Age | 15% | Estimated wallet age |
| Network Diversity | 10% | Token diversity |

The normalized weighted total is mapped into the `300–850` range, and the API also returns:

- `score_band` (e.g., Good, Very Good)
- `trust_level` (Low → High)
- `risk_regime` (Stable / Balanced / Watchlist)
- `summary`, `factors`, and `featured_collections`

## Tech Stack

### Frontend

- React 18 + Vite
- Tailwind CSS
- Chart.js / react-chartjs-2
- MetaMask integration (`@metamask/detect-provider`, `web3`)

### Backend

- Python 3 (standard-library HTTP server)
- JSON-RPC calls to Ethereum endpoints
- External APIs for ETH price, NFTs, ENS, and optional Etherscan fallback

## Project Structure

```text
backend/
	main.py                 # HTTP API server
	data_processing.py      # Wallet data fetch + scoring logic

frontend/
	src/
		App.jsx               # Main application flow
		CreditScoreSpeedometer.jsx
		WalletSummary.jsx
		ScoreBreakdown.jsx
		ScoreAnalysis.jsx
```

## Quick Start

### 1) Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- MetaMask (or another injected Ethereum provider)

### 2) Run Backend

From repository root:

```bash
python backend/main.py --host 127.0.0.1 --port 8000
```

Backend health check:

```bash
curl http://127.0.0.1:8000/api/health
```

### 3) Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Open: `http://localhost:5173`

If backend is not on `http://127.0.0.1:8000`, set:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

in `frontend/.env`.

## Environment Variables

### Backend (optional)

Set these in your shell before starting `backend/main.py`:

| Variable | Purpose | Default |
| --- | --- | --- |
| `ETHERSCORE_HOST` | API bind host | `127.0.0.1` |
| `ETHERSCORE_PORT` | API bind port | `8000` |
| `ETHERSCORE_RPC_URL` | Primary Ethereum RPC endpoint | unset |
| `ETHERSCORE_NFT_API_URL` | NFT ownership API | Alchemy demo endpoint |
| `ETHERSCORE_ENS_API_URL` | ENS resolution API | `https://api.ensideas.com/ens/resolve` |
| `ETHERSCORE_ETH_PRICE_API_URL` | ETH price feed | CoinGecko simple price endpoint |
| `ETHERSCORE_FALLBACK_ETH_PRICE_USD` | Fallback ETH price | `3000` |
| `ETHERSCORE_FALLBACK_NFT_FLOOR_USD` | Fallback NFT valuation | `120` |
| `ETHERSCORE_REQUEST_TIMEOUT_SECONDS` | Upstream timeout | `12` |
| `ETHERSCORE_CACHE_TTL_SECONDS` | Score payload cache TTL | `120` |
| `ETHERSCORE_HTTP_USER_AGENT` | User-Agent header | `EtherScoreBackend/2.0 (+local)` |
| `ETHERSCORE_ETHERSCAN_API_KEY` | Optional account-age fallback | unset |

### Frontend

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Backend API base URL | `http://127.0.0.1:8000` |

## API Reference

Base URL: `http://127.0.0.1:8000`

### `GET /api/health`

Returns server status.

### `POST /api/score`

Request body:

```json
{
	"address": "0x0000000000000000000000000000000000000000"
}
```

Response includes:

- `score`, `score_band`, `trust_level`, `risk_regime`
- `summary` (balances, counts, sources, volatility)
- `factors` (weight, score, trend, display value)
- `featured_collections`

### `GET /api/score/<wallet_address>`

Equivalent to `POST /api/score`, but wallet address is passed in the URL path.

### Error Behavior

- `400` for invalid addresses or malformed JSON.
- `502` when upstream providers fail (RPC/API unavailable).

## Troubleshooting

- **MetaMask not detected**: confirm extension is installed and unlocked.
- **Score request fails**: verify backend is running and `VITE_API_BASE_URL` is correct.
- **Frequent upstream errors**: set `ETHERSCORE_RPC_URL` to a reliable RPC provider key.
- **Slow responses**: external APIs may rate-limit demo endpoints; use production API keys where possible.

## Roadmap

- Add multi-chain support beyond Ethereum mainnet.
- Improve explainability with historical score snapshots.
- Introduce model calibration against larger wallet cohorts.

## License

MIT. See [LICENSE](LICENSE).
