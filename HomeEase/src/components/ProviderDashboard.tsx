import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, Star, TrendingUp, Users, CheckCircle, Settings } from 'lucide-react';
import ServiceManagement from './ServiceManagement';
import BookingManagement from './BookingManagement';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getProviderIdForUser } from '@/lib/providerCache';

const ProviderDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    completedJobs: 0,
    totalEarnings: 0
  });

  // Tab state based on hash
  const [activeTab, setActiveTab] = useState('bookings');

  // Set tab based on hash on mount and when hash changes
  useEffect(() => {
    const setTabFromHash = () => {
      if (window.location.hash === '#services') {
        setActiveTab('services');
      } else {
        setActiveTab('bookings');
      }
    };
    setTabFromHash();
    window.addEventListener('hashchange', setTabFromHash);
    return () => window.removeEventListener('hashchange', setTabFromHash);
  }, []);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      if (!user?.id) return;
      const providerId = await getProviderIdForUser(user.id);
      if (!providerId) {
        setStats({
          totalBookings: 0,
          pendingBookings: 0,
          completedJobs: 0,
          totalEarnings: 0
        });
        return;
      }

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('status, total_amount')
        .eq('service_provider_id', providerId);

      if (!error && bookings) {
        const totalBookings = bookings.length;
        const pendingBookings = bookings.filter((b: any) => b.status === 'pending').length;
        const completedJobs = bookings.filter((b: any) => b.status === 'completed').length;
        const totalEarnings = bookings
          .filter((b: any) => b.status === 'completed')
          .reduce((sum: number, b: any) => sum + Number(b.total_amount), 0);

        setStats({
          totalBookings,
          pendingBookings,
          completedJobs,
          totalEarnings
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Provider Dashboard</h1>
              <p className="text-gray-600">Manage your services and bookings</p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="w-4 h-4 mr-1" />
                Verified
              </Badge>
              <Badge variant="outline">
                <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                4.8 Rating
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{stats.totalBookings}</p>
                  <p className="text-gray-600">Total Bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{stats.pendingBookings}</p>
                  <p className="text-gray-600">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{stats.completedJobs}</p>
                  <p className="text-gray-600">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">₹{stats.totalEarnings}</p>
                  <p className="text-gray-600">Total Earnings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="services">My Services</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <BookingManagement />
          </TabsContent>

          <TabsContent value="services">
            <ServiceManagement />
          </TabsContent>

          <TabsContent value="profile">
            {/* Quick Actions */}
            <div>
              <h2 className="text-xl font-bold mb-6">Profile & Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Users className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Update Profile</h3>
                    <p className="text-sm text-gray-600">Manage your business details</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Star className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">View Reviews</h3>
                    <p className="text-sm text-gray-600">Check customer feedback</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Earnings Report</h3>
                    <p className="text-sm text-gray-600">Track your income</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProviderDashboard;
