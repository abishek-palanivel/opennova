import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const UserLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/user', icon: '🏠' },
    { name: 'Browse', href: '/user/browse', icon: '🔍' },
    { name: 'My Bookings', href: '/user/bookings', icon: '📅' },
    { name: 'Add Request', href: '/user/request', icon: '➕' },
    { name: 'Reviews', href: '/user/reviews', icon: '⭐' },
  ];

  const isActive = (href) => {
    if (href === '/user') {
      return location.pathname === '/user' || location.pathname === '/user/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-lg">🏢</span>
                </div>
                <div className="ml-3">
                  <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">OpenNova</span>
                  <div className="text-xs text-slate-500 font-medium tracking-wider">USER PORTAL</div>
                </div>
              </div>

              <div className="hidden md:ml-12 md:flex md:space-x-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive(item.href)
                        ? "bg-blue-100 text-blue-700 border-blue-300"
                        : "text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-transparent"
                    } group flex items-center px-4 py-2 text-sm font-medium rounded-lg border transition-colors duration-200`}
                  >
                    <span className="mr-2 text-lg">{item.icon}</span>
                    <span className="font-semibold">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-700">{user?.name}</div>
                  <div className="text-xs text-gray-500">User</div>
                </div>
              </div>

              <button
                onClick={logout}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="md:hidden bg-white border-b border-gray-200">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`${
                isActive(item.href) 
                  ? "bg-blue-700 text-white" 
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              } block px-3 py-2 rounded-md text-base font-medium`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default UserLayout;
