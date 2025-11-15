'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import ModernSidebar from '../../components/layout/ModernSidebar';
import PageHeader from '../../components/layout/PageHeader';
import GlassPanel from '../../components/ui/GlassPanel';
import {
  LayoutDashboard,
  Users,
  Lock,
  AlertTriangle,
  Eye,
  TrendingDown,
  ShieldAlert,
  UserX,
  Clock,
  Loader2,
  Info,
} from 'lucide-react';
import api from '../../lib/api';

interface Anomaly {
  type: 'collusion' | 'fake_verification' | 'budget_overrun' | 'quality_drop' | 'late_delivery_pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  suspiciousPatterns: string[];
  involvedParties: {
    schoolId?: number;
    schoolName?: string;
    cateringId?: number;
    cateringName?: string;
  };
  confidenceScore: number;
  recommendation: 'investigate' | 'block' | 'monitor' | 'alert_admin';
  detectedAt: Date;
  dataPoints: any;
}

export default function AnomalyDetectionPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');

  // Fetch anomalies
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    fetchAnomalies();
  }, [user]);

  const fetchAnomalies = async () => {
    setIsLoading(true);
    try {
      const [anomaliesResponse, summaryResponse] = await Promise.all([
        api.get('/ai-analytics/anomalies'),
        api.get('/ai-analytics/summary'),
      ]);

      setAnomalies(anomaliesResponse.data.anomalies || []);
      setSummary(summaryResponse.data.summary);
    } catch (error: any) {
      console.error('Fetch anomalies error:', error);
      alert(error.response?.data?.error || 'Failed to load anomalies');
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!authLoading && isAuthenticated && user?.role !== 'admin') {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'collusion': return <UserX className="w-5 h-5" />;
      case 'fake_verification': return <ShieldAlert className="w-5 h-5" />;
      case 'late_delivery_pattern': return <Clock className="w-5 h-5" />;
      case 'quality_drop': return <TrendingDown className="w-5 h-5" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };

  // Filter anomalies
  const filteredAnomalies = selectedType === 'all'
    ? anomalies
    : anomalies.filter(a => a.type === selectedType);

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Manual Review', path: '/admin/manual-review', icon: Eye },
    { label: 'Anomaly Detection', path: '/admin/anomalies', icon: AlertTriangle, badge: anomalies.length },
    { label: 'Budget Optimization', path: '/admin/budget', icon: Lock },
    { label: 'Accounts', path: '/admin/accounts', icon: Users },
  ];

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center mesh-gradient">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-white">Analyzing patterns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen mesh-gradient">
      <ModernSidebar items={navItems} />

      <div className="flex-1 ml-64">
        <PageHeader
          title="Anomaly Detection"
          subtitle="AI-powered fraud detection and suspicious activity monitoring"
        />

        <div className="p-8">
          {/* Stats */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <GlassPanel className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 mb-1">Total Anomalies</p>
                    <p className="text-3xl font-bold text-white">{summary.totalAnomalies}</p>
                  </div>
                  <AlertTriangle className="w-12 h-12 text-blue-400" />
                </div>
              </GlassPanel>

              <GlassPanel className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 mb-1">Critical</p>
                    <p className="text-3xl font-bold text-red-400">{summary.criticalAnomalies}</p>
                  </div>
                  <ShieldAlert className="w-12 h-12 text-red-400" />
                </div>
              </GlassPanel>

              <GlassPanel className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 mb-1">Collusion</p>
                    <p className="text-3xl font-bold text-orange-400">{summary.anomalyTypes.collusion}</p>
                  </div>
                  <UserX className="w-12 h-12 text-orange-400" />
                </div>
              </GlassPanel>

              <GlassPanel className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 mb-1">Late Deliveries</p>
                    <p className="text-3xl font-bold text-yellow-400">{summary.anomalyTypes.lateDelivery}</p>
                  </div>
                  <Clock className="w-12 h-12 text-yellow-400" />
                </div>
              </GlassPanel>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                selectedType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              All ({anomalies.length})
            </button>
            <button
              onClick={() => setSelectedType('collusion')}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                selectedType === 'collusion'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Collusion ({anomalies.filter(a => a.type === 'collusion').length})
            </button>
            <button
              onClick={() => setSelectedType('fake_verification')}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                selectedType === 'fake_verification'
                  ? 'bg-red-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Fake Verification ({anomalies.filter(a => a.type === 'fake_verification').length})
            </button>
            <button
              onClick={() => setSelectedType('late_delivery_pattern')}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                selectedType === 'late_delivery_pattern'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Late Delivery ({anomalies.filter(a => a.type === 'late_delivery_pattern').length})
            </button>
          </div>

          {/* Anomalies List */}
          {filteredAnomalies.length === 0 ? (
            <GlassPanel className="p-12 text-center">
              <Info className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">No Anomalies Detected</h3>
              <p className="text-gray-300">
                {selectedType === 'all'
                  ? 'No suspicious activities found in the system.'
                  : `No anomalies of type "${selectedType}" detected.`}
              </p>
            </GlassPanel>
          ) : (
            <div className="space-y-6">
              {filteredAnomalies.map((anomaly, index) => (
                <GlassPanel
                  key={index}
                  className={`p-6 border ${getSeverityColor(anomaly.severity).split(' ').pop()}`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(anomaly.type)}
                      <div>
                        <h3 className="text-xl font-bold text-white">{anomaly.title}</h3>
                        <p className="text-gray-300 text-sm mt-1">{anomaly.description}</p>
                      </div>
                    </div>

                    <div className={`px-4 py-2 rounded-full font-semibold text-sm border ${getSeverityColor(anomaly.severity)}`}>
                      {anomaly.severity.toUpperCase()}
                    </div>
                  </div>

                  {/* Involved Parties */}
                  {(anomaly.involvedParties.schoolName || anomaly.involvedParties.cateringName) && (
                    <div className="mb-4 p-4 bg-white/5 rounded-lg">
                      <p className="text-gray-400 text-sm mb-2">Involved Parties:</p>
                      <div className="flex gap-6">
                        {anomaly.involvedParties.schoolName && (
                          <div>
                            <p className="text-white font-semibold">{anomaly.involvedParties.schoolName}</p>
                            <p className="text-gray-400 text-sm">School</p>
                          </div>
                        )}
                        {anomaly.involvedParties.cateringName && (
                          <div>
                            <p className="text-white font-semibold">{anomaly.involvedParties.cateringName}</p>
                            <p className="text-gray-400 text-sm">Catering</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Suspicious Patterns */}
                  {anomaly.suspiciousPatterns && anomaly.suspiciousPatterns.length > 0 && (
                    <div className="mb-4">
                      <p className="text-gray-400 text-sm mb-2">Suspicious Patterns:</p>
                      <ul className="space-y-1">
                        {anomaly.suspiciousPatterns.map((pattern, i) => (
                          <li key={i} className="flex items-start gap-2 text-yellow-300">
                            <span className="text-yellow-400 mt-1">•</span>
                            <span>{pattern}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-gray-400 text-sm">Confidence</p>
                        <p className="text-white font-semibold">{(anomaly.confidenceScore * 100).toFixed(0)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Detected</p>
                        <p className="text-white font-semibold">
                          {new Date(anomaly.detectedAt).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">Recommendation:</span>
                      <span className={`font-semibold ${
                        anomaly.recommendation === 'block' ? 'text-red-400' :
                        anomaly.recommendation === 'investigate' ? 'text-orange-400' :
                        anomaly.recommendation === 'alert_admin' ? 'text-yellow-400' :
                        'text-blue-400'
                      }`}>
                        {anomaly.recommendation.toUpperCase().replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </GlassPanel>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
