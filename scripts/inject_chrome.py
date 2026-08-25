#!/usr/bin/env python3
"""Replace legacy headers/footers on inherited tool pages."""
from pathlib import Path
import re
from chrome_snippets import HEADER_HTML, FOOTER_HTML

ROOT = Path(__file__).resolve().parents[1]

PAGES = [
    "mortgage_calculator.html",
    "mortgage_calculator_advanced.html",
    "parsing_api.html",
    "security_tools.html",
    "AdBlockerTestPage.html",
    "basic.html",
    "random.html",
    "skeleton.html",
]

LAB = {
    "AdBlockerTestPage.html",
    "basic.html",
    "random.html",
    "skeleton.html",
}

ICON_LINK = '<link rel="icon" href="/assets/logo.svg" type="image/svg+xml">'
CSS_LINK = '<link rel="stylesheet" href="/stylesheet.css">'
NOINDEX = '<meta name="robots" content="noindex">'


def replace_header(html: str) -> str:
    html = re.sub(
        r'\s*<a href="#main-content"[^>]*>Skip to main content</a>\s*',
        "\n",
        html,
        count=1,
        flags=re.I,
    )
    new, n = re.subn(
        r"<header\b.*?</header>",
        HEADER_HTML.strip(),
        html,
        count=1,
        flags=re.I | re.S,
    )
    if n:
        return new
    return html.replace("<body>", "<body>\n" + HEADER_HTML, 1)


def replace_footer(html: str) -> str:
    html = re.sub(
        r'<script src="/scripts/theme\.js"[^>]*></script>\s*',
        "",
        html,
    )
    html = re.sub(
        r"<footer\b.*?</footer>",
        "",
        html,
        count=1,
        flags=re.I | re.S,
    )
    # Drop inline last-modified scripts; last-modified.js handles it.
    html = re.sub(
        r"<script>\s*\(function updateLastModified\(\)\{.*?</script>",
        "",
        html,
        flags=re.S,
    )
    html = html.replace("</body>", FOOTER_HTML + "\n</body>")
    return html


def ensure_head_bits(html: str, is_lab: bool) -> str:
    if 'rel="icon"' not in html:
        html = html.replace("</head>", f"    {ICON_LINK}\n</head>", 1)
    if "stylesheet.css" not in html:
        html = html.replace("</head>", f"    {CSS_LINK}\n</head>", 1)
    if is_lab and 'name="robots"' not in html:
        html = html.replace("</head>", f"    {NOINDEX}\n</head>", 1)
    return html


def tidy_links(html: str) -> str:
    html = html.replace("Back to Index", "Back to tools")
    html = html.replace('href="/index.html"', 'href="/tools.html"')
    # Keep brand home pointing at /
    html = html.replace('href="/" class="brand"', 'href="/" class="brand"')
    html = html.replace("Buy Me A Coffee removed", "")
    html = html.replace("© 2025 Input Drive Security", "© 2026 Greg Gutman")
    return html


def main() -> None:
    for name in PAGES:
        path = ROOT / name
        html = path.read_text(encoding="utf-8")
        html = replace_header(html)
        html = replace_footer(html)
        html = ensure_head_bits(html, name in LAB)
        html = tidy_links(html)
        # Point remaining "Index" nav leftovers
        html = html.replace(">Index</a>", ">Tools</a>")
        path.write_text(html, encoding="utf-8")
        print(f"patched {name}")


if __name__ == "__main__":
    main()
