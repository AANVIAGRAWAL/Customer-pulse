# Customer Churn Prediction Model Documentation

## 1. Problem Definition
The objective of this machine learning pipeline is to predict whether a customer is likely to cancel their service (Churn). This allows the business to proactively intervene with at-risk customers and reduce revenue loss.

## 2. Dataset
We utilized the processed, actual Telco Customer Churn dataset located at `data/processed/customer_data_processed.csv`.

## 3. Target Variable
The target variable is `Churn_Label`, a binary integer where `1` represents a churned customer and `0` represents a retained customer. The original `Churn` string column and heuristic risk columns were dropped to prevent target leakage.

## 4. Features Used
- **Numeric**: `tenure`, `MonthlyCharges`, `TotalCharges`, `AvgMonthlyCharge`, `TotalServices`
- **Categorical**: `gender`, `SeniorCitizen`, `Partner`, `Dependents`, `PhoneService`, `MultipleLines`, `InternetService`, `OnlineSecurity`, `OnlineBackup`, `DeviceProtection`, `TechSupport`, `StreamingTV`, `StreamingMovies`, `Contract`, `PaperlessBilling`, `PaymentMethod`

## 5. Preprocessing
A `ColumnTransformer` was used to ensure preprocessing fits strictly to the training data to avoid data leakage:
- **Numeric Variables**: Scaled to zero mean and unit variance using `StandardScaler`.
- **Categorical Variables**: Encoded into dummy variables using `OneHotEncoder(drop='if_binary')`.

## 6. Train/Test Methodology
The dataset was split using an 80/20 train-test ratio. Due to class imbalance (26.5% churn rate), `stratify=y` was used to ensure the testing set maintained the exact same churn distribution as the training set. A constant `random_state=42` guarantees exact reproducibility.

## 7. Models
Two models were trained as comparisons:
1. **Logistic Regression**: Interpretable, robust linear baseline.
2. **Random Forest Classifier**: Non-linear ensemble comparison.

## 8. Evaluation Metrics
The models were evaluated comprehensively against the test set (1,409 records):
- **Accuracy**: Overall correct predictions.
- **Precision**: How many predicted churners actually churned.
- **Recall**: How many actual churners were successfully found.
- **F1-Score**: Harmonic mean of Precision and Recall.
- **ROC-AUC**: The model's ability to distinguish between classes across all threshold levels.

## 9. Model Comparison
**Logistic Regression** outperformed Random Forest across all key metrics:
- **ROC-AUC**: 0.8421 (LR) vs 0.8202 (RF)
- **F1-Score**: 0.6061 (LR) vs 0.5498 (RF)
- **Accuracy**: 80.62% (LR) vs 78.50% (RF)

*Decision*: Logistic Regression was chosen as the final model due to its superior predictive performance, faster inference speed, and direct coefficient interpretability.

## 10. Risk Scoring Methodology
Using the trained Logistic Regression pipeline's `predict_proba` function, every customer is assigned a `churn_probability` between 0.0 and 1.0. 
They are subsequently binned into Risk Levels:
- **High Risk**: >= 0.70 (497 customers)
- **Medium Risk**: 0.40 - 0.69 (1,603 customers)
- **Low Risk**: < 0.40 (4,943 customers)

## 11. Important Features (Associations, NOT Causation)
*Important Note: The following are statistical associations observed in the data. We do not claim that these features directly "cause" churn.*

**High Churn Associations (Positive Coefficients):**
- Customers with **Fiber optic** internet showed higher observed churn (Coef: 0.599).
- Customers on **Month-to-month** contracts showed higher observed churn (Coef: 0.537).
- Customers with higher historical **TotalCharges** showed higher observed churn (Coef: 0.537).

**High Retention Associations (Negative Coefficients):**
- Customers with longer **tenure** showed lower observed churn (Coef: -1.259).
- Customers on **Two year** contracts showed lower observed churn (Coef: -0.825).
- Customers with **DSL** internet showed lower observed churn (Coef: -0.724).

## 12. Limitations
- **Imbalanced Recall**: While overall Accuracy and AUC are strong, the Recall (0.56) indicates the model still misses a portion of true churners. Techniques like SMOTE or class weighting could be explored in future iterations.
- **Causality**: The model only surfaces correlations. For example, higher TotalCharges might just correlate with Fiber Optic Month-to-month customers, requiring deeper experimental testing to prove pricing sensitivity.
