import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiServices } from '../services/api';
import { Navbar } from '../components/Navbar';
import { toast } from 'sonner';
import { User, Mail, Phone, MapPin, Calendar, Save, ArrowLeft } from 'lucide-react';

export const PatientForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    medicalHistory: [] as string[],
    allergies: [] as string[],
    isActive: true
  });

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchPatient();
    }
  }, [id]);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const response = await apiServices.patients.getPatient(id!);
      const patient = response.data.data;
      setFormData({
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth.split('T')[0],
        gender: patient.gender,
        address: patient.address,
        emergencyContact: patient.emergencyContact,
        medicalHistory: patient.medicalHistory || [],
        allergies: patient.allergies || [],
        isActive: patient.isActive
      });
    } catch (error) {
      console.error('Hasta bilgileri alınamadı:', error);
      toast.error('Hasta bilgileri yüklenemedi');
      navigate('/patients');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleArrayChange = (field: 'medicalHistory' | 'allergies', value: string) => {
    const items = value.split('\n').filter(item => item.trim() !== '');
    setFormData(prev => ({
      ...prev,
      [field]: items
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditing) {
        await apiServices.patients.updatePatient(id!, formData);
        toast.success('Hasta bilgileri güncellendi');
      } else {
        await apiServices.patients.createPatient(formData);
        toast.success('Hasta başarıyla kaydedildi');
      }
      navigate('/patients');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'İşlem gerçekleştirilemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-4">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => navigate('/patients')}
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {isEditing ? 'Hasta Düzenle' : 'Yeni Hasta'}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {isEditing ? 'Hasta bilgilerini güncelleyin' : 'Yeni hasta kaydı oluşturun'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Kişisel Bilgiler
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    Ad *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Soyad *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    E-posta *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                    Doğum Tarihi *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      required
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                    Cinsiyet *
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    required
                    value={formData.gender}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="male">Erkek</option>
                    <option value="female">Kadın</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Adres Bilgileri
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="address.street" className="block text-sm font-medium text-gray-700 mb-2">
                    Sokak Adresi
                  </label>
                  <input
                    type="text"
                    id="address.street"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="address.city" className="block text-sm font-medium text-gray-700 mb-2">
                    Şehir
                  </label>
                  <input
                    type="text"
                    id="address.city"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="address.state" className="block text-sm font-medium text-gray-700 mb-2">
                    Eyalet/İlçe
                  </label>
                  <input
                    type="text"
                    id="address.state"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="address.zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Posta Kodu
                  </label>
                  <input
                    type="text"
                    id="address.zipCode"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Acil Durum Kontağı
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="emergencyContact.name" className="block text-sm font-medium text-gray-700 mb-2">
                    İsim
                  </label>
                  <input
                    type="text"
                    id="emergencyContact.name"
                    name="emergencyContact.name"
                    value={formData.emergencyContact.name}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="emergencyContact.phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    id="emergencyContact.phone"
                    name="emergencyContact.phone"
                    value={formData.emergencyContact.phone}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="emergencyContact.relationship" className="block text-sm font-medium text-gray-700 mb-2">
                    Yakınlık
                  </label>
                  <input
                    type="text"
                    id="emergencyContact.relationship"
                    name="emergencyContact.relationship"
                    value={formData.emergencyContact.relationship}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Tıbbi Bilgiler
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700 mb-2">
                    Tıbbi Geçmiş (Her satıra bir durum)
                  </label>
                  <textarea
                    id="medicalHistory"
                    rows={4}
                    value={formData.medicalHistory.join('\n')}
                    onChange={(e) => handleArrayChange('medicalHistory', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Diyabet&#10;Hipertansiyon&#10;Kalp hastalığı"
                  />
                </div>
                
                <div>
                  <label htmlFor="allergies" className="block text-sm font-medium text-gray-700 mb-2">
                    Alerjiler (Her satıra bir alerji)
                  </label>
                  <textarea
                    id="allergies"
                    rows={4}
                    value={formData.allergies.join('\n')}
                    onChange={(e) => handleArrayChange('allergies', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Penisilin&#10;Laktoz&#10;Fıstık"
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Aktif Hasta
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/patients')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isEditing ? 'Güncelle' : 'Kaydet'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};