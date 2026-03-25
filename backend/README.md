# EtherScore Backend (FastAPI)

## Install
```bash
pip install -r backend/requirements.txt
```

## Configure
1. Copy `backend/.env.example` values into your shell or `.env`.
2. At minimum, configure at least one RPC URL:
   - `ETHERSCORE_RPC_URL_ETHEREUM`
   - `ETHERSCORE_RPC_URL_POLYGON`
   - `ETHERSCORE_RPC_URL_BSC`
   - `ETHERSCORE_RPC_URL_ARBITRUM`

If only Ethereum is configured, legacy frontend calls still work.

## Run
```bash
python backend/main.py --host 127.0.0.1 --port 8000
```

## Endpoints
- `GET /api/health`
- `GET /api/health?deep=true`
- `GET /api/chains`
- `GET /api/chains?deep=true`
- `POST /api/score`
- `GET /api/score/{wallet_address}`

## Legacy-Compatible Score Request
```json
{
  "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
}
```

## Extended Multi-Chain Score Request
```json
{
  "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "chains": ["ethereum", "polygon", "bsc", "arbitrum"]
}
```

## Test
```bash
pytest backend/tests -q
```
