import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

const Testimonials = () => {
  // No mock testimonials, you can fetch from Supabase here in the future
  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join millions of satisfied customers across India who trust HomeEase for their home service needs.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[200px]">
          <p className="text-gray-500 text-lg">No testimonials available yet.</p>
        </div>
        <div className="inline-flex items-center space-x-4 bg-white rounded-lg px-6 py-4 shadow-md mt-12">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-6 h-6 text-yellow-400 fill-current" />
            ))}
          </div>
          <div className="text-left">
            <div className="font-bold text-gray-900">4.8/5 Average Rating</div>
            <div className="text-gray-600 text-sm">Based on 50,000+ reviews</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
