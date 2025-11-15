'use client';

import { useState, useEffect, useCallback } from 'react';
import { deliveriesApi } from '@/lib/api';

export interface Delivery {
  id: number;
  school_id: number;
  catering_id: number;
  delivery_date: string;
  portions: number;
  amount: number;
  status: 'pending' | 'scheduled' | 'delivered' | 'verified' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  school_name?: string;
  school_npsn?: string;
  catering_name?: string;
}

interface UseDeliveriesOptions {
  status?: string;
  school_id?: number;
  catering_id?: number;
  autoFetch?: boolean;
}

export function useDeliveries(options: UseDeliveriesOptions = {}) {
  const { status, school_id, catering_id, autoFetch = true } = options;

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDeliveries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: Record<string, any> = {};
      if (status) params.status = status;
      if (school_id) params.school_id = school_id;
      if (catering_id) params.catering_id = catering_id;

      const response = await deliveriesApi.getAll(params);
      setDeliveries(response.deliveries || response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch deliveries');
      console.error('Error fetching deliveries:', err);
    } finally {
      setIsLoading(false);
    }
  }, [status, school_id, catering_id]);

  useEffect(() => {
    if (autoFetch) {
      fetchDeliveries();
    }
  }, [autoFetch, fetchDeliveries]);

  const updateDeliveryStatus = async (id: number, newStatus: string) => {
    try {
      await deliveriesApi.updateStatus(id, newStatus);
      // Update local state
      setDeliveries(prev =>
        prev.map(d => (d.id === id ? { ...d, status: newStatus as any } : d))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update delivery status');
      throw err;
    }
  };

  return {
    deliveries,
    isLoading,
    error,
    refetch: fetchDeliveries,
    updateDeliveryStatus,
  };
}

export default useDeliveries;
