import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, User, Calendar, Activity } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import CustomerPaymentNotifier from '@/components/CustomerPaymentNotifier';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center min-w-0 flex-1 py-1 ${
    isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
  }`;

const Footer = () => {
  const { profile } = useAuth();
  const isProvider = profile?.role === 'service_provider';

  return (
    <>
      {!isProvider && <CustomerPaymentNotifier />}
      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex justify-around items-center py-2 md:hidden shadow-lg safe-area-pb">
        <NavLink to="/" end className={navLinkClass}>
          <Home className="w-6 h-6 shrink-0" />
          <span className="text-[10px] sm:text-xs mt-1 truncate">Home</span>
        </NavLink>

        {!isProvider && (
          <>
            <NavLink to="/status" className={navLinkClass}>
              <Activity className="w-6 h-6 shrink-0" />
              <span className="text-[10px] sm:text-xs mt-1 truncate">Status</span>
            </NavLink>
            <NavLink to="/bookings" className={navLinkClass}>
              <Calendar className="w-6 h-6 shrink-0" />
              <span className="text-[10px] sm:text-xs mt-1 truncate">Bookings</span>
            </NavLink>
          </>
        )}

        <NavLink to="/profile" className={navLinkClass}>
          <User className="w-6 h-6 shrink-0" />
          <span className="text-[10px] sm:text-xs mt-1 truncate">Account</span>
        </NavLink>
      </nav>

      {/* Desktop footer */}
      <footer className="bg-gray-900 text-white py-16 hidden md:block">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">H</span>
                </div>
                <span className="text-2xl font-bold">HomeEase</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Most trusted home services platform connecting you with verified
                professionals for all your household needs.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Popular Services</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Plumbing Services</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Electrical Work</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">AC Repair & Service</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Home Cleaning</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Pest Control</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Appliance Repair</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2026 HomeEase. All rights reserved.
              </p>
              <div className="flex items-center space-x-6 mt-4 md:mt-0">
                <span className="text-gray-400 text-sm">Accepted Payments:</span>
                <div className="flex items-center space-x-2">
                  <span className="bg-gray-800 px-2 py-1 rounded text-xs">UPI</span>
                  <span className="bg-gray-800 px-2 py-1 rounded text-xs">Cards</span>
                  <span className="bg-gray-800 px-2 py-1 rounded text-xs">Net Banking</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
