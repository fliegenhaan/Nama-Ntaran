// @ts-nocheck
/**
 * Admin Routes - Dashboard and admin-specific endpoints
 */

import express from 'express';
import type { Response } from 'express';
import { supabase } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireRole('admin'));

// ============================================
// GET /api/admin/dashboard
// Get comprehensive admin dashboard statistics
// ============================================
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    // Fetch all required data in parallel
    const [
      schoolsData,
      cateringsData,
      deliveriesData,
      escrowData,
      verificationsData,
      issuesData
    ] = await Promise.all([
      // Total schools
      supabase.from('schools').select('id', { count: 'exact', head: true }),
      // Total caterings
      supabase.from('caterings').select('id', { count: 'exact', head: true }),
      // Deliveries for amount calculations
      supabase.from('deliveries').select('amount, status'),
      // Escrow transactions
      supabase.from('escrow_transactions').select('amount, status'),
      // Verifications
      supabase.from('verifications').select('id, status, verified_at'),
      // Issues
      supabase.from('issues').select('id, status, created_at')
    ]);

    if (schoolsData.error) throw schoolsData.error;
    if (cateringsData.error) throw cateringsData.error;
    if (deliveriesData.error) throw deliveriesData.error;
    if (escrowData.error) throw escrowData.error;
    if (verificationsData.error) throw verificationsData.error;
    if (issuesData.error) throw issuesData.error;

    // Calculate statistics
    const totalSekolah = schoolsData.count || 0;
    const mitraKatering = cateringsData.count || 0;

    // Calculate escrow statistics
    const escrowTransactions = escrowData.data || [];
    const escrowAktif = escrowTransactions.filter(e => e.status === 'locked').length;
    const danaTerkunci = escrowTransactions
      .filter(e => e.status === 'locked')
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const danaTerdistribusi = escrowTransactions
      .filter(e => e.status === 'released')
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

    // Allocation data (sample data for now - you can customize this based on your needs)
    const allocationData = [
      { region: 'Jawa Barat', percentage: 35 },
      { region: 'Jawa Timur', percentage: 30 },
      { region: 'Jawa Tengah', percentage: 20 },
      { region: 'Sumatra', percentage: 10 },
      { region: 'Lainnya', percentage: 5 }
    ];

    // Activity log (recent activities)
    const verifications = verificationsData.data || [];
    const issues = issuesData.data || [];

    // Get recent activities
    const recentVerifications = verifications
      .sort((a, b) => new Date(b.verified_at).getTime() - new Date(a.verified_at).getTime())
      .slice(0, 3)
      .map(v => ({
        id: `v-${v.id}`,
        message: `Verifikasi pengiriman ${v.status}`,
        status: v.status === 'approved' ? 'Berhasil' : 'Pending',
        type: v.status === 'approved' ? 'success' : 'info',
        time: new Date(v.verified_at).toLocaleString('id-ID')
      }));

    const recentIssues = issues
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 2)
      .map(i => ({
        id: `i-${i.id}`,
        message: `Issue dilaporkan - Status: ${i.status}`,
        status: i.status === 'open' ? 'Perlu Tindakan' : 'Dalam Proses',
        type: i.status === 'open' ? 'warning' : 'info',
        time: new Date(i.created_at).toLocaleString('id-ID')
      }));

    const activityLog = [...recentVerifications, ...recentIssues]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);

    // Prepare stats response
    const stats = {
      totalSekolah,
      mitraKatering,
      escrowAktif,
      danaTerkunci: Math.round(danaTerkunci / 1000000), // Convert to millions
      danaTerdistribusi: Math.round(danaTerdistribusi / 1000000) // Convert to millions
    };

    res.json({
      success: true,
      data: {
        stats,
        allocationData,
        activityLog
      }
    });

  } catch (error: any) {
    console.error('[Admin Dashboard] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      message: error.message
    });
  }
});

// ============================================
// GET /api/admin/stats
// Get quick stats summary
// ============================================
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const [schoolsData, cateringsData, deliveriesData, issuesData] = await Promise.all([
      supabase.from('schools').select('id', { count: 'exact', head: true }),
      supabase.from('caterings').select('id', { count: 'exact', head: true }),
      supabase.from('deliveries').select('status'),
      supabase.from('issues').select('status')
    ]);

    res.json({
      success: true,
      stats: {
        totalSchools: schoolsData.count || 0,
        totalCaterings: cateringsData.count || 0,
        totalDeliveries: (deliveriesData.data || []).length,
        pendingIssues: (issuesData.data || []).filter(i => i.status === 'open').length
      }
    });

  } catch (error: any) {
    console.error('[Admin Stats] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
      message: error.message
    });
  }
});

export default router;
