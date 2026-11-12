# Do gap diagnostics improve bond-price prediction?

This study adds a chronological gap-based correction after each of the three saved price models. It evaluates future transaction-price accuracy, not execution profitability or directly observed latent fair value.

Completed run: gap_adjustment_48baf4fab2f4858fe4f8.

Previous-price regression: the development-selected policy reduces assessment MAE from 19.037 to 19.013 bp (change -0.024 bp; 131,788 identical target trades).

ETF-adjusted fair value: the development-selected policy leaves unchanged assessment MAE from 17.990 to 17.990 bp (change +0.000 bp; 131,788 identical target trades).

ETF-adjusted fair value + regression: the development-selected policy reduces assessment MAE from 18.221 to 18.164 bp (change -0.058 bp; 131,788 identical target trades).

## Assessment against unchanged models

Negative MAE change favors the added correction. The selected specification and strength come from development data; the assessment is not used to pick a winner.

| model | n | baseline mae · bp | adjusted mae · bp | mae change · bp | mae reduction percent | baseline rmse · bp | adjusted rmse · bp |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Previous-price regression | 131,788 | 19.037 | 19.013 | -0.024 | 0.129 | 68.163 | 68.177 |
| ETF-adjusted fair value | 131,788 | 17.990 | 17.990 | 0.000 | 0.000 | 68.148 | 68.148 |
| ETF-adjusted fair value + regression | 131,788 | 18.221 | 18.164 | -0.058 | 0.318 | 67.691 | 67.642 |

![Assessment against unchanged models](figures/assessment_comparison.png)

## Chronological experiment design

Saved baseline forecasts begin in March. Earlier out-of-sample gaps, including March–April initialization, supply the added layer's training history. Monthly corrected forecasts begin in May. May–June determine the specification and strength; the choice is frozen before July–September assessment. Coefficients and permitted historical state may update using earlier available observations, while the selection rule stays fixed. July–September has already been inspected in this project, so this is a retrospective chronological assessment rather than an untouched holdout.

| model | variant | candidate id | alpha | strength | development mae · bp | baseline development mae · bp | reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Previous-price regression | Residual regression | residual_ridge_a1000_s0.5 | 1,000.000 | 0.500 | 18.948 | 18.985 | Lowest development MAE among admissible candidates |
| ETF-adjusted fair value | Unchanged baseline | base | — | 0.000 | 17.990 | 17.990 | No candidate passed development MAE/RMSE guards |
| ETF-adjusted fair value + regression | Historical bond bias | bond_bias_s0.5 | — | 0.500 | 18.249 | 18.315 | Lowest development MAE among admissible candidates |

Each original model and its adjusted variants are scored on identical target trades. A current trade can change only later predictions once that trade is available. A large gap is not automatically a reversal probability. The correction learns forecast error remaining after the baseline's own normal updates. Those updates may already absorb some of the earlier trade, so repeatedly applying its full gap can overcorrect the price.

The research uses the pinned dashboard's full common-model cohort in the core session (10:00 inclusive to 15:30 exclusive, US Eastern). It does not inherit the latest regression-lab experiment's evaluation-trade subset. Scores can therefore differ from a filtered overview or lab run even when they refer to the same baseline model.

Gap = 10,000 × log(observed / baseline). Adjusted price = baseline × exp(predicted persistent gap / 10,000). Reported price error = 10,000 × (predicted / observed − 1). Consequently gap and price-error signs are opposite. MAE pools individual trade errors; it is not an unweighted mean of daily or monthly scores.

Development selection requires at least a 0.02 bp reduction in pooled MAE and RMSE no more than 1% above the unchanged baseline. When no candidate meets both conditions, the baseline is retained. Regression targets are clipped to ±200 log bp and the final applied correction is capped at ±100 log bp. These constraints limit extreme corrections; they do not establish that the true fair value lies inside the cap.

## All development alternatives

Unsuccessful alternatives remain visible. Candidate results on these selection observations are descriptive development evidence, not independent confirmation.

| model | variant | candidate id | alpha | strength | n | bonds | mae · bp | rmse · bp | bias · bp | p95 absolute · bp | bond equal mae · bp |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Previous-price regression | Unchanged baseline | base | — | 0.000 | 97,338 | 1,485 | 18.985 | 51.190 | -1.105 | 57.225 | 20.744 |
| Previous-price regression | Previous-gap correction | last_gap_s0.25 | — | 0.250 | 97,338 | 1,485 | 19.228 | 51.598 | -0.792 | 57.225 | 20.888 |
| Previous-price regression | Previous-gap correction | last_gap_s0.5 | — | 0.500 | 97,338 | 1,485 | 20.761 | 53.260 | -0.473 | 62.615 | 22.386 |
| Previous-price regression | Previous-gap correction | last_gap_s1 | — | 1.000 | 97,338 | 1,485 | 25.382 | 56.819 | -0.066 | 77.283 | 27.050 |
| Previous-price regression | Historical bond bias | bond_bias_s0.25 | — | 0.250 | 97,338 | 1,485 | 18.968 | 51.167 | -0.843 | 57.079 | 20.737 |
| Previous-price regression | Historical bond bias | bond_bias_s0.5 | — | 0.500 | 97,338 | 1,485 | 18.991 | 51.172 | -0.580 | 56.967 | 20.777 |
| Previous-price regression | Historical bond bias | bond_bias_s1 | — | 1.000 | 97,338 | 1,485 | 19.141 | 51.264 | -0.055 | 57.417 | 20.987 |
| Previous-price regression | Historical bucket bias | bucket_bias_s0.25 | — | 0.250 | 97,338 | 1,485 | 18.975 | 51.181 | -0.829 | 57.058 | 20.736 |
| Previous-price regression | Historical bucket bias | bucket_bias_s0.5 | — | 0.500 | 97,338 | 1,485 | 18.978 | 51.177 | -0.553 | 57.004 | 20.741 |
| Previous-price regression | Historical bucket bias | bucket_bias_s1 | — | 1.000 | 97,338 | 1,485 | 19.023 | 51.188 | 0.000 | 57.175 | 20.787 |
| Previous-price regression | Residual regression | residual_ridge_a10_s0.5 | 10.000 | 0.500 | 97,338 | 1,485 | 18.948 | 51.172 | -0.780 | 57.086 | 20.674 |
| Previous-price regression | Residual regression | residual_ridge_a10_s1 | 10.000 | 1.000 | 97,338 | 1,485 | 18.988 | 51.223 | -0.454 | 56.765 | 20.681 |
| Previous-price regression | Residual regression | residual_ridge_a100_s0.5 | 100.000 | 0.500 | 97,338 | 1,485 | 18.948 | 51.171 | -0.780 | 57.087 | 20.674 |
| Previous-price regression | Residual regression | residual_ridge_a100_s1 | 100.000 | 1.000 | 97,338 | 1,485 | 18.987 | 51.223 | -0.454 | 56.762 | 20.681 |
| Previous-price regression | Residual regression | residual_ridge_a1000_s0.5 | 1,000.000 | 0.500 | 97,338 | 1,485 | 18.948 | 51.170 | -0.777 | 57.113 | 20.674 |
| Previous-price regression | Residual regression | residual_ridge_a1000_s1 | 1,000.000 | 1.000 | 97,338 | 1,485 | 18.984 | 51.219 | -0.449 | 56.689 | 20.679 |
| Previous-price regression | Abnormal-gap residual regression | abnormal_gap_ridge_a10_s0.5 | 10.000 | 0.500 | 97,338 | 1,485 | 18.966 | 51.196 | -0.994 | 57.033 | 20.700 |
| Previous-price regression | Abnormal-gap residual regression | abnormal_gap_ridge_a10_s1 | 10.000 | 1.000 | 97,338 | 1,485 | 18.963 | 51.239 | -0.883 | 56.693 | 20.673 |
| Previous-price regression | Abnormal-gap residual regression | abnormal_gap_ridge_a100_s0.5 | 100.000 | 0.500 | 97,338 | 1,485 | 18.966 | 51.196 | -0.994 | 57.031 | 20.700 |
| Previous-price regression | Abnormal-gap residual regression | abnormal_gap_ridge_a100_s1 | 100.000 | 1.000 | 97,338 | 1,485 | 18.963 | 51.239 | -0.883 | 56.693 | 20.673 |
| Previous-price regression | Abnormal-gap residual regression | abnormal_gap_ridge_a1000_s0.5 | 1,000.000 | 0.500 | 97,338 | 1,485 | 18.966 | 51.196 | -0.995 | 57.031 | 20.700 |
| Previous-price regression | Abnormal-gap residual regression | abnormal_gap_ridge_a1000_s1 | 1,000.000 | 1.000 | 97,338 | 1,485 | 18.963 | 51.237 | -0.885 | 56.675 | 20.673 |
| Previous-price regression | Development-selected policy | residual_ridge_a1000_s0.5 | 1,000.000 | 0.500 | 97,338 | 1,485 | 18.948 | 51.170 | -0.777 | 57.113 | 20.674 |
| ETF-adjusted fair value | Unchanged baseline | base | — | 0.000 | 97,338 | 1,485 | 17.990 | 51.679 | 0.386 | 54.090 | 19.546 |
| ETF-adjusted fair value | Previous-gap correction | last_gap_s0.25 | — | 0.250 | 97,338 | 1,485 | 18.534 | 52.176 | 0.351 | 55.878 | 20.209 |
| ETF-adjusted fair value | Previous-gap correction | last_gap_s0.5 | — | 0.500 | 97,338 | 1,485 | 20.077 | 53.824 | 0.322 | 61.269 | 21.965 |
| ETF-adjusted fair value | Previous-gap correction | last_gap_s1 | — | 1.000 | 97,338 | 1,485 | 24.396 | 57.196 | 0.090 | 76.773 | 26.496 |
| ETF-adjusted fair value | Historical bond bias | bond_bias_s0.25 | — | 0.250 | 97,338 | 1,485 | 17.983 | 51.650 | 0.337 | 54.018 | 19.543 |
| ETF-adjusted fair value | Historical bond bias | bond_bias_s0.5 | — | 0.500 | 97,338 | 1,485 | 18.007 | 51.646 | 0.287 | 53.990 | 19.587 |
| ETF-adjusted fair value | Historical bond bias | bond_bias_s1 | — | 1.000 | 97,338 | 1,485 | 18.145 | 51.710 | 0.188 | 54.838 | 19.806 |
| ETF-adjusted fair value | Historical bucket bias | bucket_bias_s0.25 | — | 0.250 | 97,338 | 1,485 | 17.989 | 51.679 | 0.367 | 54.105 | 19.541 |
| ETF-adjusted fair value | Historical bucket bias | bucket_bias_s0.5 | — | 0.500 | 97,338 | 1,485 | 17.993 | 51.682 | 0.348 | 54.124 | 19.544 |
| ETF-adjusted fair value | Historical bucket bias | bucket_bias_s1 | — | 1.000 | 97,338 | 1,485 | 18.023 | 51.696 | 0.311 | 54.094 | 19.569 |
| ETF-adjusted fair value | Residual regression | residual_ridge_a10_s0.5 | 10.000 | 0.500 | 97,338 | 1,485 | 17.985 | 51.666 | 0.713 | 53.985 | 19.536 |
| ETF-adjusted fair value | Residual regression | residual_ridge_a10_s1 | 10.000 | 1.000 | 97,338 | 1,485 | 18.041 | 51.692 | 1.039 | 54.393 | 19.587 |
| ETF-adjusted fair value | Residual regression | residual_ridge_a100_s0.5 | 100.000 | 0.500 | 97,338 | 1,485 | 17.985 | 51.665 | 0.712 | 53.984 | 19.536 |
| ETF-adjusted fair value | Residual regression | residual_ridge_a100_s1 | 100.000 | 1.000 | 97,338 | 1,485 | 18.041 | 51.692 | 1.039 | 54.386 | 19.587 |
| ETF-adjusted fair value | Residual regression | residual_ridge_a1000_s0.5 | 1,000.000 | 0.500 | 97,338 | 1,485 | 17.985 | 51.665 | 0.710 | 53.974 | 19.536 |
| ETF-adjusted fair value | Residual regression | residual_ridge_a1000_s1 | 1,000.000 | 1.000 | 97,338 | 1,485 | 18.038 | 51.690 | 1.033 | 54.378 | 19.584 |
| ETF-adjusted fair value | Abnormal-gap residual regression | abnormal_gap_ridge_a10_s0.5 | 10.000 | 0.500 | 97,338 | 1,485 | 17.993 | 51.678 | 0.469 | 54.176 | 19.548 |
| ETF-adjusted fair value | Abnormal-gap residual regression | abnormal_gap_ridge_a10_s1 | 10.000 | 1.000 | 97,338 | 1,485 | 18.001 | 51.689 | 0.552 | 54.276 | 19.556 |
| ETF-adjusted fair value | Abnormal-gap residual regression | abnormal_gap_ridge_a100_s0.5 | 100.000 | 0.500 | 97,338 | 1,485 | 17.993 | 51.678 | 0.469 | 54.171 | 19.548 |
| ETF-adjusted fair value | Abnormal-gap residual regression | abnormal_gap_ridge_a100_s1 | 100.000 | 1.000 | 97,338 | 1,485 | 18.001 | 51.689 | 0.552 | 54.255 | 19.556 |
| ETF-adjusted fair value | Abnormal-gap residual regression | abnormal_gap_ridge_a1000_s0.5 | 1,000.000 | 0.500 | 97,338 | 1,485 | 17.993 | 51.678 | 0.468 | 54.137 | 19.549 |
| ETF-adjusted fair value | Abnormal-gap residual regression | abnormal_gap_ridge_a1000_s1 | 1,000.000 | 1.000 | 97,338 | 1,485 | 18.001 | 51.689 | 0.551 | 54.278 | 19.556 |
| ETF-adjusted fair value | Development-selected policy | base | — | 0.000 | 97,338 | 1,485 | 17.990 | 51.679 | 0.386 | 54.090 | 19.546 |
| ETF-adjusted fair value + regression | Unchanged baseline | base | — | 0.000 | 97,338 | 1,485 | 18.315 | 51.421 | 0.550 | 55.068 | 19.872 |
| ETF-adjusted fair value + regression | Previous-gap correction | last_gap_s0.25 | — | 0.250 | 97,338 | 1,485 | 18.632 | 51.830 | 0.476 | 56.309 | 20.292 |
| ETF-adjusted fair value + regression | Previous-gap correction | last_gap_s0.5 | — | 0.500 | 97,338 | 1,485 | 20.008 | 53.418 | 0.409 | 60.890 | 21.868 |
| ETF-adjusted fair value + regression | Previous-gap correction | last_gap_s1 | — | 1.000 | 97,338 | 1,485 | 24.202 | 56.695 | 0.097 | 75.845 | 26.259 |
| ETF-adjusted fair value + regression | Historical bond bias | bond_bias_s0.25 | — | 0.250 | 97,338 | 1,485 | 18.264 | 51.384 | 0.428 | 54.996 | 19.844 |
| ETF-adjusted fair value + regression | Historical bond bias | bond_bias_s0.5 | — | 0.500 | 97,338 | 1,485 | 18.249 | 51.375 | 0.307 | 55.023 | 19.863 |
| ETF-adjusted fair value + regression | Historical bond bias | bond_bias_s1 | — | 1.000 | 97,338 | 1,485 | 18.328 | 51.441 | 0.064 | 55.151 | 20.033 |
| ETF-adjusted fair value + regression | Historical bucket bias | bucket_bias_s0.25 | — | 0.250 | 97,338 | 1,485 | 18.306 | 51.414 | 0.459 | 54.994 | 19.861 |
| ETF-adjusted fair value + regression | Historical bucket bias | bucket_bias_s0.5 | — | 0.500 | 97,338 | 1,485 | 18.305 | 51.412 | 0.368 | 55.100 | 19.859 |
| ETF-adjusted fair value + regression | Historical bucket bias | bucket_bias_s1 | — | 1.000 | 97,338 | 1,485 | 18.332 | 51.421 | 0.185 | 55.217 | 19.881 |
| ETF-adjusted fair value + regression | Residual regression | residual_ridge_a10_s0.5 | 10.000 | 0.500 | 97,338 | 1,485 | 18.266 | 51.398 | 0.374 | 55.049 | 19.829 |
| ETF-adjusted fair value + regression | Residual regression | residual_ridge_a10_s1 | 10.000 | 1.000 | 97,338 | 1,485 | 18.286 | 51.427 | 0.199 | 55.122 | 19.852 |
| ETF-adjusted fair value + regression | Residual regression | residual_ridge_a100_s0.5 | 100.000 | 0.500 | 97,338 | 1,485 | 18.266 | 51.398 | 0.374 | 55.065 | 19.829 |
| ETF-adjusted fair value + regression | Residual regression | residual_ridge_a100_s1 | 100.000 | 1.000 | 97,338 | 1,485 | 18.286 | 51.426 | 0.199 | 55.136 | 19.852 |
| ETF-adjusted fair value + regression | Residual regression | residual_ridge_a1000_s0.5 | 1,000.000 | 0.500 | 97,338 | 1,485 | 18.266 | 51.398 | 0.375 | 55.077 | 19.828 |
| ETF-adjusted fair value + regression | Residual regression | residual_ridge_a1000_s1 | 1,000.000 | 1.000 | 97,338 | 1,485 | 18.284 | 51.425 | 0.201 | 55.128 | 19.850 |
| ETF-adjusted fair value + regression | Abnormal-gap residual regression | abnormal_gap_ridge_a10_s0.5 | 10.000 | 0.500 | 97,338 | 1,485 | 18.309 | 51.421 | 0.617 | 55.081 | 19.856 |
| ETF-adjusted fair value + regression | Abnormal-gap residual regression | abnormal_gap_ridge_a10_s1 | 10.000 | 1.000 | 97,338 | 1,485 | 18.315 | 51.446 | 0.683 | 55.151 | 19.856 |
| ETF-adjusted fair value + regression | Abnormal-gap residual regression | abnormal_gap_ridge_a100_s0.5 | 100.000 | 0.500 | 97,338 | 1,485 | 18.309 | 51.421 | 0.617 | 55.107 | 19.856 |
| ETF-adjusted fair value + regression | Abnormal-gap residual regression | abnormal_gap_ridge_a100_s1 | 100.000 | 1.000 | 97,338 | 1,485 | 18.315 | 51.446 | 0.683 | 55.159 | 19.856 |
| ETF-adjusted fair value + regression | Abnormal-gap residual regression | abnormal_gap_ridge_a1000_s0.5 | 1,000.000 | 0.500 | 97,338 | 1,485 | 18.309 | 51.421 | 0.616 | 55.121 | 19.856 |
| ETF-adjusted fair value + regression | Abnormal-gap residual regression | abnormal_gap_ridge_a1000_s1 | 1,000.000 | 1.000 | 97,338 | 1,485 | 18.315 | 51.446 | 0.682 | 55.159 | 19.856 |
| ETF-adjusted fair value + regression | Development-selected policy | bond_bias_s0.5 | — | 0.500 | 97,338 | 1,485 | 18.249 | 51.375 | 0.307 | 55.023 | 19.863 |

