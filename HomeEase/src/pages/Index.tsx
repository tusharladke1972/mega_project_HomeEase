import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, UserCheck, ShieldCheck, CreditCard } from 'lucide-react';
import Header from '@/components/Header';
import CustomerDashboard from '@/components/CustomerDashboard';
import ProviderDashboard from '@/components/ProviderDashboard';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { loading, user, profile } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show role-based dashboard
  if (user && profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200">
        <Header />
        {profile.role === 'service_provider' ? (
          <div className="pb-20 md:pb-0">
            <ProviderDashboard />
          </div>
        ) : (
          <CustomerDashboard />
        )}
        <Footer />
      </div>
    );
  }

  // Show welcome page for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Your Trusted Home Service Partner
            </h1>
            <p className="text-xl mb-8">
              Professional home services at your doorstep
            </p>
            <div className="flex justify-center">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-blue-50"
                onClick={() => navigate('/auth')}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Professionals</h3>
              <p className="text-gray-600">All our service providers are thoroughly vetted and verified</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Assured</h3>
              <p className="text-gray-600">We guarantee the quality of every service provided</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
              <p className="text-gray-600">Safe and secure payment options for all services</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
