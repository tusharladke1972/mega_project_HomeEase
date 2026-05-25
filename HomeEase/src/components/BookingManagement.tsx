import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getProviderIdForUser } from '@/lib/providerCache';
import { useRefreshInterval } from '@/hooks/useRefreshInterval';
import { Calendar, Clock, MapPin, Phone, User, MessageSquare } from 'lucide-react';
import MaterialChargesEditor from '@/components/MaterialChargesEditor';

interface Booking {
  id: string;
  customer_name: string;
  customer_phone: string;
  service_name: string;
  service_category: string;
  scheduled_date: string;
  scheduled_time: string;
  address: string;
  city: string;
  pincode: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  total_amount: number;
  base_service_amount: number;
  customer_notes: string;
  provider_notes: string;
  created_at: string;
  customer_id: string;
  service_id: string;
}

const BookingManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      if (!user?.id) return;
      const providerId = await getProviderIdForUser(user.id);
      if (!providerId) {
        setBookings([]);
        return;
      }

      const { data: bookingRows, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('service_provider_id', providerId)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        throw bookingsError;
      }

      const bookingsData = bookingRows || [];
      if (bookingsData.length === 0) {
        setBookings([]);
        return;
      }

      const serviceIds = [...new Set(bookingsData.map((b) => b.service_id).filter(Boolean))];
      const customerIds = [...new Set(bookingsData.map((b) => b.customer_id).filter(Boolean))];

      const [{ data: servicesData }, { data: customersData }] = await Promise.all([
        serviceIds.length
          ? supabase.from('services').select('id, name, category').in('id', serviceIds as string[])
          : Promise.resolve({ data: [], error: null } as any),
        customerIds.length
          ? supabase.from('profiles').select('id, full_name, phone').in('id', customerIds as string[])
          : Promise.resolve({ data: [], error: null } as any),
      ]);

      const servicesMap = new Map((servicesData || []).map((s: any) => [s.id, s]));
      const customersMap = new Map((customersData || []).map((c: any) => [c.id, c]));

      const normalized: Booking[] = bookingsData.map((b: any) => {
        const service = b.service_id ? servicesMap.get(b.service_id) : null;
        const customer = b.customer_id ? customersMap.get(b.customer_id) : null;

        return {
          id: b.id,
          customer_name: customer?.full_name || 'Customer',
          customer_phone: customer?.phone || '',
          service_name: service?.name || b.description || 'Service',
          service_category: service?.category || 'general',
          scheduled_date: b.scheduled_date,
          scheduled_time: b.scheduled_time,
          address: b.address,
          city: b.city,
          pincode: b.pincode,
          status: b.status,
          total_amount: Number(b.total_amount || 0),
          base_service_amount: Number(b.base_service_amount ?? b.total_amount ?? 0),
          customer_notes: b.customer_notes || '',
          provider_notes: b.provider_notes || '',
          created_at: b.created_at,
          customer_id: b.customer_id,
          service_id: b.service_id,
        };
      });

      setBookings(normalized);
    } catch (error) {
      console.error('Error:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchBookings();
  }, [user?.id]);

  useRefreshInterval(() => {
    if (user?.id) fetchBookings();
  }, 30000);

  const updateBookingStatus = async (bookingId: string, newStatus: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update booking status.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Booking status updated successfully!",
        });
        fetchBookings(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return <div className="p-6">Loading bookings...</div>;
  }

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const activeBookings = bookings.filter(b => ['confirmed', 'in_progress'].includes(b.status));
  const completedBookings = bookings.filter(b => ['completed', 'cancelled'].includes(b.status));

  return (
    <div className="space-y-6">
      {/* Pending Bookings */}
      <div>
        <h2 className="text-xl font-bold mb-4">Pending Bookings ({pendingBookings.length})</h2>
        {pendingBookings.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {pendingBookings.map((booking) => (
              <Card key={booking.id} className="border-l-4 border-l-yellow-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{booking.service_name}</CardTitle>
                      <CardDescription>
                        <span className="flex items-center gap-2 mt-1">
                          <User className="w-4 h-4" />
                          <span>{booking.customer_name}</span>
                          {booking.customer_phone && (
                            <>
                              <Phone className="w-4 h-4 ml-2" />
                              <span>{booking.customer_phone}</span>
                            </>
                          )}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(booking.scheduled_date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(booking.scheduled_time)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-1 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mt-0.5" />
                      <span>{booking.address}, {booking.city} - {booking.pincode}</span>
                    </div>

                    {booking.customer_notes && (
                      <div className="flex items-start gap-1 text-sm text-gray-600">
                        <MessageSquare className="w-4 h-4 mt-0.5" />
                        <span>{booking.customer_notes}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3">
                      <span className="text-lg font-bold text-green-600">₹{booking.total_amount}</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              No pending bookings at the moment.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Active Bookings */}
      {activeBookings.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Active Bookings ({activeBookings.length})</h2>
          <div className="grid grid-cols-1 gap-4">
            {activeBookings.map((booking) => (
              <Card key={booking.id} className={`border-l-4 ${booking.status === 'confirmed' ? 'border-l-blue-500' : 'border-l-purple-500'}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{booking.service_name}</CardTitle>
                      <CardDescription>
                        <span className="flex items-center gap-2 mt-1">
                          <User className="w-4 h-4" />
                          <span>{booking.customer_name}</span>
                          {booking.customer_phone && (
                            <>
                              <Phone className="w-4 h-4 ml-2" />
                              <span>{booking.customer_phone}</span>
                            </>
                          )}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(booking.scheduled_date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(booking.scheduled_time)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-1 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mt-0.5" />
                      <span>{booking.address}, {booking.city} - {booking.pincode}</span>
                    </div>

                    {booking.status === 'in_progress' && (
                      <MaterialChargesEditor
                        bookingId={booking.id}
                        baseServiceAmount={booking.base_service_amount}
                        onTotalChange={(newTotal) => {
                          setBookings((prev) =>
                            prev.map((b) =>
                              b.id === booking.id ? { ...b, total_amount: newTotal } : b
                            )
                          );
                        }}
                      />
                    )}

                    <div className="flex items-center justify-between pt-3">
                      <div>
                        <span className="text-lg font-bold text-green-600">
                          ₹{booking.total_amount.toLocaleString('en-IN')}
                        </span>
                        {booking.total_amount > booking.base_service_amount && (
                          <p className="text-xs text-gray-500">
                            Base ₹{booking.base_service_amount.toLocaleString('en-IN')} + materials
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {booking.status === 'confirmed' && (
                          <Button
                            size="sm"
                            onClick={() => updateBookingStatus(booking.id, 'in_progress')}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            Start Work
                          </Button>
                        )}
                        {booking.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={() => updateBookingStatus(booking.id, 'completed')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Completed Bookings */}
      {completedBookings.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Recent History ({completedBookings.slice(0, 5).length})</h2>
          <div className="grid grid-cols-1 gap-4">
            {completedBookings.slice(0, 5).map((booking) => (
              <Card key={booking.id} className={`border-l-4 ${booking.status === 'completed' ? 'border-l-green-500' : 'border-l-red-500'}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{booking.service_name}</CardTitle>
                      <CardDescription>
                        <span>{booking.customer_name}</span>
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {formatDate(booking.scheduled_date)} at {formatTime(booking.scheduled_time)}
                    </div>
                    <span className="text-lg font-bold text-green-600">₹{booking.total_amount}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {bookings.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
            <p>When customers book your services, they'll appear here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BookingManagement; 