## All assessment alternatives

Only the development-frozen selection is the primary correction comparison. The remaining candidate rows are sensitivities and must not be used to redefine the winner after seeing assessment performance.

| model | variant | candidate id | alpha | strength | n | bonds | mae · bp | rmse · bp | bias · bp | p95 absolute · bp | bond equal mae · bp |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Previous-price regression | Unchanged baseline | base | — | 0.000 | 131,788 | 1,526 | 19.037 | 68.163 | -0.006 | 56.298 | 21.920 |
| Previous-price regression | Previous-gap correction | last_gap_s0.25 | — | 0.250 | 131,788 | 1,526 | 19.348 | 68.479 | 0.052 | 56.910 | 22.189 |
| Previous-price regression | Previous-gap correction | last_gap_s0.5 | — | 0.500 | 131,788 | 1,526 | 20.921 | 69.730 | 0.116 | 62.452 | 23.730 |
| Previous-price regression | Previous-gap correction | last_gap_s1 | — | 1.000 | 131,788 | 1,526 | 25.550 | 72.487 | 0.089 | 77.752 | 28.264 |
| Previous-price regression | Historical bond bias | bond_bias_s0.25 | — | 0.250 | 131,788 | 1,526 | 19.028 | 68.134 | 0.137 | 56.378 | 21.911 |
| Previous-price regression | Historical bond bias | bond_bias_s0.5 | — | 0.500 | 131,788 | 1,526 | 19.042 | 68.118 | 0.281 | 56.537 | 21.925 |
| Previous-price regression | Historical bond bias | bond_bias_s1 | — | 1.000 | 131,788 | 1,526 | 19.138 | 68.122 | 0.568 | 56.749 | 22.025 |
| Previous-price regression | Historical bucket bias | bucket_bias_s0.25 | — | 0.250 | 131,788 | 1,526 | 19.039 | 68.160 | 0.133 | 56.276 | 21.923 |
| Previous-price regression | Historical bucket bias | bucket_bias_s0.5 | — | 0.500 | 131,788 | 1,526 | 19.048 | 68.160 | 0.272 | 56.357 | 21.932 |
| Previous-price regression | Historical bucket bias | bucket_bias_s1 | — | 1.000 | 131,788 | 1,526 | 19.085 | 68.165 | 0.549 | 56.423 | 21.969 |
| Previous-price regression | Residual regression | residual_ridge_a10_s0.5 | 10.000 | 0.500 | 131,788 | 1,526 | 19.013 | 68.178 | 0.443 | 56.487 | 21.881 |
| Previous-price regression | Residual regression | residual_ridge_a10_s1 | 10.000 | 1.000 | 131,788 | 1,526 | 19.038 | 68.224 | 0.893 | 56.472 | 21.888 |
| Previous-price regression | Residual regression | residual_ridge_a100_s0.5 | 100.000 | 0.500 | 131,788 | 1,526 | 19.013 | 68.178 | 0.443 | 56.487 | 21.881 |
| Previous-price regression | Residual regression | residual_ridge_a100_s1 | 100.000 | 1.000 | 131,788 | 1,526 | 19.038 | 68.224 | 0.893 | 56.474 | 21.888 |
| Previous-price regression | Residual regression | residual_ridge_a1000_s0.5 | 1,000.000 | 0.500 | 131,788 | 1,526 | 19.013 | 68.177 | 0.443 | 56.485 | 21.881 |
| Previous-price regression | Residual regression | residual_ridge_a1000_s1 | 1,000.000 | 1.000 | 131,788 | 1,526 | 19.038 | 68.223 | 0.892 | 56.480 | 21.887 |
| Previous-price regression | Abnormal-gap residual regression | abnormal_gap_ridge_a10_s0.5 | 10.000 | 0.500 | 131,788 | 1,526 | 19.025 | 68.163 | 0.084 | 56.296 | 21.897 |
| Previous-price regression | Abnormal-gap residual regression | abnormal_gap_ridge_a10_s1 | 10.000 | 1.000 | 131,788 | 1,526 | 19.022 | 68.177 | 0.174 | 56.247 | 21.883 |
| Previous-price regression | Abnormal-gap residual regression | abnormal_gap_ridge_a100_s0.5 | 100.000 | 0.500 | 131,788 | 1,526 | 19.025 | 68.163 | 0.084 | 56.296 | 21.897 |
| Previous-price regression | Abnormal-gap residual regression | abnormal_gap_ridge_a100_s1 | 100.000 | 1.000 | 131,788 | 1,526 | 19.022 | 68.177 | 0.174 | 56.247 | 21.883 |
| Previous-price regression | Abnormal-gap residual regression | abnormal_gap_ridge_a1000_s0.5 | 1,000.000 | 0.500 | 131,788 | 1,526 | 19.025 | 68.163 | 0.084 | 56.296 | 21.897 |
| Previous-price regression | Abnormal-gap residual regression | abnormal_gap_ridge_a1000_s1 | 1,000.000 | 1.000 | 131,788 | 1,526 | 19.022 | 68.177 | 0.174 | 56.246 | 21.883 |
| Previous-price regression | Development-selected policy | residual_ridge_a1000_s0.5 | 1,000.000 | 0.500 | 131,788 | 1,526 | 19.013 | 68.177 | 0.443 | 56.485 | 21.881 |
| ETF-adjusted fair value | Unchanged baseline | base | — | 0.000 | 131,788 | 1,526 | 17.990 | 68.148 | 0.792 | 54.002 | 20.729 |
| ETF-adjusted fair value | Previous-gap correction | last_gap_s0.25 | — | 0.250 | 131,788 | 1,526 | 18.575 | 68.678 | 0.667 | 55.770 | 21.419 |
| ETF-adjusted fair value | Previous-gap correction | last_gap_s0.5 | — | 0.500 | 131,788 | 1,526 | 20.157 | 70.076 | 0.549 | 61.974 | 23.140 |
| ETF-adjusted fair value | Previous-gap correction | last_gap_s1 | — | 1.000 | 131,788 | 1,526 | 24.457 | 72.822 | 0.244 | 77.149 | 27.510 |
| ETF-adjusted fair value | Historical bond bias | bond_bias_s0.25 | — | 0.250 | 131,788 | 1,526 | 17.982 | 68.104 | 0.731 | 54.032 | 20.722 |
| ETF-adjusted fair value | Historical bond bias | bond_bias_s0.5 | — | 0.500 | 131,788 | 1,526 | 17.993 | 68.072 | 0.671 | 54.126 | 20.736 |
| ETF-adjusted fair value | Historical bond bias | bond_bias_s1 | — | 1.000 | 131,788 | 1,526 | 18.078 | 68.044 | 0.552 | 54.222 | 20.834 |
| ETF-adjusted fair value | Historical bucket bias | bucket_bias_s0.25 | — | 0.250 | 131,788 | 1,526 | 17.989 | 68.140 | 0.745 | 54.026 | 20.728 |
| ETF-adjusted fair value | Historical bucket bias | bucket_bias_s0.5 | — | 0.500 | 131,788 | 1,526 | 17.994 | 68.133 | 0.698 | 53.990 | 20.733 |
| ETF-adjusted fair value | Historical bucket bias | bucket_bias_s1 | — | 1.000 | 131,788 | 1,526 | 18.021 | 68.126 | 0.604 | 53.984 | 20.759 |
| ETF-adjusted fair value | Residual regression | residual_ridge_a10_s0.5 | 10.000 | 0.500 | 131,788 | 1,526 | 17.969 | 68.115 | 0.859 | 54.016 | 20.699 |
| ETF-adjusted fair value | Residual regression | residual_ridge_a10_s1 | 10.000 | 1.000 | 131,788 | 1,526 | 17.995 | 68.103 | 0.926 | 54.109 | 20.722 |
| ETF-adjusted fair value | Residual regression | residual_ridge_a100_s0.5 | 100.000 | 0.500 | 131,788 | 1,526 | 17.969 | 68.115 | 0.859 | 54.015 | 20.699 |
| ETF-adjusted fair value | Residual regression | residual_ridge_a100_s1 | 100.000 | 1.000 | 131,788 | 1,526 | 17.995 | 68.103 | 0.926 | 54.110 | 20.722 |
| ETF-adjusted fair value | Residual regression | residual_ridge_a1000_s0.5 | 1,000.000 | 0.500 | 131,788 | 1,526 | 17.969 | 68.115 | 0.859 | 54.016 | 20.699 |
| ETF-adjusted fair value | Residual regression | residual_ridge_a1000_s1 | 1,000.000 | 1.000 | 131,788 | 1,526 | 17.995 | 68.103 | 0.927 | 54.093 | 20.721 |
| ETF-adjusted fair value | Abnormal-gap residual regression | abnormal_gap_ridge_a10_s0.5 | 10.000 | 0.500 | 131,788 | 1,526 | 17.991 | 68.146 | 0.850 | 54.033 | 20.730 |
| ETF-adjusted fair value | Abnormal-gap residual regression | abnormal_gap_ridge_a10_s1 | 10.000 | 1.000 | 131,788 | 1,526 | 17.996 | 68.149 | 0.909 | 54.117 | 20.736 |
| ETF-adjusted fair value | Abnormal-gap residual regression | abnormal_gap_ridge_a100_s0.5 | 100.000 | 0.500 | 131,788 | 1,526 | 17.991 | 68.146 | 0.850 | 54.033 | 20.730 |
| ETF-adjusted fair value | Abnormal-gap residual regression | abnormal_gap_ridge_a100_s1 | 100.000 | 1.000 | 131,788 | 1,526 | 17.996 | 68.149 | 0.909 | 54.114 | 20.736 |
| ETF-adjusted fair value | Abnormal-gap residual regression | abnormal_gap_ridge_a1000_s0.5 | 1,000.000 | 0.500 | 131,788 | 1,526 | 17.991 | 68.146 | 0.850 | 54.033 | 20.730 |
| ETF-adjusted fair value | Abnormal-gap residual regression | abnormal_gap_ridge_a1000_s1 | 1,000.000 | 1.000 | 131,788 | 1,526 | 17.996 | 68.149 | 0.908 | 54.109 | 20.736 |
| ETF-adjusted fair value | Development-selected policy | base | — | 0.000 | 131,788 | 1,526 | 17.990 | 68.148 | 0.792 | 54.002 | 20.729 |
| ETF-adjusted fair value + regression | Unchanged baseline | base | — | 0.000 | 131,788 | 1,526 | 18.221 | 67.691 | 0.852 | 54.858 | 20.949 |
| ETF-adjusted fair value + regression | Previous-gap correction | last_gap_s0.25 | — | 0.250 | 131,788 | 1,526 | 18.601 | 68.142 | 0.714 | 55.963 | 21.425 |
| ETF-adjusted fair value + regression | Previous-gap correction | last_gap_s0.5 | — | 0.500 | 131,788 | 1,526 | 20.029 | 69.480 | 0.582 | 61.249 | 22.984 |
| ETF-adjusted fair value + regression | Previous-gap correction | last_gap_s1 | — | 1.000 | 131,788 | 1,526 | 24.184 | 72.265 | 0.241 | 75.885 | 27.205 |
| ETF-adjusted fair value + regression | Historical bond bias | bond_bias_s0.25 | — | 0.250 | 131,788 | 1,526 | 18.180 | 67.660 | 0.744 | 54.672 | 20.920 |
| ETF-adjusted fair value + regression | Historical bond bias | bond_bias_s0.5 | — | 0.500 | 131,788 | 1,526 | 18.164 | 67.642 | 0.637 | 54.567 | 20.913 |
| ETF-adjusted fair value + regression | Historical bond bias | bond_bias_s1 | — | 1.000 | 131,788 | 1,526 | 18.204 | 67.646 | 0.422 | 54.585 | 20.968 |
| ETF-adjusted fair value + regression | Historical bucket bias | bucket_bias_s0.25 | — | 0.250 | 131,788 | 1,526 | 18.221 | 67.684 | 0.752 | 54.829 | 20.949 |
| ETF-adjusted fair value + regression | Historical bucket bias | bucket_bias_s0.5 | — | 0.500 | 131,788 | 1,526 | 18.226 | 67.680 | 0.651 | 54.781 | 20.956 |
| ETF-adjusted fair value + regression | Historical bucket bias | bucket_bias_s1 | — | 1.000 | 131,788 | 1,526 | 18.256 | 67.677 | 0.451 | 54.865 | 20.989 |
| ETF-adjusted fair value + regression | Residual regression | residual_ridge_a10_s0.5 | 10.000 | 0.500 | 131,788 | 1,526 | 18.178 | 67.669 | 0.701 | 54.692 | 20.922 |
| ETF-adjusted fair value + regression | Residual regression | residual_ridge_a10_s1 | 10.000 | 1.000 | 131,788 | 1,526 | 18.185 | 67.672 | 0.550 | 54.643 | 20.938 |
| ETF-adjusted fair value + regression | Residual regression | residual_ridge_a100_s0.5 | 100.000 | 0.500 | 131,788 | 1,526 | 18.178 | 67.669 | 0.701 | 54.690 | 20.922 |
| ETF-adjusted fair value + regression | Residual regression | residual_ridge_a100_s1 | 100.000 | 1.000 | 131,788 | 1,526 | 18.185 | 67.672 | 0.550 | 54.644 | 20.938 |
| ETF-adjusted fair value + regression | Residual regression | residual_ridge_a1000_s0.5 | 1,000.000 | 0.500 | 131,788 | 1,526 | 18.178 | 67.669 | 0.702 | 54.687 | 20.922 |
| ETF-adjusted fair value + regression | Residual regression | residual_ridge_a1000_s1 | 1,000.000 | 1.000 | 131,788 | 1,526 | 18.184 | 67.673 | 0.552 | 54.652 | 20.937 |
| ETF-adjusted fair value + regression | Abnormal-gap residual regression | abnormal_gap_ridge_a10_s0.5 | 10.000 | 0.500 | 131,788 | 1,526 | 18.215 | 67.683 | 0.887 | 54.827 | 20.938 |
| ETF-adjusted fair value + regression | Abnormal-gap residual regression | abnormal_gap_ridge_a10_s1 | 10.000 | 1.000 | 131,788 | 1,526 | 18.216 | 67.686 | 0.922 | 54.811 | 20.936 |
| ETF-adjusted fair value + regression | Abnormal-gap residual regression | abnormal_gap_ridge_a100_s0.5 | 100.000 | 0.500 | 131,788 | 1,526 | 18.215 | 67.683 | 0.887 | 54.827 | 20.938 |
| ETF-adjusted fair value + regression | Abnormal-gap residual regression | abnormal_gap_ridge_a100_s1 | 100.000 | 1.000 | 131,788 | 1,526 | 18.216 | 67.686 | 0.922 | 54.811 | 20.936 |
| ETF-adjusted fair value + regression | Abnormal-gap residual regression | abnormal_gap_ridge_a1000_s0.5 | 1,000.000 | 0.500 | 131,788 | 1,526 | 18.215 | 67.683 | 0.887 | 54.833 | 20.939 |
| ETF-adjusted fair value + regression | Abnormal-gap residual regression | abnormal_gap_ridge_a1000_s1 | 1,000.000 | 1.000 | 131,788 | 1,526 | 18.216 | 67.686 | 0.921 | 54.808 | 20.935 |
| ETF-adjusted fair value + regression | Development-selected policy | bond_bias_s0.5 | — | 0.500 | 131,788 | 1,526 | 18.164 | 67.642 | 0.637 | 54.567 | 20.913 |

