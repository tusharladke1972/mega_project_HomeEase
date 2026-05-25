import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Clock, MapPin, Phone, User, MessageSquare, Building2, ArrowLeft, FileText, Download } from 'lucide-react';
import InvoiceDialog from '@/components/InvoiceDialog';
import { buildInvoiceData, downloadInvoicePdf, type InvoiceData } from '@/lib/invoice';
import { fetchMaterialChargesForBookings, type MaterialCharge } from '@/lib/bookingCharges';
import { useRefreshInterval } from '@/hooks/useRefreshInterval';
import {
  BOOKING_STATUS_FILTERS,
  getStatusColor,
  getStatusLabel,
  getStatusBorderColor,
  type BookingStatus,
} from '@/lib/bookingStatus';

interface CustomerBooking {
  id: string;
  provider_name: string;
  provider_business_name: string;
  provider_phone: string;
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
  material_charges: MaterialCharge[];
  customer_notes: string;
  provider_notes: string;
  created_at: string;
  service_provider_id: string;
  service_id: string;
}

interface CustomerBookingsProps {
  onBack: () => void;
}

const CustomerBookings: React.FC<CustomerBookingsProps> = ({ onBack }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');

  const bookingToInvoice = (booking: CustomerBooking) => ({
    ...booking,
    base_service_amount: booking.base_service_amount,
    material_charges: booking.material_charges.map((m) => ({
      label: m.item_name,
      amount: m.amount,
    })),
  });

  const openInvoice = (booking: CustomerBooking) => {
    if (!user || !profile) return;
    const invoice = buildInvoiceData(bookingToInvoice(booking), {
      full_name: profile.full_name,
      email: user.email ?? '',
      phone: profile.phone,
      address: profile.address,
      city: profile.city,
      pincode: profile.pincode,
    });
    setSelectedInvoice(invoice);
    setInvoiceOpen(true);
  };

  const handleDownloadInvoice = (booking: CustomerBooking) => {
    if (!user || !profile) return;
    try {
      const invoice = buildInvoiceData(bookingToInvoice(booking), {
        full_name: profile.full_name,
        email: user.email ?? '',
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        pincode: profile.pincode,
      });
      downloadInvoicePdf(invoice);
      toast({
        title: 'Invoice downloaded',
        description: 'Your invoice PDF has been saved.',
      });
    } catch {
      toast({
        title: 'Download failed',
        description: 'Could not generate invoice PDF.',
        variant: 'destructive',
      });
    }
  };

  const fetchBookings = async () => {
    try {
      if (!user?.id) {
        setBookings([]);
        return;
      }

      const { data: bookingRows, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        throw bookingsError;
      }

      const rows = bookingRows || [];
      if (rows.length === 0) {
        setBookings([]);
        return;
      }

      const serviceIds = [...new Set(rows.map((b) => b.service_id).filter(Boolean))];
      const providerIds = [...new Set(rows.map((b) => b.service_provider_id).filter(Boolean))];

      const [{ data: servicesData }, { data: providersData }] = await Promise.all([
        serviceIds.length
          ? supabase.from('services').select('id, name, category').in('id', serviceIds as string[])
          : Promise.resolve({ data: [], error: null } as any),
        providerIds.length
          ? supabase
              .from('service_providers')
              .select('id, business_name, user_id')
              .in('id', providerIds as string[])
          : Promise.resolve({ data: [], error: null } as any),
      ]);

      const providerUserIds = [...new Set((providersData || []).map((p: any) => p.user_id).filter(Boolean))];
      const { data: profilesData } = providerUserIds.length
        ? await supabase.from('profiles').select('id, full_name, phone').in('id', providerUserIds as string[])
        : ({ data: [] } as any);

      const servicesMap = new Map((servicesData || []).map((s: any) => [s.id, s]));
      const providersMap = new Map((providersData || []).map((p: any) => [p.id, p]));
      const profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));

      const bookingIds = rows.map((b: any) => b.id);
      const materialsMap = await fetchMaterialChargesForBookings(bookingIds);

      const normalized: CustomerBooking[] = rows.map((b: any) => {
        const service = b.service_id ? servicesMap.get(b.service_id) : null;
        const provider = b.service_provider_id ? providersMap.get(b.service_provider_id) : null;
        const providerProfile = provider?.user_id ? profilesMap.get(provider.user_id) : null;
        const materials = materialsMap.get(b.id) || [];

        return {
          id: b.id,
          provider_name: providerProfile?.full_name || 'Service Provider',
          provider_business_name: provider?.business_name || '',
          provider_phone: providerProfile?.phone || '',
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
          material_charges: materials,
          customer_notes: b.customer_notes || '',
          provider_notes: b.provider_notes || '',
          created_at: b.created_at,
          service_provider_id: b.service_provider_id,
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

  const cancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to cancel booking.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Booking cancelled successfully!",
        });
        fetchBookings(); // Refresh the list
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
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
    return (
      <div className="p-6">
        <Button variant="outline" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Services
        </Button>
        <div>Loading your bookings...</div>
      </div>
    );
  }

  const filteredBookings =
    statusFilter === 'all' ? bookings : bookings.filter((b) => b.status === statusFilter);

  const activeBookings = filteredBookings.filter((b) =>
    ['pending', 'confirmed', 'in_progress'].includes(b.status)
  );
  const completedBookings = filteredBookings.filter((b) =>
    ['completed', 'cancelled'].includes(b.status)
  );

  const statusCounts = BOOKING_STATUS_FILTERS.reduce(
    (acc, f) => {
      acc[f.value] =
        f.value === 'all' ? bookings.length : bookings.filter((b) => b.status === f.value).length;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Services
          </Button>
          <h1 className="text-2xl font-bold">My Bookings</h1>
          <p className="text-gray-600">Track your service requests and appointments</p>
        </div>
      </div>

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

      {/* Active Bookings */}
      {activeBookings.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Current Bookings ({activeBookings.length})</h2>
          <div className="grid grid-cols-1 gap-4">
            {activeBookings.map((booking) => (
              <Card key={booking.id} className={`border-l-4 ${getStatusBorderColor(booking.status)}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{booking.service_name}</CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="w-4 h-4" />
                          <span>{booking.provider_name}</span>
                          {booking.provider_business_name && (
                            <>
                              <Building2 className="w-4 h-4 ml-2" />
                              <span>{booking.provider_business_name}</span>
                            </>
                          )}
                        </div>
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(booking.status)}>
                      {getStatusLabel(booking.status)}
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

                    {booking.provider_phone && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>Provider: {booking.provider_phone}</span>
                      </div>
                    )}

                    {booking.customer_notes && (
                      <div className="flex items-start gap-1 text-sm text-gray-600">
                        <MessageSquare className="w-4 h-4 mt-0.5" />
                        <span>Your notes: {booking.customer_notes}</span>
                      </div>
                    )}

                    {booking.provider_notes && (
                      <div className="flex items-start gap-1 text-sm text-blue-600">
                        <MessageSquare className="w-4 h-4 mt-0.5" />
                        <span>Provider notes: {booking.provider_notes}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3">
                      <span className="text-lg font-bold text-green-600">₹{booking.total_amount}</span>
                      <div className="flex gap-2">
                        {booking.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelBooking(booking.id)}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            Cancel Request
                          </Button>
                        )}
                        {booking.status === 'confirmed' && (
                          <span className="text-sm text-green-600 font-medium">
                            ✓ Confirmed by provider
                          </span>
                        )}
                        {booking.status === 'in_progress' && (
                          <span className="text-sm text-purple-600 font-medium">
                            🔄 Work in progress
                          </span>
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

      {/* Completed Bookings */}
      {completedBookings.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Booking History ({completedBookings.length})</h2>
          <div className="grid grid-cols-1 gap-4">
            {completedBookings.map((booking) => (
              <Card key={booking.id} className={`border-l-4 ${getStatusBorderColor(booking.status)}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{booking.service_name}</CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="w-4 h-4" />
                          <span>{booking.provider_name}</span>
                          {booking.provider_business_name && (
                            <>
                              <Building2 className="w-4 h-4 ml-2" />
                              <span>{booking.provider_business_name}</span>
                            </>
                          )}
                        </div>
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(booking.status)}>
                      {getStatusLabel(booking.status)}
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

                    {booking.status === 'completed' && booking.material_charges.length > 0 && (
                      <div className="text-sm bg-gray-50 rounded-lg p-3 space-y-1">
                        <div className="flex justify-between text-gray-600">
                          <span>Base service</span>
                          <span>₹{booking.base_service_amount.toLocaleString('en-IN')}</span>
                        </div>
                        {booking.material_charges.map((m) => (
                          <div key={m.id} className="flex justify-between text-gray-600 pl-2">
                            <span>{m.item_name}</span>
                            <span>₹{m.amount.toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
                      <span className="text-lg font-bold text-green-600">
                        ₹{booking.total_amount.toLocaleString('en-IN')}
                      </span>
                      {booking.status === 'completed' && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                            onClick={() => openInvoice(booking)}
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            View Invoice
                          </Button>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleDownloadInvoice(booking)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download Invoice
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <InvoiceDialog
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
        invoice={selectedInvoice}
      />

      {bookings.length > 0 && filteredBookings.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No bookings with this status. Try another filter.
          </CardContent>
        </Card>
      )}

      {bookings.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
            <p>When you book services, they'll appear here.</p>
            <Button onClick={onBack} className="mt-4">
              Browse Services
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerBookings; 