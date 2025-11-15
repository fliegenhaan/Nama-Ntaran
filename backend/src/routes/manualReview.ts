/**
 * Manual Review API - Admin dapat review & approve/reject AI decisions
 */

import express from 'express';
import type { Response } from 'express';
import { pool } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import { releaseEscrowForDelivery } from '../services/blockchain.js';
import { emitToSchool, emitToCatering, emitToAdmins } from '../config/socket.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireRole('admin'));

// ============================================
// GET /api/manual-review/pending
// Get all verifications that need manual review
// ============================================
router.get('/pending', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        v.id as verification_id,
        v.delivery_id,
        v.verified_at,
        v.portions_received,
        v.quality_rating,
        v.notes,
        v.photo_url,
        v.status as verification_status,
        d.delivery_date,
        d.portions as expected_portions,
        d.amount,
        s.id as school_id,
        s.name as school_name,
        s.npsn,
        c.id as catering_id,
        c.name as catering_name,
        ai.id as ai_analysis_id,
        ai.quality_score,
        ai.freshness_score,
        ai.presentation_score,
        ai.hygiene_score,
        ai.detected_items,
        ai.portion_estimate,
        ai.portion_confidence,
        ai.meets_bgn_standards,
        ai.confidence,
        ai.reasoning,
        ai.issues,
        ai.warnings,
        ai.recommendations,
        ai.needs_manual_review
      FROM verifications v
      JOIN deliveries d ON v.delivery_id = d.id
      JOIN schools s ON d.school_id = s.id
      JOIN caterings c ON d.catering_id = c.id
      LEFT JOIN ai_food_analyses ai ON v.ai_analysis_id = ai.id
      WHERE ai.needs_manual_review = true
        AND v.status = 'pending_review'
      ORDER BY v.verified_at DESC
    `);

    res.json({
      success: true,
      count: result.rows.length,
      reviews: result.rows,
    });
  } catch (error: any) {
    console.error('[Manual Review] Get pending error:', error);
    res.status(500).json({
      error: 'Failed to fetch pending reviews',
      details: error.message,
    });
  }
});

// ============================================
// POST /api/manual-review/:verificationId/approve
// Admin approves AI-flagged verification
// ============================================
router.post('/:verificationId/approve', async (req: AuthRequest, res: Response) => {
  const { verificationId } = req.params;
  const { adminNotes } = req.body;

  try {
    // Get verification details
    const verificationResult = await pool.query(`
      SELECT
        v.*,
        d.id as delivery_id,
        d.catering_id,
        d.school_id,
        s.name as school_name,
        c.name as catering_name
      FROM verifications v
      JOIN deliveries d ON v.delivery_id = d.id
      JOIN schools s ON d.school_id = s.id
      JOIN caterings c ON d.catering_id = c.id
      WHERE v.id = $1
    `, [verificationId]);

    if (verificationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Verification not found' });
    }

    const verification = verificationResult.rows[0];

    // Update verification status to approved
    await pool.query(`
      UPDATE verifications
      SET
        status = 'approved',
        admin_reviewed_by = $1,
        admin_reviewed_at = CURRENT_TIMESTAMP,
        admin_notes = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [req.user?.id, adminNotes || null, verificationId]);

    // Update delivery status to verified
    await pool.query(
      'UPDATE deliveries SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['verified', verification.delivery_id]
    );

    // Update AI analysis status
    if (verification.ai_analysis_id) {
      await pool.query(
        'UPDATE ai_food_analyses SET needs_manual_review = false, manually_approved = true WHERE id = $1',
        [verification.ai_analysis_id]
      );
    }

    // Release escrow funds
    let blockchainRelease = null;
    try {
      blockchainRelease = await releaseEscrowForDelivery(verification.delivery_id);
      console.log('✅ Escrow released after manual approval:', blockchainRelease);
    } catch (blockchainError) {
      console.warn('⚠️  Blockchain release failed:', blockchainError);
    }

    // Send notifications
    try {
      emitToSchool(verification.school_id, 'manual_review:approved', {
        verificationId,
        message: 'Verifikasi Anda telah disetujui oleh admin',
      });

      emitToCatering(verification.catering_id, 'manual_review:approved', {
        verificationId,
        deliveryId: verification.delivery_id,
        message: `Verifikasi untuk ${verification.school_name} disetujui - dana akan segera cair`,
        blockchain: blockchainRelease,
      });

      emitToAdmins('manual_review:completed', {
        verificationId,
        decision: 'approved',
        reviewer: req.user?.email,
      });
    } catch (socketError) {
      console.warn('⚠️  WebSocket notification failed:', socketError);
    }

    res.json({
      success: true,
      message: 'Verification approved successfully',
      blockchain: blockchainRelease,
    });

  } catch (error: any) {
    console.error('[Manual Review] Approve error:', error);
    res.status(500).json({
      error: 'Failed to approve verification',
      details: error.message,
    });
  }
});