## Monthly stability

The same metric is calculated separately in each evaluation month. Monthly variation shows whether the aggregate result depends on one portion of the sample.

| model | variant | month | n | mae · bp | rmse · bp |
| --- | --- | --- | --- | --- | --- |
| Previous-price regression | Unchanged baseline | 2026-05 | 47,766 | 19.452 | 49.491 |
| Previous-price regression | Unchanged baseline | 2026-06 | 49,572 | 18.534 | 52.775 |
| Previous-price regression | Unchanged baseline | 2026-07 | 48,556 | 18.689 | 47.895 |
| Previous-price regression | Unchanged baseline | 2026-08 | 43,207 | 19.077 | 49.080 |
| Previous-price regression | Unchanged baseline | 2026-09 | 40,025 | 19.416 | 99.573 |
| Previous-price regression | Development-selected policy | 2026-05 | 47,766 | 19.422 | 49.427 |
| Previous-price regression | Development-selected policy | 2026-06 | 49,572 | 18.490 | 52.796 |
| Previous-price regression | Development-selected policy | 2026-07 | 48,556 | 18.659 | 47.940 |
| Previous-price regression | Development-selected policy | 2026-08 | 43,207 | 19.046 | 49.030 |
| Previous-price regression | Development-selected policy | 2026-09 | 40,025 | 19.406 | 99.607 |
| ETF-adjusted fair value | Unchanged baseline | 2026-05 | 47,766 | 18.403 | 50.565 |
| ETF-adjusted fair value | Unchanged baseline | 2026-06 | 49,572 | 17.592 | 52.730 |
| ETF-adjusted fair value | Unchanged baseline | 2026-07 | 48,556 | 17.690 | 46.862 |
| ETF-adjusted fair value | Unchanged baseline | 2026-08 | 43,207 | 18.022 | 48.845 |
| ETF-adjusted fair value | Unchanged baseline | 2026-09 | 40,025 | 18.321 | 100.258 |
| ETF-adjusted fair value | Development-selected policy | 2026-05 | 47,766 | 18.403 | 50.565 |
| ETF-adjusted fair value | Development-selected policy | 2026-06 | 49,572 | 17.592 | 52.730 |
| ETF-adjusted fair value | Development-selected policy | 2026-07 | 48,556 | 17.690 | 46.862 |
| ETF-adjusted fair value | Development-selected policy | 2026-08 | 43,207 | 18.022 | 48.845 |
| ETF-adjusted fair value | Development-selected policy | 2026-09 | 40,025 | 18.321 | 100.258 |
| ETF-adjusted fair value + regression | Unchanged baseline | 2026-05 | 47,766 | 18.748 | 50.283 |
| ETF-adjusted fair value + regression | Unchanged baseline | 2026-06 | 49,572 | 17.898 | 52.494 |
| ETF-adjusted fair value + regression | Unchanged baseline | 2026-07 | 48,556 | 17.965 | 46.832 |
| ETF-adjusted fair value + regression | Unchanged baseline | 2026-08 | 43,207 | 18.263 | 49.103 |
| ETF-adjusted fair value + regression | Unchanged baseline | 2026-09 | 40,025 | 18.488 | 99.115 |
| ETF-adjusted fair value + regression | Development-selected policy | 2026-05 | 47,766 | 18.677 | 50.203 |
| ETF-adjusted fair value + regression | Development-selected policy | 2026-06 | 49,572 | 17.836 | 52.480 |
| ETF-adjusted fair value + regression | Development-selected policy | 2026-07 | 48,556 | 17.896 | 46.764 |
| ETF-adjusted fair value + regression | Development-selected policy | 2026-08 | 43,207 | 18.217 | 49.032 |
| ETF-adjusted fair value + regression | Development-selected policy | 2026-09 | 40,025 | 18.431 | 99.080 |

