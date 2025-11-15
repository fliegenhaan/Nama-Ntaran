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
  TrendingUp,
  DollarSign,
  Sparkles,
  Loader2,
  Download,
  MapPin,
} from 'lucide-react';
import api from '../../lib/api';

interface BudgetRecommendation {
  province: string;
  currentAllocation: number;
  recommendedAllocation: number;
  reasoning: string;
  expectedImpact: {
    additionalStudents: number;
    stuntingReductionPercent: number;
    efficiencyGain: number;
  };
  confidence: number;
}

export default function BudgetOptimizationPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const [totalBudget, setTotalBudget] = useState<string>('');
  const [recommendations, setRecommendations] = useState<BudgetRecommendation[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [hasOptimized, setHasOptimized] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!authLoading && isAuthenticated && user?.role !== 'admin') {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Handle optimization
  const handleOptimize = async () => {
    const budgetValue = parseFloat(totalBudget.replace(/,/g, ''));

    if (isNaN(budgetValue) || budgetValue <= 0) {
      alert('Please enter a valid budget amount');
      return;
    }

    setIsOptimizing(true);
    try {
      const response = await api.post('/ai-analytics/optimize-budget', {
        totalBudget: budgetValue,
      });

      setRecommendations(response.data.recommendations || []);
      setHasOptimized(true);
    } catch (error: any) {
      console.error('Optimization error:', error);
      alert(error.response?.data?.error || 'Failed to optimize budget');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (recommendations.length === 0) return;

    const headers = ['Province', 'Current Allocation', 'Recommended Allocation', 'Change', 'Additional Students', 'Stunting Reduction %', 'Efficiency Gain', 'Confidence', 'Reasoning'];
    const rows = recommendations.map(rec => [
      rec.province,
      rec.currentAllocation,
      rec.recommendedAllocation,
      rec.recommendedAllocation - rec.currentAllocation,
      rec.expectedImpact.additionalStudents,
      rec.expectedImpact.stuntingReductionPercent.toFixed(2),
      rec.expectedImpact.efficiencyGain.toFixed(2),
      (rec.confidence * 100).toFixed(0) + '%',
      `"${rec.reasoning}"`,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-optimization-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Manual Review', path: '/admin/manual-review', icon: Eye },
    { label: 'Anomaly Detection', path: '/admin/anomalies', icon: AlertTriangle },
    { label: 'Budget Optimization', path: '/admin/budget', icon: Lock },
    { label: 'Accounts', path: '/admin/accounts', icon: Users },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center mesh-gradient">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen mesh-gradient">
      <ModernSidebar items={navItems} />

      <div className="flex-1 ml-64">
        <PageHeader
          title="AI Budget Optimization"
          subtitle="Optimize budget allocation across provinces using AI-powered analysis"
        />

        <div className="p-8">
          {/* Input Section */}
          <GlassPanel className="p-8 mb-8 border-purple-500/30">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-8 h-8 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Input Total Budget</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-gray-300 mb-3 font-semibold">
                  Total Budget Available (IDR)
                </label>
                <input
                  type="text"
                  value={totalBudget}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setTotalBudget(value ? parseInt(value).toLocaleString('id-ID') : '');
                  }}
                  placeholder="e.g., 10,000,000,000"
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-lg text-white text-2xl font-bold placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <p className="text-gray-400 mt-2 text-sm">
                  Enter the total budget you want to allocate across all provinces
                </p>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleOptimize}
                  disabled={isOptimizing || !totalBudget}
                  className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isOptimizing ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6" />
                      Optimize with AI
                    </>
                  )}
                </button>
              </div>
            </div>

            {totalBudget && (
              <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <p className="text-blue-300 text-sm">Total Budget to Optimize:</p>
                <p className="text-white text-3xl font-bold mt-1">
                  {formatCurrency(parseFloat(totalBudget.replace(/,/g, '')))}
                </p>
              </div>
            )}
          </GlassPanel>

          {/* Results Section */}
          {hasOptimized && recommendations.length > 0 && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <GlassPanel className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 mb-1">Provinces</p>
                      <p className="text-3xl font-bold text-white">{recommendations.length}</p>
                    </div>
                    <MapPin className="w-12 h-12 text-blue-400" />
                  </div>
                </GlassPanel>

                <GlassPanel className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 mb-1">Total Students</p>
                      <p className="text-3xl font-bold text-green-400">
                        +{recommendations.reduce((sum, rec) => sum + rec.expectedImpact.additionalStudents, 0).toLocaleString()}
                      </p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-green-400" />
                  </div>
                </GlassPanel>

                <GlassPanel className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 mb-1">Avg Stunting Reduction</p>
                      <p className="text-3xl font-bold text-purple-400">
                        {(recommendations.reduce((sum, rec) => sum + rec.expectedImpact.stuntingReductionPercent, 0) / recommendations.length).toFixed(1)}%
                      </p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-purple-400" />
                  </div>
                </GlassPanel>

                <GlassPanel className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 mb-1">Avg Efficiency</p>
                      <p className="text-3xl font-bold text-yellow-400">
                        {(recommendations.reduce((sum, rec) => sum + rec.expectedImpact.efficiencyGain, 0) / recommendations.length).toFixed(2)}x
                      </p>
                    </div>
                    <Sparkles className="w-12 h-12 text-yellow-400" />
                  </div>
                </GlassPanel>
              </div>

              {/* Export Button */}
              <div className="flex justify-end mb-6">
                <button
                  onClick={exportToCSV}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Export to CSV
                </button>
              </div>

              {/* Recommendations Table */}
              <GlassPanel className="p-6">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <DollarSign className="w-7 h-7 text-green-400" />
                  Budget Allocation Recommendations
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left text-gray-300 font-semibold pb-4 px-4">Province</th>
                        <th className="text-right text-gray-300 font-semibold pb-4 px-4">Current</th>
                        <th className="text-right text-gray-300 font-semibold pb-4 px-4">Recommended</th>
                        <th className="text-right text-gray-300 font-semibold pb-4 px-4">Change</th>
                        <th className="text-right text-gray-300 font-semibold pb-4 px-4">Students</th>
                        <th className="text-right text-gray-300 font-semibold pb-4 px-4">Stunting ↓</th>
                        <th className="text-center text-gray-300 font-semibold pb-4 px-4">Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recommendations.map((rec, index) => {
                        const change = rec.recommendedAllocation - rec.currentAllocation;
                        const changePercent = rec.currentAllocation > 0
                          ? ((change / rec.currentAllocation) * 100).toFixed(1)
                          : 'N/A';

                        return (
                          <tr key={index} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-blue-400" />
                                <span className="text-white font-semibold">{rec.province}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right text-gray-300">
                              {formatCurrency(rec.currentAllocation)}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <span className="text-white font-bold">
                                {formatCurrency(rec.recommendedAllocation)}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <span className={`font-semibold ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {change >= 0 ? '+' : ''}{formatCurrency(change)}
                                {changePercent !== 'N/A' && (
                                  <span className="text-sm ml-1">({changePercent}%)</span>
                                )}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right text-green-400 font-semibold">
                              +{rec.expectedImpact.additionalStudents.toLocaleString()}
                            </td>
                            <td className="py-4 px-4 text-right text-purple-400 font-semibold">
                              {rec.expectedImpact.stuntingReductionPercent.toFixed(1)}%
                            </td>
                            <td className="py-4 px-4 text-center">
                              <div className="inline-block">
                                <div className="w-16 h-16 relative">
                                  <svg className="transform -rotate-90 w-16 h-16">
                                    <circle
                                      cx="32"
                                      cy="32"
                                      r="28"
                                      stroke="rgba(255,255,255,0.1)"
                                      strokeWidth="4"
                                      fill="none"
                                    />
                                    <circle
                                      cx="32"
                                      cy="32"
                                      r="28"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                      fill="none"
                                      strokeDasharray={2 * Math.PI * 28}
                                      strokeDashoffset={2 * Math.PI * 28 * (1 - rec.confidence)}
                                      className="text-blue-400"
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-sm font-bold text-white">
                                      {(rec.confidence * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Detailed Reasoning */}
                <div className="mt-8 space-y-4">
                  <h4 className="text-xl font-bold text-white mb-4">AI Reasoning</h4>
                  {recommendations.map((rec, index) => (
                    <details key={index} className="group">
                      <summary className="cursor-pointer p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                        <span className="text-white font-semibold">{rec.province}</span>
                      </summary>
                      <div className="mt-2 p-4 bg-black/20 rounded-lg border border-white/10">
                        <p className="text-gray-300 leading-relaxed">{rec.reasoning}</p>
                        <div className="mt-4 grid grid-cols-3 gap-4">
                          <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                            <p className="text-green-400 text-sm mb-1">Additional Students</p>
                            <p className="text-white font-bold text-xl">
                              +{rec.expectedImpact.additionalStudents.toLocaleString()}
                            </p>
                          </div>
                          <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                            <p className="text-purple-400 text-sm mb-1">Stunting Reduction</p>
                            <p className="text-white font-bold text-xl">
                              {rec.expectedImpact.stuntingReductionPercent.toFixed(1)}%
                            </p>
                          </div>
                          <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                            <p className="text-yellow-400 text-sm mb-1">Efficiency Gain</p>
                            <p className="text-white font-bold text-xl">
                              {rec.expectedImpact.efficiencyGain.toFixed(2)}x
                            </p>
                          </div>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </GlassPanel>
            </>
          )}

          {/* Empty State */}
          {!hasOptimized && (
            <GlassPanel className="p-12 text-center">
              <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">AI-Powered Budget Optimization</h3>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Enter your total budget above and let our AI analyze provincial data (poverty rates, stunting statistics, school density) to recommend optimal allocation for maximum impact on child nutrition and stunting reduction.
              </p>
            </GlassPanel>
          )}
        </div>
      </div>
    </div>
  );
}
