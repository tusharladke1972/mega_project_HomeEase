import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Star, Phone, Clock } from 'lucide-react';

const Features = () => {
  // No mock features, you can fetch from Supabase here in the future
  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Why Choose HomeEase?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover the benefits of using our platform for your home service needs.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[200px]">
          <p className="text-gray-500 text-lg">Features will be listed here soon.</p>
        </div>
      </div>
    </section>
  );
};

export default Features;
