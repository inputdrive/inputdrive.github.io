# Input Drive Security

Independent security consulting site for **Greg Gutman**. The live domain is [inputdrivesecurity.us](https://inputdrivesecurity.us). Treat `inputdrivesecurity.com`, `www.inputdrivesecurity.com`, `inputdrivesecurity.net`, and old `/resume` URLs as outdated.

This is a person, not a company listing. The site exists to take **contract** (federal programs and primes) and **ad-hoc** (commercial, scoped) work inquiries.

## Contact

- Email: [info@inputdrivesecurity.us](mailto:info@inputdrivesecurity.us)
- WhatsApp: [+1 703 957 8321](https://wa.me/17039578321)

There is no sponsorship or Buy Me a Coffee flow.

## Run locally

The site is static HTML, CSS, and a little JavaScript. From this directory:

```bash
python3 -m http.server 43147 --bind 127.0.0.1
```

Then open `http://127.0.0.1:43147/`.

## Deploy

This tree is meant to replace the GitHub Pages root of `inputdrive/inputdrive.github.io`. Copy or merge onto that repository’s `main` branch. Keep the `CNAME` file (`inputdrivesecurity.us`).

## Privacy

No ads, no analytics, no third-party tracking. `localStorage` is used only for the light/dark theme preference. The contact form never posts to a server; it opens `mailto:` or WhatsApp on the visitor’s device.

## Pages

| Path | Role |
| --- | --- |
| `/` | Offer and two buyer tracks |
| `/services.html` | What can be hired |
| `/about.html` | Bio and profiles |
| `/contact.html` | Email + WhatsApp |
| `/tools.html` | Demos and lab links |

Older calculator and experiment URLs still resolve so existing bookmarks do not 404.
