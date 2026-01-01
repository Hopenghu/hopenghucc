import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';

const Navbar = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { path: '/', label: '首頁' },
    { path: '/explore', label: '探索' },
    { path: '/events', label: '活動' },
    { path: '/offers', label: '優惠' },
  ];

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (response.ok) {
        // 可以選擇重定向到首頁或登入頁
        window.location.href = '/'; 
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // 點擊外部關閉用戶菜單
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-primary-ocean">好澎湖</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${
                  location.pathname === item.path ? 'nav-link-active' : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
            {/* User Avatar / Login Button */}
            <div className="relative user-menu-container">
              {user ? (
                <button onClick={() => setShowUserMenu(!showUserMenu)} className="focus:outline-none">
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.name || 'User Avatar'} 
                      className="h-8 w-8 rounded-full object-cover border-2 border-primary-sky hover:border-primary-ocean transition-colors duration-200 cursor-pointer"
                    />
                  ) : (
                    <UserCircleIcon className="h-8 w-8 text-gray-500 hover:text-primary-ocean transition-colors duration-200 cursor-pointer" />
                  )}
                </button>
              ) : (
                <Link to="/login" className="btn btn-primary">
                  登入
                </Link>
              )}
              {/* User Dropdown Menu */}
              {user && showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    我的地點
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setShowUserMenu(false); }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    登出
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
             {/* Mobile User Avatar / Login Button */}
             <div>
              {user ? (
                 <Link to="/profile">
                   {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name || 'User Avatar'} className="h-8 w-8 rounded-full object-cover border-2 border-primary-sky"/>
                   ) : (
                    <UserCircleIcon className="h-8 w-8 text-gray-500" />
                   )}
                 </Link>
              ) : (
                <Link to="/login" className="text-sm font-medium text-primary-ocean hover:text-primary-dark">
                  登入
                </Link>
              )}
            </div>
             {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-text hover:text-primary-ocean focus:outline-none"
            >
              {isOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname === item.path
                      ? 'bg-primary-sky text-primary-ocean'
                      : 'text-text hover:bg-primary-sky hover:text-primary-ocean'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {/* Mobile Logout Button */} 
              {user && (
                 <button
                    onClick={() => { handleLogout(); setIsOpen(false); }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                  >
                    登出
                  </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 