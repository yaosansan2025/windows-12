#!/usr/bin/env python3
"""Check the published content, retrying while the Pages CDN propagates it."""
import hashlib
from pathlib import Path
import sys
import time
from urllib.error import URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

root = Path(__file__).resolve().parent.parent
base = sys.argv[1].rstrip('/') + '/'
if urlparse(base).scheme != 'https':
    raise SystemExit('Deployment checks require an HTTPS URL')
assets = ['index.html', 'manifest.webmanifest', 'sw.js', 'pwa/icon-192.png', 'pwa/icon-512.png']
for attempt in range(10):
    try:
        for name in ['', *assets]:
            expected = (root / (name or 'index.html')).read_bytes()
            url = urljoin(base, name) + '?verify=' + hashlib.sha256(expected).hexdigest()[:16]
            with urlopen(Request(url, headers={'Cache-Control': 'no-cache'}), timeout=20) as response:
                if response.status != 200 or response.read() != expected:
                    raise ValueError(f'Published {name or "homepage"} does not match this commit')
        print('Published homepage, service worker, manifest, and icons match this commit.')
        break
    except (URLError, TimeoutError, ValueError) as error:
        if attempt == 9:
            raise SystemExit(str(error))
        print(f'Waiting for Pages propagation: {error}', flush=True)
        time.sleep(5)
