'use client';

import { useState, useEffect, useCallback } from 'react';
import { deliveriesApi } from '@/lib/api';

// interface untuk item menu dalam pengiriman
export interface MenuItem {
  name: string;
  quantity: number;
  unit: string;
}

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
  // data relasi sekolah
  school_name?: string;
  school_npsn?: string;
  // data relasi katering
  catering_name?: string;
  catering_contact?: string;
  catering_address?: string;
  // data menu items
  menu_items?: MenuItem[];
  menu_items_string?: string;
  // data verifikasi
  verifier_name?: string;
  verified_at?: string;
  // data blockchain dan escrow
  blockchain_tx_id?: string;
  blockchain_explorer_url?: string;
  escrow_status?: 'locked' | 'released' | 'disputed';
}

interface UseDeliveriesOptions {
  status?: string;
  school_id?: number;
  catering_id?: number;
  date_from?: string;
  date_to?: string;
  autoFetch?: boolean;
}

export function useDeliveries(options: UseDeliveriesOptions = {}) {
  const { status, school_id, catering_id, date_from, date_to, autoFetch = true } = options;

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
      if (date_from) params.date_from = date_from;
      if (date_to) params.date_to = date_to;

      const response = await deliveriesApi.getAll(params);
      setDeliveries(response.deliveries || response.data || []);
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil data pengiriman');
      console.error('Error fetching deliveries:', err);
    } finally {
      setIsLoading(false);
    }
  }, [status, school_id, catering_id, date_from, date_to]);

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
