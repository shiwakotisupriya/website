-- MySQL 8+; execute after 03_validation.sql passes.
-- All money in BRL. Results have not yet been executed or verified.

-- 1. Overall commercial KPIs: delivered scope.
SELECT COUNT(*) AS delivered_orders, SUM(merchandise_value) AS merchandise_brl,
 SUM(freight_value) AS freight_brl,
 SUM(merchandise_value) / NULLIF(COUNT(*),0) AS aov_brl
FROM v_order_fact WHERE is_delivered = 1;

-- 2. Monthly trends and month-on-month merchandise change.
-- Calendar months include only months with delivered purchases; inspect gaps.
WITH monthly AS (
 SELECT DATE_FORMAT(order_purchase_timestamp,'%Y-%m-01') AS month,
 COUNT(*) AS orders, SUM(merchandise_value) AS merchandise_brl,
 SUM(freight_value) AS freight_brl
 FROM v_order_fact WHERE is_delivered = 1 GROUP BY month
), growth AS (
 SELECT *, LAG(merchandise_brl) OVER(ORDER BY month) AS previous_value FROM monthly
)
SELECT *, merchandise_brl / NULLIF(orders,0) AS aov_brl,
 (merchandise_brl - previous_value) / NULLIF(previous_value,0) AS growth_fraction
FROM growth ORDER BY month;

-- 3. Monthly delivery outcomes, grouped by purchase month.
SELECT DATE_FORMAT(order_purchase_timestamp,'%Y-%m-01') AS month,
 COUNT(*) AS eligible_orders, SUM(is_late) AS late_orders,
 AVG(is_late) AS late_rate, AVG(delivery_days) AS mean_delivery_days
FROM v_order_fact WHERE delivery_eligible = 1 GROUP BY month ORDER BY month;

-- 4. Customer-state delivery comparison.
SELECT customer_state, COUNT(*) AS eligible_orders, SUM(is_late) AS late_orders,
 AVG(is_late) AS late_rate, AVG(delivery_days) AS mean_delivery_days
FROM v_order_fact WHERE delivery_eligible = 1
GROUP BY customer_state ORDER BY late_orders DESC;

-- 5. Seller comparison. Whole-order delay does not establish seller fault.
SELECT s.seller_id, COUNT(*) AS eligible_orders, SUM(f.is_late) AS late_orders,
 AVG(f.is_late) AS late_rate
FROM v_order_seller s JOIN v_order_fact f USING(order_id)
WHERE f.delivery_eligible = 1 GROUP BY s.seller_id
HAVING COUNT(*) >= 100 ORDER BY late_rate DESC, eligible_orders DESC;

-- 6. Category comparison. Counts across categories are not additive.
SELECT c.category_key, COUNT(*) AS eligible_orders, SUM(f.is_late) AS late_orders,
 AVG(f.is_late) AS late_rate
FROM v_order_category c JOIN v_order_fact f USING(order_id)
WHERE f.delivery_eligible = 1 GROUP BY c.category_key
HAVING COUNT(*) >= 100 ORDER BY late_rate DESC, eligible_orders DESC;

-- 7. Review association with delivery outcome; reviewed eligible subset only.
SELECT is_late, COUNT(*) AS reviewed_eligible_orders,
 AVG(review_score) AS mean_review_score, AVG(low_review) AS low_review_rate
FROM v_order_fact WHERE delivery_eligible = 1 AND review_eligible = 1
GROUP BY is_late;

-- 8. Review distribution: delivered orders, one selected review per order.
SELECT review_score, COUNT(*) AS orders,
 COUNT(*) / SUM(COUNT(*)) OVER() AS reviewed_order_share
FROM v_order_fact WHERE is_delivered = 1 AND review_eligible = 1
GROUP BY review_score ORDER BY review_score;

-- 9. Review coverage: identify potential response-selection bias.
SELECT is_late, COUNT(*) AS eligible_orders, SUM(review_eligible) AS reviewed_orders,
 AVG(review_eligible) AS review_coverage
FROM v_order_fact WHERE delivery_eligible = 1 GROUP BY is_late;

-- 10. Region prioritisation combines volume and delay.
-- Late-order count measures observed workload; excess is descriptive, not causal.
WITH overall AS (
 SELECT AVG(is_late) AS baseline_rate FROM v_order_fact WHERE delivery_eligible = 1
)
SELECT f.customer_state, COUNT(*) AS eligible_orders,
 SUM(f.is_late) AS late_orders, AVG(f.is_late) AS late_rate,
 SUM(f.is_late) - COUNT(*) * MAX(o.baseline_rate) AS late_orders_above_overall_rate
FROM v_order_fact f CROSS JOIN overall o WHERE f.delivery_eligible = 1
GROUP BY f.customer_state HAVING COUNT(*) >= 100 ORDER BY late_orders DESC;

-- 11. Repeat customers in observed delivered-order window (not lifetime retention).
WITH customer_orders AS (
 SELECT customer_unique_id, COUNT(*) AS orders FROM v_order_fact
 WHERE is_delivered = 1 GROUP BY customer_unique_id
)
SELECT COUNT(*) AS observed_customers, SUM(orders > 1) AS repeat_customers,
 AVG(orders > 1) AS repeat_customer_share FROM customer_orders;

-- 12. Review outcomes by delay severity.
WITH bands AS (
 SELECT *, CASE WHEN is_late = 0 THEN '0 On time'
 WHEN DATEDIFF(order_delivered_customer_date,order_estimated_delivery_date) <= 7
 THEN '1 Late 1-7 days' ELSE '2 Late 8+ days' END AS delay_band
 FROM v_order_fact WHERE delivery_eligible = 1
)
SELECT delay_band, COUNT(*) AS eligible_orders, SUM(review_eligible) AS reviewed_orders,
 AVG(CASE WHEN review_eligible = 1 THEN review_score END) AS mean_review_score,
 AVG(CASE WHEN review_eligible = 1 THEN low_review END) AS low_review_rate
FROM bands GROUP BY delay_band ORDER BY delay_band;
