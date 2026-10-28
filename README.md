# TemisChat Landing Page

Landing page for TemisChat, a desktop legal-intelligence workspace.

## Pages

- `index.html`: product, pilot scope, access and official downloads.
- `guia-copiloto-juridico.html`: educational guide and evaluation criteria.
- `seguranca.html`: implemented controls and publicly documented limitations.
- `privacidade.html`: website privacy notice and measurement behavior.
- `notas-de-versao.html`: live version, date and notes from the official release CDN.

## Run locally

This repository is a framework-free, responsive static site:

```sh
python3 -m http.server 8080
```

Open `http://localhost:8080`. Motion respects `prefers-reduced-motion`, no build step is required, and there are no external JavaScript dependencies.

`MEDICAO.md` documents the local `dataLayer` events and the manual Search Console/analytics setup. No analytics data leaves the browser in the current implementation.

## Release metadata

Downloads always use the official release CDN. The buttons are static links to
the versionless installers under `temischat/latest/`; on load the page reads
`latest.json` (live when the bucket CORS allows it, otherwise the packaged
fallback) to show version, build and date, and to append the build id to every
installer URL (`?v=<build>`). The query string matters because the filenames
never change: without it, a browser or edge cache can keep answering with the
installer from a previous release even after CI republishes the object.

Run `node sync-release.mjs` after every release to refresh
`assets/release-latest.json` — version, date, notes and the build id parsed from
the manifest notes. This fallback is what visitors see while the CDN manifest
is not readable cross-origin, so it must be regenerated before deploying.

The CDN must keep two properties (both enforced by the desktop release
workflow's mirror step):

- a CORS policy allowing `GET`/`HEAD` from `https://temischat.com` and
  `https://www.temischat.com` (plus localhost for development), so the browser
  can read `latest.json`;
- `Cache-Control: no-cache, must-revalidate` on `temischat/latest/*`. Those
  names are reused by every release, unlike the per-build archive under
  `temischat/<version>-<commit>/`, which stays immutable.

