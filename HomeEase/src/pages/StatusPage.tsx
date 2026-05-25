import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CustomerBookingStatus from '@/components/CustomerBookingStatus';

const StatusPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pb-20 md:pb-0">
        <Card className="max-w-lg w-full mx-4">
          <CardHeader>
            <CardTitle>Service Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">You must be signed in to view service status.</p>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profile.role === 'service_provider') {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center text-gray-600">
              Service status tracking is available for customer accounts.
              <Button className="mt-4 block mx-auto" onClick={() => navigate('/')}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Service Status</h1>
          <p className="text-gray-600 mb-4">Track your service requests and live updates</p>
          <CustomerBookingStatus />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default StatusPage;
