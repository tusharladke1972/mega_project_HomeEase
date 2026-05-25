import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CustomerBookings from '@/components/CustomerBookings';
import BookingManagement from '@/components/BookingManagement';

const BookingsPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  if (!user || !profile) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200">
        <Card className="max-w-lg w-full shadow-2xl rounded-3xl border-0 p-8">
          <CardHeader>
            <CardTitle>My Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You must be signed in to view your bookings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8">
          {profile.role === 'service_provider' ? (
            <BookingManagement />
          ) : (
            <CustomerBookings onBack={handleBackToHome} />
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BookingsPage; 