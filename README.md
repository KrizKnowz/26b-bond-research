# 26B Bond Research — public results

An interactive, read-only GitHub Pages snapshot of the corporate-bond price-prediction research website.

**Data through 2026-09-25.** The default comparison uses 336,904 identical out-of-sample trades from 2026-03-02 through 2026-09-25. The archive contains 405,564 saved three-model observations and 1,617 bond reference records.

## Features

- Previous-price regression (B3), ETF-adjusted fair value (P1), and ETF-adjusted fair value + regression (P1 → B3).
- Date/time and sector/rating/liquidity/ETF filters; daily errors, individual bond prices and bucket comparisons.
- The latest saved walk-forward regression experiment, fitted coefficients, fold audits, predictions and downloadable artifacts.
- Complete filtered CSV exports computed in the browser. CSV.gz files contain complete saved lab predictions.

This deployment does **not** fit new models. Run the original Python application to create new experiments, then export a new snapshot.

## Data and interpretation

Real bond-level prices, model predictions and reference fields were explicitly approved for this public snapshot. This repository does not contain the private research repository's history, raw Bloomberg workbooks, raw TRACE archives, credentials or training panels. Publication does not grant a license to redistribute third-party data. No third-party-data license is conferred by this repository.

Prices are historical transaction-price estimates, not live quotes. Reference classifications are retrospective. The saved baselines assume execution-time availability of earlier TRACE observations. Gaps and errors do not represent trading returns.

The default sample is pinned to `experiment_7336a922c98f57571e6e` and verified against `dashboard_f7c9436738cf7088f55a`. Date/time filters narrow this same held-out sample; wider target times do not fabricate forecasts beyond it. The broader saved population is available through the data files for reproducibility.

## Serve locally

```sh
python3 -m http.server 8080
```

Open http://localhost:8080. Hosting also works under a repository subpath. A modern browser with Web Workers and DecompressionStream is required. There are no external scripts, analytics or backend credentials.

## Publish and refresh

GitHub Settings → Pages → deploy from `main`, `/` (root). `.nojekyll` preserves the static files.

The maintained private project creates this checkout with:

```sh
python3 scripts/corporate_bonds/export_public_dashboard.py --destination /path/to/26b-bond-research --include-real-data
```

Review the exported files, run `npm test`, commit and push. Model metrics are computed from the published rows; `data/manifest.json` records chunk checksums and the pinned experiment. The public export intentionally includes data needed by the website, with source reports kept distinct from its filtered cohort.
