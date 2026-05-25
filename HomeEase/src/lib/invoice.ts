import jsPDF from 'jspdf';

export interface InvoiceLineItem {
  label: string;
  amount: number;
}

export interface InvoiceBooking {
  id: string;
  service_name: string;
  service_category: string;
  scheduled_date: string;
  scheduled_time: string;
  address: string;
  city: string;
  pincode: string;
  total_amount: number;
  base_service_amount?: number;
  material_charges?: InvoiceLineItem[];
  created_at: string;
  provider_name: string;
  provider_business_name?: string;
  provider_phone?: string;
}

export interface InvoiceCustomer {
  full_name: string;
  email: string;
  phone?: string | null;
  address?: string;
  city?: string;
  pincode?: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  booking: InvoiceBooking;
  customer: InvoiceCustomer;
}

export function getInvoiceNumber(bookingId: string): string {
  return `HE-${bookingId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

export function buildInvoiceData(
  booking: InvoiceBooking,
  customer: InvoiceCustomer
): InvoiceData {
  return {
    invoiceNumber: getInvoiceNumber(booking.id),
    invoiceDate: new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    booking,
    customer,
  };
}

function formatCategory(category: string): string {
  return category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatServiceDate(date: string, time: string): string {
  const dateStr = new Date(date).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${dateStr} at ${timeStr}`;
}

export function downloadInvoicePdf(data: InvoiceData): void {
  const doc = new jsPDF();
  const { invoiceNumber, invoiceDate, booking, customer } = data;
  const margin = 20;
  let y = 20;

  const line = (text: string, size = 11, bold = false) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(text, margin, y);
    y += size === 20 ? 12 : size === 14 ? 9 : 7;
  };

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('HomeEase', margin, 18);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Tax Invoice / Service Receipt', margin, 26);

  doc.setTextColor(30, 30, 30);
  y = 42;
  line(`Invoice No: ${invoiceNumber}`, 11, true);
  line(`Invoice Date: ${invoiceDate}`);
  line(`Booking ID: ${booking.id.slice(0, 8)}...`);
  y += 4;

  line('Bill To', 12, true);
  line(customer.full_name);
  if (customer.email) line(customer.email);
  if (customer.phone) line(`Phone: ${customer.phone}`);
  const customerAddr = [customer.address, customer.city, customer.pincode].filter(Boolean).join(', ');
  if (customerAddr) line(customerAddr);
  y += 4;

  line('Service Provider', 12, true);
  line(booking.provider_name);
  if (booking.provider_business_name) line(booking.provider_business_name);
  if (booking.provider_phone) line(`Phone: ${booking.provider_phone}`);
  y += 4;

  line('Service Details', 12, true);
  line(`Service: ${booking.service_name}`);
  line(`Category: ${formatCategory(booking.service_category)}`);
  line(`Scheduled: ${formatServiceDate(booking.scheduled_date, booking.scheduled_time)}`);
  line(`Location: ${booking.address}, ${booking.city} - ${booking.pincode}`);
  y += 6;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, 190, y);
  y += 10;

  line('Charges', 12, true);
  const baseAmount = booking.base_service_amount ?? booking.total_amount;
  line(`Base service charge: Rs. ${Number(baseAmount).toLocaleString('en-IN')}`);
  const materials = booking.material_charges || [];
  for (const item of materials) {
    line(`  ${item.label}: Rs. ${Number(item.amount).toLocaleString('en-IN')}`);
  }
  if (materials.length > 0) {
    const materialSub = materials.reduce((s, m) => s + m.amount, 0);
    line(`Materials subtotal: Rs. ${materialSub.toLocaleString('en-IN')}`);
  }
  y += 2;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Amount', margin, y);
  doc.text(`Rs. ${Number(booking.total_amount).toLocaleString('en-IN')}`, 150, y, { align: 'right' });
  y += 12;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Payment status: Completed', margin, y);
  y += 6;
  doc.text('Thank you for using HomeEase India Connect.', margin, y);
  y += 5;
  doc.text('This is a computer-generated invoice.', margin, y);

  doc.save(`HomeEase-Invoice-${invoiceNumber}.pdf`);
}
