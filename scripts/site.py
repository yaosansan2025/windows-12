#!/usr/bin/env python3
"""Sync static assets, verify standalone HTML, or stage a Pages artifact. No packages."""
import argparse
import hashlib
import json
from html.parser import HTMLParser
from pathlib import Path
import re
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ['index.html', 'manifest.webmanifest', 'sw.js', 'pwa/icon-192.png', 'pwa/icon-512.png']


class StandaloneHTML(HTMLParser):
    def __init__(self):
        super().__init__()
        self.scripts = []
        self.in_script = False
        self.ids = set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            if attrs['id'] in self.ids:
                raise ValueError(f'Duplicate HTML id: {attrs["id"]}')
            self.ids.add(attrs['id'])
        if tag == 'script':
            if 'src' in attrs:
                raise ValueError('Standalone HTML must not load an external script')
            self.in_script = True
            self.scripts.append('')
        if tag == 'link' and attrs.get('rel') == 'stylesheet':
            raise ValueError('Standalone HTML must inline its stylesheet')

    def handle_endtag(self, tag):
        if tag == 'script':
            self.in_script = False

    def handle_data(self, data):
        if self.in_script:
            self.scripts[-1] += data


def run():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Fail instead of changing generated assets')
    parser.add_argument('--output', type=Path, help='Stage the verified root site in this directory')
    args = parser.parse_args()
    html = StandaloneHTML()
    html.feed((ROOT / 'index.html').read_text())
    if not html.scripts:
        raise ValueError('Missing app script')
    for script in html.scripts:
        subprocess.run(['node', '--check', '-'], input=script, text=True, check=True)
    subprocess.run(['node', '--check', str(ROOT / 'sw.js')], check=True)
    json.loads((ROOT / 'manifest.webmanifest').read_text())

    worker = (ROOT / 'sw.js').read_text()
    template, count = re.subn(r"const CACHE = '[^']+';", "const CACHE = '__CONTENT_VERSION__';", worker, count=1)
    if count != 1:
        raise ValueError('Missing service worker cache version')
    digest = hashlib.sha256(template.encode())
    for name in ASSETS:
        if name != 'sw.js':
            digest.update(name.encode())
            digest.update((ROOT / name).read_bytes())
    expected_worker = template.replace('__CONTENT_VERSION__', 'windows-12-concept-' + digest.hexdigest()[:16])
    expected = {name: (expected_worker.encode() if name == 'sw.js' else (ROOT / name).read_bytes()) for name in ASSETS}
    stale = []
    if worker != expected_worker:
        stale.append('sw.js')
        if not args.check:
            (ROOT / 'sw.js').write_text(expected_worker)
    for name, data in expected.items():
        target = ROOT / 'windows12' / name
        if not target.exists() or target.read_bytes() != data:
            stale.append('windows12/' + name)
            if not args.check:
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(data)
    if stale and args.check:
        raise ValueError('Generated assets are stale: ' + ', '.join(stale) + '. Run python3 scripts/site.py')
    if args.output:
        target = args.output.resolve()
        if target == ROOT or ROOT.is_relative_to(target) or target.is_relative_to(ROOT):
            raise ValueError('Output must be outside the repository')
        target.mkdir(parents=True, exist_ok=True)
        for name in ASSETS:
            destination = target / name
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / name, destination)
    print('Standalone HTML and deployment assets verified.' if args.check else 'Deployment assets synchronized.')


if __name__ == '__main__':
    try:
        run()
    except (ValueError, subprocess.CalledProcessError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
