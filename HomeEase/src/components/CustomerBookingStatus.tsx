import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRefreshInterval } from '@/hooks/useRefreshInterval';
import {
  BOOKING_STATUS_FILTERS,
  getStatusColor,
  getStatusLabel,
  type BookingStatus,
} from '@/lib/bookingStatus';

interface CustomerBookingSummary {
  id: string;
  service_name: string;
  status: BookingStatus;
  scheduled_date: string;
  scheduled_time: string;
  total_amount: number;
}

const CustomerBookingStatus = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<CustomerBookingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');

  const fetchBookings = async () => {
    if (!user?.id) {
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, status, description, scheduled_date, scheduled_time, total_amount, service_id')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      const rows = data || [];
      const serviceIds = [...new Set(rows.map((b) => b.service_id).filter(Boolean))];
      const { data: servicesData } = serviceIds.length
        ? await supabase.from('services').select('id, name').in('id', serviceIds as string[])
        : { data: [] };

      const nameMap = new Map((servicesData || []).map((s) => [s.id, s.name]));

      setBookings(
        rows.map((b) => ({
          id: b.id,
          service_name: (b.service_id && nameMap.get(b.service_id)) || b.description || 'Service',
          status: b.status as BookingStatus,
          scheduled_date: b.scheduled_date,
          scheduled_time: b.scheduled_time,
          total_amount: Number(b.total_amount || 0),
        }))
      );
    } catch (error) {
      console.error('Error fetching booking status:', error);
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

  const filtered =
    statusFilter === 'all' ? bookings : bookings.filter((b) => b.status === statusFilter);

  const statusCounts = BOOKING_STATUS_FILTERS.reduce(
    (acc, f) => {
      acc[f.value] =
        f.value === 'all' ? bookings.length : bookings.filter((b) => b.status === f.value).length;
      return acc;
    },
    {} as Record<string, number>
  );

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const formatTime = (time: string) =>
    new Date(`2000-01-01T${time}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

  return (
    <Card className="mb-8 border-blue-100 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-xl">Your bookings</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Filter by status to see live updates</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-blue-300 text-blue-700"
            onClick={() => navigate('/bookings')}
          >
            Full details
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {BOOKING_STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                statusFilter === filter.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50'
              }`}
            >
              {filter.label}
              <span className="ml-1 opacity-80">({statusCounts[filter.value] ?? 0})</span>
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm py-4">Loading status...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">
            {bookings.length === 0
              ? 'No bookings yet. Book a service below to track status here.'
              : 'No bookings with this status.'}
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.slice(0, 5).map((booking) => (
              <div
                key={booking.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border bg-gray-50 hover:bg-blue-50/50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{booking.service_name}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(booking.scheduled_date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(booking.scheduled_time)}
                    </span>
                    <span className="font-medium text-green-700">₹{booking.total_amount}</span>
                  </div>
                </div>
                <Badge className={getStatusColor(booking.status)}>{getStatusLabel(booking.status)}</Badge>
              </div>
            ))}
            {filtered.length > 5 && (
              <Button variant="link" className="text-blue-600 p-0 h-auto" onClick={() => navigate('/bookings')}>
                View all {filtered.length} bookings
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerBookingStatus;
