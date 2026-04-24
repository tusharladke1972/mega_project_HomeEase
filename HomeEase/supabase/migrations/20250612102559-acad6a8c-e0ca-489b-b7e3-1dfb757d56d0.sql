
-- Create enum for service categories
CREATE TYPE service_category AS ENUM (
  'plumbing', 'electrical', 'cleaning', 'carpentry', 'painting', 
  'ac_repair', 'pest_control', 'appliance_repair', 'home_maintenance'
);

-- Create enum for booking status
CREATE TYPE booking_status AS ENUM (
  'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'
);

-- Create enum for payment status
CREATE TYPE payment_status AS ENUM (
  'pending', 'completed', 'failed', 'refunded'
);

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('customer', 'service_provider', 'admin');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  role user_role DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create service providers table
CREATE TABLE public.service_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT,
  description TEXT,
  experience_years INTEGER,
  rating DECIMAL(3,2) DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  available_cities TEXT[],
  service_categories service_category[],
  base_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create services table
CREATE TABLE public.services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category service_category NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_provider_id UUID REFERENCES public.service_providers(id),
  service_id UUID REFERENCES public.services(id),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  pincode TEXT NOT NULL,
  status booking_status DEFAULT 'pending',
  total_amount DECIMAL(10,2),
  description TEXT,
  customer_notes TEXT,
  provider_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  transaction_id TEXT,
  status payment_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_provider_id UUID REFERENCES public.service_providers(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for service_providers
CREATE POLICY "Anyone can view service providers" ON public.service_providers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service providers can update their own profile" ON public.service_providers
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can create service provider profile" ON public.service_providers
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create RLS policies for services
CREATE POLICY "Anyone can view active services" ON public.services
  FOR SELECT TO authenticated USING (is_active = true);

-- Create RLS policies for bookings
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (
    customer_id = auth.uid() OR 
    service_provider_id IN (SELECT id FROM public.service_providers WHERE user_id = auth.uid())
  );

CREATE POLICY "Customers can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (
    customer_id = auth.uid() OR 
    service_provider_id IN (SELECT id FROM public.service_providers WHERE user_id = auth.uid())
  );

-- Create RLS policies for payments
CREATE POLICY "Users can view their payment history" ON public.payments
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM public.bookings 
      WHERE customer_id = auth.uid() OR 
      service_provider_id IN (SELECT id FROM public.service_providers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "System can insert payments" ON public.payments
  FOR INSERT WITH CHECK (true);

-- Create RLS policies for reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Customers can create reviews for their bookings" ON public.reviews
  FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Insert some sample services
INSERT INTO public.services (name, description, category, base_price, duration_minutes) VALUES
('Basic Plumbing Repair', 'Fix leaky taps, unclog drains, minor pipe repairs', 'plumbing', 299.00, 60),
('Electrical Wiring Check', 'Inspect and repair electrical connections', 'electrical', 399.00, 90),
('Home Deep Cleaning', 'Complete house cleaning service', 'cleaning', 799.00, 180),
('Furniture Assembly', 'Assembly and installation of furniture', 'carpentry', 249.00, 120),
('Wall Painting', 'Interior wall painting service', 'painting', 1999.00, 480),
('AC Installation & Service', 'AC installation, cleaning and repair', 'ac_repair', 599.00, 120),
('Pest Control Treatment', 'Complete home pest control service', 'pest_control', 899.00, 90),
('Washing Machine Repair', 'Repair and maintenance of washing machines', 'appliance_repair', 349.00, 75);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
