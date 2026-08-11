# SQL Analytics Layer Documentation

## Overview
This document outlines the reusable SQL analytics layer developed for the CustomerPulse project during Phase 4. All queries strictly conform to MySQL `only_full_group_by` modes and query the fully normalized 5-table schema to extract real business insights.

## 1. Executive KPIs
Extracts the top-line performance metrics for the business.
- **Goal**: Understand overall churn rate and lifetime financial performance.
- **SQL File**: Incorporated into `run_analytics.py`.
- **Key Metrics**: 7,043 total customers, 26.5% churn rate, $16M lifetime revenue ($2.8M lost to churn).

## 2. Churn Analysis
Segments churn by contract, internet service, and tenure group to find the most significant statistical drivers.
- **Goal**: Identify which demographics or billing states have the highest attrition.
- **Key Insight**: Month-to-month contracts have a staggering **42.7%** churn rate compared to Two-year contracts at just **2.8%**. Churn is also highest in the first year (47.4%).

## 3. Customer Behavior
Analyzes how product adoption (like Tech Support) and tenure influence churn status.
- **Goal**: Determine if add-on services successfully create "stickiness".
- **Key Insight**: Customers *without* Tech Support churned at **41.6%**, while those *with* Tech Support churned at only **15.1%**.

## 4. High-Value Churn
Cross-references high-risk categorical segments with their actual financial impact (`TotalCharges`).
- **Goal**: Prioritize retention efforts based on financial exposure rather than pure headcounts.
- **Key Insight**: The `Month-to-month / Fiber optic` cohort is the most dangerous, losing the business **$1.73M** in lifetime revenue (a 54.6% churn rate on an initially high-value segment).

## 5. Segmentation Inputs
Calculates Revenue Quartiles (Platinum, Gold, Silver, Bronze) utilizing SQL window functions (`NTILE(4)`).
- **Goal**: Provide clean inputs for the future React UI's segmentation grid and ML clustering.
- **Key Insight**: "Bronze" customers on Month-to-month contracts have incredibly short average tenures (2-4 months) and high churn, while "Platinum" Two-year customers average 66+ months of loyalty.
