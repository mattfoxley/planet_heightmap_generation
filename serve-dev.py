#!/usr/bin/env python3
"""Dev server for World Orogen.

Serves the app over HTTP with a THREADED handler. This matters: the app's generator runs in a
`type:"module"` Web Worker whose ES-module import graph is fetched concurrently with the main page.
Python's default `python -m http.server` is single-threaded and DEADLOCKS on that concurrency (the
worker script hangs "pending" and the Generate button sits on "Building..." forever). ThreadingHTTPServer
avoids it.

Usage:  python serve-dev.py [port]      (default port 8080)
Then open:  http://127.0.0.1:8080/       (defaults to the compact-40km profile)
            http://127.0.0.1:8080/?profile=legacy   (original Earth-scale behavior)
"""
import sys, os
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
root = os.path.dirname(os.path.abspath(__file__))
handler = partial(SimpleHTTPRequestHandler, directory=root)
srv = ThreadingHTTPServer(("127.0.0.1", port), handler)
print(f"World Orogen dev server: http://127.0.0.1:{port}/  (compact-40km by default)")
print("Ctrl-C to stop.")
srv.serve_forever()
