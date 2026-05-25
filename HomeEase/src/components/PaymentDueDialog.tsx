import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Receipt, CheckCircle } from 'lucide-react';
import type { BookingPaymentBreakdown } from '@/lib/bookingCharges';

export interface PaymentDueBookingInfo {
  id: string;
  service_name: string;
  provider_name: string;
  scheduled_date: string;
}

interface PaymentDueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: PaymentDueBookingInfo | null;
  breakdown: BookingPaymentBreakdown | null;
  onAcknowledge: () => void;
  onViewInvoice?: () => void;
}

const PaymentDueDialog: React.FC<PaymentDueDialogProps> = ({
  open,
  onOpenChange,
  booking,
  breakdown,
  onAcknowledge,
  onViewInvoice,
}) => {
  if (!booking || !breakdown) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-6 h-6 text-green-600" />
            Service completed
          </DialogTitle>
          <DialogDescription>
            Your service is done. Please review the final amount to pay.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-3 text-sm">
            <p className="font-semibold text-gray-900">{booking.service_name}</p>
            <p className="text-gray-600">Provider: {booking.provider_name}</p>
          </div>

          <div className="border rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Base service charge</span>
              <span>₹{breakdown.base_service_amount.toLocaleString('en-IN')}</span>
            </div>
            {breakdown.material_charges.length > 0 ? (
              <>
                <p className="font-medium text-gray-700 pt-1">Materials & extras</p>
                {breakdown.material_charges.map((c) => (
                  <div key={c.id} className="flex justify-between text-gray-600 pl-2">
                    <span className="truncate pr-2">{c.item_name}</span>
                    <span>₹{c.amount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className="flex justify-between text-gray-700 font-medium">
                  <span>Materials subtotal</span>
                  <span>₹{breakdown.material_total.toLocaleString('en-IN')}</span>
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-xs">No extra material charges added.</p>
            )}
            <div className="flex justify-between font-bold text-lg pt-3 border-t text-green-800">
              <span>Total to pay</span>
              <span>₹{breakdown.total_amount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Pay the provider as agreed (UPI / cash). Download invoice for your records.
          </p>

          <div className="flex flex-col gap-2">
            {onViewInvoice && (
              <Button variant="outline" className="w-full" onClick={onViewInvoice}>
                <Receipt className="w-4 h-4 mr-2" />
                View / download invoice
              </Button>
            )}
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={onAcknowledge}>
              I understand — amount noted
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDueDialog;
