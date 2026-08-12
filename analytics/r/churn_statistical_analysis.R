# ====================================================================
# PHASE 9: CUSTOMERPULSE R STATISTICAL ANALYSIS
# ====================================================================
# This script performs statistical hypothesis testing, correlation
# analysis, and visualization of the CustomerPulse dataset.

# 1. Install & Load Required Packages
required_packages <- c("dplyr", "ggplot2", "readr", "broom", "tidyr")
new_packages <- required_packages[!(required_packages %in% installed.packages()[,"Package"])]
if(length(new_packages)) install.packages(new_packages, repos="https://cloud.r-project.org/")

library(dplyr)
library(ggplot2)
library(readr)
library(broom)
library(tidyr)

# 2. Dataset Loading & Cleaning
cat("==================================================\n")
cat("LOADING DATASET\n")
cat("==================================================\n")

data_path <- "data/raw/WA_Fn-UseC_-Telco-Customer-Churn.csv"
if (!file.exists(data_path)) {
  stop(paste("Data file not found at:", data_path))
}

# Read dataset, treat spaces as NA for TotalCharges
df <- read_csv(data_path, na = c("", "NA", " "), show_col_types = FALSE)

# Basic DQ Metrics
cat(sprintf("Rows: %d\n", nrow(df)))
cat(sprintf("Columns: %d\n", ncol(df)))
cat(sprintf("Duplicates: %d\n", sum(duplicated(df$customerID))))
cat(sprintf("Null TotalCharges: %d\n", sum(is.na(df$TotalCharges))))

# Clean Data (Drop the 11 missing TotalCharges to align with SQL/PySpark dynamic denominators)
df_clean <- df %>% drop_na(TotalCharges)
cat(sprintf("Clean Rows: %d\n", nrow(df_clean)))

# Create derived variables (aligning with Phase 4 SQL)
df_clean <- df_clean %>%
  mutate(
    ChurnNumeric = ifelse(Churn == "Yes", 1, 0),
    TenureGroup = case_when(
      tenure <= 12 ~ "0-1 Year",
      tenure > 12 & tenure <= 24 ~ "1-2 Years",
      tenure > 24 & tenure <= 48 ~ "2-4 Years",
      tenure > 48 & tenure <= 60 ~ "4-5 Years",
      TRUE ~ "5+ Years"
    )
  )

# 3. Descriptive Statistics
cat("\n==================================================\n")
cat("DESCRIPTIVE STATISTICS\n")
cat("==================================================\n")

desc_stats <- df_clean %>%
  summarise(
    Mean_Tenure = mean(tenure),
    Median_Tenure = median(tenure),
    SD_Tenure = sd(tenure),
    Mean_Monthly = mean(MonthlyCharges),
    Median_Monthly = median(MonthlyCharges),
    SD_Monthly = sd(MonthlyCharges),
    Mean_Total = mean(TotalCharges),
    Median_Total = median(TotalCharges),
    SD_Total = sd(TotalCharges)
  )
print(desc_stats)

cat("\nDescriptive Stats by Churn:\n")
desc_by_churn <- df_clean %>%
  group_by(Churn) %>%
  summarise(
    N = n(),
    Mean_Tenure = mean(tenure),
    Median_Tenure = median(tenure),
    Mean_Monthly = mean(MonthlyCharges),
    Mean_Total = mean(TotalCharges)
  )
print(desc_by_churn)

# 4. Churn Statistical Analysis (Validations)
cat("\n==================================================\n")
cat("CHURN CROSS-VALIDATIONS\n")
cat("==================================================\n")

cat("\nOverall Churn Rate:\n")
cat(sprintf("%.2f%%\n", mean(df_clean$ChurnNumeric) * 100))

cat("\nChurn by Contract:\n")
contract_churn <- df_clean %>%
  group_by(Contract) %>%
  summarise(ChurnRatePct = round(mean(ChurnNumeric) * 100, 2)) %>%
  arrange(desc(ChurnRatePct))
print(contract_churn)

cat("\nChurn by InternetService:\n")
internet_churn <- df_clean %>%
  group_by(InternetService) %>%
  summarise(ChurnRatePct = round(mean(ChurnNumeric) * 100, 2)) %>%
  arrange(desc(ChurnRatePct))
print(internet_churn)

cat("\nChurn by TenureGroup:\n")
tenure_churn <- df_clean %>%
  group_by(TenureGroup) %>%
  summarise(ChurnRatePct = round(mean(ChurnNumeric) * 100, 2)) %>%
  arrange(TenureGroup)
print(tenure_churn)

# 5. Hypothesis Testing
cat("\n==================================================\n")
cat("HYPOTHESIS TESTING\n")
cat("==================================================\n")

