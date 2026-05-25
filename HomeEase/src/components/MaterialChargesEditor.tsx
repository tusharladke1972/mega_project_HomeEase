import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Package } from 'lucide-react';
import {
  addMaterialCharge,
  fetchMaterialCharges,
  removeMaterialCharge,
  type MaterialCharge,
} from '@/lib/bookingCharges';

interface MaterialChargesEditorProps {
  bookingId: string;
  baseServiceAmount: number;
  onTotalChange?: (newTotal: number) => void;
  readOnly?: boolean;
}

const MaterialChargesEditor: React.FC<MaterialChargesEditorProps> = ({
  bookingId,
  baseServiceAmount,
  onTotalChange,
  readOnly = false,
}) => {
  const { toast } = useToast();
  const [charges, setCharges] = useState<MaterialCharge[]>([]);
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await fetchMaterialCharges(bookingId);
      setCharges(data);
    } catch (error: any) {
      console.error(error);
      if (error?.message?.includes('does not exist')) {
        toast({
          title: 'Database setup required',
          description: 'Run the booking_material_charges migration in Supabase SQL Editor.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [bookingId]);

  const materialTotal = charges.reduce((s, c) => s + c.amount, 0);
  const grandTotal = baseServiceAmount + materialTotal;

  const handleAdd = async () => {
    const parsed = Number(amount);
    if (!itemName.trim()) {
      toast({ title: 'Enter material name', variant: 'destructive' });
      return;
    }
    if (!parsed || parsed <= 0) {
      toast({ title: 'Enter a valid amount', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const newTotal = await addMaterialCharge(bookingId, itemName, parsed, baseServiceAmount);
      setItemName('');
      setAmount('');
      await load();
      onTotalChange?.(newTotal);
      toast({ title: 'Material charge added' });
    } catch (error: any) {
      toast({
        title: 'Failed to add charge',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (chargeId: string) => {
    setSaving(true);
    try {
      const newTotal = await removeMaterialCharge(chargeId, bookingId, baseServiceAmount);
      await load();
      onTotalChange?.(newTotal);
      toast({ title: 'Charge removed' });
    } catch (error: any) {
      toast({
        title: 'Failed to remove',
        description: error?.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Loading material charges...</p>;
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-3">
      <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
        <Package className="w-4 h-4" />
        Material & extra charges
      </div>

      <div className="text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-600">Base service</span>
          <span>₹{baseServiceAmount.toLocaleString('en-IN')}</span>
        </div>
        {charges.map((c) => (
          <div key={c.id} className="flex justify-between items-center gap-2">
            <span className="text-gray-700 truncate flex-1">{c.item_name}</span>
            <span className="font-medium">₹{c.amount.toLocaleString('en-IN')}</span>
            {!readOnly && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-600 shrink-0"
                onClick={() => handleRemove(c.id)}
                disabled={saving}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        ))}
        <div className="flex justify-between font-bold text-gray-900 pt-2 border-t">
          <span>Total payable</span>
          <span className="text-green-700">₹{grandTotal.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {!readOnly && (
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <Input
            placeholder="Material name (e.g. PVC pipe)"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="bg-white flex-1"
          />
          <Input
            type="number"
            placeholder="₹ Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-white w-full sm:w-28"
            min={1}
          />
          <Button
            type="button"
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 shrink-0"
            onClick={handleAdd}
            disabled={saving}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      )}
    </div>
  );
};

export default MaterialChargesEditor;