![Monthly stability](figures/monthly_mae.png)

## Where the correction helps or hurts

Selected-policy and unchanged-baseline subgroup scores use the same assessment trades within each displayed group. These slices are descriptive and were not used to change the frozen choice. A favorable overall mean can conceal worse performance for particular bonds, sectors, ratings, liquidity tiers or stale observations.

| model | variant | period | grouping | group | n | bonds | mae · bp | rmse · bp | bias · bp | p95 absolute · bp | bond equal mae · bp |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Previous-price regression | Unchanged baseline | assessment | prior_abnormal | False | 126,138 | 1,526 | 16.698 | 59.334 | 0.124 | 47.825 | 21.234 |
| Previous-price regression | Development-selected policy | assessment | prior_abnormal | False | 126,138 | 1,526 | 16.685 | 59.351 | 0.499 | 47.898 | 21.215 |
| Previous-price regression | Unchanged baseline | assessment | prior_abnormal | True | 5,650 | 813 | 71.262 | 172.554 | -2.901 | 233.931 | 42.047 |
| Previous-price regression | Development-selected policy | assessment | prior_abnormal | True | 5,650 | 813 | 70.986 | 172.560 | -0.806 | 234.056 | 41.799 |
| Previous-price regression | Unchanged baseline | assessment | liquidity_tier | high | 75,996 | 724 | 17.698 | 35.353 | -0.466 | 55.100 | 17.489 |
| Previous-price regression | Development-selected policy | assessment | liquidity_tier | high | 75,996 | 724 | 17.684 | 35.340 | 0.062 | 55.076 | 17.468 |
| Previous-price regression | Unchanged baseline | assessment | liquidity_tier | low | 18,974 | 690 | 26.732 | 156.558 | 0.976 | 75.042 | 28.733 |
| Previous-price regression | Development-selected policy | assessment | liquidity_tier | low | 18,974 | 690 | 26.686 | 156.620 | 1.439 | 74.545 | 28.679 |
| Previous-price regression | Unchanged baseline | assessment | liquidity_tier | middle | 33,940 | 850 | 18.320 | 38.739 | 0.408 | 53.773 | 19.725 |
| Previous-price regression | Development-selected policy | assessment | liquidity_tier | middle | 33,940 | 850 | 18.284 | 38.724 | 0.745 | 53.502 | 19.695 |
| Previous-price regression | Unchanged baseline | assessment | liquidity_tier | no_prior_month_history | 2,865 | 43 | 12.078 | 21.441 | 0.830 | 32.636 | 12.188 |
| Previous-price regression | Development-selected policy | assessment | liquidity_tier | no_prior_month_history | 2,865 | 43 | 12.053 | 21.507 | 0.407 | 32.750 | 12.107 |
| Previous-price regression | Unchanged baseline | assessment | liquidity_tier | unranked | 13 | 1 | 22.540 | 30.126 | -10.943 | 57.788 | 22.540 |
| Previous-price regression | Development-selected policy | assessment | liquidity_tier | unranked | 13 | 1 | 22.437 | 30.976 | -10.553 | 59.941 | 22.437 |
| Previous-price regression | Unchanged baseline | assessment | bics_sector | Communications | 22,176 | 194 | 22.758 | 52.788 | 0.337 | 74.119 | 30.580 |
| Previous-price regression | Development-selected policy | assessment | bics_sector | Communications | 22,176 | 194 | 22.728 | 52.807 | 0.952 | 73.729 | 30.553 |
| Previous-price regression | Unchanged baseline | assessment | bics_sector | Consumer Discretionary | 30,042 | 352 | 21.229 | 120.284 | 0.668 | 62.888 | 27.458 |
| Previous-price regression | Development-selected policy | assessment | bics_sector | Consumer Discretionary | 30,042 | 352 | 21.229 | 120.354 | 1.229 | 63.027 | 27.432 |
| Previous-price regression | Unchanged baseline | assessment | bics_sector | Consumer Staples | 4,983 | 60 | 15.203 | 26.714 | 0.198 | 42.168 | 16.025 |
| Previous-price regression | Development-selected policy | assessment | bics_sector | Consumer Staples | 4,983 | 60 | 15.213 | 26.727 | 0.450 | 42.059 | 16.028 |
| Previous-price regression | Unchanged baseline | assessment | bics_sector | Energy | 12,831 | 188 | 14.689 | 27.646 | -0.603 | 38.395 | 14.426 |
| Previous-price regression | Development-selected policy | assessment | bics_sector | Energy | 12,831 | 188 | 14.670 | 27.633 | -0.426 | 38.212 | 14.400 |
| Previous-price regression | Unchanged baseline | assessment | bics_sector | Financials | 17,713 | 235 | 17.233 | 32.409 | 0.188 | 51.993 | 16.964 |
| Previous-price regression | Development-selected policy | assessment | bics_sector | Financials | 17,713 | 235 | 17.206 | 32.370 | 0.575 | 51.893 | 16.927 |
| Previous-price regression | Unchanged baseline | assessment | bics_sector | Health Care | 9,702 | 107 | 17.970 | 42.085 | -1.571 | 54.693 | 22.851 |
| Previous-price regression | Development-selected policy | assessment | bics_sector | Health Care | 9,702 | 107 | 17.925 | 41.900 | -1.119 | 54.709 | 22.668 |
| Previous-price regression | Unchanged baseline | assessment | bics_sector | Industrials | 9,456 | 117 | 13.531 | 24.683 | -0.019 | 38.383 | 14.532 |
| Previous-price regression | Development-selected policy | assessment | bics_sector | Industrials | 9,456 | 117 | 13.497 | 24.602 | 0.052 | 38.097 | 14.498 |
| Previous-price regression | Unchanged baseline | assessment | bics_sector | Materials | 12,593 | 150 | 19.684 | 57.165 | -0.237 | 57.643 | 21.344 |
| Previous-price regression | Development-selected policy | assessment | bics_sector | Materials | 12,593 | 150 | 19.620 | 57.106 | 0.282 | 58.295 | 21.309 |
| Previous-price regression | Unchanged baseline | assessment | bics_sector | Technology | 7,919 | 68 | 21.624 | 44.063 | -0.755 | 65.513 | 28.773 |
| Previous-price regression | Development-selected policy | assessment | bics_sector | Technology | 7,919 | 68 | 21.574 | 44.067 | -0.092 | 64.876 | 28.703 |
| Previous-price regression | Unchanged baseline | assessment | bics_sector | Unmapped | 13 | 1 | 22.540 | 30.126 | -10.943 | 57.788 | 22.540 |
| Previous-price regression | Development-selected policy | assessment | bics_sector | Unmapped | 13 | 1 | 22.437 | 30.976 | -10.553 | 59.941 | 22.437 |
| Previous-price regression | Unchanged baseline | assessment | bics_sector | Utilities | 4,360 | 54 | 17.250 | 31.778 | -0.095 | 51.573 | 16.032 |
| Previous-price regression | Development-selected policy | assessment | bics_sector | Utilities | 4,360 | 54 | 17.273 | 31.913 | 0.238 | 51.361 | 16.067 |
| Previous-price regression | Unchanged baseline | assessment | rating_bucket | B | 56,303 | 647 | 17.907 | 32.262 | -0.223 | 53.773 | 17.121 |
| Previous-price regression | Development-selected policy | assessment | rating_bucket | B | 56,303 | 647 | 17.887 | 32.243 | 0.226 | 53.654 | 17.088 |
| Previous-price regression | Unchanged baseline | assessment | rating_bucket | BB | 61,454 | 692 | 14.223 | 29.515 | 0.109 | 39.902 | 14.415 |
| Previous-price regression | Development-selected policy | assessment | rating_bucket | BB | 61,454 | 692 | 14.220 | 29.546 | 0.335 | 39.850 | 14.418 |
| Previous-price regression | Unchanged baseline | assessment | rating_bucket | CCC and lower | 13,145 | 177 | 46.888 | 195.003 | 0.381 | 163.640 | 69.176 |
| Previous-price regression | Development-selected policy | assessment | rating_bucket | CCC and lower | 13,145 | 177 | 46.749 | 195.047 | 1.901 | 162.102 | 68.950 |
| Previous-price regression | Unchanged baseline | assessment | rating_bucket | IG | 805 | 7 | 10.928 | 18.053 | 0.604 | 36.143 | 14.123 |
| Previous-price regression | Development-selected policy | assessment | rating_bucket | IG | 805 | 7 | 10.907 | 18.063 | 0.421 | 36.428 | 14.071 |
| Previous-price regression | Unchanged baseline | assessment | rating_bucket | Unmapped | 13 | 1 | 22.540 | 30.126 | -10.943 | 57.788 | 22.540 |
| Previous-price regression | Development-selected policy | assessment | rating_bucket | Unmapped | 13 | 1 | 22.437 | 30.976 | -10.553 | 59.941 | 22.437 |
| Previous-price regression | Unchanged baseline | assessment | rating_bucket | Unrated | 68 | 2 | 16.740 | 23.477 | -3.938 | 41.626 | 15.641 |
| Previous-price regression | Development-selected policy | assessment | rating_bucket | Unrated | 68 | 2 | 16.478 | 23.139 | -2.652 | 39.539 | 15.759 |
| ETF-adjusted fair value | Unchanged baseline | assessment | prior_abnormal | False | 126,280 | 1,526 | 15.827 | 59.937 | 0.626 | 45.464 | 20.440 |
| ETF-adjusted fair value | Development-selected policy | assessment | prior_abnormal | False | 126,280 | 1,526 | 15.827 | 59.937 | 0.626 | 45.464 | 20.440 |
| ETF-adjusted fair value | Unchanged baseline | assessment | prior_abnormal | True | 5,508 | 788 | 67.578 | 169.576 | 4.587 | 229.674 | 39.730 |
| ETF-adjusted fair value | Development-selected policy | assessment | prior_abnormal | True | 5,508 | 788 | 67.578 | 169.576 | 4.587 | 229.674 | 39.730 |
| ETF-adjusted fair value | Unchanged baseline | assessment | liquidity_tier | high | 75,996 | 724 | 16.715 | 34.231 | -0.130 | 52.952 | 16.537 |
| ETF-adjusted fair value | Development-selected policy | assessment | liquidity_tier | high | 75,996 | 724 | 16.715 | 34.231 | -0.130 | 52.952 | 16.537 |
| ETF-adjusted fair value | Unchanged baseline | assessment | liquidity_tier | low | 18,974 | 690 | 25.188 | 157.812 | 3.547 | 70.527 | 27.249 |
| ETF-adjusted fair value | Development-selected policy | assessment | liquidity_tier | low | 18,974 | 690 | 25.188 | 157.812 | 3.547 | 70.527 | 27.249 |
| ETF-adjusted fair value | Unchanged baseline | assessment | liquidity_tier | middle | 33,940 | 850 | 17.389 | 38.098 | 1.396 | 51.910 | 18.836 |
| ETF-adjusted fair value | Development-selected policy | assessment | liquidity_tier | middle | 33,940 | 850 | 17.389 | 38.098 | 1.396 | 51.910 | 18.836 |
| ETF-adjusted fair value | Unchanged baseline | assessment | liquidity_tier | no_prior_month_history | 2,865 | 43 | 11.236 | 20.243 | -0.089 | 30.749 | 11.401 |
| ETF-adjusted fair value | Development-selected policy | assessment | liquidity_tier | no_prior_month_history | 2,865 | 43 | 11.236 | 20.243 | -0.089 | 30.749 | 11.401 |
| ETF-adjusted fair value | Unchanged baseline | assessment | liquidity_tier | unranked | 13 | 1 | 27.167 | 34.127 | -19.028 | 68.891 | 27.167 |
| ETF-adjusted fair value | Development-selected policy | assessment | liquidity_tier | unranked | 13 | 1 | 27.167 | 34.127 | -19.028 | 68.891 | 27.167 |
| ETF-adjusted fair value | Unchanged baseline | assessment | bics_sector | Communications | 22,176 | 194 | 21.835 | 52.164 | 1.421 | 71.941 | 29.756 |
| ETF-adjusted fair value | Development-selected policy | assessment | bics_sector | Communications | 22,176 | 194 | 21.835 | 52.164 | 1.421 | 71.941 | 29.756 |
| ETF-adjusted fair value | Unchanged baseline | assessment | bics_sector | Consumer Discretionary | 30,042 | 352 | 20.098 | 121.369 | 1.571 | 59.321 | 26.279 |
| ETF-adjusted fair value | Development-selected policy | assessment | bics_sector | Consumer Discretionary | 30,042 | 352 | 20.098 | 121.369 | 1.571 | 59.321 | 26.279 |
| ETF-adjusted fair value | Unchanged baseline | assessment | bics_sector | Consumer Staples | 4,983 | 60 | 14.333 | 25.752 | 0.769 | 39.589 | 14.829 |
| ETF-adjusted fair value | Development-selected policy | assessment | bics_sector | Consumer Staples | 4,983 | 60 | 14.333 | 25.752 | 0.769 | 39.589 | 14.829 |
| ETF-adjusted fair value | Unchanged baseline | assessment | bics_sector | Energy | 12,831 | 188 | 13.569 | 26.576 | -0.219 | 34.902 | 13.210 |
| ETF-adjusted fair value | Development-selected policy | assessment | bics_sector | Energy | 12,831 | 188 | 13.569 | 26.576 | -0.219 | 34.902 | 13.210 |
| ETF-adjusted fair value | Unchanged baseline | assessment | bics_sector | Financials | 17,713 | 235 | 16.154 | 31.148 | 0.727 | 48.687 | 15.856 |
| ETF-adjusted fair value | Development-selected policy | assessment | bics_sector | Financials | 17,713 | 235 | 16.154 | 31.148 | 0.727 | 48.687 | 15.856 |
| ETF-adjusted fair value | Unchanged baseline | assessment | bics_sector | Health Care | 9,702 | 107 | 16.422 | 38.734 | -0.612 | 49.872 | 20.379 |
| ETF-adjusted fair value | Development-selected policy | assessment | bics_sector | Health Care | 9,702 | 107 | 16.422 | 38.734 | -0.612 | 49.872 | 20.379 |
| ETF-adjusted fair value | Unchanged baseline | assessment | bics_sector | Industrials | 9,456 | 117 | 12.505 | 23.950 | 1.344 | 35.429 | 13.568 |
| ETF-adjusted fair value | Development-selected policy | assessment | bics_sector | Industrials | 9,456 | 117 | 12.505 | 23.950 | 1.344 | 35.429 | 13.568 |
| ETF-adjusted fair value | Unchanged baseline | assessment | bics_sector | Materials | 12,593 | 150 | 18.688 | 56.518 | 0.254 | 56.233 | 20.042 |
| ETF-adjusted fair value | Development-selected policy | assessment | bics_sector | Materials | 12,593 | 150 | 18.688 | 56.518 | 0.254 | 56.233 | 20.042 |
| ETF-adjusted fair value | Unchanged baseline | assessment | bics_sector | Technology | 7,919 | 68 | 20.801 | 43.565 | 0.271 | 64.323 | 27.299 |
| ETF-adjusted fair value | Development-selected policy | assessment | bics_sector | Technology | 7,919 | 68 | 20.801 | 43.565 | 0.271 | 64.323 | 27.299 |
| ETF-adjusted fair value | Unchanged baseline | assessment | bics_sector | Unmapped | 13 | 1 | 27.167 | 34.127 | -19.028 | 68.891 | 27.167 |
| ETF-adjusted fair value | Development-selected policy | assessment | bics_sector | Unmapped | 13 | 1 | 27.167 | 34.127 | -19.028 | 68.891 | 27.167 |
| ETF-adjusted fair value | Unchanged baseline | assessment | bics_sector | Utilities | 4,360 | 54 | 16.799 | 31.612 | -0.029 | 54.319 | 15.775 |
| ETF-adjusted fair value | Development-selected policy | assessment | bics_sector | Utilities | 4,360 | 54 | 16.799 | 31.612 | -0.029 | 54.319 | 15.775 |
| ETF-adjusted fair value | Unchanged baseline | assessment | rating_bucket | B | 56,303 | 647 | 16.998 | 31.202 | 0.297 | 51.593 | 16.121 |
| ETF-adjusted fair value | Development-selected policy | assessment | rating_bucket | B | 56,303 | 647 | 16.998 | 31.202 | 0.297 | 51.593 | 16.121 |
| ETF-adjusted fair value | Unchanged baseline | assessment | rating_bucket | BB | 61,454 | 692 | 13.101 | 28.441 | 0.662 | 36.853 | 13.314 |
| ETF-adjusted fair value | Development-selected policy | assessment | rating_bucket | BB | 61,454 | 692 | 13.101 | 28.441 | 0.662 | 36.853 | 13.314 |
| ETF-adjusted fair value | Unchanged baseline | assessment | rating_bucket | CCC and lower | 13,145 | 177 | 45.635 | 196.440 | 3.520 | 159.983 | 66.872 |
| ETF-adjusted fair value | Development-selected policy | assessment | rating_bucket | CCC and lower | 13,145 | 177 | 45.635 | 196.440 | 3.520 | 159.983 | 66.872 |
| ETF-adjusted fair value | Unchanged baseline | assessment | rating_bucket | IG | 805 | 7 | 9.154 | 16.208 | 1.262 | 27.839 | 12.640 |
| ETF-adjusted fair value | Development-selected policy | assessment | rating_bucket | IG | 805 | 7 | 9.154 | 16.208 | 1.262 | 27.839 | 12.640 |
| ETF-adjusted fair value | Unchanged baseline | assessment | rating_bucket | Unmapped | 13 | 1 | 27.167 | 34.127 | -19.028 | 68.891 | 27.167 |
| ETF-adjusted fair value | Development-selected policy | assessment | rating_bucket | Unmapped | 13 | 1 | 27.167 | 34.127 | -19.028 | 68.891 | 27.167 |
| ETF-adjusted fair value | Unchanged baseline | assessment | rating_bucket | Unrated | 68 | 2 | 16.987 | 22.640 | -2.403 | 40.334 | 18.305 |
| ETF-adjusted fair value | Development-selected policy | assessment | rating_bucket | Unrated | 68 | 2 | 16.987 | 22.640 | -2.403 | 40.334 | 18.305 |
| ETF-adjusted fair value + regression | Unchanged baseline | assessment | prior_abnormal | False | 126,222 | 1,525 | 15.972 | 59.384 | 0.738 | 45.992 | 20.332 |
| ETF-adjusted fair value + regression | Development-selected policy | assessment | prior_abnormal | False | 126,222 | 1,525 | 15.922 | 59.352 | 0.530 | 45.821 | 20.302 |
| ETF-adjusted fair value + regression | Unchanged baseline | assessment | prior_abnormal | True | 5,566 | 771 | 69.221 | 168.884 | 3.438 | 227.137 | 41.194 |
| ETF-adjusted fair value + regression | Development-selected policy | assessment | prior_abnormal | True | 5,566 | 771 | 68.993 | 168.662 | 3.068 | 229.765 | 41.218 |
| ETF-adjusted fair value + regression | Unchanged baseline | assessment | liquidity_tier | high | 75,996 | 724 | 16.979 | 34.357 | 0.523 | 54.027 | 16.743 |
| ETF-adjusted fair value + regression | Development-selected policy | assessment | liquidity_tier | high | 75,996 | 724 | 16.906 | 34.258 | 0.283 | 53.691 | 16.704 |
| ETF-adjusted fair value + regression | Unchanged baseline | assessment | liquidity_tier | low | 18,974 | 690 | 25.464 | 156.389 | 1.743 | 72.126 | 27.497 |
| ETF-adjusted fair value + regression | Development-selected policy | assessment | liquidity_tier | low | 18,974 | 690 | 25.441 | 156.330 | 1.559 | 71.946 | 27.476 |
| ETF-adjusted fair value + regression | Unchanged baseline | assessment | liquidity_tier | middle | 33,940 | 850 | 17.436 | 37.917 | 0.705 | 51.471 | 18.844 |
| ETF-adjusted fair value + regression | Development-selected policy | assessment | liquidity_tier | middle | 33,940 | 850 | 17.433 | 37.928 | 0.637 | 51.214 | 18.855 |
| ETF-adjusted fair value + regression | Unchanged baseline | assessment | liquidity_tier | no_prior_month_history | 2,865 | 43 | 12.502 | 21.207 | 5.473 | 32.445 | 12.643 |
| ETF-adjusted fair value + regression | Development-selected policy | assessment | liquidity_tier | no_prior_month_history | 2,865 | 43 | 11.943 | 20.841 | 3.945 | 32.899 | 12.223 |
| ETF-adjusted fair value + regression | Unchanged baseline | assessment | liquidity_tier | unranked | 13 | 1 | 23.257 | 30.406 | -6.662 | 58.058 | 23.257 |
| ETF-adjusted fair value + regression | Development-selected policy | assessment | liquidity_tier | unranked | 13 | 1 | 24.228 | 31.220 | -8.117 | 60.067 | 24.228 |
| ETF-adjusted fair value + regression | Unchanged baseline | assessment | bics_sector | Communications | 22,176 | 194 | 22.033 | 52.245 | 1.340 | 71.746 | 30.086 |
| ETF-adjusted fair value + regression | Development-selected policy | assessment | bics_sector | Communications | 22,176 | 194 | 22.003 | 52.205 | 0.877 | 71.481 | 30.085 |
| ETF-adjusted fair value + regression | Unchanged baseline | assessment | bics_sector | Consumer Discretionary | 30,042 | 352 | 20.291 | 120.194 | 1.668 | 59.906 | 26.436 |
| ETF-adjusted fair value + regression | Development-selected policy | assessment | bics_sector | Consumer Discretionary | 30,042 | 352 | 20.265 | 120.155 | 1.364 | 59.701 | 26.452 |
| ETF-adjusted fair value + regression | Unchanged baseline | assessment | bics_sector | Consumer Staples | 4,983 | 60 | 14.614 | 25.969 | 1.091 | 40.265 | 15.009 |
| ETF-adjusted fair value + regression | Development-selected policy | assessment | bics_sector | Consumer Staples | 4,983 | 60 | 14.625 | 26.005 | 1.097 | 40.302 | 15.037 |
| ETF-adjusted fair value + regression | Unchanged baseline | assessment | bics_sector | Energy | 12,831 | 188 | 13.759 | 26.549 | -0.118 | 35.238 | 13.295 |
| ETF-adjusted fair value + regression | Development-selected policy | assessment | bics_sector | Energy | 12,831 | 188 | 13.712 | 26.550 | -0.242 | 35.284 | 13.274 |
| ETF-adjusted fair value + regression | Unchanged baseline | assessment | bics_sector | Financials | 17,713 | 235 | 16.333 | 31.302 | 0.733 | 50.072 | 16.008 |
| ETF-adjusted fair value + regression | Development-selected policy | assessment | bics_sector | Financials | 17,713 | 235 | 16.267 | 31.202 | 0.707 | 49.690 | 15.944 |
| ETF-adjusted fair value + regression | Unchanged baseline | assessment | bics_sector | Health Care | 9,702 | 107 | 16.845 | 39.196 | -0.302 | 51.909 | 21.348 |
| ETF-adjusted fair value + regression | Development-selected policy | assessment | bics_sector | Health Care | 9,702 | 107 | 16.732 | 39.044 | -0.372 | 50.985 | 21.110 |
| ETF-adjusted fair value + regression | Unchanged baseline | assessment | bics_sector | Industrials | 9,456 | 117 | 12.613 | 24.060 | 0.488 | 35.165 | 13.568 |
| ETF-adjusted fair value + regression | Development-selected policy | assessment | bics_sector | Industrials | 9,456 | 117 | 12.591 | 23.969 | 0.275 | 35.157 | 13.569 |
| ETF-adjusted fair value + regression | Unchanged baseline | assessment | bics_sector | Materials | 12,593 | 150 | 18.987 | 56.263 | 0.573 | 57.240 | 20.237 |
| ETF-adjusted fair value + regression | Development-selected policy | assessment | bics_sector | Materials | 12,593 | 150 | 18.882 | 56.186 | 0.505 | 57.716 | 20.183 |
| ETF-adjusted fair value + regression | Unchanged baseline | assessment | bics_sector | Technology | 7,919 | 68 | 20.989 | 43.299 | -0.553 | 65.540 | 27.436 |
| ETF-adjusted fair value + regression | Development-selected policy | assessment | bics_sector | Technology | 7,919 | 68 | 20.890 | 43.267 | -0.383 | 65.486 | 27.349 |
| ETF-adjusted fair value + regression | Unchanged baseline | assessment | bics_sector | Unmapped | 13 | 1 | 23.257 | 30.406 | -6.662 | 58.058 | 23.257 |
| ETF-adjusted fair value + regression | Development-selected policy | assessment | bics_sector | Unmapped | 13 | 1 | 24.228 | 31.220 | -8.117 | 60.067 | 24.228 |
| ETF-adjusted fair value + regression | Unchanged baseline | assessment | bics_sector | Utilities | 4,360 | 54 | 17.471 | 32.015 | 2.550 | 59.681 | 16.080 |
| ETF-adjusted fair value + regression | Development-selected policy | assessment | bics_sector | Utilities | 4,360 | 54 | 17.232 | 31.558 | 1.470 | 56.267 | 16.000 |
| ETF-adjusted fair value + regression | Unchanged baseline | assessment | rating_bucket | B | 56,303 | 647 | 17.151 | 31.196 | 0.409 | 51.799 | 16.198 |
| ETF-adjusted fair value + regression | Development-selected policy | assessment | rating_bucket | B | 56,303 | 647 | 17.113 | 31.144 | 0.243 | 51.655 | 16.179 |
| ETF-adjusted fair value + regression | Unchanged baseline | assessment | rating_bucket | BB | 61,454 | 692 | 13.349 | 28.576 | 0.877 | 37.326 | 13.452 |
| ETF-adjusted fair value + regression | Development-selected policy | assessment | rating_bucket | BB | 61,454 | 692 | 13.288 | 28.502 | 0.588 | 37.144 | 13.426 |
| ETF-adjusted fair value + regression | Unchanged baseline | assessment | rating_bucket | CCC and lower | 13,145 | 177 | 46.130 | 194.763 | 2.593 | 160.224 | 67.975 |
| ETF-adjusted fair value + regression | Development-selected policy | assessment | rating_bucket | CCC and lower | 13,145 | 177 | 45.992 | 194.676 | 2.510 | 160.072 | 67.827 |
| ETF-adjusted fair value + regression | Unchanged baseline | assessment | rating_bucket | IG | 805 | 7 | 9.372 | 16.378 | 1.737 | 27.714 | 12.898 |
| ETF-adjusted fair value + regression | Development-selected policy | assessment | rating_bucket | IG | 805 | 7 | 9.290 | 16.318 | 1.123 | 27.031 | 12.667 |
| ETF-adjusted fair value + regression | Unchanged baseline | assessment | rating_bucket | Unmapped | 13 | 1 | 23.257 | 30.406 | -6.662 | 58.058 | 23.257 |
| ETF-adjusted fair value + regression | Development-selected policy | assessment | rating_bucket | Unmapped | 13 | 1 | 24.228 | 31.220 | -8.117 | 60.067 | 24.228 |
| ETF-adjusted fair value + regression | Unchanged baseline | assessment | rating_bucket | Unrated | 68 | 2 | 16.705 | 22.366 | -0.443 | 38.706 | 17.351 |
| ETF-adjusted fair value + regression | Development-selected policy | assessment | rating_bucket | Unrated | 68 | 2 | 18.320 | 23.736 | 5.402 | 38.416 | 18.410 |

