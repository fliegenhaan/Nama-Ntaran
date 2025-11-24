// @ts-nocheck
/**
 * ============================================
 * CATERING SCHEDULE ROUTES
 * ============================================
 * Routes untuk jadwal pengiriman catering
 * Menyediakan data schedule/allocations
 *
 * Endpoints:
 * GET /api/catering/schedules - Get all schedules
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
// GET /api/catering/schedules
// ============================================
/**
 * Get all schedules/allocations for the catering
 * Returns: list of scheduled deliveries
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

    // Get filter from query params
    const filter = (req.query.filter as string) || 'all';
    const limit = parseInt(req.query.limit as string) || 100;

    // Build base query
    let query = supabase
      .from('deliveries')
      .select(`
        id,
        delivery_date,
        portions,
        status,
        schools!inner(name, address)
      `)
      .eq('catering_id', cateringId);

    // Apply date filters
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (filter === 'today') {
      query = query.eq('delivery_date', today.toISOString().split('T')[0]);
    } else if (filter === 'week') {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      query = query
        .gte('delivery_date', weekStart.toISOString().split('T')[0])
        .lte('delivery_date', weekEnd.toISOString().split('T')[0]);
    } else if (filter === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      query = query
        .gte('delivery_date', monthStart.toISOString().split('T')[0])
        .lte('delivery_date', monthEnd.toISOString().split('T')[0]);
    }

    // Apply ordering and limit
    query = query
      .order('delivery_date', { ascending: true })
      .limit(limit);

    const { data: schedules, error: schedulesError } = await query;

    if (schedulesError) {
      throw schedulesError;
    }

    // Transform data to match frontend expectations
    const transformedSchedules = (schedules || []).map((schedule: any, index: number) => ({
      id: schedule.id.toString(),
      schoolName: schedule.schools?.name || 'Unknown School',
      address: schedule.schools?.address || 'Alamat tidak tersedia',
      timeRange: '08:00 - 10:00', // Default time range, can be enhanced with actual time fields
      portions: schedule.portions || 0,
      status: mapScheduleStatus(schedule.status, schedule.delivery_date),
      date: schedule.delivery_date,
      iconVariant: index % 2 === 0 ? 'primary' : 'secondary',
    }));

    res.json({
      success: true,
      data: transformedSchedules,
    });
  } catch (error: any) {
    console.error('Error fetching catering schedules:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// ============================================
// Helper: Map Schedule Status
// ============================================
function mapScheduleStatus(
  dbStatus: string,
  deliveryDate: string
): 'in_progress' | 'scheduled' | 'delivered' {
  // deliveries table statuses: 'pending', 'scheduled', 'delivered', 'verified', 'cancelled'
  const delDate = new Date(deliveryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  delDate.setHours(0, 0, 0, 0);

  // If status is verified
  if (dbStatus === 'verified') {
    return 'delivered';
  }

  // If date is today and status is delivered
  if (delDate.getTime() === today.getTime() && dbStatus === 'delivered') {
    return 'in_progress';
  }

  // If status is delivered
  if (dbStatus === 'delivered') {
    return 'in_progress';
  }

  // Default to scheduled for pending/scheduled/cancelled/future deliveries
  return 'scheduled';
}

export default router;
