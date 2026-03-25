from __future__ import annotations

import argparse
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from urllib.parse import urlparse

try:
    from .data_processing import build_score_payload
except ImportError:
    from data_processing import build_score_payload


class EtherScoreAPIHandler(BaseHTTPRequestHandler):
    server_version = "EtherScoreAPI/1.0"

    def do_OPTIONS(self) -> None:
        self._send_json(HTTPStatus.NO_CONTENT, {})

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"

        if path in {"/", "/api"}:
            self._send_json(
                HTTPStatus.OK,
                {
                    "service": "EtherScore backend",
                    "status": "ok",
                    "endpoints": {
                        "health": "GET /api/health",
                        "score_post": "POST /api/score",
                        "score_get": "GET /api/score/<wallet_address>",
                    },
                },
            )
            return

        if path == "/api/health":
            self._send_json(HTTPStatus.OK, {"status": "ok"})
            return

        if path.startswith("/api/score/"):
            address = path.split("/api/score/", 1)[1]
            self._handle_score_request(address)
            return

        self._send_json(HTTPStatus.NOT_FOUND, {"error": "Route not found."})

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"

        if path != "/api/score":
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "Route not found."})
            return

        payload = self._read_json_body()
        address = str(payload.get("address", "")).strip()
        self._handle_score_request(address)

    def log_message(self, format: str, *args: object) -> None:
        return

    def _handle_score_request(self, address: str) -> None:
        if not address:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Request body must include an address field."})
            return

        try:
            result = build_score_payload(address)
        except ValueError as exc:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": str(exc)})
            return

        self._send_json(HTTPStatus.OK, result)

    def _read_json_body(self) -> dict[str, object]:
        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length <= 0:
            return {}

        raw_body = self.rfile.read(content_length)
        if not raw_body:
            return {}

        try:
            return json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Request body must be valid JSON."})
            return {}

    def _send_json(self, status: HTTPStatus, payload: dict[str, object]) -> None:
        body = b"" if status == HTTPStatus.NO_CONTENT else json.dumps(payload).encode("utf-8")
        self.send_response(status.value)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()

        if body:
            self.wfile.write(body)


def run_server(host: str, port: int) -> None:
    server = ThreadingHTTPServer((host, port), EtherScoreAPIHandler)
    print(f"EtherScore backend listening on http://{host}:{port}")
    print("Available routes: GET /api/health, POST /api/score, GET /api/score/<wallet_address>")
    server.serve_forever()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the EtherScore backend API.")
    parser.add_argument("--host", default=os.getenv("ETHERSCORE_HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=int(os.getenv("ETHERSCORE_PORT", "8000")))
    return parser.parse_args()


if __name__ == "__main__":
    arguments = parse_args()
    run_server(arguments.host, arguments.port)
