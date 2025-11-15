'use client';

import { CheckCircle, AlertTriangle, Info, TrendingUp, Eye, Sparkles } from 'lucide-react';
import GlassPanel from '../ui/GlassPanel';

interface AIQualityScoresProps {
  aiAnalysis: {
    qualityScore: number;
    freshnessScore: number;
    presentationScore: number;
    hygieneScore: number;
    detectedItems: string[];
    portionEstimate: number;
    compliance: {
      menuMatch: boolean;
      portionMatch: boolean;
      qualityAcceptable: boolean;
      meetsBGNStandards: boolean;
    };
    confidence: number;
    needsManualReview: boolean;
    issues: string[];
    warnings: string[];
    recommendations: string[];
    reasoning: string;
  };
}

export default function AIQualityScores({ aiAnalysis }: AIQualityScoresProps) {
  // Score color helper
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/20';
    if (score >= 60) return 'bg-yellow-500/20';
    return 'bg-red-500/20';
  };

  // Progress ring component
  const ScoreRing = ({ score, label }: { score: number; label: string }) => {
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24">
          {/* Background circle */}
          <svg className="transform -rotate-90 w-24 h-24">
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="6"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`${getScoreColor(score)} transition-all duration-500`}
              strokeLinecap="round"
            />
          </svg>
          {/* Score text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xl font-bold ${getScoreColor(score)}`}>
              {score}
            </span>
          </div>
        </div>
        <span className="text-sm text-gray-300 mt-2 text-center">{label}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with AI Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-500/30">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span className="text-white font-semibold">AI Quality Analysis</span>
        </div>

        {aiAnalysis.needsManualReview && (
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 rounded-full border border-yellow-500/30">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-300 font-medium">Needs Review</span>
          </div>
        )}

        {aiAnalysis.compliance.meetsBGNStandards && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full border border-green-500/30">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-300 font-medium">Meets Standards</span>
          </div>
        )}
      </div>

      {/* Overall Quality Score */}
      <GlassPanel className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            Overall Quality Score
          </h3>
          <div className={`text-4xl font-bold ${getScoreColor(aiAnalysis.qualityScore)}`}>
            {aiAnalysis.qualityScore}/100
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${getScoreBg(aiAnalysis.qualityScore)}`}
            style={{ width: `${aiAnalysis.qualityScore}%` }}
          >
            <div className={`h-full ${getScoreColor(aiAnalysis.qualityScore).replace('text-', 'bg-')}`} />
          </div>
        </div>

        <p className="text-gray-300 mt-4">
          <span className="font-semibold">Confidence:</span> {(aiAnalysis.confidence * 100).toFixed(0)}%
        </p>
      </GlassPanel>

      {/* Detailed Scores */}
      <GlassPanel className="p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Eye className="w-6 h-6 text-purple-400" />
          Detailed Analysis
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <ScoreRing score={aiAnalysis.freshnessScore} label="Freshness" />
          <ScoreRing score={aiAnalysis.presentationScore} label="Presentation" />
          <ScoreRing score={aiAnalysis.hygieneScore} label="Hygiene" />
          <ScoreRing score={aiAnalysis.qualityScore} label="Overall" />
        </div>
      </GlassPanel>

      {/* Detected Items */}
      {aiAnalysis.detectedItems && aiAnalysis.detectedItems.length > 0 && (
        <GlassPanel className="p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Detected Items</h4>
          <div className="flex flex-wrap gap-2">
            {aiAnalysis.detectedItems.map((item: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm border border-blue-500/30"
              >
                {item}
              </span>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 text-gray-300">
            <Package className="w-5 h-5" />
            <span>Estimated Portions: <span className="font-semibold text-white">{aiAnalysis.portionEstimate}</span></span>
          </div>
        </GlassPanel>
      )}

      {/* Compliance Checks */}
      <GlassPanel className="p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Compliance Checks</h4>
        <div className="space-y-3">
          <ComplianceItem
            label="Menu Match"
            passed={aiAnalysis.compliance.menuMatch}
          />
          <ComplianceItem
            label="Portion Match"
            passed={aiAnalysis.compliance.portionMatch}
          />
          <ComplianceItem
            label="Quality Acceptable"
            passed={aiAnalysis.compliance.qualityAcceptable}
          />
          <ComplianceItem
            label="Meets BGN Standards"
            passed={aiAnalysis.compliance.meetsBGNStandards}
          />
        </div>
      </GlassPanel>

      {/* Issues & Warnings */}
      {(aiAnalysis.issues?.length > 0 || aiAnalysis.warnings?.length > 0) && (
        <div className="space-y-4">
          {aiAnalysis.issues && aiAnalysis.issues.length > 0 && (
            <GlassPanel className="p-6 border-red-500/30">
              <h4 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Issues Detected
              </h4>
              <ul className="space-y-2">
                {aiAnalysis.issues.map((issue: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-red-300">
                    <span className="text-red-400 mt-1">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </GlassPanel>
          )}

          {aiAnalysis.warnings && aiAnalysis.warnings.length > 0 && (
            <GlassPanel className="p-6 border-yellow-500/30">
              <h4 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Warnings
              </h4>
              <ul className="space-y-2">
                {aiAnalysis.warnings.map((warning: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-yellow-300">
                    <span className="text-yellow-400 mt-1">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </GlassPanel>
          )}
        </div>
      )}

      {/* Recommendations */}
      {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
        <GlassPanel className="p-6 border-green-500/30">
          <h4 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Recommendations
          </h4>
          <ul className="space-y-2">
            {aiAnalysis.recommendations.map((rec: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-green-300">
                <span className="text-green-400 mt-1">→</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </GlassPanel>
      )}

      {/* AI Reasoning */}
      {aiAnalysis.reasoning && (
        <GlassPanel className="p-6 border-purple-500/30">
          <h4 className="text-lg font-semibold text-purple-400 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Reasoning
          </h4>
          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
            {aiAnalysis.reasoning}
          </p>
        </GlassPanel>
      )}
    </div>
  );
}

// Helper Component
function ComplianceItem({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
      <span className="text-gray-300">{label}</span>
      {passed ? (
        <div className="flex items-center gap-2 text-green-400">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold">Pass</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-semibold">Fail</span>
        </div>
      )}
    </div>
  );
}
