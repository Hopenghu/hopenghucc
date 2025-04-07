import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, UserCircleIcon } from '@heroicons/react/24/outline';

function Navbar() {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <HomeIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-800">Hopenghu CC</span>
            </Link>
          </div>
          <div className="flex items-center">
            <Link
              to="/login"
              className="flex items-center px-4 py-2 text-gray-700 hover:text-blue-600"
            >
              <UserCircleIcon className="h-6 w-6" />
              <span className="ml-2">登入</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 