run_chisq <- function(var_name) {
  cat(sprintf("\nChi-Square Test: %s vs Churn\n", var_name))
  tbl <- table(df_clean[[var_name]], df_clean$Churn)
  test <- chisq.test(tbl)
  print(tidy(test))
  cat(sprintf("Significant at alpha=0.05? %s\n", ifelse(test$p.value < 0.05, "Yes", "No")))
}

run_chisq("Contract")
run_chisq("InternetService")
run_chisq("TechSupport")

run_ttest <- function(var_name) {
  cat(sprintf("\nT-Test: %s vs Churn\n", var_name))
  # Formula: var_name ~ Churn
  test <- t.test(as.formula(paste(var_name, "~ Churn")), data = df_clean)
  print(tidy(test))
  cat(sprintf("Significant at alpha=0.05? %s\n", ifelse(test$p.value < 0.05, "Yes", "No")))
}

run_ttest("tenure")
run_ttest("MonthlyCharges")
run_ttest("TotalCharges")

# 6. Correlation Analysis
cat("\n==================================================\n")
cat("CORRELATION ANALYSIS\n")
cat("==================================================\n")

cor_matrix <- cor(df_clean %>% select(tenure, MonthlyCharges, TotalCharges))
print(cor_matrix)

# 7. R Visualizations
cat("\n==================================================\n")
cat("GENERATING VISUALIZATIONS\n")
cat("==================================================\n")

output_dir <- "data/processed/r"
dir.create(output_dir, showWarnings = FALSE, recursive = TRUE)

# Overall Churn
p1 <- ggplot(df_clean, aes(x = Churn, fill = Churn)) +
  geom_bar() +
  labs(title = "Overall Churn Distribution", x = "Churn", y = "Count") +
  theme_minimal()
ggsave(file.path(output_dir, "churn_distribution.png"), p1, width=6, height=4)

# Churn by Contract
p2 <- ggplot(df_clean, aes(x = Contract, fill = Churn)) +
  geom_bar(position = "fill") +
  scale_y_continuous(labels = scales::percent) +
  labs(title = "Churn Rate by Contract", y = "Percentage") +
  theme_minimal()
ggsave(file.path(output_dir, "churn_by_contract.png"), p2, width=6, height=4)

# Churn by Internet Service
p3 <- ggplot(df_clean, aes(x = InternetService, fill = Churn)) +
  geom_bar(position = "fill") +
  scale_y_continuous(labels = scales::percent) +
  labs(title = "Churn Rate by Internet Service", y = "Percentage") +
  theme_minimal()
ggsave(file.path(output_dir, "churn_by_internet.png"), p3, width=6, height=4)

# Churn by Tenure Group
p4 <- ggplot(df_clean, aes(x = TenureGroup, fill = Churn)) +
  geom_bar(position = "fill") +
  scale_y_continuous(labels = scales::percent) +
  labs(title = "Churn Rate by Tenure Group", y = "Percentage") +
  theme_minimal()
ggsave(file.path(output_dir, "churn_by_tenure.png"), p4, width=6, height=4)

# Monthly Charges by Churn
p5 <- ggplot(df_clean, aes(x = Churn, y = MonthlyCharges, fill = Churn)) +
  geom_boxplot() +
  labs(title = "Monthly Charges by Churn Status") +
  theme_minimal()
ggsave(file.path(output_dir, "monthly_charges_by_churn.png"), p5, width=6, height=4)

# Tenure by Churn
p6 <- ggplot(df_clean, aes(x = Churn, y = tenure, fill = Churn)) +
  geom_boxplot() +
  labs(title = "Tenure by Churn Status") +
  theme_minimal()
ggsave(file.path(output_dir, "tenure_by_churn.png"), p6, width=6, height=4)

# Save statistical results to CSV
stats_results <- data.frame(
  Test = c("Contract_ChiSq", "InternetService_ChiSq", "TechSupport_ChiSq", "Tenure_TTest", "MonthlyCharges_TTest", "TotalCharges_TTest"),
  p_value = c(
    chisq.test(table(df_clean$Contract, df_clean$Churn))$p.value,
    chisq.test(table(df_clean$InternetService, df_clean$Churn))$p.value,
    chisq.test(table(df_clean$TechSupport, df_clean$Churn))$p.value,
    t.test(tenure ~ Churn, data = df_clean)$p.value,
    t.test(MonthlyCharges ~ Churn, data = df_clean)$p.value,
    t.test(TotalCharges ~ Churn, data = df_clean)$p.value
  )
)
stats_results$Significant <- ifelse(stats_results$p_value < 0.05, "Yes", "No")

write_csv(stats_results, file.path(output_dir, "statistical_results.csv"))

cat(sprintf("Successfully generated visualizations and statistical_results.csv in %s\n", output_dir))
cat("\n==================================================\n")
cat("R SCRIPT COMPLETED\n")
cat("==================================================\n")
