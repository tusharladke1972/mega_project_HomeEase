import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getProviderIdForUser } from '@/lib/providerCache';
import { useRefreshInterval } from '@/hooks/useRefreshInterval';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const EarningsReportPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const navigate = useNavigate();

  const fetchEarnings = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const providerId = await getProviderIdForUser(user.id);
        if (!providerId) {
          setCompletedJobs([]);
          setTotalEarnings(0);
          return;
        }

        const { data: bookings, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('service_provider_id', providerId)
          .eq('status', 'completed')
          .order('scheduled_date', { ascending: false });

        if (error) {
          throw error;
        }

        const rows = bookings || [];
        const serviceIds = [...new Set(rows.map((b: any) => b.service_id).filter(Boolean))];
        const { data: servicesData } = serviceIds.length
          ? await supabase.from('services').select('id, name').in('id', serviceIds as string[])
          : ({ data: [] } as any);

        const servicesMap = new Map((servicesData || []).map((s: any) => [s.id, s.name]));
        const enriched = rows.map((b: any) => ({
          ...b,
          service_name: b.service_id ? servicesMap.get(b.service_id) || b.description || 'Service' : (b.description || 'Service'),
        }));

        setCompletedJobs(enriched);
        setTotalEarnings(enriched.reduce((sum: number, b: any) => sum + Number(b.total_amount || 0), 0));
      } catch (error) {
        console.error('Error fetching earnings:', error);
        setCompletedJobs([]);
        setTotalEarnings(0);
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    if (user?.id) fetchEarnings();
  }, [user?.id]);

  useRefreshInterval(() => {
    if (user?.id) fetchEarnings();
  }, 30000);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200">
      <Card className="w-full max-w-2xl shadow-2xl rounded-3xl border-0 p-8 flex flex-col items-center">
        <div className="w-full flex items-center mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
            <ArrowLeft className="w-6 h-6 text-blue-600" />
          </Button>
        </div>
        <CardHeader className="flex flex-col items-center">
          <BarChart2 className="w-12 h-12 text-blue-600 mb-4" />
          <CardTitle className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Earning Report</CardTitle>
        </CardHeader>
        <CardContent className="w-full flex flex-col gap-8 items-center">
          {loading ? (
            <div className="text-lg text-gray-700">Loading earnings...</div>
          ) : (
            <>
              <div className="w-full flex flex-col md:flex-row md:justify-between gap-4 mb-6">
                <div>
                  <div className="text-gray-500 text-sm">Total Earnings</div>
                  <div className="text-2xl font-bold text-green-700">₹{totalEarnings.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-sm">Completed Jobs</div>
                  <div className="text-2xl font-bold">{completedJobs.length}</div>
                </div>
              </div>
              <div className="w-full">
                <div className="font-semibold text-lg mb-2">Recent Completed Bookings</div>
                {completedJobs.length === 0 ? (
                  <div className="text-gray-500">No completed bookings yet.</div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 pr-4">Date</th>
                        <th className="py-2 pr-4">Service</th>
                        <th className="py-2 pr-4">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedJobs.slice(0, 5).map((job: any) => (
                        <tr key={job.id} className="border-b last:border-0">
                          <td className="py-2 pr-4">{new Date(job.scheduled_date).toLocaleDateString('en-IN')}</td>
                          <td className="py-2 pr-4">{job.service_name}</td>
                          <td className="py-2 pr-4">₹{Number(job.total_amount).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EarningsReportPage; 