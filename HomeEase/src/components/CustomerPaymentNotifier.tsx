import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRefreshInterval } from '@/hooks/useRefreshInterval';
import PaymentDueDialog from '@/components/PaymentDueDialog';
import InvoiceDialog from '@/components/InvoiceDialog';
import {
  acknowledgePayment,
  buildPaymentBreakdown,
  fetchMaterialChargesForBookings,
} from '@/lib/bookingCharges';
import { buildInvoiceData, type InvoiceData } from '@/lib/invoice';

/**
 * Shows payment-due popup when a booking is completed and not yet acknowledged.
 */
const CustomerPaymentNotifier: React.FC = () => {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [bookingInfo, setBookingInfo] = useState<{
    id: string;
    service_name: string;
    provider_name: string;
    scheduled_date: string;
    invoiceBooking: Parameters<typeof buildInvoiceData>[0];
  } | null>(null);
  const [breakdown, setBreakdown] = useState<ReturnType<typeof buildPaymentBreakdown> | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);

  const checkPendingPayments = useCallback(async () => {
    if (!user?.id || profile?.role === 'service_provider') return;

    try {
      const { data: rows, error } = await supabase
        .from('bookings')
        .select(
          'id, status, description, total_amount, base_service_amount, payment_acknowledged_at, scheduled_date, scheduled_time, address, city, pincode, created_at, service_id, service_provider_id'
        )
        .eq('customer_id', user.id)
        .eq('status', 'completed')
        .is('payment_acknowledged_at', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        if (error.message?.includes('payment_acknowledged')) return;
        throw error;
      }

      const row = rows?.[0];
      if (!row) {
        setOpen(false);
        return;
      }

      const materialsMap = await fetchMaterialChargesForBookings([row.id]);
      const materials = materialsMap.get(row.id) || [];
      const base = Number((row as any).base_service_amount ?? row.total_amount ?? 0);

      let serviceName = row.description || 'Service';
      let providerName = 'Service Provider';
      let providerBusiness = '';
      let providerPhone = '';
      let serviceCategory = 'general';

      if (row.service_id) {
        const { data: svc } = await supabase
          .from('services')
          .select('name, category')
          .eq('id', row.service_id)
          .maybeSingle();
        if (svc) {
          serviceName = svc.name;
          serviceCategory = svc.category;
        }
      }

      if (row.service_provider_id) {
        const { data: prov } = await supabase
          .from('service_providers')
          .select('business_name, user_id')
          .eq('id', row.service_provider_id)
          .maybeSingle();
        if (prov?.user_id) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('id', prov.user_id)
            .maybeSingle();
          providerName = prof?.full_name || providerName;
          providerPhone = prof?.phone || '';
          providerBusiness = prov.business_name || '';
        }
      }

      const paymentBreakdown = buildPaymentBreakdown(
        base,
        Number(row.total_amount || 0),
        materials
      );

      const invoiceBooking = {
        id: row.id,
        service_name: serviceName,
        service_category: serviceCategory,
        scheduled_date: row.scheduled_date,
        scheduled_time: row.scheduled_time,
        address: row.address,
        city: row.city,
        pincode: row.pincode,
        total_amount: paymentBreakdown.total_amount,
        base_service_amount: base,
        material_charges: materials.map((m) => ({ label: m.item_name, amount: m.amount })),
        created_at: row.created_at,
        provider_name: providerName,
        provider_business_name: providerBusiness,
        provider_phone: providerPhone,
      };

      setBookingInfo({
        id: row.id,
        service_name: serviceName,
        provider_name: providerName,
        scheduled_date: row.scheduled_date,
        invoiceBooking,
      });
      setBreakdown(paymentBreakdown);
      setOpen(true);
    } catch (e) {
      console.error('Payment notifier:', e);
    }
  }, [user?.id, profile?.role]);

  useEffect(() => {
    checkPendingPayments();
  }, [checkPendingPayments]);

  useRefreshInterval(checkPendingPayments, 30000);

  const handleAcknowledge = async () => {
    if (!bookingInfo) return;
    try {
      await acknowledgePayment(bookingInfo.id);
      setOpen(false);
      setBookingInfo(null);
      setBreakdown(null);
      checkPendingPayments();
    } catch (e) {
      console.error(e);
    }
  };

  const handleViewInvoice = () => {
    if (!bookingInfo || !user || !profile) return;
    setInvoice(
      buildInvoiceData(bookingInfo.invoiceBooking, {
        full_name: profile.full_name,
        email: user.email ?? '',
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        pincode: profile.pincode,
      })
    );
    setInvoiceOpen(true);
  };

  return (
    <>
      <PaymentDueDialog
        open={open}
        onOpenChange={setOpen}
        booking={
          bookingInfo
            ? {
                id: bookingInfo.id,
                service_name: bookingInfo.service_name,
                provider_name: bookingInfo.provider_name,
                scheduled_date: bookingInfo.scheduled_date,
              }
            : null
        }
        breakdown={breakdown}
        onAcknowledge={handleAcknowledge}
        onViewInvoice={handleViewInvoice}
      />
      <InvoiceDialog open={invoiceOpen} onOpenChange={setInvoiceOpen} invoice={invoice} />
    </>
  );
};

export default CustomerPaymentNotifier;
