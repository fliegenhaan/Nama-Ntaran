'use client';

import { useState, useEffect, useCallback } from 'react';
import { issuesApi } from '@/lib/api';

export interface Issue {
  id: number;
  delivery_id: number;
  reported_by: number;
  issue_type: 'late_delivery' | 'wrong_portions' | 'quality_issue' | 'missing_delivery' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  resolution_notes?: string;
  resolved_by?: number;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

interface UseIssuesOptions {
  status?: string;
  delivery_id?: number;
  autoFetch?: boolean;
}

export function useIssues(options: UseIssuesOptions = {}) {
  const { status, delivery_id, autoFetch = true } = options;

  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIssues = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: Record<string, any> = {};
      if (status) params.status = status;
      if (delivery_id) params.delivery_id = delivery_id;

      const response = await issuesApi.getAll(params);
      setIssues(response.issues || response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch issues');
      console.error('Error fetching issues:', err);
    } finally {
      setIsLoading(false);
    }
  }, [status, delivery_id]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await issuesApi.getStats();
      setStats(response.stats || response.data);
    } catch (err: any) {
      console.error('Error fetching issue stats:', err);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchIssues();
      fetchStats();
    }
  }, [autoFetch, fetchIssues, fetchStats]);

  const createIssue = async (data: FormData | {
    delivery_id: number;
    issue_type: Issue['issue_type'];
    description: string;
    severity?: Issue['severity'];
  }) => {
    try {
      const response = await issuesApi.create(data);
      // Refresh list after creation
      await fetchIssues();
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to create issue');
      throw err;
    }
  };

  const updateIssueStatus = async (
    id: number,
    newStatus: Issue['status'],
    resolutionNotes?: string
  ) => {
    try {
      await issuesApi.updateStatus(id, newStatus, resolutionNotes);
      // Update local state
      setIssues(prev =>
        prev.map(issue =>
          issue.id === id
            ? { ...issue, status: newStatus, resolution_notes: resolutionNotes }
            : issue
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update issue status');
      throw err;
    }
  };

  return {
    issues,
    stats,
    isLoading,
    error,
    refetch: fetchIssues,
    createIssue,
    updateIssueStatus,
  };
}

export default useIssues;
