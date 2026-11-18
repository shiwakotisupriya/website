# Olist portfolio evidence

Aggregates were independently recomputed from the original Olist orders, customers, and reviews CSVs and reconciled to the existing regional and review-coverage SQL exports. No customer identifiers, review text, or raw transactions are published here.

Run `python verify_olist.py PATH_TO_RAW_CSV_FOLDER` using the public Olist CSVs. The script writes olist-summary.json. Original SQL project queries are retained in olist-analysis.sql; their header reflects their earlier drafting state, not this verification run.

Eligibility: status delivered and both actual and estimated delivery dates present. Late means actual calendar date is after estimated calendar date. No timezone conversion. One row per order. Choose the latest review creation date, then answer timestamp, then review ID. Low review means score 1 or 2 out of 5. Missing reviews are excluded from score denominators. The figures are historical, describe associations, and do not establish causation or current market performance.

No new SQL execution, predictive model, or Power BI report completion is claimed. Regional counts and review coverage reconcile to existing saved SQL outputs.