## Paired uncertainty

Intervals resample paired errors using the dependence blocks recorded below. Separate date-block and bond-block intervals are not a joint two-way confidence interval. A favorable point estimate alone does not establish a reliable improvement, and exploring several alternatives increases selection risk.

| model | variant | candidate id | period | cluster | mae change · bp | ci low | ci high | n | clusters |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Previous-price regression | Development-selected policy | residual_ridge_a1000_s0.5 | assessment | date | -0.024 | -0.038 | -0.013 | 131,788 | 61 |
| Previous-price regression | Development-selected policy | residual_ridge_a1000_s0.5 | assessment | bond | -0.024 | -0.035 | -0.014 | 131,788 | 1,526 |
| ETF-adjusted fair value | Development-selected policy | base | assessment | date | 0.000 | 0.000 | 0.000 | 131,788 | 61 |
| ETF-adjusted fair value | Development-selected policy | base | assessment | bond | 0.000 | 0.000 | 0.000 | 131,788 | 1,526 |
| ETF-adjusted fair value + regression | Development-selected policy | bond_bias_s0.5 | assessment | date | -0.058 | -0.076 | -0.041 | 131,788 | 61 |
| ETF-adjusted fair value + regression | Development-selected policy | bond_bias_s0.5 | assessment | bond | -0.058 | -0.089 | -0.034 | 131,788 | 1,526 |

