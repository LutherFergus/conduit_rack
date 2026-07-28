#!/usr/bin/env python3
"""Simple local static server for Conduit Rack Calculator PWA.

Usage:
  python serve.py

Open: http://127.0.0.1:8000/
LAN:  http://<this-pc-ip>:8000/
"""
from __future__ import annotations

import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PORT = int(os.environ.get("PORT", "8000"))
BIND = os.environ.get("BIND", "0.0.0.0")


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main():
    os.chdir(ROOT)
    server = ThreadingHTTPServer((BIND, PORT), Handler)
    print("Conduit Rack Calculator")
    print(f"  Root: {ROOT}")
    print(f"  URL:  http://127.0.0.1:{PORT}/")
    print(f"  Bind: {BIND}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
