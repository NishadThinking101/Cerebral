import { useAuth } from '@getmocha/users-service/react';
import { Link, useLocation } from 'react-router';
import { Music, Store, Settings, User, LogOut, Crown, Radio, Video } from 'lucide-react';
import { useState } from 'react';
import SubscriptionModal from '@/react-app/components/SubscriptionModal';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const navItems = [
    { path: '/studio', label: 'Studio', icon: Music },
    { path: '/suites', label: 'Suites', icon: Radio },
    { path: '/live', label: 'Live Sessions', icon: Video },
    { path: '/marketplace', label: 'Marketplace', icon: Store },
  ];

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  const handleUpgradeClick = () => {
    setShowUserMenu(false);
    setShowSubscriptionModal(true);
  };

  const handleSubscriptionSuccess = () => {
    // User object will be updated automatically via react-query
    setShowSubscriptionModal(false);
  };

  return (
    <nav className="bg-gray-900/80 backdrop-blur-lg border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/studio" className="flex items-center space-x-2">
              <img 
                src="https://mocha-cdn.com/0199f788-8c7c-76ff-9653-8d77884ee60e/cerebral.jpg" 
                alt="Cerebral" 
                className="w-8 h-8 object-contain"
              />
              <span className="text-xl font-bold text-white">Cerebral</span>
            </Link>
            
            <div className="hidden md:flex space-x-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {user && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                {user.google_user_data.picture ? (
                  <img
                    src={user.google_user_data.picture}
                    alt={user.google_user_data.name || user.email}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-black" />
                  </div>
                )}
                <span className="hidden md:block text-white font-medium">
                  {user.google_user_data.name || user.email}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <p className="text-sm text-white font-medium">
                      {user.google_user_data.name || user.email}
                    </p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                    <p className="text-xs text-yellow-400 mt-1 capitalize">
                      Basic Plan
                    </p>
                  </div>
                  
                  <div className="py-2">
                    <button 
                      onClick={handleUpgradeClick}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-yellow-400 hover:bg-gray-700 hover:text-yellow-300 transition-colors"
                    >
                      <Crown className="w-4 h-4" />
                      <span>Upgrade Plan</span>
                    </button>
                    <Link 
                      to="/profile"
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                    <button className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Subscription Modal */}
      {showSubscriptionModal && user && (
        <SubscriptionModal
          currentPlan="basic"
          onClose={() => setShowSubscriptionModal(false)}
          onSuccess={handleSubscriptionSuccess}
        />
      )}
    </nav>
  );
}
