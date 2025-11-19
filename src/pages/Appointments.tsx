import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiServices } from '../services/api';
import { Navbar } from '../components/Navbar';
import { Calendar, Clock, User, Phone, Mail, Plus, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface Appointment {
  _id: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  dentist: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  date: string;
  time: string;
  duration: number;
  treatmentType: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

interface TimeSlot {
  time: string;
  display: string;
  appointments: Appointment[];
}

export const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'daily' | 'weekly'>('daily');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchAppointments();
  }, [currentDate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const startDate = new Date(currentDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(currentDate);
      if (viewType === 'daily') {
        endDate.setHours(23, 59, 59, 999);
      } else {
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      }

      const response = await apiServices.appointments.getAppointments({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      setAppointments(response.data.data);
    } catch (error) {
      console.error('Randevular alınamadı:', error);
      toast.error('Randevular yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      if (viewType === 'daily') {
        newDate.setDate(newDate.getDate() - 1);
      } else {
        newDate.setDate(newDate.getDate() - 7);
      }
    } else {
      if (viewType === 'daily') {
        newDate.setDate(newDate.getDate() + 1);
      } else {
        newDate.setDate(newDate.getDate() + 7);
      }
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Planlandı';
      case 'confirmed':
        return 'Onaylandı';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal';
      case 'no_show':
        return 'Gelmedi';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-300';
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = 
      appointment.patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.patient.phone.includes(searchTerm) ||
      appointment.treatmentType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const timeSlots: TimeSlot[] = [
    { time: '08:00', display: '08:00', appointments: [] },
    { time: '08:30', display: '08:30', appointments: [] },
    { time: '09:00', display: '09:00', appointments: [] },
    { time: '09:30', display: '09:30', appointments: [] },
    { time: '10:00', display: '10:00', appointments: [] },
    { time: '10:30', display: '10:30', appointments: [] },
    { time: '11:00', display: '11:00', appointments: [] },
    { time: '11:30', display: '11:30', appointments: [] },
    { time: '12:00', display: '12:00', appointments: [] },
    { time: '12:30', display: '12:30', appointments: [] },
    { time: '13:00', display: '13:00', appointments: [] },
    { time: '13:30', display: '13:30', appointments: [] },
    { time: '14:00', display: '14:00', appointments: [] },
    { time: '14:30', display: '14:30', appointments: [] },
    { time: '15:00', display: '15:00', appointments: [] },
    { time: '15:30', display: '15:30', appointments: [] },
    { time: '16:00', display: '16:00', appointments: [] },
    { time: '16:30', display: '16:30', appointments: [] },
    { time: '17:00', display: '17:00', appointments: [] },
    { time: '17:30', display: '17:30', appointments: [] },
    { time: '18:00', display: '18:00', appointments: [] }
  ];

  const getAppointmentsForTimeSlot = (timeSlot: string) => {
    return filteredAppointments.filter(appointment => appointment.time === timeSlot);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
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
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Randevular</h1>
                <p className="text-gray-600 mt-2">Randevu takvimi ve yönetimi</p>
              </div>
              <Link
                to="/appointments/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Yeni Randevu
              </Link>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Date Navigation */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => navigateDate('prev')}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={goToToday}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Bugün
                  </button>
                  
                  <div className="text-lg font-semibold text-gray-900">
                    {formatDate(currentDate)}
                  </div>
                  
                  <button
                    onClick={() => navigateDate('next')}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* View Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewType('daily')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      viewType === 'daily'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Günlük
                  </button>
                  <button
                    onClick={() => setViewType('weekly')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      viewType === 'weekly'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Haftalık
                  </button>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4 mt-4">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Hasta ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="scheduled">Planlandı</option>
                  <option value="confirmed">Onaylandı</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="cancelled">İptal</option>
                  <option value="no_show">Gelmedi</option>
                </select>
              </div>
            </div>
          </div>

          {/* Calendar View */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {viewType === 'daily' ? (
              <div className="divide-y divide-gray-200">
                {timeSlots.map((slot) => {
                  const slotAppointments = getAppointmentsForTimeSlot(slot.time);
                  return (
                    <div key={slot.time} className="flex">
                      <div className="w-24 py-4 px-4 text-sm font-medium text-gray-500 bg-gray-50">
                        {slot.display}
                      </div>
                      <div className="flex-1 py-4 px-4 min-h-16">
                        {slotAppointments.length > 0 ? (
                          <div className="space-y-2">
                            {slotAppointments.map((appointment) => (
                              <div
                                key={appointment._id}
                                className={`p-3 rounded-lg border-l-4 ${getPriorityColor(appointment.priority)} bg-gray-50`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                      <User className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        {appointment.patient.firstName} {appointment.patient.lastName}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        {appointment.treatmentType}
                                      </p>
                                      <div className="flex items-center space-x-2 mt-1">
                                        <Phone className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-gray-500">{appointment.patient.phone}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                                      {getStatusText(appointment.status)}
                                    </span>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {appointment.duration} dk
                                    </p>
                                  </div>
                                </div>
                                {appointment.notes && (
                                  <p className="text-sm text-gray-600 mt-2 p-2 bg-white rounded border">
                                    {appointment.notes}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-gray-400 py-4">
                            <Calendar className="w-6 h-6 mx-auto mb-2" />
                            <p className="text-sm">Boş</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6">
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Haftalık görünüm yakında eklenecek</p>
                </div>
              </div>
            )}
          </div>

          {/* Appointment Summary */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Toplam</p>
                  <p className="text-lg font-semibold text-gray-900">{filteredAppointments.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-full">
                  <Clock className="w-4 h-4 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Onaylandı</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {filteredAppointments.filter(a => a.status === 'confirmed').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Planlandı</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {filteredAppointments.filter(a => a.status === 'scheduled').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-full">
                  <Clock className="w-4 h-4 text-gray-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Tamamlandı</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {filteredAppointments.filter(a => a.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-full">
                  <Clock className="w-4 h-4 text-red-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">İptal</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {filteredAppointments.filter(a => a.status === 'cancelled').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};