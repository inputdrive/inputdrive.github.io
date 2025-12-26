#!/usr/bin/env python3
"""Helper: fetch a URL, compute SHA-384 SRI, and optionally patch a target HTML file.
Usage: python3 scripts/compute_sri.py --url <url> --file skeleton.html --apply
"""
import argparse
import hashlib
import base64
import sys
from urllib.request import Request, urlopen

def fetch(url):
    req = Request(url, headers={'Accept-Encoding':'identity','User-Agent':'sri-compute/1.0'})
    with urlopen(req) as r:
        return r.read()


def sri_sha384(data: bytes) -> str:
    h = hashlib.sha384()
    h.update(data)
    return 'sha384-' + base64.b64encode(h.digest()).decode('ascii')


def patch_file(path: str, url: str, sri: str):
    import re
    with open(path,'r',encoding='utf-8') as f:
        s = f.read()
    # Replace existing integrity attribute for this src or add it
    pattern = re.compile(r'(<script[^>]*src="%s"[^>]*?)integrity="[^"]*"' % re.escape(url))
    if pattern.search(s):
        s = pattern.sub(r"\1integrity=\"%s\"" % sri, s)
    else:
        s = re.sub(r'(<script[^>]*src="%s"[^>]*)(>)' % re.escape(url), r"\1 integrity=\"%s\"\2" % sri, s)
    with open(path,'w',encoding='utf-8') as f:
        f.write(s)


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--url', required=True)
    p.add_argument('--file', default='skeleton.html')
    p.add_argument('--apply', action='store_true')
    args = p.parse_args()
    try:
        data = fetch(args.url)
    except Exception as e:
        print('Fetch failed:', e, file=sys.stderr)
        sys.exit(2)
    sri = sri_sha384(data)
    print(args.url, sri)
    if args.apply:
        patch_file(args.file, args.url, sri)
        print('Patched', args.file)
