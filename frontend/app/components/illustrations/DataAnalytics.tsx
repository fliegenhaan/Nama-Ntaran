export default function DataAnalyticsIllustration() {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      {/* Background Screen */}
      <rect x="50" y="50" width="300" height="200" rx="10" fill="#1e293b" opacity="0.8" />

      {/* Chart Bars */}
      <g id="bar-chart">
        <rect x="80" y="180" width="30" height="50" fill="#667eea" />
        <rect x="130" y="150" width="30" height="80" fill="#4facfe" />
        <rect x="180" y="120" width="30" height="110" fill="#764ba2" />
        <rect x="230" y="140" width="30" height="90" fill="#fbbf24" />
        <rect x="280" y="100" width="30" height="130" fill="#22c55e" />
      </g>

      {/* Trend Line */}
      <polyline
        points="95,195 145,165 195,135 245,155 295,115"
        stroke="#ef4444"
        strokeWidth="3"
        fill="none"
        opacity="0.8"
      />

      {/* Data Points */}
      <circle cx="95" cy="195" r="5" fill="#ef4444" />
      <circle cx="145" cy="165" r="5" fill="#ef4444" />
      <circle cx="195" cy="135" r="5" fill="#ef4444" />
      <circle cx="245" cy="155" r="5" fill="#ef4444" />
      <circle cx="295" cy="115" r="5" fill="#ef4444" />

      {/* AI Brain Icon */}
      <g id="ai-brain">
        <circle cx="340" cy="80" r="25" fill="#667eea" opacity="0.3" />
        <circle cx="340" cy="80" r="18" fill="#667eea" />

        {/* Neural network lines */}
        <line x1="330" y1="70" x2="335" y2="75" stroke="#ffffff" strokeWidth="1.5" />
        <line x1="350" y1="70" x2="345" y2="75" stroke="#ffffff" strokeWidth="1.5" />
        <line x1="330" y1="90" x2="335" y2="85" stroke="#ffffff" strokeWidth="1.5" />
        <line x1="350" y1="90" x2="345" y2="85" stroke="#ffffff" strokeWidth="1.5" />

        <circle cx="330" cy="70" r="2" fill="#ffffff" />
        <circle cx="350" cy="70" r="2" fill="#ffffff" />
        <circle cx="340" cy="80" r="2" fill="#ffffff" />
        <circle cx="330" cy="90" r="2" fill="#ffffff" />
        <circle cx="350" cy="90" r="2" fill="#ffffff" />
      </g>

      {/* Labels */}
      <text x="95" y="245" textAnchor="middle" fill="#667eea" fontSize="10">Jan</text>
      <text x="145" y="245" textAnchor="middle" fill="#4facfe" fontSize="10">Feb</text>
      <text x="195" y="245" textAnchor="middle" fill="#764ba2" fontSize="10">Mar</text>
      <text x="245" y="245" textAnchor="middle" fill="#fbbf24" fontSize="10">Apr</text>
      <text x="295" y="245" textAnchor="middle" fill="#22c55e" fontSize="10">Mei</text>

      {/* AI Label */}
      <text x="340" y="120" textAnchor="middle" fill="#667eea" fontSize="11" fontWeight="bold">
        AI Analytics
      </text>
    </svg>
  );
}
