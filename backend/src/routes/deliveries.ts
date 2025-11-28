// @ts-nocheck
import express from 'express';
import type { Response } from 'express';
import { supabase } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import { lockEscrowForDelivery } from '../services/blockchain.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// POST /api/deliveries - Create new delivery
router.post('/', async (req: AuthRequest, res: Response) => {
  const { school_id, catering_id, delivery_date, portions, amount, notes } = req.body;

  console.log('\n========================================');
  console.log('📦 [STEP 1] CREATE DELIVERY REQUEST');
  console.log('========================================');
  console.log('Request Body:', { school_id, catering_id, delivery_date, portions, amount, notes });
  console.log('User:', req.user?.email, '| Role:', req.user?.role);

  // Validation
  if (!school_id || !catering_id || !delivery_date || !portions || !amount) {
    console.log('❌ Validation failed: Missing required fields');
    return res.status(400).json({
      error: 'school_id, catering_id, delivery_date, portions, and amount are required'
    });
  }

  try {
    console.log('\n📝 Inserting delivery to database...');
    const { data: delivery, error } = await supabase
      .from('deliveries')
      .insert({
        school_id,
        catering_id,
        delivery_date,
        portions,
        amount,
        notes: notes || null,
        status: 'scheduled' // Changed from 'pending' to 'scheduled' to auto-lock escrow
      })
      .select()
      .single();

    if (error || !delivery) {
      console.log('❌ Database insert failed:', error);
      throw error || new Error('Failed to create delivery');
    }

    console.log('✅ Delivery created:', {
      id: delivery.id,
      status: delivery.status,
      amount: delivery.amount,
      delivery_date: delivery.delivery_date
    });

    // Auto-lock escrow for new delivery
    console.log('\n========================================');
    console.log('🔐 [STEP 2] AUTO-LOCK ESCROW');
    console.log('========================================');
    try {
      console.log(`🔐 Attempting to lock escrow for delivery ${delivery.id}...`);
      console.log('Escrow params:', { delivery_id: delivery.id, catering_id, school_id, amount });

      await lockEscrowForDelivery(
        delivery.id,
        catering_id,
        school_id,
        amount
      );

      console.log(`✅ Escrow locked successfully for delivery ${delivery.id}`);
      console.log('========================================\n');
    } catch (escrowError) {
      console.log('========================================');
      console.error('⚠️  ESCROW LOCK FAILED (delivery still created)');
      console.error('Error details:', escrowError);
      console.log('========================================\n');
      // Don't fail the delivery creation if escrow lock fails
      // Just log the error - admin can manually lock escrow later
    }

    console.log('✅ [STEP 1 COMPLETE] Delivery created successfully\n');
    res.status(201).json({
      message: 'Delivery created successfully',
      delivery
    });
  } catch (error) {
    console.log('========================================');
    console.error('❌ [STEP 1 FAILED] Create delivery error:', error);
    console.log('========================================\n');
    res.status(500).json({
      error: 'Failed to create delivery',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/deliveries - Get deliveries with filters
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      status = '',
      school_id = '',
      catering_id = '',
      date_from = '',
      date_to = ''
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build query
    let query = supabase
      .from('deliveries')
      .select(`
        *,
        schools!inner(name, npsn, province, city),
        caterings!inner(company_name, name)
      `, { count: 'exact' });

    // Filter by user role
    if (req.user?.role === 'school') {
      // Get user's school_id
      const { data: schoolData } = await supabase
        .from('schools')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

      if (schoolData) {
        query = query.eq('school_id', schoolData.id);
      }
    } else if (req.user?.role === 'catering') {
      // Get user's catering_id
      const { data: cateringData } = await supabase
        .from('caterings')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

      if (cateringData) {
        query = query.eq('catering_id', cateringData.id);
      }
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (school_id) {
      query = query.eq('school_id', school_id);
    }

    if (catering_id) {
      query = query.eq('catering_id', catering_id);
    }

    if (date_from) {
      query = query.gte('delivery_date', date_from);
    }

    if (date_to) {
      query = query.lte('delivery_date', date_to);
    }

    // Apply sorting and pagination
    query = query
      .order('delivery_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // Flatten nested structure for consistency with original response
    const flattenedDeliveries = data?.map(d => ({
      ...d,
      school_name: d.schools?.name,
      npsn: d.schools?.npsn,
      province: d.schools?.province,
      city: d.schools?.city,
      catering_company: d.caterings?.company_name,
      catering_name: d.caterings?.name
    })) || [];

    const total = count || 0;

    res.json({
      deliveries: flattenedDeliveries,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get deliveries error:', error);
    res.status(500).json({
      error: 'Failed to fetch deliveries',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/deliveries/:id - Get single delivery
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('deliveries')
      .select(`
        *,
        schools(name, npsn, address, province, city),
        caterings(company_name, name, phone, email)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    // Flatten nested structure for consistency
    const flattenedDelivery = {
      ...data,
      school_name: data.schools?.name,
      npsn: data.schools?.npsn,
      school_address: data.schools?.address,
      province: data.schools?.province,
      city: data.schools?.city,
      catering_company: data.caterings?.company_name,
      catering_name: data.caterings?.name,
      catering_phone: data.caterings?.phone,
      catering_email: data.caterings?.email
    };

    res.json({
      delivery: flattenedDelivery
    });
  } catch (error) {
    console.error('Get delivery error:', error);
    res.status(500).json({
      error: 'Failed to fetch delivery',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PATCH /api/deliveries/:id - Update delivery (general)
// Supports updating: qr_code_url, notes, portions, amount, etc.
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const allowedFields = ['qr_code_url', 'notes', 'portions', 'amount'];

  // Filter only allowed fields from request body
  const updateData: any = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  // Check if there's anything to update
  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({
      error: 'No valid fields to update',
      allowed_fields: allowedFields
    });
  }

  try {
    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    const { data: delivery, error } = await supabase
      .from('deliveries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !delivery) {
      return res.status(404).json({ error: 'Delivery not found or update failed' });
    }

    res.json({
      success: true,
      message: 'Delivery updated successfully',
      delivery,
      updated_fields: Object.keys(updateData).filter(k => k !== 'updated_at')
    });
  } catch (error) {
    console.error('Update delivery error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update delivery',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PATCH /api/deliveries/:id/status - Update delivery status
router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  console.log('\n========================================');
  console.log('🔄 [STEP 3] UPDATE DELIVERY STATUS');
  console.log('========================================');
  console.log('Delivery ID:', id);
  console.log('New Status:', status);
  console.log('User:', req.user?.email, '| Role:', req.user?.role);

  const validStatuses = ['pending', 'scheduled', 'delivered', 'verified', 'cancelled'];

  if (!validStatuses.includes(status)) {
    console.log('❌ Invalid status provided');
    console.log('   Valid statuses:', validStatuses);
    return res.status(400).json({
      error: 'Invalid status',
      valid_statuses: validStatuses
    });
  }

  // SECURITY: Prevent catering from marking delivery as "verified"
  // Only school can verify deliveries
  if (status === 'verified' && req.user?.role !== 'school' && req.user?.role !== 'admin') {
    console.log('🚫 AUTHORIZATION FAILED: Only schools can verify deliveries');
    console.log('   User role:', req.user?.role);
    console.log('   Attempted status:', status);
    return res.status(403).json({
      error: 'Forbidden: Only schools can verify deliveries',
      message: 'Catering cannot mark deliveries as verified. Please wait for school verification.'
    });
  }

  try {
    console.log('\n📝 Updating delivery status in database...');
    const { data: delivery, error } = await supabase
      .from('deliveries')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !delivery) {
      console.log('❌ Delivery not found:', error);
      return res.status(404).json({ error: 'Delivery not found' });
    }

    console.log('✅ Status updated successfully');
    console.log('   Old status → New status:', delivery.status);
    console.log('   Delivery:', {
      id: delivery.id,
      status: delivery.status,
      school_id: delivery.school_id,
      catering_id: delivery.catering_id
    });

    console.log('========================================\n');

    res.json({
      message: 'Delivery status updated',
      delivery
    });
  } catch (error) {
    console.log('========================================');
    console.error('❌ Update delivery status error:', error);
    console.log('========================================\n');
    res.status(500).json({
      error: 'Failed to update delivery status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
