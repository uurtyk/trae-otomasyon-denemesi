import { useAuthStore } from '../store/authStore';
import { AuthResponse, User } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private getHeaders(): HeadersInit {
    const token = useAuthStore.getState().token;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }

      throw new Error(data.message || 'Bir hata oluştu');
    }

    return data;
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key].toString());
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  async uploadFile<T>(endpoint: string, file: File, fieldName: string = 'file'): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);

    const token = useAuthStore.getState().token;
    const headers: HeadersInit = {};
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse<T>(response);
  }
}

export const api = new ApiService();

// Auth API calls
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', credentials),
  
  register: (userData: any) =>
    api.post<AuthResponse>('/auth/register', userData),
  
  forgotPassword: (email: string) =>
    api.post<{ success: boolean; message: string }>('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) =>
    api.post<{ success: boolean; message: string }>('/auth/reset-password', { token, password }),
  
  getProfile: () =>
    api.get<{ success: boolean; data: User }>('/auth/profile'),
  
  updateProfile: (userData: Partial<User>) =>
    api.put<{ success: boolean; data: User }>('/auth/profile', userData),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put<{ success: boolean; message: string }>('/auth/change-password', {
      currentPassword,
      newPassword,
    }),
};

// Patient API calls
export const patientAPI = {
  getPatients: (params?: any) =>
    api.get<{ success: boolean; data: any }>('/patients', params),
  
  getPatient: (id: string) =>
    api.get<{ success: boolean; data: any }>(`/patients/${id}`),
  
  createPatient: (patientData: any) =>
    api.post<{ success: boolean; data: any }>('/patients', patientData),
  
  updatePatient: (id: string, patientData: any) =>
    api.put<{ success: boolean; data: any }>(`/patients/${id}`, patientData),
  
  deletePatient: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/patients/${id}`),
  
  searchPatients: (search: string) =>
    api.get<{ success: boolean; data: any }>('/patients/search', { search }),
};

// Appointment API calls
export const appointmentAPI = {
  getAppointments: (params?: any) =>
    api.get<{ success: boolean; data: any }>('/appointments', params),
  
  getAppointment: (id: string) =>
    api.get<{ success: boolean; data: any }>(`/appointments/${id}`),
  
  createAppointment: (appointmentData: any) =>
    api.post<{ success: boolean; data: any }>('/appointments', appointmentData),
  
  updateAppointment: (id: string, appointmentData: any) =>
    api.put<{ success: boolean; data: any }>(`/appointments/${id}`, appointmentData),
  
  updateAppointmentStatus: (id: string, status: string) =>
    api.patch<{ success: boolean; data: any }>(`/appointments/${id}/status`, { status }),
  
  deleteAppointment: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/appointments/${id}`),
  
  getAvailableSlots: (dentistId: string, date: string, duration?: number) =>
    api.get<{ success: boolean; data: any }>('/appointments/available-slots', {
      dentistId,
      date,
      duration,
    }),
  
  getTodayAppointments: () =>
    api.get<{ success: boolean; data: any }>('/appointments/today'),
};

// Treatment API calls
export const treatmentAPI = {
  getTreatments: (params?: any) =>
    api.get<{ success: boolean; data: any }>('/treatments', params),
  
  getTreatment: (id: string) =>
    api.get<{ success: boolean; data: any }>(`/treatments/${id}`),
  
  createTreatment: (treatmentData: any) =>
    api.post<{ success: boolean; data: any }>('/treatments', treatmentData),
  
  updateTreatment: (id: string, treatmentData: any) =>
    api.put<{ success: boolean; data: any }>(`/treatments/${id}`, treatmentData),
  
  addProgressNote: (id: string, noteData: any) =>
    api.patch<{ success: boolean; data: any }>(`/treatments/${id}/progress-note`, noteData),
  
  getPatientTreatmentHistory: (patientId: string) =>
    api.get<{ success: boolean; data: any }>(`/treatments/patient/${patientId}/history`),
  
  getTreatmentStatistics: (params?: any) =>
    api.get<{ success: boolean; data: any }>('/treatments/statistics', params),
  
  updateDentalChart: (patientId: string, teethData: any) =>
    api.patch<{ success: boolean; data: any }>(`/treatments/patient/${patientId}/dental-chart`, teethData),
};

// Invoice API calls
export const invoiceAPI = {
  getInvoices: (params?: any) =>
    api.get<{ success: boolean; data: any }>('/invoices', params),
  
  getInvoice: (id: string) =>
    api.get<{ success: boolean; data: any }>(`/invoices/${id}`),
  
  createInvoice: (invoiceData: any) =>
    api.post<{ success: boolean; data: any }>('/invoices', invoiceData),
  
  updateInvoice: (id: string, invoiceData: any) =>
    api.put<{ success: boolean; data: any }>(`/invoices/${id}`, invoiceData),
  
  updateInvoiceStatus: (id: string, status: string, notes?: string) =>
    api.patch<{ success: boolean; data: any }>(`/invoices/${id}/status`, { status, notes }),
  
  createPayment: (paymentData: any) =>
    api.post<{ success: boolean; data: any }>('/invoices/payments', paymentData),
  
  getPayments: (params?: any) =>
    api.get<{ success: boolean; data: any }>('/invoices/payments', params),
};

// Dashboard API calls
export const dashboardAPI = {
  getStats: () =>
    api.get<{ success: boolean; data: any }>('/dashboard/stats'),
  
  getAppointments: (params?: any) =>
    api.get<{ success: boolean; data: any }>('/dashboard/appointments', params),
  
  getRevenue: (params?: any) =>
    api.get<{ success: boolean; data: any }>('/dashboard/revenue', params),
};

// Export all API services
export const apiServices = {
  auth: authAPI,
  patients: patientAPI,
  appointments: appointmentAPI,
  treatments: treatmentAPI,
  invoices: invoiceAPI,
  dashboard: dashboardAPI,
};