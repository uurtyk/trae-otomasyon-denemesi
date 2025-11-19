import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Menu, X, User, LogOut, Settings, Bell, Search } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'dentist':
        return 'Diş Hekimi';
      case 'assistant':
        return 'Diş Hekimi Asistanı';
      case 'receptionist':
        return 'Resepsiyonist';
      case 'admin':
        return 'Yönetici';
      default:
        return 'Kullanıcı';
    }
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">Diş Kliniği</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/dashboard"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-blue-500 text-sm font-medium text-gray-900"
              >
                Ana Sayfa
              </Link>
              <Link
                to="/patients"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                  window.location.pathname === '/patients'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Hastalar
              </Link>
              <Link
                to="/appointments"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors"
              >
                Randevular
              </Link>
              <Link
                to="/treatments"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors"
              >
                Tedaviler
              </Link>
              <Link
                to="/invoices"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors"
              >
                Faturalar
              </Link>
            </div>
          </div>

          {/* Right side */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Ara..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:text-gray-900 focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Notifications */}
            <button className="ml-3 p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Bell className="h-6 w-6" />
            </button>

            {/* User menu */}
            <div className="ml-3 relative">
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getRoleDisplayName(user?.role || '')}
                  </div>
                </div>
                <div className="relative">
                  <button
                    className="bg-gray-800 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    id="user-menu"
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  </button>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1 text-gray-400 hover:text-gray-500 focus:outline-none"
                  title="Çıkış Yap"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/dashboard"
              className="block pl-3 pr-4 py-2 border-l-4 border-blue-500 text-base font-medium text-blue-700 bg-blue-50"
            >
              Ana Sayfa
            </Link>
            <Link
              to="/patients"
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              Hastalar
            </Link>
            <Link
              to="/appointments"
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              Randevular
            </Link>
            <Link
              to="/treatments"
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              Tedaviler
            </Link>
            <Link
              to="/invoices"
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              Faturalar
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-sm text-gray-500">
                  {getRoleDisplayName(user?.role || '')}
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              >
                <LogOut className="inline w-4 h-4 mr-2" />
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};