// @ts-nocheck
import express from 'express';
import type { Response, Request } from 'express';
import { supabase } from '../config/database.js';

const router = express.Router();

// GET /api/public/allocation-chart - Get allocation and distribution data for chart (last 6 months)
router.get('/allocation-chart', async (req: Request, res: Response) => {
  try {
    // First, get the date range of available data
    const { data: dateRange, error: rangeError } = await supabase
      .from('deliveries')
      .select('delivery_date')
      .order('delivery_date', { ascending: false })
      .limit(1);

    if (rangeError) throw rangeError;

    // If no data, return empty
    if (!dateRange || dateRange.length === 0) {
      return res.json({ chartData: [] });
    }

    // Calculate 6 months before the latest delivery date
    const latestDate = new Date(dateRange[0].delivery_date);
    const sixMonthsBefore = new Date(latestDate);
    sixMonthsBefore.setMonth(sixMonthsBefore.getMonth() - 5); // -5 to include current month = 6 months total
    const sixMonthsBeforeStr = sixMonthsBefore.toISOString().split('T')[0];

    // Fetch all deliveries within this range
    const { data: allDeliveries, error } = await supabase
      .from('deliveries')
      .select('amount, delivery_date, status, created_at')
      .gte('delivery_date', sixMonthsBeforeStr)
      .order('delivery_date', { ascending: true });

    if (error) throw error;

    const deliveries = allDeliveries || [];

    // Group data by month
    const monthlyData = new Map<string, { alokasi: number; distribusi: number }>();

    // Get 6 months from the data range (from sixMonthsBefore to latestDate)
    const months: string[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    // Generate months from sixMonthsBefore to latestDate
    const currentMonth = new Date(sixMonthsBefore);
    currentMonth.setDate(1); // Set to first day of month

    while (currentMonth <= latestDate) {
      const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
      months.push(monthKey);
      monthlyData.set(monthKey, { alokasi: 0, distribusi: 0 });
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    // Limit to 6 months
    const last6Months = months.slice(-6);

    // Process deliveries to separate allocation and distribution
    deliveries.forEach(delivery => {
      const date = new Date(delivery.delivery_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (monthlyData.has(monthKey)) {
        const data = monthlyData.get(monthKey)!;
        const amountInMillions = Math.round((delivery.amount || 0) / 1_000_000);

        // All deliveries count as allocation
        data.alokasi += amountInMillions;

        // Only delivered/verified count as distribution
        if (delivery.status === 'delivered' || delivery.status === 'verified') {
          data.distribusi += amountInMillions;
        }
      }
    });

    // Convert to array format for chart (use only last 6 months)
    const chartData = last6Months.map(monthKey => {
      const date = new Date(monthKey + '-01');
      const monthLabel = monthNames[date.getMonth()];
      const data = monthlyData.get(monthKey) || { alokasi: 0, distribusi: 0 };

      return {
        month: monthLabel,
        alokasi: data.alokasi,
        distribusi: data.distribusi
      };
    });

    res.json({ chartData });
  } catch (error) {
    console.error('Get allocation chart error:', error);
    res.status(500).json({
      error: 'Failed to fetch allocation chart data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/public/priority-schools - Get top priority schools with their allocation
router.get('/priority-schools', async (req: Request, res: Response) => {
  try {
    const { limit = '6' } = req.query;
    const limitNum = parseInt(limit as string);

    // Fetch top priority schools with their total deliveries
    const { data: schools, error } = await supabase
      .from('schools')
      .select('id, npsn, name, city, province, status, priority_score')
      .order('priority_score', { ascending: false })
      .limit(limitNum);

    if (error) throw error;

    // For each school, get the total budget from deliveries
    const schoolsWithBudget = await Promise.all(
      (schools || []).map(async (school) => {
        const { data: deliveries } = await supabase
          .from('deliveries')
          .select('amount')
          .eq('school_id', school.id);

        const totalBudget = (deliveries || []).reduce(
          (sum, delivery) => sum + (delivery.amount || 0),
          0
        );

        // Format budget to Rupiah
        const formattedBudget =
          totalBudget >= 1_000_000_000
            ? `Rp ${(totalBudget / 1_000_000_000).toFixed(1)} M`
            : totalBudget >= 1_000_000
            ? `Rp ${(totalBudget / 1_000_000).toFixed(1)} Jt`
            : totalBudget > 0
            ? `Rp ${(totalBudget / 1_000).toFixed(0)} Rb`
            : 'Rp 0';

        // Map status to display format
        let statusDisplay = 'Aktif';
        let statusColor = 'text-green-600 bg-green-50';

        if (school.status === 'inactive') {
          statusDisplay = 'Tidak Aktif';
          statusColor = 'text-gray-600 bg-gray-50';
        } else if (school.status === 'completed') {
          statusDisplay = 'Selesai';
          statusColor = 'text-blue-600 bg-blue-50';
        }

        return {
          nama: school.name,
          kota: school.city || school.province || 'N/A',
          anggaran: formattedBudget,
          status: statusDisplay,
          statusColor
        };
      })
    );

    res.json({ prioritySchools: schoolsWithBudget });
  } catch (error) {
    console.error('Get priority schools error:', error);
    res.status(500).json({
      error: 'Failed to fetch priority schools',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
