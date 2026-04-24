import React from 'react';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';

const CTA = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Book Your Service?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join 2 million+ happy customers. Get verified professionals, 
            transparent pricing, and reliable service at your doorstep.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold">
              Book Service Now
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold">
              Download App
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8">
            <div className="flex items-center space-x-2 text-blue-100">
              <Phone className="w-5 h-5" />
              <span className="font-medium">24/7 Helpline: +91-8668-209-442</span>
            </div>
            <div className="text-blue-100">
              <span className="font-medium">Available in 100+ Cities</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