## Gap closure versus model catch-up

For the same two observations, signed gap closure equals −sign(initial gap) × bond log-price movement + sign(initial gap) × baseline log-price movement. The first component reflects bond movement toward the initial estimate; the second reflects the baseline moving toward the initial trade. Baseline movement includes normal state assimilation and market updates. Neither component alone identifies economic causality. Absolute gap reduction can differ from signed closure when a price overshoots the estimate.

| model | horizon | observed | mean origin abs gap · bp | mean future abs gap · bp | mean absolute gap reduction · bp | mean signed gap closure · bp | mean bond reversal component · bp | mean forecast movement component · bp |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Previous-price regression | Next trade | 76,924 | 19.349 | 16.595 | 2.754 | 18.609 | 6.659 | 11.950 |
| Previous-price regression | 15 minutes | 39,529 | 19.197 | 17.783 | 1.414 | 19.157 | 7.237 | 11.920 |
| Previous-price regression | 30 minutes | 36,270 | 19.260 | 17.783 | 1.477 | 19.129 | 7.127 | 12.002 |
| Previous-price regression | 60 minutes | 30,491 | 19.369 | 17.755 | 1.614 | 19.511 | 7.292 | 12.219 |
| ETF-adjusted fair value | Next trade | 76,924 | 18.308 | 15.646 | 2.662 | 17.716 | 6.975 | 10.741 |
| ETF-adjusted fair value | 15 minutes | 39,529 | 18.260 | 16.647 | 1.614 | 17.841 | 7.567 | 10.274 |
| ETF-adjusted fair value | 30 minutes | 36,270 | 18.313 | 16.655 | 1.658 | 17.742 | 7.282 | 10.460 |
| ETF-adjusted fair value | 60 minutes | 30,491 | 18.385 | 16.550 | 1.835 | 18.347 | 7.600 | 10.747 |
| ETF-adjusted fair value + regression | Next trade | 76,924 | 18.553 | 15.982 | 2.571 | 17.150 | 7.021 | 10.130 |
| ETF-adjusted fair value + regression | 15 minutes | 39,529 | 18.549 | 16.927 | 1.623 | 17.643 | 7.746 | 9.896 |
| ETF-adjusted fair value + regression | 30 minutes | 36,270 | 18.596 | 16.895 | 1.701 | 17.497 | 7.380 | 10.117 |
| ETF-adjusted fair value + regression | 60 minutes | 30,491 | 18.681 | 16.806 | 1.875 | 17.953 | 7.530 | 10.424 |

![Gap closure versus model catch-up](figures/convergence_decomposition.png)

## Observation availability and comparable trades

Next trade means the next strictly later observed print in the saved common-model prediction cohort, not necessarily the next print in all TRACE data. Fixed horizons use the first eligible common-model print at or after the requested time, not invented clock-time prices. The default fixed-horizon rule allows up to 60 minutes of overshoot; both endpoints must remain in the same day's core session. Actual elapsed times, overshoot and censoring remain explicit. No later eligible print is a missing outcome, not evidence of no adjustment. Same-customer-side rows are descriptive subsets of observed pairs; their results do not resolve selection differences or represent unobserved outcomes. A diagnostic abnormal-gap flag compares the current post-trade gap with a center and scale calibrated from earlier observations. It is known only after that trade. The predictive abnormal-gap gate instead uses a strictly earlier trade's gap score.

