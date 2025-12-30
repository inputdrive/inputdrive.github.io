#!/usr/bin/env python3
"""Helper: fetch a URL, compute SHA-384 SRI, and optionally patch a target HTML file.
Usage: python3 scripts/compute_sri.py --url <url> --file skeleton.html --apply
"""
import argparse
import os
import hashlib
import base64
import sys
import ipaddress
from urllib.request import Request, urlopen
from urllib.parse import urlparse

def fetch(url):
    # Validate URL scheme to prevent SSRF
    parsed = urlparse(url)
    if parsed.scheme not in ('http', 'https'):
        raise ValueError(f"Invalid URL scheme: {parsed.scheme}. Only http and https are allowed.")
    
    # SSRF Protection: Block private IP ranges and localhost
    hostname = parsed.hostname
    if not hostname:
        raise ValueError("URL must contain a valid hostname")
    
    # Block localhost and private IP ranges
    try:
        ip = ipaddress.ip_address(hostname)
        if ip.is_private or ip.is_loopback or ip.is_reserved or ip.is_link_local:
            raise ValueError(f"Access to private/local IP addresses is not allowed: {hostname}")
    except ValueError:
        # If it's not an IP address, check for localhost hostname
        if hostname.lower() in ('localhost', '127.0.0.1', '::1', '0.0.0.0'):
            raise ValueError(f"Access to localhost is not allowed: {hostname}")
    
    req = Request(url, headers={'Accept-Encoding':'identity','User-Agent':'sri-compute/1.0'})
    with urlopen(req, timeout=10) as r:
        return r.read()


def sri_sha384(data: bytes) -> str:
    h = hashlib.sha384()
    h.update(data)
    return 'sha384-' + base64.b64encode(h.digest()).decode('ascii')


def patch_file(path: str, url: str, sri: str):
    import re
    
    # Path Traversal Protection: Validate and sanitize file path before any use
    # First normalize the path to resolve any . or .. components
    normalized_path = os.path.normpath(path)
    
    # Reject any path containing ".." after normalization
    if ".." in normalized_path:
        raise ValueError(f"Path contains '..' which is not allowed: {path}")
    
    # Resolve to absolute path
    abs_path = os.path.abspath(normalized_path)
    allowed_dir = os.path.abspath(os.getcwd())
    
    # Ensure the resolved path is within the current working directory
    if not abs_path.startswith(allowed_dir + os.sep) and abs_path != allowed_dir:
        raise ValueError(f"Path traversal detected: {path} is outside allowed directory")
    
    # Ensure file has .html extension (check on absolute path)
    if not abs_path.endswith('.html'):
        raise ValueError(f"Only HTML files are allowed: {path}")
    
    # Verify file exists and is a file (not directory)
    if not os.path.isfile(abs_path):
        raise ValueError(f"Path must be an existing file: {path}")
    
    # Use the validated absolute path for all file operations
    # All validations passed: no "..", within allowed_dir, .html extension, exists as file
    with open(abs_path, 'r', encoding='utf-8') as f:  # Path validated above
        s = f.read()
    
    # Replace existing integrity attribute for this src or add it
    pattern = re.compile(r'(<script[^>]*src="%s"[^>]*?)integrity="[^"]*"' % re.escape(url))
    if pattern.search(s):
        s = pattern.sub(r"\1integrity=\"%s\"" % sri, s)
    else:
        s = re.sub(r'(<script[^>]*src="%s"[^>]*)(>)' % re.escape(url), r"\1 integrity=\"%s\"\2" % sri, s)
    
    # Use the validated absolute path for writing
    with open(abs_path, 'w', encoding='utf-8') as f:  # Path validated above
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
        try:
            patch_file(args.file, args.url, sri)
            print('Patched', args.file)
        except ValueError as e:
            print('Security error:', e, file=sys.stderr)
            sys.exit(3)