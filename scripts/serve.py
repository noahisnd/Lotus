#!/usr/bin/env python3
"""Serve public/ the way Vercel will, for looking at the site locally.

`python3 -m http.server` serves the files but ignores vercel.json, so /faq, /terms
and the rest 404 locally while working in production — and the routing is the part
of this site most likely to be wrong. This applies the same redirects, rewrites
and trailing-slash rule from vercel.json, so what you see here is what ships.

    python3 scripts/serve.py            # http://localhost:4173
    python3 scripts/serve.py 8080
"""
import http.server
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG = json.load(open(os.path.join(ROOT, "vercel.json")))
PUBLIC = os.path.join(ROOT, CONFIG.get("outputDirectory", "public"))
REDIRECTS = {r["source"]: r for r in CONFIG.get("redirects", [])}
REWRITES = {r["source"]: r["destination"] for r in CONFIG.get("rewrites", [])}


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=PUBLIC, **kw)

    def route(self):
        path, _, query = self.path.partition("?")
        if CONFIG.get("trailingSlash") is False and len(path) > 1 and path.endswith("/"):
            return self.redirect(path.rstrip("/"), 308, query)
        if path in REDIRECTS:
            r = REDIRECTS[path]
            return self.redirect(r["destination"], 308 if r.get("permanent") else 307, "")
        if path in REWRITES:
            self.path = REWRITES[path] + ("?" + query if query else "")
        return False

    def redirect(self, to, code, query):
        self.send_response(code)
        self.send_header("Location", to + ("?" + query if query else ""))
        self.end_headers()
        return True

    def do_GET(self):
        if not self.route():
            super().do_GET()

    def do_HEAD(self):
        if not self.route():
            super().do_HEAD()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
    print(f"serving {PUBLIC} as Vercel would, on http://localhost:{port}")
    http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