| model | horizon | sample | origins | observed | censored | observed share | bonds | median actual elapsed minutes | p90 actual elapsed minutes | abnormal origins | abnormal z available | censored horizon after session | censored no later same day observation | censored outside core session | censored horizon overshoot |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Previous-price regression | Next trade | All eligible origins | 131,788 | 76,924 | 54,864 | 0.584 | 1,526 | 33.617 | 156.362 | 5,478 | 131,788 | 0 | 47,835 | 7,029 | 0 |
| Previous-price regression | Next trade | Observed same-customer-side pairs | 26,020 | 26,020 | 0 | 1.000 | 1,464 | 43.592 | 166.972 | 1,164 | 26,020 | 0 | 0 | 0 | 0 |
| Previous-price regression | Next trade | Earlier-calibrated abnormal gap | 5,478 | 3,518 | 1,960 | 0.642 | 815 | 23.583 | 143.135 | 5,478 | 5,478 | 0 | 1,675 | 285 | 0 |
| Previous-price regression | Next trade | Abnormal gap, observed same side | 1,164 | 1,164 | 0 | 1.000 | 407 | 30.258 | 155.700 | 1,164 | 1,164 | 0 | 0 | 0 | 0 |
| Previous-price regression | 15 minutes | All eligible origins | 131,788 | 39,529 | 92,259 | 0.300 | 1,526 | 35.550 | 64.833 | 5,478 | 131,788 | 4,965 | 51,842 | 7,678 | 27,774 |
| Previous-price regression | 15 minutes | Observed same-customer-side pairs | 14,439 | 14,439 | 0 | 1.000 | 1,335 | 36.017 | 64.800 | 686 | 14,439 | 0 | 0 | 0 | 0 |
| Previous-price regression | 15 minutes | Earlier-calibrated abnormal gap | 5,478 | 1,901 | 3,577 | 0.347 | 815 | 33.167 | 62.550 | 5,478 | 5,478 | 234 | 1,908 | 309 | 1,126 |
| Previous-price regression | 15 minutes | Abnormal gap, observed same side | 686 | 686 | 0 | 1.000 | 275 | 31.825 | 62.350 | 686 | 686 | 0 | 0 | 0 | 0 |
| Previous-price regression | 30 minutes | All eligible origins | 131,788 | 36,270 | 95,518 | 0.275 | 1,526 | 51.100 | 80.333 | 5,478 | 131,788 | 10,173 | 51,842 | 7,649 | 25,854 |
| Previous-price regression | 30 minutes | Observed same-customer-side pairs | 13,419 | 13,419 | 0 | 1.000 | 1,322 | 51.133 | 80.120 | 621 | 13,419 | 0 | 0 | 0 | 0 |
| Previous-price regression | 30 minutes | Earlier-calibrated abnormal gap | 5,478 | 1,743 | 3,735 | 0.318 | 815 | 48.550 | 80.033 | 5,478 | 5,478 | 422 | 1,946 | 305 | 1,062 |
| Previous-price regression | 30 minutes | Abnormal gap, observed same side | 621 | 621 | 0 | 1.000 | 259 | 48.733 | 78.817 | 621 | 621 | 0 | 0 | 0 | 0 |
| Previous-price regression | 60 minutes | All eligible origins | 131,788 | 30,491 | 101,297 | 0.231 | 1,526 | 82.067 | 110.283 | 5,478 | 131,788 | 20,306 | 51,264 | 7,562 | 22,165 |
| Previous-price regression | 60 minutes | Observed same-customer-side pairs | 11,158 | 11,158 | 0 | 1.000 | 1,259 | 82.192 | 110.600 | 523 | 11,158 | 0 | 0 | 0 | 0 |
| Previous-price regression | 60 minutes | Earlier-calibrated abnormal gap | 5,478 | 1,475 | 4,003 | 0.269 | 815 | 80.450 | 109.117 | 5,478 | 5,478 | 812 | 1,953 | 315 | 923 |
| Previous-price regression | 60 minutes | Abnormal gap, observed same side | 523 | 523 | 0 | 1.000 | 241 | 79.483 | 109.970 | 523 | 523 | 0 | 0 | 0 | 0 |
| ETF-adjusted fair value | Next trade | All eligible origins | 131,788 | 76,924 | 54,864 | 0.584 | 1,526 | 33.617 | 156.362 | 5,379 | 131,788 | 0 | 47,835 | 7,029 | 0 |
| ETF-adjusted fair value | Next trade | Observed same-customer-side pairs | 26,020 | 26,020 | 0 | 1.000 | 1,464 | 43.592 | 166.972 | 1,154 | 26,020 | 0 | 0 | 0 | 0 |
| ETF-adjusted fair value | Next trade | Earlier-calibrated abnormal gap | 5,379 | 3,461 | 1,918 | 0.643 | 793 | 22.283 | 136.183 | 5,379 | 5,379 | 0 | 1,644 | 274 | 0 |
| ETF-adjusted fair value | Next trade | Abnormal gap, observed same side | 1,154 | 1,154 | 0 | 1.000 | 378 | 26.292 | 144.692 | 1,154 | 1,154 | 0 | 0 | 0 | 0 |
| ETF-adjusted fair value | 15 minutes | All eligible origins | 131,788 | 39,529 | 92,259 | 0.300 | 1,526 | 35.550 | 64.833 | 5,379 | 131,788 | 4,965 | 51,842 | 7,678 | 27,774 |
| ETF-adjusted fair value | 15 minutes | Observed same-customer-side pairs | 14,439 | 14,439 | 0 | 1.000 | 1,335 | 36.017 | 64.800 | 666 | 14,439 | 0 | 0 | 0 | 0 |
| ETF-adjusted fair value | 15 minutes | Earlier-calibrated abnormal gap | 5,379 | 1,903 | 3,476 | 0.354 | 793 | 33.283 | 63.013 | 5,379 | 5,379 | 234 | 1,867 | 306 | 1,069 |
| ETF-adjusted fair value | 15 minutes | Abnormal gap, observed same side | 666 | 666 | 0 | 1.000 | 267 | 32.092 | 62.267 | 666 | 666 | 0 | 0 | 0 | 0 |
| ETF-adjusted fair value | 30 minutes | All eligible origins | 131,788 | 36,270 | 95,518 | 0.275 | 1,526 | 51.100 | 80.333 | 5,379 | 131,788 | 10,173 | 51,842 | 7,649 | 25,854 |
| ETF-adjusted fair value | 30 minutes | Observed same-customer-side pairs | 13,419 | 13,419 | 0 | 1.000 | 1,322 | 51.133 | 80.120 | 615 | 13,419 | 0 | 0 | 0 | 0 |
| ETF-adjusted fair value | 30 minutes | Earlier-calibrated abnormal gap | 5,379 | 1,741 | 3,638 | 0.324 | 793 | 48.317 | 79.717 | 5,379 | 5,379 | 426 | 1,902 | 297 | 1,013 |
| ETF-adjusted fair value | 30 minutes | Abnormal gap, observed same side | 615 | 615 | 0 | 1.000 | 246 | 48.267 | 78.653 | 615 | 615 | 0 | 0 | 0 | 0 |
| ETF-adjusted fair value | 60 minutes | All eligible origins | 131,788 | 30,491 | 101,297 | 0.231 | 1,526 | 82.067 | 110.283 | 5,379 | 131,788 | 20,306 | 51,264 | 7,562 | 22,165 |
| ETF-adjusted fair value | 60 minutes | Observed same-customer-side pairs | 11,158 | 11,158 | 0 | 1.000 | 1,259 | 82.192 | 110.600 | 516 | 11,158 | 0 | 0 | 0 | 0 |
| ETF-adjusted fair value | 60 minutes | Earlier-calibrated abnormal gap | 5,379 | 1,483 | 3,896 | 0.276 | 793 | 79.883 | 109.280 | 5,379 | 5,379 | 827 | 1,882 | 306 | 881 |
| ETF-adjusted fair value | 60 minutes | Abnormal gap, observed same side | 516 | 516 | 0 | 1.000 | 227 | 78.742 | 109.225 | 516 | 516 | 0 | 0 | 0 | 0 |
| ETF-adjusted fair value + regression | Next trade | All eligible origins | 131,788 | 76,924 | 54,864 | 0.584 | 1,526 | 33.617 | 156.362 | 5,434 | 131,788 | 0 | 47,835 | 7,029 | 0 |
| ETF-adjusted fair value + regression | Next trade | Observed same-customer-side pairs | 26,020 | 26,020 | 0 | 1.000 | 1,464 | 43.592 | 166.972 | 1,166 | 26,020 | 0 | 0 | 0 | 0 |
| ETF-adjusted fair value + regression | Next trade | Earlier-calibrated abnormal gap | 5,434 | 3,498 | 1,936 | 0.644 | 781 | 22.083 | 135.452 | 5,434 | 5,434 | 0 | 1,658 | 278 | 0 |
| ETF-adjusted fair value + regression | Next trade | Abnormal gap, observed same side | 1,166 | 1,166 | 0 | 1.000 | 367 | 25.050 | 143.650 | 1,166 | 1,166 | 0 | 0 | 0 | 0 |
| ETF-adjusted fair value + regression | 15 minutes | All eligible origins | 131,788 | 39,529 | 92,259 | 0.300 | 1,526 | 35.550 | 64.833 | 5,434 | 131,788 | 4,965 | 51,842 | 7,678 | 27,774 |
| ETF-adjusted fair value + regression | 15 minutes | Observed same-customer-side pairs | 14,439 | 14,439 | 0 | 1.000 | 1,335 | 36.017 | 64.800 | 669 | 14,439 | 0 | 0 | 0 | 0 |
| ETF-adjusted fair value + regression | 15 minutes | Earlier-calibrated abnormal gap | 5,434 | 1,932 | 3,502 | 0.356 | 781 | 32.958 | 62.798 | 5,434 | 5,434 | 232 | 1,889 | 311 | 1,070 |
| ETF-adjusted fair value + regression | 15 minutes | Abnormal gap, observed same side | 669 | 669 | 0 | 1.000 | 261 | 32.017 | 61.943 | 669 | 669 | 0 | 0 | 0 | 0 |
| ETF-adjusted fair value + regression | 30 minutes | All eligible origins | 131,788 | 36,270 | 95,518 | 0.275 | 1,526 | 51.100 | 80.333 | 5,434 | 131,788 | 10,173 | 51,842 | 7,649 | 25,854 |
| ETF-adjusted fair value + regression | 30 minutes | Observed same-customer-side pairs | 13,419 | 13,419 | 0 | 1.000 | 1,322 | 51.133 | 80.120 | 622 | 13,419 | 0 | 0 | 0 | 0 |
| ETF-adjusted fair value + regression | 30 minutes | Earlier-calibrated abnormal gap | 5,434 | 1,768 | 3,666 | 0.325 | 781 | 48.150 | 79.795 | 5,434 | 5,434 | 429 | 1,916 | 302 | 1,019 |
| ETF-adjusted fair value + regression | 30 minutes | Abnormal gap, observed same side | 622 | 622 | 0 | 1.000 | 247 | 47.800 | 78.742 | 622 | 622 | 0 | 0 | 0 | 0 |
| ETF-adjusted fair value + regression | 60 minutes | All eligible origins | 131,788 | 30,491 | 101,297 | 0.231 | 1,526 | 82.067 | 110.283 | 5,434 | 131,788 | 20,306 | 51,264 | 7,562 | 22,165 |
| ETF-adjusted fair value + regression | 60 minutes | Observed same-customer-side pairs | 11,158 | 11,158 | 0 | 1.000 | 1,259 | 82.192 | 110.600 | 522 | 11,158 | 0 | 0 | 0 | 0 |
| ETF-adjusted fair value + regression | 60 minutes | Earlier-calibrated abnormal gap | 5,434 | 1,498 | 3,936 | 0.276 | 781 | 80.192 | 109.247 | 5,434 | 5,434 | 839 | 1,900 | 313 | 884 |
| ETF-adjusted fair value + regression | 60 minutes | Abnormal gap, observed same side | 522 | 522 | 0 | 1.000 | 230 | 78.867 | 109.587 | 522 | 522 | 0 | 0 | 0 | 0 |

## ETF movement attribution

This retrospective decomposition conditions on the ETF movement that actually occurred between the two prints. Future ETF information is an outcome attribution only and cannot be an input to the earlier forecast. Availability counts identify which pairs have a valid market attribution.

| model | horizon | sample | market attribution n | mean market adjusted bond reversal · bp | mean market adjusted forecast movement · bp |
| --- | --- | --- | --- | --- | --- |
| Previous-price regression | Next trade | All eligible origins | 76,808 | 6.660 | 11.964 |
| Previous-price regression | Next trade | Observed same-customer-side pairs | 25,972 | 3.124 | 10.811 |
| Previous-price regression | Next trade | Earlier-calibrated abnormal gap | 3,515 | 42.987 | 92.501 |
| Previous-price regression | Next trade | Abnormal gap, observed same side | 1,163 | 34.453 | 82.226 |
| Previous-price regression | 15 minutes | All eligible origins | 39,456 | 7.223 | 11.965 |
| Previous-price regression | 15 minutes | Observed same-customer-side pairs | 14,405 | 3.323 | 10.911 |
| Previous-price regression | 15 minutes | Earlier-calibrated abnormal gap | 1,899 | 42.454 | 86.832 |
| Previous-price regression | 15 minutes | Abnormal gap, observed same side | 684 | 34.225 | 78.857 |
| Previous-price regression | 30 minutes | All eligible origins | 36,196 | 7.115 | 12.032 |
| Previous-price regression | 30 minutes | Observed same-customer-side pairs | 13,394 | 3.141 | 10.946 |
| Previous-price regression | 30 minutes | Earlier-calibrated abnormal gap | 1,741 | 41.309 | 86.834 |
| Previous-price regression | 30 minutes | Abnormal gap, observed same side | 620 | 29.580 | 78.830 |
| Previous-price regression | 60 minutes | All eligible origins | 30,443 | 7.316 | 12.200 |
| Previous-price regression | 60 minutes | Observed same-customer-side pairs | 11,143 | 2.832 | 11.592 |
| Previous-price regression | 60 minutes | Earlier-calibrated abnormal gap | 1,473 | 44.569 | 87.991 |
| Previous-price regression | 60 minutes | Abnormal gap, observed same side | 522 | 31.473 | 82.601 |
| ETF-adjusted fair value | Next trade | All eligible origins | 76,808 | 7.006 | 10.723 |
| ETF-adjusted fair value | Next trade | Observed same-customer-side pairs | 25,972 | 3.106 | 9.430 |
| ETF-adjusted fair value | Next trade | Earlier-calibrated abnormal gap | 3,457 | 44.629 | 87.693 |
| ETF-adjusted fair value | Next trade | Abnormal gap, observed same side | 1,152 | 35.633 | 75.148 |
| ETF-adjusted fair value | 15 minutes | All eligible origins | 39,456 | 7.576 | 10.291 |
| ETF-adjusted fair value | 15 minutes | Observed same-customer-side pairs | 14,405 | 3.161 | 9.196 |
| ETF-adjusted fair value | 15 minutes | Earlier-calibrated abnormal gap | 1,899 | 45.825 | 76.693 |
| ETF-adjusted fair value | 15 minutes | Abnormal gap, observed same side | 662 | 33.300 | 71.525 |
| ETF-adjusted fair value | 30 minutes | All eligible origins | 36,196 | 7.306 | 10.448 |
| ETF-adjusted fair value | 30 minutes | Observed same-customer-side pairs | 13,394 | 2.768 | 9.399 |
| ETF-adjusted fair value | 30 minutes | Earlier-calibrated abnormal gap | 1,739 | 45.841 | 78.256 |
| ETF-adjusted fair value | 30 minutes | Abnormal gap, observed same side | 614 | 31.866 | 74.602 |
| ETF-adjusted fair value | 60 minutes | All eligible origins | 30,443 | 7.675 | 10.664 |
| ETF-adjusted fair value | 60 minutes | Observed same-customer-side pairs | 11,143 | 2.906 | 9.902 |
| ETF-adjusted fair value | 60 minutes | Earlier-calibrated abnormal gap | 1,481 | 48.876 | 78.467 |
| ETF-adjusted fair value | 60 minutes | Abnormal gap, observed same side | 516 | 33.787 | 79.944 |
| ETF-adjusted fair value + regression | Next trade | All eligible origins | 76,808 | 7.030 | 10.128 |
| ETF-adjusted fair value + regression | Next trade | Observed same-customer-side pairs | 25,972 | 3.410 | 9.014 |
| ETF-adjusted fair value + regression | Next trade | Earlier-calibrated abnormal gap | 3,494 | 43.848 | 82.392 |
| ETF-adjusted fair value + regression | Next trade | Abnormal gap, observed same side | 1,164 | 35.037 | 71.057 |
| ETF-adjusted fair value + regression | 15 minutes | All eligible origins | 39,456 | 7.733 | 9.926 |
| ETF-adjusted fair value + regression | 15 minutes | Observed same-customer-side pairs | 14,405 | 3.748 | 8.946 |
| ETF-adjusted fair value + regression | 15 minutes | Earlier-calibrated abnormal gap | 1,928 | 44.865 | 73.423 |
| ETF-adjusted fair value + regression | 15 minutes | Abnormal gap, observed same side | 665 | 32.106 | 68.926 |
| ETF-adjusted fair value + regression | 30 minutes | All eligible origins | 36,196 | 7.393 | 10.118 |
| ETF-adjusted fair value + regression | 30 minutes | Observed same-customer-side pairs | 13,394 | 3.233 | 9.172 |
| ETF-adjusted fair value + regression | 30 minutes | Earlier-calibrated abnormal gap | 1,766 | 44.507 | 75.510 |
| ETF-adjusted fair value + regression | 30 minutes | Abnormal gap, observed same side | 621 | 29.780 | 73.010 |
| ETF-adjusted fair value + regression | 60 minutes | All eligible origins | 30,443 | 7.585 | 10.365 |
| ETF-adjusted fair value + regression | 60 minutes | Observed same-customer-side pairs | 11,143 | 3.022 | 9.799 |
| ETF-adjusted fair value + regression | 60 minutes | Earlier-calibrated abnormal gap | 1,496 | 48.178 | 76.812 |
| ETF-adjusted fair value + regression | 60 minutes | Abnormal gap, observed same side | 522 | 32.480 | 78.904 |

