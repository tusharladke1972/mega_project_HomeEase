import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { InvoiceData, downloadInvoicePdf } from '@/lib/invoice';
import { useToast } from '@/hooks/use-toast';

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceData | null;
}

const InvoiceDialog: React.FC<InvoiceDialogProps> = ({ open, onOpenChange, invoice }) => {
  const { toast } = useToast();

  if (!invoice) return null;

  const { booking, customer, invoiceNumber, invoiceDate } = invoice;
  const categoryLabel = booking.service_category.replace(/_/g, ' ');

  const handleDownload = () => {
    try {
      downloadInvoicePdf(invoice);
      toast({
        title: 'Invoice downloaded',
        description: `Invoice ${invoiceNumber} saved as PDF.`,
      });
    } catch {
      toast({
        title: 'Download failed',
        description: 'Could not generate invoice PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Service Invoice
          </DialogTitle>
          <DialogDescription>
            Invoice for completed service — {invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-lg overflow-hidden">
          <div className="bg-blue-600 text-white px-4 py-3">
            <div className="text-xl font-bold">HomeEase</div>
            <div className="text-sm text-blue-100">India Connect</div>
          </div>

          <div className="p-4 space-y-4 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Invoice No.</span>
              <span className="font-semibold text-gray-900">{invoiceNumber}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Date</span>
              <span className="font-medium text-gray-900">{invoiceDate}</span>
            </div>

            <hr />

            <div>
              <div className="font-semibold text-gray-900 mb-1">Bill To</div>
              <div>{customer.full_name}</div>
              <div className="text-gray-600">{customer.email}</div>
              {customer.phone && <div className="text-gray-600">{customer.phone}</div>}
            </div>

            <div>
              <div className="font-semibold text-gray-900 mb-1">Provider</div>
              <div>{booking.provider_name}</div>
              {booking.provider_business_name && (
                <div className="text-gray-600">{booking.provider_business_name}</div>
              )}
            </div>

            <div>
              <div className="font-semibold text-gray-900 mb-1">Service</div>
              <div>{booking.service_name}</div>
              <div className="text-gray-600 capitalize">{categoryLabel}</div>
              <div className="text-gray-600 mt-1">
                {booking.address}, {booking.city} - {booking.pincode}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Base service</span>
                <span>
                  ₹{Number(booking.base_service_amount ?? booking.total_amount).toLocaleString('en-IN')}
                </span>
              </div>
              {(booking.material_charges || []).map((item, i) => (
                <div key={i} className="flex justify-between text-gray-600 pl-2">
                  <span className="truncate pr-2">{item.label}</span>
                  <span>₹{Number(item.amount).toLocaleString('en-IN')}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Total Amount</span>
                <span className="text-xl font-bold text-green-700">
                  ₹{Number(booking.total_amount).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Payment status: Completed · Computer-generated invoice
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download Invoice (PDF)
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDialog;
