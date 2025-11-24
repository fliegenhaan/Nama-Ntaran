// @ts-nocheck
/**
 * ============================================
 * CATERING DASHBOARD ROUTES
 * ============================================
 * Routes untuk dashboard utama catering
 * Menyediakan data stats, deliveries, dan badges
 *
 * Endpoints:
 * GET /api/catering/dashboard - Get main dashboard data
 *
 * Author: NutriChain Dev Team
 */

import express, { Router } from 'express';
import type { Response } from 'express';
import { supabase } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router: Router = express.Router();

// semua routes memerlukan authentication dan role catering
router.use(authenticateToken);
router.use(requireRole('catering'));

// ============================================
// HELPER: Get Catering ID from User
// ============================================
async function getCateringIdFromUser(userId: number): Promise<number | null> {
  const { data, error } = await supabase
    .from('caterings')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.id;
}

// ============================================
// GET /api/catering/dashboard
// ============================================
/**
 * Get main dashboard data
 * Returns: stats, today's deliveries, and notification badges
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const cateringId = await getCateringIdFromUser(userId);
    if (!cateringId) {
      return res.status(404).json({ error: 'Catering not found for user' });
    }

    // ============================================
    // 1. Get Locked Funds from Payments
    // ============================================
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('amount, status')
      .eq('catering_id', cateringId);

    if (paymentsError) {
      throw paymentsError;
    }

    let lockedFunds = 0;
    payments?.forEach((p) => {
      if (p.status === 'LOCKED') {
        lockedFunds += parseFloat(p.amount) || 0;
      }
    });

    // ============================================
    // 2. Get Today's Distribution Stats
    // ============================================
    const today = new Date().toISOString().split('T')[0];

    const { data: todayDeliveriesData, error: deliveriesStatsError } = await supabase
      .from('deliveries')
      .select('portions, schools!inner(id)')
      .eq('catering_id', cateringId)
      .eq('delivery_date', today);

    if (deliveriesStatsError) {
      throw deliveriesStatsError;
    }

    const schoolsSet = new Set<number>();
    let totalPortions = 0;

    todayDeliveriesData?.forEach((delivery: any) => {
      if (delivery.schools?.id) {
        schoolsSet.add(delivery.schools.id);
      }
      totalPortions += delivery.portions || 0;
    });

    // ============================================
    // 3. Get Highlighted Dates (dates with deliveries in current month)
    // ============================================
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data: monthDeliveries, error: monthError } = await supabase
      .from('deliveries')
      .select('delivery_date')
      .eq('catering_id', cateringId)
      .gte('delivery_date', firstDayOfMonth)
      .lte('delivery_date', lastDayOfMonth);

    if (monthError) {
      throw monthError;
    }

    const highlightedDates = new Set<number>();
    monthDeliveries?.forEach((delivery: any) => {
      const date = new Date(delivery.delivery_date);
      highlightedDates.add(date.getDate());
    });

    // ============================================
    // 4. Get Today's Deliveries/Schedules
    // ============================================
    const { data: todayDeliveries, error: deliveriesError } = await supabase
      .from('deliveries')
      .select(`
        id,
        portions,
        status,
        schools!inner(name)
      `)
      .eq('catering_id', cateringId)
      .eq('delivery_date', today)
      .order('created_at', { ascending: true })
      .limit(10);

    if (deliveriesError) {
      throw deliveriesError;
    }

    const deliveries = (todayDeliveries || []).map((d: any) => ({
      id: d.id.toString(),
      schoolName: d.schools?.name || 'Unknown School',
      time: '08:00', // Default time, can be enhanced with actual time field
      portions: d.portions || 0,
      status: mapDeliveryStatus(d.status),
    }));

    // ============================================
    // 5. Get Notification Badges
    // ============================================
    // Get pending issues count
    const { data: pendingIssues, error: issuesError } = await supabase
      .from('issues')
      .select('id', { count: 'exact', head: true })
      .eq('catering_id', cateringId)
      .eq('status', 'pending');

    const issuesCount = pendingIssues?.length || 0;

    // Get pending payments count
    const { data: pendingPayments, error: pendingPaymentsError } = await supabase
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('catering_id', cateringId)
      .eq('status', 'PENDING');

    const paymentsCount = pendingPayments?.length || 0;

    const badges = [
      { path: '/catering/issues', count: issuesCount },
      { path: '/catering/payment', count: paymentsCount },
    ];

    // ============================================
    // Return Combined Response
    // ============================================
    res.json({
      success: true,
      data: {
        stats: {
          lockedFunds: `Rp ${lockedFunds.toLocaleString('id-ID')}`,
          lockedFundsDescription: 'Dana yang sedang dikunci dalam escrow',
          todayDistribution: {
            schools: schoolsSet.size,
            portions: totalPortions,
          },
          highlightedDates: Array.from(highlightedDates),
        },
        deliveries,
        badges,
      },
    });
  } catch (error: any) {
    console.error('Error fetching catering dashboard:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// ============================================
// Helper: Map Delivery Status
// ============================================
function mapDeliveryStatus(dbStatus: string): 'pending' | 'in_progress' | 'completed' {
  // deliveries table statuses: 'pending', 'scheduled', 'delivered', 'verified', 'cancelled'
  switch (dbStatus?.toLowerCase()) {
    case 'verified':
      return 'completed';
    case 'delivered':
      return 'in_progress';
    case 'pending':
    case 'scheduled':
    case 'cancelled':
    default:
      return 'pending';
  }
}

export default router;
