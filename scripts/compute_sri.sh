#!/usr/bin/env bash
set -euo pipefail

# compute_sri.sh
# Downloads a set of CDN JS files, computes sha384 SRI, and replaces PLACEHOLDERs
# in skeleton.html. Run from repository root: ./scripts/compute_sri.sh

TARGET_HTML="skeleton.html"
TMPDIR="$(mktemp -d)"

URLS=(
  "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js"
  "https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js"
  "https://cdnjs.cloudflare.com/ajax/libs/axios/0.21.4/axios.min.js"
  "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"
  "https://cdnjs.cloudflare.com/ajax/libs/validator/13.6.0/validator.min.js"
  "https://cdnjs.cloudflare.com/ajax/libs/sanitize-html/2.4.0/sanitize-html.min.js"
  "https://cdnjs.cloudflare.com/ajax/libs/js-cookie/2.2.1/js.cookie.min.js"
  "https://cdnjs.cloudflare.com/ajax/libs/secure-random/0.2.1/secure-random.min.js"
  "https://cdnjs.cloudflare.com/ajax/libs/owasp-password-strength-test/1.3.0/owasp-password-strength-test.min.js"
  "https://cdnjs.cloudflare.com/ajax/libs/owasp-samurai/1.0.0/owasp-samurai.min.js"
  "https://cdnjs.cloudflare.com/ajax/libs/owasp-encoder/1.2.2/owasp-encoder.min.js"
  "https://cdnjs.cloudflare.com/ajax/libs/owasp-mvc-security/1.0.0/owasp-mvc-security.min.js"
  "https://cdnjs.cloudflare.com/ajax/libs/owasp-esapi-js/2.2.0/owasp-esapi.min.js"
  "https://cdnjs.cloudflare.com/ajax/libs/owasp-antisamy/1.6.5/owasp-antisamy.min.js"
  "https://cdnjs.cloudflare.com/ajax/libs/owasp-csrfguard/4.0.0/owasp-csrfguard.min.js"
  "https://cdnjs.cloudflare.com/ajax/libs/owasp-headers/1.0.0/owasp-headers.min.js"
  "https://cdnjs.cloudflare.com/ajax/libs/owasp-logger/1.0.0/owasp-logger.min.js"
  "https://cdnjs.cloudflare.com/ajax/libs/owasp-java-html-sanitizer/20191001.1/owasp-java-html-sanitizer.min.js"
  "https://cdnjs.cloudflare.com/ajax/libs/owasp-java-encoder/1.2.2/owasp-java-encoder.min.js"
)

echo "Will compute SRI for ${#URLS[@]} files and patch $TARGET_HTML"
read -p "Proceed? (y/N) " -r
if [[ "$REPLY" != "y" && "$REPLY" != "Y" ]]; then
  echo "Aborted"
  exit 1
fi

for url in "${URLS[@]}"; do
  echo "Fetching: $url"
  out="$TMPDIR/$(basename "$url")"
  curl -sL -H 'Accept-Encoding: identity' "$url" -o "$out"
  if [[ ! -s "$out" ]]; then
    echo "Warning: download failed for $url" >&2
    continue
  fi
  hash=$(openssl dgst -sha384 -binary "$out" | openssl base64 -A)
  sri="sha384-$hash"
  echo "Computed: $sri"
  # Replace the placeholder or add integrity attribute for the matching script src
  python3 - <<PY
import re,sys
html_path='$TARGET_HTML'
with open(html_path,'r',encoding='utf-8') as f:
    s=f.read()
old = re.compile(r'(<script[^>]*src="%s"[^>]*?)integrity="[^"]*"' % re.escape('$url'))
if old.search(s):
    s = old.sub(r"\1integrity=\"%s\"" % ('$sri'), s)
else:
    # If script tag doesn't have integrity, insert before the closing '>' of the tag
    s = re.sub(r'(<script[^>]*src="%s"[^>]*)(>)' % re.escape('$url'), r"\1 integrity=\"%s\"\2" % ('$sri'), s)
with open(html_path,'w',encoding='utf-8') as f:
    f.write(s)
print('Patched', '$url')
PY

done

echo "Done. Review changes in $TARGET_HTML and commit when ready."