// ============================================
// POST /api/manual-review/:verificationId/reject
// Admin rejects AI-flagged verification
// ============================================
router.post('/:verificationId/reject', async (req: AuthRequest, res: Response) => {
  const { verificationId } = req.params;
  const { adminNotes, reason } = req.body;

  if (!reason) {
    return res.status(400).json({ error: 'Rejection reason is required' });
  }

  try {
    // Get verification details
    const verificationResult = await pool.query(`
      SELECT
        v.*,
        d.id as delivery_id,
        d.catering_id,
        d.school_id,
        s.name as school_name,
        c.name as catering_name
      FROM verifications v
      JOIN deliveries d ON v.delivery_id = d.id
      JOIN schools s ON d.school_id = s.id
      JOIN caterings c ON d.catering_id = c.id
      WHERE v.id = $1
    `, [verificationId]);

    if (verificationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Verification not found' });
    }

    const verification = verificationResult.rows[0];

    // Update verification status to rejected
    await pool.query(`
      UPDATE verifications
      SET
        status = 'rejected',
        admin_reviewed_by = $1,
        admin_reviewed_at = CURRENT_TIMESTAMP,
        admin_notes = $2,
        rejection_reason = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [req.user?.id, adminNotes || null, reason, verificationId]);

    // Update delivery status to requires_action
    await pool.query(
      'UPDATE deliveries SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['requires_action', verification.delivery_id]
    );

    // Update AI analysis
    if (verification.ai_analysis_id) {
      await pool.query(
        'UPDATE ai_food_analyses SET needs_manual_review = false, manually_approved = false, manually_rejected = true WHERE id = $1',
        [verification.ai_analysis_id]
      );
    }

    // Create issue automatically
    await pool.query(`
      INSERT INTO issues (
        delivery_id,
        reported_by,
        issue_type,
        severity,
        description,
        status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    `, [
      verification.delivery_id,
      req.user?.id,
      'quality_issue',
      'high',
      `Admin rejected verification: ${reason}. ${adminNotes || ''}`,
      'open',
    ]);

    // Send notifications
    try {
      emitToSchool(verification.school_id, 'manual_review:rejected', {
        verificationId,
        reason,
        message: 'Verifikasi ditolak oleh admin - mohon hubungi katering untuk perbaikan',
      });

      emitToCatering(verification.catering_id, 'manual_review:rejected', {
        verificationId,
        deliveryId: verification.delivery_id,
        reason,
        message: `Verifikasi untuk ${verification.school_name} ditolak - pembayaran ditahan`,
      });

      emitToAdmins('manual_review:completed', {
        verificationId,
        decision: 'rejected',
        reviewer: req.user?.email,
        reason,
      });
    } catch (socketError) {
      console.warn('⚠️  WebSocket notification failed:', socketError);
    }

    res.json({
      success: true,
      message: 'Verification rejected successfully',
      reason,
    });

  } catch (error: any) {
    console.error('[Manual Review] Reject error:', error);
    res.status(500).json({
      error: 'Failed to reject verification',
      details: error.message,
    });
  }
});

// ============================================
// GET /api/manual-review/history
// Get manual review history
// ============================================
router.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const result = await pool.query(`
      SELECT
        v.id as verification_id,
        v.verified_at,
        v.admin_reviewed_at,
        v.status,
        v.admin_notes,
        v.rejection_reason,
        s.name as school_name,
        c.name as catering_name,
        u.email as reviewer_email,
        ai.quality_score,
        ai.compliance
      FROM verifications v
      JOIN deliveries d ON v.delivery_id = d.id
      JOIN schools s ON d.school_id = s.id
      JOIN caterings c ON d.catering_id = c.id
      LEFT JOIN users u ON v.admin_reviewed_by = u.id
      LEFT JOIN ai_food_analyses ai ON v.ai_analysis_id = ai.id
      WHERE v.status IN ('approved', 'rejected')
        AND v.admin_reviewed_by IS NOT NULL
      ORDER BY v.admin_reviewed_at DESC
      LIMIT $1 OFFSET $2
    `, [limitNum, offset]);

    // Get total count
    const countResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM verifications
      WHERE status IN ('approved', 'rejected')
        AND admin_reviewed_by IS NOT NULL
    `);

    res.json({
      success: true,
      history: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: parseInt(countResult.rows[0].total),
        total_pages: Math.ceil(parseInt(countResult.rows[0].total) / limitNum),
      },
    });

  } catch (error: any) {
    console.error('[Manual Review] Get history error:', error);
    res.status(500).json({
      error: 'Failed to fetch review history',
      details: error.message,
    });
  }
});

export default router;