## Typical improvement · 21871DAG8 · 2026-08-03

This example was selected after assessment for explanation: it is a bond-day near the median MAE change among improved or worsened eligible bond-days. It does not select the model or evaluation universe.

![Typical improvement · 21871DAG8 · 2026-08-03](figures/case_typical_improvement.png)

## Adverse example · 00489LAL7 · 2026-09-14

This example was selected after assessment for explanation: it is a bond-day near the median MAE change among improved or worsened eligible bond-days. It does not select the model or evaluation universe.

![Adverse example · 00489LAL7 · 2026-09-14](figures/case_adverse.png)

## Source coverage and provenance

The loader verifies completed pinned sources and artifact hashes. Full checksums and input identities remain in the saved machine-readable audit.

| item | value |
| --- | --- |
| snapshot run id | dashboard_f7c9436738cf7088f55a |
| snapshot directory | outputs/corporate_bonds/fair_value/dashboard/runs/dashboard_f7c9436738cf7088f55a |
| source runs | {"three_model": "three_model_754b9e2f0f874f2be70e", "comovement": "comovement_4716f7515df64e3eb375"} |
| rows | 405564 |
| bonds | 1530 |
| start | 2026-03-02 09:30:11 |
| end | 2026-09-25 15:59:51 |
| core session rows | 337067 |
| timezone | America/New_York (naive wall-clock) |

## Training and information audit

Fold records retain the training cutoffs and actual usable history. Forward convergence outcomes that have not matured by a training cutoff cannot enter that fold's fitted relationships.

| model | month | training start | training end | latest training feedback | cutoff | training rows | evaluation rows | evaluation start | evaluation end | training targets clipped | policy selection available |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Previous-price regression | 2026-05 | 2026-03-02 10:00:03 | 2026-04-30 15:29:41 | 2026-04-30 15:29:41 | 2026-05-01 | 107,941 | 47,766 | 2026-05-01 10:00:04 | 2026-05-29 15:29:51 | 872 | 0.000 |
| Previous-price regression | 2026-06 | 2026-03-02 10:00:03 | 2026-05-29 15:29:51 | 2026-05-29 15:29:51 | 2026-06-01 | 155,707 | 49,572 | 2026-06-01 10:00:04 | 2026-06-30 15:29:47 | 1,198 | 0.000 |
| Previous-price regression | 2026-07 | 2026-03-02 10:00:03 | 2026-06-30 15:29:47 | 2026-06-30 15:29:47 | 2026-07-01 | 205,279 | 48,556 | 2026-07-01 10:00:04 | 2026-07-31 15:29:32 | 1,515 | 1.000 |
| Previous-price regression | 2026-08 | 2026-03-02 10:00:03 | 2026-07-31 15:29:32 | 2026-07-31 15:29:32 | 2026-08-01 | 253,835 | 43,207 | 2026-08-03 10:00:29 | 2026-08-31 15:29:58 | 1,814 | 1.000 |
| Previous-price regression | 2026-09 | 2026-03-02 10:00:03 | 2026-08-31 15:29:58 | 2026-08-31 15:29:58 | 2026-09-01 | 297,042 | 40,025 | 2026-09-01 10:00:10 | 2026-09-25 15:29:15 | 2,121 | 1.000 |
| ETF-adjusted fair value | 2026-05 | 2026-03-02 10:00:03 | 2026-04-30 15:29:41 | 2026-04-30 15:29:41 | 2026-05-01 | 107,941 | 47,766 | 2026-05-01 10:00:04 | 2026-05-29 15:29:51 | 762 | 0.000 |
| ETF-adjusted fair value | 2026-06 | 2026-03-02 10:00:03 | 2026-05-29 15:29:51 | 2026-05-29 15:29:51 | 2026-06-01 | 155,707 | 49,572 | 2026-06-01 10:00:04 | 2026-06-30 15:29:47 | 1,085 | 0.000 |
| ETF-adjusted fair value | 2026-07 | 2026-03-02 10:00:03 | 2026-06-30 15:29:47 | 2026-06-30 15:29:47 | 2026-07-01 | 205,279 | 48,556 | 2026-07-01 10:00:04 | 2026-07-31 15:29:32 | 1,386 | 1.000 |
| ETF-adjusted fair value | 2026-08 | 2026-03-02 10:00:03 | 2026-07-31 15:29:32 | 2026-07-31 15:29:32 | 2026-08-01 | 253,835 | 43,207 | 2026-08-03 10:00:29 | 2026-08-31 15:29:58 | 1,684 | 1.000 |
| ETF-adjusted fair value | 2026-09 | 2026-03-02 10:00:03 | 2026-08-31 15:29:58 | 2026-08-31 15:29:58 | 2026-09-01 | 297,042 | 40,025 | 2026-09-01 10:00:10 | 2026-09-25 15:29:15 | 1,971 | 1.000 |
| ETF-adjusted fair value + regression | 2026-05 | 2026-03-02 10:00:03 | 2026-04-30 15:29:41 | 2026-04-30 15:29:41 | 2026-05-01 | 107,941 | 47,766 | 2026-05-01 10:00:04 | 2026-05-29 15:29:51 | 753 | 0.000 |
| ETF-adjusted fair value + regression | 2026-06 | 2026-03-02 10:00:03 | 2026-05-29 15:29:51 | 2026-05-29 15:29:51 | 2026-06-01 | 155,707 | 49,572 | 2026-06-01 10:00:04 | 2026-06-30 15:29:47 | 1,079 | 0.000 |
| ETF-adjusted fair value + regression | 2026-07 | 2026-03-02 10:00:03 | 2026-06-30 15:29:47 | 2026-06-30 15:29:47 | 2026-07-01 | 205,279 | 48,556 | 2026-07-01 10:00:04 | 2026-07-31 15:29:32 | 1,371 | 1.000 |
| ETF-adjusted fair value + regression | 2026-08 | 2026-03-02 10:00:03 | 2026-07-31 15:29:32 | 2026-07-31 15:29:32 | 2026-08-01 | 253,835 | 43,207 | 2026-08-03 10:00:29 | 2026-08-31 15:29:58 | 1,664 | 1.000 |
| ETF-adjusted fair value + regression | 2026-09 | 2026-03-02 10:00:03 | 2026-08-31 15:29:58 | 2026-08-31 15:29:58 | 2026-09-01 | 297,042 | 40,025 | 2026-09-01 10:00:10 | 2026-09-25 15:29:15 | 1,947 | 1.000 |

## Interpretation and next steps

Promote a correction only when the frozen assessment comparison improves price accuracy without unacceptable tail errors or unstable subgroup behavior. Retain the baseline whenever the evidence is weak. An independently collected later period is needed for a prospective claim. Current Bloomberg classifications and holdings are retrospective, and TRACE execution timestamps do not establish actual dissemination availability.

All base forecasts already use earlier trades. Residual correction estimates the error left after those updates; gap closure alone does not prove bond-price reversal.

July–September was inspected in earlier project work: this is retrospective chronological assessment, not a newly collected prospective test.

Current Bloomberg sector/rating and holdings labels are retrospective; liquidity uses prior-month activity within those classifications.

TRACE execution clocks proxy availability. Feedback delay applies only to the added residual layer; underlying saved models retain their original availability assumptions.

Current trade size and side are excluded from predictive factors. Same-customer-side forward pairs condition on a future outcome and are diagnostic only.

Future prices are observed common-model prints with explicit censoring and horizon overshoot; unobserved prices are never filled as zero changes.

Adjustment is selected on May–June only and assessed from July. Development-selected curves inside May–June describe selection fit, not a policy chosen before those months.

Intervals resample dates or bonds separately, do not jointly model both dependencies, and do not correct for repeated research exploration.

## Saved configuration

```json
{
  "evaluation_start": "2026-05-01",
  "selection_end": "2026-06-30",
  "assessment_start": "2026-07-01",
  "evaluation_end": "2026-09-25",
  "feedback_delay_minutes": 0,
  "history_days": 20,
  "bucket_shrinkage": 100,
  "bond_shrinkage": 20,
  "bond_half_life_trades": 20,
  "gap_decay_hours": 4,
  "state_clip_bps": 200,
  "target_clip_bps": 200,
  "correction_cap_bps": 100,
  "cold_scale_bps": 25,
  "scale_floor_bps": 5,
  "abnormal_z_threshold": 2,
  "simple_strengths": [
    0.25,
    0.5,
    1.0
  ],
  "ridge_alphas": [
    10.0,
    100.0,
    1000.0
  ],
  "ridge_strengths": [
    0.5,
    1.0
  ],
  "minimum_development_mae_gain_bps": 0.02,
  "maximum_development_rmse_ratio": 1.01,
  "minimum_training_rows": 1000,
  "bootstrap_repetitions": 500,
  "seed": 20261112,
  "horizons": [
    "next_trade",
    "15m",
    "30m",
    "60m"
  ],
  "max_overshoot_minutes": 60
}
```

## Frozen selection record

```json
{
  "selection_end": "2026-06-30",
  "assessment_start": "2026-07-01",
  "models": {
    "b3": {
      "candidate_id": "residual_ridge_a1000_s0.5",
      "variant": "residual_ridge",
      "alpha": 1000.0,
      "strength": 0.5,
      "development_mae_bps": 18.947605331789052,
      "development_rmse_bps": 51.17044754305362,
      "baseline_development_mae_bps": 18.984773495858963,
      "baseline_development_rmse_bps": 51.189882856020404,
      "development_n": 97338,
      "admissible_candidates": 6,
      "selection_end": "2026-06-30",
      "assessment_start": "2026-07-01",
      "reason": "Lowest development MAE among admissible candidates"
    },
    "p1": {
      "candidate_id": "base",
      "variant": "base",
      "alpha": null,
      "strength": 0.0,
      "development_mae_bps": 17.989837680675627,
      "development_rmse_bps": 51.67855787711702,
      "baseline_development_mae_bps": 17.989837680675627,
      "baseline_development_rmse_bps": 51.67855787711702,
      "development_n": 97338,
      "admissible_candidates": 0,
      "selection_end": "2026-06-30",
      "assessment_start": "2026-07-01",
      "reason": "No candidate passed development MAE/RMSE guards"
    },
    "integrated": {
      "candidate_id": "bond_bias_s0.5",
      "variant": "bond_bias",
      "alpha": null,
      "strength": 0.5,
      "development_mae_bps": 18.248998590517612,
      "development_rmse_bps": 51.37524320419202,
      "baseline_development_mae_bps": 18.315037926490465,
      "baseline_development_rmse_bps": 51.42100262974697,
      "development_n": 97338,
      "admissible_candidates": 8,
      "selection_end": "2026-06-30",
      "assessment_start": "2026-07-01",
      "reason": "Lowest development MAE among admissible candidates"
    }
  }
}
```
