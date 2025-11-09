import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';


const OwnerLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getOwnerTypeColor = () => {
    switch (user?.role) {
      case 'HOTEL_OWNER': return 'from-blue-600 to-blue-700';
      case 'HOSPITAL_OWNER': return 'from-red-600 to-red-700';
      case 'SHOP_OWNER': return 'from-green-600 to-green-700';
      case 'OWNER': return 'from-purple-600 to-purple-700';
      default: return 'from-gray-600 to-gray-700';
    }
  };

  const getOwnerTypeIcon = () => {
    switch (user?.role) {
      case 'HOTEL_OWNER': return '🏨';
      case 'HOSPITAL_OWNER': return '🏥';
      case 'SHOP_OWNER': return '🛍️';
      case 'OWNER': return '🏢';
      default: return '🏢';
    }
  };

  const getNavigation = () => {
    const baseNav = [
      { name: 'Dashboard', href: '/owner', icon: '📊' },
      { name: 'Bookings', href: '/owner/bookings', icon: '📅' },
      { name: 'Orders', href: '/owner/orders', icon: '📋' },
      { name: 'Reviews', href: '/owner/reviews', icon: '⭐' },
      { name: 'Settings', href: '/owner/settings', icon: '⚙️' },
    ];

    // Add role-specific navigation
    if (user?.role === 'HOTEL_OWNER') {
      baseNav.splice(2, 0, { name: 'Menu', href: '/owner/menus', icon: '🍽️' });
    } else if (user?.role === 'HOSPITAL_OWNER') {
      baseNav.splice(2, 0, { name: 'Doctors', href: '/owner/items', icon: '👨‍⚕️' });
    } else if (user?.role === 'SHOP_OWNER') {
      baseNav.splice(2, 0, { name: 'Products', href: '/owner/items', icon: '🛍️' });
    } else {
      baseNav.splice(2, 0, { name: 'Items', href: '/owner/items', icon: '📋' });
    }

    return baseNav;
  };

  const navigation = getNavigation();

  const isActive = (href) => {
    if (href === '/owner') {
      return location.pathname === '/owner' || location.pathname === '/owner/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className={`h-10 w-10 bg-gradient-to-br ${getOwnerTypeColor()} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <span className="text-white text-lg">{getOwnerTypeIcon()}</span>
                </div>
                <div className="ml-3">
                  <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">OpenNova</span>
                  <div className="text-xs text-slate-500 font-medium tracking-wider">OWNER PORTAL</div>
                </div>
              </div>
              
              <div className="hidden md:ml-12 md:flex md:space-x-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`nav-link ${
                      isActive(item.href) ? 'nav-link-active' : 'nav-link-inactive'
                    }`}
                  >
                    <span className="mr-2 text-lg">{item.icon}</span>
                    <span className="font-semibold">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`h-8 w-8 bg-gradient-to-r ${getOwnerTypeColor()} rounded-full flex items-center justify-center`}>
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-700">{user?.name}</div>
                  <div className="text-xs text-gray-500">
                    {user?.role?.replace('_', ' ')}
                  </div>
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

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-b border-gray-200">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive(item.href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      

    </div>
  );
};

export default OwnerLayout;