import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, LogOut, BarChart3, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header: React.FC = () => {
  const { admin, user, logout } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <header className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-xl group-hover:from-blue-700 group-hover:to-blue-800 transition-all duration-200">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              EventFlow
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {!isAdminRoute ? (
              <>
                <Link 
                  to="/" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  Events
                </Link>
                {user ? (
                  <div className="flex items-center space-x-4">
                    <Link 
                      to="/dashboard" 
                      className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium flex items-center space-x-2"
                    >
                      <User className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                    <div className="flex items-center space-x-3">
                      <div className="text-sm">
                        <div className="text-gray-900 font-medium">{user.name}</div>
                        <div className="text-gray-500 text-xs">{user.email}</div>
                      </div>
                      <button
                        onClick={logout}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="Logout"
                      >
                        <LogOut className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <Link 
                      to="/login" 
                      className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                    >
                      Login
                    </Link>
                    <Link 
                      to="/admin/login" 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                    >
                      Organizer Login
                    </Link>
                  </div>
                )}
              </>
            ) : admin ? (
              <>
                <Link 
                  to="/admin/dashboard" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium flex items-center space-x-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link 
                  to="/admin/events" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  Events
                </Link>
                <div className="flex items-center space-x-3">
                  <div className="text-sm">
                    <div className="text-gray-900 font-medium">{admin.name}</div>
                    <div className="text-gray-500 text-xs">{admin.organization}</div>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : null}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            {!isAdminRoute ? (
              user ? (
                <div className="flex items-center space-x-2">
                  <Link 
                    to="/dashboard" 
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="p-2 text-gray-500 hover:text-red-600"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium"
                >
                  Login
                </Link>
              )
            ) : admin ? (
              <button
                onClick={logout}
                className="p-2 text-gray-500 hover:text-red-600"
              >
                <LogOut className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;