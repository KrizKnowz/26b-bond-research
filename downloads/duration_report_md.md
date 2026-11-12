# Bond duration calculations

Run `duration_565dcf412c0f00ca2aa4`. Historical yield window: 2025-01-01 to 2026-09-25.
These are contractual maturity yield-duration proxies calculated from existing
Bloomberg terms and dated YLD_YTM_MID observations. They are not option-adjusted
effective durations and are not yet approved historical regression inputs.

| Coverage | Count |
| --- | ---: |
| Reference requests retained | 1,620 |
| Structurally eligible reference bonds | 1,509 |
| Successfully calculated bond-date observations | 434,324 |
| Bonds with a calculated duration | 1,267 |
| Calculations on the final date | 1,254 |
| Same-date historical quote matches | 434,322 |
| Calculations passing the diagnostic price/yield screen | 433,895 |

Coupon cycles that cannot be reconciled with maturity exclude
94
bonds. Another 147
structurally eligible bonds have no supported valuation dates (for example,
unresolved first coupons or dates preceding the current issue terms).
These are explicit missing calculations, not zero durations. Latest-source
failure states remain visible; an older successful calculation is not substituted.

Latest available modified duration: median 3.266
years; 10th–90th percentiles 1.680–5.288
years. Each row retains its own yield date and age; a latest value is not
necessarily dated on the final study date. No missing observation is backfilled.

## Calculation and interpretation

For nominal annual yield y, frequency m and future payments CF_j at coupon-time
years t_j, PV_j = CF_j / (1 + y/m)^(m*t_j). Dirty price is the sum of these PVs;
Macaulay duration is sum(t_j*PV_j)/dirty_price; modified duration is
Macaulay/(1+y/m). Clean price equals dirty price minus accrued interest.
`clean_price_duration_years = modified_years * dirty_price / clean_price` keeps
the clean-price percentage sensitivity separate from conventional duration.
`dv01_per_100 = modified_years * dirty_price * 0.0001` is in price points per
100 face value, not dollars per bond or trade. Convexity uses the same fixed
cash flows and yield convention. Prices are model-implied outputs of the dated
yield, not independently predicted fair values.

Contractual regular fixed coupons are reconstructed to maturity. The engine
uses coupon-frequency compounding, explicit day-count mappings, no holiday
adjustment, and same-day valuation/settlement. Unsupported structures and
unresolved stubs are excluded with reasons. This is an approximation to the
export's yield/settlement conventions, not a claim of exact Bloomberg replication.

Callable bonds assume no early redemption. Their modified duration is exposure
to the assumed maturity yield with fixed cash flows; actual curve sensitivity
can differ materially. Variable/floating/PIK/defaulted/convertible/perpetual,
sinking-fund and identifier-mismatched structures are screened out. `BULLET=N`
alone is not used to exclude a bond because most callable bonds have that flag.

`DES_CASH_FLOW` is audited rather than blindly used: some arrays terminate at a
call date, and amounts often use a face basis of 1,000,000. The audit retains
terminal-date and principal checks. Current Bloomberg `DUR_ADJ_MID` and
`DUR_ADJ_OAS_MID` remain separate reference fields; they are never copied into
historical dates or treated as the same measure as the computed proxy.

## Price reconciliation and timing

Same-date two-sided bid/ask midpoints provide an independent diagnostic.
The tolerance is max(0.50 clean-price points, 0.5% of quoted midpoint).
99.904% of matched quote comparisons
fall within that tolerance. The median absolute implied-price difference is
0.00266 points per 100 face.
This is an explicitly chosen research screen, not an exchange or Bloomberg
standard. Differences can reflect settlement, source, early redemption,
changed terms or quote/yield mismatches. Nonpositive and above-100% yields
remain visible but do not pass `screened_proxy`. Missing quote comparisons are
not treated as passes. A flagged latest value is never replaced by an older
passing value. Daily closing quotes used for this check are not forecast inputs.

Historical series were exported with unverified status and blank retrieval
metadata. Terms and classifications are current snapshots. All outputs have
`feature_ready=False`. `assumed_available_after` is a next-calendar-day timing
assumption for dated yields, not evidence of actual publication. Before using
duration in an intraday regression, validate terms/yield vintages and join only
earlier available values. Do not derive yield from the target trade price and
use the resulting duration to predict that same trade.

## Files and reproduction

`latest_duration_proxies.csv` keeps all reference requests and exclusion reasons.
`historical_duration_proxies.parquet` contains the daily calculations and flags.
`reference_inputs.csv`, `cashflow_schedule_audit.csv`, input audits and
`bond_calculation_audit.csv` explain coverage. `calculation_failures.csv` records
date-specific failures. `current_bloomberg_duration_reference.csv` preserves
current Bloomberg measures independently. The manifest hashes source bytes,
code and artifacts. Existing B3, P1 and P1→B3 results are unchanged.

Run `python3 scripts/corporate_bonds/compute_bond_durations.py` from the project
root. Default start is 2025-01-01; default end is the current local study end.
`--start` and `--end` restrict historical dates.

Sources: [CFA yield duration](https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/yield-based-bond-duration-measures-and-properties),
[CFA embedded options](https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/valuation-analysis-bonds-embedded-options),
[Bloomberg ISMA day count](https://bloomberg.github.io/bde-resources/doxygen/bde_api_prod/group__bbldc__basicisma30360.html).
