import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { apiServices } from '../services/api';
import { Navbar } from '../components/Navbar';
import { User, Calendar, DollarSign, Users, TrendingUp, Clock, AlertCircle } from 'lucide-react';

interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pendingAppointments: number;
  monthlyRevenue: number;
  recentAppointments: Array<{
    _id: string;
    patient: {
      firstName: string;
      lastName: string;
    };
    date: string;
    time: string;
    status: string;
    treatmentType: string;
  }>;
  pendingTreatments: Array<{
    _id: string;
    patient: {
      firstName: string;
      lastName: string;
    };
    treatmentType: string;
    totalCost: number;
    status: string;
  }>;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await apiServices.dashboard.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Dashboard verileri alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-6">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hoş Geldiniz, {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-gray-600">
            {user?.role === 'dentist' && 'Diş Hekimi'}
            {user?.role === 'assistant' && 'Diş Hekimi Asistanı'}
            {user?.role === 'receptionist' && 'Resepsiyonist'}
            {user?.role === 'admin' && 'Yönetici'} Paneli
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Hasta</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalPatients || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bugünkü Randevular</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.todayAppointments || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bekleyen Randevular</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.pendingAppointments || 0}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aylık Gelir</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.monthlyRevenue || 0)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Appointments */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Yaklaşan Randevular</h3>
            </div>
            <div className="p-6">
              {stats?.recentAppointments && stats.recentAppointments.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentAppointments.map((appointment) => (
                    <div key={appointment._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <Calendar className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {appointment.patient.firstName} {appointment.patient.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{appointment.treatmentType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{appointment.time}</p>
                        <p className="text-xs text-gray-600">{formatDate(appointment.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Yaklaşan randevu bulunmuyor</p>
                </div>
              )}
            </div>
          </div>

          {/* Pending Treatments */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Devam Eden Tedaviler</h3>
            </div>
            <div className="p-6">
              {stats?.pendingTreatments && stats.pendingTreatments.length > 0 ? (
                <div className="space-y-4">
                  {stats.pendingTreatments.map((treatment) => (
                    <div key={treatment._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-yellow-100 rounded-full">
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {treatment.patient.firstName} {treatment.patient.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{treatment.treatmentType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(treatment.totalCost)}</p>
                        <p className="text-xs text-yellow-600">Devam Ediyor</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Devam eden tedavi bulunmuyor</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İşlemler</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => navigate('/patients/new')}
                className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <User className="w-5 h-5 text-blue-600 mr-3" />
                <span className="text-sm font-medium text-blue-900">Yeni Hasta</span>
              </button>
              <button
                onClick={() => navigate('/appointments')}
                className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Calendar className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-sm font-medium text-green-900">Randevu Al</span>
              </button>
              <button className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <DollarSign className="w-5 h-5 text-purple-600 mr-3" />
                <span className="text-sm font-medium text-purple-900">Fatura Oluştur</span>
              </button>
              <button className="flex items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                <TrendingUp className="w-5 h-5 text-yellow-600 mr-3" />
                <span className="text-sm font-medium text-yellow-900">Raporlar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};