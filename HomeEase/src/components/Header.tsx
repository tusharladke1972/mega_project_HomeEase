import React from 'react';
import { Button } from '@/components/ui/button';
import { Phone, User, LogOut, Calendar, Mail, MapPin, Edit, Star, BarChart2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Header = () => {
  const { user, signOut, profile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleAuthClick = () => {
    navigate('/auth');
  };

  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <header className="bg-white/95 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 w-full">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group" 
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <span className="text-white font-bold text-xl">H</span>
          </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                HomeEase
              </span>
              <span className="text-xs text-blue-600 font-medium -mt-1">
                India Connect
              </span>
            </div>
        </div>
        
          {/* Navigation - Only show for unauthenticated users or on landing page */}
          {!user && (
            <nav className="hidden lg:flex items-center space-x-8">
              <a href="#services" className="text-gray-600 hover:text-blue-600 transition-all duration-200 font-medium relative group">
                Services
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full"></span>
              </a>
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-all duration-200 font-medium relative group">
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full"></span>
              </a>
              <a href="#about" className="text-gray-600 hover:text-blue-600 transition-all duration-200 font-medium relative group">
                About
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full"></span>
              </a>
              <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-all duration-200 font-medium relative group">
                Contact
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full"></span>
              </a>
        </nav>
          )}

          {/* Right Section */}
        <div className="flex items-center space-x-4">
            {/* Contact Info */}
            <div className="hidden xl:flex items-center space-x-6">
              <a 
                href="tel:+91-8668-209-442" 
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-all duration-200 group"
              >
                <div className="p-2 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
                  <Phone className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Call us</span>
                  <span className="text-sm font-medium">+91-8668-209-442</span>
                </div>
          </a>
          
              <a 
                href="mailto:tusharladke08@gmail.com" 
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-all duration-200 group"
              >
                <div className="p-2 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Email us</span>
                  <span className="text-sm font-medium">tusharladke08@gmail.com</span>
                </div>
              </a>
            </div>

            {/* Divider */}
            {user && (
              <div className="hidden lg:block w-px h-8 bg-gray-300"></div>
            )}
            
            {/* User Section */}
          {user ? (
              <div className="flex items-center space-x-3">
                {/* User Greeting */}
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-medium text-gray-900">
                    Welcome back!
                  </span>
                  <span className="text-xs text-gray-500 capitalize">
                    {profile?.full_name || user.email?.split('@')[0]}
                  </span>
                </div>

                {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-blue-200 transition-all duration-200">
                      <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                </Button>
              </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-2 p-2 shadow-xl border-0 bg-white/95 backdrop-blur-lg">
                    <div className="px-3 py-2 mb-2">
                      <p className="text-sm font-medium text-gray-900">
                        {profile?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user.email}
                      </p>
                      <p className="text-xs text-blue-600 capitalize font-medium mt-1">
                        {profile?.role} Account
                      </p>
                    </div>
                    <DropdownMenuSeparator className="my-2" />
                    <DropdownMenuItem 
                      onClick={() => navigate('/profile')}
                      className="flex items-center px-3 py-2 text-sm rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <User className="mr-3 h-4 w-4 text-blue-600" />
                      Profile Settings
                    </DropdownMenuItem>
                    {profile?.role === 'service_provider' && (
                      <DropdownMenuItem
                        onClick={() => navigate('/profile/earnings')}
                        className="flex items-center px-3 py-2 text-sm rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <BarChart2 className="mr-3 h-4 w-4 text-blue-600" />
                        Earning Report
                </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => navigate('/bookings')}
                      className="flex items-center px-3 py-2 text-sm rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <Calendar className="mr-3 h-4 w-4 text-blue-600" />
                  My Bookings
                </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-2" />
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="flex items-center px-3 py-2 text-sm rounded-lg hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
              </div>
          ) : (
            <Button 
              onClick={handleAuthClick}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
                <User className="w-4 h-4 mr-2" />
                Sign In
            </Button>
          )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
