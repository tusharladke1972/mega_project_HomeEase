import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, MapPin, Phone, Star, Wrench, Zap, Paintbrush, Car, Shield, Droplets } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ServiceBooking from './ServiceBooking';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  duration_minutes: number;
  provider_id: string;
  provider_name: string;
  provider_business_name: string;
  provider_rating: number;
  provider_total_jobs: number;
  is_verified: boolean;
  custom_price?: number;
}

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCategoriesBar, setShowCategoriesBar] = useState(false);

  const categoryIcons: { [key: string]: any } = {
    plumbing: Droplets,
    electrical: Zap,
    cleaning: Shield,
    carpentry: Wrench,
    painting: Paintbrush,
    ac_repair: Car,
    pest_control: Shield,
    appliance_repair: Wrench,
    home_maintenance: Wrench,
  };

  const serviceCategories = [
    { value: 'plumbing', label: 'Plumbing', icon: Droplets },
    { value: 'electrical', label: 'Electrical', icon: Zap },
    { value: 'cleaning', label: 'Cleaning', icon: Shield },
    { value: 'carpentry', label: 'Carpentry', icon: Wrench },
    { value: 'painting', label: 'Painting', icon: Paintbrush },
    { value: 'ac_repair', label: 'AC Repair', icon: Car },
    { value: 'pest_control', label: 'Pest Control', icon: Shield },
    { value: 'appliance_repair', label: 'Appliance Repair', icon: Wrench },
    { value: 'home_maintenance', label: 'Home Maintenance', icon: Wrench },
  ];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServicesFallback = async () => {
    const { data: mappings, error: mappingError } = await (supabase as any)
      .from('provider_services')
      .select('id, provider_id, service_id, custom_price, is_active')
      .eq('is_active', true);

    if (mappingError) {
      throw mappingError;
    }

    if (!mappings || mappings.length === 0) {
      setServices([]);
      return;
    }

    const serviceIds = [...new Set(mappings.map((m: any) => m.service_id).filter(Boolean))];
    const providerIds = [...new Set(mappings.map((m: any) => m.provider_id).filter(Boolean))];

    const [{ data: servicesData, error: servicesError }, { data: providersData, error: providersError }] =
      await Promise.all([
        (supabase as any)
          .from('services')
          .select('id, name, description, category, base_price, duration_minutes, is_active')
          .in('id', serviceIds)
          .eq('is_active', true),
        (supabase as any)
          .from('service_providers')
          .select('id, business_name, rating, total_jobs, is_verified, user_id')
          .in('id', providerIds),
      ]);

    if (servicesError) throw servicesError;
    if (providersError) throw providersError;

    const userIds = [...new Set((providersData || []).map((p: any) => p.user_id).filter(Boolean))];
    const { data: profilesData, error: profilesError } = await (supabase as any)
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);

    if (profilesError) throw profilesError;

    const servicesMap = new Map((servicesData || []).map((s: any) => [s.id, s]));
    const providersMap = new Map((providersData || []).map((p: any) => [p.id, p]));
    const profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));

    const normalized: Service[] = mappings
      .map((mapping: any) => {
        const service = servicesMap.get(mapping.service_id);
        const provider = providersMap.get(mapping.provider_id);
        if (!service || !provider) return null;
        const providerProfile = profilesMap.get(provider.user_id);

        return {
          id: service.id,
          name: service.name,
          description: service.description ?? '',
          category: service.category,
          base_price: Number(mapping.custom_price ?? service.base_price ?? 0),
          duration_minutes: Number(service.duration_minutes ?? 0),
          provider_id: provider.id,
          provider_name: providerProfile?.full_name ?? 'Service Provider',
          provider_business_name: provider.business_name ?? '',
          provider_rating: Number(provider.rating ?? 0),
          provider_total_jobs: Number(provider.total_jobs ?? 0),
          is_verified: Boolean(provider.is_verified),
          custom_price: mapping.custom_price ?? undefined,
        };
      })
      .filter(Boolean) as Service[];

    setServices(normalized);
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await (supabase as any)
        .rpc('get_all_provider_services');

      if (error) {
        console.warn('RPC get_all_provider_services failed, using fallback query:', error.message);
        await fetchServicesFallback();
      } else {
        setServices(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = (service: Service) => {
    setSelectedService(service);
    setShowBookingDialog(true);
  };

  const closeBookingDialog = () => {
    setShowBookingDialog(false);
    setSelectedService(null);
  };

  const filteredServices = selectedCategory === 'all'
    ? services
    : services.filter((service) => service.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-4">Book Trusted Home Services</h1>
          <p className="text-xl mb-6">Professional services at your doorstep</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Categories Toggle Button (Mobile Only, Left Side) */}
        <div className="mb-4 md:hidden flex justify-start">
          <Button
            className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold shadow-md"
            onClick={() => setShowCategoriesBar((prev) => !prev)}
            aria-expanded={showCategoriesBar}
            aria-controls="categories-bar"
          >
            Categories
          </Button>
        </div>
        {/* Vertical Categories List (Mobile Only) */}
        {showCategoriesBar && (
          <div className="mb-4 md:hidden flex flex-col gap-2 w-48">
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors whitespace-nowrap text-left ${selectedCategory === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
              onClick={() => { setSelectedCategory('all'); setShowCategoriesBar(false); }}
            >
              <span className="text-lg font-semibold">All</span>
            </button>
            {serviceCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.value}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors whitespace-nowrap text-left ${selectedCategory === cat.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
                  onClick={() => { setSelectedCategory(cat.value); setShowCategoriesBar(false); }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{cat.label}</span>
                </button>
              );
            })}
          </div>
        )}
        {/* Categories Bar (Desktop Only) */}
        <div className="mb-8 hidden md:block" id="categories-bar">
          <div className="relative">
            <ScrollArea className="w-full overflow-x-auto">
              <div className="flex flex-nowrap min-w-fit space-x-3 pb-2 px-1 md:px-0" style={{ WebkitOverflowScrolling: 'touch' }}>
                <button
                  className={`flex flex-col items-center px-4 py-2 rounded-lg border transition-colors whitespace-nowrap ${selectedCategory === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
                  onClick={() => setSelectedCategory('all')}
                >
                  <span className="text-lg font-semibold">All</span>
                </button>
                {serviceCategories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.value}
                      className={`flex flex-col items-center px-4 py-2 rounded-lg border transition-colors whitespace-nowrap ${selectedCategory === cat.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
                      onClick={() => setSelectedCategory(cat.value)}
                    >
                      <Icon className="w-6 h-6 mb-1" />
                      <span className="text-sm font-medium">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white/90 to-transparent block" />
            </ScrollArea>
          </div>
        </div>
        {/* Services Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Available Services</h2>
          {loading ? (
            <div className="text-center py-8">Loading services...</div>
          ) : filteredServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => {
                const IconComponent = categoryIcons[service.category] || Wrench;
                return (
                  <Card key={service.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{service.name}</CardTitle>
                          <CardDescription className="text-blue-600 font-semibold">
                            Starting from ₹{service.base_price}
                          </CardDescription>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-600">
                              by {service.provider_business_name || service.provider_name}
                            </span>
                            {service.is_verified && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-3">{service.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span>Duration: {service.duration_minutes} mins</span>
                        <span className="capitalize">{service.category.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{service.provider_rating.toFixed(1)}</span>
                        </div>
                        <span>{service.provider_total_jobs} jobs completed</span>
                      </div>
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleBookService(service)}
                      >
                        Book Now
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No services available at the moment.</p>
            </div>
          )}
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedService && (
            <ServiceBooking
              service={selectedService}
              onClose={closeBookingDialog}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerDashboard;
