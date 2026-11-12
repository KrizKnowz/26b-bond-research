# Three-model bond price comparison

Data through **2026-09-25**. Evaluate **2026-03-02 onward** on 405,564 identical single-print targets.

The headline models are existing B3, P1 with prior-data calibration, and the same P1 plus a B3-style residual correction. P0 is an internal P1 construction step; earlier sector/rating and trading studies remain historical analyses.

`hybrid = fold-calibrated P1 + predicted(actual price - fold-calibrated P1)`

P1 is the sole price anchor with coefficient one. The correction uses the existing B3 non-ETF controls and bond fixed effects. No P0, last-price level, P1 level, B3 prediction, gap, sector/rating or separate ETF-return term enters the residual design matrix. OLS minimizes squared residuals in price points; the headline bps MAE is an evaluation metric, not its optimization objective.

## Availability and matched evaluation

Residual training begins 2026-01-02; January–February supply the initial two months and forecasts begin in March. Each monthly fit uses all eligible earlier outcomes, including training events without a saved B3 prediction. Evaluation still requires exact B3/P1/feature target matches.

For March, P1 spread and ETF-quality calibration end in February. For April, they end in March. From May onward the integrated anchor equals original saved P1 (spread calibration through March; quote-quality calibration through April). Every calibration and regression fit finishes before its evaluation month. Training anchors use parameters fitted within that fold's historical training sample: they are fitted inputs, not independently out-of-sample predictions. This two-stage training convention replaces the old July-start post-calibration-only correction.

Saved B3 forecasts are unchanged. The active standalone P1 now uses exactly the same prior-calibrated anchor as the integrated model in every forecast month. March–April P1 replaces the original retrospectively calibrated benchmark; from May the original calibration is available and P1 is unchanged. P1-to-integrated comparisons therefore isolate the residual correction throughout. Original P1 is retained only as archived_p1_price for provenance, not scored as the active benchmark. P0, half-spread and ETF-adjustment context use the matching fold calibration. Every scored target has identical CUSIP, event ID, timestamp and observed price across models. State and control observations precede each target strictly.

P1 fallbacks and unknown bond categories are retained and counted. The current labels are transaction prices, not direct latent fair-value observations.

## Results

| Model | Observations | MAE (bps) | RMSE (bps) | Bias (bps) |
|---|---:|---:|---:|---:|
| b3 | 405,564 | 20.939 | 56.918 | -0.338 |
| p1 | 405,564 | 19.685 | 56.338 | 0.336 |
| p1_b3 | 405,564 | 20.031 | 56.253 | 0.391 |

Errors are `10000 * (predicted / observed - 1)`. All three models retain every evaluated row; nonpositive forecasts are counted, not clipped or removed.

| Comparison | Date-block MAE difference (bps) | 95% interval |
|---|---:|---:|
| p1_b3 − p1 | 0.346 | [0.291, 0.398] |
| p1_b3 − b3 | -0.908 | [-1.105, -0.737] |
| p1 − b3 | -1.254 | [-1.445, -1.074] |

Date and bond bootstrap intervals are separate cluster analyses, not joint two-way intervals. This period has already been inspected and is not a fresh untouched holdout. Current ETF membership, Bloomberg sectors/ratings, and reconstructed fixed P1 betas remain retrospective research conventions. Sector/rating are descriptive error groups only.

## Artifacts

`predictions.parquet` contains the common evaluation rows and source/training timestamps. `metrics.csv`, `paired_comparisons.csv` and conditional error tables support the notebook. `fold_audit.csv` documents warm-up and availability. `models/*.joblib` retain fitted preprocessing and OLS state; verify their manifest checksum before loading, and use `model.predict_residual` for inference. `cases.csv` gives explicitly post-hoc diagnostic examples.
