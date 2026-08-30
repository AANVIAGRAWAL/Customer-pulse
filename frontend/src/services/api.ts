import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface DashboardKPIs {
  average_monthly_charges: number;
  churn_rate: number;
  churned_customers: number;
  retained_customers: number;
  retention_rate: number;
  revenue_lost_to_churn: number;
  total_customers: number;
  total_revenue: number;
}

export interface ChurnAnalysisData {
  churn_by_contract: Array<{ churn_rate: number; contract: string; total: number }>;
  churn_by_internet: Array<{ churn_rate: number; internet: string; total: number }>;
  churn_by_tenure: Array<{ churn_rate: number; tenure_group: string; total: number }>;
}

export interface SegmentData {
  value_tier: string;
  customer_count: number;
  avg_tenure: number;
  avg_monthly: number;
  churn_rate: number;
}

export interface InsightData {
  observed_pattern: string;
  model_association: string;
  business_recommendation: string;
}

export interface UploadResponse {
  status?: string;
  message: string;
  row_count?: number;
  error?: string;
}



export interface AtRiskCustomer {
  customerID: string;
  churn_probability: number;
  risk_level: string;
  gender: string;
  tenure: number;
  MonthlyCharges: number;
  prediction_timestamp?: string;
}

export interface AtRiskResponse {
  data: AtRiskCustomer[];
  limit: number;
  page: number;
  total: number;
}

export interface CustomerListItem {
  customerID: string;
  gender: string;
  tenure: number;
  Contract: string;
  InternetService: string;
  MonthlyCharges: number;
  Churn: string;
}

export interface CustomerListResponse {
  data: CustomerListItem[];
  limit: number;
  page: number;
  total: number;
}

export interface CustomerProfileResponse {
  customerID: string;
  demographics: {
    gender: string;
    SeniorCitizen: number;
    Partner: string;
    Dependents: string;
  };
  account: {
    Contract: string;
    PaperlessBilling: string;
    PaymentMethod: string;
  };
  services: {
    PhoneService: string;
    MultipleLines: string;
    InternetService: string;
    OnlineSecurity: string;
    OnlineBackup: string;
    DeviceProtection: string;
    TechSupport: string;
    StreamingTV: string;
    StreamingMovies: string;
  };
  financial_metrics: {
    tenure: number;
    MonthlyCharges: number;
    TotalCharges: number;
    AvgMonthlyCharge: number;
    TotalServices: number;
  };
  churn_status: {
    Churn: string;
    TenureGroup: string;
  };
  risk?: {
    churn_probability: number;
    risk_level: string;
  } | null;
}

export const checkHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export const getDashboard = async (): Promise<DashboardKPIs> => {
  const response = await apiClient.get('/dashboard');
  return response.data;
};

export const getCustomers = async (params = {}): Promise<CustomerListResponse> => {
  const response = await apiClient.get('/customers', { params });
  return response.data;
};

export const getCustomer = async (id: string): Promise<CustomerProfileResponse> => {
  const response = await apiClient.get(`/customers/${id}`);
  return response.data;
};

export const getAtRiskCustomers = async (params = {}): Promise<AtRiskResponse> => {
  const response = await apiClient.get('/at-risk', { params });
  return response.data;
};

export const getChurnAnalysis = async (): Promise<ChurnAnalysisData> => {
  const response = await apiClient.get('/churn-analysis');
  return response.data;
};

export const getSegments = async (): Promise<SegmentData[]> => {
  const response = await apiClient.get('/segments');
  return response.data;
};

export const getInsights = async (): Promise<InsightData[]> => {
  const response = await apiClient.get('/insights');
  return response.data;
};

export const predictCustomer = async (data: any) => {
  const response = await apiClient.post('/predict', data);
  return response.data;
};

export const uploadDataset = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const response = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return error.response.data; // Return the 422/400 JSON from the backend gracefully
    }
    throw error;
  }
};

export interface AuthResponse {
  status: string;
  message: string;
  token?: string;
  mock_mode?: boolean;
  user?: { email: string };
}

export const getSessionStatus = async (): Promise<{ status: string; has_data: boolean }> => {
  const response = await apiClient.get('/auth/session-status');
  return response.data;
};
