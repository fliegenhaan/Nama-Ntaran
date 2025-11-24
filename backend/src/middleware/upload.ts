// @ts-nocheck
import multer from 'multer';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * ============================================================================
 * SUPABASE STORAGE UPLOAD MIDDLEWARE
 * ============================================================================
 *
 * Replaces local filesystem upload with Supabase Storage
 *
 * Buckets (must be created in Supabase Dashboard):
 * - verification-photos (public)
 * - issue-photos (public)
 * - menu-photos (public)
 *
 * Benefits:
 * ✅ Scalable for production
 * ✅ Automatic backup & CDN
 * ✅ No data loss on server restart
 * ✅ Built-in access control
 */

// Configure storage - use memoryStorage for Supabase upload
const storage = multer.memoryStorage();

// File filter - only images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
  }
};

// Create multer instance
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// Middleware for single file upload
export const uploadSingle = (fieldName: string) => upload.single(fieldName);

// Middleware for multiple files upload
export const uploadMultiple = (fieldName: string, maxCount: number = 5) =>
  upload.array(fieldName, maxCount);

/**
 * Upload file to Supabase Storage
 * @param file - Multer file object
 * @param bucket - Supabase bucket name
 * @param folder - Optional folder within bucket
 * @returns Public URL of uploaded file
 */
export async function uploadToSupabase(
  file: Express.Multer.File,
  bucket: 'verification-photos' | 'issue-photos' | 'menu-photos',
  folder?: string
): Promise<{ url: string; path: string }> {
  try {
    // Generate unique filename
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const uniqueFilename = `${basename}-${uuidv4()}${ext}`;

    // Construct file path
    const filePath = folder ? `${folder}/${uniqueFilename}` : uniqueFilename;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('[Upload] Supabase Storage error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.log(`[Upload] File uploaded successfully: ${bucket}/${filePath}`);

    return {
      url: urlData.publicUrl,
      path: filePath,
    };
  } catch (error: any) {
    console.error('[Upload] Error uploading to Supabase:', error);
    throw error;
  }
}

/**
 * Upload verification photo
 * @param file - Multer file object
 * @param deliveryId - ID of the delivery
 * @returns Public URL and path
 */
export async function uploadVerificationPhoto(
  file: Express.Multer.File,
  deliveryId: number
): Promise<{ url: string; path: string }> {
  return uploadToSupabase(file, 'verification-photos', `delivery-${deliveryId}`);
}

/**
 * Upload issue photo
 * @param file - Multer file object
 * @param issueId - ID of the issue
 * @returns Public URL and path
 */
export async function uploadIssuePhoto(
  file: Express.Multer.File,
  issueId: number
): Promise<{ url: string; path: string }> {
  return uploadToSupabase(file, 'issue-photos', `issue-${issueId}`);
}

/**
 * Upload menu photo
 * @param file - Multer file object
 * @param menuId - ID of the menu item
 * @returns Public URL and path
 */
export async function uploadMenuPhoto(
  file: Express.Multer.File,
  menuId: number
): Promise<{ url: string; path: string }> {
  return uploadToSupabase(file, 'menu-photos', `menu-${menuId}`);
}

/**
 * Delete file from Supabase Storage
 * @param bucket - Bucket name
 * @param filePath - Path to file within bucket
 */
export async function deleteFileFromSupabase(
  bucket: 'verification-photos' | 'issue-photos' | 'menu-photos',
  filePath: string
): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error(`[Upload] Error deleting file ${filePath}:`, error);
      throw error;
    }

    console.log(`[Upload] File deleted: ${bucket}/${filePath}`);
  } catch (error) {
    console.error(`[Upload] Failed to delete file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Helper function to get file URL (for backward compatibility)
 * @deprecated Use uploadToSupabase and get URL from result
 */
export function getFileUrl(filename: string, subfolder?: string): string {
  const supabaseUrl = process.env.SUPABASE_URL || '';

  // Construct Supabase Storage URL
  let bucket = 'verification-photos';
  if (subfolder === 'issues') bucket = 'issue-photos';
  if (subfolder === 'menu') bucket = 'menu-photos';

  const filePath = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filename}`;

  return filePath;
}

/**
 * Ensure all required buckets exist (run this during app initialization)
 */
export async function ensureStorageBucketsExist(): Promise<void> {
  const buckets = [
    { name: 'verification-photos', public: true },
    { name: 'issue-photos', public: true },
    { name: 'menu-photos', public: true },
  ];

  for (const bucket of buckets) {
    try {
      // Check if bucket exists
      const { data: existingBuckets } = await supabase.storage.listBuckets();
      const bucketExists = existingBuckets?.some(b => b.name === bucket.name);

      if (!bucketExists) {
        // Create bucket if it doesn't exist
        const { error } = await supabase.storage.createBucket(bucket.name, {
          public: bucket.public,
          fileSizeLimit: 5 * 1024 * 1024, // 5MB
        });

        if (error) {
          console.error(`[Upload] Failed to create bucket ${bucket.name}:`, error);
        } else {
          console.log(`[Upload] Bucket created: ${bucket.name}`);
        }
      } else {
        console.log(`[Upload] Bucket already exists: ${bucket.name}`);
      }
    } catch (error) {
      console.error(`[Upload] Error checking/creating bucket ${bucket.name}:`, error);
    }
  }
}

/**
 * ============================================================================
 * MIGRATION GUIDE
 * ============================================================================
 *
 * Old code:
 * ```typescript
 * app.post('/api/verifications', uploadSingle('photo'), async (req, res) => {
 *   const photoUrl = getFileUrl(req.file.filename, 'verifications');
 *   // ...
 * });
 * ```
 *
 * New code:
 * ```typescript
 * app.post('/api/verifications', uploadSingle('photo'), async (req, res) => {
 *   const { url, path } = await uploadVerificationPhoto(req.file, deliveryId);
 *   // Save url to database
 * });
 * ```
 *
 * Remember to:
 * 1. Create buckets in Supabase Dashboard (or run ensureStorageBucketsExist())
 * 2. Update all routes that handle file uploads
 * 3. Update database to store Supabase URLs instead of local paths
 * 4. Migrate existing files (see migration script below)
 */

/**
 * Migration script for existing files (run once)
 */
export async function migrateExistingFilesToSupabase(): Promise<void> {
  console.log('[Migration] Starting file migration to Supabase Storage...');

  // This would:
  // 1. Read all existing files from uploads/
  // 2. Upload to appropriate Supabase bucket
  // 3. Update database records with new URLs
  // 4. Verify migration
  // 5. Optionally delete local files

  // Implementation would be in a separate migration script
  // For now, this is a placeholder

  console.log('[Migration] Please run the migration script separately');
}
