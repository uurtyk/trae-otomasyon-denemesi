import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiServices } from '../services/api';
import { Navbar } from '../components/Navbar';
import { Search, Plus, Edit, Trash2, Eye, Phone, Mail, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory: string[];
  allergies: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const Patients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await apiServices.patients.getPatients();
      setPatients(response.data.data);
    } catch (error) {
      console.error('Hastalar alınamadı:', error);
      toast.error('Hasta listesi yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (patientId: string) => {
    if (window.confirm('Bu hastayı silmek istediğinizden emin misiniz?')) {
      try {
        await apiServices.patients.deletePatient(patientId);
        setPatients(patients.filter(p => p._id !== patientId));
        toast.success('Hasta başarıyla silindi');
      } catch (error) {
        console.error('Hasta silinemedi:', error);
        toast.error('Hasta silinirken bir hata oluştu');
      }
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm);

    const matchesFilter = 
      filter === 'all' ||
      (filter === 'active' && patient.isActive) ||
      (filter === 'inactive' && !patient.isActive);

    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Hasta Yönetimi</h1>
                <p className="text-gray-600 mt-2">Hasta kayıtlarını yönetin</p>
              </div>
              <Link
                to="/patients/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Yeni Hasta
              </Link>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-lg shadow mb-6 p-4">
            <div className="flex flex-col md:flex-row gap-4">
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
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tüm Hastalar</option>
                <option value="active">Aktif Hastalar</option>
                <option value="inactive">Pasif Hastalar</option>
              </select>
            </div>
          </div>

          {/* Patients Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Hastalar yükleniyor...</p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="p-8 text-center">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchTerm ? 'Arama kriterlerinize uygun hasta bulunamadı.' : 'Henüz hasta kaydı bulunmuyor.'}
                </p>
                {searchTerm === '' && (
                  <Link
                    to="/patients/new"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-4"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    İlk Hasta Kaydını Oluştur
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hasta
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İletişim
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Yaş/Cinsiyet
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kayıt Tarihi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPatients.map((patient) => (
                      <tr key={patient._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {patient.firstName} {patient.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {patient.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 text-gray-400 mr-1" />
                              {patient.phone}
                            </div>
                            {patient.address.city && (
                              <div className="text-sm text-gray-500 mt-1">
                                {patient.address.city}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {calculateAge(patient.dateOfBirth)} yaşında
                          </div>
                          <div className="text-sm text-gray-500">
                            {patient.gender === 'male' ? 'Erkek' : patient.gender === 'female' ? 'Kadın' : 'Diğer'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            patient.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {patient.isActive ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(patient.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link
                              to={`/patients/${patient._id}`}
                              className="text-blue-600 hover:text-blue-900"
                              title="Görüntüle"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              to={`/patients/${patient._id}/edit`}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Düzenle"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(patient._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};