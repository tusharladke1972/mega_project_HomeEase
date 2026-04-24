
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Clock, MapPin, Star } from 'lucide-react';

interface BookingFormData {
  scheduled_date: string;
  scheduled_time: string;
  address: string;
  city: string;
  pincode: string;
  customer_notes: string;
}

interface ServiceBookingProps {
  service: {
    id: string;
    name: string;
    description: string;
    category: string;
    base_price: number;
    duration_minutes: number;
    provider_id: string;
  };
  onClose: () => void;
}

const ServiceBooking: React.FC<ServiceBookingProps> = ({ service, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<BookingFormData>({
    defaultValues: {
      scheduled_date: '',
      scheduled_time: '',
      address: '',
      city: '',
      pincode: '',
      customer_notes: '',
    },
  });

  const onSubmit = async (data: BookingFormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to book a service.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        customer_id: user.id,
        service_provider_id: service.provider_id,
        service_id: service.id,
        scheduled_date: data.scheduled_date,
        scheduled_time: data.scheduled_time,
        address: data.address,
        city: data.city,
        pincode: data.pincode,
        customer_notes: data.customer_notes,
        total_amount: service.base_price,
        status: 'pending',
        description: service.name,
      };

      const { error } = await supabase
        .from('bookings')
        .insert([bookingData]);

      if (error) {
        console.error('Booking error:', error);
        toast({
          title: "Error",
          description: "Failed to book service. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Service booked successfully! The provider will contact you soon.",
        });
        onClose();
      }
    } catch (error) {
      console.error('Error booking service:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Book Service</CardTitle>
        <CardDescription>
          Schedule your {service.name} service
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-lg">{service.name}</h3>
          <p className="text-gray-600 mb-2">{service.description}</p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{service.duration_minutes} mins</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-green-600">₹{service.base_price}</span>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduled_date"
                rules={{ required: "Please select a date" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        min={today}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduled_time"
                rules={{ required: "Please select a time" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              rules={{ required: "Address is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your complete address"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                rules={{ required: "City is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="City"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pincode"
                rules={{ 
                  required: "Pincode is required",
                  pattern: {
                    value: /^[0-9]{6}$/,
                    message: "Please enter a valid 6-digit pincode"
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pincode</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123456"
                        maxLength={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="customer_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Any specific requirements or instructions..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 flex-1"
              >
                {loading ? 'Booking...' : `Book Now - ₹${service.base_price}`}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ServiceBooking;
