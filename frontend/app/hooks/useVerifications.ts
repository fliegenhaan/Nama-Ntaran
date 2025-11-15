'use client';

import { useState, useEffect, useCallback } from 'react';
import { verificationsApi } from '@/lib/api';

export interface Verification {
  id: number;
  delivery_id: number;
  school_id: number;
  verified_by: number;
  status: 'pending' | 'approved' | 'rejected';
  portions_received?: number;
  quality_rating?: number;
  notes?: string;
  photo_url?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

interface UseVerificationsOptions {
  status?: string;
  school_id?: number;
  delivery_id?: number;
  autoFetch?: boolean;
}

export function useVerifications(options: UseVerificationsOptions = {}) {
  const { status, school_id, delivery_id, autoFetch = true } = options;

  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVerifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: Record<string, any> = {};
      if (status) params.status = status;
      if (school_id) params.school_id = school_id;
      if (delivery_id) params.delivery_id = delivery_id;

      const response = await verificationsApi.getAll(params);
      setVerifications(response.verifications || response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch verifications');
      console.error('Error fetching verifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [status, school_id, delivery_id]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await verificationsApi.getStats();
      setStats(response.stats || response.data);
    } catch (err: any) {
      console.error('Error fetching verification stats:', err);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchVerifications();
      fetchStats();
    }
  }, [autoFetch, fetchVerifications, fetchStats]);

  const createVerification = async (data: {
    delivery_id: number;
    status: 'approved' | 'rejected';
    portions_received: number;
    quality_rating?: number;
    notes?: string;
    photo_url?: string;
  }) => {
    try {
      const response = await verificationsApi.create(data);
      // Refresh list after creation
      await fetchVerifications();
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to create verification');
      throw err;
    }
  };

  return {
    verifications,
    stats,
    isLoading,
    error,
    refetch: fetchVerifications,
    createVerification,
  };
}

export default useVerifications;
