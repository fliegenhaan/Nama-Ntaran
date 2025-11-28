// @ts-nocheck
import express from 'express';
import type { Response } from 'express';
import { supabase } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import axios from 'axios';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/qr-scans
 * Log a QR code scan event
 * Only schools can log scans
 */
router.post('/', requireRole('school', 'admin'), async (req: AuthRequest, res: Response) => {
  const {
    delivery_id,
    scan_method,
    scan_data,
    scan_result,
    error_message,
    blockchain_verified,
    blockchain_tx_hash,
    blockchain_data,
    device_info
  } = req.body;

  // Validation
  if (!scan_method || !scan_result) {
    return res.status(400).json({
      error: 'scan_method and scan_result are required'
    });
  }

  if (!['camera', 'upload'].includes(scan_method)) {
    return res.status(400).json({
      error: 'scan_method must be either "camera" or "upload"'
    });
  }

  if (!['success', 'invalid', 'error'].includes(scan_result)) {
    return res.status(400).json({
      error: 'scan_result must be "success", "invalid", or "error"'
    });
  }

  try {
    // Get school_id from user
    let school_id = null;
    if (req.user?.role === 'school') {
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

      if (schoolError || !schoolData) {
        return res.status(403).json({ error: 'School not found for this user' });
      }
      school_id = schoolData.id;
    }

    // Get IP address from request
    const ip_address = req.ip || req.connection.remoteAddress;

    // Create scan log
    const { data: scanLog, error: scanError } = await supabase
      .from('qr_scan_logs')
      .insert({
        delivery_id: delivery_id || null,
        school_id,
        scanned_by: req.user?.id,
        scan_method,
        scan_data: scan_data || null,
        scan_result,
        error_message: error_message || null,
        blockchain_verified: blockchain_verified || false,
        blockchain_tx_hash: blockchain_tx_hash || null,
        blockchain_data: blockchain_data || null,
        device_info: device_info || null,
        ip_address: ip_address || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (scanError || !scanLog) {
      throw scanError || new Error('Failed to create scan log');
    }

    res.status(201).json({
      success: true,
      message: 'QR scan logged successfully',
      scan_log: scanLog
    });
  } catch (error) {
    console.error('Create scan log error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log QR scan',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/qr-scans
 * Get QR scan history with filters
 * Schools can only see their own scans
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      scan_result = '',
      delivery_id = '',
      start_date = '',
      end_date = '',
      blockchain_verified = ''
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build query
    let query = supabase
      .from('qr_scan_logs')
      .select(`
        *,
        deliveries (
          id,
          delivery_date,
          portions,
          status,
          caterings (
            name
          )
        ),
        schools (
          name,
          npsn
        ),
        users!qr_scan_logs_scanned_by_fkey (
          name,
          email
        )
      `, { count: 'exact' });

    // Filter by user role
    if (req.user?.role === 'school') {
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

      if (schoolData && !schoolError) {
        query = query.eq('school_id', schoolData.id);
      }
    }

    // Apply filters
    if (scan_result) {
      query = query.eq('scan_result', scan_result);
    }

    if (delivery_id) {
      query = query.eq('delivery_id', delivery_id);
    }

    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    if (blockchain_verified) {
      query = query.eq('blockchain_verified', blockchain_verified === 'true');
    }

    // Apply sorting and pagination
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) {
      throw error;
    }

    // Flatten the nested structure
    const scanLogs = (data || []).map(log => ({
      ...log,
      delivery_date: log.deliveries?.delivery_date,
      delivery_portions: log.deliveries?.portions,
      delivery_status: log.deliveries?.status,
      catering_name: log.deliveries?.caterings?.name,
      school_name: log.schools?.name,
      school_npsn: log.schools?.npsn,
      scanned_by_name: log.users?.name,
      scanned_by_email: log.users?.email
    }));

    res.json({
      success: true,
      scan_logs: scanLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limitNum)
      }
    });
  } catch (error) {
    console.error('Get scan logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scan logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/qr-scans/:id
 * Get single QR scan log
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    let query = supabase
      .from('qr_scan_logs')
      .select(`
        *,
        deliveries (
          id,
          delivery_date,
          portions,
          status,
          amount,
          caterings (
            name,
            company_name
          )
        ),
        schools (
          name,
          npsn,
          address
        ),
        users!qr_scan_logs_scanned_by_fkey (
          name,
          email
        )
      `)
      .eq('id', id);

    // Schools can only see their own scan logs
    if (req.user?.role === 'school') {
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

      if (schoolData && !schoolError) {
        query = query.eq('school_id', schoolData.id);
      }
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: 'Scan log not found'
      });
    }

    // Flatten the nested structure
    const scanLog = {
      ...data,
      delivery_date: data.deliveries?.delivery_date,
      delivery_portions: data.deliveries?.portions,
      delivery_status: data.deliveries?.status,
      delivery_amount: data.deliveries?.amount,
      catering_name: data.deliveries?.caterings?.name,
      catering_company: data.deliveries?.caterings?.company_name,
      school_name: data.schools?.name,
      school_npsn: data.schools?.npsn,
      school_address: data.schools?.address,
      scanned_by_name: data.users?.name,
      scanned_by_email: data.users?.email
    };

    res.json({
      success: true,
      scan_log: scanLog
    });
  } catch (error) {
    console.error('Get scan log error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scan log',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/qr-scans/stats/summary
 * Get QR scan statistics
 * Schools see their own stats, admins see all
 */
router.get('/stats/summary', async (req: AuthRequest, res: Response) => {
  try {
    let school_id = null;

    // Get school_id if user is a school
    if (req.user?.role === 'school') {
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

      if (schoolData && !schoolError) {
        school_id = schoolData.id;
      }
    }

    // Build query
    let query = supabase.from('qr_scan_logs').select('*');

    if (school_id) {
      query = query.eq('school_id', school_id);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Calculate stats manually
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
      total_scans: data?.length || 0,
      successful_scans: data?.filter(s => s.scan_result === 'success').length || 0,
      failed_scans: data?.filter(s => s.scan_result !== 'success').length || 0,
      invalid_scans: data?.filter(s => s.scan_result === 'invalid').length || 0,
      error_scans: data?.filter(s => s.scan_result === 'error').length || 0,
      blockchain_verified_scans: data?.filter(s => s.blockchain_verified === true).length || 0,
      camera_scans: data?.filter(s => s.scan_method === 'camera').length || 0,
      upload_scans: data?.filter(s => s.scan_method === 'upload').length || 0,
      today_scans: data?.filter(s => s.created_at && new Date(s.created_at) >= today).length || 0,
      week_scans: data?.filter(s => s.created_at && new Date(s.created_at) >= weekAgo).length || 0,
      month_scans: data?.filter(s => s.created_at && new Date(s.created_at) >= monthStart).length || 0,
      success_rate: data && data.length > 0
        ? Math.round((data.filter(s => s.scan_result === 'success').length / data.length) * 100)
        : 0
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get scan stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scan stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
