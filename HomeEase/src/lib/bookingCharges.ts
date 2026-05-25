import { supabase } from '@/integrations/supabase/client';

export interface MaterialCharge {
  id: string;
  booking_id: string;
  item_name: string;
  amount: number;
  created_at?: string;
}

export interface BookingPaymentBreakdown {
  base_service_amount: number;
  material_charges: MaterialCharge[];
  material_total: number;
  total_amount: number;
}

export async function fetchMaterialCharges(bookingId: string): Promise<MaterialCharge[]> {
  const { data, error } = await (supabase as any)
    .from('booking_material_charges')
    .select('id, booking_id, item_name, amount, created_at')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true });

  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return [];
    }
    throw error;
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    booking_id: row.booking_id,
    item_name: row.item_name,
    amount: Number(row.amount),
    created_at: row.created_at,
  }));
}

export async function fetchMaterialChargesForBookings(
  bookingIds: string[]
): Promise<Map<string, MaterialCharge[]>> {
  const map = new Map<string, MaterialCharge[]>();
  if (bookingIds.length === 0) return map;

  const { data, error } = await (supabase as any)
    .from('booking_material_charges')
    .select('id, booking_id, item_name, amount, created_at')
    .in('booking_id', bookingIds);

  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return map;
    }
    throw error;
  }

  for (const row of data || []) {
    const list = map.get(row.booking_id) || [];
    list.push({
      id: row.id,
      booking_id: row.booking_id,
      item_name: row.item_name,
      amount: Number(row.amount),
      created_at: row.created_at,
    });
    map.set(row.booking_id, list);
  }

  return map;
}

export function sumMaterialCharges(charges: MaterialCharge[]): number {
  return charges.reduce((sum, c) => sum + c.amount, 0);
}

export function buildPaymentBreakdown(
  baseServiceAmount: number,
  totalAmount: number,
  materialCharges: MaterialCharge[]
): BookingPaymentBreakdown {
  const material_total = sumMaterialCharges(materialCharges);
  return {
    base_service_amount: baseServiceAmount,
    material_charges: materialCharges,
    material_total,
    total_amount: totalAmount || baseServiceAmount + material_total,
  };
}

export async function recalculateBookingTotal(
  bookingId: string,
  baseServiceAmount: number
): Promise<number> {
  const materials = await fetchMaterialCharges(bookingId);
  const total = baseServiceAmount + sumMaterialCharges(materials);

  const { error } = await supabase
    .from('bookings')
    .update({ total_amount: total })
    .eq('id', bookingId);

  if (error) throw error;
  return total;
}

export async function addMaterialCharge(
  bookingId: string,
  itemName: string,
  amount: number,
  baseServiceAmount: number
): Promise<number> {
  const { error: insertError } = await (supabase as any)
    .from('booking_material_charges')
    .insert({
      booking_id: bookingId,
      item_name: itemName.trim(),
      amount,
    });

  if (insertError) throw insertError;
  return recalculateBookingTotal(bookingId, baseServiceAmount);
}

export async function removeMaterialCharge(
  chargeId: string,
  bookingId: string,
  baseServiceAmount: number
): Promise<number> {
  const { error: deleteError } = await (supabase as any)
    .from('booking_material_charges')
    .delete()
    .eq('id', chargeId);

  if (deleteError) throw deleteError;
  return recalculateBookingTotal(bookingId, baseServiceAmount);
}

export async function acknowledgePayment(bookingId: string): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .update({ payment_acknowledged_at: new Date().toISOString() } as any)
    .eq('id', bookingId);

  if (error) throw error;
}
