import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationSystem from '../common/NotificationSystem';
import OpenNovaLogo from '../common/OpenNovaLogo';
import LiveChat from '../common/LiveChat';
import ChatErrorBoundary from '../common/ChatErrorBoundary';

const UserLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/user', icon: '📊', description: 'Overview & Analytics' },
    { name: 'Browse', href: '/user/browse', icon: '🔍', description: 'Find Establishments' },
    { name: 'My Bookings', href: '/user/bookings', icon: '📅', description: 'Manage Bookings' },
    { name: 'Reviews', href: '/user/reviews', icon: '⭐', description: 'Rate & Review' },
    { name: 'Add Request', href: '/user/request', icon: '➕', description: 'Request New Place' },
  ];

  const isActive = (href) => {
    if (href === '/user') {
      return location.pathname === '/user' || location.pathname === '/user/';
    }
    return location.pathname.startsWith(href);
  };

  // Modern Logo Component
  const ModernLogo = () => (
    <div className="flex items-center group cursor-pointer">
      <OpenNovaLogo className="h-11 w-11 mr-3" />
      <div>
        <div className="flex items-center">
          <span className="text-xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Open
          </span>
          <span className="text-xl font-black text-slate-800 ml-0.5">Nova</span>
        </div>
        <div className="text-xs text-slate-500 font-medium tracking-wide uppercase -mt-0.5">
          User Portal
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      {/* Modern Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-200/50 shadow-lg shadow-slate-200/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-18 px-6">
            {/* Logo Section */}
            <div className="flex items-center">
              <ModernLogo />
            </div>

            {/* Center Navigation - Horizontal Cards */}
            <nav className="hidden lg:flex items-center space-x-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group relative flex items-center px-3 py-2 rounded-xl font-medium transition-all duration-300 ${
                    isActive(item.href) 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <span className="text-base mr-2">{item.icon}</span>
                  <span className="text-sm font-semibold whitespace-nowrap">{item.name}</span>
                </Link>
              ))}
            </nav>

            {/* User Actions Section */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-300 group">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                </svg>
              </button>

              {/* User Profile */}
              <div className="flex items-center space-x-3 bg-slate-100/80 rounded-xl px-4 py-2.5 hover:bg-slate-200/80 transition-all duration-300 group">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <span className="text-white text-sm font-bold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold text-slate-900 truncate max-w-28">{user?.name}</div>
                  <div className="text-xs text-slate-500 font-medium">Premium Member</div>
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={logout}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </span>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/50">
            <div className="px-6 py-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <span className="text-lg mr-3">{item.icon}</span>
                  <div>
                    <div className="text-sm font-semibold">{item.name}</div>
                    <div className={`text-xs ${isActive(item.href) ? 'text-blue-100' : 'text-slate-400'}`}>
                      {item.description}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Enhanced Main Content */}
      <main className="flex-1">
        <div className="animate-fade-in-up">
          {children}
        </div>
      </main>

      {/* Modern Footer */}
      <footer className="bg-gradient-to-r from-slate-50 to-indigo-50/30 border-t border-slate-200/50 mt-16">
        <div className="max-w-7xl mx-auto py-12 px-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <OpenNovaLogo className="h-10 w-10 mr-3" />
              <div>
                <div className="flex items-center">
                  <span className="text-xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Open
                  </span>
                  <span className="text-xl font-black text-slate-800 ml-0.5">Nova</span>
                </div>
              </div>
            </div>
            <p className="text-slate-600 text-sm mb-6">
              © 2024 OpenNova. Revolutionizing the booking experience with modern design and seamless functionality.
            </p>
            <div className="flex items-center justify-center space-x-8 text-slate-500 text-sm">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                System Online
              </span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                24/7 Support
              </span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                Secure Platform
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Notification System */}
      <NotificationSystem />
      
      {/* Live Chat */}
      <ChatErrorBoundary>
        <LiveChat />
      </ChatErrorBoundary>
    </div>
  );
};

export default UserLayout;