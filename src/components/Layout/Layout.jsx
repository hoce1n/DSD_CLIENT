import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import GlobalSearch from '../GlobalSearch';
import NotificationBell from '../NotificationBell';
import {
  Menu,
  X,
  Home,
  ShoppingCart,
  Users,
  Package,
  FileText,
  Settings,
  LogOut,
  Search,
  User,
  ChevronDown,
  UserCircle,
  DollarSign
} from 'lucide-react';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const userMenuRef = useRef(null);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // اگر کاربر لاگین نکرده، به صفحه لاگین هدایت کن
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile search when screen becomes larger
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShowMobileSearch(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // اگر کاربر لاگین نکرده، چیزی نمایش نده
  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  const handleProfileClick = () => {
    setUserMenuOpen(false);
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    setUserMenuOpen(false);
    navigate('/settings');
  };

  // Menu items based on user role
  const getAllMenuItems = () => {
    return [
      { name: 'داشبورد', path: '/dashboard', icon: Home, roles: ['Admin', 'Supervisor', 'User', 'SalesRep'] },
      { name: 'مشتریان', path: '/customers', icon: Users, roles: ['Admin', 'SalesRep'] },
      { name: 'سفارشات', path: '/orders', icon: ShoppingCart, roles: ['Admin', 'Supervisor', 'User', 'SalesRep'] },
      { name: 'محصولات', path: '/products', icon: Package, roles: ['Admin', 'Supervisor', 'User', 'SalesRep'] },
      { name: 'وضعیت مالی من', path: '/profile/ledger', icon: DollarSign, roles: ['User'] },
      { name: 'کاربران', path: '/users', icon: Users, roles: ['Admin', 'Supervisor'] },
      { name: 'گزارشات', path: '/reports', icon: FileText, roles: ['Admin', 'Supervisor', 'User', 'SalesRep'] },
      { name: 'تنظیمات', path: '/settings', icon: Settings, roles: ['Admin'] },
    ];
  };

  const menuItems = getAllMenuItems().filter(item => 
    item.roles.includes(user?.role || 'User')
  );

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 backdrop-blur-sm bg-gray-600/30"></div>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-58 sm:w-80 max-h-screen bg-white shadow-lg transform ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:inset-0 lg:flex lg:flex-col lg:w-64`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <span className="mr-3 text-lg sm:text-xl font-bold heading text-gray-800">
              سفارش‌یار
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6 px-4 flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              return (
                <li key={item.path}>
                  <button
                    onClick={() => {
                      navigate(item.path);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center px-4 py-3 text-right rounded-lg transition-colors duration-200 group text-sm sm:text-base ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                    }`}
                  >
                    <item.icon 
                      className={`w-5 h-5 ml-3 transition-colors duration-200 ${
                        isActive 
                          ? 'text-blue-600' 
                          : 'text-gray-400 group-hover:text-blue-600'
                      }`} 
                    />
                    <span className="truncate">{item.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-200 absolute bottom-0 w-full">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-gray-600" />
            </div>
            <div className="mr-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-700 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-right text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4 mr-3" />
            خروج از سیستم
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center justify-between h-16 px-0 sm:px-6 lg:px-8">
            <div className="flex items-center min-w-0 flex-1">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-base sm:text-xl lg:text-2xl font-semibold heading text-gray-900 truncate">
                سامانه مدیریت سفارشات
              </h1>
            </div>

            <div className="flex items-center gap-0 sm:gap-4">
              {/* Mobile Search Toggle */}
              <button
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Global Search - Desktop */}
              <div className="hidden md:block w-64 lg:w-80">
                <GlobalSearch />
              </div>

              {/* Notifications */}
              <NotificationBell />

              {/* User menu */}
              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 bg-gray-100 hover:bg-gray-200 transition-colors px-2 sm:px-3 py-2"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <span className="mr-2 text-gray-700 font-medium hidden sm:block text-sm lg:text-base max-w-24 lg:max-w-none truncate">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 mr-1" />
                </button>

                {/* User Dropdown */}
                {userMenuOpen && (
                  <div className="absolute left-2 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="mr-3 min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                          <p className="text-xs text-blue-600 font-medium">{user?.role}</p>
                        </div>
                      </div>
                    </div>

                    <div className="py-2">
                      <button
                        onClick={() => navigate('/profile')}
                        className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <UserCircle className="w-4 h-4 ml-3 text-gray-400" />
                        پروفایل من
                      </button>
                      <button
                        onClick={handleSettingsClick}
                        className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <Settings className="w-4 h-4 ml-3 text-gray-400" />
                        تنظیمات
                      </button>
                    </div>

                    <div className="border-t border-gray-100 py-2">
                      <button
                        onClick={handleLogout}
                        className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <LogOut className="w-4 h-4 ml-3 text-red-400" />
                        خروج از سیستم
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Search Bar */}
          {showMobileSearch && (
            <div className="md:hidden border-t border-gray-200 p-4">
              <GlobalSearch />
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8 bg-gray-50 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 